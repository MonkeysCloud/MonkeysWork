"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminTable, { type Column } from "@/components/admin/AdminTable";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Activity {
    id: string;
    user_id: string;
    user_name: string;
    action: string;
    entity_type: string;
    entity_id: string;
    ip_address: string | null;
    created_at: string;
    [key: string]: unknown;
}

const PER_PAGE = 50;

export default function AdminActivityPage() {
    const { token } = useAuth();

    const [items, setItems] = useState<Activity[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState("");
    const [entityFilter, setEntityFilter] = useState("");

    const fetchActivity = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            per_page: String(PER_PAGE),
        });
        if (actionFilter) params.set("action", actionFilter);
        if (entityFilter) params.set("entity_type", entityFilter);

        try {
            const res = await fetch(
                `${API}/admin/activity-log/?${params}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            const json = await res.json();
            setItems(json.data ?? []);
            setTotal(json.meta?.total ?? 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token, page, actionFilter, entityFilter]);

    useEffect(() => {
        fetchActivity();
    }, [fetchActivity]);

    const columns: Column<Activity>[] = [
        {
            key: "user_name",
            label: "User",
            render: (a) => (
                <span className="font-medium text-brand-text">
                    {a.user_name || "System"}
                </span>
            ),
        },
        {
            key: "action",
            label: "Action",
            render: (a) => (
                <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                    {a.action}
                </span>
            ),
        },
        {
            key: "entity_type",
            label: "Entity",
            render: (a) => (
                <div>
                    <span className="text-xs text-gray-500 capitalize">
                        {a.entity_type}
                    </span>
                    {a.entity_id && (
                        <span className="text-xs text-gray-300 ml-1">
                            #{a.entity_id.slice(0, 8)}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: "ip_address",
            label: "IP",
            render: (a) => (
                <span className="text-xs text-gray-400 font-mono">
                    {a.ip_address || "—"}
                </span>
            ),
        },
        {
            key: "created_at",
            label: "Time",
            render: (a) =>
                new Date(a.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-brand-text">
                    Activity Log
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Audit trail of platform actions
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <select
                    value={actionFilter}
                    onChange={(e) => {
                        setActionFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                >
                    <option value="">All Actions</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
                </select>
                <select
                    value={entityFilter}
                    onChange={(e) => {
                        setEntityFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                >
                    <option value="">All Entities</option>
                    <option value="user">User</option>
                    <option value="job">Job</option>
                    <option value="contract">Contract</option>
                    <option value="verification">Verification</option>
                    <option value="dispute">Dispute</option>
                </select>
            </div>

            <AdminTable
                columns={columns}
                data={items}
                loading={loading}
                page={page}
                totalPages={Math.ceil(total / PER_PAGE)}
                total={total}
                onPageChange={setPage}
                emptyMessage="No activity recorded yet."
            />
        </div>
    );
}
