"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Invoice {
    id: string; contract_id: string; invoice_number: string;
    subtotal: string; platform_fee: string; tax_amount: string; total: string;
    currency: string; status: string; issued_at: string; due_at: string;
    paid_at: string | null; notes: string | null;
}

export default function InvoiceDetailPage() {
    const { token } = useAuth();
    const { id } = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!token || !id) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/invoices/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setInvoice((await res.json()).data);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [token, id]);

    useEffect(() => { load(); }, [load]);

    const fmt = (v: string) => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 });

    if (loading) return (
        <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
            <div style={{ width: 40, height: 40, border: "4px solid #e5e7eb", borderTop: "4px solid #f97316", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!invoice) return <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>Invoice not found.</div>;

    const statusColors: Record<string, { color: string; bg: string }> = {
        paid: { color: "#16a34a", bg: "#dcfce7" },
        sent: { color: "#2563eb", bg: "#dbeafe" },
        overdue: { color: "#dc2626", bg: "#fef2f2" },
        draft: { color: "#6b7280", bg: "#f3f4f6" },
        cancelled: { color: "#6b7280", bg: "#f3f4f6" },
        refunded: { color: "#d97706", bg: "#fef3c7" },
    };
    const s = statusColors[invoice.status] || statusColors.draft;

    return (
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", marginBottom: 16, fontSize: 14 }}>
                ← Back to invoices
            </button>

            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                {/* Header */}
                <div style={{ background: "linear-gradient(135deg, #1e293b, #334155)", padding: "32px 32px 24px", color: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Invoice</h1>
                            <p style={{ fontFamily: "monospace", fontSize: 18, marginTop: 4, color: "#94a3b8" }}>
                                {invoice.invoice_number}
                            </p>
                        </div>
                        <span style={{
                            fontSize: 14, padding: "4px 14px", borderRadius: 999, fontWeight: 600,
                            background: s.bg, color: s.color, textTransform: "capitalize",
                        }}>
                            {invoice.status}
                        </span>
                    </div>
                </div>

                {/* Details */}
                <div style={{ padding: 32 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
                        <DetailField label="Issued" value={new Date(invoice.issued_at).toLocaleDateString()} />
                        <DetailField label="Due" value={new Date(invoice.due_at).toLocaleDateString()} />
                        {invoice.paid_at && <DetailField label="Paid" value={new Date(invoice.paid_at).toLocaleDateString()} />}
                        <DetailField label="Currency" value={invoice.currency.toUpperCase()} />
                    </div>

                    {/* Line Items */}
                    <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 24, marginBottom: 24 }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                                    <td style={{ padding: "10px 0", fontSize: 14, color: "#374151" }}>Subtotal</td>
                                    <td style={{ padding: "10px 0", fontSize: 14, textAlign: "right" }}>{fmt(invoice.subtotal)}</td>
                                </tr>
                                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                                    <td style={{ padding: "10px 0", fontSize: 14, color: "#6b7280" }}>Platform fee (5%)</td>
                                    <td style={{ padding: "10px 0", fontSize: 14, textAlign: "right", color: "#6b7280" }}>{fmt(invoice.platform_fee)}</td>
                                </tr>
                                {Number(invoice.tax_amount) > 0 && (
                                    <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                                        <td style={{ padding: "10px 0", fontSize: 14, color: "#6b7280" }}>Tax</td>
                                        <td style={{ padding: "10px 0", fontSize: 14, textAlign: "right", color: "#6b7280" }}>{fmt(invoice.tax_amount)}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td style={{ padding: "14px 0", fontSize: 18, fontWeight: 700, color: "#111827" }}>Total</td>
                                    <td style={{ padding: "14px 0", fontSize: 18, fontWeight: 700, textAlign: "right", color: "#111827" }}>{fmt(invoice.total)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {invoice.notes && (
                        <div style={{ background: "#f9fafb", borderRadius: 8, padding: 16 }}>
                            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Notes</p>
                            <p style={{ fontSize: 14, color: "#374151" }}>{invoice.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: 15, fontWeight: 500, color: "#111827" }}>{value}</p>
        </div>
    );
}
