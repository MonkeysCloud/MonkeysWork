"use client";

/**
 * useSocket — React hook for Socket.IO connection management.
 *
 * Manages lifecycle (connect/disconnect), auto-reconnect,
 * and exposes typed event helpers.
 *
 * Usage:
 *   const { socket, isConnected } = useSocket("/notifications");
 *
 *   useEffect(() => {
 *     if (!socket) return;
 *     socket.on("notification:new", (data) => { ... });
 *     return () => { socket.off("notification:new"); };
 *   }, [socket]);
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

interface UseSocketOptions {
    /** Socket.IO namespace (e.g. "/notifications") */
    namespace?: string;
    /** JWT token for authentication */
    token?: string;
    /** Auto-connect on mount (default: true) */
    autoConnect?: boolean;
}

interface UseSocketReturn {
    socket: Socket | null;
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
    const { namespace = "/", token, autoConnect = true } = options;
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const connect = useCallback(() => {
        if (socketRef.current?.connected) return;

        const socket = io(`${SOCKET_URL}${namespace}`, {
            auth: token ? { token: `Bearer ${token}` } : undefined,
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            autoConnect: true,
        });

        socket.on("connect", () => {
            console.log(`[socket] Connected to ${namespace} (${socket.id})`);
            setIsConnected(true);
        });

        socket.on("disconnect", (reason) => {
            console.log(`[socket] Disconnected from ${namespace}: ${reason}`);
            setIsConnected(false);
        });

        socket.on("connect_error", (err) => {
            console.error(`[socket] Connection error on ${namespace}:`, err.message);
            setIsConnected(false);
        });

        socketRef.current = socket;
    }, [namespace, token]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        }
    }, []);

    useEffect(() => {
        if (autoConnect && token) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, token, connect, disconnect]);

    return {
        socket: socketRef.current,
        isConnected,
        connect,
        disconnect,
    };
}
