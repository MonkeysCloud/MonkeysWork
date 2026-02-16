"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Proposal type ─────────────────────────────────── */
interface Proposal {
    id: string;
    job_id: string;
    job_title: string;
    cover_letter: string;
    bid_amount: number;
    bid_type?: string;
    estimated_duration_days?: number;
    status: string;
    viewed_at?: string;
    shortlisted_at?: string;
    freelancer_first_name?: string;
    freelancer_last_name?: string;
    freelancer_email?: string;
    created_at: string;
    updated_at: string;
}

/* ── Tab config (per role) ──────────────────────────── */
const FREELANCER_TABS = [
    { key: "active", label: "Active", statuses: ["submitted", "viewed", "shortlisted"] },
    { key: "accepted", label: "Accepted", statuses: ["accepted"] },
    { key: "archived", label: "Archived", statuses: ["rejected", "withdrawn"] },
] as const;

const CLIENT_TABS = [
    { key: "received", label: "Received", statuses: ["submitted", "viewed"] },
    { key: "shortlisted", label: "Shortlisted", statuses: ["shortlisted"] },
    { key: "accepted", label: "Accepted", statuses: ["accepted"] },
    { key: "rejected", label: "Rejected", statuses: ["rejected"] },
] as const;

type Tab = { key: string; label: string; statuses: readonly string[] };

/* ── Sort options ──────────────────────────────────── */
const SORT_OPTIONS = [
    { key: "newest", label: "Newest First" },
    { key: "oldest", label: "Oldest First" },
    { key: "bid_high", label: "Highest Bid" },
    { key: "bid_low", label: "Lowest Bid" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["key"];

/* ── Status badge ──────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    submitted: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200", icon: "⏳" },
    viewed: { label: "Viewed", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "👁️" },
    shortlisted: { label: "Shortlisted", color: "bg-violet-100 text-violet-700 border-violet-200", icon: "⭐" },
    accepted: { label: "Accepted", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "✅" },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200", icon: "❌" },
    withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-600 border-gray-200", icon: "↩️" },
};

/* ── Helpers ───────────────────────────────────────── */
function formatDate(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(iso);
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

/* ── Page component ────────────────────────────────── */
export default function ProposalsPage() {
    const { token, user } = useAuth();
    const searchParams = useSearchParams();
    const isClient = user?.role === "client";

    const tabs: Tab[] = isClient ? CLIENT_TABS as unknown as Tab[] : FREELANCER_TABS as unknown as Tab[];

    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Search & filters
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<SortKey>("newest");
    const [bidMin, setBidMin] = useState("");
    const [bidMax, setBidMax] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    // Determine active tab from URL
    const statusParam = searchParams.get("status") || "";
    const activeTab = useMemo(() => {
        if (!statusParam) return tabs[0].key;
        const statuses = statusParam.split(",");
        const match = tabs.find((t) =>
            t.statuses.some((s) => statuses.includes(s))
        );
        return match?.key ?? tabs[0].key;
    }, [statusParam, tabs]);

    // Fetch proposals — different endpoint per role
    useEffect(() => {
        if (!token) return;
        setLoading(true);
        const endpoint = isClient ? "proposals/received" : "proposals/me";
        fetch(`${API_BASE}/${endpoint}?per_page=100`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((b) => setProposals(b.data || []))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [token, isClient]);

    // Filter by tab + search + bid range, then sort
    const currentTab = tabs.find((t) => t.key === activeTab)!;

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        const minBid = bidMin ? parseFloat(bidMin) : 0;
        const maxBid = bidMax ? parseFloat(bidMax) : Infinity;

        let result = proposals.filter((p) => {
            // Tab filter
            if (!currentTab.statuses.includes(p.status)) return false;

            // Search filter
            if (q) {
                const searchable = [
                    p.job_title,
                    stripHtml(p.cover_letter),
                    p.freelancer_first_name,
                    p.freelancer_last_name,
                    p.freelancer_email,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                if (!searchable.includes(q)) return false;
            }

            // Bid range filter
            const bid = Number(p.bid_amount);
            if (bid < minBid || bid > maxBid) return false;

            return true;
        });

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case "oldest":
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case "bid_high":
                    return Number(b.bid_amount) - Number(a.bid_amount);
                case "bid_low":
                    return Number(a.bid_amount) - Number(b.bid_amount);
                default:
                    return 0;
            }
        });

        return result;
    }, [proposals, currentTab, search, sortBy, bidMin, bidMax]);

    // Counts per tab (before search/bid filter, so tabs always reflect total)
    const counts = useMemo(() => {
        const c: Record<string, number> = {};
        for (const t of tabs) {
            c[t.key] = proposals.filter((p) => t.statuses.includes(p.status)).length;
        }
        return c;
    }, [proposals, tabs]);

    // Build tab hrefs
    function tabHref(tab: Tab) {
        return `/dashboard/proposals?status=${tab.statuses.join(",")}`;
    }

    const hasActiveFilters = search || bidMin || bidMax || sortBy !== "newest";

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-brand-dark">
                    {isClient ? "📋 Proposals Received" : "📝 My Proposals"}
                </h1>
                <p className="text-sm text-brand-muted mt-1">
                    {isClient
                        ? "Review proposals submitted to your jobs."
                        : "Track your submitted proposals and their status."}
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-4">
                {tabs.map((tab) => (
                    <Link
                        key={tab.key}
                        href={tabHref(tab)}
                        className={`flex-1 text-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === tab.key
                            ? "bg-white text-brand-dark shadow-sm"
                            : "text-brand-muted hover:text-brand-dark"
                            }`}
                    >
                        {tab.label}
                        {counts[tab.key] > 0 && (
                            <span
                                className={`ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full min-w-[18px] ${activeTab === tab.key
                                    ? "bg-brand-orange/15 text-brand-orange"
                                    : "bg-slate-200 text-slate-500"
                                    }`}
                            >
                                {counts[tab.key]}
                            </span>
                        )}
                    </Link>
                ))}
            </div>

            {/* ── Search & Filter Bar ───────────────────── */}
            <div className="bg-white rounded-2xl border border-brand-border/60 p-3 mb-4">
                <div className="flex gap-2 items-center">
                    {/* Search input */}
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-sm">
                            🔍
                        </span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={
                                isClient
                                    ? "Search by job title, freelancer name or email…"
                                    : "Search by job title or cover letter…"
                            }
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-brand-border/60 rounded-xl bg-slate-50 focus:bg-white focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/10 outline-none transition-all placeholder:text-brand-muted/60"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark text-xs"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Sort dropdown */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortKey)}
                        className="px-3 py-2.5 text-sm border border-brand-border/60 rounded-xl bg-slate-50 focus:bg-white focus:border-brand-orange/50 outline-none transition-all text-brand-dark cursor-pointer"
                    >
                        {SORT_OPTIONS.map((o) => (
                            <option key={o.key} value={o.key}>
                                {o.label}
                            </option>
                        ))}
                    </select>

                    {/* Filters toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-xl border transition-all ${showFilters || bidMin || bidMax
                                ? "bg-brand-orange/10 text-brand-orange border-brand-orange/30"
                                : "bg-slate-50 text-brand-muted border-brand-border/60 hover:text-brand-dark"
                            }`}
                    >
                        <span>⚙️</span>
                        <span className="hidden sm:inline">Filters</span>
                        {(bidMin || bidMax) && (
                            <span className="inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-brand-orange text-white rounded-full">
                                1
                            </span>
                        )}
                    </button>
                </div>

                {/* Expanded filters */}
                {showFilters && (
                    <div className="mt-3 pt-3 border-t border-brand-border/40">
                        <div className="flex flex-wrap gap-3 items-end">
                            <div className="flex-1 min-w-[120px]">
                                <label className="block text-[11px] font-semibold text-brand-muted uppercase tracking-wide mb-1">
                                    Min Bid ($)
                                </label>
                                <input
                                    type="number"
                                    value={bidMin}
                                    onChange={(e) => setBidMin(e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    className="w-full px-3 py-2 text-sm border border-brand-border/60 rounded-lg bg-slate-50 focus:bg-white focus:border-brand-orange/50 outline-none transition-all"
                                />
                            </div>
                            <div className="flex-1 min-w-[120px]">
                                <label className="block text-[11px] font-semibold text-brand-muted uppercase tracking-wide mb-1">
                                    Max Bid ($)
                                </label>
                                <input
                                    type="number"
                                    value={bidMax}
                                    onChange={(e) => setBidMax(e.target.value)}
                                    placeholder="Any"
                                    min="0"
                                    className="w-full px-3 py-2 text-sm border border-brand-border/60 rounded-lg bg-slate-50 focus:bg-white focus:border-brand-orange/50 outline-none transition-all"
                                />
                            </div>
                            {hasActiveFilters && (
                                <button
                                    onClick={() => {
                                        setSearch("");
                                        setSortBy("newest");
                                        setBidMin("");
                                        setBidMax("");
                                    }}
                                    className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    ✕ Clear All
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Active filter summary */}
            {hasActiveFilters && !loading && (
                <div className="flex items-center gap-2 text-xs text-brand-muted mb-4 px-1">
                    <span>
                        Showing <strong className="text-brand-dark">{filtered.length}</strong> of{" "}
                        <strong className="text-brand-dark">{counts[activeTab]}</strong> {currentTab.label.toLowerCase()} proposals
                    </span>
                    {search && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-orange/10 text-brand-orange rounded-full text-[10px] font-bold">
                            &quot;{search}&quot;
                            <button onClick={() => setSearch("")} className="hover:opacity-70">✕</button>
                        </span>
                    )}
                    {(bidMin || bidMax) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
                            ${bidMin || "0"} – ${bidMax || "∞"}
                            <button onClick={() => { setBidMin(""); setBidMax(""); }} className="hover:opacity-70">✕</button>
                        </span>
                    )}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-sm text-red-700">
                    ⚠️ {error}
                </div>
            )}

            {/* Empty */}
            {!loading && !error && filtered.length === 0 && (
                <div className="bg-white rounded-2xl border border-brand-border/60 p-12 text-center">
                    <div className="text-4xl mb-3">
                        {hasActiveFilters ? "🔍" : isClient ? "📭" : activeTab === "active" ? "📭" : activeTab === "accepted" ? "🎯" : "📦"}
                    </div>
                    <h2 className="text-lg font-bold text-brand-dark mb-1">
                        {hasActiveFilters
                            ? "No proposals match your filters"
                            : isClient
                                ? `No ${currentTab.label.toLowerCase()} proposals`
                                : activeTab === "active"
                                    ? "No active proposals"
                                    : activeTab === "accepted"
                                        ? "No accepted proposals yet"
                                        : "No archived proposals"}
                    </h2>
                    <p className="text-sm text-brand-muted mb-4">
                        {hasActiveFilters
                            ? "Try adjusting your search or filter criteria."
                            : isClient
                                ? "Proposals from freelancers will appear here once they apply."
                                : activeTab === "active"
                                    ? "Start applying to jobs to see your proposals here."
                                    : activeTab === "accepted"
                                        ? "Once a client accepts your proposal, it will appear here."
                                        : "Rejected or withdrawn proposals will appear here."}
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={() => {
                                setSearch("");
                                setSortBy("newest");
                                setBidMin("");
                                setBidMax("");
                            }}
                            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-brand-dark bg-white border border-brand-border hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            ✕ Clear Filters
                        </button>
                    )}
                    {!hasActiveFilters && !isClient && activeTab === "active" && (
                        <div className="flex justify-center gap-3">
                            <Link
                                href="/dashboard/jobs"
                                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-brand-dark bg-white border border-brand-border hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                🔍 Browse Jobs
                            </Link>
                            <Link
                                href="/dashboard/jobs/recommended"
                                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl transition-colors"
                            >
                                ✨ Recommended
                            </Link>
                        </div>
                    )}
                    {!hasActiveFilters && isClient && (
                        <Link
                            href="/dashboard/jobs/create"
                            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl transition-colors"
                        >
                            ➕ Post a Job
                        </Link>
                    )}
                </div>
            )}

            {/* Proposal cards */}
            {!loading && !error && filtered.length > 0 && (
                <div className="space-y-3">
                    {filtered.map((p) => {
                        const st = STATUS_CONFIG[p.status] || STATUS_CONFIG.submitted;
                        const freelancerName = p.freelancer_first_name
                            ? `${p.freelancer_first_name} ${p.freelancer_last_name || ""}`.trim()
                            : p.freelancer_email;
                        return (
                            <Link
                                key={p.id}
                                href={`/dashboard/proposals/${p.id}`}
                                className="block bg-white rounded-2xl border border-brand-border/60 p-5 hover:border-brand-orange/40 hover:shadow-[0_2px_16px_rgba(240,138,17,0.08)] transition-all duration-200 group"
                            >
                                {/* Top row */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-base font-bold text-brand-dark group-hover:text-brand-orange transition-colors truncate">
                                            {p.job_title}
                                        </h3>
                                        <p className="text-xs text-brand-muted mt-0.5">
                                            {isClient && freelancerName && (
                                                <span className="font-medium text-brand-dark/70">
                                                    👤 {freelancerName} ·{" "}
                                                </span>
                                            )}
                                            Submitted {timeAgo(p.created_at)}
                                            {p.viewed_at && ` · Viewed ${timeAgo(p.viewed_at)}`}
                                            {p.shortlisted_at && ` · Shortlisted ${timeAgo(p.shortlisted_at)}`}
                                        </p>
                                    </div>
                                    <span
                                        className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${st.color}`}
                                    >
                                        {st.icon} {st.label}
                                    </span>
                                </div>

                                {/* Info chips */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold">
                                        💰 ${Number(p.bid_amount).toLocaleString()}
                                        {p.bid_type === "hourly" ? "/hr" : ""}
                                    </span>
                                    {p.estimated_duration_days && (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium">
                                            🕐 {durationLabel(p.estimated_duration_days)}
                                        </span>
                                    )}
                                </div>

                                {/* Cover letter preview */}
                                {p.cover_letter && (
                                    <p className="text-sm text-brand-muted/80 line-clamp-2">
                                        {stripHtml(p.cover_letter).slice(0, 200)}
                                        {stripHtml(p.cover_letter).length > 200 ? "…" : ""}
                                    </p>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Summary footer */}
            {!loading && proposals.length > 0 && (
                <div className="mt-6 flex items-center justify-between text-xs text-brand-muted bg-slate-50 rounded-xl px-4 py-3">
                    <span>
                        Total: <strong className="text-brand-dark">{proposals.length}</strong>
                    </span>
                    <span className="flex gap-2">
                        {tabs.map((t) => (
                            <span key={t.key}>
                                {t.label}: <strong className="text-brand-dark">{counts[t.key]}</strong>
                            </span>
                        ))}
                    </span>
                </div>
            )}
        </div>
    );
}
