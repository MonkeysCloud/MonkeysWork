/**
 * Redis Subscriber — PHP → Socket.IO Bridge
 *
 * Subscribes to the `mw:events` Redis channel and relays
 * incoming events to the correct Socket.IO namespace/room.
 */

import Redis from "ioredis";
import type { Server } from "socket.io";
import { REDIS_CHANNEL, type RedisEventPayload } from "./events.js";

export function createRedisSubscriber(io: Server, redisUrl: string): Redis {
    const subscriber = new Redis(redisUrl, {
        retryStrategy: (times: number) => Math.min(times * 200, 5000),
        maxRetriesPerRequest: null,
        lazyConnect: true,
    });

    subscriber.on("connect", () => {
        console.log("[redis-sub] Connected to Redis");
    });

    subscriber.on("error", (err: Error) => {
        console.error("[redis-sub] Redis error:", err.message);
    });

    subscriber.on("reconnecting", () => {
        console.log("[redis-sub] Reconnecting to Redis...");
    });

    // Subscribe to the main events channel
    subscriber.subscribe(REDIS_CHANNEL, (err) => {
        if (err) {
            console.error(`[redis-sub] Failed to subscribe to ${REDIS_CHANNEL}:`, err);
        } else {
            console.log(`[redis-sub] Subscribed to channel: ${REDIS_CHANNEL}`);
        }
    });

    // Handle incoming messages from PHP
    subscriber.on("message", (channel: string, message: string) => {
        if (channel !== REDIS_CHANNEL) return;

        try {
            const payload: RedisEventPayload = JSON.parse(message);

            if (!payload.namespace || !payload.event || !payload.room) {
                console.warn("[redis-sub] Invalid payload, missing required fields:", message);
                return;
            }

            // Get the namespace server (or fallback to main)
            const nsp = io.of(payload.namespace);

            // Emit to the target room within the namespace
            nsp.to(payload.room).emit(payload.event, payload.data);

            console.log(
                `[redis-sub] Relayed ${payload.event} → ${payload.namespace}:${payload.room}`
            );
        } catch (err) {
            console.error("[redis-sub] Failed to parse message:", err);
        }
    });

    return subscriber;
}
