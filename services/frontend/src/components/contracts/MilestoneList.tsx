"use client";

import { useState, useCallback } from "react";
import {
    Milestone,
    Deliverable,
    MILESTONE_STATUS,
    formatDate,
    formatMoney,
    styles,
    API,
    FILE_HOST,
} from "./types";

interface Props {
    milestones: Milestone[];
    isClient: boolean;
    token: string;
    actionLoading: string | null;
    onMilestoneAction: (msId: string, action: string, body?: object) => Promise<void>;
    onAddMilestone: (data: { title: string; description: string; amount: string; due_date: string }) => Promise<void>;
}

export default function MilestoneList({
    milestones,
    isClient,
    token,
    actionLoading,
    onMilestoneAction,
    onAddMilestone,
}: Props) {
    const [expandedMs, setExpandedMs] = useState<string | null>(null);
    const [deliverables, setDeliverables] = useState<Record<string, Deliverable[]>>({});
    const [showAddForm, setShowAddForm] = useState(false);
    const [form, setForm] = useState({ title: "", description: "", amount: "", due_date: "" });

    const fetchDeliverables = useCallback(
        async (msId: string) => {
            if (!token || deliverables[msId]) return;
            try {
                const r = await fetch(`${API}/milestones/${msId}/deliverables`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const j = await r.json();
                setDeliverables((prev) => ({ ...prev, [msId]: j.data ?? [] }));
            } catch {
                /* ignore */
            }
        },
        [token, deliverables]
    );

    function toggleExpand(msId: string) {
        if (expandedMs === msId) {
            setExpandedMs(null);
        } else {
            setExpandedMs(msId);
            fetchDeliverables(msId);
        }
    }

    async function handleAdd() {
        if (!form.title || !form.amount) return;
        await onAddMilestone(form);
        setForm({ title: "", description: "", amount: "", due_date: "" });
        setShowAddForm(false);
    }

    return (
        <div>
            {/* Add milestone (client only) */}
            {isClient && (
                <div style={{ marginBottom: "1rem" }}>
                    {!showAddForm ? (
                        <button style={styles.btnPrimary} onClick={() => setShowAddForm(true)}>
                            + Add Milestone
                        </button>
                    ) : (
                        <div style={styles.card}>
                            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                                New Milestone
                            </h3>
                            <div style={{ display: "grid", gap: "0.75rem" }}>
                                <div>
                                    <label style={styles.label}>Title</label>
                                    <input
                                        style={styles.input}
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        placeholder="Milestone title"
                                    />
                                </div>
                                <div>
                                    <label style={styles.label}>Description</label>
                                    <textarea
                                        style={{ ...styles.input, minHeight: 60 }}
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Optional description"
                                    />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                                    <div>
                                        <label style={styles.label}>Amount ($)</label>
                                        <input
                                            type="number"
                                            style={styles.input}
                                            value={form.amount}
                                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Due Date</label>
                                        <input
                                            type="date"
                                            style={styles.input}
                                            value={form.due_date}
                                            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button
                                        style={styles.btnPrimary}
                                        disabled={actionLoading === "add-ms"}
                                        onClick={handleAdd}
                                    >
                                        Save Milestone
                                    </button>
                                    <button style={styles.btnOutline} onClick={() => setShowAddForm(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty */}
            {milestones.length === 0 && (
                <div style={{ ...styles.card, textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                    <div style={{ fontSize: "2rem" }}>🎯</div>
                    <p>No milestones yet</p>
                </div>
            )}

            {/* Milestone cards */}
            {milestones.map((m) => {
                const mst = MILESTONE_STATUS[m.status] ?? MILESTONE_STATUS.pending;
                const isExpanded = expandedMs === m.id;
                const dls = deliverables[m.id] ?? [];

                return (
                    <div key={m.id} style={{ ...styles.card, borderLeft: `4px solid ${mst.fg}` }}>
                        {/* Collapsed header */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                gap: "1rem",
                                cursor: "pointer",
                            }}
                            onClick={() => toggleExpand(m.id)}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                    <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                        {m.title}
                                    </h4>
                                    <span
                                        style={{
                                            padding: "0.125rem 0.5rem",
                                            borderRadius: 999,
                                            fontSize: "0.6875rem",
                                            fontWeight: 600,
                                            background: mst.bg,
                                            color: mst.fg,
                                        }}
                                    >
                                        {mst.label}
                                    </span>
                                    {m.escrow_funded && !m.escrow_released && (
                                        <span
                                            style={{
                                                fontSize: "0.6875rem",
                                                background: "#dbeafe",
                                                color: "#1d4ed8",
                                                padding: "0.125rem 0.5rem",
                                                borderRadius: 999,
                                                fontWeight: 600,
                                            }}
                                        >
                                            💰 Funded
                                        </span>
                                    )}
                                    {m.escrow_released && (
                                        <span
                                            style={{
                                                fontSize: "0.6875rem",
                                                background: "#dcfce7",
                                                color: "#15803d",
                                                padding: "0.125rem 0.5rem",
                                                borderRadius: 999,
                                                fontWeight: 600,
                                            }}
                                        >
                                            ✅ Released
                                        </span>
                                    )}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "1rem",
                                        fontSize: "0.8125rem",
                                        color: "#64748b",
                                        marginTop: "0.25rem",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <span style={{ fontWeight: 600, color: "#0f172a" }}>
                                        {formatMoney(m.amount, m.currency)}
                                    </span>
                                    {m.due_date && <span>📅 Due {formatDate(m.due_date)}</span>}
                                    {m.revision_count > 0 && (
                                        <span>
                                            🔄 {m.revision_count} revision{m.revision_count > 1 ? "s" : ""}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span
                                style={{
                                    color: "#94a3b8",
                                    fontSize: "1rem",
                                    transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                                    transition: "transform 0.2s",
                                }}
                            >
                                ▼
                            </span>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
                                {m.description && (
                                    <p style={{ fontSize: "0.875rem", color: "#475569", margin: "0 0 0.75rem" }}>
                                        {m.description}
                                    </p>
                                )}

                                {m.client_feedback && (
                                    <div
                                        style={{
                                            background: "#fef3c7",
                                            borderRadius: 8,
                                            padding: "0.75rem",
                                            fontSize: "0.8125rem",
                                            color: "#92400e",
                                            marginBottom: "0.75rem",
                                        }}
                                    >
                                        💬 Client feedback: {m.client_feedback}
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                                    {isClient && m.status === "pending" && (
                                        <button
                                            style={styles.btnPrimary}
                                            disabled={!!actionLoading}
                                            onClick={() => onMilestoneAction(m.id, "fund")}
                                        >
                                            💰 Fund Escrow
                                        </button>
                                    )}
                                    {!isClient && ["in_progress", "revision_requested"].includes(m.status) && (
                                        <button
                                            style={styles.btnPrimary}
                                            disabled={!!actionLoading}
                                            onClick={() => onMilestoneAction(m.id, "submit")}
                                        >
                                            📤 Submit Work
                                        </button>
                                    )}
                                    {isClient && m.status === "submitted" && (
                                        <>
                                            <button
                                                style={styles.btnSuccess}
                                                disabled={!!actionLoading}
                                                onClick={() => onMilestoneAction(m.id, "accept")}
                                            >
                                                ✅ Accept
                                            </button>
                                            <button
                                                style={styles.btnOutline}
                                                disabled={!!actionLoading}
                                                onClick={() => onMilestoneAction(m.id, "request-revision")}
                                            >
                                                🔄 Request Revision
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Deliverables */}
                                {dls.length > 0 && (
                                    <div>
                                        <h5
                                            style={{
                                                fontSize: "0.8125rem",
                                                fontWeight: 600,
                                                color: "#64748b",
                                                marginBottom: "0.5rem",
                                            }}
                                        >
                                            📁 Deliverables
                                        </h5>
                                        {dls.map((d) => (
                                            <div
                                                key={d.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                    padding: "0.375rem 0",
                                                    fontSize: "0.8125rem",
                                                }}
                                            >
                                                <span>📎</span>
                                                <a
                                                    href={`${FILE_HOST}${d.file_url ?? d.url ?? ""}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ color: "#6366f1", textDecoration: "none", fontWeight: 500 }}
                                                >
                                                    {d.file_name ?? d.filename ?? "file"}
                                                </a>
                                                <span style={{ color: "#94a3b8" }}>v{d.version}</span>
                                                {d.uploader_name && (
                                                    <span style={{ color: "#94a3b8" }}>by {d.uploader_name}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
