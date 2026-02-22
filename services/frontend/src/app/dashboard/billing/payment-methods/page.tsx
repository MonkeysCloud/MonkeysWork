"use client";

import { useState, useEffect, useCallback } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";
const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

let stripePromise: Promise<Stripe | null>;
const getStripe = () => {
    if (!stripePromise) stripePromise = loadStripe(STRIPE_KEY);
    return stripePromise;
};

interface PM {
    id: string; type: string; provider: string; last_four: string;
    expiry: string | null; is_default: boolean; stripe_payment_method_id: string;
    verified?: boolean;
    [key: string]: unknown;
}

type AddMode = "card" | "bank" | "paypal" | null;

const METHOD_TABS: { key: AddMode & string; label: string; icon: string; desc: string }[] = [
    { key: "card", label: "Credit / Debit Card", icon: "💳", desc: "Visa, Mastercard, Amex" },
    { key: "bank", label: "US Bank Account", icon: "🏦", desc: "ACH Direct Debit" },
    { key: "paypal", label: "PayPal", icon: "💸", desc: "Pay with your PayPal account" },
];

export default function PaymentMethodsPage() {
    const { token } = useAuth();
    const [methods, setMethods] = useState<PM[]>([]);
    const [addMode, setAddMode] = useState<AddMode>(null);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<PM | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [verifyTarget, setVerifyTarget] = useState<PM | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [verifyAmounts, setVerifyAmounts] = useState<[string, string]>(["", ""]);
    const [verifyError, setVerifyError] = useState("");
    const [verifySuccess, setVerifySuccess] = useState("");

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/payment-methods`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setMethods((await res.json()).data);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [token]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (pm: PM) => {
        setDeleteTarget(pm);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        await fetch(`${API}/payment-methods/${deleteTarget.id}`, {
            method: "DELETE", headers: { Authorization: `Bearer ${token}` },
        });
        setDeleteTarget(null);
        setDeleting(false);
        load();
    };

    const handleSetDefault = async (id: string) => {
        await fetch(`${API}/payment-methods/${id}/default`, {
            method: "POST", headers: { Authorization: `Bearer ${token}` },
        });
        load();
    };

    const handleVerify = async () => {
        if (!verifyTarget) return;
        setVerifying(true);
        setVerifyError("");
        try {
            const res = await fetch(`${API}/payment-methods/${verifyTarget.id}/verify`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ amounts: [parseInt(verifyAmounts[0]), parseInt(verifyAmounts[1])] }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Verification failed");
            }
            setVerifySuccess("Bank account verified successfully! ✅");
            setVerifyTarget(null);
            setVerifyAmounts(["", ""]);
            load();
            setTimeout(() => setVerifySuccess(""), 4000);
        } catch (err: unknown) {
            setVerifyError(err instanceof Error ? err.message : "Verification failed");
        }
        setVerifying(false);
    };

    const methodIcon = (pm: PM) => {
        const p = pm.provider?.toLowerCase() || pm.type?.toLowerCase() || "";
        if (p.includes("paypal")) return "💸";
        if (p.includes("bank") || p.includes("ach") || pm.type === "us_bank_account") return "🏦";
        return "💳";
    };

    const methodLabel = (pm: PM) => {
        const p = pm.provider?.toLowerCase() || pm.type?.toLowerCase() || "";
        if (p.includes("paypal")) return "PayPal";
        if (p.includes("bank") || p.includes("ach") || pm.type === "us_bank_account") return "Bank Account";
        return pm.provider || "Card";
    };

    const onSuccess = () => { setAddMode(null); load(); };

    return (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827" }}>Payment Methods</h1>
                    <p style={{ color: "#6b7280", marginTop: 4 }}>Manage your cards, bank accounts, and PayPal</p>
                </div>
                <button
                    onClick={() => setAddMode(addMode ? null : "card")}
                    style={{
                        padding: "10px 24px", borderRadius: 10, border: "none",
                        background: addMode ? "#6b7280" : "linear-gradient(135deg, #f97316, #ea580c)",
                        color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14,
                    }}
                >
                    {addMode ? "Cancel" : "+ Add Method"}
                </button>
            </div>

            {/* ── Success Banner ── */}
            {verifySuccess && (
                <div style={{
                    padding: "12px 16px", borderRadius: 10, background: "#f0fdf4",
                    border: "1px solid #bbf7d0", color: "#16a34a", fontSize: 14,
                    fontWeight: 600, marginBottom: 16, textAlign: "center",
                }}>{verifySuccess}</div>
            )}

            {/* ── Add Method Panel ── */}
            {addMode && (
                <div style={{
                    background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb",
                    padding: 24, marginBottom: 24,
                }}>
                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                        {METHOD_TABS.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setAddMode(t.key as AddMode)}
                                style={{
                                    flex: 1, padding: "12px 8px", borderRadius: 10,
                                    border: addMode === t.key ? "2px solid #f97316" : "1px solid #e5e7eb",
                                    background: addMode === t.key ? "#fff7ed" : "#fff",
                                    cursor: "pointer", textAlign: "center", transition: "all 0.15s",
                                }}
                            >
                                <div style={{ fontSize: 24 }}>{t.icon}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginTop: 4 }}>{t.label}</div>
                                <div style={{ fontSize: 11, color: "#9ca3af" }}>{t.desc}</div>
                            </button>
                        ))}
                    </div>

                    {/* Form based on selected tab */}
                    {addMode === "card" && (
                        <Elements stripe={getStripe()}>
                            <AddCardForm token={token!} onSuccess={onSuccess} />
                        </Elements>
                    )}
                    {addMode === "bank" && (
                        <Elements stripe={getStripe()}>
                            <AddBankForm token={token!} onSuccess={onSuccess} />
                        </Elements>
                    )}
                    {addMode === "paypal" && (
                        <AddPayPalForm token={token!} onSuccess={onSuccess} />
                    )}
                </div>
            )}

            {/* ── Methods List ── */}
            {loading ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                    <div style={{ width: 36, height: 36, border: "4px solid #e5e7eb", borderTop: "4px solid #f97316", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : methods.length === 0 ? (
                <div style={{
                    background: "#fff", borderRadius: 12, border: "2px dashed #e5e7eb",
                    padding: "48px 24px", textAlign: "center",
                }}>
                    <p style={{ fontSize: 48 }}>💳</p>
                    <p style={{ color: "#6b7280", marginTop: 8 }}>No payment methods yet. Add a card, bank account, or PayPal to get started.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {methods.map((pm) => (
                        <div key={pm.id} style={{
                            background: "#fff", borderRadius: 12, padding: "16px 24px",
                            border: pm.is_default ? "2px solid #f97316" : "1px solid #e5e7eb",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                <span style={{ fontSize: 32 }}>{methodIcon(pm)}</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 16, textTransform: "capitalize" }}>
                                        {methodLabel(pm)} {pm.last_four ? `•••• ${pm.last_four}` : ""}
                                    </div>
                                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                                        {pm.expiry || (pm.type === "us_bank_account" ? "ACH Direct Debit" : pm.type === "paypal" ? "PayPal Account" : "No expiry")}
                                        {pm.is_default && <span style={{ marginLeft: 8, color: "#f97316", fontWeight: 600 }}>★ Default</span>}
                                        {pm.type === "us_bank_account" && pm.verified === false && (
                                            <span style={{
                                                marginLeft: 8, color: "#f59e0b", fontWeight: 600,
                                                background: "#fffbeb", padding: "2px 8px", borderRadius: 6,
                                                fontSize: 12, border: "1px solid #fde68a",
                                            }}>⚠ Pending Verification</span>
                                        )}
                                        {pm.type === "us_bank_account" && pm.verified !== false && (
                                            <span style={{
                                                marginLeft: 8, color: "#16a34a", fontWeight: 600,
                                                fontSize: 12,
                                            }}>✓ Verified</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                {pm.type === "us_bank_account" && pm.verified === false && (
                                    <button
                                        onClick={() => { setVerifyTarget(pm); setVerifyError(""); setVerifyAmounts(["", ""]); }}
                                        style={{
                                            padding: "6px 14px", borderRadius: 8, border: "1px solid #fde68a",
                                            background: "#fffbeb", fontSize: 13, cursor: "pointer",
                                            color: "#92400e", fontWeight: 600,
                                        }}
                                    >Verify</button>
                                )}
                                {!pm.is_default && (
                                    <button
                                        onClick={() => handleSetDefault(pm.id)}
                                        style={{
                                            padding: "6px 14px", borderRadius: 8, border: "1px solid #e5e7eb",
                                            background: "#fff", fontSize: 13, cursor: "pointer", color: "#374151",
                                        }}
                                    >
                                        Set Default
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(pm)}
                                    style={{
                                        padding: "6px 14px", borderRadius: 8, border: "1px solid #fecaca",
                                        background: "#fff", fontSize: 13, cursor: "pointer", color: "#dc2626",
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Delete Confirmation Modal ── */}
            {deleteTarget && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 9999,
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}
                    onClick={() => !deleting && setDeleteTarget(null)}
                >
                    {/* Backdrop */}
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />

                    {/* Modal */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: "relative", background: "#fff", borderRadius: 16,
                            padding: "28px 32px", width: "100%", maxWidth: 420,
                            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                        }}
                    >
                        <div style={{ textAlign: "center", marginBottom: 20 }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: "50%",
                                background: "#fef2f2", display: "flex", alignItems: "center",
                                justifyContent: "center", margin: "0 auto 12px", fontSize: 28,
                            }}>🗑️</div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
                                Remove Payment Method?
                            </h3>
                            <p style={{ fontSize: 14, color: "#6b7280", marginTop: 8, lineHeight: 1.5 }}>
                                Are you sure you want to remove <strong>{methodLabel(deleteTarget)} {deleteTarget.last_four ? `•••• ${deleteTarget.last_four}` : ""}</strong>?
                                This action cannot be undone.
                            </p>
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                style={{
                                    flex: 1, padding: "11px 20px", borderRadius: 10,
                                    border: "1px solid #e5e7eb", background: "#fff",
                                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                                    color: "#374151",
                                }}
                            >Cancel</button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleting}
                                style={{
                                    flex: 1, padding: "11px 20px", borderRadius: 10,
                                    border: "none",
                                    background: deleting ? "#f87171" : "linear-gradient(135deg, #ef4444, #dc2626)",
                                    fontSize: 14, fontWeight: 600, cursor: deleting ? "wait" : "pointer",
                                    color: "#fff",
                                }}
                            >{deleting ? "Removing…" : "Remove"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Bank Verification Modal ── */}
            {verifyTarget && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 9999,
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}
                    onClick={() => !verifying && setVerifyTarget(null)}
                >
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: "relative", background: "#fff", borderRadius: 16,
                            padding: "28px 32px", width: "100%", maxWidth: 440,
                            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                        }}
                    >
                        <div style={{ textAlign: "center", marginBottom: 20 }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: "50%",
                                background: "#eff6ff", display: "flex", alignItems: "center",
                                justifyContent: "center", margin: "0 auto 12px", fontSize: 28,
                            }}>🏦</div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
                                Verify Bank Account
                            </h3>
                            <p style={{ fontSize: 14, color: "#6b7280", marginTop: 8, lineHeight: 1.5 }}>
                                Enter the two microdeposit amounts (in cents) that were deposited into your <strong>{methodLabel(verifyTarget)} •••• {verifyTarget.last_four}</strong> account.
                            </p>
                        </div>

                        <div style={{
                            padding: "10px 14px", borderRadius: 8, background: "#eff6ff",
                            color: "#1d4ed8", fontSize: 13, marginBottom: 16, lineHeight: 1.5,
                        }}>
                            ℹ️ Stripe sends two small deposits (e.g. $0.32 and $0.45). Enter the amounts in cents (e.g. 32 and 45).
                        </div>

                        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Amount 1 (cents)</label>
                                <input
                                    type="number" min="1" max="99" placeholder="e.g. 32"
                                    value={verifyAmounts[0]} onChange={(e) => setVerifyAmounts([e.target.value, verifyAmounts[1]])}
                                    style={{
                                        width: "100%", padding: "10px 14px", borderRadius: 8,
                                        border: "1px solid #e5e7eb", fontSize: 15, background: "#f9fafb",
                                        outline: "none", boxSizing: "border-box",
                                    }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Amount 2 (cents)</label>
                                <input
                                    type="number" min="1" max="99" placeholder="e.g. 45"
                                    value={verifyAmounts[1]} onChange={(e) => setVerifyAmounts([verifyAmounts[0], e.target.value])}
                                    style={{
                                        width: "100%", padding: "10px 14px", borderRadius: 8,
                                        border: "1px solid #e5e7eb", fontSize: 15, background: "#f9fafb",
                                        outline: "none", boxSizing: "border-box",
                                    }}
                                />
                            </div>
                        </div>

                        {verifyError && (
                            <div style={{
                                padding: "10px 14px", borderRadius: 8, background: "#fef2f2",
                                color: "#dc2626", fontSize: 14, marginBottom: 16,
                            }}>{verifyError}</div>
                        )}

                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                onClick={() => setVerifyTarget(null)}
                                disabled={verifying}
                                style={{
                                    flex: 1, padding: "11px 20px", borderRadius: 10,
                                    border: "1px solid #e5e7eb", background: "#fff",
                                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                                    color: "#374151",
                                }}
                            >Cancel</button>
                            <button
                                onClick={handleVerify}
                                disabled={verifying || !verifyAmounts[0] || !verifyAmounts[1]}
                                style={{
                                    flex: 1, padding: "11px 20px", borderRadius: 10,
                                    border: "none",
                                    background: (verifying || !verifyAmounts[0] || !verifyAmounts[1])
                                        ? "#93c5fd" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                                    fontSize: 14, fontWeight: 600,
                                    cursor: (verifying || !verifyAmounts[0] || !verifyAmounts[1]) ? "not-allowed" : "pointer",
                                    color: "#fff",
                                }}
                            >{verifying ? "Verifying…" : "Verify Account"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─────────────── Add Card Form ─────────────── */

function AddCardForm({ token, onSuccess }: { token: string; onSuccess: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setSaving(true);
        setError("");

        try {
            const siRes = await fetch(`${API}/payment-methods/setup-intent`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });
            if (!siRes.ok) throw new Error("Failed to create setup intent");
            const { data: si } = await siRes.json();

            const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(si.client_secret, {
                payment_method: { card: elements.getElement(CardElement)! },
            });

            if (stripeError) { setError(stripeError.message || "Card verification failed"); setSaving(false); return; }

            const saveRes = await fetch(`${API}/payment-methods`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ payment_method_id: setupIntent?.payment_method }),
            });
            if (!saveRes.ok) throw new Error("Failed to save payment method");
            onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        }
        setSaving(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#111827" }}>💳 Add Credit / Debit Card</h3>
            <div style={{ padding: 14, borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 16, background: "#f9fafb" }}>
                <CardElement options={{ style: { base: { fontSize: "16px", color: "#111827", "::placeholder": { color: "#9ca3af" } } } }} />
            </div>
            {error && <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontSize: 14, marginBottom: 16 }}>{error}</div>}
            <SubmitBtn saving={saving} disabled={!stripe || saving} label="Save Card" />
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 12, textAlign: "center" }}>🔒 Securely processed by Stripe</p>
        </form>
    );
}

/* ─────────────── Add US Bank Account Form ─────────────── */

function AddBankForm({ token, onSuccess }: { token: string; onSuccess: () => void }) {
    const stripe = useStripe();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [accountHolder, setAccountHolder] = useState("");
    const [routingNumber, setRoutingNumber] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountType, setAccountType] = useState<"checking" | "savings">("checking");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe) return;
        setSaving(true);
        setError("");

        try {
            // Create setup intent for us_bank_account
            const siRes = await fetch(`${API}/payment-methods/setup-intent`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ type: "us_bank_account" }),
            });
            if (!siRes.ok) throw new Error("Failed to create setup intent");
            const { data: si } = await siRes.json();

            // Confirm with bank details
            const { error: stripeError, setupIntent } = await stripe.confirmUsBankAccountSetup(si.client_secret, {
                payment_method: {
                    us_bank_account: {
                        routing_number: routingNumber,
                        account_number: accountNumber,
                        account_holder_type: "individual",
                        account_type: accountType,
                    },
                    billing_details: {
                        name: accountHolder,
                    },
                },
            });

            if (stripeError) { setError(stripeError.message || "Bank verification failed"); setSaving(false); return; }

            // Save to backend
            const saveRes = await fetch(`${API}/payment-methods`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    payment_method_id: setupIntent?.payment_method,
                    setup_intent_id: setupIntent?.id,
                    type: "us_bank_account",
                }),
            });
            if (!saveRes.ok) throw new Error("Failed to save bank account");
            onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        }
        setSaving(false);
    };

    const inputStyle = {
        width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb",
        fontSize: 15, background: "#f9fafb", outline: "none", boxSizing: "border-box" as const,
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#111827" }}>🏦 Add US Bank Account</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4, display: "block" }}>Account Holder Name</label>
                    <input
                        required value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)}
                        placeholder="Full legal name" style={inputStyle}
                    />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4, display: "block" }}>Routing Number</label>
                        <input
                            required value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
                            placeholder="e.g. 110000000" maxLength={9} style={inputStyle}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4, display: "block" }}>Account Number</label>
                        <input
                            required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                            placeholder="Account number" style={inputStyle}
                        />
                    </div>
                </div>
                <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4, display: "block" }}>Account Type</label>
                    <div style={{ display: "flex", gap: 8 }}>
                        {(["checking", "savings"] as const).map((t) => (
                            <button
                                key={t} type="button" onClick={() => setAccountType(t)}
                                style={{
                                    flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer",
                                    border: accountType === t ? "2px solid #f97316" : "1px solid #e5e7eb",
                                    background: accountType === t ? "#fff7ed" : "#fff",
                                    fontWeight: 600, fontSize: 14, color: accountType === t ? "#ea580c" : "#6b7280",
                                    textTransform: "capitalize",
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {error && <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontSize: 14, marginBottom: 16 }}>{error}</div>}
            <SubmitBtn saving={saving} disabled={!stripe || saving || !accountHolder || !routingNumber || !accountNumber} label="Save Bank Account" />
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 12, textAlign: "center" }}>🔒 Bank verification via Stripe ACH. Microdeposits may be required.</p>
        </form>
    );
}

/* ─────────────── Add PayPal Form ─────────────── */

function AddPayPalForm({ token, onSuccess }: { token: string; onSuccess: () => void }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            const res = await fetch(`${API}/payment-methods`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "paypal",
                    paypal_email: email,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to save PayPal");
            }
            onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        }
        setSaving(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#111827" }}>💸 Add PayPal Account</h3>
            <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4, display: "block" }}>PayPal Email Address</label>
                <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@paypal-email.com"
                    style={{
                        width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid #e5e7eb",
                        fontSize: 15, background: "#f9fafb", outline: "none", boxSizing: "border-box",
                    }}
                />
            </div>
            <div style={{
                padding: "10px 14px", borderRadius: 8, background: "#eff6ff",
                color: "#1d4ed8", fontSize: 13, marginBottom: 16,
            }}>
                ℹ️ We&apos;ll use this email to process payments through PayPal. Make sure it matches your active PayPal account.
            </div>
            {error && <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontSize: 14, marginBottom: 16 }}>{error}</div>}
            <SubmitBtn saving={saving} disabled={saving || !email} label="Save PayPal" />
        </form>
    );
}

/* ─────────────── Shared Submit Button ─────────────── */

function SubmitBtn({ saving, disabled, label }: { saving: boolean; disabled: boolean; label: string }) {
    return (
        <button type="submit" disabled={disabled} style={{
            width: "100%", padding: "12px 24px", borderRadius: 10, border: "none",
            background: disabled ? "#d1d5db" : "linear-gradient(135deg, #f97316, #ea580c)",
            color: "#fff", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", fontSize: 15,
        }}>
            {saving ? "Saving..." : label}
        </button>
    );
}
