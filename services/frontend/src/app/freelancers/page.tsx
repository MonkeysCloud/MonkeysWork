"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

type Freelancer = {
    id: string;
    display_name: string;
    headline: string | null;
    avatar_url: string | null;
    country: string | null;
    hourly_rate: number | null;
    experience_years: number | null;
    skills: Array<{ name: string }> | string[] | null;
    avg_rating: number | null;
    total_jobs_completed: number | null;
    profile_completeness?: number;
};

function getInitials(name: string) {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function renderStars(rating: number | null) {
    const r = rating || 0;
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <svg
                    key={i}
                    className={`w-3.5 h-3.5 ${i <= r ? "text-amber-400" : "text-gray-200"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
            {r > 0 && <span className="text-[11px] text-brand-muted ml-1">{r.toFixed(1)}</span>}
        </div>
    );
}

const BENEFITS = [
    { icon: "🤖", title: "AI-Powered Matching", desc: "Smart algorithms connect you with the right talent instantly." },
    { icon: "🔒", title: "Secure Payments", desc: "Escrow protection ensures you only pay for approved work." },
    { icon: "📋", title: "Milestone Tracking", desc: "Break projects into milestones for transparent progress." },
    { icon: "⭐", title: "Verified Profiles", desc: "Identity, skills, and work history verified for trust." },
    { icon: "💬", title: "Built-in Chat", desc: "Real-time messaging keeps collaboration seamless." },
    { icon: "📊", title: "Performance Stats", desc: "Ratings, completion rates, and reviews at a glance." },
];

const STATS = [
    { value: "50K+", label: "Freelancers" },
    { value: "120+", label: "Skill Categories" },
    { value: "4.8★", label: "Avg Rating" },
    { value: "95%", label: "Success Rate" },
];

export default function FreelancersPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
    const [loading, setLoading] = useState(true);

    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (isAuthenticated && user) {
            router.replace("/dashboard/freelancers");
        }
    }, [isAuthenticated, user, router]);

    // Fetch featured freelancers
    useEffect(() => {
        if (isAuthenticated) return;
        fetch(`${API_BASE}/freelancers?per_page=6`)
            .then((r) => r.json())
            .then((b) => setFreelancers(b.data ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [isAuthenticated]);

    if (isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* ── Hero Section ────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-950 pt-32 pb-20">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-brand-orange/10 rounded-full blur-3xl" />

                <div className="relative max-w-6xl mx-auto px-4 text-center">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-xs font-bold mb-6">
                        ⚡ AI-powered talent matching
                    </span>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
                        Discover World-Class
                        <span className="block text-brand-orange">Freelance Talent</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
                        Access a global network of verified professionals — developers, designers, marketers, and more.
                        Hire with confidence using AI-powered matching and secure payments.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="px-8 py-4 text-base font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_8px_32px_rgba(240,138,17,0.55)] transition-all duration-300 hover:-translate-y-0.5"
                        >
                            Start Hiring Today →
                        </Link>
                        <Link
                            href="/how-it-works/clients"
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

            {/* ── Featured Freelancers ────────────────────── */}
            <section className="max-w-6xl mx-auto px-4 py-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight mb-3">
                        Featured <span className="text-brand-orange">Talent</span>
                    </h2>
                    <p className="text-brand-muted max-w-lg mx-auto">
                        Top-rated professionals ready to bring your projects to life. Sign up to view full profiles.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-3 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
                    </div>
                ) : freelancers.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-brand-border/60">
                        <span className="text-5xl block mb-4">🌟</span>
                        <h3 className="text-lg font-bold text-brand-dark mb-2">Talent marketplace growing fast</h3>
                        <p className="text-sm text-brand-muted mb-6">Sign up to browse our growing community of professionals.</p>
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
                            {freelancers.map((f) => {
                                const skillList = Array.isArray(f.skills)
                                    ? f.skills.map((s) => (typeof s === "string" ? s : s.name))
                                    : [];
                                const avatarSrc = f.avatar_url
                                    ? f.avatar_url.startsWith("http")
                                        ? f.avatar_url
                                        : `${new URL(API_BASE).origin}${f.avatar_url}`
                                    : null;

                                return (
                                    <div
                                        key={f.id}
                                        className="group bg-white rounded-xl border border-brand-border/60 p-5 hover:shadow-lg hover:border-purple-300/50 transition-all duration-300"
                                    >
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                                                {avatarSrc ? (
                                                    <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    getInitials(f.display_name)
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold text-brand-dark truncate group-hover:text-purple-600 transition-colors">
                                                    {f.display_name}
                                                </h3>
                                                <p className="text-xs text-brand-muted truncate">
                                                    {f.headline || "Freelancer"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mb-3 text-[11px] text-brand-muted">
                                            {renderStars(f.avg_rating)}
                                            {f.total_jobs_completed != null && f.total_jobs_completed > 0 && (
                                                <span>{f.total_jobs_completed} jobs</span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {skillList.slice(0, 4).map((s) => (
                                                <span
                                                    key={s}
                                                    className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-semibold rounded-full border border-purple-100"
                                                >
                                                    {s}
                                                </span>
                                            ))}
                                            {skillList.length > 4 && (
                                                <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] font-semibold rounded-full">
                                                    +{skillList.length - 4}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm">
                                                {f.hourly_rate != null && (
                                                    <span className="font-bold text-brand-dark">${f.hourly_rate}/hr</span>
                                                )}
                                                {f.country && (
                                                    <span className="text-brand-muted text-xs ml-2">📍 {f.country}</span>
                                                )}
                                            </div>
                                        </div>

                                        <Link
                                            href="/register"
                                            className="block text-center w-full mt-3 py-2 text-xs font-bold text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-600 hover:text-white transition-all duration-200"
                                        >
                                            Sign Up to Contact →
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="text-center mt-10">
                            <Link
                                href="/register"
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-orange text-white font-bold rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.35)] hover:shadow-[0_8px_32px_rgba(240,138,17,0.5)] transition-all duration-300 hover:-translate-y-0.5"
                            >
                                Browse All Freelancers →
                            </Link>
                        </div>
                    </>
                )}
            </section>

            {/* ── Why Hire on MonkeysWork ──────────────────── */}
            <section className="bg-gray-50/80 py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-brand-dark tracking-tight mb-3">
                            Why Hire on <span className="text-brand-orange">MonkeysWork</span>
                        </h2>
                        <p className="text-brand-muted">Everything you need to hire, collaborate, and pay — in one platform.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {BENEFITS.map((b) => (
                            <div
                                key={b.title}
                                className="bg-white rounded-xl border border-brand-border/60 p-6 hover:shadow-md transition-all"
                            >
                                <span className="text-3xl mb-3 block">{b.icon}</span>
                                <h3 className="text-sm font-bold text-brand-dark mb-1">{b.title}</h3>
                                <p className="text-xs text-brand-muted">{b.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Section ─────────────────────────────── */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="bg-gradient-to-br from-indigo-950 to-purple-950 rounded-3xl p-12 sm:p-16 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl" />
                        <div className="relative">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                                Ready to Build Your Dream Team?
                            </h2>
                            <p className="text-gray-300 max-w-lg mx-auto mb-8">
                                Post your first job and get proposals from verified freelancers within hours.
                                It&apos;s free to get started.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Link
                                    href="/register"
                                    className="px-8 py-4 text-base font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_8px_32px_rgba(240,138,17,0.55)] transition-all duration-300 hover:-translate-y-0.5"
                                >
                                    Post a Job — Free
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
