"use client";

import { useState } from "react";
import { Contract, Milestone, CONTRACT_STATUS, formatDate, formatMoney, styles, API } from "./types";

interface Props {
    contract: Contract;
    isClient: boolean;
    milestones: Milestone[];
    acceptedCount: number;
    totalMilestones: number;
    actionLoading: string | null;
    onComplete: (reviewData?: { rating: number; communication_rating: number; quality_rating: number; timeliness_rating: number; comment: string }) => void;
    onCancel: () => void;
    onContractUpdated?: (c: Contract) => void;
}

/* ── Inline interactive star rating ── */
function InlineStar({ value, onChange, size = 24 }: { value: number; onChange: (v: number) => void; size?: number }) {
    const [hover, setHover] = useState(0);
    return (
        <span style={{ display: "inline-flex", gap: 2, cursor: "pointer" }}>
            {[1, 2, 3, 4, 5].map((s) => (
                <svg
                    key={s} width={size} height={size} viewBox="0 0 20 20"
                    fill={(hover || value) >= s ? "#f59e0b" : "#e5e7eb"}
                    onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
                    onClick={() => onChange(s)}
                    style={{ transition: "transform 0.15s", transform: hover === s ? "scale(1.15)" : "scale(1)" }}
                >
                    <path d="M10 1l2.39 4.84L17.82 7l-3.91 3.81.92 5.38L10 13.47l-4.83 2.72.92-5.38L2.18 7l5.43-.79z" />
                </svg>
            ))}
        </span>
    );
}

export default function ContractHeader({
    contract,
    isClient,
    milestones,
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

    /* ── Complete contract modal ── */
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [commRating, setCommRating] = useState(0);
    const [qualRating, setQualRating] = useState(0);
    const [timeRating, setTimeRating] = useState(0);
    const [comment, setComment] = useState("");

    // Calculate unfunded milestones
    const unfundedMs = milestones.filter((m) => !m.escrow_funded && m.status !== "accepted");
    const unfundedTotal = unfundedMs.reduce((s, m) => s + parseFloat(m.amount || "0"), 0);

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

    function handleConfirmComplete() {
        const reviewData = rating > 0 ? {
            rating,
            communication_rating: commRating || rating,
            quality_rating: qualRating || rating,
            timeliness_rating: timeRating || rating,
            comment,
        } : undefined;
        setShowCompleteModal(false);
        setRating(0); setCommRating(0); setQualRating(0); setTimeRating(0); setComment("");
        onComplete(reviewData);
    }

    return (
        <>
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
                                onClick={() => setShowCompleteModal(true)}
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

            {/* ── Complete Contract Modal ── */}
            {showCompleteModal && (
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 1000,
                        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    onClick={() => setShowCompleteModal(false)}
                >
                    <div
                        style={{
                            background: "#fff", borderRadius: 16, padding: "28px 24px",
                            maxWidth: 480, width: "90%", maxHeight: "90vh", overflowY: "auto",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{ textAlign: "center", marginBottom: 20 }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: "50%",
                                background: "#f0fdf4", display: "flex", alignItems: "center",
                                justifyContent: "center", margin: "0 auto 12px", fontSize: 28,
                            }}>✅</div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
                                Complete Contract
                            </h3>
                            <p style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>
                                {contract.title}
                            </p>
                        </div>

                        {/* Pending charges warning */}
                        {unfundedMs.length > 0 && (
                            <div style={{
                                padding: "12px 14px", borderRadius: 10, background: "#fffbeb",
                                border: "1px solid #fde68a", marginBottom: 16,
                            }}>
                                <div style={{ fontWeight: 600, fontSize: 14, color: "#92400e", marginBottom: 6 }}>
                                    ⚠️ Pending charges
                                </div>
                                <p style={{ fontSize: 13, color: "#92400e", margin: "0 0 8px", lineHeight: 1.5 }}>
                                    The following milestones have not been funded yet. Completing the contract will charge your payment method:
                                </p>
                                {unfundedMs.map((m) => (
                                    <div key={m.id} style={{
                                        display: "flex", justifyContent: "space-between",
                                        fontSize: 13, color: "#78350f", padding: "3px 0",
                                    }}>
                                        <span>{m.title}</span>
                                        <span style={{ fontWeight: 600 }}>
                                            {formatMoney(m.amount, m.currency)}
                                        </span>
                                    </div>
                                ))}
                                <div style={{
                                    borderTop: "1px solid #fde68a", marginTop: 6, paddingTop: 6,
                                    display: "flex", justifyContent: "space-between",
                                    fontWeight: 700, fontSize: 14, color: "#78350f",
                                }}>
                                    <span>Total pending</span>
                                    <span>{formatMoney(unfundedTotal, contract.currency)}</span>
                                </div>
                            </div>
                        )}

                        {/* Contract summary */}
                        <div style={{
                            background: "#f8fafc", borderRadius: 10, padding: 16,
                            marginBottom: 16, border: "1px solid #e2e8f0",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <span style={{ fontSize: 14, color: "#64748b" }}>Contract total</span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                                    {formatMoney(contract.total_amount, contract.currency)}
                                </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <span style={{ fontSize: 14, color: "#64748b" }}>Milestones completed</span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                                    {acceptedCount}/{totalMilestones}
                                </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 14, color: "#64748b" }}>Freelancer</span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                                    {contract.freelancer_name ?? "—"}
                                </span>
                            </div>
                        </div>

                        {/* Review section */}
                        <div style={{
                            background: "#fefce8", borderRadius: 10, padding: 16,
                            marginBottom: 16, border: "1px solid #fef08a",
                        }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: "#854d0e", marginBottom: 10 }}>
                                ⭐ Rate the freelancer (optional)
                            </div>

                            <div style={{ marginBottom: 10 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#92400e", display: "block", marginBottom: 4 }}>
                                    Overall Rating
                                </label>
                                <InlineStar value={rating} onChange={setRating} size={28} />
                            </div>

                            {rating > 0 && (
                                <>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 600, color: "#a16207", display: "block", marginBottom: 4 }}>
                                                💬 Communication
                                            </label>
                                            <InlineStar value={commRating} onChange={setCommRating} size={20} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 600, color: "#a16207", display: "block", marginBottom: 4 }}>
                                                ✨ Quality
                                            </label>
                                            <InlineStar value={qualRating} onChange={setQualRating} size={20} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 600, color: "#a16207", display: "block", marginBottom: 4 }}>
                                                ⏱️ Timeliness
                                            </label>
                                            <InlineStar value={timeRating} onChange={setTimeRating} size={20} />
                                        </div>
                                    </div>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Share your experience working with this freelancer..."
                                        style={{
                                            width: "100%", padding: "10px 14px", borderRadius: 8,
                                            border: "1px solid #fde68a", fontSize: 14, background: "#fffef5",
                                            outline: "none", boxSizing: "border-box", minHeight: 60, resize: "vertical",
                                        }}
                                    />
                                </>
                            )}
                        </div>

                        {/* Confirm info */}
                        <div style={{
                            padding: "10px 14px", borderRadius: 8, background: "#f0fdf4",
                            color: "#166534", fontSize: 13, marginBottom: 16, lineHeight: 1.5,
                        }}>
                            ✅ Completing this contract will release all remaining escrow funds to the freelancer. This action cannot be undone.
                        </div>

                        {/* Buttons */}
                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                onClick={() => setShowCompleteModal(false)}
                                disabled={!!actionLoading}
                                style={{
                                    flex: 1, padding: "11px 20px", borderRadius: 10,
                                    border: "1px solid #e5e7eb", background: "#fff",
                                    fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#374151",
                                }}
                            >Cancel</button>
                            <button
                                onClick={handleConfirmComplete}
                                disabled={!!actionLoading}
                                style={{
                                    flex: 1, padding: "11px 20px", borderRadius: 10,
                                    border: "none", color: "#fff", fontSize: 14, fontWeight: 600,
                                    cursor: actionLoading ? "not-allowed" : "pointer",
                                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                }}
                            >
                                {actionLoading ? "Processing..." : "✅ Complete Contract"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
