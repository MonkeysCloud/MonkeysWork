"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
    ContractHeader,
    MilestoneList,
    DeliverablesList,
    DisputesPanel,
    ContractChat,
    Contract,
    Milestone,
    formatDate,
    formatMoney,
    styles,
    API,
} from "@/components/contracts";

type TabKey = "overview" | "milestones" | "deliverables" | "disputes" | "chat";

const TAB_ITEMS: { key: TabKey; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "📋" },
    { key: "milestones", label: "Milestones", icon: "🎯" },
    { key: "deliverables", label: "Deliverables", icon: "📁" },
    { key: "disputes", label: "Disputes", icon: "⚠️" },
    { key: "chat", label: "Chat", icon: "💬" },
];

export default function ContractDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { token, user } = useAuth();
    const isClient = user?.role === "client";
    const userId = user?.id ?? "";

    const [contract, setContract] = useState<Contract | null>(null);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabKey>("overview");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    /* ── Fetchers ── */
    const fetchContract = useCallback(async () => {
        if (!token || !id) return;
        const r = await fetch(`${API}/contracts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const j = await r.json();
        setContract(j.data ?? null);
    }, [token, id]);

    const fetchMilestones = useCallback(async () => {
        if (!token || !id) return;
        const r = await fetch(`${API}/contracts/${id}/milestones`, { headers: { Authorization: `Bearer ${token}` } });
        const j = await r.json();
        setMilestones(j.data ?? []);
    }, [token, id]);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchContract(), fetchMilestones()]).finally(() => setLoading(false));
    }, [fetchContract, fetchMilestones]);

    /* ── Actions ── */
    async function milestoneAction(msId: string, action: string, body?: object) {
        setActionLoading(msId);
        try {
            await fetch(`${API}/milestones/${msId}/${action}`, {
                method: "POST",
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });
            await fetchMilestones();
        } catch (e) {
            console.error(e);
        }
        setActionLoading(null);
    }

    async function addMilestone(data: { title: string; description: string; amount: string; due_date: string }) {
        setActionLoading("add-ms");
        await fetch(`${API}/contracts/${id}/milestones`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                title: data.title,
                description: data.description,
                amount: data.amount,
                due_date: data.due_date || null,
            }),
        });
        await fetchMilestones();
        setActionLoading(null);
    }

    async function contractAction(action: string) {
        setActionLoading(action);
        await fetch(`${API}/contracts/${id}/${action}`, { method: "POST", headers });
        await fetchContract();
        setActionLoading(null);
    }

    /* ── Loading / Not found ── */
    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
                <p>Loading contract…</p>
            </div>
        );
    }

    if (!contract) {
        return (
            <div style={{ textAlign: "center", padding: "4rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📄</div>
                <h3 style={{ color: "#0f172a" }}>Contract not found</h3>
                <button
                    onClick={() => router.push("/dashboard/contracts")}
                    style={{ ...styles.btnPrimary, marginTop: "1rem" }}
                >
                    ← Back to Contracts
                </button>
            </div>
        );
    }

    const acceptedMs = milestones.filter((m) => m.status === "accepted").length;

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            {/* Back */}
            <button
                onClick={() => router.push("/dashboard/contracts")}
                style={{ ...styles.btnOutline, marginBottom: "1rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
            >
                ← Back to Contracts
            </button>

            {/* Header */}
            <ContractHeader
                contract={contract}
                isClient={isClient ?? false}
                acceptedCount={acceptedMs}
                totalMilestones={milestones.length}
                actionLoading={actionLoading}
                onComplete={() => contractAction("complete")}
                onCancel={() => contractAction("cancel")}
            />

            {/* Tab bar */}
            <div
                style={{
                    display: "flex",
                    gap: "0.25rem",
                    background: "#f1f5f9",
                    borderRadius: 12,
                    padding: 4,
                    marginBottom: "1.25rem",
                    overflowX: "auto",
                }}
            >
                {TAB_ITEMS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        style={{
                            padding: "0.5rem 1rem",
                            borderRadius: 8,
                            fontSize: "0.8125rem",
                            fontWeight: tab === t.key ? 600 : 500,
                            color: tab === t.key ? "#0f172a" : "#64748b",
                            background: tab === t.key ? "#fff" : "transparent",
                            boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                            border: "none",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {t.icon} {t.label}
                        {t.key === "milestones" && milestones.length > 0 && (
                            <span
                                style={{
                                    marginLeft: 6,
                                    background: "#e2e8f0",
                                    padding: "1px 6px",
                                    borderRadius: 999,
                                    fontSize: "0.6875rem",
                                    fontWeight: 700,
                                    color: "#475569",
                                }}
                            >
                                {milestones.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Tab content ── */}

            {tab === "overview" && (
                <OverviewTab contract={contract} milestones={milestones} acceptedMs={acceptedMs} />
            )}

            {tab === "milestones" && (
                <MilestoneList
                    milestones={milestones}
                    isClient={isClient ?? false}
                    token={token ?? ""}
                    actionLoading={actionLoading}
                    onMilestoneAction={milestoneAction}
                    onAddMilestone={addMilestone}
                />
            )}

            {tab === "deliverables" && (
                <DeliverablesList milestones={milestones} token={token ?? ""} />
            )}

            {tab === "disputes" && (
                <DisputesPanel contractId={id} token={token ?? ""} />
            )}

            {tab === "chat" && (
                <ContractChat
                    contractId={id}
                    contractTitle={contract.title}
                    token={token ?? ""}
                    userId={userId}
                />
            )}
        </div>
    );
}

/* ── Overview sub-component (kept local — small enough) ── */
function OverviewTab({
    contract,
    milestones,
    acceptedMs,
}: {
    contract: Contract;
    milestones: Milestone[];
    acceptedMs: number;
}) {
    const infoItems: [string, string][] = [
        ["Type", contract.contract_type === "hourly" ? "Hourly" : "Fixed Price"],
        ["Total Amount", formatMoney(contract.total_amount, contract.currency)],
        ...(contract.hourly_rate
            ? ([["Hourly Rate", formatMoney(contract.hourly_rate, contract.currency) + "/hr"]] as [string, string][])
            : []),
        ...(contract.weekly_hour_limit
            ? ([["Weekly Limit", `${contract.weekly_hour_limit} hours`]] as [string, string][])
            : []),
        ["Currency", contract.currency],
        ["Platform Fee", `${contract.platform_fee_percent}%`],
        ["Started", formatDate(contract.started_at)],
        ...(contract.completed_at ? ([["Completed", formatDate(contract.completed_at)]] as [string, string][]) : []),
        ...(contract.cancelled_at ? ([["Cancelled", formatDate(contract.cancelled_at)]] as [string, string][]) : []),
        ["Created", formatDate(contract.created_at)],
    ];

    return (
        <div>
            {/* Info grid */}
            <div style={styles.card}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
                    Contract Details
                </h3>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: "1rem",
                    }}
                >
                    {infoItems.map(([label, value], i) => (
                        <div key={i}>
                            <div
                                style={{
                                    fontSize: "0.6875rem",
                                    fontWeight: 600,
                                    color: "#94a3b8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }}
                            >
                                {label}
                            </div>
                            <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#0f172a", marginTop: 2 }}>
                                {value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Description */}
            {contract.description && (
                <div style={styles.card}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
                        Terms & Description
                    </h3>
                    <div
                        style={{ fontSize: "0.875rem", color: "#475569", lineHeight: 1.7, margin: 0 }}
                        dangerouslySetInnerHTML={{ __html: contract.description }}
                    />
                </div>
            )}

            {/* Cancellation reason */}
            {contract.cancellation_reason && (
                <div style={{ ...styles.card, borderColor: "#fecaca", background: "#fef2f2" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#dc2626", marginBottom: "0.5rem" }}>
                        Cancellation Reason
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "#7f1d1d", margin: 0 }}>
                        {contract.cancellation_reason}
                    </p>
                </div>
            )}

            {/* Milestone progress */}
            {milestones.length > 0 && (
                <div style={styles.card}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.75rem" }}>
                        Milestone Progress
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                            style={{
                                flex: 1,
                                height: 8,
                                background: "#e2e8f0",
                                borderRadius: 999,
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    height: "100%",
                                    width: `${milestones.length > 0 ? (acceptedMs / milestones.length) * 100 : 0}%`,
                                    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                                    borderRadius: 999,
                                    transition: "width 0.4s",
                                }}
                            />
                        </div>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#475569" }}>
                            {acceptedMs}/{milestones.length}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
