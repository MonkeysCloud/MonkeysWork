"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Overview {
    period: string;
    platform_revenue: string;
    client_fees: string;
    gross_volume: string;
    total_funded: string;
    total_released: string;
    total_refunded: string;
    escrow_balance: string;
    payouts_completed: string;
    payouts_pending: string;
    pending_payout_count: number;
    payout_by_method: Record<string, { count: number; total: string; fees: string }>;
    transaction_count: number;
    invoice_count: number;
    active_contracts: number;
    active_users: number;
    top_clients: { id: string; display_name: string; email: string; total_spent: string }[];
    top_freelancers: { id: string; display_name: string; email: string; total_earned: string }[];
}

interface RevenueItem {
    period_label: string;
    commission_revenue: string;
    client_fee_revenue: string;
    volume_funded: string;
    volume_released: string;
    tx_count: number;
}

const PERIODS = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "Quarter" },
    { value: "year", label: "This Year" },
    { value: "all", label: "All Time" },
];

export default function AdminBillingPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [ov, setOv] = useState<Overview | null>(null);
    const [revenue, setRevenue] = useState<RevenueItem[]>([]);
    const [period, setPeriod] = useState("month");
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [ovRes, revRes] = await Promise.all([
                fetch(`${API}/admin/billing/overview?period=${period}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API}/admin/billing/revenue-report?period=${period}&group=day`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);
            if (ovRes.ok) setOv((await ovRes.json()).data);
            if (revRes.ok) setRevenue((await revRes.json()).data.items);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }, [token, period]);

    useEffect(() => { load(); }, [load]);

    const fmt = (v: string | undefined) =>
        "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

    if (loading && !ov) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-orange rounded-full animate-spin" />
            </div>
        );
    }

    // Simple bar chart helper
    const maxRevenue = Math.max(
        ...revenue.map(
            (r) =>
                Number(r.commission_revenue) + Number(r.client_fee_revenue),
        ),
        1,
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text">
                        Billing & Revenue
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Platform-wide financial overview
                    </p>
                </div>
                <div className="flex gap-2">
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
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <KPICard
                    label="Platform Revenue"
                    value={fmt(ov?.platform_revenue)}
                    icon="💰"
                    color="#22c55e"
                    sub="Commissions earned"
                />
                <KPICard
                    label="Client Fees"
                    value={fmt(ov?.client_fees)}
                    icon="📋"
                    color="#8b5cf6"
                    sub="5% service fees"
                />
                <KPICard
                    label="Gross Volume"
                    value={fmt(ov?.gross_volume)}
                    icon="📊"
                    color="#3b82f6"
                    sub="Total charged"
                />
                <KPICard
                    label="Escrow Held"
                    value={fmt(ov?.escrow_balance)}
                    icon="🔒"
                    color="#f59e0b"
                    sub="Funds in escrow"
                />
                <KPICard
                    label="Payouts Pending"
                    value={fmt(ov?.payouts_pending)}
                    icon="⏳"
                    color="#ef4444"
                    sub={`${ov?.pending_payout_count ?? 0} requests`}
                />
                <KPICard
                    label="Payouts Completed"
                    value={fmt(ov?.payouts_completed)}
                    icon="✅"
                    color="#10b981"
                    sub={
                        ov?.payout_by_method
                            ? `🏦 ${ov.payout_by_method.stripe?.count ?? 0} Stripe · 💸 ${ov.payout_by_method.paypal?.count ?? 0} PayPal`
                            : "No payouts yet"
                    }
                />
            </div>

            {/* Second Row: Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard label="Total Funded" value={fmt(ov?.total_funded)} />
                <StatCard
                    label="Total Released"
                    value={fmt(ov?.total_released)}
                />
                <StatCard
                    label="Refunded"
                    value={fmt(ov?.total_refunded)}
                />
                <StatCard
                    label="Transactions"
                    value={String(ov?.transaction_count ?? 0)}
                />
                <StatCard
                    label="Invoices"
                    value={String(ov?.invoice_count ?? 0)}
                />
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-brand-text">
                        Revenue Over Time
                    </h2>
                    <span className="text-xs text-gray-400">
                        Daily breakdown
                    </span>
                </div>
                {revenue.length === 0 ? (
                    <p className="text-center text-gray-400 py-12">
                        No revenue data for this period.
                    </p>
                ) : (
                    <div className="flex items-end gap-1 h-48 overflow-x-auto">
                        {revenue.map((r) => {
                            const commission = Number(r.commission_revenue);
                            const fee = Number(r.client_fee_revenue);
                            const total = commission + fee;
                            const pct = (total / maxRevenue) * 100;
                            return (
                                <div
                                    key={r.period_label}
                                    className="flex flex-col items-center flex-1 min-w-[28px] group relative"
                                >
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                                        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                                            <div className="font-medium mb-1">
                                                {r.period_label}
                                            </div>
                                            <div>
                                                Commission:{" "}
                                                {fmt(r.commission_revenue)}
                                            </div>
                                            <div>
                                                Fees:{" "}
                                                {fmt(r.client_fee_revenue)}
                                            </div>
                                            <div>
                                                Volume:{" "}
                                                {fmt(r.volume_funded)}
                                            </div>
                                            <div>{r.tx_count} tx</div>
                                        </div>
                                    </div>
                                    {/* Bar */}
                                    <div
                                        className="w-full rounded-t-md overflow-hidden"
                                        style={{
                                            height: `${Math.max(pct, 2)}%`,
                                        }}
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
                        <span className="w-3 h-3 rounded bg-[#22c55e] inline-block" />{" "}
                        Commission
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-[#8b5cf6] inline-block" />{" "}
                        Client Fees
                    </span>
                </div>
            </div>

            {/* Top Clients & Freelancers */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-brand-text mb-4">
                        🏆 Top Clients
                    </h2>
                    {ov?.top_clients && ov.top_clients.length > 0 ? (
                        <div className="space-y-3">
                            {ov.top_clients.map((c, i) => (
                                <div
                                    key={c.id}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-orange-100 text-brand-orange flex items-center justify-center text-xs font-bold">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {c.display_name}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {c.email}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700">
                                        {fmt(c.total_spent)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">
                            No client data yet.
                        </p>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-brand-text mb-4">
                        ⭐ Top Freelancers
                    </h2>
                    {ov?.top_freelancers && ov.top_freelancers.length > 0 ? (
                        <div className="space-y-3">
                            {ov.top_freelancers.map((f, i) => (
                                <div
                                    key={f.id}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {f.display_name}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {f.email}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700">
                                        {fmt(f.total_earned)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">
                            No freelancer data yet.
                        </p>
                    )}
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickLink
                    label="All Transactions"
                    icon="📊"
                    count={ov?.transaction_count}
                    onClick={() =>
                        router.push("/dashboard/admin/billing/transactions")
                    }
                />
                <QuickLink
                    label="All Invoices"
                    icon="📄"
                    count={ov?.invoice_count}
                    onClick={() =>
                        router.push("/dashboard/admin/billing/invoices")
                    }
                />
                <QuickLink
                    label="Manage Payouts"
                    icon="💸"
                    count={ov?.pending_payout_count}
                    badge="pending"
                    onClick={() =>
                        router.push("/dashboard/admin/billing/payouts")
                    }
                />
                <QuickLink
                    label="Active Contracts"
                    icon="📄"
                    count={ov?.active_contracts}
                    onClick={() => router.push("/dashboard/admin/billing")}
                />
                <QuickLink
                    label="Financial Reports"
                    icon="📈"
                    onClick={() =>
                        router.push("/dashboard/admin/billing/financial-reports")
                    }
                />
            </div>
        </div>
    );
}

/* ── Sub-components ── */

function KPICard({
    label,
    value,
    icon,
    color,
    sub,
}: {
    label: string;
    value: string;
    icon: string;
    color: string;
    sub: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
                <span
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ background: color + "18" }}
                >
                    {icon}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                    {label}
                </span>
            </div>
            <p className="text-xl font-bold text-brand-text">{value}</p>
            <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">{label}</span>
            <span className="text-sm font-bold text-brand-text">{value}</span>
        </div>
    );
}

function QuickLink({
    label,
    icon,
    count,
    badge,
    onClick,
}: {
    label: string;
    icon: string;
    count?: number;
    badge?: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-brand-orange/40 transition-colors text-left"
        >
            <span className="text-2xl">{icon}</span>
            <div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-400">
                    {count ?? 0} {badge || "total"}
                </p>
            </div>
        </button>
    );
}
