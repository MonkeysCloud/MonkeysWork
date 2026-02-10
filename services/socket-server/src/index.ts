/**
 * MonkeysWork Socket.IO Server
 *
 * Real-time communication bridge between PHP API and Next.js frontend.
 * PHP publishes events via Redis Pub/Sub → this server relays to clients.
 */

import { createServer } from "node:http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { authMiddleware, type AuthenticatedSocket } from "./auth.js";
import { createRedisSubscriber } from "./redis-subscriber.js";
import { NAMESPACES, EVENTS } from "./events.js";

// ── Configuration ──

const PORT = parseInt(process.env.PORT || "3001", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
const NODE_ENV = process.env.NODE_ENV || "development";

console.log(`[server] Starting Socket.IO server...`);
console.log(`[server] PORT=${PORT} REDIS=${REDIS_URL} CORS=${CORS_ORIGIN}`);

// ── HTTP Server ──

const httpServer = createServer((req, res) => {
    // Health check endpoint
    if (req.url === "/healthz" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
        return;
    }

    res.writeHead(404);
    res.end();
});

// ── Socket.IO Server ──

const io = new Server(httpServer, {
    cors: {
        origin: CORS_ORIGIN.split(","),
        methods: ["GET", "POST"],
        credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    transports: ["websocket", "polling"],
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true,
    },
});

// ── Redis Adapter (for horizontal scaling) ──

async function setupRedisAdapter(): Promise<void> {
    const pubClient = new Redis(REDIS_URL, {
        retryStrategy: (times: number) => Math.min(times * 200, 5000),
        maxRetriesPerRequest: null,
        lazyConnect: true,
    });

    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
    console.log("[server] Redis adapter connected");
}

// ── Namespace: Notifications ──

const notificationsNsp = io.of(NAMESPACES.NOTIFICATIONS);
notificationsNsp.use(authMiddleware);

notificationsNsp.on("connection", (socket) => {
    const s = socket as AuthenticatedSocket;
    console.log(`[notifications] User ${s.data.userId} connected`);

    // Mark notification as read (client → server → PHP could process)
    s.on(EVENTS.NOTIFICATION_READ, (data: { notification_id: string }) => {
        console.log(`[notifications] User ${s.data.userId} read ${data.notification_id}`);
    });

    s.on("disconnect", () => {
        console.log(`[notifications] User ${s.data.userId} disconnected`);
    });
});

// ── Namespace: Messages ──

const messagesNsp = io.of(NAMESPACES.MESSAGES);
messagesNsp.use(authMiddleware);

messagesNsp.on("connection", (socket) => {
    const s = socket as AuthenticatedSocket;
    console.log(`[messages] User ${s.data.userId} connected`);

    // Join a conversation room
    s.on("join:conversation", (data: { conversation_id: string }) => {
        s.join(`conversation:${data.conversation_id}`);
        console.log(`[messages] User ${s.data.userId} joined conversation:${data.conversation_id}`);
    });

    // Leave a conversation room
    s.on("leave:conversation", (data: { conversation_id: string }) => {
        s.leave(`conversation:${data.conversation_id}`);
        console.log(`[messages] User ${s.data.userId} left conversation:${data.conversation_id}`);
    });

    // Typing indicators (client → client, no persistence)
    s.on(EVENTS.TYPING_START, (data: { conversation_id: string }) => {
        s.to(`conversation:${data.conversation_id}`).emit(EVENTS.TYPING_START, {
            conversation_id: data.conversation_id,
            user_id: s.data.userId,
        });
    });

    s.on(EVENTS.TYPING_STOP, (data: { conversation_id: string }) => {
        s.to(`conversation:${data.conversation_id}`).emit(EVENTS.TYPING_STOP, {
            conversation_id: data.conversation_id,
            user_id: s.data.userId,
        });
    });

    s.on("disconnect", () => {
        console.log(`[messages] User ${s.data.userId} disconnected`);
    });
});

// ── Namespace: Contracts ──

const contractsNsp = io.of(NAMESPACES.CONTRACTS);
contractsNsp.use(authMiddleware);

contractsNsp.on("connection", (socket) => {
    const s = socket as AuthenticatedSocket;
    console.log(`[contracts] User ${s.data.userId} connected`);

    // Join a contract room for live updates
    s.on("join:contract", (data: { contract_id: string }) => {
        s.join(`contract:${data.contract_id}`);
        console.log(`[contracts] User ${s.data.userId} joined contract:${data.contract_id}`);
    });

    s.on("leave:contract", (data: { contract_id: string }) => {
        s.leave(`contract:${data.contract_id}`);
    });

    s.on("disconnect", () => {
        console.log(`[contracts] User ${s.data.userId} disconnected`);
    });
});

// ── Startup ──

async function start(): Promise<void> {
    try {
        // Setup Redis adapter for multi-pod scaling
        await setupRedisAdapter();

        // Setup Redis subscriber for PHP → Socket.IO bridge
        const subscriber = createRedisSubscriber(io, REDIS_URL);
        await subscriber.connect();

        // Start HTTP server
        httpServer.listen(PORT, "0.0.0.0", () => {
            console.log(`[server] Socket.IO server listening on port ${PORT}`);
            console.log(`[server] Environment: ${NODE_ENV}`);
            console.log(`[server] Namespaces: ${Object.values(NAMESPACES).join(", ")}`);
        });

        // Graceful shutdown
        const shutdown = async () => {
            console.log("[server] Shutting down...");
            io.close();
            await subscriber.quit();
            httpServer.close();
            process.exit(0);
        };

        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);
    } catch (err) {
        console.error("[server] Failed to start:", err);
        process.exit(1);
    }
}

start();
