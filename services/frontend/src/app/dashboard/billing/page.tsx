"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

const PAYOUT_ICONS: Record<string, string> = {
    bank_transfer: "🏦",
    wire_transfer: "🌐",
    paypal: "🅿️",
    card: "💳",
};

interface BillingSummary {
    escrow_balance: string;
    month_spending: string;
    total_funded: string;
    total_released: string;
    total_fees_paid: string;
    total_earned: string;
    total_commission: string;
    net_earnings: string;
    pending_payouts: string;
    active_contracts: number;
}

interface PaymentMethod {
    id: string;
    type: string;
    provider: string;
    last_four: string;
    expiry: string | null;
    is_default: boolean;
    is_active?: boolean;
    metadata?: Record<string, string> | null;
}

interface Transaction {
    id: string;
    contract_id: string;
    milestone_id: string | null;
    type: string;
    amount: string;
    currency: string;
    status: string;
    gateway_reference: string | null;
    job_title: string;
    created_at: string;
}

const TX_TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    fund: { label: "Escrow Funded", color: "#3b82f6", icon: "💰" },
    release: { label: "Released", color: "#22c55e", icon: "✅" },
    refund: { label: "Refunded", color: "#f59e0b", icon: "↩️" },
    platform_fee: { label: "Commission", color: "#8b5cf6", icon: "🏷️" },
    client_fee: { label: "Service Fee", color: "#ef4444", icon: "📋" },
    dispute_hold: { label: "Dispute Hold", color: "#ef4444", icon: "⚠️" },
};

export default function BillingPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [summary, setSummary] = useState<BillingSummary | null>(null);
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const isClient = user?.role === "client";

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [sumRes, pmRes, txRes] = await Promise.all([
                fetch(`${API}/billing/summary`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/payment-methods`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/billing/transactions?per_page=10`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (sumRes.ok) setSummary((await sumRes.json()).data);
            if (pmRes.ok) setMethods((await pmRes.json()).data);
            if (txRes.ok) setTransactions((await txRes.json()).data);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [token]);

    useEffect(() => { load(); }, [load]);

    const fmt = (v: string | undefined) => "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

    if (loading) return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
            <div style={{ width: 40, height: 40, border: "4px solid #e5e7eb", borderTop: "4px solid #f97316", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    /* Payout methods summary for freelancers */
    const payoutMethods = methods.filter(m => m.type === "bank_transfer" || m.type === "wire_transfer" || m.type === "paypal");
    const defaultPayout = payoutMethods.find(m => m.is_default) || payoutMethods[0];

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827" }}>Billing & Payments</h1>
                    <p style={{ color: "#6b7280", marginTop: 4 }}>Manage payments, view transactions, and track earnings</p>
                </div>
            </div>

            {/* ── Payout Status (freelancer only) ── */}
            {!isClient && (
                <div style={{
                    borderRadius: 14, border: "1px solid #e5e7eb", marginBottom: 24, overflow: "hidden",
                    background: defaultPayout
                        ? "linear-gradient(135deg, #ecfdf5, #d1fae5)"
                        : "linear-gradient(135deg, #fff7ed, #ffedd5)",
                    borderColor: defaultPayout ? "#6ee7b7" : "#fdba74",
                }}>
                    <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            background: defaultPayout ? "#059669" : "#f97316",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 22, color: "#fff",
                        }}>
                            {defaultPayout ? "✅" : "💳"}
                        </div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>
                                {defaultPayout ? "Payouts Active" : "Set Up Payouts"}
                            </h3>
                            {defaultPayout ? (
                                <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
                                    Default: {PAYOUT_ICONS[defaultPayout.type] || "💳"}{" "}
                                    {defaultPayout.type === "paypal" ? "PayPal" : defaultPayout.type === "bank_transfer" ? "Bank (ACH)" : "Wire Transfer"}
                                    {defaultPayout.last_four ? ` •••• ${defaultPayout.last_four}` : ""}
                                    {defaultPayout.provider ? ` · ${defaultPayout.provider}` : ""}
                                </p>
                            ) : (
                                <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
                                    Add a bank account or PayPal to receive payouts for completed work.
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => router.push("/dashboard/settings/payout-methods")}
                            style={{
                                padding: "10px 20px", borderRadius: 10, border: "none",
                                background: defaultPayout ? "#fff" : "linear-gradient(135deg, #f97316, #ea580c)",
                                color: defaultPayout ? "#374151" : "#fff",
                                fontWeight: 600, fontSize: 14, cursor: "pointer",
                                boxShadow: defaultPayout ? "0 1px 3px rgba(0,0,0,0.1)" : "0 4px 16px rgba(249,115,22,0.3)",
                                transition: "all 0.15s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
                        >
                            {defaultPayout ? "Manage Payout Methods →" : "Set Up Payouts →"}
                        </button>
                    </div>
                    {defaultPayout && payoutMethods.length > 1 && (
                        <div style={{
                            padding: "10px 24px", borderTop: "1px solid rgba(0,0,0,0.06)",
                            background: "rgba(255,255,255,0.5)", fontSize: 13, color: "#374151",
                            display: "flex", gap: 16, flexWrap: "wrap",
                        }}>
                            {payoutMethods.map(m => (
                                <span key={m.id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    {PAYOUT_ICONS[m.type] || "💳"}
                                    {m.type === "paypal" ? "PayPal" : m.type === "bank_transfer" ? "Bank" : "Wire"}
                                    {m.last_four ? ` ••${m.last_four}` : ""}
                                    {m.is_default && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 999, background: "#dcfce7", color: "#16a34a", fontWeight: 600, marginLeft: 4 }}>Default</span>}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Summary Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
                {isClient ? (
                    <>
                        <SummaryCard label="Escrow Balance" value={fmt(summary?.escrow_balance)} icon="🔒" color="#3b82f6" />
                        <SummaryCard label="This Month" value={fmt(summary?.month_spending)} icon="📅" color="#8b5cf6" />
                        <SummaryCard label="Total Funded" value={fmt(summary?.total_funded)} icon="💰" color="#22c55e" />
                        <SummaryCard label="Fees Paid" value={fmt(summary?.total_fees_paid)} icon="📋" color="#ef4444" />
                    </>
                ) : (
                    <>
                        <SummaryCard label="Net Earnings" value={fmt(summary?.net_earnings)} icon="💵" color="#22c55e" />
                        <SummaryCard label="Total Earned" value={fmt(summary?.total_earned)} icon="💰" color="#3b82f6" />
                        <SummaryCard label="Commission Paid" value={fmt(summary?.total_commission)} icon="🏷️" color="#8b5cf6" />
                        <SummaryCard label="Pending Payouts" value={fmt(summary?.pending_payouts)} icon="⏳" color="#f59e0b" />
                    </>
                )}
                <SummaryCard label="Active Contracts" value={String(summary?.active_contracts ?? 0)} icon="📄" color="#6366f1" />
            </div>

            {/* ── Quick Actions ── */}
            <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
                <ActionButton label="Payment Methods" icon="💳" onClick={() => router.push("/dashboard/billing/payment-methods")} />
                <ActionButton label="Invoices" icon="📄" onClick={() => router.push("/dashboard/billing/invoices")} />
                <ActionButton label="All Transactions" icon="📊" onClick={() => router.push("/dashboard/billing/transactions")} />
                {!isClient && <ActionButton label="Payouts" icon="💸" onClick={() => router.push("/dashboard/billing/payouts")} />}
            </div>

            {/* ── Payment Methods Preview ── */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 24, marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827" }}>💳 Payment Methods</h2>
                    <button
                        onClick={() => router.push("/dashboard/billing/payment-methods")}
                        style={{ fontSize: 14, color: "#f97316", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
                    >
                        Manage →
                    </button>
                </div>
                {methods.length === 0 ? (
                    <p style={{ color: "#9ca3af", fontSize: 14 }}>No payment methods saved. Add one to start funding milestones.</p>
                ) : (
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {methods.slice(0, 3).map((pm) => (
                            <div key={pm.id} style={{
                                padding: "12px 20px", borderRadius: 10, border: pm.is_default ? "2px solid #f97316" : "1px solid #e5e7eb",
                                background: pm.is_default ? "#fff7ed" : "#f9fafb", display: "flex", alignItems: "center", gap: 12
                            }}>
                                <span style={{ fontSize: 24 }}>{pm.type === "card" ? "💳" : "🏦"}</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14, textTransform: "capitalize" }}>{pm.provider} •••• {pm.last_four}</div>
                                    <div style={{ fontSize: 12, color: "#6b7280" }}>{pm.expiry || "No expiry"} {pm.is_default && "• Default"}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Recent Transactions ── */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827" }}>📊 Recent Transactions</h2>
                    <button
                        onClick={() => router.push("/dashboard/billing/transactions")}
                        style={{ fontSize: 14, color: "#f97316", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
                    >
                        View all →
                    </button>
                </div>
                {transactions.length === 0 ? (
                    <p style={{ color: "#9ca3af", fontSize: 14 }}>No transactions yet.</p>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Type</th>
                                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Job</th>
                                <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Amount</th>
                                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Status</th>
                                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => {
                                const info = TX_TYPE_LABELS[tx.type] || { label: tx.type, color: "#6b7280", icon: "•" };
                                return (
                                    <tr key={tx.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                        <td style={{ padding: "10px 12px", fontSize: 14 }}>
                                            <span>{info.icon} </span>
                                            <span style={{ color: info.color, fontWeight: 500 }}>{info.label}</span>
                                        </td>
                                        <td style={{ padding: "10px 12px", fontSize: 14, color: "#374151", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {tx.job_title}
                                        </td>
                                        <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 600, textAlign: "right", color: tx.type === "refund" ? "#f59e0b" : "#111827" }}>
                                            {fmt(tx.amount)}
                                        </td>
                                        <td style={{ padding: "10px 12px" }}>
                                            <span style={{
                                                fontSize: 12, padding: "2px 8px", borderRadius: 999, fontWeight: 500,
                                                background: tx.status === "completed" ? "#dcfce7" : tx.status === "failed" ? "#fef2f2" : "#fef3c7",
                                                color: tx.status === "completed" ? "#16a34a" : tx.status === "failed" ? "#dc2626" : "#d97706",
                                            }}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "10px 12px", fontSize: 13, color: "#6b7280" }}>
                                            {new Date(tx.created_at).toLocaleDateString()}
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

function SummaryCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
    return (
        <div style={{
            background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
            padding: 20, display: "flex", alignItems: "center", gap: 14,
        }}>
            <div style={{
                width: 44, height: 44, borderRadius: 10, background: color + "15",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{value}</div>
            </div>
        </div>
    );
}

function ActionButton({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff",
                cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151",
                transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#f97316"; e.currentTarget.style.color = "#f97316"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; }}
        >
            <span style={{ fontSize: 18 }}>{icon}</span> {label}
        </button>
    );
}
