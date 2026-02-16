"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Status config ─────────────────────────────────── */
const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    draft: {
        label: "Draft",
        color: "bg-slate-100 text-slate-700 border-slate-200",
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

type Job = {
    id: string;
    title: string;
    slug: string;
    status: string;
    budget_type: string;
    budget_min: number | null;
    budget_max: number | null;
    currency: string;
    experience_level: string | null;
    proposals_count: number;
    views_count: number;
    client_name?: string;
    category_name?: string;
    created_at: string;
    published_at: string | null;
};

function formatDate(iso?: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatBudget(job: Job) {
    const fmt = (n: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: job.currency || "USD",
            minimumFractionDigits: 0,
        }).format(n);
    if (job.budget_min && job.budget_max) return `${fmt(job.budget_min)} – ${fmt(job.budget_max)}`;
    if (job.budget_min) return `From ${fmt(job.budget_min)}`;
    if (job.budget_max) return `Up to ${fmt(job.budget_max)}`;
    return "Not set";
}

/* ── Client filter tabs ──────────────────────────── */
const CLIENT_TABS = [
    { key: "all", label: "All" },
    { key: "draft", label: "Drafts" },
    { key: "open", label: "Published" },
    { key: "pending_review", label: "In Review" },
    { key: "in_progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
    { key: "closed", label: "Closed" },
] as const;

/* ── Freelancer filter tabs ──────────────────────── */
const FREELANCER_TABS = [
    { key: "all", label: "All Jobs" },
    { key: "hourly", label: "Hourly" },
    { key: "fixed", label: "Fixed Price" },
] as const;

/* ── Page ─────────────────────────────────────────── */
export default function JobsListPage() {
    const router = useRouter();
    const { token, user } = useAuth();

    const isClient = user?.role === "client";

    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const perPage = 12;

    const fetchJobs = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                per_page: String(perPage),
            });
            if (search.trim()) params.set("search", search.trim());

            // Clients: fetch their own jobs; Freelancers: browse open jobs
            const endpoint = isClient ? `${API_BASE}/jobs/me` : `${API_BASE}/jobs`;
            const res = await fetch(`${endpoint}?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const body = await res.json();
            if (res.ok) {
                setJobs(body.data ?? []);
                setTotal(body.meta?.total ?? body.total ?? 0);
            }
        } catch {
            /* silent */
        } finally {
            setLoading(false);
        }
    }, [token, page, search, isClient]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    /* client-side filter */
    const filtered = (() => {
        if (filter === "all") return jobs;
        if (isClient) {
            if (filter === "closed")
                return jobs.filter((j) => j.status === "cancelled" || j.status === "suspended");
            return jobs.filter((j) => j.status === filter);
        }
        // Freelancer: filter by budget_type
        return jobs.filter((j) => j.budget_type === filter);
    })();

    const counts = jobs.reduce<Record<string, number>>((acc, j) => {
        acc[j.status] = (acc[j.status] || 0) + 1;
        if (j.budget_type) acc[`bt_${j.budget_type}`] = (acc[`bt_${j.budget_type}`] || 0) + 1;
        return acc;
    }, {});

    if (!user) return null;

    const tabs = isClient ? CLIENT_TABS : FREELANCER_TABS;

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
                        {isClient ? "My Jobs" : "Browse Jobs"}
                    </h1>
                    <p className="text-sm text-brand-muted mt-1">
                        {isClient
                            ? "Manage your job listings, track proposals, and monitor hiring progress."
                            : "Find your next project — browse open opportunities from clients."}
                    </p>
                </div>
                {isClient && (
                    <Link
                        href="/dashboard/jobs/create"
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_32px_rgba(240,138,17,0.55)] transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Post a Job
                    </Link>
                )}
            </div>

            {/* Search bar */}
            <div className="mb-5">
                <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <input
                        type="text"
                        placeholder={isClient ? "Search your jobs…" : "Search jobs by title or keyword…"}
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-brand-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all placeholder:text-brand-muted/60"
                    />
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-hide">
                {tabs.map((tab) => {
                    let count = 0;
                    if (tab.key === "all") {
                        count = jobs.length;
                    } else if (isClient && tab.key === "closed") {
                        count = (counts["cancelled"] ?? 0) + (counts["suspended"] ?? 0);
                    } else if (!isClient) {
                        count = counts[`bt_${tab.key}`] ?? 0;
                    } else {
                        count = counts[tab.key] ?? 0;
                    }
                    const active = filter === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`
                                flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all
                                ${active
                                    ? "bg-brand-orange text-white shadow-sm"
                                    : "bg-white text-brand-muted border border-brand-border/60 hover:border-brand-dark/20 hover:text-brand-dark"
                                }
                            `}
                        >
                            {tab.label}
                            {count > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                                    }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Jobs list */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-7 h-7 border-3 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-brand-border/60 p-12 text-center">
                    <span className="text-5xl block mb-4">{isClient ? "📋" : "🔍"}</span>
                    <h3 className="text-lg font-bold text-brand-dark mb-2">
                        {filter === "all" && jobs.length === 0
                            ? isClient ? "No jobs yet" : "No open jobs available"
                            : "No jobs match this filter"}
                    </h3>
                    <p className="text-sm text-brand-muted mb-6 max-w-sm mx-auto">
                        {filter === "all" && jobs.length === 0
                            ? isClient
                                ? "Create your first job to start hiring the perfect freelancer."
                                : "Check back soon — new jobs are posted regularly."
                            : "Try a different filter or search term."}
                    </p>
                    {isClient && filter === "all" && jobs.length === 0 && (
                        <Link
                            href="/dashboard/jobs/create"
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] transition-all duration-200 hover:-translate-y-0.5"
                        >
                            Post Your First Job
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((job) => {
                        const st = statusConfig[job.status] ?? statusConfig.draft;
                        return (
                            <button
                                key={job.id}
                                onClick={() =>
                                    router.push(
                                        isClient
                                            ? `/dashboard/jobs/${job.id}`
                                            : `/jobs/${job.slug || job.id}`
                                    )
                                }
                                className="w-full text-left bg-white rounded-xl border border-brand-border/60 p-4 sm:p-5 hover:shadow-md hover:border-brand-border transition-all duration-200 group"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    {/* Left: title + meta */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                                            <h3 className="text-sm sm:text-base font-bold text-brand-dark truncate group-hover:text-brand-orange transition-colors">
                                                {job.title}
                                            </h3>
                                            {isClient && (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border shrink-0 ${st.color}`}>
                                                    <span className="text-xs">{st.icon}</span>
                                                    {st.label}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-muted">
                                            {!isClient && job.client_name && (
                                                <span className="inline-flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                                    </svg>
                                                    {job.client_name}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                </svg>
                                                {formatBudget(job)}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                                </svg>
                                                {isClient ? formatDate(job.created_at) : formatDate(job.published_at)}
                                            </span>
                                            <span className="capitalize">{job.budget_type}</span>
                                            {job.experience_level && (
                                                <span className="capitalize">{job.experience_level}</span>
                                            )}
                                            {job.category_name && (
                                                <span>{job.category_name}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: stats */}
                                    <div className="flex items-center gap-4 sm:gap-5 shrink-0">
                                        {isClient && (
                                            <>
                                                <div className="text-center">
                                                    <div className="text-lg font-extrabold text-brand-dark">{job.proposals_count}</div>
                                                    <div className="text-[10px] text-brand-muted uppercase tracking-wide">Proposals</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-extrabold text-brand-dark">{job.views_count}</div>
                                                    <div className="text-[10px] text-brand-muted uppercase tracking-wide">Views</div>
                                                </div>
                                            </>
                                        )}
                                        {!isClient && (
                                            <span className="px-3 py-1.5 text-xs font-bold text-brand-orange border border-brand-orange/30 rounded-lg group-hover:bg-brand-orange group-hover:text-white transition-all">
                                                View Details →
                                            </span>
                                        )}
                                        {isClient && (
                                            <svg className="w-4 h-4 text-brand-muted group-hover:text-brand-orange transition-colors hidden sm:block" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {total > perPage && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-brand-border/40">
                    <p className="text-xs text-brand-muted">
                        Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 text-xs font-semibold text-brand-muted border border-brand-border/60 rounded-lg hover:border-brand-dark/30 transition-all disabled:opacity-40"
                        >
                            ← Prev
                        </button>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page * perPage >= total}
                            className="px-3 py-1.5 text-xs font-semibold text-brand-muted border border-brand-border/60 rounded-lg hover:border-brand-dark/30 transition-all disabled:opacity-40"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
