"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
    Dispute,
    DisputeMsg,
    DISPUTE_REASONS,
    DISPUTE_STATUS,
    formatDate,
    formatMoney,
    API,
    FILE_HOST,
} from "@/components/contracts/types";

/* ── Countdown helper ─────────────────────────────────── */

function useCountdown(deadline?: string) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        if (!deadline) return;
        const iv = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(iv);
    }, [deadline]);

    if (!deadline) return null;

    const diff = new Date(deadline).getTime() - now;
    if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, expired: true, text: "Expired" };

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    let text = "";
    if (days > 0) text = `${days}d ${hours}h ${mins}m`;
    else if (hours > 0) text = `${hours}h ${mins}m ${secs}s`;
    else text = `${mins}m ${secs}s`;

    return { days, hours, mins, secs, expired: false, text, urgent: diff < 86400000 };
}

export default function DisputeDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { token, user } = useAuth();
    const router = useRouter();
    const threadRef = useRef<HTMLDivElement>(null);

    const [dispute, setDispute] = useState<Dispute | null>(null);
    const [messages, setMessages] = useState<DisputeMsg[]>([]);
    const [loading, setLoading] = useState(true);
    const [msgBody, setMsgBody] = useState("");
    const [sending, setSending] = useState(false);
    const [escalating, setEscalating] = useState(false);

    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    /* ── Fetch dispute + messages ─────────────────────── */

    const fetchDispute = useCallback(async () => {
        if (!token || !id) return;
        try {
            const [dRes, mRes] = await Promise.all([
                fetch(`${API}/disputes/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/disputes/${id}/messages`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const dJson = await dRes.json();
            const mJson = await mRes.json();
            setDispute(dJson.data ?? null);
            setMessages(mJson.data ?? []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token, id]);

    useEffect(() => {
        fetchDispute();
    }, [fetchDispute]);

    useEffect(() => {
        threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    /* ── Send message ─────────────────────────────────── */

    async function sendMessage() {
        if (!msgBody.trim() || sending || !id) return;
        setSending(true);
        try {
            const res = await fetch(`${API}/disputes/${id}/messages`, {
                method: "POST",
                headers,
                body: JSON.stringify({ body: msgBody }),
            });
            if (res.ok) {
                setMsgBody("");
                await fetchDispute();
            }
        } catch (e) {
            console.error(e);
        }
        setSending(false);
    }

    /* ── Escalate ─────────────────────────────────────── */

    async function handleEscalate() {
        if (!id || escalating) return;
        setEscalating(true);
        try {
            await fetch(`${API}/disputes/${id}/escalate`, {
                method: "POST",
                headers,
            });
            await fetchDispute();
        } catch (e) {
            console.error(e);
        }
        setEscalating(false);
    }

    /* ── Countdown ────────────────────────────────────── */

    const countdown = useCountdown(dispute?.response_deadline ?? undefined);
    const isMyTurn = dispute?.awaiting_response_from === user?.id;
    const isResolved = ["resolved_client", "resolved_freelancer", "resolved_split"].includes(dispute?.status ?? "");
    const myRole = dispute?.client_id === user?.id ? "client" : "freelancer";
    const otherPartyName = myRole === "client" ? dispute?.freelancer_name : dispute?.client_name;

    /* ── Loading skeleton ─────────────────────────────── */

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="h-8 w-48 rounded-lg bg-gray-100 animate-pulse" />
                <div className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
                <div className="h-96 rounded-2xl bg-gray-100 animate-pulse" />
            </div>
        );
    }

    if (!dispute) {
        return (
            <div className="max-w-4xl mx-auto text-center py-20">
                <div className="text-4xl mb-3">🔍</div>
                <h2 className="text-lg font-semibold text-gray-900">Dispute not found</h2>
                <button
                    onClick={() => router.push("/dashboard/disputes")}
                    className="mt-4 px-4 py-2 text-sm bg-brand-orange text-white rounded-lg hover:bg-brand-orange/90 transition-colors"
                >
                    Back to Disputes
                </button>
            </div>
        );
    }

    const status = DISPUTE_STATUS[dispute.status] ?? { label: dispute.status, bg: "#f3f4f6", fg: "#6b7280", icon: "❓" };
    const reasonLabel = DISPUTE_REASONS.find((r) => r.value === dispute.reason)?.label ?? dispute.reason;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Back link */}
            <button
                onClick={() => router.push("/dashboard/disputes")}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
                ← Back to Disputes
            </button>

            {/* ── Header Card ─────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {dispute.job_title ?? "Contract Dispute"}
                        </h1>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                            <span>{reasonLabel}</span>
                            <span className="text-gray-300">·</span>
                            <span>Opened {formatDate(dispute.created_at)}</span>
                            {dispute.filed_by_name && (
                                <>
                                    <span className="text-gray-300">·</span>
                                    <span>By {dispute.filed_by_name}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <span
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full whitespace-nowrap"
                        style={{ background: status.bg, color: status.fg }}
                    >
                        {status.icon} {status.label}
                    </span>
                </div>

                {/* Parties */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-gray-50">
                        <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Client</div>
                        <div className="text-sm font-medium text-gray-900">{dispute.client_name}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50">
                        <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Freelancer</div>
                        <div className="text-sm font-medium text-gray-900">{dispute.freelancer_name}</div>
                    </div>
                </div>

                {dispute.total_amount && (
                    <div className="mt-3 text-sm text-gray-500">
                        Contract value: <span className="font-semibold text-gray-900">{formatMoney(dispute.total_amount, dispute.currency)}</span>
                    </div>
                )}

                {/* Description */}
                {dispute.description && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                        <div className="text-xs text-gray-400 uppercase font-semibold mb-2">Initial Description</div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{dispute.description}</p>
                    </div>
                )}

                {/* Evidence */}
                {dispute.evidence_urls && dispute.evidence_urls.length > 0 && (
                    <div className="mt-3">
                        <div className="text-xs text-gray-400 uppercase font-semibold mb-2">Evidence Files</div>
                        <div className="flex flex-wrap gap-2">
                            {dispute.evidence_urls.map((ev, i) => (
                                <a
                                    key={i}
                                    href={ev.url.startsWith("http") ? ev.url : `${FILE_HOST}${ev.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    📎 {ev.name || `File ${i + 1}`}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Response Deadline Card ───────────────────── */}
            {!isResolved && countdown && (
                <div
                    className={`rounded-2xl border p-5 ${countdown.expired
                            ? "bg-red-50 border-red-200"
                            : isMyTurn
                                ? countdown.urgent
                                    ? "bg-red-50 border-red-200"
                                    : "bg-orange-50 border-orange-200"
                                : "bg-blue-50 border-blue-200"
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            {countdown.expired ? (
                                <>
                                    <div className="font-semibold text-red-700">⏰ Deadline Expired</div>
                                    <p className="text-sm text-red-600 mt-1">
                                        The response deadline has passed. The party who did not respond has forfeited the dispute.
                                    </p>
                                </>
                            ) : isMyTurn ? (
                                <>
                                    <div className={`font-semibold ${countdown.urgent ? "text-red-700" : "text-orange-700"}`}>
                                        ⏰ Your turn to respond
                                    </div>
                                    <p className={`text-sm mt-1 ${countdown.urgent ? "text-red-600" : "text-orange-600"}`}>
                                        {countdown.urgent
                                            ? `⚠️ You will forfeit this dispute if you don't respond in ${countdown.text}!`
                                            : `You have ${countdown.text} to respond before the dispute is auto-resolved against you.`}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="font-semibold text-blue-700">⏳ Waiting for {otherPartyName}</div>
                                    <p className="text-sm text-blue-600 mt-1">
                                        {otherPartyName} has {countdown.text} to respond. If they don&apos;t reply, the dispute resolves in your favor.
                                    </p>
                                </>
                            )}
                        </div>
                        <div
                            className={`text-2xl font-bold tabular-nums ${countdown.expired
                                    ? "text-red-700"
                                    : isMyTurn && countdown.urgent
                                        ? "text-red-700"
                                        : isMyTurn
                                            ? "text-orange-700"
                                            : "text-blue-700"
                                }`}
                        >
                            {countdown.text}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Resolution Info ─────────────────────────── */}
            {isResolved && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <div className="font-semibold text-green-700 mb-2">
                        ✅ Dispute Resolved — {status.label}
                    </div>
                    {dispute.resolution_notes && (
                        <p className="text-sm text-green-700 whitespace-pre-wrap">{dispute.resolution_notes}</p>
                    )}
                    {dispute.resolution_amount && (
                        <p className="text-sm text-green-700 mt-1">
                            Resolution amount: <span className="font-semibold">{formatMoney(dispute.resolution_amount, dispute.currency)}</span>
                        </p>
                    )}
                    {dispute.resolved_at && (
                        <p className="text-xs text-green-600 mt-2">Resolved on {formatDate(dispute.resolved_at)}</p>
                    )}
                </div>
            )}

            {/* ── Arguments Thread ────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">
                        Arguments & Evidence
                        {messages.length > 0 && (
                            <span className="text-xs text-gray-400 font-normal ml-2">({messages.length} messages)</span>
                        )}
                    </h2>
                </div>

                <div
                    ref={threadRef}
                    className="max-h-[500px] overflow-y-auto px-6 py-4 space-y-4"
                >
                    {messages.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <div className="text-3xl mb-2">💬</div>
                            <p className="text-sm">No messages yet. Start the discussion below.</p>
                        </div>
                    ) : (
                        messages.map((m) => {
                            const isMe = m.sender_id === user?.id;
                            return (
                                <div
                                    key={m.id}
                                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[75%] rounded-2xl p-4 ${isMe
                                                ? "bg-brand-orange/10 border border-brand-orange/20"
                                                : "bg-gray-50 border border-gray-100"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-semibold ${isMe ? "text-brand-orange" : "text-gray-700"}`}>
                                                {isMe ? "You" : m.sender_name ?? "Other Party"}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(m.created_at).toLocaleString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{m.body}</p>

                                        {/* Attachments */}
                                        {m.attachments && m.attachments.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {m.attachments.map((att, i) => (
                                                    <a
                                                        key={i}
                                                        href={att.url.startsWith("http") ? att.url : `${FILE_HOST}${att.url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                    >
                                                        📎 {att.name || `File ${i + 1}`}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── Reply Form ──────────────────────────── */}
                {!isResolved && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                        <div className="flex gap-3">
                            <textarea
                                className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange/50 transition-all"
                                rows={2}
                                placeholder="Type your argument or evidence…"
                                value={msgBody}
                                onChange={(e) => setMsgBody(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={sending || !msgBody.trim()}
                                className="px-5 py-3 bg-brand-orange text-white text-sm font-semibold rounded-xl hover:bg-brand-orange/90 disabled:opacity-40 transition-all self-end"
                            >
                                {sending ? "Sending…" : "Send"}
                            </button>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2">
                            Press Enter to send, Shift+Enter for a new line. Each reply resets the 3-day response window for the other party.
                        </p>
                    </div>
                )}
            </div>

            {/* ── Action Buttons ──────────────────────────── */}
            {!isResolved && dispute.status !== "escalated" && (
                <div className="flex justify-end gap-3">
                    <button
                        onClick={handleEscalate}
                        disabled={escalating}
                        className="px-5 py-2.5 text-sm font-semibold border border-red-200 text-red-600 rounded-xl hover:bg-red-50 disabled:opacity-40 transition-all"
                    >
                        {escalating ? "Escalating…" : "🔺 Escalate to Admin"}
                    </button>
                </div>
            )}
        </div>
    );
}
