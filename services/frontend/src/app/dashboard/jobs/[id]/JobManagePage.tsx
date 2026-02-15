"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* File URLs are relative (/files/attachments/...) — resolve against the API origin */
const API_ORIGIN = API_BASE.replace(/\/api\/v1$/, "");

type Job = {
    id: string;
    title: string;
    slug: string;
    description: string;
    status: string;
    budget_type: string;
    budget_min: number;
    budget_max: number;
    currency: string;
    experience_level: string;
    visibility: string;
    category_name?: string;
    client_name?: string;
    published_at?: string;
    created_at?: string;
    skills?: { id: string; name: string; slug: string }[];
    attachments?: Attachment[];
};

type Attachment = {
    id: string;
    file_name: string;
    file_url: string;
    file_size: number;
    mime_type: string;
};

const statusConfig: Record<
    string,
    { label: string; color: string; icon: string }
> = {
    draft: {
        label: "Draft",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: "📝",
    },
    open: {
        label: "Published",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: "🟢",
    },
    in_progress: {
        label: "In Progress",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: "🔄",
    },
    completed: {
        label: "Completed",
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
        icon: "✅",
    },
    cancelled: {
        label: "Closed",
        color: "bg-gray-100 text-gray-600 border-gray-200",
        icon: "🚫",
    },
};

function formatBytes(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function fileUrl(relPath: string) {
    return `${API_ORIGIN}${relPath}`;
}

export default function JobManagePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { token } = useAuth();

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [previewAtt, setPreviewAtt] = useState<Attachment | null>(null);

    const fetchJob = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/jobs/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const body = await res.json();
            if (res.ok) {
                setJob(body.data);
            } else {
                setError(body.message || "Job not found");
            }
        } catch {
            setError("Failed to load job");
        } finally {
            setLoading(false);
        }
    }, [id, token]);

    useEffect(() => {
        fetchJob();
    }, [fetchJob]);

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    }

    async function handleAction(
        action: "publish" | "close" | "delete",
        confirmMsg: string,
    ) {
        if (!confirm(confirmMsg)) return;
        setActionLoading(true);
        try {
            const method = action === "delete" ? "DELETE" : "POST";
            const url =
                action === "delete"
                    ? `${API_BASE}/jobs/${id}`
                    : `${API_BASE}/jobs/${id}/${action}`;
            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                if (action === "delete") {
                    router.push("/dashboard");
                    return;
                }
                showToast(
                    action === "publish"
                        ? "Job published successfully!"
                        : "Job closed.",
                );
                await fetchJob();
            } else {
                const body = await res.json();
                setError(body.message || `Failed to ${action}`);
            }
        } catch {
            setError(`Failed to ${action}. Please try again.`);
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto py-16 text-center">
                <div className="animate-spin w-8 h-8 border-3 border-brand-orange border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-brand-muted mt-4">Loading job…</p>
            </div>
        );
    }

    if (error && !job) {
        return (
            <div className="max-w-3xl mx-auto py-16 text-center">
                <div className="text-4xl mb-4">😕</div>
                <h2 className="text-xl font-bold text-brand-dark mb-2">
                    Job Not Found
                </h2>
                <p className="text-sm text-brand-muted mb-6">{error}</p>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="px-5 py-2.5 text-sm font-semibold text-brand-dark border border-brand-border/60 rounded-xl hover:border-brand-dark/30 hover:shadow-sm transition-all"
                >
                    ← Back to Dashboard
                </button>
            </div>
        );
    }

    if (!job) return null;

    const st = statusConfig[job.status] ?? statusConfig.draft;

    return (
        <div className="max-w-3xl mx-auto">
            {/* Toast */}
            {toast && (
                <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-lg">
                    {toast}
                </div>
            )}

            {/* ── Preview / Download Modal ── */}
            {previewAtt && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setPreviewAtt(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/40">
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-bold text-brand-dark truncate">
                                    {previewAtt.file_name}
                                </h3>
                                <p className="text-xs text-brand-muted mt-0.5">
                                    {formatBytes(previewAtt.file_size)} · {previewAtt.mime_type}
                                </p>
                            </div>
                            <button
                                onClick={() => setPreviewAtt(null)}
                                className="ml-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-brand-muted hover:text-brand-dark transition-colors text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal body — image preview, PDF embed, or fallback icon */}
                        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-gray-50/50">
                            {previewAtt.mime_type?.startsWith("image/") ? (
                                <img
                                    src={fileUrl(previewAtt.file_url)}
                                    alt={previewAtt.file_name}
                                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm"
                                />
                            ) : previewAtt.mime_type === "application/pdf" ? (
                                <iframe
                                    src={fileUrl(previewAtt.file_url)}
                                    title={previewAtt.file_name}
                                    className="w-full h-[60vh] rounded-lg border border-brand-border/40"
                                />
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-5xl mb-4">📄</div>
                                    <p className="text-sm text-brand-dark font-semibold mb-1">
                                        {previewAtt.file_name}
                                    </p>
                                    <p className="text-xs text-brand-muted">
                                        Preview not available for this file type
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal footer — download & open buttons */}
                        <div className="flex items-center gap-3 px-6 py-4 border-t border-brand-border/40">
                            <button
                                type="button"
                                onClick={() => {
                                    window.open(
                                        `${API_BASE}/attachments/download/${previewAtt.id}`,
                                        "_self"
                                    );
                                }}
                                className="px-5 py-2.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_32px_rgba(240,138,17,0.55)] transition-all duration-200 hover:-translate-y-0.5"
                            >
                                ⬇️ Download
                            </button>
                            <a
                                href={fileUrl(previewAtt.file_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2.5 text-sm font-semibold text-brand-dark border border-brand-border/60 rounded-xl hover:border-brand-dark/30 hover:shadow-sm transition-all"
                            >
                                ↗ Open in New Tab
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-8">
                <div className="flex-1 min-w-0">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="text-xs text-brand-muted hover:text-brand-dark transition-colors mb-3 flex items-center gap-1"
                    >
                        ← Back to Dashboard
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight truncate">
                        {job.title}
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${st.color}`}
                        >
                            {st.icon} {st.label}
                        </span>
                        <span className="text-xs text-brand-muted">
                            Created {formatDate(job.created_at)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
                    {error}
                </div>
            )}

            {/* Action buttons */}
            <div className="bg-white rounded-2xl border border-brand-border/60 p-6 mb-6">
                <h2 className="text-sm font-bold text-brand-dark uppercase tracking-wide mb-4">
                    Actions
                </h2>
                <div className="flex flex-wrap gap-3">
                    {job.status === "draft" && (
                        <button
                            onClick={() =>
                                handleAction(
                                    "publish",
                                    "Publish this job? It will be visible to freelancers.",
                                )
                            }
                            disabled={actionLoading}
                            className="px-5 py-2.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_32px_rgba(240,138,17,0.55)] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
                        >
                            {actionLoading ? "Publishing…" : "🚀 Publish Now"}
                        </button>
                    )}
                    {(job.status === "draft" || job.status === "open") && (
                        <button
                            onClick={() =>
                                router.push(`/dashboard/jobs/${id}/edit`)
                            }
                            className="px-5 py-2.5 text-sm font-semibold text-brand-dark border border-brand-border/60 rounded-xl hover:border-brand-dark/30 hover:shadow-sm transition-all"
                        >
                            ✏️ Edit Job
                        </button>
                    )}
                    {job.status === "open" && (
                        <button
                            onClick={() =>
                                handleAction(
                                    "close",
                                    "Close this job? It will no longer accept proposals.",
                                )
                            }
                            disabled={actionLoading}
                            className="px-5 py-2.5 text-sm font-semibold text-yellow-700 border border-yellow-300 rounded-xl hover:bg-yellow-50 transition-all disabled:opacity-60"
                        >
                            ⏸️ Close Job
                        </button>
                    )}
                    {(job.status === "draft" || job.status === "cancelled") && (
                        <button
                            onClick={() =>
                                handleAction(
                                    "delete",
                                    "Permanently delete this job? This cannot be undone.",
                                )
                            }
                            disabled={actionLoading}
                            className="px-5 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-all disabled:opacity-60"
                        >
                            🗑️ Delete
                        </button>
                    )}
                </div>
            </div>

            {/* Job details */}
            <div className="bg-white rounded-2xl border border-brand-border/60 p-6 sm:p-8 space-y-5 mb-6">
                <h2 className="text-sm font-bold text-brand-dark uppercase tracking-wide">
                    Job Details
                </h2>

                <DetailRow label="Category" value={job.category_name ?? "—"} />
                <DetailRow
                    label="Experience"
                    value={
                        (job.experience_level?.charAt(0).toUpperCase() ?? "") +
                        (job.experience_level?.slice(1) ?? "")
                    }
                />
                <DetailRow
                    label="Budget"
                    value={`${job.budget_type === "hourly" ? "Hourly" : "Fixed"}: $${Number(job.budget_min).toLocaleString()} – $${Number(job.budget_max).toLocaleString()} ${job.currency}`}
                />
                <DetailRow
                    label="Visibility"
                    value={
                        (job.visibility?.charAt(0).toUpperCase() ?? "") +
                        (job.visibility?.slice(1).replace("_", " ") ?? "")
                    }
                />
                {job.published_at && (
                    <DetailRow
                        label="Published"
                        value={formatDate(job.published_at)}
                    />
                )}

                <div className="border-t border-brand-border/40 pt-4">
                    <div className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">
                        Description
                    </div>
                    <p className="text-sm text-brand-dark leading-relaxed whitespace-pre-wrap">
                        {job.description}
                    </p>
                </div>

                {job.skills && job.skills.length > 0 && (
                    <div className="border-t border-brand-border/40 pt-4">
                        <div className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">
                            Skills
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {job.skills.map((s) => (
                                <span
                                    key={s.id}
                                    className="px-2.5 py-1 bg-brand-orange/10 text-brand-orange text-xs font-semibold rounded-full"
                                >
                                    {s.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Attachments */}
            {job.attachments && job.attachments.length > 0 && (
                <div className="bg-white rounded-2xl border border-brand-border/60 p-6 sm:p-8 mb-6">
                    <h2 className="text-sm font-bold text-brand-dark uppercase tracking-wide mb-4">
                        Attachments ({job.attachments.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {job.attachments.map((att) => (
                            <button
                                key={att.id}
                                type="button"
                                onClick={() => setPreviewAtt(att)}
                                className="flex items-center gap-3 p-3 border border-brand-border/40 rounded-lg hover:bg-gray-50 hover:border-brand-orange/30 transition-colors text-left group"
                            >
                                {att.mime_type?.startsWith("image/") ? (
                                    <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 overflow-hidden shrink-0">
                                        <img
                                            src={fileUrl(att.file_url)}
                                            alt={att.file_name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                                        <span className="text-lg">📄</span>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-brand-dark truncate group-hover:text-brand-orange transition-colors">
                                        {att.file_name}
                                    </div>
                                    <div className="text-xs text-brand-muted">
                                        {formatBytes(att.file_size)}
                                    </div>
                                </div>
                                <span className="text-xs text-brand-muted group-hover:text-brand-orange transition-colors">
                                    👁️
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Helper component ── */
function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <div className="text-xs font-semibold text-brand-muted uppercase tracking-wide w-28 shrink-0">
                {label}
            </div>
            <div className="text-sm text-brand-dark">{value}</div>
        </div>
    );
}
