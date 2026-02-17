"use client";

import { useState, useEffect, useCallback } from "react";
import { Conversation, ConvoMessage, styles, API } from "./types";

interface Props {
    contractId: string;
    contractTitle: string;
    token: string;
    userId: string;
}

export default function ContractChat({ contractId, contractTitle, token, userId }: Props) {
    const [convo, setConvo] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ConvoMessage[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);

    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const fetchConversation = useCallback(async () => {
        try {
            const r = await fetch(`${API}/conversations`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const j = await r.json();
            const found = (j.data ?? []).find(
                (c: Conversation) => c.contract_id === contractId
            );
            setConvo(found ?? null);
            if (found) {
                const mr = await fetch(`${API}/conversations/${found.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const mj = await mr.json();
                setMessages(mj.data?.messages ?? []);
            }
        } catch {
            /* ignore */
        }
    }, [contractId, token]);

    useEffect(() => {
        fetchConversation();
    }, [fetchConversation]);

    async function send() {
        if (!input.trim()) return;
        setSending(true);

        let cid = convo?.id;

        // Create conversation if none exists
        if (!cid) {
            try {
                const r = await fetch(`${API}/conversations`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        contract_id: contractId,
                        title: `Contract: ${contractTitle}`,
                    }),
                });
                const j = await r.json();
                cid = j.data?.id;
                if (cid) {
                    setConvo({ id: cid, contract_id: contractId, title: contractTitle });
                }
            } catch {
                setSending(false);
                return;
            }
        }
        if (!cid) {
            setSending(false);
            return;
        }

        // Send message
        await fetch(`${API}/conversations/${cid}/messages`, {
            method: "POST",
            headers,
            body: JSON.stringify({ body: input }),
        });
        setInput("");

        // Refresh messages
        try {
            const mr = await fetch(`${API}/conversations/${cid}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const mj = await mr.json();
            setMessages(mj.data?.messages ?? []);
        } catch {
            /* ignore */
        }
        setSending(false);
    }

    return (
        <div style={styles.card}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.75rem" }}>
                💬 Contract Chat
            </h3>

            {/* Messages area */}
            <div
                style={{
                    maxHeight: 400,
                    overflowY: "auto",
                    marginBottom: "0.75rem",
                    padding: "0.5rem",
                    background: "#f8fafc",
                    borderRadius: 10,
                }}
            >
                {messages.length === 0 && (
                    <p
                        style={{
                            textAlign: "center",
                            color: "#94a3b8",
                            fontSize: "0.875rem",
                            padding: "2rem 0",
                        }}
                    >
                        No messages yet — start the conversation!
                    </p>
                )}
                {messages.map((m) => {
                    const isSelf = m.sender_id === userId;
                    return (
                        <div
                            key={m.id}
                            style={{
                                display: "flex",
                                justifyContent: isSelf ? "flex-end" : "flex-start",
                                marginBottom: "0.5rem",
                            }}
                        >
                            <div
                                style={{
                                    maxWidth: "75%",
                                    padding: "0.5rem 0.75rem",
                                    borderRadius: 12,
                                    background: isSelf ? "#6366f1" : "#ffffff",
                                    color: isSelf ? "#fff" : "#1e293b",
                                    fontSize: "0.8125rem",
                                    border: isSelf ? "none" : "1px solid #e2e8f0",
                                }}
                            >
                                {!isSelf && (
                                    <div
                                        style={{
                                            fontSize: "0.6875rem",
                                            fontWeight: 600,
                                            color: "#6366f1",
                                            marginBottom: 2,
                                        }}
                                    >
                                        {m.sender_name ?? "User"}
                                    </div>
                                )}
                                <p style={{ margin: 0 }}>{m.body}</p>
                                <div
                                    style={{
                                        fontSize: "0.625rem",
                                        marginTop: 2,
                                        opacity: 0.6,
                                        textAlign: "right",
                                    }}
                                >
                                    {new Date(m.created_at).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Composer */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                    style={{ ...styles.input, flex: 1 }}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message…"
                    onKeyDown={(e) => e.key === "Enter" && !sending && send()}
                    disabled={sending}
                />
                <button style={styles.btnPrimary} onClick={send} disabled={sending}>
                    {sending ? "…" : "Send"}
                </button>
            </div>
        </div>
    );
}
