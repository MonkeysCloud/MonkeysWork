"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import COUNTRIES, { type Country } from "@/data/countries";
import { getStatesForCountry } from "@/data/states";
import LANGUAGES, { PROFICIENCY_LEVELS, type ProficiencyLevel } from "@/data/languages";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Styling constants ─────────────────────────── */
const inputCls =
    "w-full px-4 py-3 rounded-xl border border-brand-border/60 bg-white text-sm text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all";

const selectCls = inputCls + " appearance-none";

/* ── Types ──────────────────────────────────────── */
interface LanguageEntry {
    language: string;
    code: string;
    level: ProficiencyLevel;
}

interface UserData {
    id: string;
    email: string;
    role: string;
    display_name: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    country: string | null;
    state: string | null;
    avatar_url: string | null;
    languages: LanguageEntry[] | string | null;
    timezone: string | null;
    locale: string | null;
}

interface FreelancerProfile {
    headline: string | null;
    bio: string | null;
    hourly_rate: number | string | null;
    currency: string | null;
    experience_years: number | null;
    availability_status: string | null;
    availability_hours_week: number | null;
    website_url: string | null;
    github_url: string | null;
    linkedin_url: string | null;
    profile_visibility: string | null;
    skills: Array<{ id: string; name: string; slug: string }>;
}

/* ── Field wrapper ─────────────────────────────── */
function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1.5">{label}</label>
            {children}
            {hint && <p className="text-[11px] text-brand-muted mt-1">{hint}</p>}
        </div>
    );
}

/* ── Section card ──────────────────────────────── */
function Section({ title, description, children, overflowHidden = true, className = "" }: { title: string; description?: string; children: React.ReactNode, overflowHidden?: boolean, className?: string }) {
    return (
        <div className={`bg-white rounded-xl border border-brand-border/60 ${overflowHidden ? 'overflow-hidden' : ''} ${className}`}>
            <div className="px-6 py-5 border-b border-brand-border/40">
                <h2 className="text-base font-bold text-brand-dark">{title}</h2>
                {description && <p className="text-xs text-brand-muted mt-0.5">{description}</p>}
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    );
}

/* ── Searchable Country Select ─────────────────── */
function SearchableCountrySelect({
    value,
    onChange,
    placeholder = "Select a country…",
    renderLabel = (c: Country) => `${c.flag} ${c.name}`,
    disabled = false,
}: {
    value: string;
    onChange: (code: string) => void;
    placeholder?: string;
    renderLabel?: (c: Country) => string;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    const selected = COUNTRIES.find((c) => c.code === value);
    const q = search.toLowerCase();
    const filtered = COUNTRIES.filter(
        (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.dial.includes(q)
    );

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => { if (!disabled) { setOpen(!open); setSearch(""); } }}
                className={`${inputCls} text-left flex items-center justify-between ${disabled ? "bg-gray-50 cursor-not-allowed opacity-80" : ""}`}
                disabled={disabled}
            >
                <span className={selected ? "" : "text-brand-muted/60"}>
                    {selected ? renderLabel(selected) : placeholder}
                </span>
                {!disabled && (
                    <svg className={`w-4 h-4 text-brand-muted transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-brand-border/60 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-brand-border/40">
                        <input
                            ref={inputRef}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border/40 focus:outline-none focus:border-brand-orange/50 placeholder:text-brand-muted/50"
                            placeholder="Search countries…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 && <p className="text-xs text-brand-muted text-center py-4">No countries found</p>}
                        {filtered.map((c) => (
                            <button
                                key={c.code}
                                type="button"
                                onClick={() => { onChange(c.code); setOpen(false); setSearch(""); }}
                                className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors
                                    ${c.code === value ? "bg-brand-orange/10 text-brand-orange font-semibold" : "hover:bg-gray-50 text-brand-dark"}`}
                            >
                                <span className="text-base">{c.flag}</span>
                                <span className="flex-1">{c.name}</span>
                                <span className="text-brand-muted text-xs">{c.code}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Searchable State Select ───────────────────── */
function SearchableStateSelect({
    countryCode,
    value,
    onChange,
}: {
    countryCode: string;
    value: string;
    onChange: (name: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const states = getStatesForCountry(countryCode);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    const q = search.toLowerCase();
    const filtered = states.filter(
        (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    );

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => { setOpen(!open); setSearch(""); }}
                className={`${inputCls} text-left flex items-center justify-between`}
            >
                <span className={value ? "" : "text-brand-muted/60"}>
                    {value || "Select state / province…"}
                </span>
                <svg className={`w-4 h-4 text-brand-muted transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-brand-border/60 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-brand-border/40">
                        <input
                            ref={inputRef}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border/40 focus:outline-none focus:border-brand-orange/50 placeholder:text-brand-muted/50"
                            placeholder="Search states…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 && <p className="text-xs text-brand-muted text-center py-4">No matches found</p>}
                        {filtered.map((s) => (
                            <button
                                key={s.code}
                                type="button"
                                onClick={() => { onChange(s.name); setOpen(false); setSearch(""); }}
                                className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors
                                    ${s.name === value ? "bg-brand-orange/10 text-brand-orange font-semibold" : "hover:bg-gray-50 text-brand-dark"}`}
                            >
                                <span className="flex-1">{s.name}</span>
                                <span className="text-brand-muted text-xs">{s.code}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Phone Input ───────────────────────────────── */
function PhoneInput({
    code,
    number,
    onCodeChange,
    onNumberChange,
}: {
    code: string;
    number: string;
    onCodeChange: (dial: string) => void;
    onNumberChange: (val: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    const selected = COUNTRIES.find((c) => c.dial === code) ?? COUNTRIES[0];
    const q = search.toLowerCase();
    const filtered = COUNTRIES.filter(
        (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.dial.includes(q)
    );

    return (
        <div className="flex gap-2">
            <div ref={ref} className="relative shrink-0 w-[120px]">
                <button
                    type="button"
                    onClick={() => { setOpen(!open); setSearch(""); }}
                    className={`${inputCls} text-left flex items-center gap-1 !px-3`}
                >
                    <span>{selected.flag}</span>
                    <span className="text-xs font-semibold">{code}</span>
                    <svg className={`w-3 h-3 text-brand-muted ml-auto transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {open && (
                    <div className="absolute z-50 mt-1 w-72 bg-white border border-brand-border/60 rounded-xl shadow-lg overflow-hidden">
                        <div className="p-2 border-b border-brand-border/40">
                            <input
                                ref={inputRef}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border/40 focus:outline-none focus:border-brand-orange/50 placeholder:text-brand-muted/50"
                                placeholder="Search countries…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="max-h-52 overflow-y-auto">
                            {filtered.length === 0 && <p className="text-xs text-brand-muted text-center py-4">No countries found</p>}
                            {filtered.map((c) => (
                                <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => { onCodeChange(c.dial); setOpen(false); setSearch(""); }}
                                    className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors
                                        ${c.dial === code ? "bg-brand-orange/10 text-brand-orange font-semibold" : "hover:bg-gray-50 text-brand-dark"}`}
                                >
                                    <span className="text-base">{c.flag}</span>
                                    <span className="flex-1">{c.name}</span>
                                    <span className="text-brand-muted text-xs font-mono">{c.dial}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <input
                className={inputCls}
                placeholder="(555) 123-4567"
                value={number}
                onChange={(e) => onNumberChange(e.target.value)}
            />
        </div>
    );
}

/* ── Toast notification ────────────────────────── */
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => {
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-in slide-in-from-bottom-4 ${type === "success"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-red-50 text-red-700 border border-red-200"
            }`}>
            <span>{type === "success" ? "✅" : "❌"}</span>
            <span>{message}</span>
            <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">✕</button>
        </div>
    );
}

/* ══════════════════════════════════════════════════
   Profile Settings Page
   ══════════════════════════════════════════════════ */
export default function ProfileSettingsPage() {
    const { user, token, refreshUser } = useAuth();

    /* ── State ─────────────────────────────────── */
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // User-level fields
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [phoneCode, setPhoneCode] = useState("+1");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [country, setCountry] = useState("");
    const [state, setState] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Languages
    const [userLanguages, setUserLanguages] = useState<LanguageEntry[]>([]);
    const [langSearch, setLangSearch] = useState("");
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);

    // Freelancer fields
    const [headline, setHeadline] = useState("");
    const [bio, setBio] = useState("");
    const [hourlyRate, setHourlyRate] = useState("");
    const [experienceYears, setExperienceYears] = useState("");
    const [availabilityStatus, setAvailabilityStatus] = useState("available");
    const [availabilityHoursWeek, setAvailabilityHoursWeek] = useState("40");
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [githubUrl, setGithubUrl] = useState("");
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [profileVisibility, setProfileVisibility] = useState("public");
    const [skills, setSkills] = useState<Array<{ id: string; name: string; slug: string }>>([]);

    /* ── AI assist state ── */
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiPreview, setAiPreview] = useState<{ headline: string; bio: string } | null>(null);

    const isFreelancer = user?.role === "freelancer";

    /* ── Close language dropdown on outside click ── */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(e.target as Node)) setLangDropdownOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* ── Load profile data ─────────────────────── */
    const loadProfile = useCallback(async () => {
        if (!token || !user) return;
        setLoading(true);
        try {
            const authToken = token || localStorage.getItem("mw_token");

            // Fetch user data
            const userRes = await fetch(`${API_BASE}/users/me`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (!userRes.ok) throw new Error("Failed to load profile");
            const { data: userData } = (await userRes.json()) as { data: UserData };

            // Populate user fields
            setFirstName(userData.first_name ?? "");
            setLastName(userData.last_name ?? "");
            setDisplayName(userData.display_name ?? "");
            // avatar_url may be relative (e.g. /files/avatars/...) — prepend API origin
            if (userData.avatar_url) {
                const origin = new URL(API_BASE).origin;
                setAvatarUrl(userData.avatar_url.startsWith("http") ? userData.avatar_url : `${origin}${userData.avatar_url}`);
            } else {
                setAvatarUrl(null);
            }
            setCountry(userData.country ?? "");
            setState(userData.state ?? "");

            // Parse phone
            if (userData.phone) {
                const parts = userData.phone.split(" ");
                if (parts.length >= 2) {
                    setPhoneCode(parts[0]);
                    setPhoneNumber(parts.slice(1).join(" "));
                } else {
                    setPhoneNumber(userData.phone);
                }
            }

            // Parse languages
            let langs: LanguageEntry[] = [];
            if (userData.languages) {
                const raw = typeof userData.languages === "string" ? JSON.parse(userData.languages) : userData.languages;
                if (Array.isArray(raw)) {
                    langs = raw.map((item: unknown) => {
                        if (typeof item === "string") {
                            const found = LANGUAGES.find((l) => l.name === item || l.code === item);
                            return { language: found?.name ?? item, code: found?.code ?? "", level: "conversational" as ProficiencyLevel };
                        }
                        const obj = item as Record<string, string>;
                        return {
                            language: obj.language ?? "",
                            code: obj.code ?? "",
                            level: (obj.level ?? "conversational") as ProficiencyLevel,
                        };
                    });
                }
            }
            setUserLanguages(langs);

            // Fetch freelancer profile if applicable
            if (user.role === "freelancer") {
                const fpRes = await fetch(`${API_BASE}/freelancers/me`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                if (fpRes.ok) {
                    const { data: fp } = (await fpRes.json()) as { data: FreelancerProfile };
                    setHeadline(fp.headline ?? "");
                    setBio(fp.bio ?? "");
                    setHourlyRate(fp.hourly_rate != null ? String(fp.hourly_rate) : "");
                    setExperienceYears(fp.experience_years != null ? String(fp.experience_years) : "");
                    setAvailabilityStatus(fp.availability_status ?? "available");
                    setAvailabilityHoursWeek(fp.availability_hours_week != null ? String(fp.availability_hours_week) : "40");
                    setWebsiteUrl(fp.website_url ?? "");
                    setGithubUrl(fp.github_url ?? "");
                    setLinkedinUrl(fp.linkedin_url ?? "");
                    setProfileVisibility(fp.profile_visibility ?? "public");
                    setSkills(fp.skills ?? []);
                }
            }
        } catch (err) {
            setToast({ message: err instanceof Error ? err.message : "Failed to load profile", type: "error" });
        } finally {
            setLoading(false);
        }
    }, [token, user]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    /* ── Avatar handling ───────────────────────── */
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = () => setAvatarPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const uploadAvatar = async () => {
        if (!avatarFile || !token) return;
        setAvatarUploading(true);
        try {
            const formData = new FormData();
            formData.append("avatar", avatarFile);
            const res = await fetch(`${API_BASE}/users/me/avatar`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error((errBody as Record<string, string>).error || `Upload failed (${res.status})`);
            }
            const result = await res.json();
            // API returns { data: { avatar_url: "/files/avatars/..." } }
            const newUrl = result?.data?.avatar_url ?? result?.avatar_url ?? null;
            if (newUrl) {
                // avatar_url is relative; prepend API origin for display
                const origin = new URL(API_BASE).origin;
                setAvatarUrl(newUrl.startsWith("http") ? newUrl : `${origin}${newUrl}`);
            }
            setAvatarFile(null);
            setAvatarPreview(null);
            setToast({ message: "Avatar updated!", type: "success" });
        } catch (err) {
            setToast({ message: err instanceof Error ? err.message : "Failed to upload avatar", type: "error" });
        } finally {
            setAvatarUploading(false);
        }
    };

    /* ── Save profile ──────────────────────────── */
    const saveProfile = async () => {
        if (!token) return;
        setSaving(true);
        try {
            const authToken = token || localStorage.getItem("mw_token");

            // Upload avatar first if pending
            if (avatarFile) {
                await uploadAvatar();
            }

            // Save user-level fields via PATCH /users/me
            const userBody: Record<string, unknown> = {
                first_name: firstName || null,
                last_name: lastName || null,
                display_name: displayName || null,
                phone: phoneNumber ? `${phoneCode} ${phoneNumber}` : null,
                country: country || null,
                languages: userLanguages.length > 0 ? userLanguages : null,
            };

            const userRes = await fetch(`${API_BASE}/users/me`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(userBody),
            });

            if (!userRes.ok) {
                const b = await userRes.json().catch(() => ({}));
                throw new Error((b as Record<string, string>).error || "Failed to save user profile");
            }

            // Save freelancer fields via PUT /freelancers/me
            if (isFreelancer) {
                const fpBody: Record<string, unknown> = {
                    first_name: firstName || null,
                    last_name: lastName || null,
                    phone: phoneNumber ? `${phoneCode} ${phoneNumber}` : null,
                    country: country || null,
                    state: state || null,
                    languages: userLanguages.length > 0 ? userLanguages : null,
                    headline: headline || null,
                    bio: bio || null,
                    hourly_rate: hourlyRate || null,
                    experience_years: Number(experienceYears) || 0,
                    availability_status: availabilityStatus,
                    availability_hours_week: Number(availabilityHoursWeek) || 40,
                    website_url: websiteUrl || null,
                    github_url: githubUrl || null,
                    linkedin_url: linkedinUrl || null,
                    profile_visibility: profileVisibility,
                };

                const fpRes = await fetch(`${API_BASE}/freelancers/me`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                    body: JSON.stringify(fpBody),
                });

                if (!fpRes.ok) {
                    const b = await fpRes.json().catch(() => ({}));
                    throw new Error((b as Record<string, string>).error || "Failed to save freelancer profile");
                }
            }

            await refreshUser();
            setToast({ message: "Profile saved successfully!", type: "success" });
        } catch (err) {
            setToast({ message: err instanceof Error ? err.message : "Failed to save profile", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    /* ── Language helpers ───────────────────────── */
    const addLanguage = (lang: typeof LANGUAGES[number]) => {
        if (userLanguages.some((l) => l.code === lang.code)) return;
        setUserLanguages((prev) => [...prev, { language: lang.name, code: lang.code, level: "conversational" }]);
        setLangSearch("");
        setLangDropdownOpen(false);
    };

    const removeLanguage = (code: string) => {
        setUserLanguages((prev) => prev.filter((l) => l.code !== code));
    };

    const updateLanguageLevel = (code: string, level: ProficiencyLevel) => {
        setUserLanguages((prev) =>
            prev.map((l) => (l.code === code ? { ...l, level } : l))
        );
    };

    /* ── AI profile enhancement ── */
    const aiEnhanceProfile = async () => {
        setAiGenerating(true);
        setAiPreview(null);
        try {
            const authToken = token || localStorage.getItem("mw_token");
            const res = await fetch(`${API_BASE}/ai/profile/enhance`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                },
                body: JSON.stringify({
                    current_headline: headline,
                    current_bio: bio,
                    skills: skills.map((s) => s.name),
                    experience_years: Number(experienceYears) || 0,
                    tone: "professional",
                }),
            });
            if (res.ok) {
                const body = await res.json();
                const d = body.data || {};
                setAiPreview({
                    headline: d.headline || "",
                    bio: d.bio || "",
                });
            } else {
                setToast({ message: "AI service is temporarily unavailable.", type: "error" });
            }
        } catch {
            setToast({ message: "Could not reach AI service.", type: "error" });
        } finally {
            setAiGenerating(false);
        }
    };

    const filteredLanguages = LANGUAGES.filter(
        (l) =>
            (l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
                l.code.toLowerCase().includes(langSearch.toLowerCase())) &&
            !userLanguages.some((ul) => ul.code === l.code)
    );

    /* ── Loading state ─────────────────────────── */
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3 text-brand-muted">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm">Loading profile…</span>
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
                    <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">Profile Settings</h1>
                    <p className="text-sm text-brand-muted mt-1">Manage your personal information and preferences</p>
                    {isFreelancer && user?.id && (
                        <a
                            href={`/freelancers/${user.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-brand-orange hover:text-brand-orange/80 transition-colors"
                        >
                            🔗 View Public Profile
                            <span className="text-brand-muted font-normal truncate max-w-[200px]">/freelancers/{user.id}</span>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                    )}
                </div>
                <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="px-6 py-2.5 bg-brand-orange text-white text-sm font-bold rounded-xl shadow-[0_4px_14px_rgba(240,138,17,0.3)] hover:shadow-[0_6px_20px_rgba(240,138,17,0.45)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {saving ? "Saving…" : "Save Changes"}
                </button>
            </div>

            {/* ── Avatar & Basic Info ──────────────── */}
            <Section title="Personal Information" description="Your basic profile details visible to others" overflowHidden={false} className="relative z-20">
                <div className="space-y-5">
                    {/* Avatar */}
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-orange/20 to-brand-orange/5 border-2 border-brand-border/40 overflow-hidden flex items-center justify-center">
                                {(avatarPreview || avatarUrl) ? (
                                    <img
                                        src={avatarPreview || avatarUrl || ""}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-3xl text-brand-orange/60">
                                        {firstName ? firstName[0].toUpperCase() : user?.display_name?.[0]?.toUpperCase() ?? "?"}
                                    </span>
                                )}
                            </div>
                            {avatarUploading && (
                                <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 text-brand-orange" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                            <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                className="text-sm font-semibold text-brand-orange hover:text-brand-orange/80 transition-colors"
                            >
                                Change Photo
                            </button>
                            <p className="text-[11px] text-brand-muted mt-0.5">JPG, PNG or WebP. Max 5MB.</p>
                            {avatarFile && (
                                <button
                                    type="button"
                                    onClick={uploadAvatar}
                                    disabled={avatarUploading}
                                    className="mt-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                                >
                                    Upload now
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Name fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="First Name">
                            <input
                                className={inputCls}
                                placeholder="e.g. John"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </Field>
                        <Field label="Last Name">
                            <input
                                className={inputCls}
                                placeholder="e.g. Doe"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </Field>
                    </div>

                    <Field label="Display Name" hint="How your name appears publicly on the platform">
                        <input
                            className={inputCls}
                            placeholder="e.g. JohnD"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                    </Field>

                    <Field label="Email" hint="Contact support to change your email address">
                        <input
                            className={`${inputCls} bg-gray-50 cursor-not-allowed`}
                            value={user?.email ?? ""}
                            disabled
                        />
                    </Field>

                    <Field label="Phone Number">
                        <PhoneInput
                            code={phoneCode}
                            number={phoneNumber}
                            onCodeChange={setPhoneCode}
                            onNumberChange={setPhoneNumber}
                        />
                    </Field>

                    {/* Country & State */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                        <Field 
                            label="Country" 
                            hint={
                                <>
                                    To change your country, please send a ticket to{" "}
                                    <a href="/help/contact" className="text-brand-orange hover:underline">support</a>.
                                </>
                            }
                        >
                            <SearchableCountrySelect
                                value={country}
                                onChange={(code) => { setCountry(code); setState(""); }}
                                disabled={true}
                            />
                        </Field>
                        <Field label="State / Province">
                            {country ? (
                                <SearchableStateSelect
                                    countryCode={country}
                                    value={state}
                                    onChange={setState}
                                />
                            ) : (
                                <input
                                    className={`${inputCls} bg-gray-50 cursor-not-allowed`}
                                    placeholder="Select a country first"
                                    disabled
                                />
                            )}
                        </Field>
                    </div>
                </div>
            </Section>

            {/* ── Languages ────────────────────────── */}
            <Section title="Languages" description="Languages you speak and your proficiency level" overflowHidden={false} className="relative z-10">
                <div className="space-y-4 relative z-10">
                    {/* Current languages */}
                    {userLanguages.length > 0 && (
                        <div className="space-y-2">
                            {userLanguages.map((lang) => (
                                <div
                                    key={lang.code}
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-brand-border/30"
                                >
                                    <span className="text-sm font-medium text-brand-dark flex-1">{lang.language}</span>
                                    <select
                                        className="text-xs px-2 py-1.5 rounded-lg border border-brand-border/40 bg-white text-brand-dark focus:outline-none focus:border-brand-orange"
                                        value={lang.level}
                                        onChange={(e) => updateLanguageLevel(lang.code, e.target.value as ProficiencyLevel)}
                                    >
                                        {PROFICIENCY_LEVELS.map((p) => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => removeLanguage(lang.code)}
                                        className="text-red-400 hover:text-red-600 text-sm transition-colors"
                                        title="Remove language"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add language */}
                    <div ref={langRef} className="relative">
                        <input
                            className={inputCls}
                            placeholder="Search and add a language…"
                            value={langSearch}
                            onChange={(e) => { setLangSearch(e.target.value); setLangDropdownOpen(true); }}
                            onFocus={() => setLangDropdownOpen(true)}
                        />
                        {langDropdownOpen && langSearch && filteredLanguages.length > 0 && (
                            <div className="absolute z-50 mt-1 w-full bg-white border border-brand-border/60 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                                {filteredLanguages.slice(0, 20).map((lang) => (
                                    <button
                                        key={lang.code}
                                        type="button"
                                        onClick={() => addLanguage(lang)}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-brand-dark transition-colors"
                                    >
                                        {lang.name}
                                        <span className="text-brand-muted text-xs ml-2">{lang.code}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {userLanguages.length === 0 && (
                        <p className="text-xs text-brand-muted text-center py-2">No languages added yet. Search above to add one.</p>
                    )}
                </div>
            </Section>

            {/* ── Professional Profile (Freelancer only) ── */}
            {isFreelancer && (
                <Section title="Professional Profile" description="Your freelancer profile details">
                    <div className="space-y-5">
                        <Field label="Headline" hint="A short tagline that appears below your name">
                            <input
                                className={inputCls}
                                placeholder="e.g. Full-Stack Developer | React & Node.js"
                                value={headline}
                                onChange={(e) => setHeadline(e.target.value)}
                                maxLength={120}
                            />
                            <p className="text-[11px] text-brand-muted mt-1 text-right">{headline.length}/120</p>
                        </Field>

                        <Field label="Bio" hint="Tell clients about your experience and expertise">
                            <textarea
                                className={`${inputCls} min-h-[120px] resize-y`}
                                placeholder="Share your professional background, skills, and what makes you unique…"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                maxLength={2000}
                            />
                            <p className="text-[11px] text-brand-muted mt-1 text-right">{bio.length}/2000</p>
                        </Field>

                        {/* AI Assist button */}
                        <button
                            type="button"
                            onClick={aiEnhanceProfile}
                            disabled={aiGenerating}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                                bg-gradient-to-r from-purple-500 to-indigo-500 text-white
                                hover:from-purple-600 hover:to-indigo-600
                                disabled:opacity-50 disabled:cursor-not-allowed
                                shadow-[0_2px_10px_rgba(139,92,246,0.3)]
                                transition-all duration-200"
                        >
                            {aiGenerating ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Generating…
                                </>
                            ) : (
                                <>
                                    ✨ AI Assist — Generate Headline & Bio
                                </>
                            )}
                        </button>
                        <p className="text-[11px] text-brand-muted -mt-3">
                            AI will use your skills and experience to craft a professional profile.
                        </p>

                        {/* AI Preview */}
                        {aiPreview && (
                            <div className="bg-white border-2 border-purple-200 rounded-2xl p-5 shadow-[0_8px_30px_rgba(139,92,246,0.12)] space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-purple-700 flex items-center gap-2">
                                        ✨ AI-Generated Preview
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => setAiPreview(null)}
                                        className="text-brand-muted hover:text-brand-dark text-xs"
                                    >
                                        ✕ Dismiss
                                    </button>
                                </div>

                                {aiPreview.headline && (
                                    <div>
                                        <label className="block text-[11px] font-semibold text-brand-muted uppercase tracking-wide mb-1">Headline</label>
                                        <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-sm text-brand-dark">
                                            {aiPreview.headline}
                                        </div>
                                        {headline && headline !== aiPreview.headline && (
                                            <p className="text-[10px] text-brand-muted mt-1">Current: <span className="italic">{headline}</span></p>
                                        )}
                                    </div>
                                )}

                                {aiPreview.bio && (
                                    <div>
                                        <label className="block text-[11px] font-semibold text-brand-muted uppercase tracking-wide mb-1">Bio</label>
                                        <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-sm text-brand-dark whitespace-pre-wrap">
                                            {aiPreview.bio}
                                        </div>
                                        {bio && bio !== aiPreview.bio && (
                                            <p className="text-[10px] text-brand-muted mt-1">Current: <span className="italic line-clamp-2">{bio}</span></p>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (aiPreview.headline) setHeadline(aiPreview.headline);
                                            if (aiPreview.bio) setBio(aiPreview.bio);
                                            setAiPreview(null);
                                            setToast({ message: "AI-generated content applied!", type: "success" });
                                        }}
                                        className="px-5 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                                    >
                                        ✓ Apply Changes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={aiEnhanceProfile}
                                        disabled={aiGenerating}
                                        className="px-4 py-2 text-purple-600 text-xs font-semibold border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
                                    >
                                        🔄 Regenerate
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAiPreview(null)}
                                        className="px-4 py-2 text-brand-muted text-xs font-semibold rounded-lg hover:text-brand-dark transition-colors"
                                    >
                                        Discard
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Hourly Rate (USD)">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted text-sm">$</span>
                                    <input
                                        className={`${inputCls} pl-8`}
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder="50"
                                        value={hourlyRate}
                                        onChange={(e) => setHourlyRate(e.target.value)}
                                    />
                                </div>
                            </Field>
                            <Field label="Years of Experience">
                                <input
                                    className={inputCls}
                                    type="number"
                                    min="0"
                                    max="50"
                                    placeholder="5"
                                    value={experienceYears}
                                    onChange={(e) => setExperienceYears(e.target.value)}
                                />
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Availability Status">
                                <select
                                    className={selectCls}
                                    value={availabilityStatus}
                                    onChange={(e) => setAvailabilityStatus(e.target.value)}
                                >
                                    <option value="available">Available</option>
                                    <option value="limited">Limited Availability</option>
                                    <option value="busy">Busy</option>
                                    <option value="not_available">Not Available</option>
                                </select>
                            </Field>
                            <Field label="Hours per Week">
                                <input
                                    className={inputCls}
                                    type="number"
                                    min="1"
                                    max="80"
                                    placeholder="40"
                                    value={availabilityHoursWeek}
                                    onChange={(e) => setAvailabilityHoursWeek(e.target.value)}
                                />
                            </Field>
                        </div>

                        {/* Skills (read-only) */}
                        {skills.length > 0 && (
                            <Field label="Skills" hint="Manage your skills from Settings → Skills & Rate">
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {skills.map((s) => (
                                        <span
                                            key={s.id}
                                            className="inline-flex items-center px-3 py-1.5 bg-brand-orange/10 text-brand-orange text-xs font-semibold rounded-full"
                                        >
                                            {s.name}
                                        </span>
                                    ))}
                                </div>
                            </Field>
                        )}
                    </div>
                </Section>
            )}

            {/* ── Social Links (Freelancer only) ────── */}
            {isFreelancer && (
                <Section title="Social Links" description="Connect your professional profiles">
                    <div className="space-y-4">
                        <Field label="Website URL">
                            <input
                                className={inputCls}
                                type="url"
                                placeholder="https://yourwebsite.com"
                                value={websiteUrl}
                                onChange={(e) => setWebsiteUrl(e.target.value)}
                            />
                        </Field>
                        <Field label="LinkedIn URL">
                            <input
                                className={inputCls}
                                type="url"
                                placeholder="https://linkedin.com/in/yourprofile"
                                value={linkedinUrl}
                                onChange={(e) => setLinkedinUrl(e.target.value)}
                            />
                        </Field>
                        <Field label="GitHub URL">
                            <input
                                className={inputCls}
                                type="url"
                                placeholder="https://github.com/yourusername"
                                value={githubUrl}
                                onChange={(e) => setGithubUrl(e.target.value)}
                            />
                        </Field>
                    </div>
                </Section>
            )}

            {/* ── Profile Visibility (Freelancer only) ── */}
            {isFreelancer && (
                <Section title="Profile Visibility" description="Control who can see your public profile">
                    <div className="space-y-4">
                        <Field label="Who can view your profile?" hint="This controls access to your public profile page">
                            <select
                                className={selectCls}
                                value={profileVisibility}
                                onChange={(e) => setProfileVisibility(e.target.value)}
                            >
                                <option value="public">🌐 Public — Anyone can view</option>
                                <option value="logged_in">🔒 Logged-in users only</option>
                                <option value="private">🚫 Private — Hidden from everyone</option>
                            </select>
                        </Field>
                        {profileVisibility === "public" && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
                                ✅ Your profile is visible to everyone, including search engines.
                            </div>
                        )}
                        {profileVisibility === "logged_in" && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
                                🔒 Only registered MonkeysWork users can view your profile.
                            </div>
                        )}
                        {profileVisibility === "private" && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                                ⚠️ Your profile is hidden. Clients won&apos;t be able to find or view your profile.
                            </div>
                        )}
                    </div>
                </Section>
            )}

            {/* Bottom save button */}
            <div className="flex justify-end pt-2 pb-8">
                <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="px-8 py-3 bg-brand-orange text-white text-sm font-bold rounded-xl shadow-[0_4px_14px_rgba(240,138,17,0.3)] hover:shadow-[0_6px_20px_rgba(240,138,17,0.45)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {saving ? "Saving…" : "Save Changes"}
                </button>
            </div>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
