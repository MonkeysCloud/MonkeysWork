"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

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
    category_name?: string;
    client_name?: string;
    published_at: string | null;
    created_at: string;
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
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
}

const CATEGORIES = [
    { icon: "💻", label: "Web Development" },
    { icon: "📱", label: "Mobile Apps" },
    { icon: "🎨", label: "Design & Creative" },
    { icon: "📊", label: "Data Science" },
    { icon: "✍️", label: "Content Writing" },
    { icon: "📈", label: "Marketing" },
];

const STATS = [
    { value: "10K+", label: "Active Projects" },
    { value: "50K+", label: "Freelancers" },
    { value: "$2M+", label: "Paid Out" },
    { value: "95%", label: "Satisfaction" },
];

export default function JobsPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (isAuthenticated && user) {
            router.replace("/dashboard/jobs");
        }
    }, [isAuthenticated, user, router]);

    // Fetch latest public jobs
    useEffect(() => {
        if (isAuthenticated) return;
        fetch(`${API_BASE}/jobs?per_page=6&status=open`)
            .then((r) => r.json())
            .then((b) => setJobs(b.data ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [isAuthenticated]);

    if (isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* ── Hero Section ────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-gray-900 to-brand-dark pt-32 pb-20">
                {/* Decorative blobs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />

                <div className="relative max-w-6xl mx-auto px-4 text-center">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-bold mb-6">
                        🔥 New projects posted daily
                    </span>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
                        Find Your Next
                        <span className="block text-brand-orange">Dream Project</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
                        Browse thousands of projects from verified clients worldwide. Whether you&apos;re a developer,
                        designer, or marketer — your next opportunity is waiting.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="px-8 py-4 text-base font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_8px_32px_rgba(240,138,17,0.55)] transition-all duration-300 hover:-translate-y-0.5"
                        >
                            Get Started Free →
                        </Link>
                        <Link
                            href="/how-it-works/freelancers"
                            className="px-8 py-4 text-base font-semibold text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 rounded-xl transition-all duration-200"
                        >
                            How It Works
                        </Link>
                    </div>

                    {/* Stats bar */}
                    <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
                        {STATS.map((s) => (
                            <div key={s.label} className="text-center">
                                <div className="text-2xl sm:text-3xl font-extrabold text-white">{s.value}</div>
                                <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Latest Jobs ─────────────────────────────── */}
            <section className="max-w-6xl mx-auto px-4 py-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight mb-3">
                        Latest <span className="text-brand-orange">Open Projects</span>
                    </h2>
                    <p className="text-brand-muted max-w-lg mx-auto">
                        Fresh opportunities posted by verified clients. Sign up to apply and start working today.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-3 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-brand-border/60">
                        <span className="text-5xl block mb-4">🚀</span>
                        <h3 className="text-lg font-bold text-brand-dark mb-2">New projects coming soon</h3>
                        <p className="text-sm text-brand-muted mb-6">Sign up now to be the first to apply when they drop.</p>
                        <Link
                            href="/register"
                            className="px-6 py-3 bg-brand-orange text-white font-bold text-sm rounded-xl shadow-[0_4px_20px_rgba(240,138,17,0.3)] hover:shadow-lg transition-all"
                        >
                            Create Free Account
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {jobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="group bg-white rounded-xl border border-brand-border/60 p-5 hover:shadow-lg hover:border-brand-orange/30 transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                                            🟢 Open
                                        </span>
                                        <span className="text-[11px] text-brand-muted">
                                            {timeAgo(job.published_at || job.created_at)}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-brand-dark mb-2 line-clamp-2 group-hover:text-brand-orange transition-colors">
                                        {job.title}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mb-3 text-[11px] text-brand-muted">
                                        <span className="inline-flex items-center gap-1">
                                            💰 {formatBudget(job)}
                                        </span>
                                        {job.experience_level && (
                                            <span className="capitalize">📊 {job.experience_level}</span>
                                        )}
                                        {job.category_name && (
                                            <span>📁 {job.category_name}</span>
                                        )}
                                        <span className="capitalize">⏱️ {job.budget_type}</span>
                                    </div>
                                    <Link
                                        href="/register"
                                        className="block text-center w-full py-2 text-xs font-bold text-brand-orange border border-brand-orange/30 rounded-lg hover:bg-brand-orange hover:text-white transition-all duration-200"
                                    >
                                        Sign Up to Apply →
                                    </Link>
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-10">
                            <Link
                                href="/register"
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-orange text-white font-bold rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.35)] hover:shadow-[0_8px_32px_rgba(240,138,17,0.5)] transition-all duration-300 hover:-translate-y-0.5"
                            >
                                Sign Up to See All Projects →
                            </Link>
                        </div>
                    </>
                )}
            </section>

            {/* ── Browse by Category ──────────────────────── */}
            <section className="bg-gray-50/80 py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-brand-dark tracking-tight mb-3">
                            Browse by <span className="text-brand-orange">Category</span>
                        </h2>
                        <p className="text-brand-muted">Find projects in your area of expertise</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {CATEGORIES.map((cat) => (
                            <Link
                                key={cat.label}
                                href="/register"
                                className="flex flex-col items-center gap-3 p-5 bg-white rounded-xl border border-brand-border/60 hover:shadow-md hover:border-brand-orange/30 transition-all duration-200 group"
                            >
                                <span className="text-3xl">{cat.icon}</span>
                                <span className="text-xs font-semibold text-brand-dark group-hover:text-brand-orange transition-colors text-center">
                                    {cat.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Section ─────────────────────────────── */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="bg-gradient-to-br from-brand-dark to-gray-900 rounded-3xl p-12 sm:p-16 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl" />
                        <div className="relative">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                                Ready to Start Freelancing?
                            </h2>
                            <p className="text-gray-300 max-w-lg mx-auto mb-8">
                                Join thousands of freelancers who are building their careers on MonkeysWork.
                                It&apos;s free to sign up and start applying.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Link
                                    href="/register"
                                    className="px-8 py-4 text-base font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_8px_32px_rgba(240,138,17,0.55)] transition-all duration-300 hover:-translate-y-0.5"
                                >
                                    Create Free Account
                                </Link>
                                <Link
                                    href="/login"
                                    className="px-8 py-4 text-base font-semibold text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 rounded-xl transition-all duration-200"
                                >
                                    Already have an account? Log in
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
