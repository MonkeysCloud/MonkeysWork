"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Types ──────────────────────────────────────────── */
interface SystemMessage {
    id: string;
    type: string;
    title: string;
    body: string | null;
    data: Record<string, unknown>;
    priority: string;
    read_at: string | null;
    created_at: string;
}

interface Reply {
    id: string;
    text: string;
    fileName?: string;
    fileUrl?: string;
    sentAt: string;
}

/* ── Icon mapping ───────────────────────────────────── */
function iconForType(type: string): string {
    if (type.startsWith("verification.approved")) return "✅";
    if (type.startsWith("verification.auto_approved")) return "✅";
    if (type.startsWith("verification.in_review")) return "🔄";
    if (type.startsWith("verification.info_requested")) return "💬";
    if (type.startsWith("verification.rejected")) return "❌";
    if (type.startsWith("contract")) return "📄";
    if (type.startsWith("proposal")) return "📝";
    if (type.startsWith("payment") || type.startsWith("escrow")) return "💰";
    return "💬";
}

function priorityColor(p: string) {
    return {
        success: { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" },
        info: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
        warning: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
        error: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
    }[p] ?? { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" };
}

/* ── Helpers ────────────────────────────────────────── */
function formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function fullDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/* ── Component ──────────────────────────────────────── */
export default function MessagesPage() {
    const { token } = useAuth();
    const { notifications: liveNotifs } = useNotifications(token ?? undefined);

    const [messages, setMessages] = useState<SystemMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "verification" | "system">("all");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    /* ── Reply state ── */
    const [replyText, setReplyText] = useState("");
    const [replyFile, setReplyFile] = useState<File | null>(null);
    const [sending, setSending] = useState(false);
    const [replySuccess, setReplySuccess] = useState(false);
    const [replies, setReplies] = useState<Record<string, Reply[]>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const threadEndRef = useRef<HTMLDivElement>(null);

    /* ── Fetch system messages ── */
    const fetchMessages = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/notifications?per_page=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setMessages(json.data ?? []);
        } catch (e) {
            console.error("[messages] fetch error:", e);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    /* ── Merge live notifications ── */
    useEffect(() => {
        if (liveNotifs.length > 0) {
            setMessages((prev) => {
                const existingIds = new Set(prev.map((m) => m.id));
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
                        created_at: n.created_at,
                    }));
                return [...fresh, ...prev];
            });
        }
    }, [liveNotifs]);

    /* ── Filtered list ── */
    const filtered = messages.filter((m) => {
        if (filter === "verification") return m.type.startsWith("verification.");
        if (filter === "system") return !m.type.startsWith("verification.");
        return true;
    });

    const selected = messages.find((m) => m.id === selectedId) ?? null;
    const unreadCount = messages.filter((m) => !m.read_at).length;

    /* ── Mark read ── */
    const markRead = async (msg: SystemMessage) => {
        if (!token || msg.read_at) return;
        setMessages((prev) =>
            prev.map((m) =>
                m.id === msg.id ? { ...m, read_at: new Date().toISOString() } : m
            )
        );
        try {
            await fetch(`${API}/notifications/${msg.id}/read`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch { }
    };

    /* ── Send reply ── */
    const handleReply = async () => {
        if (!token || !selected || (!replyText.trim() && !replyFile)) return;
        setSending(true);

        const msgId = selected.id;
        const savedText = replyText.trim();
        const savedFile = replyFile;

        // Build optimistic reply
        const optimisticReply: Reply = {
            id: `optimistic-${Date.now()}`,
            text: savedText,
            sentAt: new Date().toISOString(),
        };
        if (savedFile) {
            optimisticReply.fileName = savedFile.name;
            optimisticReply.fileUrl = URL.createObjectURL(savedFile);
        }

        // Show immediately
        setReplies((prev) => ({
            ...prev,
            [msgId]: [...(prev[msgId] ?? []), optimisticReply],
        }));
        setReplyText("");
        setReplyFile(null);

        try {
            // Step 1: Upload file if present
            let attachmentId: string | null = null;
            if (savedFile) {
                const formData = new FormData();
                formData.append("files[]", savedFile);
                formData.append("entity_type", "notification_reply");
                formData.append("entity_id", msgId);

                const uploadRes = await fetch(`${API}/attachments/upload`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });
                const uploadJson = await uploadRes.json();
                attachmentId = uploadJson.data?.[0]?.id ?? null;
            }

            // Step 2: Send the reply with optional attachment_id
            const res = await fetch(`${API}/notifications/${msgId}/reply`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: savedText,
                    attachment_id: attachmentId,
                }),
            });
            const json = await res.json();
            const serverReply = json.data;

            // Replace optimistic with server data
            if (serverReply) {
                setReplies((prev) => ({
                    ...prev,
                    [msgId]: (prev[msgId] ?? []).map((r) =>
                        r.id === optimisticReply.id
                            ? {
                                id: serverReply.id,
                                text: serverReply.message,
                                sentAt: serverReply.created_at,
                                fileName: serverReply.attachment?.file_name,
                                fileUrl: serverReply.attachment?.file_url
                                    ? `${API.replace("/api/v1", "")}${serverReply.attachment.file_url}`
                                    : optimisticReply.fileUrl,
                            }
                            : r
                    ),
                }));
            }

            setReplySuccess(true);
            setTimeout(() => setReplySuccess(false), 3000);
        } catch (e) {
            console.error("[reply] error:", e);
        } finally {
            setSending(false);
            setTimeout(() => threadEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
    };

    /* ── Load replies from server when selecting a message ── */
    const fetchReplies = useCallback(async (notifId: string) => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/notifications/${notifId}/replies`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            const serverReplies: Reply[] = (json.data ?? []).map((r: { id: string; message: string; created_at: string; attachment?: { file_name: string; file_url: string; mime_type: string } }) => ({
                id: r.id,
                text: r.message,
                sentAt: r.created_at,
                fileName: r.attachment?.file_name,
                fileUrl: r.attachment?.file_url
                    ? `${API.replace("/api/v1", "")}${r.attachment.file_url}`
                    : undefined,
            }));
            setReplies((prev) => ({ ...prev, [notifId]: serverReplies }));
        } catch (e) {
            console.error("[replies] fetch error:", e);
        }
    }, [token]);

    /* ── Reset reply on message change ── */
    useEffect(() => {
        setReplyText("");
        setReplyFile(null);
        setReplySuccess(false);
        if (selectedId) {
            fetchReplies(selectedId);
        }
    }, [selectedId, fetchReplies]);

    /* ── Render ──────────────────────────────────────── */
    return (
        <div
            style={{
                display: "flex",
                height: "calc(100vh - 64px)",
                overflow: "hidden",
                background: "#f8fafc",
                margin: "-1rem",
            }}
            className="sm:!-m-6 lg:!-m-8"
        >
            {/* ── Left panel: Message list ────────── */}
            <div
                style={{
                    width: selected ? 380 : "100%",
                    maxWidth: selected ? 380 : 820,
                    margin: selected ? 0 : "0 auto",
                    borderRight: selected ? "1px solid #e2e8f0" : "none",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.3s ease",
                    background: "#ffffff",
                }}
            >
                {/* Header */}
                <div style={{ padding: "1.5rem 1.25rem 1rem" }}>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                        💬 Messages
                    </h1>
                    <p style={{ margin: "0.25rem 0 0", color: "#64748b", fontSize: "0.8125rem" }}>
                        System messages, verification updates, and conversations
                    </p>
                </div>

                {/* Filter tabs */}
                <div
                    style={{
                        display: "flex",
                        gap: "0.25rem",
                        margin: "0 1.25rem 1rem",
                        padding: "0.25rem",
                        background: "#f1f5f9",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                    }}
                >
                    {(["all", "verification", "system"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                flex: 1,
                                padding: "0.4rem 0.5rem",
                                borderRadius: 8,
                                border: "none",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                background: filter === f ? "#ffffff" : "transparent",
                                color: filter === f ? "#6366f1" : "#64748b",
                                boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                                transition: "all 0.2s",
                            }}
                        >
                            {f === "all" ? `All (${messages.length})`
                                : f === "verification" ? `Verifications`
                                    : `System`}
                        </button>
                    ))}
                </div>

                {/* Message list */}
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "0 0.75rem 1rem",
                    }}
                >
                    {loading && (
                        <div style={{ textAlign: "center", padding: "3rem 0", color: "#94a3b8" }}>
                            Loading...
                        </div>
                    )}
                    {!loading && filtered.length === 0 && (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "3rem 1.5rem",
                                background: "#f8fafc",
                                borderRadius: 14,
                                border: "1px solid #e2e8f0",
                            }}
                        >
                            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📭</div>
                            <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
                                No messages yet
                            </p>
                        </div>
                    )}
                    {filtered.map((m) => {
                        const isUnread = !m.read_at;
                        const isActive = selectedId === m.id;
                        const icon = iconForType(m.type);

                        return (
                            <div
                                key={m.id}
                                onClick={() => {
                                    setSelectedId(m.id);
                                    markRead(m);
                                }}
                                style={{
                                    display: "flex",
                                    gap: "0.75rem",
                                    padding: "0.875rem 1rem",
                                    marginBottom: "0.25rem",
                                    background: isActive
                                        ? "#eef2ff"
                                        : isUnread
                                            ? "#fefce8"
                                            : "#ffffff",
                                    border: `1px solid ${isActive
                                        ? "#c7d2fe"
                                        : isUnread
                                            ? "#fef08a"
                                            : "#f1f5f9"
                                        }`,
                                    borderRadius: 10,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive)
                                        e.currentTarget.style.background = "#f8fafc";
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive)
                                        e.currentTarget.style.background = isUnread
                                            ? "#fefce8"
                                            : "#ffffff";
                                }}
                            >
                                {/* Icon */}
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 8,
                                        background: "#eef2ff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.1rem",
                                        flexShrink: 0,
                                    }}
                                >
                                    {icon}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontWeight: isUnread ? 700 : 500,
                                                fontSize: "0.8125rem",
                                                color: "#0f172a",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {m.title}
                                        </span>
                                        <span
                                            style={{
                                                color: "#94a3b8",
                                                fontSize: "0.6875rem",
                                                flexShrink: 0,
                                                marginLeft: "0.5rem",
                                            }}
                                        >
                                            {formatDate(m.created_at)}
                                        </span>
                                    </div>
                                    {m.body && (
                                        <p
                                            style={{
                                                margin: "0.125rem 0 0",
                                                color: "#64748b",
                                                fontSize: "0.75rem",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {m.body}
                                        </p>
                                    )}
                                </div>
                                {isUnread && (
                                    <div
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            background: "#6366f1",
                                            flexShrink: 0,
                                            marginTop: 14,
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Right panel: Message detail ─────── */}
            {selected ? (
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        background: "#f8fafc",
                    }}
                >
                    {/* Detail header */}
                    <div
                        style={{
                            padding: "1.25rem 1.5rem",
                            borderBottom: "1px solid #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            background: "#ffffff",
                        }}
                    >
                        <button
                            onClick={() => setSelectedId(null)}
                            style={{
                                background: "#f1f5f9",
                                border: "1px solid #e2e8f0",
                                borderRadius: 8,
                                padding: "0.4rem 0.75rem",
                                color: "#475569",
                                fontSize: "0.8125rem",
                                cursor: "pointer",
                            }}
                        >
                            ← Back
                        </button>
                        <div style={{ flex: 1 }}>
                            <h2
                                style={{
                                    fontSize: "1.125rem",
                                    fontWeight: 600,
                                    margin: 0,
                                    color: "#0f172a",
                                }}
                            >
                                {selected.title}
                            </h2>
                            <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                                {fullDate(selected.created_at)}
                            </span>
                        </div>
                        {(() => {
                            const ps = priorityColor(selected.priority);
                            return (
                                <span
                                    style={{
                                        fontSize: "0.6875rem",
                                        fontWeight: 600,
                                        padding: "4px 10px",
                                        borderRadius: 6,
                                        background: ps.bg,
                                        color: ps.text,
                                        border: `1px solid ${ps.border}`,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.04em",
                                    }}
                                >
                                    {selected.priority}
                                </span>
                            );
                        })()}
                    </div>

                    {/* Detail body */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: "auto",
                            padding: "1.5rem",
                        }}
                    >
                        {/* Message content card */}
                        <div
                            style={{
                                background: "#ffffff",
                                borderRadius: 14,
                                border: "1px solid #e2e8f0",
                                padding: "1.5rem",
                                marginBottom: "1.25rem",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                    marginBottom: "1rem",
                                }}
                            >
                                <div
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 10,
                                        background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.25rem",
                                    }}
                                >
                                    {iconForType(selected.type)}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a" }}>
                                        MonkeysWork System
                                    </div>
                                    <div style={{ color: "#94a3b8", fontSize: "0.6875rem" }}>
                                        {selected.type.replace(".", " · ")}
                                    </div>
                                </div>
                            </div>

                            <p
                                style={{
                                    margin: 0,
                                    fontSize: "0.9375rem",
                                    lineHeight: 1.7,
                                    color: "#1e293b",
                                }}
                            >
                                {selected.body}
                            </p>
                        </div>

                        {/* Metadata card */}
                        {(() => {
                            const data =
                                typeof selected.data === "string"
                                    ? JSON.parse(selected.data)
                                    : selected.data;
                            if (!data || Object.keys(data).length === 0) return null;

                            return (
                                <div
                                    style={{
                                        background: "#ffffff",
                                        borderRadius: 12,
                                        border: "1px solid #e2e8f0",
                                        padding: "1.25rem",
                                        marginBottom: "1.25rem",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            color: "#94a3b8",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                            marginBottom: "0.75rem",
                                        }}
                                    >
                                        Details
                                    </div>
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: "0.75rem",
                                        }}
                                    >
                                        {data.status && (
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: "0.6875rem",
                                                        color: "#94a3b8",
                                                        marginBottom: "0.125rem",
                                                    }}
                                                >
                                                    Status
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.8125rem",
                                                        fontWeight: 600,
                                                        textTransform: "capitalize",
                                                        color: "#1e293b",
                                                    }}
                                                >
                                                    {String(data.status).replace(/_/g, " ")}
                                                </div>
                                            </div>
                                        )}
                                        {data.confidence != null && (
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: "0.6875rem",
                                                        color: "#94a3b8",
                                                        marginBottom: "0.125rem",
                                                    }}
                                                >
                                                    AI Confidence
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.8125rem",
                                                        fontWeight: 600,
                                                        color: "#1e293b",
                                                    }}
                                                >
                                                    {Math.round(Number(data.confidence) * 100)}%
                                                </div>
                                            </div>
                                        )}
                                        {data.verification_type && (
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: "0.6875rem",
                                                        color: "#94a3b8",
                                                        marginBottom: "0.125rem",
                                                    }}
                                                >
                                                    Type
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.8125rem",
                                                        fontWeight: 600,
                                                        textTransform: "capitalize",
                                                        color: "#1e293b",
                                                    }}
                                                >
                                                    {String(data.verification_type).replace(/_/g, " ")}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Action link */}
                        {(() => {
                            const data =
                                typeof selected.data === "string"
                                    ? JSON.parse(selected.data)
                                    : selected.data;
                            const link = data?.link as string | undefined;
                            if (!link) return null;

                            return (
                                <button
                                    onClick={() => (window.location.href = link)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        background: "#eef2ff",
                                        color: "#4f46e5",
                                        border: "1px solid #c7d2fe",
                                        borderRadius: 10,
                                        padding: "0.625rem 1.25rem",
                                        fontSize: "0.8125rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                        marginBottom: "1.25rem",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "#e0e7ff";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "#eef2ff";
                                    }}
                                >
                                    View Details →
                                </button>
                            );
                        })()}

                        {/* ── Reply thread ────────────── */}
                        {(replies[selected.id] ?? []).length > 0 && (
                            <div style={{ marginBottom: "1.25rem" }}>
                                <div
                                    style={{
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        color: "#94a3b8",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        marginBottom: "0.75rem",
                                    }}
                                >
                                    Your Replies
                                </div>
                                {(replies[selected.id] ?? []).map((r) => (
                                    <div
                                        key={r.id}
                                        style={{
                                            display: "flex",
                                            justifyContent: "flex-end",
                                            marginBottom: "0.5rem",
                                        }}
                                    >
                                        <div
                                            style={{
                                                maxWidth: "80%",
                                                background: "#6366f1",
                                                color: "#ffffff",
                                                borderRadius: "14px 14px 4px 14px",
                                                padding: "0.75rem 1rem",
                                            }}
                                        >
                                            {r.text && (
                                                <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.5 }}>
                                                    {r.text}
                                                </p>
                                            )}
                                            {r.fileName && (
                                                <div
                                                    style={{
                                                        marginTop: r.text ? "0.5rem" : 0,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "0.375rem",
                                                        background: "rgba(255,255,255,0.15)",
                                                        padding: "0.375rem 0.625rem",
                                                        borderRadius: 8,
                                                        fontSize: "0.75rem",
                                                    }}
                                                >
                                                    <span>📎</span>
                                                    {r.fileUrl ? (
                                                        <a
                                                            href={r.fileUrl}
                                                            download={r.fileName}
                                                            style={{ color: "#ffffff", textDecoration: "underline" }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {r.fileName}
                                                        </a>
                                                    ) : (
                                                        <span>{r.fileName}</span>
                                                    )}
                                                </div>
                                            )}
                                            <div
                                                style={{
                                                    fontSize: "0.625rem",
                                                    color: "rgba(255,255,255,0.6)",
                                                    marginTop: "0.375rem",
                                                    textAlign: "right",
                                                }}
                                            >
                                                {formatDate(r.sentAt)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={threadEndRef} />
                            </div>
                        )}
                    </div>

                    {/* ── Reply composer ────────────────── */}
                    <div
                        style={{
                            padding: "1rem 1.5rem",
                            borderTop: "1px solid #e2e8f0",
                            background: "#ffffff",
                        }}
                    >
                        {replySuccess ? (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    padding: "0.75rem 1rem",
                                    background: "#ecfdf5",
                                    border: "1px solid #a7f3d0",
                                    borderRadius: 10,
                                    color: "#059669",
                                    fontSize: "0.8125rem",
                                    fontWeight: 500,
                                }}
                            >
                                ✅ Reply sent successfully
                            </div>
                        ) : (
                            <div>
                                {/* Attachment preview */}
                                {replyFile && (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            padding: "0.5rem 0.75rem",
                                            background: "#f1f5f9",
                                            borderRadius: 8,
                                            marginBottom: "0.5rem",
                                            fontSize: "0.75rem",
                                            color: "#475569",
                                        }}
                                    >
                                        <span>📎</span>
                                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {replyFile.name}
                                        </span>
                                        <button
                                            onClick={() => setReplyFile(null)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "#94a3b8",
                                                cursor: "pointer",
                                                fontSize: "1rem",
                                                padding: "0 0.25rem",
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}

                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                                    {/* Attachment button */}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            background: "#f1f5f9",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: 8,
                                            padding: "0.5rem",
                                            cursor: "pointer",
                                            color: "#64748b",
                                            fontSize: "1.1rem",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            height: 38,
                                            width: 38,
                                        }}
                                        title="Attach file"
                                    >
                                        📎
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        style={{ display: "none" }}
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) setReplyFile(f);
                                            e.target.value = "";
                                        }}
                                    />

                                    {/* Text input */}
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Write a reply..."
                                        rows={1}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleReply();
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            resize: "none",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: 8,
                                            padding: "0.5rem 0.75rem",
                                            fontSize: "0.875rem",
                                            color: "#1e293b",
                                            background: "#f8fafc",
                                            outline: "none",
                                            minHeight: 38,
                                            maxHeight: 100,
                                            fontFamily: "inherit",
                                        }}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = "#6366f1"; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
                                    />

                                    {/* Send button */}
                                    <button
                                        onClick={handleReply}
                                        disabled={sending || (!replyText.trim() && !replyFile)}
                                        style={{
                                            background: (!replyText.trim() && !replyFile) ? "#e2e8f0" : "#6366f1",
                                            border: "none",
                                            borderRadius: 8,
                                            padding: "0.5rem 1rem",
                                            color: (!replyText.trim() && !replyFile) ? "#94a3b8" : "#ffffff",
                                            fontSize: "0.8125rem",
                                            fontWeight: 600,
                                            cursor: (!replyText.trim() && !replyFile) ? "default" : "pointer",
                                            transition: "all 0.2s",
                                            flexShrink: 0,
                                            height: 38,
                                            opacity: sending ? 0.6 : 1,
                                        }}
                                    >
                                        {sending ? "..." : "Send"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* No message selected */
                !loading &&
                messages.length > 0 && (
                    <div style={{ display: "none" }} />
                )
            )}
        </div>
    );
}
