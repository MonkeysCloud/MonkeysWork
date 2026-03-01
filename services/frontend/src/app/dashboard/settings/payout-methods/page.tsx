"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import COUNTRIES, { type Country } from "@/data/countries";
import { getStatesForCountry } from "@/data/states";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Styling ────────────────────────────────────── */
const inputCls =
    "w-full px-4 py-3 rounded-xl border border-brand-border/60 bg-white text-sm text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all";
const btnPrimary =
    "px-6 py-2.5 rounded-xl bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange/90 transition-all shadow-sm disabled:opacity-50";
const btnOutline =
    "px-4 py-2 rounded-xl border border-brand-border/60 text-sm font-medium text-brand-dark hover:bg-brand-bg transition-all disabled:opacity-50";
const btnDanger =
    "px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition-all";

/* ── Types ──────────────────────────────────────── */
interface PayoutMethod {
    id: string;
    type: string;
    provider: string;
    last_four: string;
    is_default: boolean;
    is_active: boolean;
    expiry: string | null;
    metadata: Record<string, string> | null;
    created_at: string;
}

interface PayoutFormData {
    type: string;
    provider: string;
    last_four: string;
    is_default: boolean;
    metadata: Record<string, string>;
}

/* ── Payout type definitions ────────────────────── */
const PAYOUT_TYPES = [
    {
        value: "bank_transfer",
        label: "Bank Transfer (ACH)",
        icon: "🏦",
        desc: "Direct deposit to your bank account via Stripe",
        fields: [
            { key: "bank_name", label: "Bank Name", placeholder: "e.g. Chase, Wells Fargo" },
            { key: "account_holder", label: "Account Holder Name", placeholder: "Full name on the account" },
            { key: "routing_number", label: "Routing Number", placeholder: "9-digit routing number", mask: true },
            { key: "account_number", label: "Account Number", placeholder: "Account number", mask: true },
        ],
    },
    {
        value: "paypal",
        label: "PayPal",
        icon: "💸",
        desc: "Receive payments to your PayPal account",
        fields: [
            { key: "paypal_email", label: "PayPal Email", placeholder: "your-paypal@email.com" },
        ],
    },
];

const PAYOUT_ICONS: Record<string, string> = Object.fromEntries(PAYOUT_TYPES.map(t => [t.value, t.icon]));

/* ── Components ─────────────────────────────────── */
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-brand-border/60 overflow-hidden">
            <div className="px-6 py-5 border-b border-brand-border/40">
                <h2 className="text-base font-bold text-brand-dark">{title}</h2>
                {description && <p className="text-xs text-brand-muted mt-0.5">{description}</p>}
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    );
}

function MaskedValue({ value }: { value: string }) {
    if (!value || value.length <= 4) return <span>{value || "—"}</span>;
    return <span>{"•".repeat(value.length - 4)}{value.slice(-4)}</span>;
}

/* ── SearchableCountrySelect ───────────────────── */
function SearchableCountrySelect({ value, onChange }: { value: string; onChange: (code: string) => void }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

    const selected = COUNTRIES.find((c) => c.code === value);
    const q = search.toLowerCase();
    const filtered = COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));

    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => { setOpen(!open); setSearch(""); }} className={`${inputCls} text-left flex items-center justify-between`}>
                <span className={selected ? "" : "text-brand-muted/60"}>
                    {selected ? `${selected.flag} ${selected.name}` : "Select a country…"}
                </span>
                <svg className={`w-4 h-4 text-brand-muted transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-brand-border/60 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-brand-border/40">
                        <input ref={inputRef} className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border/40 focus:outline-none focus:border-brand-orange/50 placeholder:text-brand-muted/50" placeholder="Search countries…" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 && <p className="text-xs text-brand-muted text-center py-4">No countries found</p>}
                        {filtered.map((c) => (
                            <button key={c.code} type="button" onClick={() => { onChange(c.code); setOpen(false); setSearch(""); }}
                                className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors ${c.code === value ? "bg-brand-orange/10 text-brand-orange font-semibold" : "hover:bg-gray-50 text-brand-dark"}`}>
                                <span className="text-base">{c.flag}</span><span className="flex-1">{c.name}</span><span className="text-brand-muted text-xs">{c.code}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── SearchableStateSelect ─────────────────────── */
function SearchableStateSelect({ countryCode, value, onChange }: { countryCode: string; value: string; onChange: (name: string) => void }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const states = getStatesForCountry(countryCode);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

    const q = search.toLowerCase();
    const filtered = states.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));

    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => { setOpen(!open); setSearch(""); }} className={`${inputCls} text-left flex items-center justify-between`}>
                <span className={value ? "" : "text-brand-muted/60"}>{value || "Select state / province…"}</span>
                <svg className={`w-4 h-4 text-brand-muted transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-brand-border/60 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-brand-border/40">
                        <input ref={inputRef} className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border/40 focus:outline-none focus:border-brand-orange/50 placeholder:text-brand-muted/50" placeholder="Search states…" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 && <p className="text-xs text-brand-muted text-center py-4">No matches found</p>}
                        {filtered.map((s) => (
                            <button key={s.code} type="button" onClick={() => { onChange(s.name); setOpen(false); setSearch(""); }}
                                className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors ${s.name === value ? "bg-brand-orange/10 text-brand-orange font-semibold" : "hover:bg-gray-50 text-brand-dark"}`}>
                                <span className="flex-1">{s.name}</span><span className="text-brand-muted text-xs">{s.code}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Main Page ──────────────────────────────────── */
/* ── Tax ID types ───────────────────────────────── */
const TAX_ID_TYPES = [
    { value: "ssn", label: "SSN (Social Security Number)" },
    { value: "itin", label: "ITIN (Individual Taxpayer ID)" },
    { value: "ein", label: "EIN (Employer Identification)" },
];

interface TaxInfo {
    tax_id_type: string;
    tax_id_last4: string;
    tax_id_full: string; // only used for input, never stored in DB
    billing_country: string;
    billing_state: string;
    billing_city: string;
    billing_address: string;
    billing_zip: string;
}

const EMPTY_TAX: TaxInfo = {
    tax_id_type: "", tax_id_last4: "", tax_id_full: "",
    billing_country: "", billing_state: "", billing_city: "",
    billing_address: "", billing_zip: "",
};

export default function PayoutMethodsPage() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingTax, setSavingTax] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const [methods, setMethods] = useState<PayoutMethod[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [makeDefault, setMakeDefault] = useState(false);
    const [taxInfo, setTaxInfo] = useState<TaxInfo>(EMPTY_TAX);
    const [taxLoaded, setTaxLoaded] = useState(false);

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    /* ── Load ────────────────────────────────────── */
    const loadData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [pmRes, profRes] = await Promise.all([
                fetch(`${API_BASE}/payment-methods`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/freelancers/me`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (pmRes.ok) {
                const { data } = await pmRes.json();
                setMethods(data || []);
            }
            if (profRes.ok) {
                const { data: prof } = await profRes.json();
                if (prof) {
                    setTaxInfo({
                        tax_id_type: prof.tax_id_type || "",
                        tax_id_last4: prof.tax_id_last4 || "",
                        tax_id_full: "",
                        billing_country: prof.billing_country || "",
                        billing_state: prof.billing_state || "",
                        billing_city: prof.billing_city || "",
                        billing_address: prof.billing_address || "",
                        billing_zip: prof.billing_zip || "",
                    });
                    setTaxLoaded(true);
                }
            }
        } catch (err) {
            setToast({ message: (err as Error).message, type: "error" });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { loadData(); }, [loadData]);

    /* ── Save Tax Info ───────────────────────────── */
    const handleSaveTax = async () => {
        if (!token) return;
        setSavingTax(true);
        try {
            const payload: Record<string, string> = {
                tax_id_type: taxInfo.tax_id_type,
                billing_country: taxInfo.billing_country,
                billing_state: taxInfo.billing_state,
                billing_city: taxInfo.billing_city,
                billing_address: taxInfo.billing_address,
                billing_zip: taxInfo.billing_zip,
            };
            // Only send last4 if user entered a new full tax ID
            if (taxInfo.tax_id_full.length >= 4) {
                payload.tax_id_last4 = taxInfo.tax_id_full.slice(-4);
            }
            const res = await fetch(`${API_BASE}/freelancers/me`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to save tax information");
            setToast({ message: "Tax information saved!", type: "success" });
            if (taxInfo.tax_id_full.length >= 4) {
                setTaxInfo(prev => ({ ...prev, tax_id_last4: taxInfo.tax_id_full.slice(-4), tax_id_full: "" }));
            }
        } catch (err) {
            setToast({ message: (err as Error).message, type: "error" });
        } finally {
            setSavingTax(false);
        }
    };

    /* ── Add ─────────────────────────────────────── */
    const handleAdd = async () => {
        if (!token || !selectedType) return;
        setSaving(true);

        const typeInfo = PAYOUT_TYPES.find(t => t.value === selectedType);
        if (!typeInfo) return;

        // Validate all required fields
        const missingFields = typeInfo.fields.filter(f => !formData[f.key]?.trim());
        if (missingFields.length > 0) {
            setToast({ message: `Please fill in: ${missingFields.map(f => f.label).join(", ")}`, type: "error" });
            setSaving(false);
            return;
        }

        // Determine last_four from relevant field
        let lastFour = "••••";
        if (selectedType === "paypal") {
            const email = formData.paypal_email || "";
            lastFour = email.includes("@") ? email.split("@")[0].slice(-4) : email.slice(-4);
        } else if (selectedType === "bank_transfer") {
            lastFour = (formData.account_number || "").slice(-4);
        }

        try {
            // If bank_transfer, also create/update Stripe Connect account + add bank
            if (selectedType === "bank_transfer") {
                // Step 1: Check if Connect already exists, create if not
                const statusRes = await fetch(`${API_BASE}/connect/status`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const statusData = statusRes.ok ? await statusRes.json() : null;

                if (!statusData?.data?.account_id) {
                    const createRes = await fetch(`${API_BASE}/connect/create-account`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    });
                    if (!createRes.ok) {
                        const err = await createRes.json().catch(() => ({}));
                        throw new Error(err.message || "Failed to create Stripe account");
                    }
                }

                // Step 2: Update identity if we have the holder name
                if (formData.account_holder) {
                    const names = formData.account_holder.split(" ");
                    await fetch(`${API_BASE}/connect/update-identity`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                        body: JSON.stringify({
                            first_name: names[0] || "",
                            last_name: names.slice(1).join(" ") || "",
                        }),
                    });
                }

                // Step 3: Add bank account to Stripe
                const bankRes = await fetch(`${API_BASE}/connect/add-bank`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                        routing_number: formData.routing_number,
                        account_number: formData.account_number,
                        account_holder_name: formData.account_holder || "Account Holder",
                    }),
                });
                if (!bankRes.ok) {
                    const err = await bankRes.json().catch(() => ({}));
                    throw new Error(err.message || "Failed to add bank to Stripe");
                }
            }

            // Save payout method record to our DB
            const res = await fetch(`${API_BASE}/payment-methods`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: selectedType,
                    provider: selectedType,
                    last_four: lastFour || "••••",
                    is_default: makeDefault,
                    ...formData,
                    metadata: formData,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to add payout method");
            }

            setToast({ message: `${typeInfo.label} added successfully!`, type: "success" });
            setShowForm(false);
            setSelectedType(null);
            setFormData({});
            setMakeDefault(false);
            await loadData();
        } catch (err) {
            setToast({ message: (err as Error).message, type: "error" });
        } finally {
            setSaving(false);
        }
    };

    /* ── Delete ──────────────────────────────────── */
    const handleDelete = async (id: string) => {
        if (!token) return;
        if (!confirm("Are you sure you want to remove this payout method?")) return;

        try {
            const res = await fetch(`${API_BASE}/payment-methods/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok && res.status !== 204) {
                throw new Error("Failed to remove");
            }
            setToast({ message: "Payout method removed.", type: "success" });
            await loadData();
        } catch (err) {
            setToast({ message: (err as Error).message, type: "error" });
        }
    };

    /* ── Set Default ─────────────────────────────── */
    const handleSetDefault = async (id: string) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/payment-methods/${id}/default`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to set default");
            setToast({ message: "Default payout method updated!", type: "success" });
            await loadData();
        } catch (err) {
            setToast({ message: (err as Error).message, type: "error" });
        }
    };

    /* ── Render ───────────────────────────────────── */
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
            </div>
        );
    }

    const selectedTypeInfo = PAYOUT_TYPES.find(t => t.value === selectedType);

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-10">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg transition-all max-w-sm ${toast.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                    {toast.message}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-brand-dark">Payout Methods</h1>
                    <p className="text-sm text-brand-muted mt-0.5">
                        Add and manage how you receive payments from clients.
                    </p>
                </div>
                {!showForm && (
                    <button className={btnPrimary} onClick={() => setShowForm(true)}>
                        + Add Payout Method
                    </button>
                )}
            </div>

            {/* ── Tax Information ── */}
            <Section title="Tax & Billing Information" description="Required for payment verification. Your full tax ID is never stored — only the last 4 digits.">
                {!taxLoaded ? (
                    <div className="flex justify-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-orange" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-brand-dark mb-1.5">Tax ID Type</label>
                                <select
                                    className={inputCls + " appearance-none"}
                                    value={taxInfo.tax_id_type}
                                    onChange={(e) => setTaxInfo(prev => ({ ...prev, tax_id_type: e.target.value }))}
                                >
                                    <option value="">Select type…</option>
                                    {TAX_ID_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-brand-dark mb-1.5">
                                    {taxInfo.tax_id_type === "ein" ? "EIN" : taxInfo.tax_id_type === "itin" ? "ITIN" : "SSN"} Number
                                    {taxInfo.tax_id_last4 && <span className="text-brand-muted font-normal"> (ends in ••{taxInfo.tax_id_last4})</span>}
                                </label>
                                <input
                                    type="password"
                                    className={inputCls}
                                    placeholder={taxInfo.tax_id_last4 ? `••••••${taxInfo.tax_id_last4} (enter new to update)` : "Enter your tax ID"}
                                    value={taxInfo.tax_id_full}
                                    onChange={(e) => setTaxInfo(prev => ({ ...prev, tax_id_full: e.target.value }))}
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <p className="text-xs font-semibold text-brand-dark pt-2">Billing Address</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-brand-dark mb-1.5">Country</label>
                                <SearchableCountrySelect
                                    value={taxInfo.billing_country}
                                    onChange={(code) => setTaxInfo(prev => ({ ...prev, billing_country: code, billing_state: "" }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-brand-dark mb-1.5">State / Province</label>
                                {taxInfo.billing_country && getStatesForCountry(taxInfo.billing_country).length > 0 ? (
                                    <SearchableStateSelect
                                        countryCode={taxInfo.billing_country}
                                        value={taxInfo.billing_state}
                                        onChange={(val) => setTaxInfo(prev => ({ ...prev, billing_state: val }))}
                                    />
                                ) : (
                                    <input
                                        className={inputCls}
                                        placeholder="State / Province"
                                        value={taxInfo.billing_state}
                                        onChange={(e) => setTaxInfo(prev => ({ ...prev, billing_state: e.target.value }))}
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-brand-dark mb-1.5">City</label>
                                <input
                                    className={inputCls}
                                    placeholder="e.g. San Francisco"
                                    value={taxInfo.billing_city}
                                    onChange={(e) => setTaxInfo(prev => ({ ...prev, billing_city: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-brand-dark mb-1.5">ZIP / Postal Code</label>
                                <input
                                    className={inputCls}
                                    placeholder="e.g. 94102"
                                    value={taxInfo.billing_zip}
                                    onChange={(e) => setTaxInfo(prev => ({ ...prev, billing_zip: e.target.value }))}
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-brand-dark mb-1.5">Street Address</label>
                                <input
                                    className={inputCls}
                                    placeholder="123 Main St, Apt 4"
                                    value={taxInfo.billing_address}
                                    onChange={(e) => setTaxInfo(prev => ({ ...prev, billing_address: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                className={btnPrimary}
                                onClick={handleSaveTax}
                                disabled={savingTax || !taxInfo.tax_id_type}
                            >
                                {savingTax ? "Saving…" : "Save Tax Information"}
                            </button>
                        </div>
                    </div>
                )}
            </Section>

            {/* ── Existing Methods ── */}
            {methods.length > 0 && (
                <Section title="Your Payout Methods" description="Manage your saved payout methods.">
                    <div className="space-y-3">
                        {methods.map((m) => {
                            const meta = m.metadata || {};
                            const typeLabel = PAYOUT_TYPES.find(t => t.value === m.type)?.label || m.type;

                            return (
                                <div
                                    key={m.id}
                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${m.is_default
                                        ? "border-brand-orange/40 bg-brand-orange/5"
                                        : "border-brand-border/60"
                                        }`}
                                >
                                    <div className="text-2xl w-10 h-10 flex items-center justify-center flex-shrink-0">
                                        {PAYOUT_ICONS[m.type] || "💳"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-brand-dark">{typeLabel}</p>
                                            {m.is_default && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-brand-orange/10 text-brand-orange">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-brand-muted mt-0.5">
                                            {m.type === "paypal" || m.type === "wise"
                                                ? meta.paypal_email || meta.wise_email || `••••${m.last_four}`
                                                : `${meta.bank_name || m.provider} ••••${m.last_four}`}
                                        </p>
                                        <p className="text-[10px] text-brand-muted/70 mt-0.5">
                                            Added {new Date(m.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {!m.is_default && (
                                            <button
                                                className={btnOutline + " !text-xs !px-3 !py-1.5"}
                                                onClick={() => handleSetDefault(m.id)}
                                            >
                                                Set Default
                                            </button>
                                        )}
                                        <button
                                            className={btnDanger}
                                            onClick={() => handleDelete(m.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Section>
            )}

            {/* ── Empty state ── */}
            {methods.length === 0 && !showForm && (
                <Section title="No Payout Methods">
                    <div className="text-center py-8">
                        <div className="text-4xl mb-3">💰</div>
                        <p className="text-sm text-brand-muted mb-4">
                            You haven&apos;t added any payout methods yet.<br />
                            Add one to start receiving payments from clients.
                        </p>
                        <button className={btnPrimary} onClick={() => setShowForm(true)}>
                            + Add Your First Payout Method
                        </button>
                    </div>
                </Section>
            )}

            {/* ── Add Form ── */}
            {showForm && (
                <Section title="Add Payout Method" description="Choose how you'd like to receive payments.">
                    <div className="space-y-5">
                        {/* Step 1: Choose type */}
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-brand-dark">Select Type</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {PAYOUT_TYPES.map((pt) => (
                                    <label
                                        key={pt.value}
                                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedType === pt.value
                                            ? "border-brand-orange bg-brand-orange/5 ring-2 ring-brand-orange/20"
                                            : "border-brand-border/60 hover:bg-brand-bg/50"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="payout-type"
                                            value={pt.value}
                                            checked={selectedType === pt.value}
                                            onChange={() => {
                                                setSelectedType(pt.value);
                                                setFormData({});
                                            }}
                                            className="sr-only"
                                        />
                                        <div className="text-2xl flex-shrink-0">{pt.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-brand-dark">{pt.label}</p>
                                            <p className="text-[11px] text-brand-muted mt-0.5">{pt.desc}</p>
                                        </div>
                                        {selectedType === pt.value && (
                                            <span className="text-brand-orange text-lg flex-shrink-0">✓</span>
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Fill in details */}
                        {selectedTypeInfo && (
                            <div className="space-y-4 border-t border-brand-border/30 pt-5">
                                <p className="text-xs font-semibold text-brand-dark">
                                    {selectedTypeInfo.label} Details
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {selectedTypeInfo.fields.map((field) => (
                                        <div key={field.key} className={selectedTypeInfo.fields.length === 1 ? "sm:col-span-2" : ""}>
                                            <label className="block text-xs font-medium text-brand-dark mb-1.5">
                                                {field.label}
                                            </label>
                                            <input
                                                type={field.mask ? "password" : "text"}
                                                className={inputCls}
                                                placeholder={field.placeholder}
                                                value={formData[field.key] || ""}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        [field.key]: e.target.value,
                                                    }))
                                                }
                                                autoComplete="off"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Make default toggle */}
                                <label className="flex items-center gap-3 p-3 rounded-xl bg-brand-bg/50 border border-brand-border/30 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={makeDefault}
                                        onChange={(e) => setMakeDefault(e.target.checked)}
                                        className="w-4 h-4 rounded accent-brand-orange"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-brand-dark">Set as default payout method</p>
                                        <p className="text-[11px] text-brand-muted">Payments will be sent here by default</p>
                                    </div>
                                </label>

                                {/* Security note */}
                                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <span className="text-sm mt-0.5">🔒</span>
                                    <p className="text-[11px] text-blue-700">
                                        Your payout details are encrypted and stored securely. We never share your
                                        financial information with third parties.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                className={btnOutline}
                                onClick={() => {
                                    setShowForm(false);
                                    setSelectedType(null);
                                    setFormData({});
                                    setMakeDefault(false);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className={btnPrimary}
                                onClick={handleAdd}
                                disabled={saving || !selectedType}
                            >
                                {saving ? "Saving…" : "Add Payout Method"}
                            </button>
                        </div>
                    </div>
                </Section>
            )}
        </div>
    );
}
