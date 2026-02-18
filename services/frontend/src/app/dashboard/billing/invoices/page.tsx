"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Invoice {
    id: string; contract_id: string; invoice_number: string;
    subtotal: string; platform_fee: string; tax_amount: string; total: string;
    currency: string; status: string; issued_at: string; due_at: string;
    paid_at: string | null; notes: string | null;
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
    draft: { color: "#6b7280", bg: "#f3f4f6" },
    sent: { color: "#2563eb", bg: "#dbeafe" },
    paid: { color: "#16a34a", bg: "#dcfce7" },
    overdue: { color: "#dc2626", bg: "#fef2f2" },
    cancelled: { color: "#6b7280", bg: "#f3f4f6" },
    refunded: { color: "#d97706", bg: "#fef3c7" },
};

export default function InvoicesPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/invoices`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setInvoices((await res.json()).data);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [token]);

    useEffect(() => { load(); }, [load]);

    const fmt = (v: string) => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 });

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Invoices</h1>
            <p style={{ color: "#6b7280", marginBottom: 24 }}>View and download invoices for all payments</p>

            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center" }}>
                        <div style={{ width: 36, height: 36, border: "4px solid #e5e7eb", borderTop: "4px solid #f97316", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : invoices.length === 0 ? (
                    <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>
                        <p style={{ fontSize: 36 }}>📄</p>
                        <p>No invoices yet. Invoices are auto-generated when payments are processed.</p>
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                {["Invoice #", "Subtotal", "Fee", "Total", "Status", "Issued", ""].map((h) => (
                                    <th key={h} style={{
                                        padding: "10px 14px", fontSize: 12, fontWeight: 500, color: "#6b7280",
                                        textAlign: ["Subtotal", "Fee", "Total"].includes(h) ? "right" : "left"
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv) => {
                                const s = STATUS_STYLE[inv.status] || STATUS_STYLE.draft;
                                return (
                                    <tr key={inv.id} style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}
                                        onClick={() => router.push(`/dashboard/billing/invoices/${inv.id}`)}>
                                        <td style={{ padding: "12px 14px", fontWeight: 600, fontSize: 14, color: "#111827", fontFamily: "monospace" }}>
                                            {inv.invoice_number}
                                        </td>
                                        <td style={{ padding: "12px 14px", fontSize: 14, textAlign: "right" }}>{fmt(inv.subtotal)}</td>
                                        <td style={{ padding: "12px 14px", fontSize: 14, textAlign: "right", color: "#6b7280" }}>{fmt(inv.platform_fee)}</td>
                                        <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, textAlign: "right" }}>{fmt(inv.total)}</td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 999, fontWeight: 500, background: s.bg, color: s.color, textTransform: "capitalize" }}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 14px", fontSize: 13, color: "#6b7280" }}>
                                            {new Date(inv.issued_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <span style={{ color: "#f97316", fontSize: 14 }}>→</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
