"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Styling ────────────────────────────────────── */
const inputCls =
    "w-full px-4 py-3 rounded-xl border border-brand-border/60 bg-white text-sm text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all";
const btnPrimary =
    "px-6 py-2.5 rounded-xl bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange/90 transition-all shadow-sm";
const btnOutline =
    "px-4 py-2 rounded-xl border border-brand-border/60 text-sm font-medium text-brand-dark hover:bg-brand-bg transition-all";

/* ── Types ──────────────────────────────────────── */
interface PortfolioItem {
    title: string;
    url: string;
    description?: string;
}

interface EducationEntry {
    degree: string;
    institution: string;
    year: string;
}

interface CertificationEntry {
    name: string;
    issuer: string;
    year: string;
    url?: string;
}

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

/* ── Main Page ──────────────────────────────────── */
export default function PortfolioPage() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
    const [education, setEducation] = useState<EducationEntry[]>([]);
    const [certifications, setCertifications] = useState<CertificationEntry[]>([]);

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
            const res = await fetch(`${API_BASE}/freelancers/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to load profile");
            const { data } = await res.json();

            // portfolio_urls can be an array of strings or objects
            const rawPortfolio = data.portfolio_urls;
            if (Array.isArray(rawPortfolio) && rawPortfolio.length > 0) {
                setPortfolioItems(
                    rawPortfolio.map((item: string | PortfolioItem) =>
                        typeof item === "string"
                            ? { title: "", url: item, description: "" }
                            : { title: item.title || "", url: item.url || "", description: item.description || "" }
                    )
                );
            } else {
                setPortfolioItems([]);
            }

            const rawEd = data.education;
            if (Array.isArray(rawEd)) {
                setEducation(rawEd.map((e: EducationEntry) => ({
                    degree: e.degree || "",
                    institution: e.institution || "",
                    year: e.year?.toString() || "",
                })));
            } else {
                setEducation([]);
            }

            const rawCert = data.certifications;
            if (Array.isArray(rawCert)) {
                setCertifications(rawCert.map((c: CertificationEntry) => ({
                    name: c.name || "",
                    issuer: c.issuer || "",
                    year: c.year?.toString() || "",
                    url: c.url || "",
                })));
            } else {
                setCertifications([]);
            }
        } catch (err) {
            setToast({ message: (err as Error).message, type: "error" });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { loadData(); }, [loadData]);

    /* ── Portfolio CRUD ──────────────────────────── */
    const addPortfolioItem = () => setPortfolioItems(prev => [...prev, { title: "", url: "", description: "" }]);
    const removePortfolioItem = (i: number) => setPortfolioItems(prev => prev.filter((_, idx) => idx !== i));
    const updatePortfolioItem = (i: number, field: keyof PortfolioItem, value: string) =>
        setPortfolioItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

    /* ── Education CRUD ──────────────────────────── */
    const addEducation = () => setEducation(prev => [...prev, { degree: "", institution: "", year: "" }]);
    const removeEducation = (i: number) => setEducation(prev => prev.filter((_, idx) => idx !== i));
    const updateEducation = (i: number, field: keyof EducationEntry, value: string) =>
        setEducation(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

    /* ── Certification CRUD ──────────────────────── */
    const addCertification = () => setCertifications(prev => [...prev, { name: "", issuer: "", year: "", url: "" }]);
    const removeCertification = (i: number) => setCertifications(prev => prev.filter((_, idx) => idx !== i));
    const updateCertification = (i: number, field: keyof CertificationEntry, value: string) =>
        setCertifications(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

    /* ── Save ────────────────────────────────────── */
    const handleSave = async () => {
        if (!token) return;
        setSaving(true);
        try {
            const validPortfolio = portfolioItems.filter(p => p.url.trim());
            const validEd = education.filter(e => e.degree.trim() || e.institution.trim());
            const validCert = certifications.filter(c => c.name.trim());

            const res = await fetch(`${API_BASE}/freelancers/me`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    portfolio_urls: validPortfolio,
                    education: validEd,
                    certifications: validCert,
                }),
            });
            if (!res.ok) throw new Error("Failed to save");
            setToast({ message: "Portfolio saved!", type: "success" });
        } catch (err) {
            setToast({ message: (err as Error).message, type: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-10">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg transition-all ${toast.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                    {toast.message}
                </div>
            )}

            <div>
                <h1 className="text-xl font-bold text-brand-dark">Portfolio</h1>
                <p className="text-sm text-brand-muted mt-0.5">
                    Showcase your work, education, and certifications.
                </p>
            </div>

            {/* ── Portfolio Items ── */}
            <Section title="Portfolio & Work Samples" description="Links to your best work — projects, case studies, live sites.">
                <div className="space-y-4">
                    {portfolioItems.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-brand-border/40 rounded-xl">
                            <p className="text-sm text-brand-muted">No portfolio items yet.</p>
                            <p className="text-xs text-brand-muted mt-1">Add links to your best work to attract clients.</p>
                        </div>
                    ) : (
                        portfolioItems.map((item, i) => (
                            <div key={i} className="p-4 bg-brand-bg/50 rounded-xl border border-brand-border/30 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input
                                            className={inputCls}
                                            placeholder="Project title"
                                            value={item.title}
                                            onChange={(e) => updatePortfolioItem(i, "title", e.target.value)}
                                        />
                                        <input
                                            className={inputCls}
                                            placeholder="https://example.com"
                                            value={item.url}
                                            onChange={(e) => updatePortfolioItem(i, "url", e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => removePortfolioItem(i)}
                                        className="mt-2 p-1 text-brand-muted hover:text-red-500 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <input
                                    className={inputCls}
                                    placeholder="Brief description (optional)"
                                    value={item.description || ""}
                                    onChange={(e) => updatePortfolioItem(i, "description", e.target.value)}
                                />
                            </div>
                        ))
                    )}
                    <button onClick={addPortfolioItem} className={btnOutline + " w-full"}>
                        + Add Portfolio Item
                    </button>
                </div>
            </Section>

            {/* ── Education ── */}
            <Section title="Education" description="Your academic background.">
                <div className="space-y-4">
                    {education.length === 0 ? (
                        <div className="text-center py-6 border-2 border-dashed border-brand-border/40 rounded-xl">
                            <p className="text-sm text-brand-muted">No education entries added.</p>
                        </div>
                    ) : (
                        education.map((entry, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-brand-bg/50 rounded-xl border border-brand-border/30">
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <input
                                        className={inputCls}
                                        placeholder="Degree / Certificate"
                                        value={entry.degree}
                                        onChange={(e) => updateEducation(i, "degree", e.target.value)}
                                    />
                                    <input
                                        className={inputCls}
                                        placeholder="Institution"
                                        value={entry.institution}
                                        onChange={(e) => updateEducation(i, "institution", e.target.value)}
                                    />
                                    <input
                                        className={inputCls}
                                        placeholder="Year"
                                        type="number"
                                        min={1950}
                                        max={2030}
                                        value={entry.year}
                                        onChange={(e) => updateEducation(i, "year", e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => removeEducation(i)}
                                    className="mt-2 p-1 text-brand-muted hover:text-red-500 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        ))
                    )}
                    <button onClick={addEducation} className={btnOutline + " w-full"}>
                        + Add Education
                    </button>
                </div>
            </Section>

            {/* ── Certifications ── */}
            <Section title="Certifications" description="Professional certifications and licenses.">
                <div className="space-y-4">
                    {certifications.length === 0 ? (
                        <div className="text-center py-6 border-2 border-dashed border-brand-border/40 rounded-xl">
                            <p className="text-sm text-brand-muted">No certifications added.</p>
                        </div>
                    ) : (
                        certifications.map((cert, i) => (
                            <div key={i} className="p-4 bg-brand-bg/50 rounded-xl border border-brand-border/30 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <input
                                            className={inputCls}
                                            placeholder="Certification name"
                                            value={cert.name}
                                            onChange={(e) => updateCertification(i, "name", e.target.value)}
                                        />
                                        <input
                                            className={inputCls}
                                            placeholder="Issuing organization"
                                            value={cert.issuer}
                                            onChange={(e) => updateCertification(i, "issuer", e.target.value)}
                                        />
                                        <input
                                            className={inputCls}
                                            placeholder="Year"
                                            type="number"
                                            min={1950}
                                            max={2030}
                                            value={cert.year}
                                            onChange={(e) => updateCertification(i, "year", e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeCertification(i)}
                                        className="mt-2 p-1 text-brand-muted hover:text-red-500 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <input
                                    className={inputCls}
                                    placeholder="Verification URL (optional)"
                                    value={cert.url || ""}
                                    onChange={(e) => updateCertification(i, "url", e.target.value)}
                                />
                            </div>
                        ))
                    )}
                    <button onClick={addCertification} className={btnOutline + " w-full"}>
                        + Add Certification
                    </button>
                </div>
            </Section>

            {/* ── Save ── */}
            <div className="flex justify-end gap-3 pt-2">
                <button className={btnOutline} onClick={loadData} disabled={saving}>
                    Reset
                </button>
                <button className={btnPrimary} onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : "Save Changes"}
                </button>
            </div>
        </div>
    );
}
