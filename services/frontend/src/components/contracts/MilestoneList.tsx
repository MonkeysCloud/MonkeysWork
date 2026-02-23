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
} from "./types";
import { fileUrl } from "@/lib/fileUrl";

interface Props {
    milestones: Milestone[];
    isClient: boolean;
    token: string;
    contractStatus?: string;
    actionLoading: string | null;
    onMilestoneAction: (msId: string, action: string, body?: object) => Promise<void>;
    onAddMilestone: (data: { title: string; description: string; amount: string; due_date: string }) => Promise<void>;
}

export default function MilestoneList({
    milestones,
    isClient,
    token,
    contractStatus,
    actionLoading,
    onMilestoneAction,
    onAddMilestone,
}: Props) {
    const [expandedMs, setExpandedMs] = useState<string | null>(null);
    const [deliverables, setDeliverables] = useState<Record<string, Deliverable[]>>({});
    const [showAddForm, setShowAddForm] = useState(false);
    const [form, setForm] = useState({ title: "", description: "", amount: "", due_date: "" });

    // Confirm modal state
    const [confirmModal, setConfirmModal] = useState<{
        type: "fund" | "complete" | "revision" | "submit";
        milestone: Milestone;
    } | null>(null);

    // Review fields (for complete modal)
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");

    // Revision feedback (for revision modal)
    const [revisionFeedback, setRevisionFeedback] = useState("");

    // Submit fields (for submit modal)
    const [submitMessage, setSubmitMessage] = useState("");
    const [submitFiles, setSubmitFiles] = useState<File[]>([]);
    const [uploadingFiles, setUploadingFiles] = useState(false);

    // Inline star rating component
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
            {/* Add milestone (client only, active contracts only) */}
            {isClient && (!contractStatus || contractStatus === "active") && (
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
                                            onClick={() => setConfirmModal({ type: "fund", milestone: m })}
                                        >
                                            💰 Fund Escrow
                                        </button>
                                    )}
                                    {isClient && m.status === "in_progress" && (
                                        <button
                                            style={styles.btnSuccess}
                                            disabled={!!actionLoading}
                                            onClick={() => setConfirmModal({ type: "complete", milestone: m })}
                                        >
                                            ✅ Mark Complete
                                        </button>
                                    )}
                                    {!isClient && ["in_progress", "revision_requested"].includes(m.status) && (
                                        <button
                                            style={styles.btnPrimary}
                                            disabled={!!actionLoading}
                                            onClick={() => {
                                                setSubmitMessage("");
                                                setSubmitFiles([]);
                                                setConfirmModal({ type: "submit", milestone: m });
                                            }}
                                        >
                                            📤 Submit Work
                                        </button>
                                    )}
                                    {isClient && m.status === "submitted" && (
                                        <>
                                            <button
                                                style={styles.btnSuccess}
                                                disabled={!!actionLoading}
                                                onClick={() => setConfirmModal({ type: "complete", milestone: m })}
                                            >
                                                ✅ Accept
                                            </button>
                                            <button
                                                style={styles.btnOutline}
                                                disabled={!!actionLoading}
                                                onClick={() => {
                                                    setRevisionFeedback("");
                                                    setConfirmModal({ type: "revision", milestone: m });
                                                }}
                                            >
                                                🔄 Request Revision
                                            </button>
                                        </>
                                    )}
                                    {/* Auto-accept countdown */}
                                    {m.status === "submitted" && m.auto_accept_at && (() => {
                                        const daysLeft = Math.max(0, Math.ceil(
                                            (new Date(m.auto_accept_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                                        ));
                                        return (
                                            <span
                                                style={{
                                                    fontSize: "0.75rem",
                                                    background: daysLeft <= 3 ? "#fef2f2" : "#eff6ff",
                                                    color: daysLeft <= 3 ? "#dc2626" : "#2563eb",
                                                    padding: "0.25rem 0.75rem",
                                                    borderRadius: 999,
                                                    fontWeight: 600,
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    alignSelf: "center",
                                                }}
                                            >
                                                ⏱️ Auto-accepted in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                                            </span>
                                        );
                                    })()}
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
                                                    href={fileUrl(d.file_url ?? d.url ?? "")}
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

            {/* ── Confirmation Modal ── */}
            {confirmModal && (
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 1000,
                        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    onClick={() => setConfirmModal(null)}
                >
                    <div
                        style={{
                            background: "#fff", borderRadius: 16, padding: "28px 24px",
                            maxWidth: 420, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {confirmModal.type === "fund" ? (
                            <>
                                <div style={{ textAlign: "center", marginBottom: 20 }}>
                                    <div style={{
                                        width: 56, height: 56, borderRadius: "50%",
                                        background: "#eff6ff", display: "flex", alignItems: "center",
                                        justifyContent: "center", margin: "0 auto 12px", fontSize: 28,
                                    }}>💰</div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
                                        Fund Escrow
                                    </h3>
                                </div>

                                <div style={{
                                    background: "#f8fafc", borderRadius: 10, padding: 16,
                                    marginBottom: 16, border: "1px solid #e2e8f0",
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <span style={{ fontSize: 14, color: "#64748b" }}>Milestone</span>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                                            {confirmModal.milestone.title}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <span style={{ fontSize: 14, color: "#64748b" }}>Amount</span>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                                            {formatMoney(confirmModal.milestone.amount, confirmModal.milestone.currency)}
                                        </span>
                                    </div>
                                    <div style={{
                                        borderTop: "1px solid #e2e8f0", paddingTop: 8,
                                        display: "flex", justifyContent: "space-between",
                                    }}>
                                        <span style={{ fontSize: 14, color: "#64748b" }}>+ Platform fee</span>
                                        <span style={{ fontSize: 13, color: "#94a3b8" }}>applied at checkout</span>
                                    </div>
                                </div>

                                <div style={{
                                    padding: "10px 14px", borderRadius: 8, background: "#fffbeb",
                                    color: "#92400e", fontSize: 13, marginBottom: 16, lineHeight: 1.5,
                                }}>
                                    ⚠️ This will charge your default payment method. The funds will be held in escrow until the milestone is completed.
                                </div>
                            </>
                        ) : confirmModal.type === "complete" ? (
                            <>
                                <div style={{ textAlign: "center", marginBottom: 20 }}>
                                    <div style={{
                                        width: 56, height: 56, borderRadius: "50%",
                                        background: "#f0fdf4", display: "flex", alignItems: "center",
                                        justifyContent: "center", margin: "0 auto 12px", fontSize: 28,
                                    }}>✅</div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
                                        Complete Milestone
                                    </h3>
                                </div>

                                <div style={{
                                    background: "#f8fafc", borderRadius: 10, padding: 16,
                                    marginBottom: 16, border: "1px solid #e2e8f0",
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <span style={{ fontSize: 14, color: "#64748b" }}>Milestone</span>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                                            {confirmModal.milestone.title}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 14, color: "#64748b" }}>Amount</span>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                                            {formatMoney(confirmModal.milestone.amount, confirmModal.milestone.currency)}
                                        </span>
                                    </div>
                                </div>

                                {/* Star rating */}
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                                        ⭐ Rate this milestone (optional)
                                    </label>
                                    <InlineStar value={reviewRating} onChange={setReviewRating} />
                                </div>

                                {/* Comment */}
                                {reviewRating > 0 && (
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                                            Comment (optional)
                                        </label>
                                        <textarea
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            placeholder="How was the work on this milestone?"
                                            style={{
                                                width: "100%", padding: "10px 14px", borderRadius: 8,
                                                border: "1px solid #e5e7eb", fontSize: 14, background: "#f9fafb",
                                                outline: "none", boxSizing: "border-box", minHeight: 60, resize: "vertical",
                                            }}
                                        />
                                    </div>
                                )}

                                <div style={{
                                    padding: "10px 14px", borderRadius: 8, background: "#f0fdf4",
                                    color: "#166534", fontSize: 13, marginBottom: 16, lineHeight: 1.5,
                                }}>
                                    ✅ Accepting this milestone will release escrow funds to the freelancer. This action cannot be undone.
                                </div>
                            </>
                        ) : confirmModal.type === "revision" ? (
                            <>
                                <div style={{ textAlign: "center", marginBottom: 20 }}>
                                    <div style={{
                                        width: 56, height: 56, borderRadius: "50%",
                                        background: "#fff7ed", display: "flex", alignItems: "center",
                                        justifyContent: "center", margin: "0 auto 12px", fontSize: 28,
                                    }}>🔄</div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
                                        Request Revision
                                    </h3>
                                </div>

                                <div style={{
                                    background: "#f8fafc", borderRadius: 10, padding: 16,
                                    marginBottom: 16, border: "1px solid #e2e8f0",
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <span style={{ fontSize: 14, color: "#64748b" }}>Milestone</span>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                                            {confirmModal.milestone.title}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 14, color: "#64748b" }}>Revision #</span>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                                            {(confirmModal.milestone.revision_count || 0) + 1}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                                        💬 What needs to be changed?
                                    </label>
                                    <textarea
                                        value={revisionFeedback}
                                        onChange={(e) => setRevisionFeedback(e.target.value)}
                                        placeholder="Describe what needs to be revised or improved..."
                                        style={{
                                            width: "100%", padding: "10px 14px", borderRadius: 8,
                                            border: "1px solid #e5e7eb", fontSize: 14, background: "#f9fafb",
                                            outline: "none", boxSizing: "border-box" as const, minHeight: 80, resize: "vertical" as const,
                                        }}
                                    />
                                </div>

                                <div style={{
                                    padding: "10px 14px", borderRadius: 8, background: "#fff7ed",
                                    color: "#92400e", fontSize: 13, marginBottom: 16, lineHeight: 1.5,
                                }}>
                                    ⚠️ The freelancer will be notified and can resubmit their work. The 14-day auto-accept timer will reset.
                                </div>
                            </>
                        ) : confirmModal.type === "submit" ? (
                            <>
                                <div style={{ textAlign: "center", marginBottom: 20 }}>
                                    <div style={{
                                        width: 56, height: 56, borderRadius: "50%",
                                        background: "#eff6ff", display: "flex", alignItems: "center",
                                        justifyContent: "center", margin: "0 auto 12px", fontSize: 28,
                                    }}>📤</div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
                                        Submit Work
                                    </h3>
                                </div>

                                <div style={{
                                    background: "#f8fafc", borderRadius: 10, padding: 16,
                                    marginBottom: 16, border: "1px solid #e2e8f0",
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <span style={{ fontSize: 14, color: "#64748b" }}>Milestone</span>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                                            {confirmModal.milestone.title}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 14, color: "#64748b" }}>Amount</span>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                                            {formatMoney(confirmModal.milestone.amount, confirmModal.milestone.currency)}
                                        </span>
                                    </div>
                                </div>

                                {/* Message */}
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                                        💬 Message to client (optional)
                                    </label>
                                    <textarea
                                        value={submitMessage}
                                        onChange={(e) => setSubmitMessage(e.target.value)}
                                        placeholder="Describe what you've done, any notes for the client..."
                                        style={{
                                            width: "100%", padding: "10px 14px", borderRadius: 8,
                                            border: "1px solid #e5e7eb", fontSize: 14, background: "#f9fafb",
                                            outline: "none", boxSizing: "border-box" as const, minHeight: 80, resize: "vertical" as const,
                                        }}
                                    />
                                </div>

                                {/* File attachment */}
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                                        📎 Attach files (optional)
                                    </label>
                                    <label style={{
                                        display: "block", border: "2px dashed #e5e7eb", borderRadius: 8, padding: "12px 16px",
                                        textAlign: "center", cursor: "pointer", fontSize: 13, color: "#64748b",
                                        transition: "border-color 0.2s",
                                    }}>
                                        <input
                                            type="file"
                                            multiple
                                            style={{ display: "none" }}
                                            onChange={(e) => {
                                                if (e.target.files) setSubmitFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                            }}
                                        />
                                        Click to select files or drag & drop
                                    </label>
                                    {submitFiles.length > 0 && (
                                        <div style={{ marginTop: 8 }}>
                                            {submitFiles.map((f, i) => (
                                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", padding: "4px 0" }}>
                                                    <span>📎</span>
                                                    <span style={{ flex: 1 }}>{f.name}</span>
                                                    <span style={{ color: "#94a3b8" }}>{(f.size / 1024).toFixed(0)} KB</span>
                                                    <button
                                                        type="button"
                                                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14 }}
                                                        onClick={() => setSubmitFiles(prev => prev.filter((_, j) => j !== i))}
                                                    >✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={{
                                    padding: "10px 14px", borderRadius: 8, background: "#eff6ff",
                                    color: "#1e40af", fontSize: 13, marginBottom: 16, lineHeight: 1.5,
                                }}>
                                    📋 Your work will be submitted for client review. They will have 14 days to accept or request revisions.
                                </div>
                            </>
                        ) : null}

                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                onClick={() => setConfirmModal(null)}
                                disabled={!!actionLoading || uploadingFiles}
                                style={{
                                    flex: 1, padding: "11px 20px", borderRadius: 10,
                                    border: "1px solid #e5e7eb", background: "#fff",
                                    fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#374151",
                                }}
                            >Cancel</button>
                            <button
                                onClick={async () => {
                                    const { type, milestone: ms } = confirmModal;
                                    if (type === "submit") {
                                        setUploadingFiles(true);
                                        try {
                                            // Upload files as deliverables
                                            for (const file of submitFiles) {
                                                const fd = new FormData();
                                                fd.append("entity_type", "milestone");
                                                fd.append("entity_id", ms.id);
                                                fd.append("files[]", file);
                                                const upRes = await fetch(`${API}/attachments/upload`, {
                                                    method: "POST",
                                                    headers: { Authorization: `Bearer ${token}` },
                                                    body: fd,
                                                });
                                                if (upRes.ok) {
                                                    const upJson = await upRes.json();
                                                    const uploaded = upJson.data?.[0];
                                                    if (uploaded?.file_url) {
                                                        await fetch(`${API}/milestones/${ms.id}/deliverables`, {
                                                            method: "POST",
                                                            headers: {
                                                                Authorization: `Bearer ${token}`,
                                                                "Content-Type": "application/json",
                                                            },
                                                            body: JSON.stringify({
                                                                file_name: file.name,
                                                                file_url: uploaded.file_url,
                                                                file_size: file.size,
                                                                mime_type: file.type || "application/octet-stream",
                                                                notes: submitMessage || null,
                                                            }),
                                                        });
                                                    }
                                                }
                                            }
                                        } catch (e) {
                                            console.error("File upload error:", e);
                                        }
                                        setUploadingFiles(false);
                                        setConfirmModal(null);
                                        await onMilestoneAction(ms.id, "submit", { message: submitMessage });
                                        setSubmitMessage("");
                                        setSubmitFiles([]);
                                    } else if (type === "revision") {
                                        setConfirmModal(null);
                                        await onMilestoneAction(ms.id, "request-revision", { feedback: revisionFeedback });
                                        setRevisionFeedback("");
                                    } else {
                                        const body = type === "complete" && reviewRating > 0
                                            ? { rating: reviewRating, comment: reviewComment }
                                            : undefined;
                                        setConfirmModal(null);
                                        setReviewRating(0);
                                        setReviewComment("");
                                        await onMilestoneAction(ms.id, type === "fund" ? "fund" : "accept", body);
                                    }
                                }}
                                disabled={!!actionLoading || uploadingFiles}
                                style={{
                                    flex: 1, padding: "11px 20px", borderRadius: 10,
                                    border: "none", color: "#fff", fontSize: 14, fontWeight: 600,
                                    cursor: (actionLoading || uploadingFiles) ? "not-allowed" : "pointer",
                                    background: confirmModal.type === "fund"
                                        ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                                        : confirmModal.type === "revision"
                                            ? "linear-gradient(135deg, #f59e0b, #d97706)"
                                            : confirmModal.type === "submit"
                                                ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                                                : "linear-gradient(135deg, #22c55e, #16a34a)",
                                }}
                            >
                                {(actionLoading || uploadingFiles)
                                    ? (uploadingFiles ? "Uploading files..." : "Processing...")
                                    : confirmModal.type === "fund"
                                        ? "💰 Confirm & Fund"
                                        : confirmModal.type === "revision"
                                            ? "🔄 Send Revision Request"
                                            : confirmModal.type === "submit"
                                                ? "📤 Submit for Review"
                                                : "✅ Confirm & Release"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
