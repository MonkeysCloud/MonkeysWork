"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
    Dispute,
    DISPUTE_REASONS,
    DISPUTE_STATUS,
    formatDate,
} from "@/components/contracts/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";
const PER_PAGE = 20;

const STATUS_TABS = [
    { value: "", label: "All" },
    { value: "open", label: "Open" },
    { value: "under_review", label: "Under Review" },
    { value: "escalated", label: "Escalated" },
    { value: "resolved_client", label: "Resolved" },
];

function timeLeft(deadline?: string): { text: string; urgent: boolean; expired: boolean } | null {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return { text: "Expired", urgent: true, expired: true };

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);

    if (days > 0) return { text: `${days}d ${hours}h left`, urgent: days < 1, expired: false };
    return { text: `${hours}h left`, urgent: true, expired: false };
}

export default function DisputesPage() {
    const { token, user } = useAuth();
    const router = useRouter();

    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");

    const fetchDisputes = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                per_page: String(PER_PAGE),
            });
            if (statusFilter) params.set("status", statusFilter);

            const res = await fetch(`${API}/disputes?${params}`, {
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

    const totalPages = Math.ceil(total / PER_PAGE);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-brand-text">Disputes</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Track and manage your contract disputes
                </p>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-0">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${statusFilter === tab.value
                                ? "border-brand-orange text-brand-orange"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Disputes List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
            ) : disputes.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="text-4xl mb-3">✅</div>
                    <h3 className="text-lg font-semibold text-gray-900">No disputes</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {statusFilter
                            ? `No ${STATUS_TABS.find((t) => t.value === statusFilter)?.label.toLowerCase()} disputes`
                            : "You don't have any disputes — great!"}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {disputes.map((d) => {
                        const status = DISPUTE_STATUS[d.status] ?? {
                            label: d.status,
                            bg: "#f3f4f6",
                            fg: "#6b7280",
                            icon: "❓",
                        };
                        const reason = DISPUTE_REASONS.find((r) => r.value === d.reason)?.label ?? d.reason;
                        const deadline = timeLeft(d.response_deadline);
                        const isAwaitingMe = d.awaiting_response_from === user?.id;

                        return (
                            <button
                                key={d.id}
                                onClick={() => router.push(`/dashboard/disputes/${d.id}`)}
                                className="w-full text-left bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900 truncate">
                                                {d.job_title ?? "Contract Dispute"}
                                            </h3>
                                            <span
                                                className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap"
                                                style={{ background: status.bg, color: status.fg }}
                                            >
                                                {status.icon} {status.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            <span className="font-medium">{reason}</span>
                                            <span className="mx-2 text-gray-300">·</span>
                                            {d.client_name} vs {d.freelancer_name}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1 truncate">
                                            {d.description?.slice(0, 100)}
                                            {(d.description?.length ?? 0) > 100 ? "…" : ""}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <span className="text-xs text-gray-400">
                                            {formatDate(d.created_at)}
                                        </span>
                                        {d.message_count !== undefined && (
                                            <span className="text-xs text-gray-400">
                                                💬 {d.message_count} messages
                                            </span>
                                        )}
                                        {deadline && !deadline.expired && (
                                            <span
                                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isAwaitingMe
                                                        ? deadline.urgent
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-orange-100 text-orange-700"
                                                        : "bg-blue-100 text-blue-700"
                                                    }`}
                                            >
                                                {isAwaitingMe ? `⏰ Your turn — ${deadline.text}` : `Waiting for reply — ${deadline.text}`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="px-4 py-2 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                        ← Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-500">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="px-4 py-2 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
