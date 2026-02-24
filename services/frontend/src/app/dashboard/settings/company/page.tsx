"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

const inputCls =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f08a11]/30 focus:border-[#f08a11] transition-all";

/* ── Helpers ───────────────────────────────────── */
function Section({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                {description && (
                    <p className="text-sm text-gray-500 mt-0.5">{description}</p>
                )}
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    );
}

function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                {label}
            </label>
            {children}
            {hint && (
                <p className="text-[11px] text-gray-400 mt-1">{hint}</p>
            )}
        </div>
    );
}

function Toast({
    message,
    type,
    onClose,
}: {
    message: string;
    type: "success" | "error";
    onClose: () => void;
}) {
    useEffect(() => {
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-in slide-in-from-bottom-4 ${type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
                }`}
        >
            <span>{type === "success" ? "✅" : "❌"}</span>
            <span>{message}</span>
            <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
                ✕
            </button>
        </div>
    );
}

/* ── Company data shape ──────────────────────── */
interface CompanyData {
    id?: string;
    name: string;
    website: string;
    industry: string;
    size: string;
    description: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zip_code: string;
    tax_id: string;
    phone: string;
    email: string;
}

const EMPTY: CompanyData = {
    name: "",
    website: "",
    industry: "",
    size: "",
    description: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zip_code: "",
    tax_id: "",
    phone: "",
    email: "",
};

const COMPANY_SIZES = [
    { value: "", label: "Select company size…" },
    { value: "1", label: "Solo (1 person)" },
    { value: "2-10", label: "2–10 employees" },
    { value: "11-50", label: "11–50 employees" },
    { value: "51-200", label: "51–200 employees" },
    { value: "201-500", label: "201–500 employees" },
    { value: "500+", label: "500+ employees" },
];

const INDUSTRIES = [
    "", "Technology", "Finance & Banking", "Healthcare", "Education",
    "E-commerce", "Marketing & Advertising", "Media & Entertainment",
    "Real Estate", "Manufacturing", "Consulting", "Legal",
    "Nonprofit", "Government", "Other",
];

/* ══════════════════════════════════════════════════
   Company Settings Page
   ══════════════════════════════════════════════════ */
export default function CompanySettingsPage() {
    const { token } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error";
    } | null>(null);
    const [data, setData] = useState<CompanyData>(EMPTY);
    const [isNew, setIsNew] = useState(true);

    /* ── Load existing company ─────────────────── */
    const loadCompany = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/companies/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const { data: company } = await res.json();
                if (company) {
                    setData({
                        id: company.id,
                        name: company.name ?? "",
                        website: company.website ?? "",
                        industry: company.industry ?? "",
                        size: company.size ?? "",
                        description: company.description ?? "",
                        address: company.address ?? "",
                        city: company.city ?? "",
                        state: company.state ?? "",
                        country: company.country ?? "",
                        zip_code: company.zip_code ?? "",
                        tax_id: company.tax_id ?? "",
                        phone: company.phone ?? "",
                        email: company.email ?? "",
                    });
                    setIsNew(false);
                }
            }
        } catch {
            /* silent */
        }
        setLoading(false);
    }, [token]);

    useEffect(() => {
        loadCompany();
    }, [loadCompany]);

    /* ── Save ──────────────────────────────────── */
    const save = async () => {
        if (!token) return;
        if (!data.name.trim()) {
            setToast({ message: "Company name is required", type: "error" });
            return;
        }
        setSaving(true);
        try {
            const url = isNew ? `${API}/companies` : `${API}/companies/${data.id}`;
            const method = isNew ? "POST" : "PUT";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: data.name,
                    website: data.website || null,
                    industry: data.industry || null,
                    size: data.size || null,
                    description: data.description || null,
                    address: data.address || null,
                    city: data.city || null,
                    state: data.state || null,
                    country: data.country || null,
                    zip_code: data.zip_code || null,
                    tax_id: data.tax_id || null,
                    phone: data.phone || null,
                    email: data.email || null,
                }),
            });
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error(
                    (b as Record<string, string>).message || "Failed to save"
                );
            }
            const result = await res.json();
            if (isNew && result?.data?.id) {
                setData((prev) => ({ ...prev, id: result.data.id }));
                setIsNew(false);
            }
            setToast({ message: "Company settings saved!", type: "success" });
        } catch (err) {
            setToast({
                message:
                    err instanceof Error ? err.message : "Failed to save",
                type: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    /* ── Field updater ─────────────────────────── */
    function update<K extends keyof CompanyData>(key: K, value: CompanyData[K]) {
        setData((prev) => ({ ...prev, [key]: value }));
    }

    /* ── Loading ───────────────────────────────── */
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3 text-gray-400">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <span className="text-sm">Loading company settings…</span>
                </div>
            </div>
        );
    }

    /* ── Render ─────────────────────────────────── */
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                        Company Settings
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isNew
                            ? "Set up your company profile"
                            : "Manage your company details"}
                    </p>
                </div>
                <button
                    onClick={save}
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#f08a11] text-white text-sm font-bold rounded-xl shadow-[0_4px_14px_rgba(240,138,17,0.3)] hover:shadow-[0_6px_20px_rgba(240,138,17,0.45)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {saving ? "Saving…" : isNew ? "Create Company" : "Save Changes"}
                </button>
            </div>

            {/* ── Company Details ──────────────── */}
            <Section
                title="Company Information"
                description="Basic information about your company"
            >
                <div className="space-y-5">
                    <Field label="Company Name">
                        <input
                            className={inputCls}
                            placeholder="e.g. Acme Corp"
                            value={data.name}
                            onChange={(e) =>
                                update("name", e.target.value)
                            }
                        />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field
                            label="Website"
                            hint="Your company's website URL"
                        >
                            <input
                                className={inputCls}
                                placeholder="https://example.com"
                                type="url"
                                value={data.website}
                                onChange={(e) =>
                                    update("website", e.target.value)
                                }
                            />
                        </Field>

                        <Field label="Email" hint="Company contact email">
                            <input
                                className={inputCls}
                                placeholder="info@example.com"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    update("email", e.target.value)
                                }
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Industry">
                            <select
                                className={`${inputCls} appearance-none`}
                                value={data.industry}
                                onChange={(e) =>
                                    update("industry", e.target.value)
                                }
                            >
                                {INDUSTRIES.map((ind) => (
                                    <option key={ind} value={ind}>
                                        {ind || "Select industry…"}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Company Size">
                            <select
                                className={`${inputCls} appearance-none`}
                                value={data.size}
                                onChange={(e) =>
                                    update("size", e.target.value)
                                }
                            >
                                {COMPANY_SIZES.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <Field label="Phone">
                        <input
                            className={inputCls}
                            placeholder="+1 (555) 123-4567"
                            value={data.phone}
                            onChange={(e) =>
                                update("phone", e.target.value)
                            }
                        />
                    </Field>

                    <Field
                        label="Description"
                        hint="A short summary of what your company does"
                    >
                        <textarea
                            className={`${inputCls} min-h-[100px] resize-y`}
                            placeholder="Tell freelancers about your company, culture, and the kind of work you do…"
                            value={data.description}
                            onChange={(e) =>
                                update("description", e.target.value)
                            }
                            maxLength={1000}
                        />
                        <p className="text-[11px] text-gray-400 mt-1 text-right">
                            {data.description.length}/1000
                        </p>
                    </Field>
                </div>
            </Section>

            {/* ── Address ──────────────────────── */}
            <Section
                title="Address"
                description="Used for invoicing and billing purposes"
            >
                <div className="space-y-5">
                    <Field label="Street Address">
                        <input
                            className={inputCls}
                            placeholder="123 Business St, Suite 100"
                            value={data.address}
                            onChange={(e) =>
                                update("address", e.target.value)
                            }
                        />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="City">
                            <input
                                className={inputCls}
                                placeholder="San Francisco"
                                value={data.city}
                                onChange={(e) =>
                                    update("city", e.target.value)
                                }
                            />
                        </Field>

                        <Field label="State / Province">
                            <input
                                className={inputCls}
                                placeholder="CA"
                                value={data.state}
                                onChange={(e) =>
                                    update("state", e.target.value)
                                }
                            />
                        </Field>

                        <Field label="Zip Code">
                            <input
                                className={inputCls}
                                placeholder="94105"
                                value={data.zip_code}
                                onChange={(e) =>
                                    update("zip_code", e.target.value)
                                }
                            />
                        </Field>
                    </div>

                    <Field label="Country">
                        <input
                            className={inputCls}
                            placeholder="United States"
                            value={data.country}
                            onChange={(e) =>
                                update("country", e.target.value)
                            }
                        />
                    </Field>
                </div>
            </Section>

            {/* ── Tax / Legal ──────────────────── */}
            <Section
                title="Tax & Legal"
                description="Required for invoicing and compliance"
            >
                <Field
                    label="Tax ID / VAT Number"
                    hint="Your company's tax identification number (optional)"
                >
                    <input
                        className={inputCls}
                        placeholder="e.g. US-12-3456789"
                        value={data.tax_id}
                        onChange={(e) =>
                            update("tax_id", e.target.value)
                        }
                    />
                </Field>
            </Section>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
