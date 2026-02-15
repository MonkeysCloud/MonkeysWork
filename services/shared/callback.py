"""
Shared callback client for AI microservices → PHP API internal endpoints.

Usage:
    from shared.callback import api_callback
    await api_callback.patch(f"/verifications/{vid}", {"status": "approved", ...})
"""

import os
import time
from typing import Any, Dict, Optional
import httpx
import structlog

logger = structlog.get_logger()

# PHP API internal base URL
API_BASE = os.getenv("INTERNAL_API_URL", "http://monkeyswork-api:8080/api/v1/internal")
INTERNAL_TOKEN = os.getenv("INTERNAL_API_TOKEN", "dev-internal-token")
TIMEOUT = float(os.getenv("CALLBACK_TIMEOUT", "10"))


class ApiCallback:
    """HTTP client for calling back to the PHP API internal endpoints."""

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=API_BASE,
                headers={
                    "Content-Type": "application/json",
                    "X-Internal-Token": INTERNAL_TOKEN,
                },
                timeout=TIMEOUT,
            )
        return self._client

    async def post(self, path: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """POST to an internal endpoint."""
        return await self._request("POST", path, data)

    async def patch(self, path: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """PATCH to an internal endpoint."""
        return await self._request("PATCH", path, data)

    async def put(self, path: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """PUT to an internal endpoint."""
        return await self._request("PUT", path, data)

    async def _request(
        self, method: str, path: str, data: Dict[str, Any], retries: int = 3
    ) -> Dict[str, Any]:
        """Make an HTTP request with retry logic."""
        last_error = None

        for attempt in range(1, retries + 1):
            try:
                start = time.monotonic()
                response = await self.client.request(method, path, json=data)
                elapsed_ms = int((time.monotonic() - start) * 1000)

                logger.info(
                    "api_callback",
                    method=method,
                    path=path,
                    status=response.status_code,
                    latency_ms=elapsed_ms,
                    attempt=attempt,
                )

                response.raise_for_status()
                return response.json()

            except httpx.HTTPStatusError as e:
                logger.warning(
                    "api_callback_http_error",
                    method=method,
                    path=path,
                    status=e.response.status_code,
                    body=e.response.text[:500],
                    attempt=attempt,
                )
                last_error = e
                # Don't retry 4xx — they won't succeed
                if 400 <= e.response.status_code < 500:
                    break

            except (httpx.ConnectError, httpx.TimeoutException) as e:
                logger.warning(
                    "api_callback_conn_error",
                    method=method,
                    path=path,
                    error=str(e),
                    attempt=attempt,
                )
                last_error = e

            # Exponential backoff
            if attempt < retries:
                await _async_sleep(0.5 * (2 ** (attempt - 1)))

        logger.error(
            "api_callback_failed",
            method=method,
            path=path,
            error=str(last_error),
        )
        return {"error": str(last_error)}

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()


async def _async_sleep(seconds: float) -> None:
    import asyncio
    await asyncio.sleep(seconds)


# Singleton instance
api_callback = ApiCallback()
