"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import StatusBadge from "@/components/admin/StatusBadge";
import ActionModal from "@/components/admin/ActionModal";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Job {
    id: string;
    title: string;
    status: string;
    moderation_status?: string;
    moderation_ai_confidence?: string | number;
    moderation_ai_result?: {
        confidence?: number;
        flags?: string[];
        quality_score?: number;
        model?: string;
    } | null;
    moderation_reviewed_by?: string;
    moderation_reviewer_notes?: string;
    moderation_reviewed_at?: string;
    budget_type: string;
    budget_min: number;
    budget_max: number;
    currency?: string;
    description?: string;
    experience_level?: string;
    estimated_duration?: string;
    visibility?: string;
    client_id?: string;
    client_name: string;
    client_email?: string;
    client_avatar?: string;
    category_name?: string;
    skills?: Array<{ id: string; name: string; slug: string }>;
    attachments?: Array<{ id: string; file_name: string; file_url: string }>;
    conversation_count?: number;
    created_at: string;
    published_at?: string;
    [key: string]: unknown;
}

interface ConversationMessage {
    id: string;
    sender: "admin" | "client";
    sender_name?: string;
    sender_avatar?: string;
    message: string;
    timestamp: string;
    attachment?: {
        file_name: string;
        file_url: string;
        mime_type: string;
        file_size: number;
    };
}

const PER_PAGE = 20;

const MODERATION_STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "human_review", label: "Human Review" },
    { value: "auto_approved", label: "Auto Approved" },
    { value: "auto_rejected", label: "Auto Rejected" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
];

const JOB_STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    { value: "draft", label: "Draft" },
    { value: "pending_review", label: "Pending Review" },
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "suspended", label: "Suspended" },
    { value: "cancelled", label: "Cancelled" },
    { value: "rejected", label: "Rejected" },
    { value: "revision_requested", label: "Revision Requested" },
];

// ── Helpers ─────────────────────────────────────── */
function confidenceColor(c: number): string {
    if (c >= 0.85) return "text-green-600";
    if (c >= 0.5) return "text-yellow-600";
    return "text-red-600";
}

function confidenceBg(c: number): string {
    if (c >= 0.85) return "bg-green-50 border-green-200";
    if (c >= 0.5) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
}

function moderationBadge(status: string | undefined): React.ReactNode {
    const colors: Record<string, string> = {
        none: "bg-gray-100 text-gray-600",
        pending: "bg-yellow-100 text-yellow-700",
        human_review: "bg-orange-100 text-orange-700",
        auto_approved: "bg-green-100 text-green-700",
        auto_rejected: "bg-red-100 text-red-700",
        approved: "bg-green-100 text-green-700",
        rejected: "bg-red-100 text-red-700",
    };
    const label = (status || "none").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status || "none"] || colors.none}`}>
            {label}
        </span>
    );
}

export default function AdminJobsPage() {
    const { token } = useAuth();
    const searchParams = useSearchParams();

    // ── Tabs ──
    const [activeTab, setActiveTab] = useState<"all" | "moderation">(
        searchParams.get("tab") === "moderation" ? "moderation" : "all",
    );

    // ── Table state ──
    const [jobs, setJobs] = useState<Job[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");

    // ── Status change modal (existing) ──
    const [selected, setSelected] = useState<Job | null>(null);
    const [newStatus, setNewStatus] = useState("");
    const [modalLoading, setModalLoading] = useState(false);

    // ── Detail drawer ──
    const [detailJob, setDetailJob] = useState<Job | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // ── Actions ──
    const [actionType, setActionType] = useState<"approve" | "reject" | "request-revision" | null>(null);
    const [actionJob, setActionJob] = useState<Job | null>(null);
    const [actionNotes, setActionNotes] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    // ── Conversation ──
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [convLoading, setConvLoading] = useState(false);
    const [adminReply, setAdminReply] = useState("");
    const [replySending, setReplySending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ── Fetch jobs (all or moderation queue) ──
    const fetchJobs = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            per_page: String(PER_PAGE),
        });
        if (search) params.set("search", search);
        if (statusFilter) {
            if (activeTab === "moderation") {
                params.set("moderation_status", statusFilter);
            } else {
                params.set("status", statusFilter);
            }
        }

        const endpoint = activeTab === "moderation" ? "admin/jobs/moderation" : "admin/jobs";

        try {
            const res = await fetch(`${API}/${endpoint}/?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setJobs(json.data ?? []);
            setTotal(json.meta?.total ?? 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token, page, search, statusFilter, activeTab]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // Reset page when switching tabs or filters
    useEffect(() => {
        setPage(1);
        setStatusFilter("");
    }, [activeTab]);

    // ── Fetch detail ──
    const fetchDetail = useCallback(async (jobId: string) => {
        setDetailLoading(true);
        try {
            const res = await fetch(`${API}/admin/jobs/${jobId}/review/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setDetailJob(json.data ?? null);
        } catch (e) {
            console.error(e);
        } finally {
            setDetailLoading(false);
        }
    }, [token]);

    // ── Fetch conversation ──
    const fetchConversation = useCallback(async (jobId: string) => {
        setConvLoading(true);
        try {
            const res = await fetch(`${API}/admin/jobs/${jobId}/conversation/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setMessages(json.data ?? []);
        } catch (e) {
            console.error(e);
        } finally {
            setConvLoading(false);
        }
    }, [token]);

    // Auto-scroll conversation
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ── Send admin reply ──
    const handleSendAdminReply = async () => {
        if (!detailJob || !adminReply.trim()) return;
        setReplySending(true);
        try {
            const res = await fetch(`${API}/admin/jobs/${detailJob.id}/message/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message: adminReply }),
            });
            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    setMessages((prev) => [...prev, json.data]);
                }
                setAdminReply("");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setReplySending(false);
        }
    };

    // ── Handle moderation action ──
    const handleAction = async () => {
        if (!actionJob || !actionType) return;
        setActionLoading(true);
        try {
            const res = await fetch(`${API}/admin/jobs/${actionJob.id}/${actionType}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ notes: actionNotes }),
            });
            if (res.ok) {
                setActionJob(null);
                setActionType(null);
                setActionNotes("");
                setDetailJob(null);
                fetchJobs();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    // Simple status update (existing)
    const handleStatusUpdate = async () => {
        if (!selected || !newStatus) return;
        setModalLoading(true);
        try {
            await fetch(`${API}/admin/jobs/${selected.id}/status/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            setSelected(null);
            fetchJobs();
        } catch (e) {
            console.error(e);
        } finally {
            setModalLoading(false);
        }
    };

    const openAction = (j: Job, act: "approve" | "reject" | "request-revision") => {
        setActionJob(j);
        setActionType(act);
        setActionNotes("");
    };

    // Open detail drawer
    const openDetail = (j: Job) => {
        setDetailJob(j);
        fetchDetail(j.id);
        fetchConversation(j.id);
    };

    // ── Columns for "all" tab ──
    const allColumns: Column<Job>[] = [
        {
            key: "title", label: "Title",
            render: (j) => (
                <button onClick={() => openDetail(j)} className="font-medium text-brand-text hover:text-brand-orange transition-colors text-left">
                    {j.title}
                </button>
            ),
        },
        { key: "client_name", label: "Client" },
        { key: "status", label: "Status", render: (j) => <StatusBadge status={j.status} /> },
        {
            key: "moderation", label: "Moderation",
            render: (j) => moderationBadge(j.moderation_status),
        },
        {
            key: "budget", label: "Budget",
            render: (j) =>
                j.budget_min && j.budget_max
                    ? `$${Number(j.budget_min).toLocaleString()} – $${Number(j.budget_max).toLocaleString()}`
                    : "—",
        },
        {
            key: "created_at", label: "Posted",
            render: (j) => new Date(j.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        },
        {
            key: "actions", label: "",
            render: (j) => (
                <button
                    onClick={(e) => { e.stopPropagation(); setSelected(j); setNewStatus(j.status === "suspended" ? "open" : "suspended"); }}
                    className="text-xs text-brand-orange hover:text-brand-orange-hover font-medium transition-colors"
                >
                    Change Status
                </button>
            ),
        },
    ];

    // ── Columns for "moderation" tab ──
    const modColumns: Column<Job>[] = [
        {
            key: "title", label: "Title",
            render: (j) => (
                <button onClick={() => openDetail(j)} className="font-medium text-brand-text hover:text-brand-orange transition-colors text-left">
                    {j.title}
                </button>
            ),
        },
        { key: "client_name", label: "Client" },
        {
            key: "moderation", label: "Moderation Status",
            render: (j) => moderationBadge(j.moderation_status),
        },
        {
            key: "confidence", label: "AI Confidence",
            render: (j) => {
                const c = Number(j.moderation_ai_confidence ?? 0);
                return c > 0 ? (
                    <span className={`font-mono text-sm font-semibold ${confidenceColor(c)}`}>
                        {(c * 100).toFixed(1)}%
                    </span>
                ) : <span className="text-gray-400">—</span>;
            },
        },
        {
            key: "budget", label: "Budget",
            render: (j) =>
                j.budget_min && j.budget_max
                    ? `$${Number(j.budget_min).toLocaleString()} – $${Number(j.budget_max).toLocaleString()}`
                    : "—",
        },
        {
            key: "created_at", label: "Submitted",
            render: (j) => new Date(j.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        },
        {
            key: "actions", label: "Actions",
            render: (j) => (
                <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openAction(j, "approve"); }}
                        className="text-xs font-medium text-green-600 hover:text-green-800 transition-colors">
                        ✓ Approve
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); openAction(j, "reject"); }}
                        className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors">
                        ✗ Reject
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); openAction(j, "request-revision"); }}
                        className="text-xs font-medium text-orange-600 hover:text-orange-800 transition-colors">
                        ↻ Revise
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-brand-text">Jobs</h1>
                <p className="text-sm text-gray-500 mt-1">Manage platform jobs & content moderation</p>
            </div>

            {/* ── Tabs ── */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab("all")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "all"
                        ? "border-brand-orange text-brand-orange"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    All Jobs
                </button>
                <button
                    onClick={() => setActiveTab("moderation")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "moderation"
                        ? "border-brand-orange text-brand-orange"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    🔍 Moderation Queue
                </button>
            </div>

            {/* ── Filters ── */}
            <div className="flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Search by title…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30 w-64"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                >
                    {(activeTab === "moderation" ? MODERATION_STATUS_OPTIONS : JOB_STATUS_OPTIONS).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            </div>

            {/* ── Table ── */}
            <AdminTable
                columns={activeTab === "moderation" ? modColumns : allColumns}
                data={jobs}
                loading={loading}
                page={page}
                totalPages={Math.ceil(total / PER_PAGE)}
                total={total}
                onPageChange={setPage}
            />

            {/* ── Status change modal (existing) ── */}
            <ActionModal
                open={!!selected}
                title="Update Job Status"
                onClose={() => setSelected(null)}
                onConfirm={handleStatusUpdate}
                confirmLabel="Update Status"
                confirmColor={newStatus === "suspended" ? "red" : "green"}
                loading={modalLoading}
            >
                {selected && (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                            Change status for <strong>{selected.title}</strong>
                        </p>
                        <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                            <option value="open">Open</option>
                            <option value="suspended">Suspended</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                )}
            </ActionModal>

            {/* ── Moderation action modal ── */}
            <ActionModal
                open={!!actionJob && !!actionType}
                title={
                    actionType === "approve" ? "Approve Job" :
                        actionType === "reject" ? "Reject Job" : "Request Revision"
                }
                onClose={() => { setActionJob(null); setActionType(null); }}
                onConfirm={handleAction}
                confirmLabel={
                    actionType === "approve" ? "Approve & Publish" :
                        actionType === "reject" ? "Reject" : "Request Revision"
                }
                confirmColor={
                    actionType === "approve" ? "green" :
                        actionType === "reject" ? "red" : "orange"
                }
                loading={actionLoading}
            >
                {actionJob && (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                            {actionType === "approve" && <>Approve <strong>{actionJob.title}</strong>? It will be published and visible to freelancers.</>}
                            {actionType === "reject" && <>Reject <strong>{actionJob.title}</strong>? The client will be notified.</>}
                            {actionType === "request-revision" && <>Request revision for <strong>{actionJob.title}</strong>? The client will be asked to make changes.</>}
                        </p>
                        <textarea
                            rows={3}
                            placeholder={actionType === "approve" ? "Optional notes…" : "Explain what needs to be changed…"}
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30 resize-none"
                        />
                    </div>
                )}
            </ActionModal>

            {/* ── Detail drawer / slide-over ── */}
            {detailJob && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/30" onClick={() => setDetailJob(null)} />

                    {/* Panel */}
                    <div className="relative w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-slide-in-right">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                            <h2 className="text-lg font-semibold text-brand-text truncate pr-4">
                                {detailJob.title}
                            </h2>
                            <button onClick={() => setDetailJob(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        </div>

                        {detailLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin h-8 w-8 border-4 border-brand-orange border-t-transparent rounded-full" />
                            </div>
                        ) : (
                            <div className="px-6 py-6 space-y-6">
                                {/* Status row */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <StatusBadge status={detailJob.status} />
                                    {moderationBadge(detailJob.moderation_status)}
                                    {detailJob.moderation_ai_confidence && (
                                        <span className={`text-sm font-mono font-semibold px-2 py-1 rounded border ${confidenceBg(Number(detailJob.moderation_ai_confidence))}`}>
                                            AI: {(Number(detailJob.moderation_ai_confidence) * 100).toFixed(1)}%
                                        </span>
                                    )}
                                </div>

                                {/* AI moderation card */}
                                {detailJob.moderation_ai_result && (
                                    <div className={`rounded-lg border p-4 ${confidenceBg(Number(detailJob.moderation_ai_confidence ?? 0))}`}>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-2">🤖 AI Moderation Result</h3>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-gray-500">Confidence:</span>{" "}
                                                <span className={`font-semibold ${confidenceColor(Number(detailJob.moderation_ai_confidence ?? 0))}`}>
                                                    {(Number(detailJob.moderation_ai_confidence ?? 0) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Quality:</span>{" "}
                                                <span className="font-semibold">
                                                    {((detailJob.moderation_ai_result.quality_score ?? 0) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Model:</span>{" "}
                                                <span className="font-mono text-xs">{detailJob.moderation_ai_result.model ?? "—"}</span>
                                            </div>
                                            {detailJob.moderation_ai_result.flags && detailJob.moderation_ai_result.flags.length > 0 && (
                                                <div className="col-span-2">
                                                    <span className="text-gray-500">Flags:</span>{" "}
                                                    {detailJob.moderation_ai_result.flags.map((f: string) => (
                                                        <span key={f} className="inline-block bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full mr-1">
                                                            {f.replace(/_/g, " ")}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Client info */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">👤 Client</h3>
                                    <div className="flex items-center gap-3">
                                        {detailJob.client_avatar ? (
                                            <img src={detailJob.client_avatar} alt="" className="w-10 h-10 rounded-full" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange font-semibold">
                                                {(detailJob.client_name || "?")[0]}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{detailJob.client_name}</p>
                                            {detailJob.client_email && <p className="text-xs text-gray-500">{detailJob.client_email}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Job content */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">📝 Description</h3>
                                    {detailJob.description ? (
                                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 prose prose-sm max-w-none max-h-60 overflow-y-auto"
                                            dangerouslySetInnerHTML={{ __html: detailJob.description }} />
                                    ) : (
                                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-400 italic">No description provided.</div>
                                    )}
                                </div>

                                {/* Meta grid */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Category:</span>{" "}
                                        <span className="font-medium">{detailJob.category_name || "—"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Budget:</span>{" "}
                                        <span className="font-medium">
                                            {detailJob.budget_min && detailJob.budget_max
                                                ? `$${Number(detailJob.budget_min).toLocaleString()} – $${Number(detailJob.budget_max).toLocaleString()} (${detailJob.budget_type})`
                                                : "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Experience:</span>{" "}
                                        <span className="font-medium">{detailJob.experience_level || "—"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Duration:</span>{" "}
                                        <span className="font-medium">{detailJob.estimated_duration || "—"}</span>
                                    </div>
                                </div>

                                {/* Skills */}
                                {detailJob.skills && detailJob.skills.length > 0 && (
                                    <div>
                                        <span className="text-sm text-gray-500">Skills:</span>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {detailJob.skills.map((s) => (
                                                <span key={s.id} className="bg-brand-orange/10 text-brand-orange text-xs px-2 py-1 rounded-full">
                                                    {s.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Reviewer notes */}
                                {detailJob.moderation_reviewer_notes && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-blue-700 mb-1">📋 Previous Reviewer Notes</h3>
                                        <p className="text-sm text-blue-800">{detailJob.moderation_reviewer_notes}</p>
                                    </div>
                                )}

                                {/* Action buttons */}
                                {(detailJob.status === "pending_review" || detailJob.status === "revision_requested") && (
                                    <div className="flex gap-3 pt-2 border-t border-gray-100">
                                        <button onClick={() => openAction(detailJob, "approve")}
                                            className="flex-1 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                                            ✓ Approve
                                        </button>
                                        <button onClick={() => openAction(detailJob, "request-revision")}
                                            className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors">
                                            ↻ Request Revision
                                        </button>
                                        <button onClick={() => openAction(detailJob, "reject")}
                                            className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
                                            ✗ Reject
                                        </button>
                                    </div>
                                )}

                                {/* ── Conversation thread ── */}
                                <div className="border-t border-gray-200 pt-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                        💬 Conversation {messages.length > 0 && <span className="text-gray-400 font-normal">({messages.length})</span>}
                                    </h3>

                                    {convLoading ? (
                                        <div className="flex justify-center py-4">
                                            <div className="animate-spin h-5 w-5 border-2 border-brand-orange border-t-transparent rounded-full" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">No messages yet.</p>
                                    ) : (
                                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                            {messages.map((m) => (
                                                <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.sender === "admin"
                                                        ? "bg-brand-orange text-white rounded-br-md"
                                                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                                                        }`}>
                                                        <p className={`text-xs font-medium mb-0.5 ${m.sender === "admin" ? "text-orange-100" : "text-gray-500"}`}>
                                                            {m.sender_name || m.sender}
                                                        </p>
                                                        <p className="whitespace-pre-wrap">{m.message}</p>
                                                        <p className={`text-xs mt-1 ${m.sender === "admin" ? "text-orange-200" : "text-gray-400"}`}>
                                                            {new Date(m.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    )}

                                    {/* Admin reply input */}
                                    <div className="flex gap-2 mt-3">
                                        <input
                                            type="text"
                                            placeholder="Send a message to the client…"
                                            value={adminReply}
                                            onChange={(e) => setAdminReply(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendAdminReply(); } }}
                                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                                        />
                                        <button
                                            onClick={handleSendAdminReply}
                                            disabled={replySending || !adminReply.trim()}
                                            className="px-4 py-2 text-sm font-medium bg-brand-orange text-white rounded-lg hover:bg-brand-orange-hover disabled:opacity-50 transition-colors"
                                        >
                                            {replySending ? "…" : "Send"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Slide-in animation CSS */}
            <style jsx>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slideInRight 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
