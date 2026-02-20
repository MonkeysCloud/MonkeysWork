/**
 * Shared API client for the MonkeysWork API.
 * All requests go through this helper to ensure consistent auth headers.
 */

const API_BASE = "http://localhost:8086/api/v1";

let _token: string | null = null;

export function setAuthToken(token: string | null) {
    _token = token;
}

export function getApiBase(): string {
    return API_BASE;
}

/**
 * Type-safe fetch wrapper.
 * @param path   API path (e.g. "/auth/login")
 * @param init   Fetch options (method, body, etc.)
 */
export async function api<T = unknown>(
    path: string,
    init: RequestInit = {},
): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(init.headers as Record<string, string>),
    };

    if (_token) {
        headers["Authorization"] = `Bearer ${_token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers,
    });

    const body = await res.json();

    if (!res.ok) {
        const msg =
            res.status === 401
                ? "Invalid credentials or session expired."
                : res.status === 403
                    ? body.message || "Forbidden."
                    : body.message || `Request failed (${res.status})`;
        throw new Error(msg);
    }

    return body as T;
}

/**
 * Convenience helpers
 */
export const apiGet = <T = unknown>(path: string) =>
    api<T>(path, { method: "GET" });

export const apiPost = <T = unknown>(path: string, data?: unknown) =>
    api<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined });

export const apiPut = <T = unknown>(path: string, data?: unknown) =>
    api<T>(path, { method: "PUT", body: data ? JSON.stringify(data) : undefined });

export const apiDelete = <T = unknown>(path: string) =>
    api<T>(path, { method: "DELETE" });
