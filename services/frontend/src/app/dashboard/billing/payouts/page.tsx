"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Payout {
    id: string; amount: string; currency: string; status: string;
    payment_method_id: string; notes: string | null;
    created_at: string; processed_at: string | null;
}

interface Summary {
    net_earnings: string;
    pending_payouts: string;
}

interface PayoutMethod {
    id: string; type: string; provider: string; last_four: string; is_default: boolean;
}

export default function PayoutsPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [amount, setAmount] = useState("");
    const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [pRes, sRes, pmRes] = await Promise.all([
                fetch(`${API}/payouts`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/billing/summary`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/payment-methods`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (pRes.ok) setPayouts((await pRes.json()).data);
            if (sRes.ok) { const d = (await sRes.json()).data; setSummary({ net_earnings: d.net_earnings, pending_payouts: d.pending_payouts }); }
            if (pmRes.ok) {
                const all: PayoutMethod[] = (await pmRes.json()).data || [];
                setPayoutMethods(all.filter(m => m.type === "bank_transfer" || m.type === "wire_transfer" || m.type === "paypal"));
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [token]);

    useEffect(() => { load(); }, [load]);

    const requestPayout = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
        setRequesting(true);
        try {
            await fetch(`${API}/payouts/request`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ amount, currency: "USD" }),
            });
            setAmount("");
            load();
        } catch (e) { console.error(e); }
        setRequesting(false);
    };

    const fmt = (v: string) => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 });

    const statusStyle: Record<string, { color: string; bg: string }> = {
        pending: { color: "#d97706", bg: "#fef3c7" },
        approved: { color: "#2563eb", bg: "#dbeafe" },
        completed: { color: "#16a34a", bg: "#dcfce7" },
        rejected: { color: "#dc2626", bg: "#fef2f2" },
    };

    const hasPayoutMethod = payoutMethods.length > 0;

    return (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Payouts</h1>
            <p style={{ color: "#6b7280", marginBottom: 24 }}>Withdraw your earnings</p>

            {/* Payout Method Status */}
            {!hasPayoutMethod && !loading && (
                <div style={{
                    borderRadius: 14, border: "1px solid #fdba74", marginBottom: 24,
                    background: "linear-gradient(135deg, #fff7ed, #ffedd5)", padding: "20px 24px",
                    display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
                }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12, background: "#f97316",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#fff",
                    }}>💳</div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>Set Up Payout Method</h3>
                        <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
                            Add a bank account or PayPal to request payouts.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/dashboard/settings/payout-methods")}
                        style={{
                            padding: "10px 20px", borderRadius: 10, border: "none",
                            background: "linear-gradient(135deg, #f97316, #ea580c)",
                            color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
                            boxShadow: "0 4px 16px rgba(249,115,22,0.3)",
                        }}
                    >
                        Set Up Payouts →
                    </button>
                </div>
            )}

            {/* Balance Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
                <div style={{ background: "linear-gradient(135deg, #059669, #047857)", borderRadius: 14, padding: 24, color: "#fff" }}>
                    <p style={{ fontSize: 13, opacity: 0.8 }}>Available Balance</p>
                    <p style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>{fmt(summary?.net_earnings || "0")}</p>
                </div>
                <div style={{ background: "linear-gradient(135deg, #d97706, #b45309)", borderRadius: 14, padding: 24, color: "#fff" }}>
                    <p style={{ fontSize: 13, opacity: 0.8 }}>Pending Payouts</p>
                    <p style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>{fmt(summary?.pending_payouts || "0")}</p>
                </div>
            </div>

            {/* Request Payout */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 24, marginBottom: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#111827" }}>💸 Request Payout</h2>
                {!hasPayoutMethod && (
                    <p style={{ color: "#d97706", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "#fef3c7", borderRadius: 8 }}>
                        ⚠️ <button onClick={() => router.push("/dashboard/settings/payout-methods")} style={{ background: "none", border: "none", color: "#d97706", fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0 }}>Add a payout method</button> before requesting payouts.
                    </p>
                )}
                <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ position: "relative", flex: 1 }}>
                        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: 600 }}>$</span>
                        <input
                            type="number" step="0.01" min="1" placeholder="0.00" value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={{
                                width: "100%", padding: "12px 14px 12px 28px", borderRadius: 8,
                                border: "1px solid #e5e7eb", fontSize: 16, outline: "none",
                            }}
                        />
                    </div>
                    <button
                        onClick={requestPayout} disabled={requesting || !amount || !hasPayoutMethod}
                        style={{
                            padding: "12px 28px", borderRadius: 10, border: "none",
                            background: requesting ? "#d1d5db" : "linear-gradient(135deg, #f97316, #ea580c)",
                            color: "#fff", fontWeight: 600, cursor: requesting ? "not-allowed" : "pointer",
                        }}
                    >
                        {requesting ? "Requesting..." : "Request"}
                    </button>
                </div>
            </div>

            {/* Payout History */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb" }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Payout History</h2>
                </div>
                {loading ? (
                    <div style={{ padding: 48, textAlign: "center" }}>
                        <div style={{ width: 36, height: 36, border: "4px solid #e5e7eb", borderTop: "4px solid #f97316", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : payouts.length === 0 ? (
                    <p style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>No payouts requested yet.</p>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f9fafb" }}>
                                {["Amount", "Status", "Requested", "Processed", "Notes"].map((h) => (
                                    <th key={h} style={{ padding: "10px 14px", fontSize: 12, fontWeight: 500, color: "#6b7280", textAlign: h === "Amount" ? "right" : "left" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {payouts.map((p) => {
                                const st = statusStyle[p.status] || statusStyle.pending;
                                return (
                                    <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                        <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, textAlign: "right" }}>{fmt(p.amount)}</td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 999, fontWeight: 500, background: st.bg, color: st.color, textTransform: "capitalize" }}>{p.status}</span>
                                        </td>
                                        <td style={{ padding: "12px 14px", fontSize: 13, color: "#6b7280" }}>{new Date(p.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: "12px 14px", fontSize: 13, color: "#6b7280" }}>{p.processed_at ? new Date(p.processed_at).toLocaleDateString() : "—"}</td>
                                        <td style={{ padding: "12px 14px", fontSize: 13, color: "#6b7280" }}>{p.notes || "—"}</td>
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
