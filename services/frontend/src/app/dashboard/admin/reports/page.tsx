"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import StatusBadge from "@/components/admin/StatusBadge";
import ActionModal from "@/components/admin/ActionModal";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Report {
    id: string;
    reporter_name: string;
    entity_type: string;
    entity_id: string;
    reason: string;
    status: string;
    created_at: string;
    [key: string]: unknown;
}

const PER_PAGE = 20;

export default function AdminReportsPage() {
    const { token } = useAuth();
    const searchParams = useSearchParams();

    const [reports, setReports] = useState<Report[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState(
        searchParams.get("status") ?? "",
    );

    const [selected, setSelected] = useState<Report | null>(null);
    const [resolution, setResolution] = useState("");
    const [modalLoading, setModalLoading] = useState(false);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            per_page: String(PER_PAGE),
        });
        if (statusFilter) params.set("status", statusFilter);

        try {
            const res = await fetch(`${API}/admin/reports/?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setReports(json.data ?? []);
            setTotal(json.meta?.total ?? 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token, page, statusFilter]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleResolve = async () => {
        if (!selected) return;
        setModalLoading(true);
        try {
            await fetch(`${API}/admin/reports/${selected.id}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status: "resolved",
                    resolution,
                }),
            });
            setSelected(null);
            setResolution("");
            fetchReports();
        } catch (e) {
            console.error(e);
        } finally {
            setModalLoading(false);
        }
    };

    const columns: Column<Report>[] = [
        {
            key: "reporter_name",
            label: "Reporter",
            render: (r) => (
                <span className="font-medium text-brand-text">
                    {r.reporter_name}
                </span>
            ),
        },
        { key: "entity_type", label: "Target Type" },
        {
            key: "reason",
            label: "Reason",
            render: (r) => (
                <span className="truncate block max-w-[200px]">
                    {r.reason}
                </span>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (r) => <StatusBadge status={r.status} />,
        },
        {
            key: "created_at",
            label: "Reported",
            render: (r) =>
                new Date(r.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }),
        },
        {
            key: "actions",
            label: "",
            render: (r) =>
                r.status !== "resolved" ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelected(r);
                        }}
                        className="text-xs text-brand-orange hover:text-brand-orange-hover font-medium transition-colors"
                    >
                        Resolve
                    </button>
                ) : null,
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-brand-text">
                    Content Reports
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Review user-submitted reports
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
                    <option value="pending">Pending</option>
                    <option value="in_review">In Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                </select>
            </div>

            <AdminTable
                columns={columns}
                data={reports}
                loading={loading}
                page={page}
                totalPages={Math.ceil(total / PER_PAGE)}
                total={total}
                onPageChange={setPage}
            />

            <ActionModal
                open={!!selected}
                title="Resolve Report"
                onClose={() => {
                    setSelected(null);
                    setResolution("");
                }}
                onConfirm={handleResolve}
                confirmLabel="Resolve"
                confirmColor="green"
                loading={modalLoading}
            >
                {selected && (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                            Resolve report from{" "}
                            <strong>{selected.reporter_name}</strong>
                        </p>
                        <textarea
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            placeholder="Resolution notes…"
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                        />
                    </div>
                )}
            </ActionModal>
        </div>
    );
}
