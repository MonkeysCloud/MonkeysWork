"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import StatusBadge from "@/components/admin/StatusBadge";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Tx {
    id: string;
    contract_id: string;
    milestone_id: string | null;
    type: string;
    amount: string;
    currency: string;
    status: string;
    gateway_reference: string | null;
    job_title: string;
    client_name: string;
    freelancer_name: string;
    created_at: string;
    [key: string]: unknown;
}

const TYPE_LABELS: Record<string, string> = {
    fund: "💰 Funded",
    release: "✅ Released",
    refund: "↩️ Refunded",
    platform_fee: "🏷️ Commission",
    client_fee: "📋 Fee",
};

const PER_PAGE = 20;

export default function AdminTransactionsPage() {
    const { token } = useAuth();
    const [txs, setTxs] = useState<Tx[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            per_page: String(PER_PAGE),
        });
        if (typeFilter) params.set("type", typeFilter);
        if (statusFilter) params.set("status", statusFilter);

        try {
            const res = await fetch(
                `${API}/admin/billing/transactions?${params}`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const json = await res.json();
            setTxs(json.data ?? []);
            setTotal(json.meta?.total ?? 0);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }, [token, page, typeFilter, statusFilter]);

    useEffect(() => {
        load();
    }, [load]);

    const fmt = (v: string) =>
        "$" +
        Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 });

    const columns: Column<Tx>[] = [
        {
            key: "type",
            label: "Type",
            render: (t) => (
                <span className="text-xs font-medium">
                    {TYPE_LABELS[t.type] || t.type}
                </span>
            ),
        },
        {
            key: "job_title",
            label: "Job",
            render: (t) => (
                <span className="font-medium text-brand-text truncate max-w-[200px] block">
                    {t.job_title}
                </span>
            ),
        },
        { key: "client_name", label: "Client" },
        { key: "freelancer_name", label: "Freelancer" },
        {
            key: "amount",
            label: "Amount",
            className: "text-right",
            render: (t) => (
                <span className="font-semibold">{fmt(t.amount)}</span>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (t) => <StatusBadge status={t.status} />,
        },
        {
            key: "gateway_reference",
            label: "Stripe Ref",
            render: (t) => (
                <span className="text-xs text-gray-400 font-mono">
                    {t.gateway_reference
                        ? t.gateway_reference.slice(0, 14) + "…"
                        : "—"}
                </span>
            ),
        },
        {
            key: "created_at",
            label: "Date",
            render: (t) =>
                new Date(t.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-brand-text">
                    All Transactions
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Platform-wide payment activity
                </p>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <select
                    value={typeFilter}
                    onChange={(e) => {
                        setTypeFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                >
                    <option value="">All Types</option>
                    <option value="fund">💰 Funded</option>
                    <option value="release">✅ Released</option>
                    <option value="refund">↩️ Refunded</option>
                    <option value="platform_fee">🏷️ Commission</option>
                    <option value="client_fee">📋 Client Fee</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                >
                    <option value="">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            <AdminTable
                columns={columns}
                data={txs}
                loading={loading}
                page={page}
                totalPages={Math.ceil(total / PER_PAGE)}
                total={total}
                onPageChange={setPage}
                emptyMessage="No transactions found."
            />
        </div>
    );
}
