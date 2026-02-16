"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Types ──────────────────────────────────────────── */
interface NotificationItem {
    id: string;
    type: string;
    title: string;
    body: string | null;
    data: Record<string, unknown>;
    priority: string;
    read_at: string | null;
    channel: string | null;
    created_at: string;
}

/* ── Priority badge colours ─────────────────────────── */
const priorityStyles: Record<string, { bg: string; text: string; border: string }> = {
    success: { bg: "rgba(16,185,129,0.12)", text: "#10b981", border: "rgba(16,185,129,0.25)" },
    info: { bg: "rgba(59,130,246,0.12)", text: "#3b82f6", border: "rgba(59,130,246,0.25)" },
    warning: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.25)" },
    error: { bg: "rgba(239,68,68,0.12)", text: "#ef4444", border: "rgba(239,68,68,0.25)" },
};

/* ── Helpers ────────────────────────────────────────── */
function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

/* ── Component ──────────────────────────────────────── */
export default function NotificationsPage() {
    const { token } = useAuth();
    const { notifications: liveNotifs, unreadCount: liveUnread } =
        useNotifications(token ?? undefined);

    const [items, setItems] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    /* ── Fetch persisted notifications ─────────────── */
    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setItems(json.data ?? []);
        } catch (e) {
            console.error("[notifications] fetch error:", e);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchUnreadCount = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setUnreadCount(json.data?.unread_count ?? 0);
        } catch (e) {
            console.error("[notifications] unread count error:", e);
        }
    }, [token]);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
    }, [fetchNotifications, fetchUnreadCount]);

    /* ── Merge live Socket.IO notifications at top ── */
    useEffect(() => {
        if (liveNotifs.length > 0) {
            setItems((prev) => {
                const existingIds = new Set(prev.map((n) => n.id));
                const fresh = liveNotifs
                    .filter((n) => !existingIds.has(n.id))
                    .map((n) => ({
                        id: n.id,
                        type: n.type,
                        title: n.title,
                        body: n.body ?? null,
                        data: n.data,
                        priority: n.priority,
                        read_at: null,
                        channel: null,
                        created_at: n.created_at,
                    }));
                return [...fresh, ...prev];
            });
            setUnreadCount((c) => c + liveUnread);
        }
    }, [liveNotifs, liveUnread]);

    /* ── Mark single read ───────────────────────────── */
    const markRead = async (id: string) => {
        if (!token) return;
        setItems((prev) =>
            prev.map((n) =>
                n.id === id ? { ...n, read_at: new Date().toISOString() } : n
            )
        );
        setUnreadCount((c) => Math.max(0, c - 1));

        try {
            await fetch(`${API}/notifications/${id}/read`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (e) {
            console.error("[notifications] mark read error:", e);
        }
    };

    /* ── Mark all read ──────────────────────────────── */
    const markAllRead = async () => {
        if (!token) return;
        setItems((prev) =>
            prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
        );
        setUnreadCount(0);

        try {
            await fetch(`${API}/notifications/read-all`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (e) {
            console.error("[notifications] mark all read error:", e);
        }
    };

    /* ── Render ──────────────────────────────────────── */
    return (
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "2rem 1.5rem" }}>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "2rem",
                }}
            >
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
                        🔔 Notifications
                    </h1>
                    <p
                        style={{
                            margin: "0.25rem 0 0",
                            color: "#94a3b8",
                            fontSize: "0.875rem",
                        }}
                    >
                        {unreadCount > 0
                            ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                            : "You're all caught up"}
                    </p>
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        style={{
                            background: "rgba(99,102,241,0.12)",
                            color: "#818cf8",
                            border: "1px solid rgba(99,102,241,0.25)",
                            borderRadius: 8,
                            padding: "0.5rem 1rem",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(99,102,241,0.2)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(99,102,241,0.12)";
                        }}
                    >
                        Mark all read
                    </button>
                )}
            </div>

            {/* Loading state */}
            {loading && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "4rem 0",
                        color: "#94a3b8",
                        fontSize: "0.9rem",
                    }}
                >
                    Loading notifications...
                </div>
            )}

            {/* Empty state */}
            {!loading && items.length === 0 && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "4rem 2rem",
                        background: "rgba(30,41,59,0.5)",
                        borderRadius: 16,
                        border: "1px solid rgba(148,163,184,0.1)",
                    }}
                >
                    <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🔕</div>
                    <h3
                        style={{
                            fontWeight: 600,
                            fontSize: "1.1rem",
                            margin: "0 0 0.5rem",
                        }}
                    >
                        No notifications yet
                    </h3>
                    <p
                        style={{
                            color: "#94a3b8",
                            fontSize: "0.875rem",
                            margin: 0,
                        }}
                    >
                        When your verifications, contracts, or messages have updates,
                        they&apos;ll appear here.
                    </p>
                </div>
            )}

            {/* Notification list */}
            {!loading && items.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {items.map((n) => {
                        const ps = priorityStyles[n.priority] ?? priorityStyles.info;
                        const isUnread = !n.read_at;
                        const link =
                            typeof n.data === "object" && n.data !== null
                                ? (n.data as Record<string, unknown>).link
                                : undefined;

                        return (
                            <div
                                key={n.id}
                                onClick={() => {
                                    if (isUnread) markRead(n.id);
                                    if (typeof link === "string") {
                                        window.location.href = link;
                                    }
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "1rem",
                                    padding: "1rem 1.25rem",
                                    background: isUnread
                                        ? "rgba(59,130,246,0.06)"
                                        : "rgba(30,41,59,0.3)",
                                    border: `1px solid ${isUnread ? "rgba(59,130,246,0.15)" : "rgba(148,163,184,0.08)"}`,
                                    borderRadius: 12,
                                    cursor: link ? "pointer" : "default",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = isUnread
                                        ? "rgba(59,130,246,0.1)"
                                        : "rgba(30,41,59,0.5)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = isUnread
                                        ? "rgba(59,130,246,0.06)"
                                        : "rgba(30,41,59,0.3)";
                                }}
                            >
                                {/* Unread dot */}
                                <div
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: isUnread ? "#3b82f6" : "transparent",
                                        flexShrink: 0,
                                        marginTop: 8,
                                    }}
                                />

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            marginBottom: "0.25rem",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontWeight: isUnread ? 600 : 500,
                                                fontSize: "0.9375rem",
                                            }}
                                        >
                                            {n.title}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: "0.6875rem",
                                                fontWeight: 600,
                                                padding: "2px 8px",
                                                borderRadius: 6,
                                                background: ps.bg,
                                                color: ps.text,
                                                border: `1px solid ${ps.border}`,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.04em",
                                            }}
                                        >
                                            {n.priority}
                                        </span>
                                    </div>
                                    {n.body && (
                                        <p
                                            style={{
                                                margin: 0,
                                                color: "#94a3b8",
                                                fontSize: "0.8125rem",
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {n.body}
                                        </p>
                                    )}
                                    <span
                                        style={{
                                            display: "inline-block",
                                            marginTop: "0.375rem",
                                            color: "#64748b",
                                            fontSize: "0.75rem",
                                        }}
                                    >
                                        {timeAgo(n.created_at)}
                                    </span>
                                </div>

                                {/* Action hint */}
                                {typeof link === "string" && (
                                    <span
                                        style={{
                                            color: "#64748b",
                                            fontSize: "1rem",
                                            flexShrink: 0,
                                            marginTop: 4,
                                        }}
                                    >
                                        →
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
