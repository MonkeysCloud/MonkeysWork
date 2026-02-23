"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

type Freelancer = {
    id?: string;
    user_id?: string;
    display_name: string;
    headline: string | null;
    avatar_url: string | null;
    hourly_rate: number | null;
    avg_rating: number | null;
    total_jobs_completed: number | null;
    skills: Array<{ name: string }> | string[] | null;
};

function getInitials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
    "bg-violet-500", "bg-blue-500", "bg-pink-500",
    "bg-emerald-500", "bg-amber-500", "bg-cyan-500",
];

function Stars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <svg
                    key={i}
                    width="14"
                    height="14"
                    viewBox="0 0 20 20"
                    fill={i <= Math.floor(rating) ? "#f08a11" : "none"}
                    stroke="#f08a11"
                    strokeWidth="1.5"
                >
                    <path d="M10 1.5l2.47 5.01L18 7.24l-4 3.9.94 5.49L10 13.88l-4.94 2.75.94-5.49-4-3.9 5.53-.73L10 1.5z" />
                </svg>
            ))}
        </div>
    );
}

/* ── Fallback data shown while API loads or if it returns empty ── */
const FALLBACK: Freelancer[] = [
    { id: "1", display_name: "Sofia Martinez", headline: "Senior React & Next.js Engineer", avatar_url: null, hourly_rate: 85, avg_rating: 4.9, total_jobs_completed: 127, skills: [{ name: "React" }, { name: "TypeScript" }, { name: "Node.js" }] },
    { id: "2", display_name: "Alex Chen", headline: "Full-Stack Developer & AI Specialist", avatar_url: null, hourly_rate: 120, avg_rating: 5.0, total_jobs_completed: 84, skills: [{ name: "Python" }, { name: "FastAPI" }, { name: "ML" }] },
    { id: "3", display_name: "Maya Johnson", headline: "Product Designer & Brand Strategist", avatar_url: null, hourly_rate: 95, avg_rating: 4.8, total_jobs_completed: 203, skills: [{ name: "Figma" }, { name: "UI/UX" }, { name: "Branding" }] },
    { id: "4", display_name: "Raj Patel", headline: "DevOps & Cloud Architecture Expert", avatar_url: null, hourly_rate: 110, avg_rating: 4.9, total_jobs_completed: 156, skills: [{ name: "AWS" }, { name: "Terraform" }, { name: "Kubernetes" }] },
    { id: "5", display_name: "Emma Wilson", headline: "Technical Writer & Content Strategist", avatar_url: null, hourly_rate: 65, avg_rating: 5.0, total_jobs_completed: 91, skills: [{ name: "Copywriting" }, { name: "SEO" }, { name: "Docs" }] },
    { id: "6", display_name: "Carlos Rivera", headline: "Mobile App Developer (iOS/Android)", avatar_url: null, hourly_rate: 90, avg_rating: 4.7, total_jobs_completed: 68, skills: [{ name: "Swift" }, { name: "Kotlin" }, { name: "Flutter" }] },
];

export default function TopFreelancers() {
    const [freelancers, setFreelancers] = useState<Freelancer[]>(FALLBACK);

    useEffect(() => {
        fetch(`${API_BASE}/freelancers?per_page=6`)
            .then((r) => r.json())
            .then((b) => {
                const data = b.data ?? [];
                if (data.length > 0) setFreelancers(data);
            })
            .catch(() => {});
    }, []);

    return (
        <section className="py-20 sm:py-28 bg-brand-dark/[0.02]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-end justify-between mb-10">
                    <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark">
                        Featured freelancers
                    </h2>
                    <Link
                        href="/register"
                        className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors"
                    >
                        Explore freelancers
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {/* horizontal scroll */}
                <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
                    {freelancers.map((f, idx) => {
                        const skillList = Array.isArray(f.skills)
                            ? f.skills.map((s) => (typeof s === "string" ? s : s.name))
                            : [];
                        const rating = Number(f.avg_rating) || 0;
                        const avatarSrc = f.avatar_url
                            ? f.avatar_url.startsWith("http") ? f.avatar_url : `${new URL(API_BASE).origin}${f.avatar_url}`
                            : null;

                        return (
                            <Link
                                key={f.user_id || f.id || idx}
                                href="/register"
                                className="flex-shrink-0 snap-start w-[260px] group bg-white rounded-2xl p-6 border border-brand-border/60 hover:border-brand-orange/30 shadow-sm hover:shadow-[0_8px_32px_rgba(240,138,17,0.1)] transition-all duration-300"
                            >
                                {/* avatar + name */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-12 h-12 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden`}>
                                        {avatarSrc ? (
                                            <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            getInitials(f.display_name)
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-bold text-brand-dark truncate">{f.display_name}</span>
                                            <svg width="14" height="14" viewBox="0 0 20 20" fill="#f08a11">
                                                <path d="M10 0l2.24 3.76L16.5 2.5l-1.26 4.24L20 8.76l-3.76 2.24L17.5 15.5l-4.24-1.26L11.24 20H8.76l-2.02-5.76L2.5 15.5l1.26-4.26L0 8.76l4.74-2.02L3.5 2.5l4.26 1.26L10 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-xs text-brand-muted truncate">{f.headline || "Freelancer"}</p>
                                    </div>
                                </div>

                                {/* rating */}
                                <div className="flex items-center gap-2 mb-3">
                                    <Stars rating={rating} />
                                    <span className="text-xs font-semibold text-brand-dark">{rating.toFixed(1)}</span>
                                    {f.total_jobs_completed != null && f.total_jobs_completed > 0 && (
                                        <span className="text-xs text-brand-muted">({f.total_jobs_completed})</span>
                                    )}
                                </div>

                                {/* rate */}
                                {f.hourly_rate != null && (
                                    <p className="text-lg font-bold text-brand-dark mb-3">
                                        ${f.hourly_rate}<span className="text-xs font-normal text-brand-muted">/hr</span>
                                    </p>
                                )}

                                {/* skills */}
                                <div className="flex flex-wrap gap-1.5">
                                    {skillList.slice(0, 3).map((s) => (
                                        <span key={s} className="text-[11px] font-medium text-brand-muted bg-brand-dark/5 px-2 py-0.5 rounded-md">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-6 text-center sm:hidden">
                    <Link href="/register" className="text-sm font-semibold text-brand-orange">
                        Explore freelancers →
                    </Link>
                </div>
            </div>
        </section>
    );
}
