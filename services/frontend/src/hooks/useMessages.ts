"use client";

/**
 * useMessages — Real-time messaging via Socket.IO.
 *
 * Usage:
 *   const { messages, sendTyping, stopTyping, typingUsers } = useMessages(token, conversationId);
 */

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "./useSocket";

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    message_type: string;
    attachments: Array<{ url: string; name: string; size: number; mime: string }>;
    created_at: string;
}

interface TypingUser {
    user_id: string;
    display_name?: string;
}

interface UseMessagesReturn {
    messages: Message[];
    typingUsers: TypingUser[];
    joinConversation: (conversationId: string) => void;
    leaveConversation: (conversationId: string) => void;
    sendTyping: (conversationId: string) => void;
    stopTyping: (conversationId: string) => void;
}

export function useMessages(token?: string): UseMessagesReturn {
    const { socket, isConnected } = useSocket({
        namespace: "/messages",
        token,
    });

    const [messages, setMessages] = useState<Message[]>([]);
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleNewMessage = (data: Message) => {
            setMessages((prev) => [...prev, data]);
        };

        const handleTypingStart = (data: TypingUser & { conversation_id: string }) => {
            setTypingUsers((prev) => {
                if (prev.some((u) => u.user_id === data.user_id)) return prev;
                return [...prev, { user_id: data.user_id, display_name: data.display_name }];
            });
        };

        const handleTypingStop = (data: { user_id: string }) => {
            setTypingUsers((prev) => prev.filter((u) => u.user_id !== data.user_id));
        };

        socket.on("message:new", handleNewMessage);
        socket.on("typing:start", handleTypingStart);
        socket.on("typing:stop", handleTypingStop);

        return () => {
            socket.off("message:new", handleNewMessage);
            socket.off("typing:start", handleTypingStart);
            socket.off("typing:stop", handleTypingStop);
        };
    }, [socket, isConnected]);

    const joinConversation = useCallback(
        (conversationId: string) => {
            socket?.emit("join:conversation", { conversation_id: conversationId });
        },
        [socket]
    );

    const leaveConversation = useCallback(
        (conversationId: string) => {
            socket?.emit("leave:conversation", { conversation_id: conversationId });
            setMessages([]);
            setTypingUsers([]);
        },
        [socket]
    );

    const sendTyping = useCallback(
        (conversationId: string) => {
            socket?.emit("typing:start", { conversation_id: conversationId });
        },
        [socket]
    );

    const stopTyping = useCallback(
        (conversationId: string) => {
            socket?.emit("typing:stop", { conversation_id: conversationId });
        },
        [socket]
    );

    return {
        messages,
        typingUsers,
        joinConversation,
        leaveConversation,
        sendTyping,
        stopTyping,
    };
}
