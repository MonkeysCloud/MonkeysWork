"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ContractCard, type Contract, API } from "@/components/contracts";

/* ── Types ── */
interface DashboardStats {
    role: string;
    period: string;
    overview: Record<string, number | string | boolean>;
    contracts: Record<string, number>;
    proposals?: Record<string, number>;
    proposals_received?: Record<string, number>;
    jobs?: Record<string, number>;
    invoices?: Record<string, number>;
    disputes?: Record<string, number>;
    time_tracking?: Record<string, number>;
    earnings_timeline?: { bucket: string; amount: number }[];
    spending_timeline?: { bucket: string; amount: number }[];
    revenue_timeline?: { bucket: string; amount: number }[];
}

/* ── Stat card ── */
function StatCard({
    icon,
    label,
    value,
    change,
    subtext,
}: {
    icon: string;
    label: string;
    value: string;
    change?: string;
    subtext?: string;
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
            {subtext && (
                <div className="text-[10px] text-brand-muted/60 mt-0.5">{subtext}</div>
            )}
        </div>
    );
}

/* ── Quick action ── */
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

/* ── Mini bar chart ── */
function SparkChart({ data, color }: { data: { bucket: string; amount: number }[]; color: string }) {
    const max = Math.max(...data.map((d) => d.amount), 1);
    return (
        <div className="flex items-end gap-[3px] h-16">
            {data.map((d, i) => (
                <div
                    key={i}
                    className="flex-1 rounded-t-sm transition-all duration-300"
                    style={{
                        height: `${Math.max((d.amount / max) * 100, 4)}%`,
                        backgroundColor: d.amount > 0 ? color : `${color}22`,
                    }}
                    title={`${d.bucket}: $${d.amount.toFixed(2)}`}
                />
            ))}
        </div>
    );
}

/* ── Activity row ── */
function ActivityRow({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-brand-border/30 last:border-0">
            <div className="flex items-center gap-2">
                <span className="text-sm">{icon}</span>
                <span className="text-xs text-brand-muted">{label}</span>
            </div>
            <span className="text-sm font-bold" style={{ color }}>{value}</span>
        </div>
    );
}

/* ── Helpers ── */
function fmtMoney(n: number) {
    return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(2)}`;
}

/* ── Page ── */
export default function DashboardOverview() {
    const { user, token } = useAuth();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loadingContracts, setLoadingContracts] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    const isClient = user?.role === "client";
    const isAdmin = user?.role === "admin";

    /* Fetch active contracts */
    useEffect(() => {
        if (!token) return;
        setLoadingContracts(true);
        fetch(`${API}/contracts?status=active`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const json = await r.json();
                setContracts(json.data ?? []);
            })
            .catch(() => setContracts([]))
            .finally(() => setLoadingContracts(false));
    }, [token]);

    /* Fetch dashboard stats */
    useEffect(() => {
        if (!token) return;
        setLoadingStats(true);
        fetch(`${API}/stats?period=30d`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const json = await r.json();
                setStats(json.data ?? null);
            })
            .catch(() => setStats(null))
            .finally(() => setLoadingStats(false));
    }, [token]);

    if (!user) return null;

    /* Shorthand for stats data */
    const o = stats?.overview ?? {};
    const p = (isClient ? stats?.proposals_received : stats?.proposals) ?? {};
    const j = stats?.jobs ?? {};
    const c = stats?.contracts ?? {};
    const inv = stats?.invoices ?? {};
    const d = stats?.disputes ?? {};
    const t = stats?.time_tracking ?? {};
    const timeline = isAdmin
        ? (stats?.revenue_timeline ?? [])
        : (isClient ? stats?.spending_timeline : stats?.earnings_timeline) ?? [];

    const loading = loadingStats ? "…" : undefined;

    return (
        <div>
            {/* greeting */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
                    Welcome back, {user.display_name}
                </h1>
                <p className="text-sm text-brand-muted mt-1">
                    {isAdmin
                        ? "Platform overview — all metrics at a glance."
                        : isClient
                            ? "Here's an overview of your hiring activity."
                            : "Here's an overview of your freelance activity."}
                </p>
            </div>

            {/* primary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {isAdmin ? (
                    <>
                        <StatCard
                            icon="👥"
                            label="Total Users"
                            value={loading ?? String(o.total_users ?? 0)}
                            subtext={`${o.freelancers ?? 0} freelancers · ${o.clients ?? 0} clients`}
                        />
                        <StatCard
                            icon="💰"
                            label="Platform Revenue"
                            value={loading ?? fmtMoney(Number(o.total_revenue ?? 0))}
                            change={Number(o.period_revenue ?? 0) > 0 ? `+${fmtMoney(Number(o.period_revenue))} this period` : undefined}
                        />
                        <StatCard
                            icon="📄"
                            label="Active Contracts"
                            value={loading ?? String(o.active_contracts ?? 0)}
                        />
                        <StatCard
                            icon="⚠️"
                            label="Open Disputes"
                            value={loading ?? String(o.open_disputes ?? 0)}
                        />
                    </>
                ) : isClient ? (
                    <>
                        <StatCard
                            icon="📋"
                            label="Active Jobs"
                            value={loading ?? String((j.open ?? 0) + (j.in_progress ?? 0))}
                            subtext={j.draft ? `${j.draft} draft` : undefined}
                        />
                        <StatCard
                            icon="📝"
                            label="Pending Proposals"
                            value={loading ?? String(p.pending ?? 0)}
                            subtext={p.total ? `${p.total} total received` : undefined}
                        />
                        <StatCard
                            icon="📄"
                            label="Active Contracts"
                            value={loading ?? String(o.active_contracts ?? contracts.length)}
                        />
                        <StatCard
                            icon="💰"
                            label="Total Spent"
                            value={loading ?? fmtMoney(Number(o.total_spent ?? 0))}
                            change={Number(o.period_spent ?? 0) > 0 ? `+${fmtMoney(Number(o.period_spent))} this month` : undefined}
                        />
                    </>
                ) : (
                    <>
                        <StatCard
                            icon="📄"
                            label="Active Contracts"
                            value={loading ?? String(o.active_contracts ?? contracts.length)}
                        />
                        <StatCard
                            icon="📝"
                            label="Pending Proposals"
                            value={loading ?? String(p.pending ?? 0)}
                            subtext={p.total ? `${p.total} total sent` : undefined}
                        />
                        <StatCard
                            icon="⏱️"
                            label="Hours This Week"
                            value={loading ?? `${t.hours_this_week ?? 0}h`}
                            subtext={t.total_hours ? `${t.total_hours}h total` : undefined}
                        />
                        <StatCard
                            icon="💰"
                            label="Total Earned"
                            value={loading ?? fmtMoney(Number(o.total_earnings ?? 0))}
                            change={Number(o.period_earnings ?? 0) > 0 ? `+${fmtMoney(Number(o.period_earnings))} this month` : undefined}
                        />
                    </>
                )}
            </div>

            {/* secondary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {isAdmin ? (
                    <>
                        <StatCard
                            icon="📋"
                            label="Total Jobs"
                            value={loading ?? String(j.total ?? 0)}
                            subtext={`${j.open ?? 0} open`}
                        />
                        <StatCard
                            icon="📄"
                            label="Total Contracts"
                            value={loading ?? String(c.total ?? 0)}
                            subtext={fmtMoney(c.total_value ?? 0) + " value"}
                        />
                        <StatCard
                            icon="✅"
                            label="Completed Contracts"
                            value={loading ?? String(c.completed ?? 0)}
                            subtext={fmtMoney(c.completed_value ?? 0) + " earned"}
                        />
                        <StatCard
                            icon="🛡️"
                            label="Disputes"
                            value={loading ?? String(d.total ?? 0)}
                            subtext={`${d.resolved ?? 0} resolved`}
                        />
                    </>
                ) : isClient ? (
                    <>
                        <StatCard
                            icon="👥"
                            label="Total Hires"
                            value={loading ?? String(o.total_hires ?? 0)}
                        />
                        <StatCard
                            icon="📊"
                            label="Avg Proposals/Job"
                            value={loading ?? String(j.avg_proposals_per_job ?? 0)}
                        />
                        <StatCard
                            icon="👁️"
                            label="Job Views"
                            value={loading ?? String(j.total_views ?? 0)}
                        />
                        <StatCard
                            icon="🧾"
                            label="Pending Invoices"
                            value={loading ?? String(inv.pending ?? 0)}
                            subtext={inv.overdue ? `${inv.overdue} overdue` : undefined}
                        />
                    </>
                ) : (
                    <>
                        <StatCard
                            icon="✅"
                            label="Jobs Completed"
                            value={loading ?? String(o.jobs_completed ?? 0)}
                        />
                        <StatCard
                            icon="📊"
                            label="Acceptance Rate"
                            value={loading ?? `${p.acceptance_rate ?? 0}%`}
                        />
                        <StatCard
                            icon="⭐"
                            label="Avg Rating"
                            value={loading ?? String(Number(o.avg_rating ?? 0).toFixed(1))}
                            subtext={o.total_reviews ? `${o.total_reviews} reviews` : undefined}
                        />
                        <StatCard
                            icon="💵"
                            label="Hourly Rate"
                            value={loading ?? `$${Number(o.hourly_rate ?? 0).toFixed(0)}/hr`}
                        />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* left column: quick actions + activity breakdown */}
                <div className="lg:col-span-1 space-y-6">
                    <div>
                        <h2 className="text-lg font-bold text-brand-dark mb-4">
                            Quick Actions
                        </h2>
                        <div className="space-y-3">
                            {isAdmin ? (
                                <>
                                    <QuickAction
                                        icon="📰"
                                        label="Blog Posts"
                                        desc="Manage blog content"
                                        href="/dashboard/admin/blog"
                                        accent
                                    />
                                    <QuickAction
                                        icon="👥"
                                        label="Manage Users"
                                        desc="View and manage accounts"
                                        href="/dashboard/admin/users"
                                    />
                                    <QuickAction
                                        icon="📄"
                                        label="Contracts"
                                        desc="Review all contracts"
                                        href="/dashboard/admin/contracts"
                                    />
                                    <QuickAction
                                        icon="⚠️"
                                        label="Disputes"
                                        desc="Resolve open disputes"
                                        href="/dashboard/admin/disputes"
                                    />
                                </>
                            ) : isClient ? (
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
                                        href="/dashboard/freelancers"
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

                    {/* Activity breakdown */}
                    {!loadingStats && stats && (
                        <div className="bg-white rounded-xl border border-brand-border/60 p-5">
                            <h3 className="text-sm font-bold text-brand-dark mb-3">
                                {isAdmin ? "Platform Activity" : isClient ? "Hiring Activity" : "Proposal Activity"}
                            </h3>
                            {isAdmin ? (
                                <>
                                    <ActivityRow icon="📋" label="Open jobs" value={j.open ?? 0} color="#f08a11" />
                                    <ActivityRow icon="🔄" label="In progress" value={j.in_progress ?? 0} color="#3b82f6" />
                                    <ActivityRow icon="✅" label="Completed jobs" value={j.completed ?? 0} color="#22c55e" />
                                    <ActivityRow icon="📄" label="Active contracts" value={c.active ?? 0} color="#8b5cf6" />
                                    <ActivityRow icon="⚠️" label="Open disputes" value={d.open ?? 0} color="#ef4444" />
                                </>
                            ) : isClient ? (
                                <>
                                    <ActivityRow icon="📋" label="Open jobs" value={j.open ?? 0} color="#f08a11" />
                                    <ActivityRow icon="📝" label="Proposals received" value={p.total ?? 0} color="#3b82f6" />
                                    <ActivityRow icon="⭐" label="Shortlisted" value={p.shortlisted ?? 0} color="#a855f7" />
                                    <ActivityRow icon="✅" label="Accepted" value={p.accepted ?? 0} color="#22c55e" />
                                    <ActivityRow icon="❌" label="Rejected" value={p.rejected ?? 0} color="#ef4444" />
                                </>
                            ) : (
                                <>
                                    <ActivityRow icon="📝" label="Total proposals" value={p.total ?? 0} color="#3b82f6" />
                                    <ActivityRow icon="👁️" label="Viewed" value={p.viewed ?? 0} color="#8b5cf6" />
                                    <ActivityRow icon="⭐" label="Shortlisted" value={p.shortlisted ?? 0} color="#a855f7" />
                                    <ActivityRow icon="✅" label="Accepted" value={p.accepted ?? 0} color="#22c55e" />
                                    <ActivityRow icon="🔙" label="Withdrawn" value={p.withdrawn ?? 0} color="#6b7280" />
                                </>
                            )}
                        </div>
                    )}

                    {/* Earnings/Spending timeline */}
                    {!loadingStats && timeline.length > 0 && (
                        <div className="bg-white rounded-xl border border-brand-border/60 p-5">
                            <h3 className="text-sm font-bold text-brand-dark mb-1">
                                {isAdmin ? "Revenue (30 days)" : isClient ? "Spending (30 days)" : "Earnings (30 days)"}
                            </h3>
                            <p className="text-xs text-brand-muted mb-3">
                                {isAdmin
                                    ? fmtMoney(Number(o.period_revenue ?? 0))
                                    : isClient
                                        ? fmtMoney(Number(o.period_spent ?? 0))
                                        : fmtMoney(Number(o.period_earnings ?? 0))}{" "}
                                this period
                            </p>
                            <SparkChart
                                data={timeline}
                                color={isAdmin ? "#8b5cf6" : isClient ? "#f08a11" : "#22c55e"}
                            />
                            <div className="flex justify-between mt-1">
                                <span className="text-[9px] text-brand-muted/50">{timeline[0]?.bucket}</span>
                                <span className="text-[9px] text-brand-muted/50">{timeline[timeline.length - 1]?.bucket}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* right column: active contracts */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-brand-dark">
                            {isAdmin ? "Platform Contracts" : "Active Contracts"}
                        </h2>
                        <Link
                            href={isAdmin ? "/dashboard/admin/contracts" : "/dashboard/contracts"}
                            className="text-xs font-semibold text-brand-orange hover:underline"
                        >
                            View All →
                        </Link>
                    </div>

                    {loadingContracts && (
                        <div className="bg-white rounded-xl border border-brand-border/60 p-5">
                            <div className="text-center py-8">
                                <span className="text-3xl mb-2 block animate-pulse">⏳</span>
                                <p className="text-sm text-brand-muted">Loading contracts…</p>
                            </div>
                        </div>
                    )}

                    {!loadingContracts && contracts.length === 0 && (
                        <div className="bg-white rounded-xl border border-brand-border/60 p-5">
                            <div className="text-center py-8">
                                <span className="text-4xl mb-3 block">📄</span>
                                <p className="text-sm text-brand-muted">
                                    No active contracts yet.
                                    {isAdmin
                                        ? " No contracts on the platform yet."
                                        : isClient
                                            ? " Accept a proposal to create your first contract!"
                                            : " When a client accepts your proposal, a contract will appear here."}
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
                    )}

                    {!loadingContracts && contracts.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {contracts.map((ct) => (
                                <ContractCard key={ct.id} contract={ct} isClient={isClient ?? false} />
                            ))}
                        </div>
                    )}

                    {/* Contract & Invoice summary */}
                    {!loadingStats && stats && (
                        <div className="grid grid-cols-2 gap-4 mt-5">
                            <div className="bg-white rounded-xl border border-brand-border/60 p-5">
                                <h3 className="text-sm font-bold text-brand-dark mb-3">
                                    Contracts
                                </h3>
                                <ActivityRow icon="🟢" label="Active" value={c.active ?? 0} color="#22c55e" />
                                <ActivityRow icon="✅" label="Completed" value={c.completed ?? 0} color="#3b82f6" />
                                <ActivityRow icon="⏸️" label="Paused" value={c.paused ?? 0} color="#f59e0b" />
                                <ActivityRow icon="❌" label="Cancelled" value={c.cancelled ?? 0} color="#ef4444" />
                                <div className="mt-3 pt-2 border-t border-brand-border/30">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-brand-muted">Total value</span>
                                        <span className="text-sm font-bold text-brand-dark">{fmtMoney(c.total_value ?? 0)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-brand-border/60 p-5">
                                <h3 className="text-sm font-bold text-brand-dark mb-3">
                                    Invoices
                                </h3>
                                <ActivityRow icon="✅" label="Paid" value={inv.paid ?? 0} color="#22c55e" />
                                <ActivityRow icon="⏳" label="Pending" value={inv.pending ?? 0} color="#f59e0b" />
                                <ActivityRow icon="⚠️" label="Overdue" value={inv.overdue ?? 0} color="#ef4444" />
                                <div className="mt-3 pt-2 border-t border-brand-border/30">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-brand-muted">Paid amount</span>
                                        <span className="text-sm font-bold text-emerald-600">{fmtMoney(inv.paid_amount ?? 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
