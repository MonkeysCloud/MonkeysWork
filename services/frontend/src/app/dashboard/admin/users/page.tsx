"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import StatusBadge from "@/components/admin/StatusBadge";
import ActionModal from "@/components/admin/ActionModal";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface User {
    id: string;
    email: string;
    role: string;
    status: string;
    display_name: string;
    avatar_url: string | null;
    country: string | null;
    email_verified_at: string | null;
    last_login_at: string | null;
    created_at: string;
    [key: string]: unknown;
}

const PER_PAGE = 20;

export default function AdminUsersPage() {
    const { token } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState(
        searchParams.get("role") ?? "",
    );
    const [statusFilter, setStatusFilter] = useState(
        searchParams.get("status") ?? "",
    );

    /* Modal state */
    const [selected, setSelected] = useState<User | null>(null);
    const [newStatus, setNewStatus] = useState("");
    const [modalLoading, setModalLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            per_page: String(PER_PAGE),
        });
        if (search) params.set("search", search);
        if (roleFilter) params.set("role", roleFilter);
        if (statusFilter) params.set("status", statusFilter);

        try {
            const res = await fetch(`${API}/admin/users/?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setUsers(json.data ?? []);
            setTotal(json.meta?.total ?? 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token, page, search, roleFilter, statusFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleStatusUpdate = async () => {
        if (!selected || !newStatus) return;
        setModalLoading(true);
        try {
            await fetch(`${API}/admin/users/${selected.id}/status/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            setSelected(null);
            fetchUsers();
        } catch (e) {
            console.error(e);
        } finally {
            setModalLoading(false);
        }
    };

    const columns: Column<User>[] = [
        {
            key: "display_name",
            label: "Name",
            render: (u) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange text-sm font-bold flex-shrink-0">
                        {(u.display_name || u.email)?.[0]?.toUpperCase() ??
                            "?"}
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-brand-text truncate">
                            {u.display_name || "—"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                            {u.email}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: "role",
            label: "Role",
            render: (u) => (
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {u.role}
                </span>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (u) => <StatusBadge status={u.status} />,
        },
        {
            key: "country",
            label: "Country",
        },
        {
            key: "created_at",
            label: "Joined",
            render: (u) =>
                new Date(u.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }),
        },
        {
            key: "actions",
            label: "",
            render: (u) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelected(u);
                        setNewStatus(u.status === "active" ? "suspended" : "active");
                    }}
                    className="text-xs text-brand-orange hover:text-brand-orange-hover font-medium transition-colors"
                >
                    Change Status
                </button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-brand-text">Users</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage platform users
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30 w-64"
                />
                <select
                    value={roleFilter}
                    onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                >
                    <option value="">All Roles</option>
                    <option value="client">Client</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="admin">Admin</option>
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
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="deactivated">Deactivated</option>
                    <option value="pending_verification">Pending</option>
                </select>
            </div>

            <AdminTable
                columns={columns}
                data={users}
                loading={loading}
                page={page}
                totalPages={Math.ceil(total / PER_PAGE)}
                total={total}
                onPageChange={setPage}
                onRowClick={(u) => router.push(`/dashboard/admin/users/${u.id}`)}
            />

            {/* Status change modal */}
            <ActionModal
                open={!!selected}
                title={`Update User Status`}
                onClose={() => setSelected(null)}
                onConfirm={handleStatusUpdate}
                confirmLabel="Update Status"
                confirmColor={newStatus === "suspended" ? "red" : "green"}
                loading={modalLoading}
            >
                {selected && (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                            Change status for{" "}
                            <strong>
                                {selected.display_name || selected.email}
                            </strong>
                        </p>
                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                        >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="deactivated">Deactivated</option>
                            <option value="pending_verification">
                                Pending Verification
                            </option>
                        </select>
                    </div>
                )}
            </ActionModal>
        </div>
    );
}
