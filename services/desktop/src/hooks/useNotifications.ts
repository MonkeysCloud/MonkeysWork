import { useEffect, useState, useCallback } from "react";
import { useSocket } from "./useSocket";

interface Notification {
    id: string;
    type: string;
    title: string;
    body?: string;
    data: Record<string, unknown>;
    priority: string;
    created_at: string;
    read: boolean;
}

interface UseNotificationsReturn {
    notifications: Notification[];
    unreadCount: number;
    markRead: (notificationId: string) => void;
    clearAll: () => void;
}

export function useNotifications(token?: string): UseNotificationsReturn {
    const { socket, isConnected } = useSocket({
        namespace: "/notifications",
        token,
    });

    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleNew = (data: Omit<Notification, "read">) => {
            setNotifications((prev) => [{ ...data, read: false }, ...prev]);
        };

        socket.on("notification:new", handleNew);
        return () => { socket.off("notification:new", handleNew); };
    }, [socket, isConnected]);

    const markRead = useCallback(
        (notificationId: string) => {
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
            );
            socket?.emit("notification:read", { notification_id: notificationId });
        },
        [socket]
    );

    const clearAll = useCallback(() => { setNotifications([]); }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return { notifications, unreadCount, markRead, clearAll };
}
