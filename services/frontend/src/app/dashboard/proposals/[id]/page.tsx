"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Types ─────────────────────────────────────────── */
interface Proposal {
    id: string;
    job_id: string;
    job_title: string;
    freelancer_id: string;
    client_id: string;
    cover_letter: string;
    bid_amount: number;
    bid_type?: string;
    estimated_duration_days?: number;
    milestones_proposed?: string;
    status: string;
    viewed_at?: string;
    shortlisted_at?: string;
    created_at: string;
    updated_at: string;
}

interface Job {
    id: string;
    title: string;
    description: string;
    category?: string;
    budget_min?: number;
    budget_max?: number;
    budget_type?: string;
    experience_level?: string;
    expected_duration?: string;
    skills?: { id: string; name: string; slug: string }[];
    status: string;
    created_at: string;
}

/* ── Status badge config ───────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    submitted: { label: "Pending Review", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: "⏳" },
    viewed: { label: "Viewed by Client", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: "👁️" },
    shortlisted: { label: "Shortlisted", color: "text-violet-700", bg: "bg-violet-50 border-violet-200", icon: "⭐" },
    accepted: { label: "Accepted", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: "✅" },
    rejected: { label: "Declined", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: "❌" },
    withdrawn: { label: "Withdrawn", color: "text-gray-600", bg: "bg-gray-50 border-gray-200", icon: "↩️" },
};

/* ── Helpers ───────────────────────────────────────── */
function formatDate(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function durationLabel(days?: number) {
    if (!days) return null;
    const weeks = Math.round(days / 7);
    if (weeks <= 1) return "Less than 1 week";
    if (weeks <= 2) return "1–2 weeks";
    if (weeks <= 4) return "2–4 weeks";
    if (weeks <= 8) return "1–2 months";
    if (weeks <= 13) return "2–3 months";
    if (weeks <= 26) return "3–6 months";
    return "6+ months";
}

/* ── Page component ────────────────────────────────── */
export default function ProposalDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { token, user } = useAuth();
    const router = useRouter();

    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

    const isClient = user?.role === "client";

    // Fetch proposal
    useEffect(() => {
        if (!token || !id) return;
        setLoading(true);
        fetch(`${API_BASE}/proposals/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => {
                if (!r.ok) throw new Error(r.status === 404 ? "Proposal not found" : "Failed to load proposal");
                return r.json();
            })
            .then((b) => {
                setProposal(b.data);
                // Fetch the job details
                return fetch(`${API_BASE}/jobs/${b.data.job_id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            })
            .then((r) => r.json())
            .then((b) => setJob(b.data))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [token, id]);

    // Client actions
    const handleAction = useCallback(
        async (action: "accept" | "reject" | "shortlist") => {
            if (!token || !id) return;
            setActionLoading(action);
            setActionSuccess(null);
            try {
                const res = await fetch(`${API_BASE}/proposals/${id}/${action}`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.message || `Failed to ${action} proposal`);
                }
                const body = await res.json();
                // Update local status
                setProposal((prev) =>
                    prev ? { ...prev, status: body.data?.status || action + "ed" } : prev
                );
                setActionSuccess(
                    action === "accept"
                        ? "Proposal accepted! A contract will be created."
                        : action === "reject"
                            ? "Proposal declined."
                            : "Proposal shortlisted."
                );
            } catch (e: unknown) {
                setError((e as Error).message);
            } finally {
                setActionLoading(null);
            }
        },
        [token, id]
    );

    // Loading
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
            </div>
        );
    }

    // Error
    if (error && !proposal) {
        return (
            <div className="max-w-3xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                    <div className="text-4xl mb-3">⚠️</div>
                    <h1 className="text-lg font-bold text-red-800 mb-2">{error}</h1>
                    <Link
                        href="/dashboard/proposals"
                        className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-brand-dark bg-white border border-brand-border hover:bg-gray-50 rounded-xl transition-colors mt-2"
                    >
                        ← Back to Proposals
                    </Link>
                </div>
            </div>
        );
    }

    if (!proposal) return null;

    const st = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.submitted;
    const canAct =
        isClient &&
        ["submitted", "viewed", "shortlisted"].includes(proposal.status);

    return (
        <div className="max-w-3xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-brand-muted mb-5">
                <Link
                    href="/dashboard/proposals"
                    className="hover:text-brand-orange transition-colors"
                >
                    {isClient ? "Proposals Received" : "My Proposals"}
                </Link>
                <span>/</span>
                <span className="text-brand-dark font-medium truncate">
                    {proposal.job_title}
                </span>
            </div>

            {/* ── Status Banner ─────────────────────────── */}
            <div
                className={`rounded-2xl border p-4 mb-6 flex items-center justify-between ${st.bg}`}
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{st.icon}</span>
                    <div>
                        <p className={`text-sm font-bold ${st.color}`}>
                            {st.label}
                        </p>
                        <p className="text-xs text-brand-muted">
                            Last updated {formatDate(proposal.updated_at)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Action success */}
            {actionSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 text-sm text-emerald-700 font-medium">
                    ✅ {actionSuccess}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-sm text-red-700">
                    ⚠️ {error}
                </div>
            )}

            {/* ── Proposal Details Card ─────────────────── */}
            <div className="bg-white rounded-2xl border border-brand-border/60 p-6 mb-4">
                <h2 className="text-lg font-extrabold text-brand-dark mb-4">
                    📝 Proposal Details
                </h2>

                {/* Key metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                    <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 px-4 py-3">
                        <p className="text-[11px] font-semibold text-brand-muted uppercase tracking-wide mb-0.5">
                            Bid Amount
                        </p>
                        <p className="text-xl font-bold text-emerald-700">
                            ${Number(proposal.bid_amount).toLocaleString()}
                            {proposal.bid_type === "hourly" && (
                                <span className="text-sm font-medium">/hr</span>
                            )}
                        </p>
                    </div>
                    <div className="bg-blue-50/50 rounded-xl border border-blue-100 px-4 py-3">
                        <p className="text-[11px] font-semibold text-brand-muted uppercase tracking-wide mb-0.5">
                            Duration
                        </p>
                        <p className="text-base font-bold text-blue-700">
                            {durationLabel(proposal.estimated_duration_days) || "—"}
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                        <p className="text-[11px] font-semibold text-brand-muted uppercase tracking-wide mb-0.5">
                            Submitted
                        </p>
                        <p className="text-sm font-semibold text-brand-dark">
                            {formatDate(proposal.created_at)}
                        </p>
                    </div>
                </div>

                {/* Cover letter */}
                <div className="mb-4">
                    <h3 className="text-sm font-bold text-brand-dark mb-2">
                        Cover Letter
                    </h3>
                    <div
                        className="prose prose-sm max-w-none text-brand-dark/80 bg-slate-50 rounded-xl border border-brand-border/40 p-4"
                        dangerouslySetInnerHTML={{ __html: proposal.cover_letter }}
                    />
                </div>

                {/* Milestones */}
                {proposal.milestones_proposed && (
                    <div>
                        <h3 className="text-sm font-bold text-brand-dark mb-2">
                            Proposed Milestones
                        </h3>
                        <div className="text-sm text-brand-dark/80 bg-slate-50 rounded-xl border border-brand-border/40 p-4 whitespace-pre-wrap">
                            {proposal.milestones_proposed}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Job Details Card ──────────────────────── */}
            {job && (
                <div className="bg-white rounded-2xl border border-brand-border/60 p-6 mb-4">
                    <div className="flex items-start justify-between mb-4">
                        <h2 className="text-lg font-extrabold text-brand-dark">
                            💼 Job Details
                        </h2>
                        <Link
                            href={`/dashboard/jobs/${job.id}`}
                            className="text-sm font-semibold text-brand-orange hover:underline"
                        >
                            View Full Job →
                        </Link>
                    </div>

                    <h3 className="text-base font-bold text-brand-dark mb-2">
                        {job.title}
                    </h3>

                    {/* Job meta */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {job.category && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 text-xs font-medium">
                                📂 {job.category}
                            </span>
                        )}
                        {job.experience_level && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 text-xs font-medium">
                                📊 {job.experience_level}
                            </span>
                        )}
                        {(job.budget_min || job.budget_max) && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-medium">
                                💰 ${job.budget_min?.toLocaleString()}
                                {job.budget_max ? ` – $${job.budget_max.toLocaleString()}` : ""}
                                {job.budget_type === "hourly" ? "/hr" : ""}
                            </span>
                        )}
                        {job.expected_duration && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium">
                                🕐 {job.expected_duration}
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <div
                        className="prose prose-sm max-w-none text-brand-dark/80 line-clamp-6"
                        dangerouslySetInnerHTML={{ __html: job.description }}
                    />

                    {/* Skills */}
                    {job.skills && job.skills.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                            {job.skills.map((s) => (
                                <span
                                    key={s.id || s.slug}
                                    className="px-2.5 py-1 rounded-full bg-brand-orange/8 text-brand-orange text-xs font-medium border border-brand-orange/15"
                                >
                                    {s.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Client Action Buttons ─────────────────── */}
            {canAct && (
                <div className="bg-white rounded-2xl border border-brand-border/60 p-6 mb-4">
                    <h2 className="text-base font-extrabold text-brand-dark mb-3">
                        ⚡ Actions
                    </h2>
                    <p className="text-sm text-brand-muted mb-4">
                        Review this proposal and take action.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => handleAction("accept")}
                            disabled={!!actionLoading}
                            className="flex-1 min-w-[140px] px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {actionLoading === "accept" ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                    Accepting…
                                </span>
                            ) : (
                                "✅ Accept Proposal"
                            )}
                        </button>

                        {proposal.status !== "shortlisted" && (
                            <button
                                onClick={() => handleAction("shortlist")}
                                disabled={!!actionLoading}
                                className="flex-1 min-w-[140px] px-6 py-3 text-sm font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {actionLoading === "shortlist" ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-700" />
                                        Shortlisting…
                                    </span>
                                ) : (
                                    "⭐ Shortlist"
                                )}
                            </button>
                        )}

                        <button
                            onClick={() => handleAction("reject")}
                            disabled={!!actionLoading}
                            className="flex-1 min-w-[140px] px-6 py-3 text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {actionLoading === "reject" ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700" />
                                    Declining…
                                </span>
                            ) : (
                                "❌ Decline"
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Bottom nav ────────────────────────────── */}
            <div className="flex justify-between items-center pt-2">
                <Link
                    href="/dashboard/proposals"
                    className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-brand-dark bg-white border border-brand-border hover:bg-gray-50 rounded-xl transition-colors"
                >
                    ← All Proposals
                </Link>
                <Link
                    href={`/dashboard/jobs/${proposal.job_id}`}
                    className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl transition-colors"
                >
                    View Job →
                </Link>
            </div>
        </div>
    );
}
