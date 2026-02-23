"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

type Job = {
    id: string;
    title: string;
    budget_type: string;
    budget_min: number | null;
    budget_max: number | null;
    currency: string;
    experience_level: string | null;
    category_name?: string;
    published_at: string | null;
    created_at: string;
    proposals_count: number;
};

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
    return "Negotiable";
}

function timeAgo(iso?: string | null) {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
}

/* ── Fallback data shown while API loads or if it returns empty ── */
const FALLBACK: Job[] = [
    { id: "1", title: "Full-Stack Engineer for SaaS Dashboard", budget_type: "fixed", budget_min: 5000, budget_max: 12000, currency: "USD", experience_level: "intermediate", category_name: "Web Development", published_at: null, created_at: new Date().toISOString(), proposals_count: 8 },
    { id: "2", title: "Mobile App Redesign (iOS + Android)", budget_type: "fixed", budget_min: 8000, budget_max: 15000, currency: "USD", experience_level: "expert", category_name: "Mobile Development", published_at: null, created_at: new Date().toISOString(), proposals_count: 12 },
    { id: "3", title: "AI-Powered Chatbot Integration", budget_type: "fixed", budget_min: 3000, budget_max: 7000, currency: "USD", experience_level: "intermediate", category_name: "Data Science & AI", published_at: null, created_at: new Date().toISOString(), proposals_count: 5 },
    { id: "4", title: "Brand Identity & Landing Page Design", budget_type: "fixed", budget_min: 2000, budget_max: 5000, currency: "USD", experience_level: "entry", category_name: "UI/UX Design", published_at: null, created_at: new Date().toISOString(), proposals_count: 19 },
];

export default function LatestJobs() {
    const [jobs, setJobs] = useState<Job[]>(FALLBACK);

    useEffect(() => {
        fetch(`${API_BASE}/jobs?per_page=4&status=open`)
            .then((r) => r.json())
            .then((b) => {
                const data = b.data ?? [];
                if (data.length > 0) setJobs(data);
            })
            .catch(() => {});
    }, []);

    return (
        <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark">
                            Latest projects looking for talent
                        </h2>
                        <p className="mt-2 text-brand-muted">Fresh opportunities posted today</p>
                    </div>
                    <Link
                        href="/register"
                        className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors"
                    >
                        Browse all jobs
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {jobs.map((job) => (
                        <Link
                            key={job.id}
                            href="/register"
                            className="group bg-white rounded-2xl p-6 border border-brand-border/60 hover:border-brand-orange/30 shadow-sm hover:shadow-[0_8px_32px_rgba(240,138,17,0.1)] transition-all duration-300 flex flex-col"
                        >
                            {/* category tag */}
                            {job.category_name && (
                                <span className="self-start text-xs font-semibold text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-full mb-3">
                                    {job.category_name}
                                </span>
                            )}

                            {/* title */}
                            <h3 className="text-sm font-bold text-brand-dark group-hover:text-brand-orange transition-colors line-clamp-2 mb-3">
                                {job.title}
                            </h3>

                            {/* budget */}
                            <p className="text-lg font-bold text-brand-dark mb-3">
                                {formatBudget(job)}
                            </p>

                            {/* meta */}
                            <div className="mt-auto flex items-center justify-between text-xs text-brand-muted pt-3 border-t border-brand-border/40">
                                <span>{timeAgo(job.published_at || job.created_at)}</span>
                                <span>{job.proposals_count} proposals</span>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-8 text-center sm:hidden">
                    <Link href="/register" className="text-sm font-semibold text-brand-orange">
                        Browse all jobs →
                    </Link>
                </div>
            </div>
        </section>
    );
}
