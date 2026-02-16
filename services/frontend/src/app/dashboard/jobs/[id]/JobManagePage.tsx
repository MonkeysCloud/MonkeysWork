"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ALL_COUNTRIES from "@/data/countries";

const REGION_LABELS: Record<string, string> = {
    north_america: "🌎 North America",
    europe: "🇪🇺 Europe",
    latin_america: "🌎 Latin America",
    asia_pacific: "🌏 Asia Pacific",
    middle_east_africa: "🌍 Middle East & Africa",
};

function toArr(v: unknown): string[] {
    if (Array.isArray(v)) return v;
    if (typeof v === "string") try { const p = JSON.parse(v); if (Array.isArray(p)) return p; } catch { /* noop */ }
    return [];
}

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* File URLs are relative (/files/attachments/...) — resolve against the API origin */
const API_ORIGIN = API_BASE.replace(/\/api\/v1$/, "");

type Job = {
    id: string;
    client_id: string;
    title: string;
    slug: string;
    description: string;
    description_html?: string;
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
    moderation_status?: string;
    moderation_ai_confidence?: string | number;
    moderation_ai_result?: {
        confidence?: number;
        flags?: string[];
        quality_score?: number;
        model?: string;
    } | null;
    moderation_reviewer_notes?: string;
    moderation_reviewed_at?: string;
    location_type?: string;
    location_regions?: string[];
    location_countries?: string[];
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
    pending_review: {
        label: "Pending Review",
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: "🔍",
    },
    open: {
        label: "Published",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: "🟢",
    },
    approved: {
        label: "Approved",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: "✅",
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
    rejected: {
        label: "Rejected",
        color: "bg-red-100 text-red-700 border-red-200",
        icon: "❌",
    },
    revision_requested: {
        label: "Revision Requested",
        color: "bg-amber-100 text-amber-800 border-amber-200",
        icon: "📝",
    },
    suspended: {
        label: "Suspended",
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: "⏸️",
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
    const { token, user } = useAuth();

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [previewAtt, setPreviewAtt] = useState<Attachment | null>(null);

    const isOwner = !!(job && user && job.client_id === user.id);
    const [isSaved, setIsSaved] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        title: string;
        message: string;
        action: "publish" | "close" | "delete";
        variant: "primary" | "danger";
    }>({ open: false, title: "", message: "", action: "publish", variant: "primary" });

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

    // Check if job is saved (freelancer only)
    useEffect(() => {
        if (!job || isOwner || !token) return;
        fetch(`${API_BASE}/saved-jobs/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((b) => setIsSaved(b.data?.saved ?? false))
            .catch(() => { });
    }, [job, isOwner, id, token]);

    async function toggleSaveJob() {
        if (!token) return;
        setSaveLoading(true);
        try {
            const method = isSaved ? "DELETE" : "POST";
            const res = await fetch(`${API_BASE}/saved-jobs/${id}`, {
                method,
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setIsSaved(!isSaved);
                showToast(isSaved ? "Job removed from saved" : "Job saved!");
            }
        } catch { /* noop */ }
        setSaveLoading(false);
    }

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    }

    function requestAction(
        action: "publish" | "close" | "delete",
        title: string,
        message: string,
        variant: "primary" | "danger" = "primary",
    ) {
        setConfirmModal({ open: true, title, message, action, variant });
    }

    async function executeAction(action: "publish" | "close" | "delete") {
        setConfirmModal((prev) => ({ ...prev, open: false }));
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
            const body = await res.json().catch(() => ({}));
            if (res.ok) {
                if (action === "delete") {
                    router.push("/dashboard/jobs");
                    return;
                }
                if (action === "publish") {
                    const mStatus = body.moderation_status;
                    if (mStatus === "auto_approved") {
                        showToast("Job approved and published! 🎉");
                    } else if (mStatus === "auto_rejected") {
                        showToast("Job did not pass content review. Please revise and try again.");
                    } else {
                        showToast("Job submitted for review. You'll be notified once reviewed.");
                    }
                } else {
                    showToast("Job closed.");
                }
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
        <>
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

                {/* Action buttons — client only */}
                {isOwner && (
                    <div className="bg-white rounded-2xl border border-brand-border/60 p-6 mb-6">
                        <h2 className="text-sm font-bold text-brand-dark uppercase tracking-wide mb-4">
                            Actions
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {(job.status === "draft" || job.status === "revision_requested" || job.status === "rejected") && (
                                <button
                                    onClick={() =>
                                        requestAction(
                                            "publish",
                                            job.status === "draft" ? "Submit for Review" : "Resubmit for Review",
                                            job.status === "draft"
                                                ? "Your job will be checked by our AI moderation system before going live. This usually takes just a few seconds."
                                                : "Your revised job will be resubmitted for moderation review.",
                                        )
                                    }
                                    disabled={actionLoading}
                                    className="px-5 py-2.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_32px_rgba(240,138,17,0.55)] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
                                >
                                    {actionLoading ? "Submitting…" : job.status === "draft" ? "🚀 Submit for Review" : "🔄 Resubmit"}
                                </button>
                            )}
                            {(job.status === "draft" || job.status === "open" || job.status === "revision_requested" || job.status === "rejected") && (
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
                                        requestAction(
                                            "close",
                                            "Close Job",
                                            "This job will no longer accept new proposals. You can still manage existing proposals and contracts.",
                                            "danger",
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
                                        requestAction(
                                            "delete",
                                            "Delete Job",
                                            "This will permanently delete this job and all associated data. This action cannot be undone.",
                                            "danger",
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
                )}

                {/* Freelancer CTA */}
                {!isOwner && job.status === "open" && (
                    <div className="bg-gradient-to-r from-brand-orange/5 to-amber-50 rounded-2xl border border-brand-orange/20 p-6 mb-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-brand-dark mb-1">Interested in this job?</h2>
                                <p className="text-sm text-brand-muted">Submit a proposal to let the client know you&apos;re the right fit.</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <button
                                    onClick={toggleSaveJob}
                                    disabled={saveLoading}
                                    className={`px-4 py-3 text-sm font-semibold rounded-xl border transition-all duration-200 ${isSaved
                                            ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                                            : "bg-white text-brand-dark border-brand-border/60 hover:border-brand-dark/30 hover:shadow-sm"
                                        }`}
                                >
                                    {saveLoading ? "…" : isSaved ? "❤️ Saved" : "🤍 Save Job"}
                                </button>
                                <button
                                    onClick={() => router.push(`/dashboard/jobs/${id}/proposal`)}
                                    className="px-6 py-3 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_32px_rgba(240,138,17,0.55)] transition-all duration-200 hover:-translate-y-0.5"
                                >
                                    📝 Submit Proposal
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Moderation Status Card (client only) ── */}
                {isOwner && job.moderation_status && job.moderation_status !== "none" && (
                    <div className={`rounded-2xl border p-6 mb-6 ${job.status === "rejected" ? "bg-red-50 border-red-200" :
                        job.status === "revision_requested" ? "bg-amber-50 border-amber-200" :
                            job.status === "pending_review" ? "bg-orange-50 border-orange-200" :
                                job.status === "open" && job.moderation_status.includes("approved") ? "bg-emerald-50 border-emerald-200" :
                                    "bg-gray-50 border-gray-200"
                        }`}>
                        <h2 className="text-sm font-bold text-brand-dark uppercase tracking-wide mb-3">
                            🔍 Moderation Status
                        </h2>

                        <div className="flex items-center gap-3 mb-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${statusConfig[job.status]?.color || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                {statusConfig[job.status]?.icon} {statusConfig[job.status]?.label || job.status}
                            </span>
                            <span className="text-xs text-brand-muted">
                                {job.moderation_status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                        </div>

                        {/* AI confidence */}
                        {job.moderation_ai_confidence && Number(job.moderation_ai_confidence) > 0 && (
                            <div className="mb-3">
                                <div className="text-xs text-brand-muted mb-1">AI Quality Score</div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${Number(job.moderation_ai_confidence) >= 0.85 ? "bg-emerald-500" :
                                                Number(job.moderation_ai_confidence) >= 0.5 ? "bg-yellow-500" : "bg-red-500"
                                                }`}
                                            style={{ width: `${Math.round(Number(job.moderation_ai_confidence) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold">{(Number(job.moderation_ai_confidence) * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                        )}

                        {/* Flags */}
                        {job.moderation_ai_result?.flags && job.moderation_ai_result.flags.length > 0 && (
                            <div className="mb-3">
                                <div className="text-xs text-brand-muted mb-1">Issues Flagged</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {job.moderation_ai_result.flags.map((f) => (
                                        <span key={f} className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium">
                                            {f.replace(/_/g, " ")}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reviewer notes */}
                        {job.moderation_reviewer_notes && (
                            <div className="bg-white rounded-lg border border-brand-border/40 p-4 mt-3">
                                <div className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1">
                                    Admin Notes
                                </div>
                                <p className="text-sm text-brand-dark whitespace-pre-wrap">
                                    {job.moderation_reviewer_notes}
                                </p>
                                {job.moderation_reviewed_at && (
                                    <p className="text-xs text-brand-muted mt-2">
                                        {formatDate(job.moderation_reviewed_at)}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* State-specific messages */}
                        {job.status === "pending_review" && (
                            <p className="text-sm text-orange-700 mt-3">
                                Your job is being reviewed by our team. You&apos;ll receive a notification once it&apos;s approved.
                            </p>
                        )}
                        {job.status === "rejected" && (
                            <p className="text-sm text-red-700 mt-3">
                                Your job posting was not approved. Please review the feedback above, make necessary changes, and resubmit.
                            </p>
                        )}
                        {job.status === "revision_requested" && (
                            <p className="text-sm text-amber-700 mt-3">
                                An admin has requested changes. Please update your job based on the notes above and click &quot;Resubmit&quot;.
                            </p>
                        )}
                    </div>
                )}

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
                    <DetailRow
                        label="Location"
                        value={
                            job.location_type === "regions"
                                ? `🗺️ ${toArr(job.location_regions).map((r) => REGION_LABELS[r] ?? r).join(", ") || "Regions"}`
                                : job.location_type === "countries"
                                    ? `🏁 ${toArr(job.location_countries).map((cc) => ALL_COUNTRIES.find((c) => c.code === cc)?.name ?? cc).join(", ") || "Countries"}`
                                    : "🌍 Worldwide"
                        }
                    />

                    <div className="border-t border-brand-border/40 pt-4">
                        <div className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">
                            Description
                        </div>
                        <div
                            className="text-sm text-brand-dark leading-relaxed prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: job.description_html || job.description }}
                        />
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

            {/* ── Confirmation Modal ── */}
            {
                confirmModal.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setConfirmModal((p) => ({ ...p, open: false }))}
                        />
                        {/* Modal */}
                        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-brand-border/30 animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${confirmModal.variant === "danger"
                                        ? "bg-red-100 text-red-600"
                                        : "bg-orange-100 text-brand-orange"
                                        }`}>
                                        {confirmModal.variant === "danger" ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-brand-dark">
                                            {confirmModal.title}
                                        </h3>
                                        <p className="mt-2 text-sm text-brand-muted leading-relaxed">
                                            {confirmModal.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border/30 bg-gray-50/50 rounded-b-2xl">
                                <button
                                    onClick={() => setConfirmModal((p) => ({ ...p, open: false }))}
                                    className="px-4 py-2 text-sm font-semibold text-brand-muted hover:text-brand-dark rounded-lg hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => executeAction(confirmModal.action)}
                                    className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow-md transition-all duration-200 hover:-translate-y-0.5 ${confirmModal.variant === "danger"
                                        ? "bg-red-500 hover:bg-red-600 shadow-red-500/30 hover:shadow-red-500/50"
                                        : "bg-brand-orange hover:bg-brand-orange-hover shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_32px_rgba(240,138,17,0.55)]"
                                        }`}
                                >
                                    {confirmModal.action === "publish" ? "Submit" : confirmModal.action === "close" ? "Close Job" : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
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
