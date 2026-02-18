"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Transaction {
    id: string; contract_id: string; milestone_id: string | null;
    type: string; amount: string; currency: string; status: string;
    gateway_reference: string | null; job_title: string; created_at: string;
}

const TX_TYPES = [
    { value: "", label: "All Types" },
    { value: "fund", label: "💰 Escrow Funded" },
    { value: "release", label: "✅ Released" },
    { value: "refund", label: "↩️ Refunded" },
    { value: "platform_fee", label: "🏷️ Commission" },
    { value: "client_fee", label: "📋 Service Fee" },
];

const TYPE_STYLE: Record<string, { label: string; color: string; bg: string }> = {
    fund: { label: "Funded", color: "#2563eb", bg: "#dbeafe" },
    release: { label: "Released", color: "#16a34a", bg: "#dcfce7" },
    refund: { label: "Refunded", color: "#d97706", bg: "#fef3c7" },
    platform_fee: { label: "Commission", color: "#7c3aed", bg: "#ede9fe" },
    client_fee: { label: "Fee", color: "#dc2626", bg: "#fef2f2" },
    dispute_hold: { label: "Dispute", color: "#dc2626", bg: "#fef2f2" },
};

export default function TransactionsPage() {
    const { token } = useAuth();
    const [txs, setTxs] = useState<Transaction[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState("");
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), per_page: "20" });
        if (filter) params.set("type", filter);
        const res = await fetch(`${API}/billing/transactions?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const json = await res.json();
            setTxs(json.data);
            setTotal(json.meta?.total || 0);
        }
        setLoading(false);
    }, [token, page, filter]);

    useEffect(() => { load(); }, [load]);

    const fmt = (v: string) => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 });
    const totalPages = Math.ceil(total / 20) || 1;

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Transaction History</h1>
            <p style={{ color: "#6b7280", marginBottom: 24 }}>All billing transactions across your contracts</p>

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                {TX_TYPES.map((t) => (
                    <button
                        key={t.value}
                        onClick={() => { setFilter(t.value); setPage(1); }}
                        style={{
                            padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: "pointer",
                            border: filter === t.value ? "2px solid #f97316" : "1px solid #e5e7eb",
                            background: filter === t.value ? "#fff7ed" : "#fff",
                            color: filter === t.value ? "#f97316" : "#374151",
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center" }}>
                        <div style={{ width: 36, height: 36, border: "4px solid #e5e7eb", borderTop: "4px solid #f97316", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : txs.length === 0 ? (
                    <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>No transactions found.</div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                {["Type", "Job", "Amount", "Status", "Ref", "Date"].map((h) => (
                                    <th key={h} style={{ padding: "10px 14px", fontSize: 12, fontWeight: 500, color: "#6b7280", textAlign: h === "Amount" ? "right" : "left" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {txs.map((tx) => {
                                const s = TYPE_STYLE[tx.type] || { label: tx.type, color: "#6b7280", bg: "#f3f4f6" };
                                return (
                                    <tr key={tx.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                        <td style={{ padding: "12px 14px" }}>
                                            <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 999, fontWeight: 500, background: s.bg, color: s.color }}>{s.label}</span>
                                        </td>
                                        <td style={{ padding: "12px 14px", fontSize: 14, color: "#374151", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {tx.job_title}
                                        </td>
                                        <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, textAlign: "right" }}>{fmt(tx.amount)}</td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <span style={{
                                                fontSize: 12, padding: "2px 8px", borderRadius: 999, fontWeight: 500,
                                                background: tx.status === "completed" ? "#dcfce7" : "#fef3c7",
                                                color: tx.status === "completed" ? "#16a34a" : "#d97706",
                                            }}>{tx.status}</span>
                                        </td>
                                        <td style={{ padding: "12px 14px", fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>
                                            {tx.gateway_reference ? tx.gateway_reference.slice(0, 12) + "…" : "—"}
                                        </td>
                                        <td style={{ padding: "12px 14px", fontSize: 13, color: "#6b7280" }}>
                                            {new Date(tx.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                        style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: page <= 1 ? "default" : "pointer", color: page <= 1 ? "#d1d5db" : "#374151" }}>
                        ← Prev
                    </button>
                    <span style={{ padding: "6px 14px", fontSize: 14, color: "#6b7280" }}>Page {page} of {totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                        style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: page >= totalPages ? "default" : "pointer", color: page >= totalPages ? "#d1d5db" : "#374151" }}>
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
