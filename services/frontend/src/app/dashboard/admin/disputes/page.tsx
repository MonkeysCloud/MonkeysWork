"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import StatusBadge from "@/components/admin/StatusBadge";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Dispute {
    id: string;
    job_title: string;
    client_name: string;
    freelancer_name: string;
    status: string;
    reason: string;
    created_at: string;
    [key: string]: unknown;
}

const PER_PAGE = 20;

export default function AdminDisputesPage() {
    const { token } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState(
        searchParams.get("status") ?? "",
    );

    const fetchDisputes = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            per_page: String(PER_PAGE),
        });
        if (statusFilter) params.set("status", statusFilter);

        try {
            const res = await fetch(`${API}/admin/disputes/?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setDisputes(json.data ?? []);
            setTotal(json.meta?.total ?? 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token, page, statusFilter]);

    useEffect(() => {
        fetchDisputes();
    }, [fetchDisputes]);

    const columns: Column<Dispute>[] = [
        {
            key: "job_title",
            label: "Job",
            render: (d) => (
                <span className="font-medium text-brand-text">
                    {d.job_title}
                </span>
            ),
        },
        { key: "client_name", label: "Client" },
        { key: "freelancer_name", label: "Freelancer" },
        {
            key: "status",
            label: "Status",
            render: (d) => <StatusBadge status={d.status} />,
        },
        {
            key: "created_at",
            label: "Opened",
            render: (d) =>
                new Date(d.created_at).toLocaleDateString("en-US", {
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
                    Disputes
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Monitor and resolve contract disputes
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
                    <option value="open">Open</option>
                    <option value="under_review">Under Review</option>
                    <option value="escalated">Escalated</option>
                    <option value="resolved_client">Resolved (Client)</option>
                    <option value="resolved_freelancer">Resolved (Freelancer)</option>
                    <option value="resolved_split">Resolved (Split)</option>
                </select>
            </div>

            <AdminTable
                columns={columns}
                data={disputes}
                loading={loading}
                page={page}
                totalPages={Math.ceil(total / PER_PAGE)}
                total={total}
                onPageChange={setPage}
                onRowClick={(d) => router.push(`/dashboard/admin/disputes/${d.id}`)}
                emptyMessage="No disputes found."
            />
        </div>
    );
}
