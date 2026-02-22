"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import KpiCard from "@/components/admin/KpiCard";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

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

interface RevenueItem {
    period_label: string;
    commission_revenue: string;
    client_fee_revenue: string;
    volume_funded: string;
    volume_released: string;
    tx_count: number;
}

interface ContractReportItem {
    period_label: string;
    total_created: number;
    active: number;
    completed: number;
    cancelled: number;
    fixed_type: number;
    hourly_type: number;
    total_value: string;
}

interface DisputeReportItem {
    period_label: string;
    total_opened: number;
    total_resolved: number;
    still_open: number;
    escalated: number;
    total_disputed_amount: string;
    total_resolved_amount: string;
}

const fmt = (v: string | number | undefined) =>
    `$${Number(v ?? 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export default function ReportsDashboardPage() {
    const { token } = useAuth();

    const [period, setPeriod] = useState("month");
    const [group, setGroup] = useState("day");
    const [loading, setLoading] = useState(true);

    // Revenue
    const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([]);
    // Contracts
    const [contractItems, setContractItems] = useState<ContractReportItem[]>([]);
    const [contractSummary, setContractSummary] = useState<Record<string, string>>({});
    // Disputes
    const [disputeItems, setDisputeItems] = useState<DisputeReportItem[]>([]);
    const [disputeSummary, setDisputeSummary] = useState<Record<string, string>>({});

    const fetchReports = useCallback(async () => {
        setLoading(true);
        const params = `period=${period}&group=${group}`;
        const headers = { Authorization: `Bearer ${token}` };

        try {
            const [revRes, conRes, disRes] = await Promise.all([
                fetch(`${API}/admin/billing/revenue-report?${params}`, { headers }),
                fetch(`${API}/admin/contracts/report?${params}`, { headers }),
                fetch(`${API}/admin/disputes/report?${params}`, { headers }),
            ]);

            const [revJson, conJson, disJson] = await Promise.all([
                revRes.json(),
                conRes.json(),
                disRes.json(),
            ]);

            setRevenueItems(revJson.data?.items ?? []);
            setContractItems(conJson.data?.items ?? []);
            setContractSummary(conJson.data?.summary ?? {});
            setDisputeItems(disJson.data?.items ?? []);
            setDisputeSummary(disJson.data?.summary ?? {});
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token, period, group]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    // Totals from revenue
    const totalRevenue = revenueItems.reduce(
        (s, i) => s + Number(i.commission_revenue) + Number(i.client_fee_revenue),
        0,
    );
    const totalVolume = revenueItems.reduce(
        (s, i) => s + Number(i.volume_funded),
        0,
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text">
                        📊 Reports Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Revenue, contracts, and disputes analytics
                    </p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                    >
                        {PERIODS.map((p) => (
                            <option key={p.value} value={p.value}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={group}
                        onChange={(e) => setGroup(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                    >
                        {GROUPS.map((g) => (
                            <option key={g.value} value={g.value}>
                                {g.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-xl border border-gray-100 p-5 h-28 animate-pulse"
                        >
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
                            <div className="h-7 bg-gray-200 rounded w-1/3" />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* ── Summary KPI Cards ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            icon="💰"
                            label="Total Revenue"
                            value={fmt(totalRevenue)}
                            sub="Platform + client fees"
                        />
                        <KpiCard
                            icon="📊"
                            label="Transaction Volume"
                            value={fmt(totalVolume)}
                            sub="Total funded"
                        />
                        <KpiCard
                            icon="📄"
                            label="Contracts"
                            value={Number(contractSummary.total_contracts ?? 0)}
                            sub={`${contractSummary.active_contracts ?? 0} active · ${contractSummary.completed_contracts ?? 0} completed`}
                        />
                        <KpiCard
                            icon="⚠️"
                            label="Disputes"
                            value={Number(disputeSummary.total_disputes ?? 0)}
                            sub={`${disputeSummary.open ?? 0} open · ${Number(disputeSummary.avg_resolution_days ?? 0).toFixed(1)}d avg resolution`}
                        />
                    </div>

                    {/* ── Revenue Over Time ── */}
                    <ReportSection title="💰 Revenue" subtitle="Platform fees and client fees over time">
                        <ReportTable
                            headers={[
                                "Period",
                                "Commission",
                                "Client Fees",
                                "Volume Funded",
                                "Volume Released",
                                "Transactions",
                            ]}
                            rows={revenueItems.map((i) => [
                                i.period_label,
                                fmt(i.commission_revenue),
                                fmt(i.client_fee_revenue),
                                fmt(i.volume_funded),
                                fmt(i.volume_released),
                                String(i.tx_count),
                            ])}
                            emptyMessage="No revenue data for this period."
                        />
                        {revenueItems.length > 0 && (
                            <div className="mt-4 flex gap-4 text-sm">
                                <span className="font-semibold text-green-600">
                                    Total Commission: {fmt(revenueItems.reduce((s, i) => s + Number(i.commission_revenue), 0))}
                                </span>
                                <span className="font-semibold text-blue-600">
                                    Total Client Fees: {fmt(revenueItems.reduce((s, i) => s + Number(i.client_fee_revenue), 0))}
                                </span>
                            </div>
                        )}
                    </ReportSection>

                    {/* ── Contracts Over Time ── */}
                    <ReportSection title="📄 Contracts" subtitle="Contract creation and status breakdown">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                            {[
                                { label: "Total", v: contractSummary.total_contracts, color: "bg-gray-50 text-gray-700" },
                                { label: "Active", v: contractSummary.active_contracts, color: "bg-green-50 text-green-700" },
                                { label: "Completed", v: contractSummary.completed_contracts, color: "bg-blue-50 text-blue-700" },
                                { label: "Cancelled", v: contractSummary.cancelled_contracts, color: "bg-red-50 text-red-700" },
                                { label: "Total Value", v: fmt(contractSummary.total_value), color: "bg-purple-50 text-purple-700" },
                            ].map(({ label, v, color }) => (
                                <div key={label} className={`rounded-lg px-4 py-3 ${color}`}>
                                    <p className="text-xs font-medium opacity-70">{label}</p>
                                    <p className="text-lg font-bold">{v ?? 0}</p>
                                </div>
                            ))}
                        </div>
                        <ReportTable
                            headers={["Period", "Created", "Active", "Completed", "Cancelled", "Fixed", "Hourly", "Value"]}
                            rows={contractItems.map((i) => [
                                i.period_label,
                                String(i.total_created),
                                String(i.active),
                                String(i.completed),
                                String(i.cancelled),
                                String(i.fixed_type),
                                String(i.hourly_type),
                                fmt(i.total_value),
                            ])}
                            emptyMessage="No contract data for this period."
                        />
                    </ReportSection>

                    {/* ── Disputes Over Time ── */}
                    <ReportSection title="⚠️ Disputes" subtitle="Dispute activity and resolution metrics">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                            {[
                                { label: "Total", v: disputeSummary.total_disputes, color: "bg-gray-50 text-gray-700" },
                                { label: "Open", v: disputeSummary.open, color: "bg-yellow-50 text-yellow-700" },
                                { label: "Escalated", v: disputeSummary.escalated, color: "bg-red-50 text-red-700" },
                                { label: "Resolved", v: disputeSummary.resolved, color: "bg-green-50 text-green-700" },
                                { label: "Avg Resolution", v: `${Number(disputeSummary.avg_resolution_days ?? 0).toFixed(1)}d`, color: "bg-blue-50 text-blue-700" },
                            ].map(({ label, v, color }) => (
                                <div key={label} className={`rounded-lg px-4 py-3 ${color}`}>
                                    <p className="text-xs font-medium opacity-70">{label}</p>
                                    <p className="text-lg font-bold">{v ?? 0}</p>
                                </div>
                            ))}
                        </div>
                        <ReportTable
                            headers={[
                                "Period",
                                "Opened",
                                "Resolved",
                                "Still Open",
                                "Escalated",
                                "$ Disputed",
                                "$ Resolved",
                            ]}
                            rows={disputeItems.map((i) => [
                                i.period_label,
                                String(i.total_opened),
                                String(i.total_resolved),
                                String(i.still_open),
                                String(i.escalated),
                                fmt(i.total_disputed_amount),
                                fmt(i.total_resolved_amount),
                            ])}
                            emptyMessage="No dispute data for this period."
                        />
                    </ReportSection>
                </>
            )}
        </div>
    );
}

/* ── Sub-components ── */

function ReportSection({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="mb-4">
                <h2 className="text-lg font-bold text-brand-text">{title}</h2>
                <p className="text-xs text-gray-400">{subtitle}</p>
            </div>
            {children}
        </div>
    );
}

function ReportTable({
    headers,
    rows,
    emptyMessage,
}: {
    headers: string[];
    rows: string[][];
    emptyMessage: string;
}) {
    if (rows.length === 0) {
        return (
            <p className="text-center text-gray-400 text-sm py-6">
                {emptyMessage}
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-100">
                        {headers.map((h) => (
                            <th
                                key={h}
                                className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider py-2 px-3"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, ri) => (
                        <tr
                            key={ri}
                            className="border-b border-gray-50 hover:bg-gray-50/50"
                        >
                            {row.map((cell, ci) => (
                                <td
                                    key={ci}
                                    className={`py-2.5 px-3 ${
                                        ci === 0
                                            ? "font-medium text-brand-text"
                                            : "text-gray-600"
                                    }`}
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
