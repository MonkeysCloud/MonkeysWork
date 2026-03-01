"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProposalDetailModal from "./ProposalDetailModal";
import type { ScoredProposal } from "./ProposalDetailModal";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";
const API_ORIGIN = API_BASE.replace(/\/api\/v1$/, "");

function fileUrl(relPath: string) {
    if (relPath.startsWith("http")) return relPath;
    return `${API_ORIGIN}${relPath}`;
}

/* ── Types ────────────────────────────────────────── */
interface Proposal {
    id: string;
    job_id: string;
    job_title: string;
    cover_letter: string;
    bid_amount: number;
    bid_type?: string;
    estimated_duration_days?: number;
    status: string;
    freelancer_id: string;
    freelancer_first_name?: string;
    freelancer_last_name?: string;
    freelancer_email?: string;
    freelancer_avatar?: string;
    freelancer_hourly_rate?: number;
    freelancer_headline?: string;
    freelancer_bio?: string;
    freelancer_experience_years?: number;
    ai_fraud_score?: number;
    created_at: string;
    updated_at: string;
    viewed_at?: string;
    shortlisted_at?: string;
}

interface Job {
    id: string;
    title: string;
    budget_min?: number;
    budget_max?: number;
    budget_type?: string;
    experience_level?: string;
    skills?: { id: string; name: string; slug: string }[];
    status: string;
}

/* ── Status config ────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    submitted: { label: "New", color: "bg-amber-100 text-amber-700 border-amber-200", icon: "🆕" },
    viewed: { label: "Viewed", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "👁️" },
    shortlisted: { label: "Shortlisted", color: "bg-violet-100 text-violet-700 border-violet-200", icon: "⭐" },
    accepted: { label: "Accepted", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "✅" },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200", icon: "❌" },
    withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-600 border-gray-200", icon: "↩️" },
};

const SORT_OPTIONS = [
    { key: "best", label: "Best Match" },
    { key: "newest", label: "Newest First" },
    { key: "oldest", label: "Oldest First" },
    { key: "bid_low", label: "Lowest Bid" },
    { key: "bid_high", label: "Highest Bid" },
] as const;
type SortKey = (typeof SORT_OPTIONS)[number]["key"];

const STATUS_FILTER_OPTIONS = [
    { key: "all", label: "All" },
    { key: "submitted,viewed", label: "New" },
    { key: "shortlisted", label: "Shortlisted" },
    { key: "accepted", label: "Accepted" },
    { key: "rejected", label: "Rejected" },
] as const;

/* ── Helpers ──────────────────────────────────────── */
function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function durationLabel(days?: number) {
    if (!days) return null;
    const weeks = Math.round(days / 7);
    if (weeks <= 1) return "< 1 week";
    if (weeks <= 2) return "1–2 weeks";
    if (weeks <= 4) return "2–4 weeks";
    if (weeks <= 8) return "1–2 months";
    if (weeks <= 13) return "2–3 months";
    if (weeks <= 26) return "3–6 months";
    return "6+ months";
}

function stripHtml(html: string): string {
    if (typeof document === "undefined") return html.replace(/<[^>]*>/g, "");
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

/** Simple score: how good a proposal looks relative to the job */
function computeScore(p: Proposal, job: Job | null): number {
    let score = 50; // base score

    // Budget alignment: closer to mid-range = better
    if (job && job.budget_min && job.budget_max) {
        const bMin = Number(job.budget_min) || 0;
        const bMax = Number(job.budget_max) || 0;
        const mid = (bMin + bMax) / 2;
        const bid = Number(p.bid_amount) || 0;
        const range = bMax - bMin;
        if (range > 0 && !isNaN(bid)) {
            const deviation = Math.abs(bid - mid) / range;
            score += Math.max(0, 20 - deviation * 40); // up to +20
        }
        // Under budget is good
        if (!isNaN(bid) && bid <= bMax) score += 10;
    }

    // Has hourly rate set (professional profile)
    const hr = Number(p.freelancer_hourly_rate) || 0;
    if (hr > 0) score += 10;

    // Has headline (complete profile)
    if (p.freelancer_headline) score += 5;

    // Has experience
    const exp = Number(p.freelancer_experience_years) || 0;
    if (exp > 0) score += 5;

    // Cover letter length (detailed = better, but not too short)
    const clLen = stripHtml(p.cover_letter || "").length;
    if (clLen > 200) score += 5;
    if (clLen > 500) score += 5;

    // Low fraud score is good
    const fraud = Number(p.ai_fraud_score);
    if (!isNaN(fraud) && fraud > 0) {
        score -= Math.round(fraud * 20);
    }

    return Math.min(100, Math.max(0, Math.round(score)));
}

function scoreBadgeColor(score: number): string {
    if (score >= 80) return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (score >= 60) return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-slate-100 text-slate-600 border-slate-300";
}

/* ── Page ─────────────────────────────────────────── */
export default function JobProposalsPage() {
    const { id } = useParams<{ id: string }>();
    const { token, user } = useAuth();
    const isClient = user?.role === "client";

    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<SortKey>("best");
    const [statusFilter, setStatusFilter] = useState("all");
    const [bidMin, setBidMin] = useState("");
    const [bidMax, setBidMax] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [selectedProposal, setSelectedProposal] = useState<ScoredProposal | null>(null);

    // Post-accept modal state
    const [postAcceptModal, setPostAcceptModal] = useState<{
        open: boolean;
        freelancerName: string;
    }>({ open: false, freelancerName: "" });
    const [closingJob, setClosingJob] = useState(false);

    // Fetch job + proposals
    useEffect(() => {
        if (!token || !id) return;
        setLoading(true);

        const fetchJob = fetch(`${API_BASE}/jobs/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json());

        const fetchProposals = fetch(
            `${API_BASE}/proposals/received?job_id=${id}&per_page=200`,
            { headers: { Authorization: `Bearer ${token}` } }
        ).then((r) => r.json());

        Promise.all([fetchJob, fetchProposals])
            .then(([jb, pb]) => {
                if (jb.data) setJob(jb.data);
                setProposals(pb.data || []);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [token, id]);

    // Actions
    async function handleAction(proposalId: string, action: "accept" | "reject" | "shortlist") {
        if (!token) return;
        setActionLoading(proposalId);
        try {
            const res = await fetch(`${API_BASE}/proposals/${proposalId}/${action}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const newStatus = action === "accept" ? "accepted" : action === "reject" ? "rejected" : "shortlisted";
                setProposals((prev) =>
                    prev.map((p) => (p.id === proposalId ? { ...p, status: newStatus } : p))
                );
                // Update modal if open
                if (selectedProposal?.id === proposalId) {
                    setSelectedProposal((prev) => prev ? { ...prev, status: newStatus } : null);
                }
                setToast(`Proposal ${action === "accept" ? "accepted" : action === "reject" ? "rejected" : "shortlisted"}!`);
                setTimeout(() => setToast(null), 3000);

                // Show post-accept modal asking to close or keep job open
                if (action === "accept") {
                    const p = proposals.find((pr) => pr.id === proposalId);
                    const name = p
                        ? `${p.freelancer_first_name || ""} ${p.freelancer_last_name || ""}`.trim() || "the freelancer"
                        : "the freelancer";
                    setPostAcceptModal({ open: true, freelancerName: name });
                }
            }
        } finally {
            setActionLoading(null);
        }
    }

    // Close job after accepting
    async function handleCloseJob() {
        if (!token || !id) return;
        setClosingJob(true);
        try {
            await fetch(`${API_BASE}/jobs/${id}/close`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            setPostAcceptModal({ open: false, freelancerName: "" });
            setToast("Job closed! No more proposals will be accepted.");
            setTimeout(() => setToast(null), 3000);
            if (job) setJob({ ...job, status: "cancelled" });
        } catch (e) {
            console.error(e);
        } finally {
            setClosingJob(false);
        }
    }

    // Filter + sort
    const scored = useMemo(
        () => proposals.map((p) => ({ ...p, _score: computeScore(p, job) })),
        [proposals, job]
    );

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        const minBid = bidMin ? parseFloat(bidMin) : 0;
        const maxBid = bidMax ? parseFloat(bidMax) : Infinity;
        const statuses = statusFilter === "all" ? null : statusFilter.split(",");

        let result = scored.filter((p) => {
            if (statuses && !statuses.includes(p.status)) return false;
            if (q) {
                const searchable = [
                    p.freelancer_first_name,
                    p.freelancer_last_name,
                    p.freelancer_email,
                    p.freelancer_headline,
                    p.freelancer_bio,
                    stripHtml(p.cover_letter),
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                if (!searchable.includes(q)) return false;
            }
            const bid = Number(p.bid_amount);
            if (bid < minBid || bid > maxBid) return false;
            return true;
        });

        result.sort((a, b) => {
            switch (sortBy) {
                case "best": return b._score - a._score;
                case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case "bid_low": return Number(a.bid_amount) - Number(b.bid_amount);
                case "bid_high": return Number(b.bid_amount) - Number(a.bid_amount);
                default: return 0;
            }
        });

        return result;
    }, [scored, search, sortBy, statusFilter, bidMin, bidMax]);

    // Best proposal
    const bestProposal = useMemo(() => {
        if (scored.length === 0) return null;
        return [...scored].sort((a, b) => b._score - a._score)[0];
    }, [scored]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: proposals.length };
        for (const p of proposals) {
            const key = ["submitted", "viewed"].includes(p.status) ? "submitted,viewed" : p.status;
            c[key] = (c[key] || 0) + 1;
        }
        return c;
    }, [proposals]);

    const hasActiveFilters = search || bidMin || bidMax || statusFilter !== "all" || sortBy !== "best";

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
            </div>
        );
    }

    return (
        <>
            <div className="max-w-5xl mx-auto">
                {/* Toast */}
                {toast && (
                    <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-bounce">
                        {toast}
                    </div>
                )}

                {/* Header */}
                <div className="mb-6">
                    <Link href={`/dashboard/jobs/${id}`} className="text-sm text-brand-muted hover:text-brand-orange transition-colors mb-2 inline-flex items-center gap-1">
                        ← Back to Job
                    </Link>
                    <h1 className="text-2xl font-extrabold text-brand-dark mt-1">
                        📋 Proposals for &ldquo;{job?.title || "Job"}&rdquo;
                    </h1>
                    <p className="text-sm text-brand-muted mt-1">
                        {proposals.length} proposal{proposals.length !== 1 ? "s" : ""} received · Review, compare, and take action.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-sm text-red-700">
                        ⚠️ {error}
                    </div>
                )}

                {/* ── Best Proposal Highlight ─────────── */}
                {bestProposal && bestProposal._score >= 60 && proposals.length > 1 && (
                    <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">🏆</span>
                            <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wide">Best Match</h2>
                            <span className={`ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${scoreBadgeColor(bestProposal._score)}`}>
                                {bestProposal._score}% match
                            </span>
                        </div>
                        <div onClick={() => setSelectedProposal(bestProposal)} className="block group cursor-pointer">
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                {bestProposal.freelancer_avatar ? (
                                    <img src={fileUrl(bestProposal.freelancer_avatar)} alt="" className="shrink-0 w-12 h-12 rounded-full object-cover border-2 border-emerald-200" />
                                ) : (
                                    <div className="shrink-0 w-12 h-12 rounded-full bg-brand-orange/15 flex items-center justify-center text-lg font-bold text-brand-orange">
                                        {bestProposal.freelancer_first_name?.[0]?.toUpperCase() || "?"}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-brand-dark group-hover:text-brand-orange transition-colors">
                                            {bestProposal.freelancer_first_name} {bestProposal.freelancer_last_name || ""}
                                        </span>
                                        {bestProposal.freelancer_headline && (
                                            <span className="text-xs text-brand-muted">· {bestProposal.freelancer_headline}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                                            💰 ${Number(bestProposal.bid_amount).toLocaleString()}{bestProposal.bid_type === "hourly" ? "/hr" : ""}
                                        </span>
                                        {bestProposal.estimated_duration_days && (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium">
                                                🕐 {durationLabel(bestProposal.estimated_duration_days)}
                                            </span>
                                        )}
                                        {bestProposal.freelancer_hourly_rate && (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium">
                                                ⏱️ ${bestProposal.freelancer_hourly_rate}/hr rate
                                            </span>
                                        )}
                                        {bestProposal.freelancer_experience_years && bestProposal.freelancer_experience_years > 0 && (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium">
                                                📊 {bestProposal.freelancer_experience_years}yr exp
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-brand-muted/80 line-clamp-2">
                                        {stripHtml(bestProposal.cover_letter || "").slice(0, 200)}
                                    </p>
                                </div>
                                {/* CTA */}
                                {isClient && bestProposal.status !== "accepted" && (
                                    <div className="shrink-0 flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleAction(bestProposal.id, "shortlist"); }}
                                            disabled={actionLoading === bestProposal.id || bestProposal.status === "shortlisted"}
                                            className="px-3 py-2 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            ⭐ Shortlist
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleAction(bestProposal.id, "accept"); }}
                                            disabled={actionLoading === bestProposal.id}
                                            className="px-3 py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            ✅ Accept
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Status Tabs ─────────────────────── */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-4">
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                        <button
                            key={opt.key}
                            onClick={() => setStatusFilter(opt.key)}
                            className={`flex-1 text-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${statusFilter === opt.key
                                ? "bg-white text-brand-dark shadow-sm"
                                : "text-brand-muted hover:text-brand-dark"
                                }`}
                        >
                            {opt.label}
                            {(counts[opt.key] || 0) > 0 && (
                                <span className={`ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full min-w-[18px] ${statusFilter === opt.key
                                    ? "bg-brand-orange/15 text-brand-orange"
                                    : "bg-slate-200 text-slate-500"
                                    }`}>
                                    {counts[opt.key]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Search & Filter Bar ─────────────── */}
                <div className="bg-white rounded-2xl border border-brand-border/60 p-3 mb-4">
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-sm">🔍</span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by freelancer name, skill, country, cover letter…"
                                className="w-full pl-9 pr-3 py-2.5 text-sm border border-brand-border/60 rounded-xl bg-slate-50 focus:bg-white focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/10 outline-none transition-all placeholder:text-brand-muted/60"
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark text-xs">✕</button>
                            )}
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortKey)}
                            className="px-3 py-2.5 text-sm border border-brand-border/60 rounded-xl bg-slate-50 focus:bg-white focus:border-brand-orange/50 outline-none transition-all text-brand-dark cursor-pointer"
                        >
                            {SORT_OPTIONS.map((o) => (
                                <option key={o.key} value={o.key}>{o.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-xl border transition-all ${showFilters || bidMin || bidMax
                                ? "bg-brand-orange/10 text-brand-orange border-brand-orange/30"
                                : "bg-slate-50 text-brand-muted border-brand-border/60 hover:text-brand-dark"
                                }`}
                        >
                            <span>⚙️</span>
                            <span className="hidden sm:inline">Filters</span>
                        </button>
                    </div>
                    {showFilters && (
                        <div className="mt-3 pt-3 border-t border-brand-border/40">
                            <div className="flex flex-wrap gap-3 items-end">
                                <div className="flex-1 min-w-[120px]">
                                    <label className="block text-[11px] font-semibold text-brand-muted uppercase tracking-wide mb-1">Min Bid ($)</label>
                                    <input type="number" value={bidMin} onChange={(e) => setBidMin(e.target.value)} placeholder="0" min="0"
                                        className="w-full px-3 py-2 text-sm border border-brand-border/60 rounded-lg bg-slate-50 focus:bg-white focus:border-brand-orange/50 outline-none transition-all" />
                                </div>
                                <div className="flex-1 min-w-[120px]">
                                    <label className="block text-[11px] font-semibold text-brand-muted uppercase tracking-wide mb-1">Max Bid ($)</label>
                                    <input type="number" value={bidMax} onChange={(e) => setBidMax(e.target.value)} placeholder="Any" min="0"
                                        className="w-full px-3 py-2 text-sm border border-brand-border/60 rounded-lg bg-slate-50 focus:bg-white focus:border-brand-orange/50 outline-none transition-all" />
                                </div>
                                {hasActiveFilters && (
                                    <button onClick={() => { setSearch(""); setSortBy("best"); setStatusFilter("all"); setBidMin(""); setBidMax(""); }}
                                        className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                                        ✕ Clear All
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Filter summary */}
                {hasActiveFilters && (
                    <div className="flex items-center gap-2 text-xs text-brand-muted mb-4 px-1">
                        <span>Showing <strong className="text-brand-dark">{filtered.length}</strong> of <strong className="text-brand-dark">{proposals.length}</strong> proposals</span>
                    </div>
                )}

                {/* ── Empty State ─────────────────────── */}
                {proposals.length === 0 && !error && (
                    <div className="bg-white rounded-2xl border border-brand-border/60 p-12 text-center">
                        <div className="text-4xl mb-3">📭</div>
                        <h2 className="text-lg font-bold text-brand-dark mb-1">No proposals yet</h2>
                        <p className="text-sm text-brand-muted mb-4">
                            Freelancers haven&apos;t submitted proposals for this job yet.
                            Make sure the job is published and visible.
                        </p>
                        <Link href={`/dashboard/jobs/${id}`}
                            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-brand-dark bg-white border border-brand-border hover:bg-gray-50 rounded-xl transition-colors">
                            ← Back to Job
                        </Link>
                    </div>
                )}

                {filtered.length === 0 && proposals.length > 0 && (
                    <div className="bg-white rounded-2xl border border-brand-border/60 p-12 text-center">
                        <div className="text-4xl mb-3">🔍</div>
                        <h2 className="text-lg font-bold text-brand-dark mb-1">No proposals match your filters</h2>
                        <p className="text-sm text-brand-muted mb-4">Try adjusting your search or filter criteria.</p>
                        <button onClick={() => { setSearch(""); setSortBy("best"); setStatusFilter("all"); setBidMin(""); setBidMax(""); }}
                            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-brand-dark bg-white border border-brand-border hover:bg-gray-50 rounded-xl transition-colors">
                            ✕ Clear Filters
                        </button>
                    </div>
                )}

                {/* ── Proposal Cards ──────────────────── */}
                {filtered.length > 0 && (
                    <div className="space-y-3">
                        {filtered.map((p, idx) => {
                            const st = STATUS_CONFIG[p.status] || STATUS_CONFIG.submitted;
                            const name = p.freelancer_first_name
                                ? `${p.freelancer_first_name} ${p.freelancer_last_name || ""}`.trim()
                                : p.freelancer_email || "Freelancer";
                            const isBest = bestProposal?.id === p.id && proposals.length > 1;

                            return (
                                <div
                                    key={p.id}
                                    onClick={() => setSelectedProposal(p)}
                                    className={`bg-white rounded-2xl border p-5 transition-all duration-200 hover:shadow-md cursor-pointer ${isBest
                                        ? "border-emerald-300 ring-1 ring-emerald-100"
                                        : "border-brand-border/60 hover:border-brand-orange/40"
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Rank badge */}
                                        <div className="shrink-0 flex flex-col items-center gap-1">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? "bg-emerald-100 text-emerald-700" :
                                                idx === 1 ? "bg-amber-100 text-amber-700" :
                                                    idx === 2 ? "bg-orange-100 text-orange-700" :
                                                        "bg-slate-100 text-slate-500"
                                                }`}>
                                                #{idx + 1}
                                            </div>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${scoreBadgeColor(p._score)}`}>
                                                {p._score}%
                                            </span>
                                        </div>

                                        {/* Avatar */}
                                        {p.freelancer_avatar ? (
                                            <img src={fileUrl(p.freelancer_avatar)} alt="" className="shrink-0 w-11 h-11 rounded-full object-cover border border-brand-border/40" />
                                        ) : (
                                            <div className="shrink-0 w-11 h-11 rounded-full bg-brand-orange/10 flex items-center justify-center text-base font-bold text-brand-orange">
                                                {p.freelancer_first_name?.[0]?.toUpperCase() || "?"}
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <button onClick={() => setSelectedProposal(p)} className="font-bold text-brand-dark hover:text-brand-orange transition-colors cursor-pointer">
                                                    {name}
                                                </button>

                                                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${st.color}`}>
                                                    {st.icon} {st.label}
                                                </span>
                                            </div>

                                            {/* Meta */}
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-semibold">
                                                    💰 ${Number(p.bid_amount).toLocaleString()}{p.bid_type === "hourly" ? "/hr" : ""}
                                                </span>
                                                {p.estimated_duration_days && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-medium">
                                                        🕐 {durationLabel(p.estimated_duration_days)}
                                                    </span>
                                                )}
                                                {p.freelancer_headline && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-100 text-[11px] font-medium">
                                                        🎯 {p.freelancer_headline}
                                                    </span>
                                                )}
                                                {p.freelancer_hourly_rate && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-medium">
                                                        ⏱️ ${p.freelancer_hourly_rate}/hr
                                                    </span>
                                                )}
                                                {p.freelancer_experience_years && p.freelancer_experience_years > 0 && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-medium">
                                                        📊 {p.freelancer_experience_years}yr exp
                                                    </span>
                                                )}
                                            </div>

                                            {/* Cover letter preview */}
                                            <p className="text-sm text-brand-muted/80 line-clamp-2">
                                                {stripHtml(p.cover_letter || "").slice(0, 250)}{stripHtml(p.cover_letter || "").length > 250 ? "…" : ""}
                                            </p>

                                            {/* Timestamps */}
                                            <p className="text-[11px] text-brand-muted/60 mt-1.5">
                                                Submitted {timeAgo(p.created_at)}
                                                {p.viewed_at && ` · Viewed ${timeAgo(p.viewed_at)}`}
                                                {p.shortlisted_at && ` · Shortlisted ${timeAgo(p.shortlisted_at)}`}
                                            </p>
                                        </div>

                                        {/* Action buttons */}
                                        {isClient && p.status !== "accepted" && p.status !== "rejected" && (
                                            <div className="shrink-0 flex flex-col gap-1.5">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleAction(p.id, "accept"); }}
                                                    disabled={!!actionLoading}
                                                    className="px-3 py-1.5 text-[11px] font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    ✅ Accept
                                                </button>
                                                {p.status !== "shortlisted" && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleAction(p.id, "shortlist"); }}
                                                        disabled={!!actionLoading}
                                                        className="px-3 py-1.5 text-[11px] font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        ⭐ Shortlist
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleAction(p.id, "reject"); }}
                                                    disabled={!!actionLoading}
                                                    className="px-3 py-1.5 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    ❌ Decline
                                                </button>
                                            </div>
                                        )}
                                        {p.status === "accepted" && (
                                            <span className="shrink-0 px-3 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                                                ✅ Accepted
                                            </span>
                                        )}
                                        {p.status === "rejected" && (
                                            <span className="shrink-0 px-3 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 rounded-lg border border-red-200">
                                                ❌ Declined
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Summary */}
                {proposals.length > 0 && (
                    <div className="mt-6 flex items-center justify-between text-xs text-brand-muted bg-slate-50 rounded-xl px-4 py-3">
                        <span>Total: <strong className="text-brand-dark">{proposals.length}</strong></span>
                        <span className="flex gap-3">
                            {STATUS_FILTER_OPTIONS.filter(o => o.key !== "all").map((o) => (
                                <span key={o.key}>{o.label}: <strong className="text-brand-dark">{counts[o.key] || 0}</strong></span>
                            ))}
                        </span>
                    </div>
                )}
            </div>

            {/* ── Post-Accept Modal ──────────────────── */}
            {postAcceptModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="text-4xl mb-3">🎉</div>
                            <h2 className="text-xl font-bold text-brand-dark mb-2">Proposal Accepted!</h2>
                            <p className="text-sm text-brand-muted mb-1">
                                You hired <strong className="text-brand-dark">{postAcceptModal.freelancerName}</strong>.
                                A contract has been created.
                            </p>
                            <p className="text-sm text-brand-muted mb-6">
                                Would you like to keep this job listed so you can hire more freelancers, or close it?
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => setPostAcceptModal({ open: false, freelancerName: "" })}
                                    className="w-full px-5 py-3 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] transition-all"
                                >
                                    🔓 Keep Job Open — Hire more freelancers
                                </button>
                                <button
                                    onClick={handleCloseJob}
                                    disabled={closingJob}
                                    className="w-full px-5 py-3 text-sm font-semibold text-brand-dark border border-brand-border/60 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                                >
                                    {closingJob ? "Closing…" : "✅ Close Job — I’m done hiring"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Proposal Detail Modal ───────────────── */}
            {selectedProposal && (
                <ProposalDetailModal
                    proposal={selectedProposal}
                    jobTitle={job?.title}
                    token={token}
                    isClient={isClient}
                    actionLoading={actionLoading}
                    onAction={handleAction}
                    onClose={() => setSelectedProposal(null)}
                />
            )}
        </>
    );
}
