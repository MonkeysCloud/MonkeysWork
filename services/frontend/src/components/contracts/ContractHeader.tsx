"use client";

import { useState } from "react";
import { Contract, CONTRACT_STATUS, formatDate, formatMoney, styles, API } from "./types";

interface Props {
    contract: Contract;
    isClient: boolean;
    acceptedCount: number;
    totalMilestones: number;
    actionLoading: string | null;
    onComplete: () => void;
    onCancel: () => void;
    onContractUpdated?: (c: Contract) => void;
}

export default function ContractHeader({
    contract,
    isClient,
    acceptedCount,
    totalMilestones,
    actionLoading,
    onComplete,
    onCancel,
    onContractUpdated,
}: Props) {
    const st = CONTRACT_STATUS[contract.status] ?? CONTRACT_STATUS.active;
    const counterparty = isClient ? contract.freelancer_name : contract.client_name;
    const counterpartyLabel = isClient ? "Freelancer" : "Client";

    /* ── Weekly hour limit inline editing ─── */
    const [editing, setEditing] = useState(false);
    const [limitVal, setLimitVal] = useState(
        contract.weekly_hour_limit != null ? String(contract.weekly_hour_limit) : ""
    );
    const [saving, setSaving] = useState(false);

    const saveLimit = async () => {
        setSaving(true);
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
            const res = await fetch(`${API}/contracts/${contract.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    weekly_hour_limit: limitVal ? Number(limitVal) : null,
                }),
            });
            if (res.ok) {
                const json = await res.json();
                onContractUpdated?.(json.data);
            }
        } catch {
            /* silent */
        } finally {
            setSaving(false);
            setEditing(false);
        }
    };

    return (
        <div
            style={{
                ...styles.card,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "1rem",
            }}
        >
            <div style={{ flex: 1, minWidth: 200 }}>
                {/* Title + badge */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        {contract.title}
                    </h1>
                    <span
                        style={{
                            padding: "0.2rem 0.625rem",
                            borderRadius: 999,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            background: st.bg,
                            color: st.fg,
                        }}
                    >
                        {st.icon} {st.label}
                    </span>
                </div>

                {/* Subtitle */}
                <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "0.25rem 0" }}>
                    {contract.job_title} · {counterpartyLabel}:{" "}
                    <strong style={{ color: "#334155" }}>{counterparty ?? "—"}</strong>
                </p>

                {/* Meta row */}
                <div
                    style={{
                        display: "flex",
                        gap: "1.5rem",
                        fontSize: "0.8125rem",
                        color: "#64748b",
                        marginTop: "0.5rem",
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <span>
                        💰{" "}
                        <strong style={{ color: "#0f172a" }}>
                            {formatMoney(contract.total_amount, contract.currency)}
                        </strong>
                    </span>
                    <span>{contract.contract_type === "hourly" ? "⏰ Hourly" : "💼 Fixed"}</span>
                    {contract.hourly_rate && (
                        <span>📊 {formatMoney(contract.hourly_rate, contract.currency)}/hr</span>
                    )}
                    <span>📅 Started {formatDate(contract.started_at)}</span>
                    {totalMilestones > 0 && (
                        <span>
                            🎯 {acceptedCount}/{totalMilestones} milestones
                        </span>
                    )}

                    {/* Weekly hour limit (hourly contracts) */}
                    {contract.contract_type === "hourly" && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            ⏱️{" "}
                            {editing ? (
                                <>
                                    <input
                                        type="number"
                                        min="1"
                                        max="168"
                                        value={limitVal}
                                        onChange={(e) => setLimitVal(e.target.value)}
                                        style={{ width: 56, padding: "2px 6px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.8125rem" }}
                                        autoFocus
                                        onKeyDown={(e) => { if (e.key === "Enter") saveLimit(); if (e.key === "Escape") setEditing(false); }}
                                    />
                                    <button
                                        onClick={saveLimit}
                                        disabled={saving}
                                        style={{ border: "none", background: "none", cursor: "pointer", fontSize: "0.8125rem", padding: 0 }}
                                    >
                                        {saving ? "…" : "✓"}
                                    </button>
                                    <button
                                        onClick={() => setEditing(false)}
                                        style={{ border: "none", background: "none", cursor: "pointer", fontSize: "0.8125rem", padding: 0 }}
                                    >
                                        ✕
                                    </button>
                                </>
                            ) : (
                                <>
                                    <strong style={{ color: "#0f172a" }}>
                                        {contract.weekly_hour_limit ? `${contract.weekly_hour_limit} hrs/wk` : "No weekly limit"}
                                    </strong>
                                    {isClient && contract.status === "active" && (
                                        <button
                                            onClick={() => setEditing(true)}
                                            style={{ border: "none", background: "none", cursor: "pointer", fontSize: "0.75rem", padding: "0 2px" }}
                                            title="Edit weekly hour limit"
                                        >
                                            ✏️
                                        </button>
                                    )}
                                </>
                            )}
                        </span>
                    )}
                </div>
            </div>

            {/* Contract actions */}
            {contract.status === "active" && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {isClient && (
                        <button
                            style={styles.btnSuccess}
                            disabled={actionLoading === "complete"}
                            onClick={onComplete}
                        >
                            ✅ Complete
                        </button>
                    )}
                    <button
                        style={styles.btnDanger}
                        disabled={actionLoading === "cancel"}
                        onClick={onCancel}
                    >
                        ❌ Cancel
                    </button>
                </div>
            )}
        </div>
    );
}
