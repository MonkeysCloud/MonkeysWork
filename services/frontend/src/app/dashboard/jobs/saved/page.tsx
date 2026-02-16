"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ALL_COUNTRIES from "@/data/countries";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Status config ─────────────────────────────────── */
const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    draft: { label: "Draft", color: "bg-slate-100 text-slate-700 border-slate-200", icon: "📝" },
    pending_review: { label: "Pending Review", color: "bg-orange-100 text-orange-800 border-orange-200", icon: "🔍" },
    open: { label: "Published", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: "🟢" },
    closed: { label: "Closed", color: "bg-red-100 text-red-700 border-red-200", icon: "🔴" },
    filled: { label: "Filled", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "✅" },
};

const REGION_LABELS: Record<string, string> = {
    north_america: "🌎 North America",
    south_america: "🌎 South America",
    europe: "🌍 Europe",
    asia: "🌏 Asia",
    africa: "🌍 Africa",
    oceania: "🌏 Oceania",
    middle_east: "🌍 Middle East",
};

function toArr(v: unknown): string[] {
    if (Array.isArray(v)) return v;
    if (typeof v === "string") { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
    return [];
}

interface SavedJob {
    id: string;
    job_id: string;
    created_at: string;
    title: string;
    slug: string;
    status: string;
    budget_type: string;
    budget_min: number | null;
    budget_max: number | null;
    currency: string;
    experience_level: string;
    job_created_at: string;
    published_at: string | null;
    location_type: string;
    location_regions: unknown;
    location_countries: unknown;
    category_name: string | null;
    client_name: string | null;
}

export default function SavedJobsPage() {
    const { token } = useAuth();
    const [jobs, setJobs] = useState<SavedJob[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        fetch(`${API_BASE}/saved-jobs`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((b) => setJobs(b.data ?? []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [token]);

    async function unsaveJob(jobId: string) {
        if (!token) return;
        await fetch(`${API_BASE}/saved-jobs/${jobId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        setJobs((prev) => prev.filter((j) => j.job_id !== jobId));
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-brand-dark">
                    ❤️ Saved Jobs
                </h1>
                <p className="text-sm text-brand-muted mt-1">
                    Jobs you&apos;ve saved for later. {jobs.length} saved.
                </p>
            </div>

            {jobs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-brand-border/60 p-12 text-center">
                    <div className="text-4xl mb-4">🤍</div>
                    <h2 className="text-lg font-bold text-brand-dark mb-2">No saved jobs yet</h2>
                    <p className="text-sm text-brand-muted mb-6">
                        Browse open jobs and save the ones you&apos;re interested in.
                    </p>
                    <Link
                        href="/dashboard/jobs"
                        className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl transition-colors"
                    >
                        🔍 Browse Jobs
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {jobs.map((job) => {
                        const st = statusConfig[job.status] ?? statusConfig.draft;
                        const budgetLabel =
                            job.budget_type === "fixed"
                                ? `$${job.budget_min?.toLocaleString() ?? "?"} – $${job.budget_max?.toLocaleString() ?? "?"}`
                                : `$${job.budget_min?.toLocaleString() ?? "?"}/hr – $${job.budget_max?.toLocaleString() ?? "?"}/hr`;

                        const locationLabel =
                            job.location_type === "regions"
                                ? `🗺️ ${toArr(job.location_regions).map((r) => REGION_LABELS[r]?.replace(/^.\s/, "") ?? r).join(", ") || "Regions"}`
                                : job.location_type === "countries"
                                    ? `🏁 ${toArr(job.location_countries).map((cc) => ALL_COUNTRIES.find((c) => c.code === cc)?.name ?? cc).join(", ") || "Countries"}`
                                    : "🌍 Worldwide";

                        return (
                            <div
                                key={job.id}
                                className="bg-white rounded-2xl border border-brand-border/60 p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/dashboard/jobs/${job.job_id}`}
                                            className="text-lg font-bold text-brand-dark hover:text-brand-orange transition-colors line-clamp-1"
                                        >
                                            {job.title}
                                        </Link>

                                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border font-medium ${st.color}`}>
                                                {st.icon} {st.label}
                                            </span>
                                            {job.category_name && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-medium">
                                                    📂 {job.category_name}
                                                </span>
                                            )}
                                            <span className="text-brand-muted">{budgetLabel}</span>
                                            <span className="text-brand-muted">{locationLabel}</span>
                                        </div>

                                        <div className="flex items-center gap-3 mt-2 text-xs text-brand-muted">
                                            {job.client_name && (
                                                <span>👤 {job.client_name}</span>
                                            )}
                                            <span>
                                                Saved {new Date(job.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Link
                                            href={`/dashboard/jobs/${job.job_id}`}
                                            className="px-4 py-2 text-xs font-semibold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl transition-colors"
                                        >
                                            View Job
                                        </Link>
                                        <button
                                            onClick={() => unsaveJob(job.job_id)}
                                            className="px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                                            title="Remove from saved"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
