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
    latin_america: "🌎 Latin America",
    europe: "🇪🇺 Europe",
    asia_pacific: "🌏 Asia Pacific",
    middle_east_africa: "🌍 Middle East & Africa",
};

function toArr(v: unknown): string[] {
    if (Array.isArray(v)) return v;
    if (typeof v === "string") { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
    return [];
}

function scoreBadgeColor(score: number): string {
    if (score >= 80) return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (score >= 50) return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-slate-100 text-slate-600 border-slate-300";
}

interface RecommendedJob {
    id: string;
    title: string;
    slug: string;
    status: string;
    budget_type: string;
    budget_min: number | null;
    budget_max: number | null;
    currency: string;
    experience_level: string;
    location_type: string;
    location_regions: unknown;
    location_countries: unknown;
    category_name: string | null;
    client_name: string | null;
    published_at: string | null;
    created_at: string;
    match_score: number;
    match_reasons: string[];
    matched_skills: number;
    total_job_skills: number;
    skills: string[];
}

interface ProfileInfo {
    hourly_rate: number;
    primary_skill: string;
    country: string;
    region: string;
    skill_count: number;
}

export default function RecommendedJobsPage() {
    const { token } = useAuth();
    const [jobs, setJobs] = useState<RecommendedJob[]>([]);
    const [profile, setProfile] = useState<ProfileInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        fetch(`${API_BASE}/jobs/recommended`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((b) => {
                if (b.error) { setError(b.message); return; }
                setJobs(b.data ?? []);
                setProfile(b.profile ?? null);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-5xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                    <p className="text-sm text-red-700">⚠️ {error}</p>
                </div>
            </div>
        );
    }

    const profileIncomplete = profile && !profile.hourly_rate && profile.skill_count === 0 && !profile.country;

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-brand-dark">
                    ✨ Recommended for You
                </h1>
                <p className="text-sm text-brand-muted mt-1">
                    Jobs matched to your skills, rate, and location. {jobs.length} results.
                </p>
            </div>



            {/* Profile incomplete warning */}
            {profileIncomplete && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6 text-center">
                    <div className="text-3xl mb-3">👤</div>
                    <h2 className="text-base font-bold text-amber-800 mb-1">Complete your profile for better matches</h2>
                    <p className="text-sm text-amber-700 mb-4">
                        Add your skills, hourly rate, and location so we can find the best jobs for you.
                    </p>
                    <Link
                        href="/dashboard/settings"
                        className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl transition-colors"
                    >
                        Complete Profile
                    </Link>
                </div>
            )}

            {jobs.length === 0 && !profileIncomplete ? (
                <div className="bg-white rounded-2xl border border-brand-border/60 p-12 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h2 className="text-lg font-bold text-brand-dark mb-2">No recommended jobs right now</h2>
                    <p className="text-sm text-brand-muted mb-6">
                        We couldn&apos;t find jobs matching your profile. Try browsing all open jobs instead.
                    </p>
                    <Link
                        href="/dashboard/jobs"
                        className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl transition-colors"
                    >
                        Browse All Jobs
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {jobs.map((job) => {
                        const st = statusConfig[job.status] ?? statusConfig.open;
                        const budgetLabel =
                            job.budget_type === "fixed"
                                ? `$${job.budget_min?.toLocaleString() ?? "?"} – $${job.budget_max?.toLocaleString() ?? "?"}`
                                : `$${job.budget_min?.toLocaleString() ?? "?"}/hr – $${job.budget_max?.toLocaleString() ?? "?"}/hr`;

                        const locationLabel =
                            job.location_type === "regions"
                                ? toArr(job.location_regions).map((r) => REGION_LABELS[r]?.replace(/^.\s/, "") ?? r).join(", ") || "Regions"
                                : job.location_type === "countries"
                                    ? toArr(job.location_countries).map((cc) => ALL_COUNTRIES.find((c) => c.code === cc)?.name ?? cc).join(", ")
                                    : "🌍 Worldwide";

                        return (
                            <div
                                key={job.id}
                                className="bg-white rounded-2xl border border-brand-border/60 p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        {/* Title + Score */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <Link
                                                href={`/dashboard/jobs/${job.id}`}
                                                className="text-lg font-bold text-brand-dark hover:text-brand-orange transition-colors line-clamp-1"
                                            >
                                                {job.title}
                                            </Link>
                                            <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${scoreBadgeColor(job.match_score)}`}>
                                                {job.match_score}% match
                                            </span>
                                        </div>

                                        {/* Match reasons */}
                                        {job.match_reasons.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {job.match_reasons.map((r, i) => (
                                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-orange/10 text-brand-orange text-[11px] font-medium">
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Meta row */}
                                        <div className="flex flex-wrap items-center gap-2 text-xs">
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

                                        {/* Skills */}
                                        {job.skills && job.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {job.skills.map((s) => (
                                                    <span
                                                        key={s}
                                                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200"
                                                    >
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Client + date */}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-brand-muted">
                                            {job.client_name && <span>👤 {job.client_name}</span>}
                                            {job.published_at && (
                                                <span>Published {new Date(job.published_at).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <div className="shrink-0">
                                        <Link
                                            href={`/dashboard/jobs/${job.id}`}
                                            className="inline-flex items-center px-4 py-2.5 text-xs font-semibold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl transition-colors"
                                        >
                                            View Job
                                        </Link>
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
