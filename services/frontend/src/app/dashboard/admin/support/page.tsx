"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "next/navigation";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Ticket {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    category: string;
    priority: string;
    status: string;
    user_display_name: string | null;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
}

interface TicketDetail extends Ticket {
    attachments?: { name: string; url: string; size: number; type: string }[];
    replies: {
        id: string;
        message: string;
        is_admin: boolean;
        author_name: string | null;
        created_at: string;
    }[];
}

interface Stats {
    total: number;
    open: number;
    in_progress: number;
    waiting: number;
    resolved: number;
    closed: number;
    urgent: number;
    last_24h: number;
}

const STATUS_COLORS: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    waiting: "bg-purple-100 text-purple-700",
    resolved: "bg-green-100 text-green-700",
    closed: "bg-gray-100 text-gray-500",
};

const PRIORITY_COLORS: Record<string, string> = {
    low: "bg-gray-100 text-gray-600",
    normal: "bg-blue-50 text-blue-600",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
};

export default function AdminSupportPage() {
    const { token } = useAuth();
    const searchParams = useSearchParams();
    const statusFilter = searchParams.get("status") || "";

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");

    // Detail panel
    const [selected, setSelected] = useState<TicketDetail | null>(null);
    const [replyText, setReplyText] = useState("");
    const [replying, setReplying] = useState(false);

    const headers = { Authorization: `Bearer ${token}` };

    const fetchTickets = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), per_page: "20" });
            if (statusFilter) params.set("status", statusFilter);
            if (search) params.set("search", search);

            const res = await fetch(`${API}/admin/support?${params}`, { headers });
            const json = await res.json();
            setTickets(json.data ?? []);
            setTotalPages(json.meta?.last_page ?? 1);
        } catch {
            setTickets([]);
        } finally {
            setLoading(false);
        }
    }, [token, page, statusFilter, search]);

    const fetchStats = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/admin/support/stats`, { headers });
            const json = await res.json();
            setStats(json.data ?? null);
        } catch { /* ignore */ }
    }, [token]);

    useEffect(() => {
        fetchTickets();
        fetchStats();
    }, [fetchTickets, fetchStats]);

    const loadTicket = async (id: string) => {
        try {
            const res = await fetch(`${API}/admin/support/${id}`, { headers });
            const json = await res.json();
            setSelected(json.data ?? null);
        } catch { /* ignore */ }
    };

    const updateTicket = async (id: string, data: Record<string, string>) => {
        try {
            await fetch(`${API}/admin/support/${id}`, {
                method: "PUT",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            fetchTickets();
            fetchStats();
            if (selected?.id === id) loadTicket(id);
        } catch { /* ignore */ }
    };

    const sendReply = async () => {
        if (!selected || !replyText.trim()) return;
        setReplying(true);
        try {
            await fetch(`${API}/admin/support/${selected.id}/reply`, {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify({ message: replyText }),
            });
            setReplyText("");
            loadTicket(selected.id);
            fetchTickets();
            fetchStats();
        } catch { /* ignore */ }
        finally { setReplying(false); }
    };

    const fmt = (d: string) =>
        new Date(d).toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
        });

    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-brand-dark">Support Tickets</h1>
                    <p className="text-sm text-brand-muted mt-1">Manage and respond to user support requests</p>
                </div>
            </div>

            {/* Stats cards */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
                    {[
                        { label: "Total", val: stats.total, color: "text-brand-text" },
                        { label: "Open", val: stats.open, color: "text-blue-600" },
                        { label: "In Progress", val: stats.in_progress, color: "text-yellow-600" },
                        { label: "Waiting", val: stats.waiting, color: "text-purple-600" },
                        { label: "Resolved", val: stats.resolved, color: "text-green-600" },
                        { label: "Closed", val: stats.closed, color: "text-gray-500" },
                        { label: "Urgent", val: stats.urgent, color: "text-red-600" },
                        { label: "Last 24h", val: stats.last_24h, color: "text-brand-orange" },
                    ].map((s) => (
                        <div key={s.label} className="bg-white rounded-xl border border-brand-border/60 p-3 text-center">
                            <div className={`text-xl font-extrabold ${s.color}`}>{s.val}</div>
                            <div className="text-[10px] text-brand-muted uppercase tracking-wider">{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Search tickets..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="px-4 py-2 border border-brand-border rounded-lg text-sm w-64 focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none"
                />
                {["", "open", "in_progress", "waiting", "resolved", "closed"].map((s) => (
                    <a
                        key={s}
                        href={`/dashboard/admin/support${s ? `?status=${s}` : ""}`}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                            statusFilter === s
                                ? "bg-brand-orange text-white"
                                : "bg-white border border-brand-border text-brand-muted hover:border-brand-orange hover:text-brand-orange"
                        }`}
                    >
                        {s ? s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "All"}
                    </a>
                ))}
            </div>

            <div className="flex gap-4">
                {/* Ticket list */}
                <div className={`${selected ? "w-1/2" : "w-full"} transition-all`}>
                    <div className="bg-white rounded-xl border border-brand-border/60 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-brand-muted">Loading...</div>
                        ) : tickets.length === 0 ? (
                            <div className="p-8 text-center text-brand-muted">No tickets found</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-left text-xs font-semibold text-brand-muted uppercase tracking-wider">
                                        <th className="px-4 py-3">Subject</th>
                                        <th className="px-4 py-3">From</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Priority</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map((t) => (
                                        <tr
                                            key={t.id}
                                            className={`border-t border-brand-border/40 hover:bg-brand-orange-light/30 cursor-pointer transition-colors ${
                                                selected?.id === t.id ? "bg-brand-orange-light/40" : ""
                                            }`}
                                            onClick={() => loadTicket(t.id)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-brand-text truncate max-w-[200px]">
                                                    {t.subject}
                                                </div>
                                                <div className="text-xs text-brand-muted">{t.category}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-brand-text">{t.name}</div>
                                                <div className="text-xs text-brand-muted">{t.email}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${STATUS_COLORS[t.status] ?? ""}`}>
                                                    {t.status.replace("_", " ").toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${PRIORITY_COLORS[t.priority] ?? ""}`}>
                                                    {t.priority.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-brand-muted whitespace-nowrap">
                                                {fmt(t.created_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={t.status}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => updateTicket(t.id, { status: e.target.value })}
                                                    className="text-xs px-2 py-1 border border-brand-border rounded-lg bg-white"
                                                >
                                                    <option value="open">Open</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="waiting">Waiting</option>
                                                    <option value="resolved">Resolved</option>
                                                    <option value="closed">Closed</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 p-4 border-t border-brand-border/40">
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1 text-xs font-semibold border border-brand-border rounded-lg disabled:opacity-40"
                                >
                                    ← Prev
                                </button>
                                <span className="text-xs text-brand-muted py-1">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1 text-xs font-semibold border border-brand-border rounded-lg disabled:opacity-40"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail panel */}
                {selected && (
                    <div className="w-1/2 bg-white rounded-xl border border-brand-border/60 overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">
                        {/* Header */}
                        <div className="p-4 border-b border-brand-border/40 flex-shrink-0">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg font-bold text-brand-text truncate">
                                        {selected.subject}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="text-xs text-brand-muted">
                                            {selected.name} &lt;{selected.email}&gt;
                                        </span>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${STATUS_COLORS[selected.status] ?? ""}`}>
                                            {selected.status.replace("_", " ").toUpperCase()}
                                        </span>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${PRIORITY_COLORS[selected.priority] ?? ""}`}>
                                            {selected.priority.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelected(null)}
                                    className="ml-3 p-1 text-brand-muted hover:text-brand-text"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="flex gap-2 mt-3">
                                {["open", "in_progress", "resolved", "closed"].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => updateTicket(selected.id, { status: s })}
                                        className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-colors ${
                                            selected.status === s
                                                ? "bg-brand-orange text-white border-brand-orange"
                                                : "border-brand-border text-brand-muted hover:border-brand-orange hover:text-brand-orange"
                                        }`}
                                    >
                                        {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Original message */}
                            <div className="bg-brand-surface rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold text-brand-text">{selected.name}</span>
                                    <span className="text-[10px] text-brand-muted">{fmt(selected.created_at)}</span>
                                </div>
                                <p className="text-sm text-brand-muted whitespace-pre-wrap">{selected.message}</p>

                                {/* Attachments */}
                                {selected.attachments && selected.attachments.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-brand-border/40">
                                        <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wider mb-2">
                                            📎 {selected.attachments.length} Attachment{selected.attachments.length > 1 ? "s" : ""}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {selected.attachments.map((att, i) => {
                                                const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(att.type);
                                                const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8086";
                                                return (
                                                    <a
                                                        key={i}
                                                        href={`${apiBase}${att.url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 bg-white border border-brand-border/60 rounded-lg p-2 hover:border-brand-orange transition-colors"
                                                    >
                                                        {isImage ? (
                                                            <img
                                                                src={`${apiBase}${att.url}`}
                                                                alt={att.name}
                                                                className="w-10 h-10 rounded object-cover flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <span className="text-lg flex-shrink-0">📄</span>
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[11px] font-medium text-brand-text truncate">{att.name}</p>
                                                            <p className="text-[10px] text-brand-muted">{(att.size / 1024).toFixed(0)} KB</p>
                                                        </div>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Replies */}
                            {selected.replies?.map((r) => (
                                <div
                                    key={r.id}
                                    className={`rounded-xl p-4 ${
                                        r.is_admin
                                            ? "bg-brand-orange-light border border-brand-orange/20 ml-4"
                                            : "bg-brand-surface mr-4"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold text-brand-text">
                                            {r.is_admin ? `${r.author_name || "Admin"} (Staff)` : r.author_name || selected.name}
                                        </span>
                                        <span className="text-[10px] text-brand-muted">{fmt(r.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-brand-muted whitespace-pre-wrap">{r.message}</p>
                                </div>
                            ))}
                        </div>

                        {/* Reply input */}
                        <div className="p-4 border-t border-brand-border/40 flex-shrink-0">
                            <textarea
                                rows={3}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type your reply... (sends email to user)"
                                className="w-full px-3 py-2 border border-brand-border rounded-xl text-sm focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none resize-none"
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={sendReply}
                                    disabled={replying || !replyText.trim()}
                                    className="px-5 py-2 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover disabled:opacity-40 rounded-lg transition-all"
                                >
                                    {replying ? "Sending..." : "Send Reply"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
