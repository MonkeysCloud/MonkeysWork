"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface ConnectStatus {
    status: "not_started" | "pending" | "complete";
    account_id: string | null;
    onboarded: boolean;
    requirements: {
        currently_due?: string[];
        past_due?: string[];
        pending?: string[];
        disabled_reason?: string | null;
    };
}

type Step = "idle" | "identity" | "bank" | "done";

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: "1px solid #d1d5db", fontSize: 14, outline: "none",
    background: "#fff", color: "#111827",
};

const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "#374151", marginBottom: 4,
};

export default function PayoutSetup() {
    const { token } = useAuth();
    const [status, setStatus] = useState<ConnectStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState<Step>("idle");
    const [error, setError] = useState("");

    // Identity form
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [dobDay, setDobDay] = useState("");
    const [dobMonth, setDobMonth] = useState("");
    const [dobYear, setDobYear] = useState("");
    const [ssnLast4, setSsnLast4] = useState("");
    const [phone, setPhone] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [addressCity, setAddressCity] = useState("");
    const [addressState, setAddressState] = useState("");
    const [addressPostalCode, setAddressPostalCode] = useState("");

    // Bank form
    const [routingNumber, setRoutingNumber] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountHolderName, setAccountHolderName] = useState("");

    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const fetchStatus = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/connect/status`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const d = await res.json();
                setStatus(d.data);
                if (d.data.status === "complete") setStep("done");
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [token]);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    /* ─── Step 1: Create account + go to identity ─── */
    const startOnboarding = async () => {
        setSaving(true); setError("");
        try {
            const res = await fetch(`${API}/connect/create-account`, { method: "POST", headers });
            const d = await res.json();
            if (!res.ok) { setError(d.message || "Failed"); setSaving(false); return; }
            setStep("identity");
            fetchStatus();
        } catch (e) { setError("Network error"); }
        setSaving(false);
    };

    /* ─── Step 2: Submit identity ─── */
    const submitIdentity = async () => {
        if (!firstName || !lastName) { setError("Name is required"); return; }
        setSaving(true); setError("");
        try {
            const res = await fetch(`${API}/connect/update-identity`, {
                method: "POST", headers,
                body: JSON.stringify({
                    first_name: firstName, last_name: lastName,
                    dob_day: dobDay, dob_month: dobMonth, dob_year: dobYear,
                    ssn_last_4: ssnLast4, phone,
                    address_line1: addressLine1, address_city: addressCity,
                    address_state: addressState, address_postal_code: addressPostalCode,
                    address_country: "US",
                }),
            });
            const d = await res.json();
            if (!res.ok) { setError(d.message || "Failed"); setSaving(false); return; }
            setStep("bank");
        } catch (e) { setError("Network error"); }
        setSaving(false);
    };

    /* ─── Step 3: Add bank account ─── */
    const submitBank = async () => {
        if (!routingNumber || !accountNumber) { setError("Bank details required"); return; }
        setSaving(true); setError("");
        try {
            const res = await fetch(`${API}/connect/add-bank`, {
                method: "POST", headers,
                body: JSON.stringify({
                    routing_number: routingNumber,
                    account_number: accountNumber,
                    account_holder_name: accountHolderName || `${firstName} ${lastName}`,
                }),
            });
            const d = await res.json();
            if (!res.ok) { setError(d.message || "Failed"); setSaving(false); return; }
            setStep("done");
            fetchStatus();
        } catch (e) { setError("Network error"); }
        setSaving(false);
    };

    /* ─── Loading ─── */
    if (loading) {
        return (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 24, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 24, height: 24, border: "3px solid #e5e7eb", borderTop: "3px solid #f97316", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <span style={{ color: "#6b7280", fontSize: 14 }}>Loading payout status...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const isComplete = status?.status === "complete" || step === "done";

    /* ─── Completed state ─── */
    if (isComplete) {
        return (
            <div style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", borderRadius: 14, border: "1px solid #6ee7b7", padding: 24, marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#fff" }}>✅</div>
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>Payouts Active</h3>
                        <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>Your bank account is connected. You&#39;ll receive payouts every Friday.</p>
                    </div>
                    <span style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "#dcfce7", color: "#16a34a" }}>Active</span>
                </div>
                <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.7)", display: "flex", gap: 24, fontSize: 13, color: "#374151" }}>
                    <span>📅 <strong>Monday</strong>: Client charges processed</span>
                    <span>💸 <strong>Friday</strong>: Payouts sent to your bank</span>
                </div>
            </div>
        );
    }

    /* ─── Progress steps ─── */
    const steps = [
        { key: "identity", label: "Personal Info", num: 1 },
        { key: "bank", label: "Bank Account", num: 2 },
        { key: "done", label: "Complete", num: 3 },
    ];
    const currentIdx = step === "identity" ? 0 : step === "bank" ? 1 : -1;

    return (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", marginBottom: 24, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", background: "linear-gradient(135deg, #fff7ed, #ffedd5)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#fff" }}>💳</div>
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>Set Up Payouts</h3>
                        <p style={{ fontSize: 13, color: "#6b7280", margin: "2px 0 0" }}>Connect your bank account to receive weekly payouts</p>
                    </div>
                </div>
            </div>

            <div style={{ padding: 24 }}>
                {/* Step indicator */}
                {step !== "idle" && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                        {steps.map((s, i) => (
                            <div key={s.key} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: "50%", fontSize: 12, fontWeight: 700,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: i <= currentIdx ? "#f97316" : "#e5e7eb",
                                    color: i <= currentIdx ? "#fff" : "#9ca3af",
                                }}>{s.num}</div>
                                <span style={{ fontSize: 13, fontWeight: i === currentIdx ? 700 : 400, color: i <= currentIdx ? "#111827" : "#9ca3af" }}>{s.label}</span>
                                {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < currentIdx ? "#f97316" : "#e5e7eb", borderRadius: 1 }} />}
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontSize: 13, marginBottom: 16, border: "1px solid #fecaca" }}>
                        {error}
                    </div>
                )}

                {/* ── Idle: Start button ── */}
                {step === "idle" && (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
                            Complete a quick 2-step setup to start receiving weekly payouts directly to your bank account.
                        </p>
                        <button onClick={startOnboarding} disabled={saving}
                            style={{
                                padding: "12px 32px", borderRadius: 10, border: "none",
                                background: saving ? "#d1d5db" : "linear-gradient(135deg, #f97316, #ea580c)",
                                color: "#fff", fontWeight: 600, fontSize: 15, cursor: saving ? "not-allowed" : "pointer",
                            }}>
                            {saving ? "Setting up..." : "Get Started →"}
                        </button>
                    </div>
                )}

                {/* ── Step 1: Identity ── */}
                {step === "identity" && (
                    <div>
                        <h4 style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 16 }}>Personal Information</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            <div>
                                <label style={labelStyle}>First Name *</label>
                                <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" />
                            </div>
                            <div>
                                <label style={labelStyle}>Last Name *</label>
                                <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" />
                            </div>
                        </div>

                        <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginTop: 16, marginBottom: 6 }}>Date of Birth</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                            <input style={inputStyle} type="number" placeholder="MM" min="1" max="12" value={dobMonth} onChange={e => setDobMonth(e.target.value)} />
                            <input style={inputStyle} type="number" placeholder="DD" min="1" max="31" value={dobDay} onChange={e => setDobDay(e.target.value)} />
                            <input style={inputStyle} type="number" placeholder="YYYY" min="1920" max="2010" value={dobYear} onChange={e => setDobYear(e.target.value)} />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
                            <div>
                                <label style={labelStyle}>Phone</label>
                                <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555-123-4567" />
                            </div>
                            <div>
                                <label style={labelStyle}>SSN Last 4</label>
                                <input style={inputStyle} maxLength={4} value={ssnLast4} onChange={e => setSsnLast4(e.target.value.replace(/\D/g, ""))} placeholder="1234" />
                            </div>
                        </div>

                        <h4 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "20px 0 12px" }}>Address</h4>
                        <div>
                            <label style={labelStyle}>Street Address *</label>
                            <input style={inputStyle} value={addressLine1} onChange={e => setAddressLine1(e.target.value)} placeholder="123 Main St" />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
                            <div>
                                <label style={labelStyle}>City</label>
                                <input style={inputStyle} value={addressCity} onChange={e => setAddressCity(e.target.value)} placeholder="New York" />
                            </div>
                            <div>
                                <label style={labelStyle}>State</label>
                                <input style={inputStyle} maxLength={2} value={addressState} onChange={e => setAddressState(e.target.value.toUpperCase())} placeholder="NY" />
                            </div>
                            <div>
                                <label style={labelStyle}>ZIP</label>
                                <input style={inputStyle} value={addressPostalCode} onChange={e => setAddressPostalCode(e.target.value)} placeholder="10001" />
                            </div>
                        </div>

                        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
                            <button onClick={submitIdentity} disabled={saving}
                                style={{
                                    padding: "12px 28px", borderRadius: 10, border: "none",
                                    background: saving ? "#d1d5db" : "linear-gradient(135deg, #f97316, #ea580c)",
                                    color: "#fff", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
                                }}>
                                {saving ? "Saving..." : "Continue →"}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Bank Account ── */}
                {step === "bank" && (
                    <div>
                        <h4 style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 16 }}>Bank Account</h4>
                        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                            Enter your U.S. bank account details. Payouts will be deposited here every Friday.
                        </p>

                        <div style={{ display: "grid", gap: 14 }}>
                            <div>
                                <label style={labelStyle}>Account Holder Name</label>
                                <input style={inputStyle} value={accountHolderName} onChange={e => setAccountHolderName(e.target.value)} placeholder={`${firstName} ${lastName}`} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <div>
                                    <label style={labelStyle}>Routing Number *</label>
                                    <input style={inputStyle} maxLength={9} value={routingNumber}
                                        onChange={e => setRoutingNumber(e.target.value.replace(/\D/g, ""))}
                                        placeholder="110000000" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Account Number *</label>
                                    <input style={inputStyle} value={accountNumber}
                                        onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                                        placeholder="000123456789" />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: "#f0f9ff", border: "1px solid #bae6fd", fontSize: 12, color: "#0369a1" }}>
                            🔒 Your bank details are securely transmitted to Stripe and never stored on our servers.
                        </div>

                        <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
                            <button onClick={() => setStep("identity")}
                                style={{ padding: "12px 20px", borderRadius: 10, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer" }}>
                                ← Back
                            </button>
                            <button onClick={submitBank} disabled={saving}
                                style={{
                                    padding: "12px 28px", borderRadius: 10, border: "none",
                                    background: saving ? "#d1d5db" : "linear-gradient(135deg, #f97316, #ea580c)",
                                    color: "#fff", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
                                }}>
                                {saving ? "Saving..." : "Complete Setup ✓"}
                            </button>
                        </div>
                    </div>
                )}

                {/* TOS notice */}
                {(step === "identity" || step === "bank") && (
                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 16, textAlign: "center" }}>
                        By continuing, you agree to Stripe&apos;s <a href="https://stripe.com/connect-account/legal" target="_blank" rel="noreferrer" style={{ color: "#6366f1" }}>Connected Account Agreement</a> and authorize MonkeysWork to process payouts.
                    </p>
                )}
            </div>
        </div>
    );
}
