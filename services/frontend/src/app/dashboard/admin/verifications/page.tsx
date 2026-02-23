"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import StatusBadge from "@/components/admin/StatusBadge";
import ActionModal from "@/components/admin/ActionModal";
import { fileUrl } from "@/lib/fileUrl";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Verification {
    id: string;
    user_id: string;
    type: string;
    status: string;
    display_name: string;
    email: string;
    data: string | null;
    ai_result: string | null;
    ai_confidence: string | null;
    ai_model_version: string | null;
    reviewer_notes: string | null;
    reviewed_at: string | null;
    created_at: string;
    [key: string]: unknown;
}

interface EnrichedVerification extends Verification {
    profile?: {
        headline?: string;
        bio?: string;
        hourly_rate?: string;
        currency?: string;
        experience_years?: number;
        certifications?: Array<{ name: string; issuer?: string; year?: number; url?: string;[k: string]: unknown }>;
        portfolio_urls?: Array<{ title?: string; url?: string; description?: string;[k: string]: unknown }>;
        education?: Array<{ institution?: string; degree?: string; field?: string; year?: number;[k: string]: unknown }>;
        website_url?: string;
        github_url?: string;
        linkedin_url?: string;
        availability_status?: string;
        avg_rating?: string;
        total_reviews?: number;
        total_jobs_completed?: number;
        total_earnings?: string;
        [k: string]: unknown;
    };
    skills?: Array<{ name: string; proficiency?: string; years_experience?: number }>;
}

const PER_PAGE = 20;

const TYPE_OPTIONS = [
    { value: "", label: "All Types" },
    { value: "identity", label: "Identity" },
    { value: "portfolio", label: "Portfolio" },
    { value: "work_history", label: "Work History" },
    { value: "skill_assessment", label: "Skill Assessment" },
    { value: "payment_method", label: "Payment Method" },
];

const STATUS_OPTIONS = [
    { value: "", label: "Queue (default)" },
    { value: "pending", label: "Pending" },
    { value: "in_review", label: "In Review" },
    { value: "human_review", label: "Human Review" },
    { value: "info_requested", label: "Info Requested" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
];

/* ── Helpers ────────────────────────────────────────── */
function parseJson(val: string | null | object): Record<string, unknown> | null {
    if (!val) return null;
    if (typeof val === "object") return val as Record<string, unknown>;
    try { return JSON.parse(val); } catch (_e) { return null; }
}

function confidenceColor(c: number): string {
    if (c >= 0.85) return "#10b981";
    if (c >= 0.6) return "#f59e0b";
    return "#ef4444";
}

function typeLabel(t: string | undefined | null): string {
    if (!t) return "—";
    return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(val: unknown): string {
    if (typeof val === "boolean") return val ? "✅ Yes" : "❌ No";
    if (val === null || val === undefined) return "—";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
}

interface ConversationMessage {
    id: string;
    sender: "admin" | "user";
    type?: string;
    title?: string;
    message: string;
    timestamp: string;
    attachment?: {
        id: string;
        file_name: string;
        file_url: string;
        mime_type: string;
        file_size: number;
    };
}

export default function AdminVerificationsPage() {
    const { token } = useAuth();

    const [items, setItems] = useState<Verification[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    /* Filters */
    const [filterType, setFilterType] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* Modal state */
    const [selected, setSelected] = useState<Verification | null>(null);
    const [action, setAction] = useState<"approve" | "reject" | "request-info">("approve");
    const [reason, setReason] = useState("");
    const [modalLoading, setModalLoading] = useState(false);

    /* Detail drawer */
    const [detail, setDetail] = useState<EnrichedVerification | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    /* Conversation thread */
    const [conversation, setConversation] = useState<ConversationMessage[]>([]);
    const [adminReply, setAdminReply] = useState("");
    const [sendingReply, setSendingReply] = useState(false);
    const threadEndRef = useRef<HTMLDivElement>(null);

    /* Fetch conversation thread */
    const fetchConversation = useCallback(async (verifId: string) => {
        try {
            const res = await fetch(
                `${API}/admin/verifications/${verifId}/conversation`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            if (res.ok) {
                const json = await res.json();
                setConversation(json.data ?? []);
                setTimeout(() => threadEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            }
        } catch (e) {
            console.error('[conversation] fetch error:', e);
        }
    }, [token]);

    /* Send admin message */
    const handleSendAdminReply = async () => {
        if (!detail || !adminReply.trim() || sendingReply) return;
        setSendingReply(true);
        try {
            const res = await fetch(
                `${API}/admin/verifications/${detail.id}/message`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ message: adminReply.trim() }),
                },
            );
            if (res.ok) {
                const json = await res.json();
                const newMsg: ConversationMessage = {
                    id: json.data?.id ?? `local-${Date.now()}`,
                    sender: "admin",
                    message: adminReply.trim(),
                    timestamp: json.data?.timestamp ?? new Date().toISOString(),
                };
                setConversation((prev) => [...prev, newMsg]);
                setAdminReply("");
                setTimeout(() => threadEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            }
        } catch (e) {
            console.error('[admin reply] error:', e);
        } finally {
            setSendingReply(false);
        }
    };

    /* Fetch enriched detail */
    const openDetail = useCallback(async (v: Verification) => {
        setDetail(v as EnrichedVerification); // show immediately with basic data
        setDetailLoading(true);
        setConversation([]);
        setAdminReply("");
        try {
            const res = await fetch(
                `${API}/admin/verifications/${v.id}/`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            if (res.ok) {
                const json = await res.json();
                const row = json.id ? json : (json.data?.id ? json.data : json);
                setDetail(row);
            }
        } catch (e) {
            console.error('Detail fetch error:', e);
        } finally {
            setDetailLoading(false);
        }
        // Also fetch conversation
        fetchConversation(v.id);
    }, [token, fetchConversation]);

    /* ── Fetch ──────────────────────────────────────── */
    const fetchQueue = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            per_page: String(PER_PAGE),
        });
        if (filterType) params.set("type", filterType);
        if (filterStatus) params.set("status", filterStatus);
        if (searchQuery.trim()) params.set("search", searchQuery.trim());

        try {
            const res = await fetch(
                `${API}/admin/verifications/queue/?${params}`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const json = await res.json();
            setItems(json.data ?? []);
            setTotal(json.meta?.total ?? 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token, page, filterType, filterStatus, searchQuery]);

    useEffect(() => { fetchQueue(); }, [fetchQueue]);

    /* Debounced search */
    const handleSearch = (val: string) => {
        setSearchQuery(val);
        setPage(1);
        if (searchRef.current) clearTimeout(searchRef.current);
        searchRef.current = setTimeout(() => {
            // fetchQueue will fire via useEffect
        }, 300);
    };

    /* ── Actions ────────────────────────────────────── */
    const handleAction = async () => {
        if (!selected) return;
        setModalLoading(true);
        try {
            const endpoints: Record<string, string> = {
                approve: `${API}/admin/verifications/${selected.id}/approve/`,
                reject: `${API}/admin/verifications/${selected.id}/reject/`,
                "request-info": `${API}/admin/verifications/${selected.id}/request-info/`,
            };
            const body: Record<string, string> = {};
            if (action === "reject") body.reason = reason;
            if (action === "request-info") body.message = reason;
            if (action === "approve" && reason) body.notes = reason;

            await fetch(endpoints[action], {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            setSelected(null);
            setReason("");
            fetchQueue();
        } catch (e) {
            console.error(e);
        } finally {
            setModalLoading(false);
        }
    };

    const openAction = (v: Verification, act: "approve" | "reject" | "request-info") => {
        setSelected(v);
        setAction(act);
        setReason("");
    };

    /* ── Table columns ──────────────────────────────── */
    const columns: Column<Verification>[] = [
        {
            key: "display_name",
            label: "User",
            render: (v) => (
                <div>
                    <p className="font-medium text-brand-text">{v.display_name || "—"}</p>
                    <p className="text-xs text-gray-400">{v.email}</p>
                </div>
            ),
        },
        {
            key: "type",
            label: "Type",
            render: (v) => (
                <span className="capitalize font-medium text-sm">{typeLabel(v.type)}</span>
            ),
        },
        {
            key: "ai_confidence",
            label: "AI Score",
            render: (v) => {
                const c = v.ai_confidence ? parseFloat(v.ai_confidence) : null;
                if (c == null) return <span className="text-gray-400 text-xs">—</span>;
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${Math.round(c * 100)}%`,
                                    backgroundColor: confidenceColor(c),
                                }}
                            />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: confidenceColor(c) }}>
                            {Math.round(c * 100)}%
                        </span>
                    </div>
                );
            },
        },
        {
            key: "status",
            label: "Status",
            render: (v) => <StatusBadge status={v.status} />,
        },
        {
            key: "created_at",
            label: "Submitted",
            render: (v) =>
                new Date(v.created_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                }),
        },
        {
            key: "actions",
            label: "Actions",
            render: (v) => (
                <div className="flex gap-1.5 flex-wrap">
                    <button
                        onClick={(e) => { e.stopPropagation(); openDetail(v); }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                        View
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); openAction(v, "approve"); }}
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-medium px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                    >
                        ✅ Approve
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); openAction(v, "request-info"); }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                        📋 Info
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); openAction(v, "reject"); }}
                        className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                        ❌ Decline
                    </button>
                </div>
            ),
        },
    ];

    /* ── Modal config ───────────────────────────────── */
    const modalTitle: Record<string, string> = {
        approve: "Approve Verification",
        reject: "Decline Verification",
        "request-info": "Request More Information",
    };
    const modalColor: Record<string, "green" | "red" | "blue"> = {
        approve: "green",
        reject: "red",
        "request-info": "blue",
    };
    const modalConfirmLabel: Record<string, string> = {
        approve: "Approve",
        reject: "Decline",
        "request-info": "Send Request",
    };
    const modalPlaceholder: Record<string, string> = {
        approve: "Optional notes…",
        reject: "Reason for declining…",
        "request-info": "What information do you need from the user?",
    };

    /* ── Render ──────────────────────────────────────── */
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-brand-text">
                    Verification Queue
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Review, approve, or request more information for verifications
                </p>
            </div>

            {/* ── Filter / Search bar ───────────────── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            🔍
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search by name or email…"
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(""); setPage(1); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Type filter */}
                    <select
                        value={filterType}
                        onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                    >
                        {TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>

                    {/* Status filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                    >
                        {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>

                    {/* Clear all */}
                    {(filterType || filterStatus || searchQuery) && (
                        <button
                            onClick={() => {
                                setFilterType("");
                                setFilterStatus("");
                                setSearchQuery("");
                                setPage(1);
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                        >
                            Clear all
                        </button>
                    )}

                    {/* Result count */}
                    <span className="text-xs text-gray-400 ml-auto">
                        {total} result{total !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            {/* ── Table ─────────────────────────────── */}
            <AdminTable
                columns={columns}
                data={items}
                loading={loading}
                page={page}
                totalPages={Math.ceil(total / PER_PAGE)}
                total={total}
                onPageChange={setPage}
                emptyMessage="No verifications match your filters 🔍"
            />

            {/* ── Detail drawer ─────────────────────── */}
            {detail && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={() => setDetail(null)}
                    />
                    <div className="relative bg-white w-full max-w-2xl shadow-2xl overflow-y-auto animate-slideInRight">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                            <h3 className="font-semibold text-brand-text">
                                Verification Details
                            </h3>
                            <button
                                onClick={() => setDetail(null)}
                                className="text-gray-400 hover:text-gray-600 text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        {detailLoading && (
                            <div className="px-6 py-2">
                                <div className="h-1 bg-blue-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                                </div>
                            </div>
                        )}

                        <div className="p-6 space-y-6">
                            {/* User + Meta grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">User</p>
                                    <p className="font-medium">{detail.display_name}</p>
                                    <p className="text-xs text-gray-400">{detail.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Type</p>
                                    <p className="capitalize font-medium">{typeLabel(detail.type)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Status</p>
                                    <StatusBadge status={detail.status} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Submitted</p>
                                    <p className="text-sm">
                                        {new Date(detail.created_at).toLocaleDateString("en-US", {
                                            month: "long", day: "numeric", year: "numeric",
                                            hour: "2-digit", minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Profile summary — headline + bio */}
                            {detail.profile?.headline && (
                                <div className="bg-blue-50 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">User Profile</p>
                                    <p className="text-sm font-medium text-gray-800">{detail.profile.headline}</p>
                                    {detail.profile.experience_years != null && detail.profile.experience_years > 0 && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {detail.profile.experience_years} years of experience
                                            {detail.profile.hourly_rate ? ` · $${detail.profile.hourly_rate}/${detail.profile.currency?.trim() || 'USD'}/hr` : ''}
                                        </p>
                                    )}
                                    {detail.profile.bio && (
                                        <p className="text-xs text-gray-600 mt-2 line-clamp-4 whitespace-pre-line">{detail.profile.bio}</p>
                                    )}
                                    {/* External links */}
                                    {(detail.profile.website_url || detail.profile.github_url || detail.profile.linkedin_url) && (
                                        <div className="flex gap-3 mt-2">
                                            {detail.profile.website_url && (
                                                <a href={detail.profile.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">🌐 Website</a>
                                            )}
                                            {detail.profile.github_url && (
                                                <a href={detail.profile.github_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">💻 GitHub</a>
                                            )}
                                            {detail.profile.linkedin_url && (
                                                <a href={detail.profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">🔗 LinkedIn</a>
                                            )}
                                        </div>
                                    )}
                                    {/* Platform stats */}
                                    {(detail.profile.total_jobs_completed != null && detail.profile.total_jobs_completed > 0) && (
                                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                            <span>⭐ {detail.profile.avg_rating} ({detail.profile.total_reviews} reviews)</span>
                                            <span>✅ {detail.profile.total_jobs_completed} jobs</span>
                                            <span>💰 ${detail.profile.total_earnings}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Skills */}
                            {detail.skills && detail.skills.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skills</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {detail.skills.map((s, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                                                {s.name}
                                                {s.years_experience ? <span className="text-gray-400 ml-1">({s.years_experience}yr)</span> : null}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Certifications */}
                            {detail.profile?.certifications && detail.profile.certifications.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Certifications</p>
                                    <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 overflow-hidden">
                                        {detail.profile.certifications.map((cert, i) => (
                                            <div key={i} className="px-4 py-3">
                                                <p className="text-sm font-medium text-gray-800">{cert.name || String(cert)}</p>
                                                {cert.issuer && <p className="text-xs text-gray-500">{cert.issuer}{cert.year ? ` · ${cert.year}` : ''}</p>}
                                                {cert.url && <a href={String(cert.url)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View Certificate ↗</a>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Portfolio URLs */}
                            {detail.profile?.portfolio_urls && detail.profile.portfolio_urls.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Portfolio</p>
                                    <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 overflow-hidden">
                                        {detail.profile.portfolio_urls.map((item, i) => (
                                            <div key={i} className="px-4 py-3">
                                                <p className="text-sm font-medium text-gray-800">{item.title || item.url || String(item)}</p>
                                                {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                                                {item.url && <a href={String(item.url)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Visit ↗</a>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Education */}
                            {detail.profile?.education && detail.profile.education.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Education</p>
                                    <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 overflow-hidden">
                                        {detail.profile.education.map((edu, i) => (
                                            <div key={i} className="px-4 py-3">
                                                <p className="text-sm font-medium text-gray-800">{edu.degree || String(edu)}{edu.field ? ` in ${edu.field}` : ''}</p>
                                                {edu.institution && <p className="text-xs text-gray-500">{edu.institution}{edu.year ? ` · ${edu.year}` : ''}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AI Results */}
                            {detail.ai_confidence && (
                                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        AI Analysis
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-500">Confidence Score</span>
                                                <span
                                                    className="font-bold"
                                                    style={{ color: confidenceColor(parseFloat(detail.ai_confidence)) }}
                                                >
                                                    {Math.round(parseFloat(detail.ai_confidence) * 100)}%
                                                </span>
                                            </div>
                                            <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.round(parseFloat(detail.ai_confidence) * 100)}%`,
                                                        backgroundColor: confidenceColor(parseFloat(detail.ai_confidence)),
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {detail.ai_model_version && (
                                        <p className="text-xs text-gray-400">
                                            Model: {detail.ai_model_version}
                                        </p>
                                    )}
                                    {(() => {
                                        const aiResult = parseJson(detail.ai_result);
                                        if (!aiResult) return null;
                                        return (
                                            <div className="text-xs space-y-1">
                                                {typeof aiResult.decision === 'string' && aiResult.decision && (
                                                    <p>
                                                        <span className="text-gray-500">Decision:</span>{" "}
                                                        <span className="font-medium capitalize">
                                                            {String(aiResult.decision).replace(/_/g, " ")}
                                                        </span>
                                                    </p>
                                                )}
                                                {Array.isArray(aiResult.checks) && aiResult.checks.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-gray-500 mb-1">Checks:</p>
                                                        <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                                                            {(aiResult.checks as string[]).map((check: string, i: number) => (
                                                                <li key={i}>{check}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Submitted Data — formatted cards */}
                            {detail.data && (() => {
                                const data = parseJson(detail.data);
                                if (!data) return null;
                                return (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                            Verification Request Data
                                        </p>
                                        <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 overflow-hidden">
                                            {Object.entries(data).map(([key, val]) => (
                                                <div key={key} className="px-4 py-3">
                                                    <p className="text-xs text-gray-400 capitalize mb-0.5">
                                                        {key.replace(/_/g, " ")}
                                                    </p>
                                                    <p className="text-sm font-medium text-gray-800 break-words">
                                                        {formatValue(val)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Reviewer Notes */}
                            {detail.reviewer_notes && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">
                                        Reviewer Notes
                                    </p>
                                    <p className="text-sm text-yellow-800">{detail.reviewer_notes}</p>
                                </div>
                            )}

                            {/* ── Conversation Thread ──────────────────── */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                                        💬 Conversation Thread
                                        {conversation.length > 0 && (
                                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                                                {conversation.length}
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <div className="max-h-80 overflow-y-auto px-4 py-3 space-y-3 bg-white">
                                    {conversation.length === 0 && (
                                        <p className="text-xs text-gray-400 text-center py-4">
                                            No messages yet. Send a message to start the conversation.
                                        </p>
                                    )}
                                    {conversation.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.sender === "admin" ? "justify-start" : "justify-end"}`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${msg.sender === "admin"
                                                        ? "bg-blue-50 text-blue-900 border border-blue-100"
                                                        : "bg-indigo-600 text-white"
                                                    }`}
                                            >
                                                {msg.sender === "admin" && msg.title && (
                                                    <p className="text-[10px] font-semibold text-blue-500 mb-0.5">
                                                        {msg.title}
                                                    </p>
                                                )}
                                                {msg.sender === "user" && (
                                                    <p className="text-[10px] font-semibold text-indigo-200 mb-0.5">
                                                        👤 {detail.display_name}
                                                    </p>
                                                )}
                                                <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                                                {msg.attachment && (
                                                    <a
                                                        href={fileUrl(msg.attachment.file_url)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`inline-flex items-center gap-1.5 mt-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${msg.sender === "admin"
                                                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                                : "bg-indigo-500 text-white hover:bg-indigo-400"
                                                            }`}
                                                    >
                                                        📎 {msg.attachment.file_name}
                                                        {msg.attachment.file_size > 0 && (
                                                            <span className="opacity-70">
                                                                ({(msg.attachment.file_size / 1024).toFixed(0)} KB)
                                                            </span>
                                                        )}
                                                    </a>
                                                )}
                                                <p className={`text-[10px] mt-1 ${msg.sender === "admin" ? "text-blue-400" : "text-indigo-300"
                                                    }`}>
                                                    {new Date(msg.timestamp).toLocaleString("en-US", {
                                                        month: "short", day: "numeric",
                                                        hour: "2-digit", minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={threadEndRef} />
                                </div>

                                {/* Admin reply input */}
                                <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                                    <div className="flex gap-2">
                                        <textarea
                                            value={adminReply}
                                            onChange={(e) => setAdminReply(e.target.value)}
                                            placeholder="Send a message to the user…"
                                            rows={2}
                                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendAdminReply();
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={handleSendAdminReply}
                                            disabled={!adminReply.trim() || sendingReply}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-end"
                                        >
                                            {sendingReply ? "…" : "Send"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Quick actions */}
                            <div className="flex gap-2 pt-2 border-t border-gray-100">
                                <button
                                    onClick={() => { setDetail(null); openAction(detail, "approve"); }}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                >
                                    ✅ Approve
                                </button>
                                <button
                                    onClick={() => { setDetail(null); openAction(detail, "request-info"); }}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                >
                                    📋 Request Info
                                </button>
                                <button
                                    onClick={() => { setDetail(null); openAction(detail, "reject"); }}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                >
                                    ❌ Decline
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Action modal ──────────────────────── */}
            <ActionModal
                open={!!selected}
                title={modalTitle[action] ?? "Review"}
                onClose={() => { setSelected(null); setReason(""); }}
                onConfirm={handleAction}
                confirmLabel={modalConfirmLabel[action] ?? "Confirm"}
                confirmColor={modalColor[action] ?? "orange"}
                loading={modalLoading}
            >
                {selected && (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                            {action === "approve" && (
                                <>
                                    Approve <strong>{typeLabel(selected.type)}</strong> verification for{" "}
                                    <strong>{selected.display_name}</strong>?
                                </>
                            )}
                            {action === "reject" && (
                                <>
                                    Decline <strong>{typeLabel(selected.type)}</strong> verification for{" "}
                                    <strong>{selected.display_name}</strong>
                                </>
                            )}
                            {action === "request-info" && (
                                <>
                                    Request more information from{" "}
                                    <strong>{selected.display_name}</strong> about their{" "}
                                    <strong>{typeLabel(selected.type)}</strong> verification.
                                    The user will receive a notification with your message.
                                </>
                            )}
                        </p>

                        {selected.ai_confidence && (
                            <div className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2">
                                <span className="text-gray-500">AI Score:</span>
                                <span
                                    className="font-bold"
                                    style={{ color: confidenceColor(parseFloat(selected.ai_confidence)) }}
                                >
                                    {Math.round(parseFloat(selected.ai_confidence) * 100)}%
                                </span>
                            </div>
                        )}

                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={modalPlaceholder[action]}
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                            required={action === "request-info"}
                        />

                        {action === "request-info" && !reason.trim() && (
                            <p className="text-xs text-amber-600">
                                ⚠️ A message is required when requesting more information
                            </p>
                        )}
                    </div>
                )}
            </ActionModal>
        </div>
    );
}
