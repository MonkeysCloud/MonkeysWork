"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import StatusBadge from "@/components/admin/StatusBadge";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Payout {
    id: string;
    amount: string;
    currency: string;
    fee: string;
    status: string;
    method: string;
    freelancer_name: string;
    freelancer_email: string;
    gateway_reference: string | null;
    notes: string | null;
    created_at: string;
    processed_at: string | null;
    [key: string]: unknown;
}

const PER_PAGE = 20;

export default function AdminPayoutsPage() {
    const { token } = useAuth();
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [methodFilter, setMethodFilter] = useState("");
    const [actionId, setActionId] = useState<string | null>(null);
    const [actionStatus, setActionStatus] = useState("");
    const [actionNotes, setActionNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            per_page: String(PER_PAGE),
        });
        if (statusFilter) params.set("status", statusFilter);
        if (methodFilter) params.set("method", methodFilter);

        try {
            const res = await fetch(
                `${API}/admin/billing/payouts?${params}`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const json = await res.json();
            setPayouts(json.data ?? []);
            setTotal(json.meta?.total ?? 0);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }, [token, page, statusFilter, methodFilter]);

    useEffect(() => {
        load();
    }, [load]);

    const handleAction = async () => {
        if (!actionId || !actionStatus) return;
        setSubmitting(true);
        try {
            await fetch(`${API}/admin/billing/payouts/${actionId}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: actionStatus,
                    notes: actionNotes || undefined,
                }),
            });
            setActionId(null);
            setActionStatus("");
            setActionNotes("");
            load();
        } catch (e) {
            console.error(e);
        }
        setSubmitting(false);
    };

    const fmt = (v: string) =>
        "$" +
        Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 });

    const columns: Column<Payout>[] = [
        {
            key: "freelancer_name",
            label: "Freelancer",
            render: (p) => (
                <div>
                    <p className="font-medium text-brand-text">
                        {p.freelancer_name}
                    </p>
                    <p className="text-xs text-gray-400">{p.freelancer_email}</p>
                </div>
            ),
        },
        {
            key: "method",
            label: "Method",
            render: (p) => (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${p.method === "paypal"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-purple-50 text-purple-700 border border-purple-200"
                    }`}>
                    {p.method === "paypal" ? "💸 PayPal" : "🏦 Stripe"}
                </span>
            ),
        },
        {
            key: "amount",
            label: "Amount",
            className: "text-right",
            render: (p) => (
                <div>
                    <span className="font-semibold text-lg">{fmt(p.amount)}</span>
                    {Number(p.fee) > 0 && (
                        <span className="text-xs text-gray-400 ml-1">
                            −${Number(p.fee).toFixed(2)} fee
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (p) => <StatusBadge status={p.status} />,
        },
        {
            key: "created_at",
            label: "Requested",
            render: (p) =>
                new Date(p.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }),
        },
        {
            key: "processed_at",
            label: "Processed",
            render: (p) =>
                p.processed_at
                    ? new Date(p.processed_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                    })
                    : "—",
        },
        {
            key: "notes",
            label: "Notes",
            render: (p) => (
                <span className="text-xs text-gray-500 max-w-[120px] truncate block">
                    {p.notes || "—"}
                </span>
            ),
        },
        {
            key: "id",
            label: "Action",
            render: (p) =>
                p.status === "pending" ? (
                    <div className="flex gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActionId(p.id);
                                setActionStatus("approved");
                            }}
                            className="px-2 py-1 text-xs font-medium rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                        >
                            ✓ Approve
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActionId(p.id);
                                setActionStatus("rejected");
                            }}
                            className="px-2 py-1 text-xs font-medium rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                        >
                            ✗ Reject
                        </button>
                    </div>
                ) : p.status === "approved" ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setActionId(p.id);
                            setActionStatus("completed");
                        }}
                        className="px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                        Mark Completed
                    </button>
                ) : (
                    <span className="text-xs text-gray-400">Done</span>
                ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-brand-text">
                    Payout Management
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Review and process freelancer payout requests
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
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                </select>
                <select
                    value={methodFilter}
                    onChange={(e) => {
                        setMethodFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                >
                    <option value="">All Methods</option>
                    <option value="stripe">🏦 Stripe</option>
                    <option value="paypal">💸 PayPal</option>
                </select>
            </div>

            <AdminTable
                columns={columns}
                data={payouts}
                loading={loading}
                page={page}
                totalPages={Math.ceil(total / PER_PAGE)}
                total={total}
                onPageChange={setPage}
                emptyMessage="No payout requests found."
            />

            {/* Approval / Rejection Modal */}
            {actionId && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-brand-text mb-4">
                            {actionStatus === "approved"
                                ? "✅ Approve Payout"
                                : actionStatus === "rejected"
                                    ? "❌ Reject Payout"
                                    : "✓ Mark as Completed"}
                        </h3>
                        <textarea
                            placeholder="Add a note (optional)..."
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30 mb-4 resize-none"
                            rows={3}
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setActionId(null);
                                    setActionStatus("");
                                    setActionNotes("");
                                }}
                                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={submitting}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${actionStatus === "rejected"
                                    ? "bg-red-500 hover:bg-red-600"
                                    : "bg-brand-orange hover:bg-orange-600"
                                    } disabled:opacity-50`}
                            >
                                {submitting
                                    ? "Processing..."
                                    : `Confirm ${actionStatus === "approved" ? "Approval" : actionStatus === "rejected" ? "Rejection" : "Completion"}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
