"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import StatusBadge from "@/components/admin/StatusBadge";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Contract {
    id: string;
    title: string;
    contract_type: string;
    total_amount: string;
    hourly_rate: string;
    currency: string;
    status: string;
    client_name: string;
    freelancer_name: string;
    job_title: string;
    milestone_count: number;
    dispute_count: number;
    created_at: string;
    [key: string]: unknown;
}

const PER_PAGE = 20;

export default function AdminContractsPage() {
    const { token } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [contracts, setContracts] = useState<Contract[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
    const [typeFilter, setTypeFilter] = useState(searchParams.get("type") ?? "");
    const [search, setSearch] = useState("");

    const fetchContracts = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            per_page: String(PER_PAGE),
        });
        if (statusFilter) params.set("status", statusFilter);
        if (typeFilter) params.set("type", typeFilter);
        if (search) params.set("search", search);

        try {
            const res = await fetch(`${API}/admin/contracts?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setContracts(json.data ?? []);
            setTotal(json.meta?.total ?? 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token, page, statusFilter, typeFilter, search]);

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    const fmt = (v: string | number) =>
        `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    const columns: Column<Contract>[] = [
        {
            key: "title",
            label: "Contract",
            render: (c) => (
                <div>
                    <span className="font-semibold text-brand-text">{c.title}</span>
                    {c.job_title && (
                        <div className="text-xs text-gray-400 mt-0.5">{c.job_title}</div>
                    )}
                </div>
            ),
        },
        { key: "client_name", label: "Client" },
        { key: "freelancer_name", label: "Freelancer" },
        {
            key: "contract_type",
            label: "Type",
            render: (c) => (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.contract_type === "fixed"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-purple-50 text-purple-700"
                }`}>
                    {c.contract_type === "fixed" ? "📌 Fixed" : "⏱️ Hourly"}
                </span>
            ),
        },
        {
            key: "total_amount",
            label: "Amount",
            render: (c) => (
                <span className="font-medium">
                    {c.contract_type === "hourly"
                        ? `${fmt(c.hourly_rate)}/hr`
                        : fmt(c.total_amount)}
                </span>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (c) => <StatusBadge status={c.status} />,
        },
        {
            key: "milestone_count",
            label: "Milestones",
            render: (c) => <span className="text-sm">{c.milestone_count}</span>,
        },
        {
            key: "dispute_count",
            label: "Disputes",
            render: (c) =>
                c.dispute_count > 0 ? (
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        {c.dispute_count}
                    </span>
                ) : (
                    <span className="text-gray-300">—</span>
                ),
        },
        {
            key: "created_at",
            label: "Created",
            render: (c) =>
                new Date(c.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-brand-text">Contracts</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage all platform contracts
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Search contracts…"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30 w-64"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="suspended">Suspended</option>
                    <option value="disputed">Disputed</option>
                </select>
                <select
                    value={typeFilter}
                    onChange={(e) => {
                        setTypeFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                >
                    <option value="">All Types</option>
                    <option value="fixed">Fixed Price</option>
                    <option value="hourly">Hourly</option>
                </select>
            </div>

            <AdminTable
                columns={columns}
                data={contracts}
                loading={loading}
                page={page}
                totalPages={Math.ceil(total / PER_PAGE)}
                total={total}
                onPageChange={setPage}
                onRowClick={(c) => router.push(`/dashboard/admin/contracts/${c.id}`)}
                emptyMessage="No contracts found."
            />
        </div>
    );
}
