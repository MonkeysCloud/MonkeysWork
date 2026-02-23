"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

type Invitation = {
    id: string;
    job_id: string;
    client_id: string;
    freelancer_id: string;
    message: string | null;
    status: string;
    responded_at: string | null;
    created_at: string;
    job_title: string;
    job_budget_type: string;
    job_budget_min: string | null;
    job_budget_max: string | null;
    job_status: string;
    client_name: string;
    client_avatar: string | null;
    freelancer_name: string;
    freelancer_avatar: string | null;
    freelancer_headline: string | null;
    freelancer_hourly_rate: string | null;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    pending:  { bg: "bg-amber-50",   text: "text-amber-600",   label: "Pending" },
    accepted: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Accepted" },
    declined: { bg: "bg-red-50",     text: "text-red-500",     label: "Declined" },
    expired:  { bg: "bg-gray-100",   text: "text-gray-500",    label: "Expired" },
};

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatBudget(min: string | null, max: string | null) {
    const fmt = (n: number) => `$${n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n}`;
    if (min && max) return `${fmt(+min)} – ${fmt(+max)}`;
    if (min) return `From ${fmt(+min)}`;
    if (max) return `Up to ${fmt(+max)}`;
    return "Negotiable";
}

function Avatar({ name, url, size = "w-10 h-10" }: { name: string; url: string | null; size?: string }) {
    if (url) {
        const src = url.startsWith("http") ? url : `${new URL(API).origin}${url}`;
        return <img src={src} alt={name} className={`${size} rounded-full object-cover flex-shrink-0`} />;
    }
    return (
        <div className={`${size} rounded-full bg-gradient-to-br from-brand-orange/20 to-brand-orange/5 flex items-center justify-center text-brand-orange font-bold text-sm flex-shrink-0`}>
            {name?.[0]?.toUpperCase() ?? "?"}
        </div>
    );
}

export default function InvitationsPage() {
    const { user, token } = useAuth();
    const isClient = user?.role === "client";

    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const fetchInvitations = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            params.set("per_page", "50");
            if (filter !== "all") params.set("status", filter);

            const res = await fetch(`${API}/invitations?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const json = await res.json();
            setInvitations(json.data ?? []);
            setTotal(json.meta?.total ?? 0);
        } catch {
            setError("Failed to load invitations");
        } finally {
            setLoading(false);
        }
    }, [token, filter]);

    useEffect(() => { fetchInvitations(); }, [fetchInvitations]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    const handleAction = async (invId: string, action: "accept" | "decline") => {
        if (!token) return;
        setActionLoading(invId);
        try {
            const res = await fetch(`${API}/invitations/${invId}/${action}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || `Failed to ${action}`);
            }
            setToast({ message: `Invitation ${action === "accept" ? "accepted" : "declined"}!`, type: "success" });
            fetchInvitations();
        } catch (err) {
            setToast({ message: err instanceof Error ? err.message : `Failed to ${action}`, type: "error" });
        } finally {
            setActionLoading(null);
        }
    };

    const TABS = [
        { key: "all", label: "All" },
        { key: "pending", label: "Pending" },
        { key: "accepted", label: "Accepted" },
        { key: "declined", label: "Declined" },
    ];

    return (
        <div>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-[slideDown_0.2s_ease-out] ${
                    toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                }`}>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
                    {isClient ? "Sent Invitations" : "My Invitations"}
                </h1>
                <p className="text-sm text-brand-muted mt-0.5">
                    {isClient
                        ? "Track invitations you've sent to freelancers"
                        : "View and respond to invitations from clients"}
                </p>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                            filter === tab.key
                                ? "bg-white text-brand-dark shadow-sm"
                                : "text-brand-muted hover:text-brand-dark"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex items-center gap-3 text-brand-muted">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-sm font-medium">Loading invitations...</span>
                    </div>
                </div>
            ) : invitations.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-brand-border/60">
                    <span className="text-5xl mb-4 block">📬</span>
                    <h3 className="text-lg font-bold text-brand-dark mb-1">
                        {filter !== "all" ? "No invitations found" : isClient ? "No invitations sent yet" : "No invitations received yet"}
                    </h3>
                    <p className="text-sm text-brand-muted">
                        {isClient
                            ? "Search for freelancers and invite them to your jobs."
                            : "When clients find your profile appealing, they'll send you invitations here."}
                    </p>
                </div>
            ) : (
                <>
                    <p className="text-xs text-brand-muted mb-3">
                        {total} invitation{total !== 1 ? "s" : ""}
                    </p>

                    <div className="space-y-3">
                        {invitations.map((inv) => {
                            const st = STATUS_STYLES[inv.status] || STATUS_STYLES.pending;
                            const isPending = inv.status === "pending";
                            const isActioning = actionLoading === inv.id;

                            return (
                                <div
                                    key={inv.id}
                                    className={`bg-white rounded-xl border-2 p-5 transition-all duration-200 ${
                                        isPending && !isClient
                                            ? "border-brand-orange/20 shadow-sm hover:shadow-md"
                                            : "border-brand-border/60"
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Avatar of other party */}
                                        <Avatar
                                            name={isClient ? inv.freelancer_name : inv.client_name}
                                            url={isClient ? inv.freelancer_avatar : inv.client_avatar}
                                        />

                                        <div className="flex-1 min-w-0">
                                            {/* Name + status */}
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="text-sm font-bold text-brand-dark">
                                                    {isClient ? inv.freelancer_name : inv.client_name}
                                                </span>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${st.bg} ${st.text}`}>
                                                    {st.label}
                                                </span>
                                                <span className="text-[11px] text-brand-muted ml-auto flex-shrink-0">
                                                    {timeAgo(inv.created_at)}
                                                </span>
                                            </div>

                                            {/* Extra info */}
                                            {isClient && inv.freelancer_headline && (
                                                <p className="text-xs text-brand-muted mb-1">{inv.freelancer_headline}</p>
                                            )}

                                            {/* Job info */}
                                            <div className="flex items-center gap-2 text-xs mb-2">
                                                <span className="font-medium text-brand-dark">{inv.job_title}</span>
                                                <span className="text-brand-muted">·</span>
                                                <span className="text-brand-muted">
                                                    {formatBudget(inv.job_budget_min, inv.job_budget_max)}
                                                </span>
                                                {isClient && inv.freelancer_hourly_rate && (
                                                    <>
                                                        <span className="text-brand-muted">·</span>
                                                        <span className="text-brand-muted">
                                                            ${Number(inv.freelancer_hourly_rate).toFixed(0)}/hr
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Message */}
                                            {inv.message && (
                                                <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-brand-dark/80 mb-3">
                                                    &ldquo;{inv.message}&rdquo;
                                                </div>
                                            )}

                                            {/* Actions (freelancer only, pending only) */}
                                            {!isClient && isPending && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleAction(inv.id, "accept")}
                                                        disabled={isActioning}
                                                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-sm"
                                                    >
                                                        {isActioning ? "..." : "✓ Accept"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(inv.id, "decline")}
                                                        disabled={isActioning}
                                                        className="px-4 py-2 text-xs font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-all"
                                                    >
                                                        ✕ Decline
                                                    </button>
                                                </div>
                                            )}

                                            {/* Responded at info */}
                                            {inv.responded_at && (
                                                <p className="text-[10px] text-brand-muted mt-2">
                                                    Responded {timeAgo(inv.responded_at)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
