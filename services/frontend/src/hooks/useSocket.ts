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
    const mountedRef = useRef(true);
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
            if (!mountedRef.current) return;
            console.log(`[socket] Connected to ${namespace} (${socket.id})`);
            setIsConnected(true);
        });

        socket.on("disconnect", (reason) => {
            if (!mountedRef.current) return;
            console.log(`[socket] Disconnected from ${namespace}: ${reason}`);
            setIsConnected(false);
        });

        socket.on("connect_error", (err) => {
            // Ignore errors that arrive after the hook has unmounted
            // (e.g. navigating away from the dashboard)
            if (!mountedRef.current) return;

            const isAuthError =
                err.message?.toLowerCase().includes("token") ||
                err.message?.toLowerCase().includes("auth");
            if (isAuthError) {
                console.warn(`[socket] Auth failed on ${namespace} — will reconnect on next login`);
                socket.disconnect();
            } else {
                console.warn(`[socket] Connection error on ${namespace}:`, err.message);
            }
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
        mountedRef.current = true;

        if (autoConnect && token) {
            connect();
        }

        return () => {
            mountedRef.current = false;
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
