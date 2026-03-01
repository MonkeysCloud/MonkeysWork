"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Period options ────────────────────────────── */
const PERIODS = [
    { key: "7d", label: "7 Days" },
    { key: "30d", label: "30 Days" },
    { key: "90d", label: "90 Days" },
    { key: "6m", label: "6 Months" },
    { key: "1y", label: "1 Year" },
    { key: "all", label: "All Time" },
] as const;

type PeriodKey = (typeof PERIODS)[number]["key"];

/* ── Helpers ──────────────────────────────────── */
const fmt = (n: number, dec = 2) =>
    n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });

const fmtCurrency = (n: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

const pct = (part: number, total: number) =>
    total > 0 ? Math.round((part / total) * 100) : 0;

const bucketLabel = (b: string) => {
    // "2026-02-17" → "Feb 17"
    if (/^\d{4}-\d{2}-\d{2}$/.test(b)) {
        const d = new Date(b + "T00:00:00");
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    // "2026-W07" → "W07"
    if (/W\d{2}$/.test(b)) return b.split("-").pop() || b;
    // "2026-02" → "Feb '26"
    if (/^\d{4}-\d{2}$/.test(b)) {
        const [y, m] = b.split("-");
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[parseInt(m, 10) - 1]} '${y.slice(2)}`;
    }
    return b;
};

/* ── Types ──────────────────────────────────── */
interface TimelineEntry { bucket: string; amount: number }

interface FreelancerStats {
    role: "freelancer";
    period: string;
    overview: {
        total_earnings: number; period_earnings: number; active_contracts: number; jobs_completed: number;
        avg_rating: number; total_reviews: number; success_rate: number;
        profile_completeness: number; response_rate: number;
        hourly_rate: number; currency: string; availability: string;
    };
    proposals: {
        total: number; pending: number; accepted: number; rejected: number;
        withdrawn: number; shortlisted: number; viewed: number; acceptance_rate: number;
    };
    contracts: {
        total: number; active: number; completed: number; cancelled: number;
        paused: number; total_value: number; completed_value: number;
    };
    earnings_timeline: TimelineEntry[];
    invoices: {
        total: number; paid: number; pending: number; overdue: number;
        total_amount: number; paid_amount: number;
    };
    time_tracking: {
        total_hours: number; hours_this_week: number; profile_hours: number;
    };
}

interface ClientStats {
    role: "client";
    period: string;
    overview: {
        total_spent: number; period_spent: number; active_contracts: number; jobs_posted: number;
        total_hires: number; avg_rating_given: number; payment_verified: boolean;
        verification_level: string;
    };
    jobs: {
        total: number; draft: number; open: number; in_progress: number;
        completed: number; closed: number; cancelled: number;
        total_proposals: number; total_views: number; avg_proposals_per_job: number;
    };
    contracts: {
        total: number; active: number; completed: number; cancelled: number;
        paused: number; total_value: number; completed_value: number;
    };
    spending_timeline: TimelineEntry[];
    proposals_received: {
        total: number; pending: number; accepted: number; rejected: number;
        shortlisted: number; avg_bid: number;
    };
    invoices: {
        total: number; paid: number; pending: number; overdue: number;
        total_amount: number; paid_amount: number;
    };
}

type Stats = FreelancerStats | ClientStats;

/* ── Period Selector ─────────────────────────── */
function PeriodSelector({ value, onChange }: { value: PeriodKey; onChange: (p: PeriodKey) => void }) {
    return (
        <div className="stats-period" style={{
            display: "inline-flex", gap: 4, padding: 4, borderRadius: 12,
            background: "var(--bg-secondary)", border: "1px solid var(--border)",
            overflowX: "auto", maxWidth: "100%",
        }}>
            {PERIODS.map(p => (
                <button
                    key={p.key}
                    onClick={() => onChange(p.key)}
                    style={{
                        padding: "6px 14px", borderRadius: 8, border: "none",
                        fontSize: 13, fontWeight: 500, cursor: "pointer",
                        transition: "all 0.2s", whiteSpace: "nowrap",
                        background: value === p.key ? "var(--accent)" : "transparent",
                        color: value === p.key ? "#fff" : "var(--text-secondary)",
                    }}
                    onMouseEnter={e => { if (value !== p.key) e.currentTarget.style.background = "var(--border)"; }}
                    onMouseLeave={e => { if (value !== p.key) e.currentTarget.style.background = "transparent"; }}
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
}

/* ── Stat Card Component ─────────────────────── */
function StatCard({ icon, label, value, sub, color = "var(--accent)" }: {
    icon: string; label: string; value: string | number; sub?: string; color?: string;
}) {
    return (
        <div style={{
            background: "var(--card-bg)", borderRadius: 16, padding: "24px 20px",
            border: "1px solid var(--border)", position: "relative", overflow: "hidden",
            transition: "transform 0.2s, box-shadow 0.2s",
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
        >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color }} />
            <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)" }}>{value}</div>
            {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
        </div>
    );
}

/* ── Progress Bar Component ──────────────────── */
function ProgressBar({ label, value, total, color }: {
    label: string; value: number; total: number; color: string;
}) {
    const p = pct(value, total);
    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                <span style={{ color: "var(--text-muted)" }}>{value} ({p}%)</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "var(--bg-secondary)", overflow: "hidden" }}>
                <div style={{
                    height: "100%", borderRadius: 4, width: `${p}%`,
                    background: color, transition: "width 0.8s ease",
                }} />
            </div>
        </div>
    );
}

/* ── Bar Chart Component ─────────────────────── */
function BarChart({ data, color, currencyCode = "USD" }: {
    data: TimelineEntry[]; color: string; currencyCode?: string;
}) {
    const max = Math.max(...data.map(d => d.amount), 1);
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 180, padding: "0 4px" }}>
            {data.map((d, i) => {
                const h = Math.max((d.amount / max) * 160, 2);
                return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div
                            title={`${bucketLabel(d.bucket)}: ${fmtCurrency(d.amount, currencyCode)}`}
                            style={{
                                width: "100%", maxWidth: 40, height: h, borderRadius: "6px 6px 2px 2px",
                                background: d.amount > 0 ? color : "var(--bg-secondary)",
                                transition: "height 0.6s ease", cursor: "pointer",
                                opacity: d.amount > 0 ? 1 : 0.3,
                            }}
                            onMouseEnter={e => { if (d.amount > 0) e.currentTarget.style.opacity = "0.8"; }}
                            onMouseLeave={e => { if (d.amount > 0) e.currentTarget.style.opacity = "1"; }}
                        />
                        <span style={{
                            fontSize: data.length > 15 ? 7 : 9,
                            color: "var(--text-muted)", whiteSpace: "nowrap",
                        }}>
                            {bucketLabel(d.bucket)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/* ── Section Card ────────────────────────────── */
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
        <div style={{
            background: "var(--card-bg)", borderRadius: 16, padding: 24,
            border: "1px solid var(--border)",
        }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
                <span>{icon}</span> {title}
            </h3>
            {children}
        </div>
    );
}

/* ── Donut Ring ───────────────────────────────── */
function DonutStat({ segments, size = 120, label }: {
    segments: { value: number; color: string; label: string }[];
    size?: number; label: string;
}) {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    const r = (size - 12) / 2;
    const c = 2 * Math.PI * r;
    let offset = 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-secondary)" strokeWidth={10} />
                {total > 0 && segments.filter(s => s.value > 0).map((seg, i) => {
                    const len = (seg.value / total) * c;
                    const el = (
                        <circle
                            key={i} cx={size / 2} cy={size / 2} r={r}
                            fill="none" stroke={seg.color} strokeWidth={10}
                            strokeDasharray={`${len} ${c - len}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                            style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dasharray 0.8s ease" }}
                        />
                    );
                    offset += len;
                    return el;
                })}
                <text x={size / 2} y={size / 2 - 6} textAnchor="middle" fill="var(--text-primary)" fontSize={20} fontWeight={700}>{total}</text>
                <text x={size / 2} y={size / 2 + 12} textAnchor="middle" fill="var(--text-muted)" fontSize={10}>{label}</text>
            </svg>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", justifyContent: "center" }}>
                {segments.map((seg, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-secondary)" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: seg.color }} />
                        {seg.label}: {seg.value}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Mini Stat Row ───────────────────────────── */
function MiniStat({ icon, label, value }: { icon: string; label: string; value: string | number }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                <span>{icon}</span>{label}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{value}</span>
        </div>
    );
}

/* ══════════════════════════════════════════════
 *  Freelancer Dashboard View
 * ══════════════════════════════════════════════ */
function FreelancerDashboard({ data }: { data: FreelancerStats }) {
    const o = data.overview;
    const currency = o.currency || "USD";
    const periodLabel = PERIODS.find(p => p.key === data.period)?.label || data.period;

    return (
        <>
            {/* ── Overview Cards ── */}
            <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 16, marginBottom: 24,
            }}>
                <StatCard icon="💰" label={`Earnings (${periodLabel})`} value={fmtCurrency(o.period_earnings, currency)} sub={`Lifetime: ${fmtCurrency(o.total_earnings, currency)}`} color="#10b981" />
                <StatCard icon="📄" label="Active Contracts" value={o.active_contracts} color="#6366f1" />
                <StatCard icon="✅" label="Jobs Completed" value={o.jobs_completed} color="#3b82f6" />
                <StatCard icon="⭐" label="Avg Rating" value={fmt(o.avg_rating, 1)} sub={`${o.total_reviews} reviews`} color="#f59e0b" />
                <StatCard icon="📈" label="Success Rate" value={`${fmt(o.success_rate, 0)}%`} color="#8b5cf6" />
                <StatCard icon="🎯" label="Profile Score" value={`${o.profile_completeness}%`} color="#ec4899" />
            </div>

            {/* ── Main Grid ── */}
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

                {/* Earnings Chart */}
                <Section title={`Earnings (${periodLabel})`} icon="📊">
                    <BarChart data={data.earnings_timeline} color="#10b981" currencyCode={currency} />
                    <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)" }}>
                        <span>Period Total: {fmtCurrency(o.period_earnings, currency)}</span>
                        <span>Completed: {fmtCurrency(data.contracts.completed_value, currency)}</span>
                    </div>
                </Section>

                {/* Proposals Breakdown */}
                <Section title={`Proposals (${periodLabel})`} icon="📝">
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                        <DonutStat
                            label="total"
                            segments={[
                                { value: data.proposals.pending, color: "#f59e0b", label: "Pending" },
                                { value: data.proposals.accepted, color: "#10b981", label: "Accepted" },
                                { value: data.proposals.rejected, color: "#ef4444", label: "Rejected" },
                                { value: data.proposals.shortlisted, color: "#6366f1", label: "Shortlisted" },
                                { value: data.proposals.withdrawn, color: "#6b7280", label: "Withdrawn" },
                            ]}
                        />
                    </div>
                    <MiniStat icon="🎯" label="Acceptance Rate" value={`${data.proposals.acceptance_rate}%`} />
                    <MiniStat icon="👁️" label="Viewed" value={data.proposals.viewed} />
                </Section>

                {/* Contracts Breakdown */}
                <Section title={`Contracts (${periodLabel})`} icon="📋">
                    <ProgressBar label="Active" value={data.contracts.active} total={data.contracts.total} color="#6366f1" />
                    <ProgressBar label="Completed" value={data.contracts.completed} total={data.contracts.total} color="#10b981" />
                    <ProgressBar label="Cancelled" value={data.contracts.cancelled} total={data.contracts.total} color="#ef4444" />
                    <ProgressBar label="Paused" value={data.contracts.paused} total={data.contracts.total} color="#f59e0b" />
                    <div style={{ marginTop: 12, padding: "12px", borderRadius: 8, background: "var(--bg-secondary)", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Total Contract Value</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{fmtCurrency(data.contracts.total_value, currency)}</div>
                    </div>
                </Section>

                {/* Time & Invoices */}
                <Section title={`Time & Invoices (${periodLabel})`} icon="⏱️">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                        <div style={{ padding: 12, borderRadius: 8, background: "var(--bg-secondary)", textAlign: "center" }}>
                            <div style={{ fontSize: 22, fontWeight: 700, color: "#3b82f6" }}>{fmt(data.time_tracking.total_hours, 0)}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Hours ({periodLabel})</div>
                        </div>
                        <div style={{ padding: 12, borderRadius: 8, background: "var(--bg-secondary)", textAlign: "center" }}>
                            <div style={{ fontSize: 22, fontWeight: 700, color: "#8b5cf6" }}>{fmt(data.time_tracking.hours_this_week, 1)}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>This Week</div>
                        </div>
                    </div>
                    <MiniStat icon="📄" label="Invoices" value={data.invoices.total} />
                    <MiniStat icon="✅" label="Paid" value={fmtCurrency(data.invoices.paid_amount, currency)} />
                    <MiniStat icon="⏳" label="Pending" value={data.invoices.pending} />
                    {data.invoices.overdue > 0 && (
                        <MiniStat icon="⚠️" label="Overdue" value={data.invoices.overdue} />
                    )}
                </Section>
            </div>

            {/* ── Extra Info Row ── */}
            <div className="stats-grid-3" style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16,
            }}>
                <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: 16, border: "1px solid var(--border)", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Hourly Rate</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#10b981" }}>{fmtCurrency(o.hourly_rate, currency)}</div>
                </div>
                <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: 16, border: "1px solid var(--border)", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Response Rate</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#3b82f6" }}>{fmt(o.response_rate, 0)}%</div>
                </div>
                <div style={{ background: "var(--card-bg)", borderRadius: 12, padding: 16, border: "1px solid var(--border)", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Availability</div>
                    <div style={{
                        fontSize: 14, fontWeight: 600,
                        color: o.availability === "available" ? "#10b981" : o.availability === "busy" ? "#f59e0b" : "#6b7280",
                    }}>
                        {o.availability === "available" ? "🟢 Available" : o.availability === "busy" ? "🟡 Busy" : "🔴 Unavailable"}
                    </div>
                </div>
            </div>
        </>
    );
}

/* ══════════════════════════════════════════════
 *  Client Dashboard View
 * ══════════════════════════════════════════════ */
function ClientDashboard({ data }: { data: ClientStats }) {
    const o = data.overview;
    const periodLabel = PERIODS.find(p => p.key === data.period)?.label || data.period;

    return (
        <>
            {/* ── Overview Cards ── */}
            <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 16, marginBottom: 24,
            }}>
                <StatCard icon="💸" label={`Spent (${periodLabel})`} value={fmtCurrency(o.period_spent)} sub={`Lifetime: ${fmtCurrency(o.total_spent)}`} color="#ef4444" />
                <StatCard icon="📄" label="Active Contracts" value={o.active_contracts} color="#6366f1" />
                <StatCard icon="📌" label="Jobs Posted" value={o.jobs_posted} color="#3b82f6" />
                <StatCard icon="👥" label="Total Hires" value={o.total_hires} color="#10b981" />
                <StatCard icon="⭐" label="Avg Rating Given" value={fmt(o.avg_rating_given, 1)} color="#f59e0b" />
            </div>

            {/* ── Main Grid ── */}
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

                {/* Spending Chart */}
                <Section title={`Spending (${periodLabel})`} icon="📊">
                    <BarChart data={data.spending_timeline} color="#6366f1" />
                    <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)" }}>
                        <span>Period Total: {fmtCurrency(o.period_spent)}</span>
                        <span>Completed: {fmtCurrency(data.contracts.completed_value)}</span>
                    </div>
                </Section>

                {/* Jobs Breakdown */}
                <Section title={`Jobs (${periodLabel})`} icon="📌">
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                        <DonutStat
                            label="total"
                            segments={[
                                { value: data.jobs.open, color: "#3b82f6", label: "Open" },
                                { value: data.jobs.in_progress, color: "#6366f1", label: "In Progress" },
                                { value: data.jobs.completed, color: "#10b981", label: "Completed" },
                                { value: data.jobs.draft, color: "#9ca3af", label: "Draft" },
                                { value: data.jobs.closed, color: "#f59e0b", label: "Closed" },
                                { value: data.jobs.cancelled, color: "#ef4444", label: "Cancelled" },
                            ]}
                        />
                    </div>
                    <MiniStat icon="📬" label="Total Proposals" value={data.jobs.total_proposals} />
                    <MiniStat icon="👁️" label="Total Views" value={data.jobs.total_views} />
                    <MiniStat icon="📊" label="Avg Proposals/Job" value={data.jobs.avg_proposals_per_job} />
                </Section>

                {/* Contracts Breakdown */}
                <Section title={`Contracts (${periodLabel})`} icon="📋">
                    <ProgressBar label="Active" value={data.contracts.active} total={data.contracts.total} color="#6366f1" />
                    <ProgressBar label="Completed" value={data.contracts.completed} total={data.contracts.total} color="#10b981" />
                    <ProgressBar label="Cancelled" value={data.contracts.cancelled} total={data.contracts.total} color="#ef4444" />
                    <ProgressBar label="Paused" value={data.contracts.paused} total={data.contracts.total} color="#f59e0b" />
                    <div style={{ marginTop: 12, padding: "12px", borderRadius: 8, background: "var(--bg-secondary)", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Total Contract Value</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{fmtCurrency(data.contracts.total_value)}</div>
                    </div>
                </Section>

                {/* Proposals & Invoices */}
                <Section title={`Proposals & Invoices (${periodLabel})`} icon="📝">
                    <div style={{ marginBottom: 16 }}>
                        <h4 style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Proposals Received</h4>
                        <ProgressBar label="Accepted" value={data.proposals_received.accepted} total={data.proposals_received.total} color="#10b981" />
                        <ProgressBar label="Shortlisted" value={data.proposals_received.shortlisted} total={data.proposals_received.total} color="#6366f1" />
                        <ProgressBar label="Pending" value={data.proposals_received.pending} total={data.proposals_received.total} color="#f59e0b" />
                        <ProgressBar label="Rejected" value={data.proposals_received.rejected} total={data.proposals_received.total} color="#ef4444" />
                        <MiniStat icon="💲" label="Avg Bid Amount" value={fmtCurrency(data.proposals_received.avg_bid)} />
                    </div>
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                        <h4 style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Invoices</h4>
                        <MiniStat icon="📄" label="Total" value={data.invoices.total} />
                        <MiniStat icon="✅" label="Paid" value={fmtCurrency(data.invoices.paid_amount)} />
                        <MiniStat icon="⏳" label="Pending" value={data.invoices.pending} />
                        {data.invoices.overdue > 0 && (
                            <MiniStat icon="⚠️" label="Overdue" value={data.invoices.overdue} />
                        )}
                    </div>
                </Section>
            </div>
        </>
    );
}

/* ══════════════════════════════════════════════
 *  Main Page
 * ══════════════════════════════════════════════ */
export default function StatsPage() {
    const { user, token } = useAuth();
    const [data, setData] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [period, setPeriod] = useState<PeriodKey>("1y");

    const fetchStats = useCallback((p: PeriodKey) => {
        if (!token) return;
        setLoading(true);
        setError("");
        fetch(`${API}/stats?period=${p}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async r => {
                if (!r.ok) throw new Error(`API returned ${r.status}`);
                const json = await r.json();
                setData(json.data);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [token]);

    useEffect(() => {
        fetchStats(period);
    }, [period, fetchStats]);

    const handlePeriodChange = (p: PeriodKey) => {
        setPeriod(p);
    };

    /* ── CSS variables ── */
    const cssVars: Record<string, string> = {
        "--card-bg": "#ffffff",
        "--bg-secondary": "#f8fafc",
        "--border": "#e2e8f0",
        "--text-primary": "#0f172a",
        "--text-secondary": "#475569",
        "--text-muted": "#94a3b8",
        "--accent": "#6366f1",
    };

    return (
        <div style={{ ...cssVars as any, maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
            {/* Mobile responsive styles */}
            <style>{`
                @media (max-width: 639px) {
                    .stats-period {
                        max-width: calc(100vw - 48px) !important;
                        -webkit-overflow-scrolling: touch;
                    }
                    .stats-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .stats-grid-3 {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                        📈 Dashboard Stats
                    </h1>
                    <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                        {user?.role === "freelancer"
                            ? "Your performance metrics, earnings, and proposal analytics"
                            : "Your hiring activity, spending, and project overview"}
                    </p>
                </div>
                <PeriodSelector value={period} onChange={handlePeriodChange} />
            </div>

            {/* Loading */}
            {loading && (
                <div style={{
                    display: "flex", justifyContent: "center", alignItems: "center",
                    padding: 80, color: "var(--text-muted)", fontSize: 16,
                }}>
                    <div style={{
                        width: 36, height: 36, border: "3px solid var(--border)",
                        borderTopColor: "var(--accent)", borderRadius: "50%",
                        animation: "spin 1s linear infinite", marginRight: 12,
                    }} />
                    Loading stats...
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{
                    padding: "16px 20px", borderRadius: 12,
                    background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626",
                    fontSize: 14, marginBottom: 24,
                }}>
                    ⚠️ Failed to load stats: {error}
                </div>
            )}

            {/* Render based on role */}
            {!loading && data && data.role === "freelancer" && <FreelancerDashboard data={data} />}
            {!loading && data && data.role === "client" && <ClientDashboard data={data} />}

            {/* Empty state fallback */}
            {!loading && !error && !data && (
                <div style={{
                    padding: 60, textAlign: "center", color: "var(--text-muted)",
                    background: "var(--card-bg)", borderRadius: 16, border: "1px solid var(--border)",
                }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
                    <div style={{ fontSize: 16 }}>No stats available yet</div>
                    <div style={{ fontSize: 13, marginTop: 8 }}>Start using the platform to see your analytics here</div>
                </div>
            )}
        </div>
    );
}
