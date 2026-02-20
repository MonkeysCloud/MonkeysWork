"use client";

import { useState } from "react";
import { styles, API, formatDate } from "./types";

interface Claim {
    id: string;
    type: string;
    message: string;
    status: string;
    response?: string;
    resolved_at?: string;
    created_at: string;
}

interface Props {
    entryId: string;
    claims: Claim[];
    isClient: boolean;
    onUpdated?: () => void;
}

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
    open: { bg: "#fef3c7", fg: "#92400e", label: "Open" },
    responded: { bg: "#dbeafe", fg: "#1d4ed8", label: "Responded" },
    resolved: { bg: "#dcfce7", fg: "#15803d", label: "Resolved" },
};

export default function TimeEntryClaims({ entryId, claims, isClient, onUpdated }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState("");
    const [type, setType] = useState<"detail_request" | "dispute">("detail_request");
    const [submitting, setSubmitting] = useState(false);
    const [respondingId, setRespondingId] = useState<string | null>(null);
    const [responseText, setResponseText] = useState("");

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    async function createClaim() {
        if (!message.trim()) return;
        setSubmitting(true);
        try {
            await fetch(`${API}/time/entries/${entryId}/claims`, {
                method: "POST",
                headers,
                body: JSON.stringify({ message: message.trim(), type }),
            });
            setMessage("");
            setShowForm(false);
            onUpdated?.();
        } catch { /* silent */ }
        setSubmitting(false);
    }

    async function respond(claimId: string) {
        if (!responseText.trim()) return;
        setSubmitting(true);
        try {
            await fetch(`${API}/time/claims/${claimId}/respond`, {
                method: "PUT",
                headers,
                body: JSON.stringify({ response: responseText.trim() }),
            });
            setRespondingId(null);
            setResponseText("");
            onUpdated?.();
        } catch { /* silent */ }
        setSubmitting(false);
    }

    async function resolve(claimId: string) {
        setSubmitting(true);
        try {
            await fetch(`${API}/time/claims/${claimId}/resolve`, { method: "PUT", headers });
            onUpdated?.();
        } catch { /* silent */ }
        setSubmitting(false);
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <h4 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", margin: 0 }}>
                    💬 Claims ({claims.length})
                </h4>
                {isClient && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        style={{ ...styles.btnPrimary, fontSize: "0.7rem", padding: "0.25rem 0.6rem" }}
                    >
                        + Request Detail
                    </button>
                )}
            </div>

            {/* Create form (client) */}
            {showForm && (
                <div style={{ ...styles.card, padding: "0.75rem" }}>
                    <div style={{ marginBottom: "0.5rem" }}>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as "detail_request" | "dispute")}
                            style={{ ...styles.input, fontSize: "0.75rem", marginBottom: "0.5rem" }}
                        >
                            <option value="detail_request">📋 Detail Request</option>
                            <option value="dispute">⚠️ Dispute</option>
                        </select>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe what you'd like to know about this time entry..."
                            rows={3}
                            style={{ ...styles.input, resize: "vertical", fontSize: "0.75rem" }}
                        />
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                            onClick={createClaim}
                            disabled={submitting || !message.trim()}
                            style={{ ...styles.btnPrimary, fontSize: "0.7rem", padding: "0.25rem 0.6rem", opacity: submitting ? 0.5 : 1 }}
                        >
                            Submit
                        </button>
                        <button
                            onClick={() => setShowForm(false)}
                            style={{ ...styles.btnOutline, fontSize: "0.7rem", padding: "0.25rem 0.6rem" }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Claims list */}
            {claims.length === 0 ? (
                <p style={{ fontSize: "0.7rem", color: "#b0b4c4", textAlign: "center", padding: "0.5rem 0" }}>
                    No claims yet.
                </p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {claims.map((claim) => {
                        const st = STATUS_STYLE[claim.status] ?? STATUS_STYLE.open;
                        return (
                            <div key={claim.id} style={{ ...styles.card, padding: "0.75rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                                    <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "#8b8fa3", textTransform: "uppercase" }}>
                                        {claim.type === "dispute" ? "⚠️ Dispute" : "📋 Detail Request"}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "0.6rem",
                                            fontWeight: 700,
                                            padding: "2px 8px",
                                            borderRadius: 999,
                                            background: st.bg,
                                            color: st.fg,
                                        }}
                                    >
                                        {st.label}
                                    </span>
                                </div>
                                <p style={{ fontSize: "0.8125rem", color: "#1e293b", margin: "0 0 0.25rem" }}>
                                    {claim.message}
                                </p>
                                <span style={{ fontSize: "0.625rem", color: "#b0b4c4" }}>{formatDate(claim.created_at)}</span>

                                {/* Response */}
                                {claim.response && (
                                    <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "0.5rem", paddingTop: "0.5rem" }}>
                                        <p style={{ fontSize: "0.625rem", fontWeight: 700, color: "#8b8fa3", marginBottom: 2 }}>
                                            FREELANCER RESPONSE
                                        </p>
                                        <p style={{ fontSize: "0.8125rem", color: "#334155", margin: 0 }}>
                                            {claim.response}
                                        </p>
                                    </div>
                                )}

                                {/* Freelancer respond form */}
                                {!isClient && claim.status === "open" && (
                                    <div style={{ marginTop: "0.5rem" }}>
                                        {respondingId === claim.id ? (
                                            <div>
                                                <textarea
                                                    value={responseText}
                                                    onChange={(e) => setResponseText(e.target.value)}
                                                    placeholder="Write your response..."
                                                    rows={2}
                                                    style={{ ...styles.input, fontSize: "0.75rem", marginBottom: "0.375rem", resize: "vertical" }}
                                                />
                                                <div style={{ display: "flex", gap: "0.375rem" }}>
                                                    <button
                                                        onClick={() => respond(claim.id)}
                                                        disabled={submitting}
                                                        style={{ ...styles.btnPrimary, fontSize: "0.65rem", padding: "0.2rem 0.5rem" }}
                                                    >
                                                        Send
                                                    </button>
                                                    <button
                                                        onClick={() => { setRespondingId(null); setResponseText(""); }}
                                                        style={{ ...styles.btnOutline, fontSize: "0.65rem", padding: "0.2rem 0.5rem" }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setRespondingId(claim.id)}
                                                style={{ ...styles.btnOutline, fontSize: "0.65rem", padding: "0.2rem 0.5rem" }}
                                            >
                                                Reply
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Client resolve */}
                                {isClient && claim.status === "responded" && (
                                    <div style={{ marginTop: "0.5rem" }}>
                                        <button
                                            onClick={() => resolve(claim.id)}
                                            disabled={submitting}
                                            style={{ ...styles.btnSuccess, fontSize: "0.65rem", padding: "0.2rem 0.5rem" }}
                                        >
                                            ✅ Resolve
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
