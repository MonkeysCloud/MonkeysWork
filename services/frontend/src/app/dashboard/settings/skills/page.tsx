"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Styling constants ─────────────────────────── */
const inputCls =
    "w-full px-4 py-3 rounded-xl border border-brand-border/60 bg-white text-sm text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all";
const selectCls = inputCls + " appearance-none";
const btnPrimary =
    "px-6 py-2.5 rounded-xl bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange/90 transition-all shadow-sm";
const btnOutline =
    "px-4 py-2 rounded-xl border border-brand-border/60 text-sm font-medium text-brand-dark hover:bg-brand-bg transition-all";

/* ── Types ──────────────────────────────────────── */
interface SkillOption {
    id: string;
    name: string;
    slug: string;
}

interface SelectedSkill {
    skill_id: string;
    name: string;
    slug: string;
    proficiency: string;
    years_experience: number;
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1.5">{label}</label>
            {children}
            {hint && <p className="text-[11px] text-brand-muted mt-1">{hint}</p>}
        </div>
    );
}

const PROFICIENCY_OPTIONS = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "expert", label: "Expert" },
];

const CURRENCIES = [
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "GBP", label: "GBP (£)" },
    { value: "CAD", label: "CAD (C$)" },
    { value: "AUD", label: "AUD (A$)" },
    { value: "MXN", label: "MXN ($)" },
];

/* ── Main Page ──────────────────────────────────── */
export default function SkillsRatePage() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Skills
    const [skills, setSkills] = useState<SelectedSkill[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SkillOption[]>([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Rate
    const [hourlyRate, setHourlyRate] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [experienceYears, setExperienceYears] = useState("");

    /* ── Toast auto-dismiss ────────────────────── */
    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    /* ── Outside click ─────────────────────────── */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* ── Load data ──────────────────────────────── */
    const loadData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/freelancers/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to load profile");
            const { data } = await res.json();

            setHourlyRate(data.hourly_rate?.toString() ?? "");
            setCurrency(data.currency ?? "USD");
            setExperienceYears(data.experience_years?.toString() ?? "");

            if (Array.isArray(data.skills)) {
                setSkills(
                    data.skills.map((s: Record<string, string | number>) => ({
                        skill_id: s.id,
                        name: s.name,
                        slug: s.slug,
                        proficiency: s.proficiency || "intermediate",
                        years_experience: s.years_experience || 0,
                    }))
                );
            }
        } catch (err) {
            setToast({ message: (err as Error).message, type: "error" });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { loadData(); }, [loadData]);

    /* ── Skill search ───────────────────────────── */
    const searchSkills = useCallback(async (q: string) => {
        if (!token || q.length < 2) { setSearchResults([]); return; }
        try {
            const res = await fetch(`${API_BASE}/skills/search?q=${encodeURIComponent(q)}&limit=15`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const { data } = await res.json();
            // Filter out already-selected skills
            const selectedIds = new Set(skills.map(s => s.skill_id));
            setSearchResults((data || []).filter((s: SkillOption) => !selectedIds.has(s.id)));
        } catch { /* ignore */ }
    }, [token, skills]);

    const handleSearchInput = (val: string) => {
        setSearchQuery(val);
        setSearchOpen(true);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => searchSkills(val), 300);
    };

    const addSkill = (skill: SkillOption) => {
        setSkills(prev => [...prev, {
            skill_id: skill.id,
            name: skill.name,
            slug: skill.slug,
            proficiency: "intermediate",
            years_experience: 1,
        }]);
        setSearchQuery("");
        setSearchResults([]);
        setSearchOpen(false);
    };

    const removeSkill = (skillId: string) => {
        setSkills(prev => prev.filter(s => s.skill_id !== skillId));
    };

    const updateSkill = (skillId: string, field: "proficiency" | "years_experience", value: string | number) => {
        setSkills(prev => prev.map(s =>
            s.skill_id === skillId ? { ...s, [field]: value } : s
        ));
    };

    /* ── Save ────────────────────────────────────── */
    const handleSave = async () => {
        if (!token) return;
        setSaving(true);
        try {
            // Save skills
            const skillsRes = await fetch(`${API_BASE}/freelancers/me/skills`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    skills: skills.map(s => ({
                        skill_id: s.skill_id,
                        proficiency: s.proficiency,
                        years_experience: s.years_experience,
                    })),
                }),
            });
            if (!skillsRes.ok) throw new Error("Failed to save skills");

            // Save rate & experience
            const profileRes = await fetch(`${API_BASE}/freelancers/me`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
                    currency,
                    experience_years: experienceYears ? parseInt(experienceYears) : null,
                }),
            });
            if (!profileRes.ok) throw new Error("Failed to save rate");

            setToast({ message: "Skills & rate saved!", type: "success" });
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
            {/* ── Toast ── */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg transition-all ${toast.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                    {toast.message}
                </div>
            )}

            {/* ── Header ── */}
            <div>
                <h1 className="text-xl font-bold text-brand-dark">Skills & Rate</h1>
                <p className="text-sm text-brand-muted mt-0.5">
                    Manage your skills, proficiency levels, and hourly rate.
                </p>
            </div>

            {/* ── Skills Section ── */}
            <Section title="Your Skills" description="Add skills that showcase your expertise to clients.">
                <div className="space-y-4">
                    {/* Search */}
                    <div ref={searchRef} className="relative">
                        <Field label="Add a Skill" hint="Search from 800+ skill categories">
                            <input
                                type="text"
                                className={inputCls}
                                placeholder="Type to search skills…"
                                value={searchQuery}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)}
                            />
                        </Field>
                        {searchOpen && searchResults.length > 0 && (
                            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-brand-border/60 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                {searchResults.map((s) => (
                                    <button
                                        key={s.id}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-bg transition-colors first:rounded-t-xl last:rounded-b-xl"
                                        onClick={() => addSkill(s)}
                                    >
                                        <span className="font-medium text-brand-dark">{s.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selected skills */}
                    {skills.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-brand-border/40 rounded-xl">
                            <p className="text-sm text-brand-muted">No skills added yet.</p>
                            <p className="text-xs text-brand-muted mt-1">Search and add skills above to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {skills.map((s) => (
                                <div key={s.skill_id} className="flex items-center gap-3 p-3 bg-brand-bg/50 rounded-xl border border-brand-border/30">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-brand-dark truncate">{s.name}</p>
                                    </div>
                                    <select
                                        className="px-2 py-1.5 text-xs rounded-lg border border-brand-border/60 bg-white appearance-none"
                                        value={s.proficiency}
                                        onChange={(e) => updateSkill(s.skill_id, "proficiency", e.target.value)}
                                    >
                                        {PROFICIENCY_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min={0}
                                            max={50}
                                            className="w-14 px-2 py-1.5 text-xs rounded-lg border border-brand-border/60 bg-white text-center"
                                            value={s.years_experience}
                                            onChange={(e) => updateSkill(s.skill_id, "years_experience", parseInt(e.target.value) || 0)}
                                        />
                                        <span className="text-[10px] text-brand-muted whitespace-nowrap">yrs</span>
                                    </div>
                                    <button
                                        onClick={() => removeSkill(s.skill_id)}
                                        className="p-1 text-brand-muted hover:text-red-500 transition-colors"
                                        title="Remove skill"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <p className="text-[11px] text-brand-muted">
                                {skills.length} skill{skills.length !== 1 ? "s" : ""} selected
                            </p>
                        </div>
                    )}
                </div>
            </Section>

            {/* ── Rate & Experience Section ── */}
            <Section title="Rate & Experience" description="Set your hourly rate and total experience.">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Hourly Rate" hint="Your base rate for new contracts">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-brand-muted">
                                {currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$"}
                            </span>
                            <input
                                type="number"
                                min={0}
                                step={5}
                                className={inputCls + " pl-8"}
                                placeholder="0"
                                value={hourlyRate}
                                onChange={(e) => setHourlyRate(e.target.value)}
                            />
                        </div>
                    </Field>

                    <Field label="Currency">
                        <select
                            className={selectCls}
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                        >
                            {CURRENCIES.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Years of Experience" hint="Total professional experience">
                        <input
                            type="number"
                            min={0}
                            max={50}
                            className={inputCls}
                            placeholder="0"
                            value={experienceYears}
                            onChange={(e) => setExperienceYears(e.target.value)}
                        />
                    </Field>
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
