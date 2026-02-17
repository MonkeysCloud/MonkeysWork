"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import StatusBadge from "@/components/admin/StatusBadge";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Dispute {
    id: string;
    contract_id: string;
    filed_by: string;
    reason: string;
    description: string;
    evidence_urls?: { url: string; name: string }[];
    status: string;
    resolution_amount?: string;
    resolution_notes?: string;
    resolved_by?: string;
    resolved_at?: string;
    response_deadline?: string;
    awaiting_response_from?: string;
    message_count?: number;
    job_title?: string;
    client_id?: string;
    freelancer_id?: string;
    client_name?: string;
    client_email?: string;
    freelancer_name?: string;
    freelancer_email?: string;
    filed_by_name?: string;
    total_amount?: string;
    currency?: string;
    contract_type?: string;
    created_at: string;
    updated_at?: string;
    [key: string]: unknown;
}

interface Message {
    id: string;
    sender_id: string;
    sender_name?: string;
    body: string;
    attachments?: { url: string; name: string }[];
    is_internal?: boolean;
    created_at: string;
}

const DISPUTE_REASONS: Record<string, string> = {
    quality: "Quality Issues",
    non_delivery: "Non-Delivery",
    scope_change: "Scope Change",
    payment: "Payment Issue",
    communication: "Communication",
    other: "Other",
};

const RESOLUTION_OPTIONS = [
    { value: "resolved_client", label: "Resolve in favor of Client" },
    { value: "resolved_freelancer", label: "Resolve in favor of Freelancer" },
    { value: "resolved_split", label: "Split / Compromise" },
];

function formatMoney(amount: string | number, currency = "USD") {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(num);
}

export default function AdminDisputeDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { token } = useAuth();
    const router = useRouter();
    const threadRef = useRef<HTMLDivElement>(null);

    const [dispute, setDispute] = useState<Dispute | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    // Resolution form
    const [resStatus, setResStatus] = useState("resolved_split");
    const [resAmount, setResAmount] = useState("");
    const [resNotes, setResNotes] = useState("");
    const [resolving, setResolving] = useState(false);

    // Internal note
    const [noteBody, setNoteBody] = useState("");
    const [sendingNote, setSendingNote] = useState(false);
    const [noteIsInternal, setNoteIsInternal] = useState(true);

    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    /* ── Fetch ────────────────────────────────────────── */

    const fetchData = useCallback(async () => {
        if (!token || !id) return;
        try {
            const res = await fetch(`${API}/admin/disputes/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            const d = json.data;
            if (d) {
                setDispute(d);
                setMessages(d.messages ?? []);
                if (d.total_amount) setResAmount(d.total_amount);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token, id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    /* ── Resolve ──────────────────────────────────────── */

    async function handleResolve() {
        if (resolving || !id) return;
        setResolving(true);
        try {
            const res = await fetch(`${API}/admin/disputes/${id}/resolve`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    status: resStatus,
                    resolution_amount: resAmount || null,
                    resolution_notes: resNotes || null,
                }),
            });
            if (res.ok) await fetchData();
        } catch (e) {
            console.error(e);
        }
        setResolving(false);
    }

    /* ── Send note ────────────────────────────────────── */

    async function sendNote() {
        if (!noteBody.trim() || sendingNote || !id) return;
        setSendingNote(true);
        try {
            const res = await fetch(`${API}/admin/disputes/${id}/messages`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    body: noteBody,
                    is_internal: noteIsInternal,
                }),
            });
            if (res.ok) {
                setNoteBody("");
                await fetchData();
            }
        } catch (e) {
            console.error(e);
        }
        setSendingNote(false);
    }

    /* ── Loading ──────────────────────────────────────── */

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 rounded-lg bg-gray-100 animate-pulse" />
                <div className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
                <div className="h-96 rounded-2xl bg-gray-100 animate-pulse" />
            </div>
        );
    }

    if (!dispute) {
        return (
            <div className="text-center py-20">
                <div className="text-4xl mb-3">🔍</div>
                <h2 className="text-lg font-semibold text-gray-900">Dispute not found</h2>
                <button
                    onClick={() => router.push("/dashboard/admin/disputes")}
                    className="mt-4 px-4 py-2 text-sm bg-brand-orange text-white rounded-lg"
                >
                    Back to Disputes
                </button>
            </div>
        );
    }

    const isResolved = ["resolved_client", "resolved_freelancer", "resolved_split"].includes(dispute.status);
    const deadlineExpired = dispute.response_deadline && new Date(dispute.response_deadline) < new Date();

    return (
        <div className="space-y-6">
            {/* Back */}
            <button
                onClick={() => router.push("/dashboard/admin/disputes")}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
                ← Back to Disputes
            </button>

            {/* ── Header ─────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {dispute.job_title ?? "Dispute"}
                        </h1>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                            <span>{DISPUTE_REASONS[dispute.reason] ?? dispute.reason}</span>
                            <span className="text-gray-300">·</span>
                            <span>Opened {new Date(dispute.created_at).toLocaleDateString()}</span>
                            {dispute.filed_by_name && (
                                <>
                                    <span className="text-gray-300">·</span>
                                    <span>By {dispute.filed_by_name}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <StatusBadge status={dispute.status} />
                </div>

                {/* Parties grid */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gray-50">
                        <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Client</div>
                        <div className="text-sm font-medium text-gray-900">{dispute.client_name}</div>
                        <div className="text-xs text-gray-500">{dispute.client_email}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50">
                        <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Freelancer</div>
                        <div className="text-sm font-medium text-gray-900">{dispute.freelancer_name}</div>
                        <div className="text-xs text-gray-500">{dispute.freelancer_email}</div>
                    </div>
                </div>

                {/* Contract info */}
                <div className="mt-3 flex gap-4 text-sm text-gray-500">
                    {dispute.total_amount && (
                        <span>Value: <strong className="text-gray-900">{formatMoney(dispute.total_amount, dispute.currency)}</strong></span>
                    )}
                    {dispute.contract_type && (
                        <span>Type: <strong className="text-gray-900 capitalize">{dispute.contract_type}</strong></span>
                    )}
                </div>

                {/* Deadline status */}
                {!isResolved && dispute.response_deadline && (
                    <div className={`mt-4 p-3 rounded-xl ${deadlineExpired ? "bg-red-50 border border-red-200" : "bg-yellow-50 border border-yellow-200"}`}>
                        <div className={`text-sm font-medium ${deadlineExpired ? "text-red-700" : "text-yellow-700"}`}>
                            {deadlineExpired
                                ? `⏰ Response deadline expired (${new Date(dispute.response_deadline).toLocaleString()})`
                                : `⏳ Response deadline: ${new Date(dispute.response_deadline).toLocaleString()}`}
                        </div>
                        {dispute.awaiting_response_from && (
                            <div className="text-xs text-gray-500 mt-1">
                                Awaiting response from: {
                                    dispute.awaiting_response_from === dispute.client_id
                                        ? dispute.client_name
                                        : dispute.freelancer_name
                                }
                            </div>
                        )}
                    </div>
                )}

                {/* Description */}
                {dispute.description && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                        <div className="text-xs text-gray-400 uppercase font-semibold mb-2">Description</div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{dispute.description}</p>
                    </div>
                )}

                {/* Evidence */}
                {dispute.evidence_urls && dispute.evidence_urls.length > 0 && (
                    <div className="mt-3">
                        <div className="text-xs text-gray-400 uppercase font-semibold mb-2">Evidence</div>
                        <div className="flex flex-wrap gap-2">
                            {dispute.evidence_urls.map((ev, i) => (
                                <a
                                    key={i}
                                    href={ev.url}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Message Thread (2/3) ────────────── */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">
                            Messages ({messages.length})
                        </h2>
                    </div>

                    <div ref={threadRef} className="max-h-[500px] overflow-y-auto px-6 py-4 space-y-3">
                        {messages.length === 0 ? (
                            <p className="text-center py-8 text-gray-400 text-sm">No messages yet</p>
                        ) : (
                            messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={`p-3 rounded-xl ${m.is_internal
                                            ? "bg-purple-50 border border-purple-200"
                                            : "bg-gray-50 border border-gray-100"
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-semibold text-gray-700">
                                            {m.sender_name ?? "User"}
                                        </span>
                                        {m.is_internal && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-purple-200 text-purple-700 rounded-full font-semibold">
                                                INTERNAL
                                            </span>
                                        )}
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(m.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{m.body}</p>

                                    {m.attachments && m.attachments.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {m.attachments.map((att, i) => (
                                                <a
                                                    key={i}
                                                    href={att.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-white border border-gray-200 rounded-lg"
                                                >
                                                    📎 {att.name || `File ${i + 1}`}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Admin note form */}
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                        <div className="flex gap-3">
                            <textarea
                                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-orange/30 transition-all"
                                rows={2}
                                placeholder={noteIsInternal ? "Write an internal admin note…" : "Write a message to both parties…"}
                                value={noteBody}
                                onChange={(e) => setNoteBody(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        sendNote();
                                    }
                                }}
                            />
                            <button
                                onClick={sendNote}
                                disabled={sendingNote || !noteBody.trim()}
                                className="px-4 py-2 bg-brand-orange text-white text-sm font-semibold rounded-xl hover:bg-brand-orange/90 disabled:opacity-40 transition-all self-end"
                            >
                                Send
                            </button>
                        </div>
                        <label className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <input
                                type="checkbox"
                                checked={noteIsInternal}
                                onChange={(e) => setNoteIsInternal(e.target.checked)}
                                className="rounded"
                            />
                            Internal note (hidden from parties)
                        </label>
                    </div>
                </div>

                {/* ── Resolution Panel (1/3) ──────────── */}
                <div className="space-y-4">
                    {isResolved ? (
                        <div className="bg-green-50 rounded-2xl border border-green-200 p-5">
                            <h3 className="font-semibold text-green-700 mb-2">✅ Resolved</h3>
                            <div className="text-sm text-green-700 space-y-1">
                                <p>Status: <strong>{dispute.status.replace("resolved_", "").replace("_", " ")}</strong></p>
                                {dispute.resolution_amount && (
                                    <p>Amount: <strong>{formatMoney(dispute.resolution_amount, dispute.currency)}</strong></p>
                                )}
                                {dispute.resolution_notes && (
                                    <p className="mt-2 whitespace-pre-wrap">{dispute.resolution_notes}</p>
                                )}
                                {dispute.resolved_at && (
                                    <p className="text-xs mt-2">
                                        Resolved: {new Date(dispute.resolved_at).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 p-5">
                            <h3 className="font-semibold text-gray-900 mb-4">Resolve Dispute</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Resolution</label>
                                    <select
                                        value={resStatus}
                                        onChange={(e) => setResStatus(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                                    >
                                        {RESOLUTION_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                        Resolution Amount ({dispute.currency ?? "USD"})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={resAmount}
                                        onChange={(e) => setResAmount(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Notes</label>
                                    <textarea
                                        value={resNotes}
                                        onChange={(e) => setResNotes(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                                        rows={4}
                                        placeholder="Explain the resolution…"
                                    />
                                </div>
                                <button
                                    onClick={handleResolve}
                                    disabled={resolving}
                                    className="w-full px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-40 transition-all"
                                >
                                    {resolving ? "Resolving…" : "✅ Resolve Dispute"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Quick info */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <h3 className="font-semibold text-gray-900 mb-3">Details</h3>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Contract ID</dt>
                                <dd className="text-gray-900 font-mono text-xs">{dispute.contract_id?.slice(0, 8)}…</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Dispute ID</dt>
                                <dd className="text-gray-900 font-mono text-xs">{dispute.id?.slice(0, 8)}…</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Messages</dt>
                                <dd className="text-gray-900">{messages.length}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
