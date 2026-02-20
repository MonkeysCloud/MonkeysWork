import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:3001";

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
            reconnectionAttempts: 3,
            reconnectionDelay: 2000,
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
            console.warn(`[socket] Connection error on ${namespace}:`, err.message);
            setIsConnected(false);
            if (err.message?.toLowerCase().includes("token") || err.message?.toLowerCase().includes("auth")) {
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
