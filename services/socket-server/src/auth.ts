/**
 * JWT Authentication Middleware for Socket.IO
 *
 * Verifies the JWT token passed in the handshake auth object,
 * extracts user_id, and joins the socket to a personal room.
 */

import jwt from "jsonwebtoken";
import type { Socket } from "socket.io";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export interface AuthenticatedSocket extends Socket {
    data: {
        userId: string;
        email?: string;
        role?: string;
    };
}

/**
 * Socket.IO middleware that validates JWT from handshake.
 *
 * Client passes token as: `io({ auth: { token: "Bearer xxx" } })`
 */
export function authMiddleware(
    socket: Socket,
    next: (err?: Error) => void
): void {
    try {
        const authHeader = socket.handshake.auth?.token as string | undefined;

        if (!authHeader) {
            return next(new Error("Authentication required"));
        }

        // Strip "Bearer " prefix if present
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : authHeader;

        const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

        if (!decoded.sub) {
            return next(new Error("Invalid token: missing sub claim"));
        }

        // Attach user data to socket
        socket.data.userId = decoded.sub;
        socket.data.email = decoded.email as string | undefined;
        socket.data.role = decoded.role as string | undefined;

        // Join personal room for targeted events
        socket.join(`user:${decoded.sub}`);

        console.log(`[auth] User ${decoded.sub} connected (socket ${socket.id})`);
        next();
    } catch (err) {
        console.error("[auth] JWT verification failed:", err);
        next(new Error("Invalid or expired token"));
    }
}
