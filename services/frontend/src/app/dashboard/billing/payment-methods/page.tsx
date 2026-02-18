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
}

export default function PaymentMethodsPage() {
    const { token } = useAuth();
    const [methods, setMethods] = useState<PM[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(true);

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

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this payment method?")) return;
        await fetch(`${API}/payment-methods/${id}`, {
            method: "DELETE", headers: { Authorization: `Bearer ${token}` },
        });
        load();
    };

    const handleSetDefault = async (id: string) => {
        await fetch(`${API}/payment-methods/${id}/default`, {
            method: "POST", headers: { Authorization: `Bearer ${token}` },
        });
        load();
    };

    const brandIcon = (brand: string) => {
        const b = brand.toLowerCase();
        if (b.includes("visa")) return "💳";
        if (b.includes("master")) return "💳";
        if (b.includes("amex")) return "💳";
        return "🏦";
    };

    return (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827" }}>Payment Methods</h1>
                    <p style={{ color: "#6b7280", marginTop: 4 }}>Manage your saved cards for billing</p>
                </div>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    style={{
                        padding: "10px 24px", borderRadius: 10, border: "none",
                        background: "linear-gradient(135deg, #f97316, #ea580c)", color: "#fff",
                        fontWeight: 600, cursor: "pointer", fontSize: 14,
                    }}
                >
                    {showAdd ? "Cancel" : "+ Add Card"}
                </button>
            </div>

            {/* ── Add Card Form ── */}
            {showAdd && (
                <Elements stripe={getStripe()}>
                    <AddCardForm token={token!} onSuccess={() => { setShowAdd(false); load(); }} />
                </Elements>
            )}

            {/* ── Cards List ── */}
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
                    <p style={{ color: "#6b7280", marginTop: 8 }}>No payment methods yet. Add a card to get started.</p>
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
                                <span style={{ fontSize: 32 }}>{brandIcon(pm.provider)}</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 16, textTransform: "capitalize" }}>
                                        {pm.provider} •••• {pm.last_four}
                                    </div>
                                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                                        {pm.expiry || "No expiry"}
                                        {pm.is_default && <span style={{ marginLeft: 8, color: "#f97316", fontWeight: 600 }}>★ Default</span>}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
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
                                    onClick={() => handleDelete(pm.id)}
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
        </div>
    );
}

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
            // Step 1: Create SetupIntent on backend
            const siRes = await fetch(`${API}/payment-methods/setup-intent`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });
            if (!siRes.ok) throw new Error("Failed to create setup intent");
            const { data: si } = await siRes.json();

            // Step 2: Confirm SetupIntent with Stripe Elements
            const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(si.client_secret, {
                payment_method: { card: elements.getElement(CardElement)! },
            });

            if (stripeError) {
                setError(stripeError.message || "Card verification failed");
                setSaving(false);
                return;
            }

            // Step 3: Save payment method to backend
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
        <form onSubmit={handleSubmit} style={{
            background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
            padding: 24, marginBottom: 24,
        }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#111827" }}>Add a new card</h3>

            <div style={{
                padding: 14, borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 16,
                background: "#f9fafb",
            }}>
                <CardElement options={{
                    style: {
                        base: {
                            fontSize: "16px", color: "#111827",
                            "::placeholder": { color: "#9ca3af" },
                        },
                    },
                }} />
            </div>

            {error && (
                <div style={{
                    padding: "10px 14px", borderRadius: 8, background: "#fef2f2",
                    color: "#dc2626", fontSize: 14, marginBottom: 16,
                }}>
                    {error}
                </div>
            )}

            <button type="submit" disabled={!stripe || saving} style={{
                width: "100%", padding: "12px 24px", borderRadius: 10, border: "none",
                background: saving ? "#d1d5db" : "linear-gradient(135deg, #f97316, #ea580c)",
                color: "#fff", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontSize: 15,
            }}>
                {saving ? "Saving..." : "Save Card"}
            </button>

            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 12, textAlign: "center" }}>
                🔒 Your card info is securely processed by Stripe. We never store your full card details.
            </p>
        </form>
    );
}
