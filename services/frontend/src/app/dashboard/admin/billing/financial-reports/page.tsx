"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Summary {
    total_payouts: string;
    total_revenue: string;
    net_profit: string;
    stripe_total: string;
    paypal_total: string;
    payout_fees: string;
    payout_count: number;
}

interface PayoutByMethod {
    period_label: string;
    method: string;
    count: number;
    total: string;
    fees: string;
}

interface RevenueOverTime {
    period_label: string;
    platform_revenue: string;
    client_fees: string;
}

interface ReportData {
    period: string;
    group: string;
    summary: Summary;
    payouts_by_method: PayoutByMethod[];
    revenue_over_time: RevenueOverTime[];
}

const PERIODS = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "Quarter" },
    { value: "year", label: "This Year" },
    { value: "all", label: "All Time" },
];

const GROUPS = [
    { value: "day", label: "Daily" },
    { value: "week", label: "Weekly" },
    { value: "month", label: "Monthly" },
];

export default function FinancialReportsPage() {
    const { token } = useAuth();
    const [data, setData] = useState<ReportData | null>(null);
    const [period, setPeriod] = useState("month");
    const [group, setGroup] = useState("day");
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(
                `${API}/admin/billing/financial-report?period=${period}&group=${group}`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            if (res.ok) {
                const json = await res.json();
                setData(json.data);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }, [token, period, group]);

    useEffect(() => {
        load();
    }, [load]);

    const fmt = (v: string | undefined) =>
        "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

    if (loading && !data) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-orange rounded-full animate-spin" />
            </div>
        );
    }

    const s = data?.summary;

    // Prepare chart data: merge payouts by method into periods
    const periodMap = new Map<string, { stripe: number; paypal: number }>();
    data?.payouts_by_method?.forEach((item) => {
        const existing = periodMap.get(item.period_label) || { stripe: 0, paypal: 0 };
        if (item.method === "paypal") existing.paypal = Number(item.total);
        else existing.stripe = Number(item.total);
        periodMap.set(item.period_label, existing);
    });
    const payoutChartData = Array.from(periodMap.entries()).map(([label, vals]) => ({
        label,
        ...vals,
    }));

    // Revenue chart data
    const revenueChartData = data?.revenue_over_time || [];
    const maxRevenue = Math.max(
        ...revenueChartData.map(
            (r) => Number(r.platform_revenue) + Number(r.client_fees),
        ),
        1,
    );

    // Payout chart max
    const maxPayout = Math.max(
        ...payoutChartData.map((p) => p.stripe + p.paypal),
        1,
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text">
                        📊 Financial Reports
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Payout transactions, revenue breakdown, and net profit
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {PERIODS.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${period === p.value
                                    ? "bg-brand-orange text-white border-brand-orange"
                                    : "border-gray-200 hover:bg-gray-50 text-gray-600"
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                    <div className="w-px bg-gray-200" />
                    {GROUPS.map((g) => (
                        <button
                            key={g.value}
                            onClick={() => setGroup(g.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${group === g.value
                                    ? "bg-gray-800 text-white border-gray-800"
                                    : "border-gray-200 hover:bg-gray-50 text-gray-600"
                                }`}
                        >
                            {g.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <SummaryCard
                    label="Total Revenue"
                    value={fmt(s?.total_revenue)}
                    icon="💰"
                    color="#22c55e"
                />
                <SummaryCard
                    label="Total Payouts"
                    value={fmt(s?.total_payouts)}
                    icon="💸"
                    color="#3b82f6"
                />
                <SummaryCard
                    label="Net Profit"
                    value={fmt(s?.net_profit)}
                    icon="📈"
                    color={Number(s?.net_profit || 0) >= 0 ? "#22c55e" : "#ef4444"}
                />
                <SummaryCard
                    label="Stripe Payouts"
                    value={fmt(s?.stripe_total)}
                    icon="🏦"
                    color="#7c3aed"
                />
                <SummaryCard
                    label="PayPal Payouts"
                    value={fmt(s?.paypal_total)}
                    icon="💸"
                    color="#2563eb"
                />
                <SummaryCard
                    label="Payout Fees"
                    value={fmt(s?.payout_fees)}
                    icon="🏷️"
                    color="#f59e0b"
                />
                <SummaryCard
                    label="Payout Count"
                    value={String(s?.payout_count ?? 0)}
                    icon="📊"
                    color="#6366f1"
                />
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Payouts by Method Chart */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-brand-text">
                            Payouts by Method
                        </h2>
                        <span className="text-xs text-gray-400">
                            Stripe vs PayPal
                        </span>
                    </div>
                    {payoutChartData.length === 0 ? (
                        <p className="text-center text-gray-400 py-12">
                            No payout data for this period.
                        </p>
                    ) : (
                        <div className="flex items-end gap-1 h-48 overflow-x-auto">
                            {payoutChartData.map((d) => {
                                const total = d.stripe + d.paypal;
                                const pct = (total / maxPayout) * 100;
                                const stripePct = total > 0 ? (d.stripe / total) * 100 : 50;
                                return (
                                    <div
                                        key={d.label}
                                        className="flex flex-col items-center flex-1 min-w-[28px] group relative"
                                    >
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                                            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                                                <div className="font-medium mb-1">{d.label}</div>
                                                <div>🏦 Stripe: {fmt(String(d.stripe))}</div>
                                                <div>💸 PayPal: {fmt(String(d.paypal))}</div>
                                            </div>
                                        </div>
                                        <div
                                            className="w-full rounded-t-md overflow-hidden"
                                            style={{ height: `${Math.max(pct, 3)}%` }}
                                        >
                                            <div
                                                className="w-full"
                                                style={{
                                                    height: `${stripePct}%`,
                                                    background: "#7c3aed",
                                                }}
                                            />
                                            <div
                                                className="w-full"
                                                style={{
                                                    height: `${100 - stripePct}%`,
                                                    background: "#3b82f6",
                                                }}
                                            />
                                        </div>
                                        <span className="text-[9px] text-gray-400 mt-1 truncate w-full text-center">
                                            {d.label.slice(-5)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="flex gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded bg-[#7c3aed] inline-block" /> Stripe
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded bg-[#3b82f6] inline-block" /> PayPal
                        </span>
                    </div>
                </div>

                {/* Revenue vs Payouts Chart */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-brand-text">
                            Revenue Over Time
                        </h2>
                        <span className="text-xs text-gray-400">
                            Commission + Fees
                        </span>
                    </div>
                    {revenueChartData.length === 0 ? (
                        <p className="text-center text-gray-400 py-12">
                            No revenue data for this period.
                        </p>
                    ) : (
                        <div className="flex items-end gap-1 h-48 overflow-x-auto">
                            {revenueChartData.map((r) => {
                                const commission = Number(r.platform_revenue);
                                const fee = Number(r.client_fees);
                                const total = commission + fee;
                                const pct = (total / maxRevenue) * 100;
                                return (
                                    <div
                                        key={r.period_label}
                                        className="flex flex-col items-center flex-1 min-w-[28px] group relative"
                                    >
                                        <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                                            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                                                <div className="font-medium mb-1">{r.period_label}</div>
                                                <div>Commission: {fmt(r.platform_revenue)}</div>
                                                <div>Client Fees: {fmt(r.client_fees)}</div>
                                            </div>
                                        </div>
                                        <div
                                            className="w-full rounded-t-md overflow-hidden"
                                            style={{ height: `${Math.max(pct, 3)}%` }}
                                        >
                                            <div
                                                className="w-full"
                                                style={{
                                                    height: `${commission > 0 ? (commission / total) * 100 : 50}%`,
                                                    background: "#22c55e",
                                                }}
                                            />
                                            <div
                                                className="w-full"
                                                style={{
                                                    height: `${fee > 0 ? (fee / total) * 100 : 50}%`,
                                                    background: "#8b5cf6",
                                                }}
                                            />
                                        </div>
                                        <span className="text-[9px] text-gray-400 mt-1 truncate w-full text-center">
                                            {r.period_label.slice(-5)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="flex gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded bg-[#22c55e] inline-block" /> Commission
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded bg-[#8b5cf6] inline-block" /> Client Fees
                        </span>
                    </div>
                </div>
            </div>

            {/* Method Comparison Panel */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-brand-text mb-4">
                    💳 Payout Method Comparison
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                    <MethodCard
                        icon="🏦"
                        name="Stripe Connect"
                        total={fmt(s?.stripe_total)}
                        fee="Free"
                        feeColor="#22c55e"
                        description="Direct bank transfers via Stripe. No additional fees."
                        barColor="#7c3aed"
                        percentage={
                            Number(s?.total_payouts || 0) > 0
                                ? (Number(s?.stripe_total || 0) / Number(s?.total_payouts || 1)) * 100
                                : 0
                        }
                    />
                    <MethodCard
                        icon="💸"
                        name="PayPal"
                        total={fmt(s?.paypal_total)}
                        fee="1%"
                        feeColor="#f59e0b"
                        description="PayPal Payouts API. 1% fee deducted from payout."
                        barColor="#3b82f6"
                        percentage={
                            Number(s?.total_payouts || 0) > 0
                                ? (Number(s?.paypal_total || 0) / Number(s?.total_payouts || 1)) * 100
                                : 0
                        }
                    />
                </div>
            </div>

            {/* Profit Analysis */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-sm p-6 text-white">
                <h2 className="text-lg font-semibold mb-4">📈 Profit Analysis</h2>
                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-400">{fmt(s?.total_revenue)}</p>
                        <p className="text-[11px] text-gray-500 mt-1">Commission + client fees</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Total Payouts</p>
                        <p className="text-2xl font-bold text-blue-400">{fmt(s?.total_payouts)}</p>
                        <p className="text-[11px] text-gray-500 mt-1">{s?.payout_count ?? 0} transactions</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Net Profit</p>
                        <p className={`text-2xl font-bold ${Number(s?.net_profit || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {fmt(s?.net_profit)}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">
                            Revenue − payout fees
                        </p>
                    </div>
                </div>
                {/* Profit bar */}
                <div className="mt-6">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Revenue vs Payouts</span>
                        <span>
                            {Number(s?.total_revenue || 0) > 0
                                ? ((Number(s?.net_profit || 0) / Number(s?.total_revenue || 1)) * 100).toFixed(1)
                                : "0.0"}
                            % margin
                        </span>
                    </div>
                    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden flex">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-l-full transition-all duration-500"
                            style={{
                                width: `${Number(s?.total_revenue || 0) > 0
                                        ? Math.min(
                                            (Number(s?.net_profit || 0) / Number(s?.total_revenue || 1)) * 100,
                                            100,
                                        )
                                        : 0
                                    }%`,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Sub-components ── */

function SummaryCard({
    label,
    value,
    icon,
    color,
}: {
    label: string;
    value: string;
    icon: string;
    color: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
                <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: color + "18" }}
                >
                    {icon}
                </span>
                <span className="text-[11px] text-gray-500 font-medium">{label}</span>
            </div>
            <p className="text-lg font-bold text-brand-text">{value}</p>
        </div>
    );
}

function MethodCard({
    icon,
    name,
    total,
    fee,
    feeColor,
    description,
    barColor,
    percentage,
}: {
    icon: string;
    name: string;
    total: string;
    fee: string;
    feeColor: string;
    description: string;
    barColor: string;
    percentage: number;
}) {
    return (
        <div className="border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-colors">
            <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{icon}</span>
                <div>
                    <h3 className="text-sm font-semibold text-brand-text">{name}</h3>
                    <p className="text-xs text-gray-400">{description}</p>
                </div>
            </div>
            <div className="flex items-baseline justify-between mb-3">
                <span className="text-xl font-bold text-brand-text">{total}</span>
                <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: feeColor + "18", color: feeColor }}
                >
                    {fee} fee
                </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(percentage, 1)}%`, background: barColor }}
                />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{percentage.toFixed(1)}% of total payouts</p>
        </div>
    );
}
