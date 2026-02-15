"""
Shared Pub/Sub helpers for AI microservices.

Usage:
    from shared.pubsub import create_subscriber, pull_messages

All services use the Pub/Sub emulator in dev (PUBSUB_EMULATOR_HOST env var).
"""

import os
import json
import asyncio
from typing import Callable, Awaitable, Optional
from google.cloud import pubsub_v1
from google.api_core.exceptions import AlreadyExists
import structlog

logger = structlog.get_logger()

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "monkeyswork")


def _get_publisher() -> pubsub_v1.PublisherClient:
    """Get a Pub/Sub publisher client (emulator-aware)."""
    return pubsub_v1.PublisherClient()


def _get_subscriber() -> pubsub_v1.SubscriberClient:
    """Get a Pub/Sub subscriber client (emulator-aware)."""
    return pubsub_v1.SubscriberClient()


def ensure_topic(topic_name: str) -> str:
    """Ensure a topic exists, return its full path."""
    publisher = _get_publisher()
    topic_path = publisher.topic_path(PROJECT_ID, topic_name)
    try:
        publisher.create_topic(request={"name": topic_path})
        logger.info("topic_created", topic=topic_name)
    except AlreadyExists:
        pass
    return topic_path


def ensure_subscription(topic_name: str, subscription_name: str) -> str:
    """Ensure a subscription exists for the given topic."""
    subscriber = _get_subscriber()
    topic_path = f"projects/{PROJECT_ID}/topics/{topic_name}"
    sub_path = subscriber.subscription_path(PROJECT_ID, subscription_name)
    try:
        subscriber.create_subscription(
            request={"name": sub_path, "topic": topic_path}
        )
        logger.info("subscription_created", subscription=subscription_name, topic=topic_name)
    except AlreadyExists:
        pass
    return sub_path


def publish_message(topic_name: str, data: dict, **attributes: str) -> None:
    """Publish a JSON message to a topic."""
    publisher = _get_publisher()
    topic_path = publisher.topic_path(PROJECT_ID, topic_name)
    message_bytes = json.dumps(data).encode("utf-8")
    future = publisher.publish(topic_path, message_bytes, **attributes)
    future.result(timeout=5)
    logger.info("message_published", topic=topic_name, data_keys=list(data.keys()))


async def subscribe_async(
    topic_name: str,
    subscription_name: str,
    handler: Callable[[dict], Awaitable[None]],
    *,
    max_messages: int = 10,
    poll_interval: float = 1.0,
) -> None:
    """
    Async polling subscriber — pulls messages in a loop.

    Args:
        topic_name: Topic to subscribe to
        subscription_name: Subscription name
        handler: Async function called with each decoded JSON message
        max_messages: Max messages per pull
        poll_interval: Seconds between pulls
    """
    ensure_topic(topic_name)
    sub_path = ensure_subscription(topic_name, subscription_name)
    subscriber = _get_subscriber()

    logger.info("subscriber_started", topic=topic_name, subscription=subscription_name)

    while True:
        try:
            response = subscriber.pull(
                request={"subscription": sub_path, "max_messages": max_messages},
                timeout=5,
            )

            ack_ids = []
            for msg in response.received_messages:
                try:
                    data = json.loads(msg.message.data.decode("utf-8"))
                    logger.info(
                        "message_received",
                        topic=topic_name,
                        event=data.get("event", "unknown"),
                    )
                    await handler(data)
                    ack_ids.append(msg.ack_id)
                except Exception:
                    logger.exception("message_handler_error", topic=topic_name)
                    # Still ack to avoid infinite retries; real system would nack + DLQ
                    ack_ids.append(msg.ack_id)

            if ack_ids:
                subscriber.acknowledge(
                    request={"subscription": sub_path, "ack_ids": ack_ids}
                )

        except Exception:
            logger.exception("pull_error", topic=topic_name)

        await asyncio.sleep(poll_interval)
