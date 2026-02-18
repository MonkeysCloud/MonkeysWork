"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import StatusBadge from "@/components/admin/StatusBadge";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Invoice {
    id: string;
    contract_id: string;
    invoice_number: string;
    subtotal: string;
    platform_fee: string;
    tax_amount: string;
    total: string;
    currency: string;
    status: string;
    issued_at: string;
    due_at: string;
    paid_at: string | null;
    job_title: string;
    client_name: string;
    freelancer_name: string;
    [key: string]: unknown;
}

const PER_PAGE = 20;

export default function AdminInvoicesPage() {
    const { token } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            per_page: String(PER_PAGE),
        });
        if (statusFilter) params.set("status", statusFilter);

        try {
            const res = await fetch(
                `${API}/admin/billing/invoices?${params}`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const json = await res.json();
            setInvoices(json.data ?? []);
            setTotal(json.meta?.total ?? 0);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }, [token, page, statusFilter]);

    useEffect(() => {
        load();
    }, [load]);

    const fmt = (v: string) =>
        "$" +
        Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 });

    const columns: Column<Invoice>[] = [
        {
            key: "invoice_number",
            label: "Invoice #",
            render: (inv) => (
                <span className="font-mono font-semibold text-brand-text">
                    {inv.invoice_number}
                </span>
            ),
        },
        {
            key: "job_title",
            label: "Job",
            render: (inv) => (
                <span className="font-medium text-brand-text truncate max-w-[180px] block">
                    {inv.job_title}
                </span>
            ),
        },
        { key: "client_name", label: "Client" },
        { key: "freelancer_name", label: "Freelancer" },
        {
            key: "subtotal",
            label: "Subtotal",
            className: "text-right",
            render: (inv) => <span>{fmt(inv.subtotal)}</span>,
        },
        {
            key: "platform_fee",
            label: "Fee",
            className: "text-right",
            render: (inv) => (
                <span className="text-gray-500">{fmt(inv.platform_fee)}</span>
            ),
        },
        {
            key: "total",
            label: "Total",
            className: "text-right",
            render: (inv) => (
                <span className="font-semibold">{fmt(inv.total)}</span>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (inv) => <StatusBadge status={inv.status} />,
        },
        {
            key: "issued_at",
            label: "Issued",
            render: (inv) =>
                new Date(inv.issued_at).toLocaleDateString("en-US", {
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
                    All Invoices
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Platform-wide invoice management
                </p>
            </div>

            <div className="flex gap-3">
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                >
                    <option value="">All Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="sent">Sent</option>
                    <option value="draft">Draft</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                </select>
            </div>

            <AdminTable
                columns={columns}
                data={invoices}
                loading={loading}
                page={page}
                totalPages={Math.ceil(total / PER_PAGE)}
                total={total}
                onPageChange={setPage}
                emptyMessage="No invoices found."
            />
        </div>
    );
}
