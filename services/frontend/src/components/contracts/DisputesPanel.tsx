"use client";

import { useState, useCallback, useEffect } from "react";
import {
    Dispute,
    DisputeMsg,
    Milestone,
    DISPUTE_REASONS,
    DISPUTE_STATUS,
    formatDate,
    formatMoney,
    styles,
    API,
    FILE_HOST,
} from "./types";

interface Props {
    contractId: string;
    token: string;
    contractType?: "fixed" | "hourly";
    contractAmount?: string;
    contractCurrency?: string;
    milestones?: Milestone[];
    isClient?: boolean;
}

export default function DisputesPanel({
    contractId,
    token,
    contractType = "fixed",
    contractAmount = "0",
    contractCurrency = "USD",
    milestones = [],
    isClient = false,
}: Props) {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [form, setForm] = useState({
        reason: "quality",
        description: "",
        milestone_id: "",
        dispute_type: contractType === "hourly" ? "time" : "amount" as "amount" | "time",
        refund_type: "partial" as "full" | "partial",
        dispute_amount: "",
        disputed_hours: "",
        hourly_rate: "",
    });

    // Attachments
    const [attachments, setAttachments] = useState<{ url: string; name: string }[]>([]);
    const [uploading, setUploading] = useState(false);

    // Message thread
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [msgs, setMsgs] = useState<DisputeMsg[]>([]);
    const [msgInput, setMsgInput] = useState("");
    const [msgAttachments, setMsgAttachments] = useState<{ url: string; name: string }[]>([]);

    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const fetchDisputes = useCallback(async () => {
        try {
            const r = await fetch(`${API}/contracts/${contractId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const j = await r.json();
            if (j.data?.disputes) {
                setDisputes(j.data.disputes);
            }
        } catch {
            /* ignore */
        }
    }, [contractId, token]);

    useEffect(() => {
        fetchDisputes();
    }, [fetchDisputes]);

    // ── Upload files ──
    async function uploadFiles(files: FileList): Promise<{ url: string; name: string }[]> {
        const fd = new FormData();
        for (let i = 0; i < files.length; i++) fd.append("files[]", files[i]);
        fd.append("entity_type", "dispute");
        fd.append("entity_id", contractId);

        const res = await fetch(`${API}/attachments/upload`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
        });
        const json = await res.json();
        return (json.data ?? []).map((f: { url: string; file_name: string }) => ({
            url: f.url,
            name: f.file_name,
        }));
    }

    async function handleAttachFiles(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.length) return;
        setUploading(true);
        try {
            const uploaded = await uploadFiles(e.target.files);
            setAttachments((prev) => [...prev, ...uploaded]);
        } catch {
            /* ignore */
        }
        setUploading(false);
        e.target.value = "";
    }

    async function handleMsgAttach(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.length) return;
        setUploading(true);
        try {
            const uploaded = await uploadFiles(e.target.files);
            setMsgAttachments((prev) => [...prev, ...uploaded]);
        } catch {
            /* ignore */
        }
        setUploading(false);
        e.target.value = "";
    }

    // ── Calculate disputed amount ──
    function getDisputeAmount(): string | null {
        if (form.refund_type === "full") {
            if (form.milestone_id && contractType === "fixed") {
                const ms = milestones.find((m) => m.id === form.milestone_id);
                return ms ? ms.amount : contractAmount;
            }
            return contractAmount;
        }
        if (form.dispute_type === "time" && form.disputed_hours && form.hourly_rate) {
            return String(parseFloat(form.disputed_hours) * parseFloat(form.hourly_rate));
        }
        return form.dispute_amount || null;
    }

    // ── Open dispute ──
    async function openDispute() {
        if (!form.description.trim()) return;
        setSubmitting(true);
        try {
            const disputeAmount = getDisputeAmount();
            await fetch(`${API}/disputes`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    contract_id: contractId,
                    reason: form.reason,
                    description: form.description,
                    milestone_id: form.milestone_id || null,
                    dispute_amount: disputeAmount,
                    evidence_urls: attachments,
                }),
            });
            setShowForm(false);
            setForm({
                reason: "quality", description: "", milestone_id: "",
                dispute_type: contractType === "hourly" ? "time" : "amount",
                refund_type: "partial", dispute_amount: "",
                disputed_hours: "", hourly_rate: "",
            });
            setAttachments([]);
            await fetchDisputes();
        } catch {
            /* ignore */
        }
        setSubmitting(false);
    }

    // ── Messages ──
    async function openThread(dId: string) {
        setSelectedId(dId);
        try {
            const r = await fetch(`${API}/disputes/${dId}/messages`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const j = await r.json();
            setMsgs(j.data ?? []);
        } catch {
            setMsgs([]);
        }
    }

    async function sendMsg() {
        if (!msgInput.trim() || !selectedId) return;
        await fetch(`${API}/disputes/${selectedId}/messages`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                body: msgInput,
                attachments: msgAttachments.length > 0 ? msgAttachments : undefined,
            }),
        });
        setMsgInput("");
        setMsgAttachments([]);
        await openThread(selectedId);
    }

    return (
        <div>
            {/* Open dispute button / form */}
            <div style={{ marginBottom: "1rem" }}>
                {!showForm ? (
                    <button style={styles.btnDanger} onClick={() => setShowForm(true)}>
                        ⚠️ Open Dispute
                    </button>
                ) : (
                    <div style={styles.card}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                            Open a Dispute
                        </h3>
                        <div style={{ display: "grid", gap: "0.75rem" }}>
                            {/* Reason */}
                            <div>
                                <label style={styles.label}>Reason</label>
                                <select
                                    style={styles.input}
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                >
                                    {DISPUTE_REASONS.map((r) => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Milestone selector (fixed contracts) */}
                            {contractType === "fixed" && milestones.length > 0 && (
                                <div>
                                    <label style={styles.label}>Related Milestone (optional)</label>
                                    <select
                                        style={styles.input}
                                        value={form.milestone_id}
                                        onChange={(e) => setForm({ ...form, milestone_id: e.target.value })}
                                    >
                                        <option value="">— Entire contract —</option>
                                        {milestones.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.title} ({formatMoney(m.amount, m.currency)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Dispute type for hourly contracts */}
                            {contractType === "hourly" && (
                                <div>
                                    <label style={styles.label}>Dispute type</label>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        {(["time", "amount"] as const).map((t) => (
                                            <label
                                                key={t}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: 6,
                                                    padding: "8px 14px", borderRadius: 8,
                                                    border: `2px solid ${form.dispute_type === t ? "#6366f1" : "#e2e8f0"}`,
                                                    background: form.dispute_type === t ? "#eef2ff" : "#fff",
                                                    cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600,
                                                }}
                                            >
                                                <input
                                                    type="radio" name="dispute_type" value={t}
                                                    checked={form.dispute_type === t}
                                                    onChange={() => setForm({ ...form, dispute_type: t })}
                                                    style={{ display: "none" }}
                                                />
                                                {t === "time" ? "⏱️ Disputed Time" : "💰 Disputed Amount"}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Partial vs Full refund */}
                            <div>
                                <label style={styles.label}>Refund request</label>
                                <div style={{ display: "flex", gap: 8 }}>
                                    {(["partial", "full"] as const).map((t) => (
                                        <label
                                            key={t}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 6,
                                                padding: "8px 14px", borderRadius: 8,
                                                border: `2px solid ${form.refund_type === t ? "#6366f1" : "#e2e8f0"}`,
                                                background: form.refund_type === t ? "#eef2ff" : "#fff",
                                                cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600,
                                            }}
                                        >
                                            <input
                                                type="radio" name="refund_type" value={t}
                                                checked={form.refund_type === t}
                                                onChange={() => setForm({ ...form, refund_type: t })}
                                                style={{ display: "none" }}
                                            />
                                            {t === "partial" ? "📊 Partial Refund" : "💯 Full Refund"}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Amount input (partial refund) */}
                            {form.refund_type === "partial" && (
                                <>
                                    {contractType === "hourly" && form.dispute_type === "time" ? (
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                            <div>
                                                <label style={styles.label}>Disputed Hours</label>
                                                <input
                                                    type="number" min="0" step="0.5"
                                                    style={styles.input}
                                                    value={form.disputed_hours}
                                                    onChange={(e) => setForm({ ...form, disputed_hours: e.target.value })}
                                                    placeholder="e.g. 8"
                                                />
                                            </div>
                                            <div>
                                                <label style={styles.label}>Hourly Rate ({contractCurrency})</label>
                                                <input
                                                    type="number" min="0" step="0.01"
                                                    style={styles.input}
                                                    value={form.hourly_rate}
                                                    onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
                                                    placeholder="e.g. 50.00"
                                                />
                                            </div>
                                            {form.disputed_hours && form.hourly_rate && (
                                                <div style={{ gridColumn: "1 / -1", fontSize: "0.8125rem", color: "#6366f1", fontWeight: 600 }}>
                                                    Disputed amount: {formatMoney(
                                                        parseFloat(form.disputed_hours) * parseFloat(form.hourly_rate),
                                                        contractCurrency
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <label style={styles.label}>Disputed Amount ({contractCurrency})</label>
                                            <input
                                                type="number" min="0" step="0.01"
                                                style={styles.input}
                                                value={form.dispute_amount}
                                                onChange={(e) => setForm({ ...form, dispute_amount: e.target.value })}
                                                placeholder="Enter amount you are disputing"
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Full refund info */}
                            {form.refund_type === "full" && (
                                <div style={{
                                    padding: "10px 14px", borderRadius: 8, background: "#fef2f2",
                                    color: "#991b1b", fontSize: 13, lineHeight: 1.5,
                                }}>
                                    🔴 You are requesting a <strong>full refund</strong> of{" "}
                                    {form.milestone_id && contractType === "fixed"
                                        ? formatMoney(
                                            milestones.find((m) => m.id === form.milestone_id)?.amount ?? "0",
                                            contractCurrency
                                        )
                                        : formatMoney(contractAmount, contractCurrency)
                                    }.
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <label style={styles.label}>Description</label>
                                <textarea
                                    style={{ ...styles.input, minHeight: 80 }}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Describe the issue in detail…"
                                />
                            </div>

                            {/* Attachments */}
                            <div>
                                <label style={styles.label}>Evidence / Attachments</label>
                                <div style={{
                                    border: "2px dashed #e2e8f0", borderRadius: 10, padding: "16px",
                                    textAlign: "center", background: "#f8fafc",
                                }}>
                                    <label style={{
                                        cursor: uploading ? "wait" : "pointer",
                                        color: "#6366f1", fontWeight: 600, fontSize: "0.8125rem",
                                    }}>
                                        {uploading ? "⏳ Uploading..." : "📎 Click to attach files"}
                                        <input
                                            type="file" multiple
                                            style={{ display: "none" }}
                                            onChange={handleAttachFiles}
                                            disabled={uploading}
                                        />
                                    </label>
                                    <div style={{ fontSize: "0.6875rem", color: "#94a3b8", marginTop: 4 }}>
                                        Screenshots, documents, invoices, etc.
                                    </div>
                                </div>
                                {attachments.length > 0 && (
                                    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                                        {attachments.map((a, i) => (
                                            <span key={i} style={{
                                                display: "inline-flex", alignItems: "center", gap: 4,
                                                padding: "4px 10px", borderRadius: 6, background: "#eef2ff",
                                                fontSize: "0.75rem", fontWeight: 500, color: "#4338ca",
                                            }}>
                                                📄 {a.name}
                                                <button
                                                    onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}
                                                    style={{
                                                        border: "none", background: "none", cursor: "pointer",
                                                        fontSize: "0.75rem", color: "#dc2626", padding: 0,
                                                    }}
                                                >✕</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                    style={{
                                        ...styles.btnDanger,
                                        opacity: submitting || !form.description.trim() ? 0.5 : 1,
                                    }}
                                    disabled={submitting || !form.description.trim()}
                                    onClick={openDispute}
                                >
                                    {submitting ? "⏳ Submitting..." : "⚠️ Submit Dispute"}
                                </button>
                                <button style={styles.btnOutline} onClick={() => {
                                    setShowForm(false);
                                    setAttachments([]);
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Empty state */}
            {disputes.length === 0 && !showForm && (
                <div style={{ ...styles.card, textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                    <div style={{ fontSize: "2rem" }}>✅</div>
                    <p>No disputes — great!</p>
                </div>
            )}

            {/* Dispute list */}
            {disputes.map((d) => {
                const ds = DISPUTE_STATUS[d.status] ?? DISPUTE_STATUS.open;
                return (
                    <div
                        key={d.id}
                        style={{
                            ...styles.card,
                            cursor: "pointer",
                            borderLeft: `4px solid ${ds.fg}`,
                        }}
                        onClick={() => openThread(d.id)}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h4 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700 }}>
                                {DISPUTE_REASONS.find((r) => r.value === d.reason)?.label ?? d.reason}
                            </h4>
                            <span
                                style={{
                                    fontSize: "0.75rem",
                                    padding: "0.125rem 0.5rem",
                                    borderRadius: 999,
                                    background: ds.bg,
                                    color: ds.fg,
                                    fontWeight: 600,
                                }}
                            >
                                {ds.icon} {ds.label}
                            </span>
                        </div>
                        <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "0.25rem 0 0" }}>
                            {d.description?.slice(0, 120)}
                            {(d.description?.length ?? 0) > 120 ? "…" : ""}
                        </p>
                        {d.resolution_amount && (
                            <div style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 600, marginTop: 4 }}>
                                💰 Disputed: {formatMoney(d.resolution_amount, d.currency ?? contractCurrency)}
                            </div>
                        )}
                        {d.evidence_urls && (d.evidence_urls as { url: string; name: string }[]).length > 0 && (
                            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>
                                📎 {(d.evidence_urls as { url: string; name: string }[]).length} attachment(s)
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Message thread */}
            {selectedId && (
                <div style={{ ...styles.card, marginTop: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, margin: 0 }}>
                            Dispute Messages
                        </h4>
                        <button
                            onClick={() => setSelectedId(null)}
                            style={{
                                border: "none", background: "none", cursor: "pointer",
                                fontSize: "0.75rem", color: "#94a3b8",
                            }}
                        >✕ Close</button>
                    </div>
                    <div style={{ maxHeight: 400, overflowY: "auto", marginBottom: "0.75rem" }}>
                        {msgs.length === 0 && (
                            <p style={{ color: "#94a3b8", fontSize: "0.8125rem" }}>No messages yet</p>
                        )}
                        {msgs.map((m) => (
                            <div key={m.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #f1f5f9" }}>
                                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                                    <strong style={{ color: "#334155" }}>{m.sender_name ?? "User"}</strong> ·{" "}
                                    {formatDate(m.created_at)}
                                </div>
                                <p style={{ fontSize: "0.8125rem", color: "#1e293b", margin: "0.125rem 0 0" }}>
                                    {m.body}
                                </p>
                                {/* Show message attachments */}
                                {m.attachments && (m.attachments as { url: string; name: string }[]).length > 0 && (
                                    <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                                        {(m.attachments as { url: string; name: string }[]).map((a, i) => (
                                            <a
                                                key={i}
                                                href={a.url.startsWith("http") ? a.url : `${FILE_HOST}${a.url}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    display: "inline-flex", alignItems: "center", gap: 4,
                                                    padding: "3px 8px", borderRadius: 4, background: "#f1f5f9",
                                                    fontSize: "0.6875rem", color: "#6366f1", textDecoration: "none",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                📎 {a.name}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Message attachments preview */}
                    {msgAttachments.length > 0 && (
                        <div style={{ marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {msgAttachments.map((a, i) => (
                                <span key={i} style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    padding: "3px 8px", borderRadius: 4, background: "#eef2ff",
                                    fontSize: "0.6875rem", color: "#4338ca", fontWeight: 500,
                                }}>
                                    📄 {a.name}
                                    <button
                                        onClick={() => setMsgAttachments(msgAttachments.filter((_, j) => j !== i))}
                                        style={{
                                            border: "none", background: "none", cursor: "pointer",
                                            fontSize: "0.6875rem", color: "#dc2626", padding: 0,
                                        }}
                                    >✕</button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <input
                            style={{ ...styles.input, flex: 1 }}
                            value={msgInput}
                            onChange={(e) => setMsgInput(e.target.value)}
                            placeholder="Write a message…"
                            onKeyDown={(e) => e.key === "Enter" && sendMsg()}
                        />
                        <label style={{
                            cursor: uploading ? "wait" : "pointer",
                            padding: "0.5rem",
                            borderRadius: 8,
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            fontSize: "1rem",
                        }}>
                            📎
                            <input
                                type="file" multiple
                                style={{ display: "none" }}
                                onChange={handleMsgAttach}
                                disabled={uploading}
                            />
                        </label>
                        <button style={styles.btnPrimary} onClick={sendMsg}>
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
