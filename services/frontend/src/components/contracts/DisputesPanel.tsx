"use client";

import { useState, useCallback, useEffect } from "react";
import {
    Dispute,
    DisputeMsg,
    DISPUTE_REASONS,
    formatDate,
    styles,
    API,
} from "./types";

interface Props {
    contractId: string;
    token: string;
}

export default function DisputesPanel({ contractId, token }: Props) {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ reason: "quality", description: "" });
    const [submitting, setSubmitting] = useState(false);

    // Message thread
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [msgs, setMsgs] = useState<DisputeMsg[]>([]);
    const [msgInput, setMsgInput] = useState("");

    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const fetchDisputes = useCallback(async () => {
        // The API doesn't have a direct "list disputes by contract" endpoint,
        // but we can create a dispute and view it — for now we'll store locally.
        // In production you'd add a backend endpoint.
        // We'll try to read from the contract show endpoint if disputes are embedded.
        try {
            const r = await fetch(`${API}/contracts/${contractId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const j = await r.json();
            // If disputes are in the response, use them
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

    async function openDispute() {
        if (!form.description.trim()) return;
        setSubmitting(true);
        try {
            await fetch(`${API}/disputes`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    contract_id: contractId,
                    reason: form.reason,
                    description: form.description,
                }),
            });
            setShowForm(false);
            setForm({ reason: "quality", description: "" });
            await fetchDisputes();
        } catch {
            /* ignore */
        }
        setSubmitting(false);
    }

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
            body: JSON.stringify({ body: msgInput }),
        });
        setMsgInput("");
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
                            <div>
                                <label style={styles.label}>Reason</label>
                                <select
                                    style={styles.input}
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                >
                                    {DISPUTE_REASONS.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={styles.label}>Description</label>
                                <textarea
                                    style={{ ...styles.input, minHeight: 80 }}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Describe the issue…"
                                />
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                    style={styles.btnDanger}
                                    disabled={submitting}
                                    onClick={openDispute}
                                >
                                    Submit Dispute
                                </button>
                                <button style={styles.btnOutline} onClick={() => setShowForm(false)}>
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
            {disputes.map((d) => (
                <div
                    key={d.id}
                    style={{ ...styles.card, cursor: "pointer", borderLeft: "4px solid #ef4444" }}
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
                                background: d.status === "open" ? "#fef3c7" : "#dcfce7",
                                color: d.status === "open" ? "#92400e" : "#15803d",
                                fontWeight: 600,
                            }}
                        >
                            {d.status}
                        </span>
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "0.25rem 0 0" }}>
                        {d.description?.slice(0, 120)}
                        {(d.description?.length ?? 0) > 120 ? "…" : ""}
                    </p>
                </div>
            ))}

            {/* Message thread */}
            {selectedId && (
                <div style={{ ...styles.card, marginTop: "1rem" }}>
                    <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                        Dispute Messages
                    </h4>
                    <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: "0.75rem" }}>
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
                            </div>
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                            style={{ ...styles.input, flex: 1 }}
                            value={msgInput}
                            onChange={(e) => setMsgInput(e.target.value)}
                            placeholder="Write a message…"
                            onKeyDown={(e) => e.key === "Enter" && sendMsg()}
                        />
                        <button style={styles.btnPrimary} onClick={sendMsg}>
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
