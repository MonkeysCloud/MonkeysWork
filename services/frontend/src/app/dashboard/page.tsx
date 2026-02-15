"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

/* ── Stat card ──────────────────────────────────────── */
function StatCard({
    icon,
    label,
    value,
    change,
}: {
    icon: string;
    label: string;
    value: string;
    change?: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-brand-border/60 p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{icon}</span>
                {change && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {change}
                    </span>
                )}
            </div>
            <div className="text-2xl font-extrabold text-brand-dark">
                {value}
            </div>
            <div className="text-xs text-brand-muted mt-1">{label}</div>
        </div>
    );
}

/* ── Quick action ───────────────────────────────────── */
function QuickAction({
    icon,
    label,
    desc,
    href,
    accent,
}: {
    icon: string;
    label: string;
    desc: string;
    href: string;
    accent?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`
                flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5
                ${accent
                    ? "bg-brand-orange text-white border-brand-orange shadow-[0_4px_20px_rgba(240,138,17,0.3)] hover:shadow-[0_6px_28px_rgba(240,138,17,0.45)]"
                    : "bg-white border-brand-border/60 hover:shadow-md"
                }
            `}
        >
            <span className="text-2xl">{icon}</span>
            <div>
                <div
                    className={`text-sm font-bold ${accent ? "text-white" : "text-brand-dark"}`}
                >
                    {label}
                </div>
                <div
                    className={`text-xs ${accent ? "text-white/70" : "text-brand-muted"}`}
                >
                    {desc}
                </div>
            </div>
        </Link>
    );
}

/* ── Activity item ──────────────────────────────────── */
function ActivityItem({
    icon,
    text,
    time,
}: {
    icon: string;
    text: string;
    time: string;
}) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-brand-border/40 last:border-0">
            <span className="text-lg mt-0.5">{icon}</span>
            <div className="flex-1 min-w-0">
                <div className="text-sm text-brand-dark">{text}</div>
                <div className="text-xs text-brand-muted mt-0.5">{time}</div>
            </div>
        </div>
    );
}

/* ── Page ───────────────────────────────────────────── */
export default function DashboardOverview() {
    const { user } = useAuth();
    if (!user) return null;

    const isClient = user.role === "client";

    return (
        <div>
            {/* greeting */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
                    Welcome back, {user.display_name}
                </h1>
                <p className="text-sm text-brand-muted mt-1">
                    {isClient
                        ? "Here's an overview of your hiring activity."
                        : "Here's an overview of your freelance activity."}
                </p>
            </div>

            {/* stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {isClient ? (
                    <>
                        <StatCard
                            icon="📋"
                            label="Active Jobs"
                            value="0"
                        />
                        <StatCard
                            icon="📝"
                            label="Pending Proposals"
                            value="0"
                        />
                        <StatCard
                            icon="📄"
                            label="Active Contracts"
                            value="0"
                        />
                        <StatCard
                            icon="💰"
                            label="Total Spent"
                            value="$0"
                        />
                    </>
                ) : (
                    <>
                        <StatCard
                            icon="🔍"
                            label="Available Jobs"
                            value="0"
                        />
                        <StatCard
                            icon="📝"
                            label="Pending Proposals"
                            value="0"
                        />
                        <StatCard
                            icon="📄"
                            label="Active Contracts"
                            value="0"
                        />
                        <StatCard
                            icon="💰"
                            label="Total Earned"
                            value="$0"
                        />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* quick actions */}
                <div className="lg:col-span-1">
                    <h2 className="text-lg font-bold text-brand-dark mb-4">
                        Quick Actions
                    </h2>
                    <div className="space-y-3">
                        {isClient ? (
                            <>
                                <QuickAction
                                    icon="📋"
                                    label="Post a Job"
                                    desc="Create a new job listing"
                                    href="/dashboard/jobs/create"
                                    accent
                                />
                                <QuickAction
                                    icon="🔍"
                                    label="Browse Talent"
                                    desc="Find the right freelancer"
                                    href="/freelancers"
                                />
                                <QuickAction
                                    icon="📝"
                                    label="Review Proposals"
                                    desc="Check latest submissions"
                                    href="/dashboard/proposals"
                                />
                            </>
                        ) : (
                            <>
                                <QuickAction
                                    icon="🔍"
                                    label="Browse Jobs"
                                    desc="Find your next project"
                                    href="/jobs"
                                    accent
                                />
                                <QuickAction
                                    icon="👤"
                                    label="Update Profile"
                                    desc="Keep your profile fresh"
                                    href="/dashboard/settings/profile"
                                />
                                <QuickAction
                                    icon="📝"
                                    label="My Proposals"
                                    desc="Track your submissions"
                                    href="/dashboard/proposals"
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* recent activity */}
                <div className="lg:col-span-2">
                    <h2 className="text-lg font-bold text-brand-dark mb-4">
                        Recent Activity
                    </h2>
                    <div className="bg-white rounded-xl border border-brand-border/60 p-5">
                        <div className="text-center py-8">
                            <span className="text-4xl mb-3 block">📭</span>
                            <p className="text-sm text-brand-muted">
                                No recent activity yet.
                                {isClient
                                    ? " Post your first job to get started!"
                                    : " Browse available jobs to get started!"}
                            </p>
                            <Link
                                href={
                                    isClient
                                        ? "/dashboard/jobs/create"
                                        : "/jobs"
                                }
                                className="inline-block mt-4 px-5 py-2 text-sm font-semibold text-brand-orange border border-brand-orange/30 rounded-lg hover:bg-brand-orange-light transition-colors"
                            >
                                {isClient
                                    ? "Post a Job"
                                    : "Browse Jobs"}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
