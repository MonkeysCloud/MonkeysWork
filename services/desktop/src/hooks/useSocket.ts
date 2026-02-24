import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

interface UseSocketOptions {
    namespace?: string;
    token?: string;
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
            reconnectionAttempts: 2,
            reconnectionDelay: 5000,
            reconnectionDelayMax: 30000,
            timeout: 5000,
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
            // Silently handle connection errors — server may not be running
            console.debug(`[socket] ${namespace}: ${err.message}`);
            setIsConnected(false);
            // Stop retrying on auth errors or when server doesn't exist
            if (
                err.message?.toLowerCase().includes("token") ||
                err.message?.toLowerCase().includes("auth") ||
                err.message?.toLowerCase().includes("websocket is closed")
            ) {
                socket.disconnect();
            }
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
        return () => { disconnect(); };
    }, [autoConnect, token, connect, disconnect]);

    return { socket: socketRef.current, isConnected, connect, disconnect };
}
