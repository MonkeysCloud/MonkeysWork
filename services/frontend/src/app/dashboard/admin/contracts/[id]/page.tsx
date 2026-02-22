"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import StatusBadge from "@/components/admin/StatusBadge";
import ActionModal from "@/components/admin/ActionModal";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Milestone {
    id: string;
    title: string;
    amount: string;
    currency: string;
    status: string;
    escrow_funded: boolean;
    due_date: string | null;
    created_at: string;
}

interface Dispute {
    id: string;
    reason: string;
    status: string;
    resolution_amount: string | null;
    created_at: string;
    resolved_at: string | null;
}

interface Escrow {
    total_funded: string;
    total_released: string;
    total_refunded: string;
    platform_fees: string;
}

interface ContractDetail {
    id: string;
    title: string;
    description: string;
    contract_type: string;
    total_amount: string;
    hourly_rate: string;
    weekly_hour_limit: number;
    currency: string;
    status: string;
    platform_fee_percent: string;
    started_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    created_at: string;
    job_title: string;
    client_name: string;
    client_email: string;
    client_avatar: string | null;
    freelancer_name: string;
    freelancer_email: string;
    freelancer_avatar: string | null;
    client_id: string;
    freelancer_id: string;
    milestones: Milestone[];
    disputes: Dispute[];
    escrow: Escrow;
    [key: string]: unknown;
}

export default function AdminContractDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { token } = useAuth();
    const router = useRouter();

    const [contract, setContract] = useState<ContractDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionModal, setActionModal] = useState<{
        action: string;
        title: string;
    } | null>(null);
    const [cancelReason, setCancelReason] = useState("");

    const fetchContract = useCallback(async () => {
        try {
            const res = await fetch(`${API}/admin/contracts/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setContract(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [id, token]);

    useEffect(() => {
        fetchContract();
    }, [fetchContract]);

    const handleStatusChange = async (status: string, reason?: string) => {
        await fetch(`${API}/admin/contracts/${id}/status`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status, reason }),
        });
        setActionModal(null);
        fetchContract();
    };

    const fmt = (v: string | number) =>
        `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    const fmtDate = (d: string | null) =>
        d
            ? new Date(d).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
              })
            : "—";

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="animate-spin h-8 w-8 border-4 border-brand-orange border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="text-center py-20 text-gray-400">Contract not found</div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <button
                        onClick={() => router.push("/dashboard/admin/contracts")}
                        className="text-sm text-gray-400 hover:text-brand-orange mb-2 inline-flex items-center gap-1"
                    >
                        ← Back to Contracts
                    </button>
                    <h1 className="text-2xl font-bold text-brand-text">{contract.title}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {contract.job_title && `Job: ${contract.job_title}`}
                    </p>
                </div>
                <StatusBadge status={contract.status} />
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Client</h3>
                    <div className="flex items-center gap-3">
                        {contract.client_avatar ? (
                            <img src={contract.client_avatar} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                {contract.client_name?.[0]}
                            </div>
                        )}
                        <div>
                            <p className="font-semibold text-brand-text">{contract.client_name}</p>
                            <p className="text-xs text-gray-400">{contract.client_email}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Freelancer</h3>
                    <div className="flex items-center gap-3">
                        {contract.freelancer_avatar ? (
                            <img src={contract.freelancer_avatar} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
                                {contract.freelancer_name?.[0]}
                            </div>
                        )}
                        <div>
                            <p className="font-semibold text-brand-text">{contract.freelancer_name}</p>
                            <p className="text-xs text-gray-400">{contract.freelancer_email}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contract Info + Escrow */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contract Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Type</span>
                            <span className="font-medium">
                                {contract.contract_type === "fixed" ? "📌 Fixed Price" : "⏱️ Hourly"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Amount</span>
                            <span className="font-medium">
                                {contract.contract_type === "hourly"
                                    ? `${fmt(contract.hourly_rate)}/hr`
                                    : fmt(contract.total_amount)}
                            </span>
                        </div>
                        {contract.contract_type === "hourly" && contract.weekly_hour_limit && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Weekly Limit</span>
                                <span className="font-medium">{contract.weekly_hour_limit}h</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-gray-500">Platform Fee</span>
                            <span className="font-medium">{contract.platform_fee_percent}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Created</span>
                            <span>{fmtDate(contract.created_at)}</span>
                        </div>
                        {contract.started_at && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Started</span>
                                <span>{fmtDate(contract.started_at)}</span>
                            </div>
                        )}
                        {contract.completed_at && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Completed</span>
                                <span>{fmtDate(contract.completed_at)}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Escrow Summary</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Total Funded</span>
                            <span className="font-medium text-blue-600">{fmt(contract.escrow?.total_funded ?? "0")}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Released</span>
                            <span className="font-medium text-green-600">{fmt(contract.escrow?.total_released ?? "0")}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Refunded</span>
                            <span className="font-medium text-red-600">{fmt(contract.escrow?.total_refunded ?? "0")}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Platform Fees</span>
                            <span className="font-medium text-purple-600">{fmt(contract.escrow?.platform_fees ?? "0")}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Milestones */}
            {contract.milestones && contract.milestones.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Milestones ({contract.milestones.length})
                    </h3>
                    <div className="divide-y divide-gray-50">
                        {contract.milestones.map((m) => (
                            <div key={m.id} className="flex items-center justify-between py-3">
                                <div>
                                    <p className="font-medium text-sm text-brand-text">{m.title}</p>
                                    {m.due_date && (
                                        <p className="text-xs text-gray-400">Due: {fmtDate(m.due_date)}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium">{fmt(m.amount)}</span>
                                    <StatusBadge status={m.status} />
                                    {m.escrow_funded && (
                                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                            Funded
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Disputes */}
            {contract.disputes && contract.disputes.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Disputes ({contract.disputes.length})
                    </h3>
                    <div className="divide-y divide-gray-50">
                        {contract.disputes.map((d) => (
                            <div
                                key={d.id}
                                className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded"
                                onClick={() => router.push(`/dashboard/admin/disputes/${d.id}`)}
                            >
                                <div>
                                    <p className="font-medium text-sm text-brand-text capitalize">
                                        {d.reason.replace(/_/g, " ")}
                                    </p>
                                    <p className="text-xs text-gray-400">{fmtDate(d.created_at)}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {d.resolution_amount && (
                                        <span className="text-sm font-medium text-indigo-600">
                                            {fmt(d.resolution_amount)}
                                        </span>
                                    )}
                                    <StatusBadge status={d.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Admin Actions */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Admin Actions
                </h3>
                <div className="flex flex-wrap gap-3">
                    {contract.status === "active" && (
                        <>
                            <button
                                onClick={() => setActionModal({ action: "completed", title: "Complete Contract" })}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                            >
                                ✅ Mark Complete
                            </button>
                            <button
                                onClick={() => setActionModal({ action: "suspended", title: "Suspend Contract" })}
                                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700"
                            >
                                ⏸️ Suspend
                            </button>
                            <button
                                onClick={() => setActionModal({ action: "cancelled", title: "Cancel Contract" })}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                            >
                                ❌ Cancel
                            </button>
                        </>
                    )}
                    {contract.status === "suspended" && (
                        <button
                            onClick={() => void handleStatusChange("active")}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            ▶️ Reactivate
                        </button>
                    )}
                    {(contract.status === "cancelled" || contract.status === "completed") && (
                        <p className="text-sm text-gray-400">
                            No actions available for {contract.status} contracts.
                        </p>
                    )}
                </div>
            </div>

            {/* Action Modal */}
            <ActionModal
                open={!!actionModal}
                title={actionModal?.title ?? ""}
                onClose={() => setActionModal(null)}
                onConfirm={() => {
                    void handleStatusChange(
                        actionModal?.action ?? "",
                        actionModal?.action === "cancelled" ? cancelReason : undefined,
                    );
                }}
                confirmLabel={actionModal?.title ?? "Confirm"}
                confirmColor={
                    actionModal?.action === "cancelled"
                        ? "red"
                        : actionModal?.action === "completed"
                          ? "green"
                          : "orange"
                }
            >
                <p className="text-sm text-gray-600">
                    Are you sure you want to set this contract to &quot;{actionModal?.action}&quot;?
                    This action may affect milestones and escrow funds.
                </p>
                {actionModal?.action === "cancelled" && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cancellation Reason
                        </label>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                            rows={3}
                            placeholder="Enter reason for cancellation…"
                        />
                    </div>
                )}
            </ActionModal>
        </div>
    );
}
