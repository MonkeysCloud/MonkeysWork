"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import COUNTRIES, { type Country } from "@/data/countries";
import { getStatesForCountry } from "@/data/states";
import LANGUAGES, { PROFICIENCY_LEVELS, type ProficiencyLevel } from "@/data/languages";

interface LanguageEntry {
    language: string;   // language name
    code: string;       // ISO code
    level: ProficiencyLevel;
}

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Types ──────────────────────────────────────── */
interface FormData {
    /* user-level */
    first_name: string;
    last_name: string;
    phone: string;
    phone_code: string;
    country: string;
    state: string;
    /* client-level */
    company_name: string;
    company_website: string;
    company_size: string;
    industry: string;
    company_description: string;
    /* freelancer-level */
    headline: string;
    bio: string;
    hourly_rate: string;
    experience_years: string;
    availability_status: string;
    availability_hours_week: string;
    website_url: string;
    github_url: string;
    linkedin_url: string;
    skill_ids: string[];
}

interface VerificationEvidence {
    identity: {
        government_id_url: string;
        selfie_url: string;
        full_name: string;
        date_of_birth: string;
        country: string;
        state: string;
        city: string;
        zip: string;
        address: string;
    };
    portfolio: {
        urls: string[];
        description: string;
    };
    skill_assessment: {
        certification_urls: string[];
        years_experience: string;
    };
    work_history: {
        previous_jobs: string[];
    };
    payment_method: {
        tax_id_type: string;
        tax_id: string;
        billing_country: string;
        billing_state: string;
        billing_city: string;
        billing_address: string;
        billing_zip: string;
    };
}

interface VerificationStatus {
    type: string;
    status: string;
    confidence_score: number | null;
}

const EMPTY: FormData = {
    first_name: "",
    last_name: "",
    phone: "",
    phone_code: "+1",
    country: "",
    state: "",
    company_name: "",
    company_website: "",
    company_size: "",
    industry: "",
    company_description: "",
    headline: "",
    bio: "",
    hourly_rate: "",
    experience_years: "",
    availability_status: "available",
    availability_hours_week: "40",
    website_url: "",
    github_url: "",
    linkedin_url: "",
    skill_ids: [],
};

const EMPTY_VERIFICATION: VerificationEvidence = {
    identity: { government_id_url: "", selfie_url: "", full_name: "", date_of_birth: "", country: "", state: "", city: "", zip: "", address: "" },
    portfolio: { urls: [""], description: "" },
    skill_assessment: { certification_urls: [""], years_experience: "" },
    work_history: { previous_jobs: [""] },
    payment_method: { tax_id_type: "", tax_id: "", billing_country: "", billing_state: "", billing_city: "", billing_address: "", billing_zip: "" },
};

const VERIFICATION_TYPES = [
    {
        key: "identity" as const,
        label: "Identity Verification",
        icon: "🪪",
        description: "Verify your identity with a government-issued ID and selfie.",
    },
    {
        key: "portfolio" as const,
        label: "Portfolio Verification",
        icon: "💼",
        description: "Showcase your best work with project links and descriptions.",
    },
    {
        key: "skill_assessment" as const,
        label: "Skills Verification",
        icon: "🎯",
        description: "Prove your expertise with certifications or assessments.",
    },
    {
        key: "work_history" as const,
        label: "Work History",
        icon: "📋",
        description: "Verify your professional background and experience.",
    },
    {
        key: "payment_method" as const,
        label: "Payment Setup",
        icon: "💳",
        description: "Set up your payment details to receive earnings.",
    },
];

const COMPANY_SIZES = ["solo", "2-10", "11-50", "51-200", "201-500", "500+"];
const INDUSTRIES = [
    "Technology",
    "Finance",
    "Healthcare",
    "Education",
    "E-commerce",
    "Marketing",
    "Design",
    "Construction",
    "Media",
    "Other",
];
const AVAILABILITY = [
    { value: "available", label: "Available" },
    { value: "partially", label: "Partially Available" },
    { value: "unavailable", label: "Not Available" },
];

interface Skill {
    id: string;
    name: string;
    category_name?: string;
}

/* ── Stepper ────────────────────────────────────── */
function Stepper({
    steps,
    current,
}: {
    steps: string[];
    current: number;
}) {
    return (
        <div className="flex items-center gap-2 mb-10">
            {steps.map((label, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <div key={label} className="flex items-center gap-2 flex-1">
                        <div
                            className={`
                                w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                                transition-all duration-300
                                ${done
                                    ? "bg-emerald-500 text-white shadow-[0_2px_10px_rgba(16,185,129,0.4)]"
                                    : active
                                        ? "bg-brand-orange text-white shadow-[0_4px_20px_rgba(240,138,17,0.4)]"
                                        : "bg-gray-200 text-gray-500"
                                }
                            `}
                        >
                            {done ? "✓" : i + 1}
                        </div>
                        <span
                            className={`text-xs font-semibold hidden sm:block ${active
                                ? "text-brand-dark"
                                : done
                                    ? "text-emerald-600"
                                    : "text-brand-muted"
                                }`}
                        >
                            {label}
                        </span>
                        {i < steps.length - 1 && (
                            <div
                                className={`flex-1 h-0.5 mx-1 rounded-full ${done ? "bg-emerald-400" : "bg-gray-200"
                                    }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ── Field helpers ──────────────────────────────── */
function Field({
    label,
    required,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

const inputCls =
    "w-full px-4 py-3 rounded-xl border border-brand-border/60 bg-white text-sm text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all";

const selectCls = inputCls + " appearance-none";

/* ── SearchableCountrySelect ───────────────────── */
function SearchableCountrySelect({
    value,
    onChange,
    placeholder = "Select a country…",
    renderLabel = (c: Country) => `${c.flag} ${c.name}`,
}: {
    value: string;
    onChange: (code: string) => void;
    placeholder?: string;
    renderLabel?: (c: Country) => string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    /* close on outside click */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* auto-focus search when opened */
    useEffect(() => {
        if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    const selected = COUNTRIES.find((c) => c.code === value);
    const q = search.toLowerCase();
    const filtered = COUNTRIES.filter(
        (c) =>
            c.name.toLowerCase().includes(q) ||
            c.code.toLowerCase().includes(q) ||
            c.dial.includes(q)
    );

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => { setOpen(!open); setSearch(""); }}
                className={`${inputCls} text-left flex items-center justify-between`}
            >
                <span className={selected ? "" : "text-brand-muted/60"}>
                    {selected ? renderLabel(selected) : placeholder}
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
                            placeholder="Search countries…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 && (
                            <p className="text-xs text-brand-muted text-center py-4">No countries found</p>
                        )}
                        {filtered.map((c) => (
                            <button
                                key={c.code}
                                type="button"
                                onClick={() => { onChange(c.code); setOpen(false); setSearch(""); }}
                                className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors
                                    ${c.code === value
                                        ? "bg-brand-orange/10 text-brand-orange font-semibold"
                                        : "hover:bg-gray-50 text-brand-dark"
                                    }`}
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

/* ── SearchableStateSelect ─────────────────────── */
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
        (s) =>
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q)
    );

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => { setOpen(!open); setSearch(""); }}
                className={`${inputCls} text-left flex items-center justify-between`}
            >
                <span className={value ? "" : "text-brand-muted/60"}>
                    {value || "Select state / province\u2026"}
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
                            placeholder="Search states\u2026"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 && (
                            <p className="text-xs text-brand-muted text-center py-4">No matches found</p>
                        )}
                        {filtered.map((s) => (
                            <button
                                key={s.code}
                                type="button"
                                onClick={() => { onChange(s.name); setOpen(false); setSearch(""); }}
                                className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors
                                    ${s.name === value
                                        ? "bg-brand-orange/10 text-brand-orange font-semibold"
                                        : "hover:bg-gray-50 text-brand-dark"
                                    }`}
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

/* ── PhoneInput with dial-code selector ────────── */
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
        (c) =>
            c.name.toLowerCase().includes(q) ||
            c.code.toLowerCase().includes(q) ||
            c.dial.includes(q)
    );

    return (
        <div className="flex gap-2">
            {/* dial-code dropdown */}
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
                            {filtered.length === 0 && (
                                <p className="text-xs text-brand-muted text-center py-4">No countries found</p>
                            )}
                            {filtered.map((c) => (
                                <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => { onCodeChange(c.dial); setOpen(false); setSearch(""); }}
                                    className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors
                                        ${c.dial === code
                                            ? "bg-brand-orange/10 text-brand-orange font-semibold"
                                            : "hover:bg-gray-50 text-brand-dark"
                                        }`}
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

            {/* number input */}
            <input
                className={inputCls}
                placeholder="(555) 123-4567"
                value={number}
                onChange={(e) => onNumberChange(e.target.value)}
            />
        </div>
    );
}

/* ── Wizard ─────────────────────────────────────── */
const WIZARD_STORAGE_KEY = "mw_profile_wizard_draft";

export default function CompleteProfileWizard() {
    const { user, token, setProfileCompleted } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState<FormData>(EMPTY);
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [skills, setSkills] = useState<Skill[]>([]);
    const [skillSearch, setSkillSearch] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [userLanguages, setUserLanguages] = useState<LanguageEntry[]>([]);
    const [langSearch, setLangSearch] = useState("");
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);

    const isClient = user?.role === "client";
    const [verifEvidence, setVerifEvidence] = useState<VerificationEvidence>(EMPTY_VERIFICATION);
    const [verifStatuses, setVerifStatuses] = useState<VerificationStatus[]>([]);
    const [verifSubmitting, setVerifSubmitting] = useState<string | null>(null);
    const [govIdMode, setGovIdMode] = useState<"upload" | "camera">("upload");
    const [govIdUploading, setGovIdUploading] = useState(false);
    const govIdFileRef = useRef<HTMLInputElement>(null);
    const govIdVideoRef = useRef<HTMLVideoElement>(null);
    const govIdCanvasRef = useRef<HTMLCanvasElement>(null);
    const [govIdStream, setGovIdStream] = useState<MediaStream | null>(null);
    const [govIdCaptured, setGovIdCaptured] = useState<string | null>(null);

    /* Cleanup camera stream on mode change or unmount */
    useEffect(() => {
        return () => {
            govIdStream?.getTracks().forEach((t) => t.stop());
        };
    }, [govIdStream]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
            });
            setGovIdStream(stream);
            setGovIdCaptured(null);
            // Attach stream to video element after render
            setTimeout(() => {
                if (govIdVideoRef.current) {
                    govIdVideoRef.current.srcObject = stream;
                }
            }, 100);
        } catch {
            setError("Unable to access camera. Please check permissions or use file upload instead.");
            setGovIdMode("upload");
        }
    };

    const stopCamera = () => {
        govIdStream?.getTracks().forEach((t) => t.stop());
        setGovIdStream(null);
        setGovIdCaptured(null);
    };

    const capturePhoto = () => {
        const video = govIdVideoRef.current;
        const canvas = govIdCanvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setGovIdCaptured(dataUrl);
        // Stop the stream after capturing
        govIdStream?.getTracks().forEach((t) => t.stop());
        setGovIdStream(null);
    };

    const uploadCapturedPhoto = async () => {
        if (!govIdCaptured) return;
        const authToken = token || localStorage.getItem("mw_token");
        if (!authToken) { setError("Not authenticated. Please log in again."); return; }
        setGovIdUploading(true);
        try {
            const res2 = await fetch(govIdCaptured);
            const blob = await res2.blob();
            const file = new File([blob], `gov-id-${crypto.randomUUID()}.jpg`, { type: "image/jpeg" });
            const fd = new window.FormData();
            fd.append("files", file);
            fd.append("entity_type", "verification");
            fd.append("entity_id", user?.id ?? "");
            fd.append("label", "government_id");
            const res = await fetch(`${API_BASE}/attachments/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${authToken}` },
                body: fd,
            });
            if (res.ok) {
                const body = await res.json();
                const fileUrl = body.data?.[0]?.file_url || "";
                // file_url is relative like /files/attachments/..., prepend API host
                const apiHost = API_BASE.replace(/\/api\/v1$/, "");
                const url = fileUrl ? `${apiHost}${fileUrl}` : "";
                setVerifEvidence((p) => ({
                    ...p,
                    identity: { ...p.identity, government_id_url: url },
                }));
                // Stop camera and exit camera mode
                govIdStream?.getTracks().forEach((t) => t.stop());
                setGovIdStream(null);
                setGovIdCaptured(null);
                setGovIdMode("upload");
            } else {
                setError("Failed to upload photo. Please try again.");
            }
        } catch {
            setError("Upload failed. Please try again.");
        } finally {
            setGovIdUploading(false);
        }
    };

    const steps = isClient
        ? ["Personal Info", "Company Info"]
        : ["Personal Info", "Professional", "Skills & Links", "Verification"];

    /* fetch skills for freelancer */
    useEffect(() => {
        if (isClient) return;
        fetch(`${API_BASE}/skills/?limit=200`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then((r) => r.json())
            .then((b) => setSkills(b.data ?? []))
            .catch(() => { });
    }, [isClient, token]);

    /* Already completed? Redirect */
    useEffect(() => {
        if (user?.profile_completed) {
            localStorage.removeItem(WIZARD_STORAGE_KEY);
            router.replace("/dashboard");
        }
    }, [user, router]);

    /* ── Auto-save: restore from localStorage on mount ── */
    useEffect(() => {
        try {
            const saved = localStorage.getItem(WIZARD_STORAGE_KEY);
            if (!saved) return;
            const draft = JSON.parse(saved);
            if (draft.form) setForm((prev) => ({ ...prev, ...draft.form }));
            if (typeof draft.step === "number") setStep(draft.step);
            if (draft.verifEvidence) setVerifEvidence((prev) => {
                const merged = { ...prev };
                for (const k of Object.keys(prev) as (keyof VerificationEvidence)[]) {
                    if (draft.verifEvidence[k]) merged[k] = { ...prev[k], ...draft.verifEvidence[k] } as never;
                }
                return merged;
            });
            if (Array.isArray(draft.userLanguages) && draft.userLanguages.length > 0) setUserLanguages(draft.userLanguages);
        } catch { /* ignore corrupt data */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── Auto-save: persist to localStorage on changes (debounced) ── */
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                const draft = { form, step, verifEvidence, userLanguages };
                localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(draft));
            } catch { /* storage full or unavailable */ }
        }, 500);
        return () => clearTimeout(timer);
    }, [form, step, verifEvidence, userLanguages]);

    const set = useCallback(
        (field: keyof FormData, value: string | string[]) =>
            setForm((prev) => ({ ...prev, [field]: value })),
        []
    );

    /* ── Submit ──────────────────────────────── */
    const submit = async () => {
        setSaving(true);
        setError("");

        try {
            /* Upload avatar first if selected */
            if (avatarFile) {
                setAvatarUploading(true);
                const avatarForm = new window.FormData();
                avatarForm.append("avatar", avatarFile);
                const avatarRes = await fetch(`${API_BASE}/users/me/avatar`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: avatarForm,
                });
                if (!avatarRes.ok) {
                    const b = await avatarRes.json().catch(() => ({}));
                    throw new Error((b as Record<string, string>).error || "Failed to upload avatar");
                }
                setAvatarUploading(false);
            }

            const endpoint = isClient ? "/clients/me" : "/freelancers/me";
            const body: Record<string, unknown> = {
                first_name: form.first_name,
                last_name: form.last_name,
                phone: form.phone ? `${form.phone_code} ${form.phone}` : null,
                country: form.country || null,
                state: form.state || null,
                languages: userLanguages.length > 0 ? userLanguages : null,
            };

            if (isClient) {
                Object.assign(body, {
                    company_name: form.company_name || null,
                    company_website: form.company_website || null,
                    company_size: form.company_size || null,
                    industry: form.industry || null,
                    company_description: form.company_description || null,
                });
            } else {
                Object.assign(body, {
                    headline: form.headline || null,
                    bio: form.bio || null,
                    hourly_rate: form.hourly_rate || null,
                    experience_years: Number(form.experience_years) || 0,
                    availability_status: form.availability_status,
                    availability_hours_week:
                        Number(form.availability_hours_week) || 40,
                    website_url: form.website_url || null,
                    github_url: form.github_url || null,
                    linkedin_url: form.linkedin_url || null,
                });
            }

            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error(
                    (b as Record<string, string>).error || "Failed to save profile"
                );
            }

            /* Save skills for freelancer */
            if (!isClient && form.skill_ids.length > 0) {
                await fetch(`${API_BASE}/freelancers/me/skills/`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        skill_ids: form.skill_ids,
                    }),
                });
            }

            setProfileCompleted();
            localStorage.removeItem(WIZARD_STORAGE_KEY);

            // Auto-trigger verification evaluation for freelancers only
            // (the endpoint requires a freelancer profile to evaluate)
            if (!isClient) {
                try {
                    await fetch(`${API_BASE}/verifications/evaluate`, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    });
                } catch {
                    // Non-critical — verifications can be triggered later from settings
                }
            }

            router.push("/dashboard");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    const canNext = () => {
        if (step === 0) return form.first_name.trim() && form.last_name.trim();
        return true;
    };

    if (!user) return null;

    /* ── Step renderers ──────────────────────── */
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError("Avatar must be under 5 MB");
            return;
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        setError("");
    };

    const renderPersonalStep = () => (
        <div className="space-y-6">
            {/* Avatar picker */}
            <div className="flex flex-col items-center gap-3">
                <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-brand-border/60 hover:border-brand-orange transition-all"
                >
                    {avatarPreview ? (
                        <img
                            src={avatarPreview}
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-brand-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    )}
                    {/* hover overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                </button>
                <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                />
                <p className="text-xs text-brand-muted">
                    {avatarPreview ? "Click to change photo" : "Upload profile photo"}
                    <span className="text-brand-muted/50 ml-1">(optional)</span>
                </p>
                {avatarUploading && (
                    <p className="text-xs text-brand-orange animate-pulse">Uploading…</p>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="First Name" required>
                    <input
                        className={inputCls}
                        placeholder="John"
                        value={form.first_name}
                        onChange={(e) => set("first_name", e.target.value)}
                    />
                </Field>
                <Field label="Last Name" required>
                    <input
                        className={inputCls}
                        placeholder="Doe"
                        value={form.last_name}
                        onChange={(e) => set("last_name", e.target.value)}
                    />
                </Field>
                <Field label="Phone">
                    <PhoneInput
                        code={form.phone_code}
                        number={form.phone}
                        onCodeChange={(dial) => set("phone_code", dial)}
                        onNumberChange={(val) => set("phone", val)}
                    />
                </Field>
                <Field label="Country">
                    <SearchableCountrySelect
                        value={form.country}
                        onChange={(code) => {
                            set("country", code);
                            set("state", ""); // reset state when country changes
                        }}
                        placeholder="Select your country…"
                    />
                </Field>
                <Field label="State / Province">
                    {form.country && getStatesForCountry(form.country).length > 0 ? (
                        <SearchableStateSelect
                            countryCode={form.country}
                            value={form.state}
                            onChange={(val) => set("state", val)}
                        />
                    ) : (
                        <input
                            className={inputCls}
                            placeholder="e.g. California, Ontario…"
                            value={form.state}
                            onChange={(e) => set("state", e.target.value)}
                        />
                    )}
                </Field>
            </div>

            {/* Languages section */}
            <div>
                <p className="text-sm font-medium text-brand-dark mb-3">Languages <span className="text-brand-muted/50 font-normal">(optional)</span></p>

                {/* Already added languages */}
                {userLanguages.length > 0 && (
                    <div className="space-y-2 mb-3">
                        {userLanguages.map((entry, idx) => (
                            <div key={entry.code} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                                <span className="text-sm font-medium text-brand-dark flex-1">{entry.language}</span>
                                <select
                                    className="text-xs border border-brand-border/40 rounded-lg px-2 py-1.5 bg-white text-brand-dark focus:outline-none focus:border-brand-orange/50"
                                    value={entry.level}
                                    onChange={(e) => {
                                        const updated = [...userLanguages];
                                        updated[idx] = { ...updated[idx], level: e.target.value as ProficiencyLevel };
                                        setUserLanguages(updated);
                                    }}
                                >
                                    {PROFICIENCY_LEVELS.map((lvl) => (
                                        <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setUserLanguages(userLanguages.filter((_, i) => i !== idx))}
                                    className="text-brand-muted/50 hover:text-red-500 transition-colors p-1"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add language dropdown */}
                <div ref={langRef} className="relative">
                    <button
                        type="button"
                        onClick={() => { setLangDropdownOpen(!langDropdownOpen); setLangSearch(""); }}
                        className={`${inputCls} text-left flex items-center gap-2 text-brand-muted/60`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add a language…
                    </button>

                    {langDropdownOpen && (
                        <div className="absolute z-50 mt-1 w-full bg-white border border-brand-border/60 rounded-xl shadow-lg overflow-hidden">
                            <div className="p-2 border-b border-brand-border/40">
                                <input
                                    autoFocus
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border/40 focus:outline-none focus:border-brand-orange/50 placeholder:text-brand-muted/50"
                                    placeholder="Search languages…"
                                    value={langSearch}
                                    onChange={(e) => setLangSearch(e.target.value)}
                                />
                            </div>
                            <div className="max-h-52 overflow-y-auto">
                                {(() => {
                                    const addedCodes = new Set(userLanguages.map((l) => l.code));
                                    const q = langSearch.toLowerCase();
                                    const filtered = LANGUAGES.filter(
                                        (l) =>
                                            !addedCodes.has(l.code) &&
                                            (l.name.toLowerCase().includes(q) ||
                                                l.native.toLowerCase().includes(q) ||
                                                l.code.toLowerCase().includes(q))
                                    );
                                    if (filtered.length === 0) {
                                        return <p className="text-xs text-brand-muted text-center py-4">No matches</p>;
                                    }
                                    return filtered.map((l) => (
                                        <button
                                            key={l.code}
                                            type="button"
                                            onClick={() => {
                                                setUserLanguages([...userLanguages, { language: l.name, code: l.code, level: "intermediate" }]);
                                                setLangDropdownOpen(false);
                                                setLangSearch("");
                                            }}
                                            className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 hover:bg-gray-50 text-brand-dark transition-colors"
                                        >
                                            <span className="flex-1">{l.name}</span>
                                            <span className="text-brand-muted/60 text-xs">{l.native}</span>
                                        </button>
                                    ));
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderClientCompanyStep = () => (
        <div className="space-y-5">
            <Field label="Company Name">
                <input
                    className={inputCls}
                    placeholder="Acme Inc."
                    value={form.company_name}
                    onChange={(e) => set("company_name", e.target.value)}
                />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Company Website">
                    <input
                        className={inputCls}
                        placeholder="https://acme.com"
                        value={form.company_website}
                        onChange={(e) =>
                            set("company_website", e.target.value)
                        }
                    />
                </Field>
                <Field label="Company Size">
                    <select
                        className={selectCls}
                        value={form.company_size}
                        onChange={(e) => set("company_size", e.target.value)}
                    >
                        <option value="">Select…</option>
                        {COMPANY_SIZES.map((s) => (
                            <option key={s} value={s}>
                                {s} employees
                            </option>
                        ))}
                    </select>
                </Field>
            </div>
            <Field label="Industry">
                <select
                    className={selectCls}
                    value={form.industry}
                    onChange={(e) => set("industry", e.target.value)}
                >
                    <option value="">Select…</option>
                    {INDUSTRIES.map((i) => (
                        <option key={i} value={i}>
                            {i}
                        </option>
                    ))}
                </select>
            </Field>
            <Field label="About Your Company">
                <textarea
                    className={inputCls + " min-h-[100px] resize-y"}
                    placeholder="Tell freelancers about your company…"
                    value={form.company_description}
                    onChange={(e) =>
                        set("company_description", e.target.value)
                    }
                />
            </Field>
        </div>
    );

    const renderFreelancerProfessionalStep = () => (
        <div className="space-y-5">
            <Field label="Professional Headline" required>
                <input
                    className={inputCls}
                    placeholder="Full-Stack Developer | React & Node.js Expert"
                    value={form.headline}
                    onChange={(e) => set("headline", e.target.value)}
                />
            </Field>
            <Field label="Bio">
                <textarea
                    className={inputCls + " min-h-[100px] resize-y"}
                    placeholder="Tell clients about your experience and expertise…"
                    value={form.bio}
                    onChange={(e) => set("bio", e.target.value)}
                />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Field label="Hourly Rate ($)">
                    <input
                        type="number"
                        className={inputCls}
                        placeholder="50"
                        min="1"
                        value={form.hourly_rate}
                        onChange={(e) => set("hourly_rate", e.target.value)}
                    />
                </Field>
                <Field label="Experience (years)">
                    <input
                        type="number"
                        className={inputCls}
                        placeholder="5"
                        min="0"
                        value={form.experience_years}
                        onChange={(e) =>
                            set("experience_years", e.target.value)
                        }
                    />
                </Field>
                <Field label="Availability">
                    <select
                        className={selectCls}
                        value={form.availability_status}
                        onChange={(e) =>
                            set("availability_status", e.target.value)
                        }
                    >
                        {AVAILABILITY.map((a) => (
                            <option key={a.value} value={a.value}>
                                {a.label}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>
            <Field label="Hours per week">
                <input
                    type="number"
                    className={inputCls}
                    placeholder="40"
                    min="1"
                    max="80"
                    value={form.availability_hours_week}
                    onChange={(e) =>
                        set("availability_hours_week", e.target.value)
                    }
                />
            </Field>
        </div>
    );

    const filteredSkills = skills.filter((s) =>
        s.name.toLowerCase().includes(skillSearch.toLowerCase())
    );

    const renderFreelancerSkillsStep = () => (
        <div className="space-y-6">
            {/* Skills picker */}
            <div>
                <label className="block text-sm font-semibold text-brand-dark mb-2">
                    Skills
                </label>
                {/* selected */}
                {form.skill_ids.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {form.skill_ids.map((sid) => {
                            const s = skills.find((x) => x.id === sid);
                            return (
                                <button
                                    key={sid}
                                    type="button"
                                    onClick={() =>
                                        set(
                                            "skill_ids",
                                            form.skill_ids.filter(
                                                (x) => x !== sid
                                            )
                                        )
                                    }
                                    className="px-3 py-1.5 text-xs font-semibold bg-brand-orange/10 text-brand-orange border border-brand-orange/30 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all"
                                >
                                    {s?.name ?? sid} ×
                                </button>
                            );
                        })}
                    </div>
                )}
                {/* search */}
                <input
                    className={inputCls + " mb-2"}
                    placeholder="Search skills…"
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                />
                <div className="max-h-48 overflow-y-auto border border-brand-border/40 rounded-xl p-2 space-y-1">
                    {filteredSkills.length === 0 && (
                        <p className="text-xs text-brand-muted text-center py-3">
                            No skills found
                        </p>
                    )}
                    {filteredSkills.slice(0, 50).map((s) => {
                        const selected = form.skill_ids.includes(s.id);
                        return (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                    if (selected) {
                                        set(
                                            "skill_ids",
                                            form.skill_ids.filter(
                                                (x) => x !== s.id
                                            )
                                        );
                                    } else {
                                        set("skill_ids", [
                                            ...form.skill_ids,
                                            s.id,
                                        ]);
                                    }
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selected
                                    ? "bg-brand-orange/10 text-brand-orange font-semibold"
                                    : "hover:bg-gray-50 text-brand-dark"
                                    }`}
                            >
                                {selected ? "✓ " : ""}
                                {s.name}
                                {s.category_name && (
                                    <span className="text-brand-muted text-xs ml-2">
                                        — {s.category_name}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Field label="Website">
                    <input
                        className={inputCls}
                        placeholder="https://yoursite.com"
                        value={form.website_url}
                        onChange={(e) => set("website_url", e.target.value)}
                    />
                </Field>
                <Field label="GitHub">
                    <input
                        className={inputCls}
                        placeholder="https://github.com/you"
                        value={form.github_url}
                        onChange={(e) => set("github_url", e.target.value)}
                    />
                </Field>
                <Field label="LinkedIn">
                    <input
                        className={inputCls}
                        placeholder="https://linkedin.com/in/you"
                        value={form.linkedin_url}
                        onChange={(e) => set("linkedin_url", e.target.value)}
                    />
                </Field>
            </div>
        </div>
    );

    /* ── Submit single verification ───────────── */
    const submitVerification = async (type: keyof VerificationEvidence) => {
        setVerifSubmitting(type);
        try {
            // Transform evidence for API
            const raw = verifEvidence[type];
            const payload: Record<string, unknown> = { ...raw };

            if (type === "portfolio") {
                payload.urls = verifEvidence.portfolio.urls.filter(Boolean);
            }
            if (type === "skill_assessment") {
                payload.certification_urls = verifEvidence.skill_assessment.certification_urls.filter(Boolean);
            }
            if (type === "work_history") {
                const jobs = verifEvidence.work_history.previous_jobs.filter(Boolean);
                payload.previous_jobs = jobs.map((j) => ({ title: j.trim() }));
                // Include LinkedIn from Step 3 profile data
                if (form.linkedin_url) payload.linkedin_url = form.linkedin_url;
            }

            const authToken = token || localStorage.getItem("mw_token");
            const res = await fetch(`${API_BASE}/verifications/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    type,
                    document_urls: payload.government_id_url ? [payload.government_id_url] : [],
                    metadata: payload,
                }),
            });

            if (res.ok) {
                const result = await res.json();
                setVerifStatuses((prev) => {
                    const filtered = prev.filter((v) => v.type !== type);
                    return [...filtered, {
                        type,
                        status: result.status || "pending",
                        confidence_score: result.confidence_score ?? null,
                    }];
                });
            } else {
                setError("Verification submission failed. You can retry later from your dashboard.");
            }
        } catch {
            setError("Verification service unavailable. You can submit later.");
        } finally {
            setVerifSubmitting(null);
        }
    };

    const getVerifStatus = (type: string) => verifStatuses.find((v) => v.type === type);

    const renderVerificationStep = () => (
        <div className="space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-2">
                <p className="text-sm text-amber-800">
                    <span className="font-bold">💡 Optional but recommended.</span>{" "}
                    Verified freelancers get up to <span className="font-bold">3x more visibility</span> in search results.
                    You can skip this step and verify later from your dashboard.
                </p>
            </div>

            <div className="space-y-4">
                {VERIFICATION_TYPES.map((vt) => {
                    const status = getVerifStatus(vt.key);
                    const isSubmitted = !!status;
                    const isApproved = status?.status === "approved" || status?.status === "auto_approved";
                    const isPending = status?.status === "pending" || status?.status === "human_review";
                    const isRejected = status?.status === "rejected" || status?.status === "auto_rejected";
                    const isSubmittingThis = verifSubmitting === vt.key;

                    return (
                        <div
                            key={vt.key}
                            className={`border rounded-xl overflow-hidden transition-all ${isApproved
                                ? "border-emerald-300 bg-emerald-50/50"
                                : isPending
                                    ? "border-amber-300 bg-amber-50/30"
                                    : isRejected
                                        ? "border-red-300 bg-red-50/30"
                                        : "border-brand-border/60 bg-white"
                                }`}
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 px-4 py-3">
                                <span className="text-2xl">{vt.icon}</span>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-brand-dark">{vt.label}</h3>
                                    <p className="text-xs text-brand-muted">{vt.description}</p>
                                </div>
                                {isApproved && (
                                    <span className="px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full">✓ Verified</span>
                                )}
                                {isPending && (
                                    <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-700 rounded-full">⏳ Pending</span>
                                )}
                                {isRejected && (
                                    <span className="px-2.5 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full">✗ Rejected</span>
                                )}
                            </div>

                            {/* Evidence fields — collapsed if already approved */}
                            {!isApproved && (
                                <div className="px-4 pb-4 space-y-3 border-t border-brand-border/30 pt-3">
                                    {vt.key === "identity" && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <Field label="Full Legal Name">
                                                <input
                                                    className={inputCls}
                                                    placeholder="John Michael Doe"
                                                    value={verifEvidence.identity.full_name}
                                                    onChange={(e) => setVerifEvidence((p) => ({
                                                        ...p,
                                                        identity: { ...p.identity, full_name: e.target.value },
                                                    }))}
                                                />
                                            </Field>
                                            <Field label="Date of Birth">
                                                <input
                                                    type="date"
                                                    className={inputCls}
                                                    value={verifEvidence.identity.date_of_birth}
                                                    onChange={(e) => setVerifEvidence((p) => ({
                                                        ...p,
                                                        identity: { ...p.identity, date_of_birth: e.target.value },
                                                    }))}
                                                />
                                            </Field>
                                            {/* Gov ID with Upload / Camera toggle */}
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-semibold text-brand-dark mb-1">
                                                    Government ID
                                                </label>
                                                <div className="flex gap-2 mb-2">
                                                    <button type="button" onClick={() => { stopCamera(); setGovIdMode("upload"); }}
                                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${govIdMode === "upload" ? "bg-brand-orange text-white" : "bg-gray-100 text-brand-muted hover:bg-gray-200"}`}>
                                                        📤 Upload File
                                                    </button>
                                                    <button type="button" onClick={() => { setGovIdMode("camera"); startCamera(); }}
                                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${govIdMode === "camera" ? "bg-brand-orange text-white" : "bg-gray-100 text-brand-muted hover:bg-gray-200"}`}>
                                                        📷 Take Photo
                                                    </button>
                                                </div>
                                                {govIdMode === "upload" && (
                                                    <div className="space-y-2">
                                                        <input
                                                            ref={govIdFileRef}
                                                            type="file"
                                                            accept="image/*,.pdf"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                const authToken = token || localStorage.getItem("mw_token");
                                                                if (!authToken) { setError("Not authenticated. Please log in again."); return; }
                                                                setGovIdUploading(true);
                                                                try {
                                                                    const fd = new window.FormData();
                                                                    fd.append("files", file);
                                                                    fd.append("entity_type", "verification");
                                                                    fd.append("entity_id", user?.id ?? "");
                                                                    fd.append("label", "government_id");
                                                                    const res = await fetch(`${API_BASE}/attachments/upload`, {
                                                                        method: "POST",
                                                                        headers: { Authorization: `Bearer ${authToken}` },
                                                                        body: fd,
                                                                    });
                                                                    if (res.ok) {
                                                                        const body = await res.json();
                                                                        const fileUrl = body.data?.[0]?.file_url || "";
                                                                        const apiHost = API_BASE.replace(/\/api\/v1$/, "");
                                                                        const url = fileUrl ? `${apiHost}${fileUrl}` : "";
                                                                        setVerifEvidence((p) => ({
                                                                            ...p,
                                                                            identity: { ...p.identity, government_id_url: url },
                                                                        }));
                                                                    } else {
                                                                        setError("Failed to upload file. Please try again.");
                                                                    }
                                                                } catch {
                                                                    setError("Upload failed. Please try again.");
                                                                } finally {
                                                                    setGovIdUploading(false);
                                                                }
                                                            }}
                                                        />
                                                        {verifEvidence.identity.government_id_url ? (
                                                            <div className="space-y-2">
                                                                <div className="relative rounded-xl overflow-hidden border-2 border-emerald-300 bg-emerald-50/30">
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img src={verifEvidence.identity.government_id_url} alt="Uploaded ID" className="w-full max-h-48 object-contain" />
                                                                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-lg">✓ Uploaded</div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => govIdFileRef.current?.click()}
                                                                    disabled={govIdUploading}
                                                                    className="w-full py-2 text-xs font-semibold text-brand-muted border border-brand-border/50 rounded-xl hover:bg-gray-50 transition-all"
                                                                >
                                                                    {govIdUploading ? "⏳ Uploading…" : "🔄 Replace with another file"}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => govIdFileRef.current?.click()}
                                                                disabled={govIdUploading}
                                                                className={`w-full py-4 border-2 border-dashed rounded-xl text-sm transition-all ${govIdUploading
                                                                    ? "border-brand-orange/30 bg-brand-orange/5 text-brand-orange cursor-wait"
                                                                    : "border-brand-border/50 hover:border-brand-orange/40 hover:bg-brand-orange/5 text-brand-muted"
                                                                    }`}
                                                            >
                                                                {govIdUploading ? "⏳ Uploading…" : "Click to select photo or PDF of your ID"}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                {govIdMode === "camera" && (
                                                    <div className="space-y-3">
                                                        <canvas ref={govIdCanvasRef} className="hidden" />
                                                        {!govIdCaptured ? (
                                                            <>
                                                                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                                                                    <video
                                                                        ref={govIdVideoRef}
                                                                        autoPlay
                                                                        playsInline
                                                                        muted
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    {!govIdStream && (
                                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                                            <p className="text-white/70 text-sm animate-pulse">Starting camera…</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={capturePhoto}
                                                                    disabled={!govIdStream}
                                                                    className="w-full py-3 bg-brand-orange text-white font-bold text-sm rounded-xl hover:bg-brand-orange/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    📸 Capture Photo
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="relative rounded-xl overflow-hidden border-2 border-emerald-300">
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img src={govIdCaptured} alt="Captured ID" className="w-full" />
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => { setGovIdCaptured(null); startCamera(); }}
                                                                        className="flex-1 py-2.5 border border-brand-border/50 text-brand-dark font-semibold text-sm rounded-xl hover:bg-gray-50 transition-all"
                                                                    >
                                                                        🔄 Retake
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={uploadCapturedPhoto}
                                                                        disabled={govIdUploading}
                                                                        className="flex-1 py-2.5 bg-emerald-500 text-white font-bold text-sm rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50"
                                                                    >
                                                                        {govIdUploading ? "⏳ Uploading…" : "✓ Use this photo"}
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                        {verifEvidence.identity.government_id_url && (
                                                            <p className="text-xs text-emerald-600 font-semibold">✓ Photo uploaded successfully</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <Field label="Country">
                                                <SearchableCountrySelect
                                                    value={verifEvidence.identity.country}
                                                    onChange={(code) => setVerifEvidence((p) => ({
                                                        ...p,
                                                        identity: { ...p.identity, country: code, state: "" },
                                                    }))}
                                                    placeholder="Select your country…"
                                                />
                                            </Field>
                                            <Field label="State / Province">
                                                {verifEvidence.identity.country && getStatesForCountry(verifEvidence.identity.country).length > 0 ? (
                                                    <SearchableStateSelect
                                                        countryCode={verifEvidence.identity.country}
                                                        value={verifEvidence.identity.state}
                                                        onChange={(val) => setVerifEvidence((p) => ({
                                                            ...p,
                                                            identity: { ...p.identity, state: val },
                                                        }))}
                                                    />
                                                ) : (
                                                    <input
                                                        className={inputCls}
                                                        placeholder="e.g. California, Ontario…"
                                                        value={verifEvidence.identity.state}
                                                        onChange={(e) => setVerifEvidence((p) => ({
                                                            ...p,
                                                            identity: { ...p.identity, state: e.target.value },
                                                        }))}
                                                    />
                                                )}
                                            </Field>
                                            <Field label="City">
                                                <input
                                                    className={inputCls}
                                                    placeholder="e.g. San Francisco, Toronto…"
                                                    value={verifEvidence.identity.city}
                                                    onChange={(e) => setVerifEvidence((p) => ({
                                                        ...p,
                                                        identity: { ...p.identity, city: e.target.value },
                                                    }))}
                                                />
                                            </Field>
                                            <Field label="ZIP / Postal Code">
                                                <input
                                                    className={inputCls}
                                                    placeholder="e.g. 94102, M5V 2T6…"
                                                    value={verifEvidence.identity.zip}
                                                    onChange={(e) => setVerifEvidence((p) => ({
                                                        ...p,
                                                        identity: { ...p.identity, zip: e.target.value },
                                                    }))}
                                                />
                                            </Field>
                                            <Field label="Street Address">
                                                <input
                                                    className={inputCls}
                                                    placeholder="123 Main St, Apt 4B"
                                                    value={verifEvidence.identity.address}
                                                    onChange={(e) => setVerifEvidence((p) => ({
                                                        ...p,
                                                        identity: { ...p.identity, address: e.target.value },
                                                    }))}
                                                />
                                            </Field>
                                        </div>
                                    )}

                                    {vt.key === "portfolio" && (
                                        <div className="space-y-3">
                                            <label className="block text-xs font-semibold text-brand-dark">Project URLs</label>
                                            {verifEvidence.portfolio.urls.map((url, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <input
                                                        className={inputCls + " flex-1"}
                                                        placeholder={`https://project${i + 1}.com`}
                                                        value={url}
                                                        onChange={(e) => {
                                                            const updated = [...verifEvidence.portfolio.urls];
                                                            updated[i] = e.target.value;
                                                            setVerifEvidence((p) => ({
                                                                ...p,
                                                                portfolio: { ...p.portfolio, urls: updated },
                                                            }));
                                                        }}
                                                    />
                                                    {verifEvidence.portfolio.urls.length > 1 && (
                                                        <button type="button"
                                                            onClick={() => {
                                                                const updated = verifEvidence.portfolio.urls.filter((_, j) => j !== i);
                                                                setVerifEvidence((p) => ({
                                                                    ...p,
                                                                    portfolio: { ...p.portfolio, urls: updated },
                                                                }));
                                                            }}
                                                            className="px-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all text-lg font-bold"
                                                            title="Remove"
                                                        >×</button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setVerifEvidence((p) => ({
                                                    ...p,
                                                    portfolio: { ...p.portfolio, urls: [...p.portfolio.urls, ""] },
                                                }))}
                                                className="text-xs font-semibold text-brand-orange hover:text-brand-orange/80 transition-colors"
                                            >
                                                + Add another project
                                            </button>
                                            <Field label="Project Description">
                                                <textarea
                                                    className={inputCls + " min-h-[80px] resize-y"}
                                                    placeholder="Describe your key projects and your role…"
                                                    value={verifEvidence.portfolio.description}
                                                    onChange={(e) => setVerifEvidence((p) => ({
                                                        ...p,
                                                        portfolio: { ...p.portfolio, description: e.target.value },
                                                    }))}
                                                />
                                            </Field>
                                        </div>
                                    )}

                                    {vt.key === "skill_assessment" && (
                                        <div className="space-y-3">
                                            <label className="block text-xs font-semibold text-brand-dark">Certification URLs</label>
                                            {verifEvidence.skill_assessment.certification_urls.map((url, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <input
                                                        className={inputCls + " flex-1"}
                                                        placeholder={`https://credential.net/cert-${i + 1}`}
                                                        value={url}
                                                        onChange={(e) => {
                                                            const updated = [...verifEvidence.skill_assessment.certification_urls];
                                                            updated[i] = e.target.value;
                                                            setVerifEvidence((p) => ({
                                                                ...p,
                                                                skill_assessment: { ...p.skill_assessment, certification_urls: updated },
                                                            }));
                                                        }}
                                                    />
                                                    {verifEvidence.skill_assessment.certification_urls.length > 1 && (
                                                        <button type="button"
                                                            onClick={() => {
                                                                const updated = verifEvidence.skill_assessment.certification_urls.filter((_, j) => j !== i);
                                                                setVerifEvidence((p) => ({
                                                                    ...p,
                                                                    skill_assessment: { ...p.skill_assessment, certification_urls: updated },
                                                                }));
                                                            }}
                                                            className="px-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all text-lg font-bold"
                                                            title="Remove"
                                                        >×</button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setVerifEvidence((p) => ({
                                                    ...p,
                                                    skill_assessment: { ...p.skill_assessment, certification_urls: [...p.skill_assessment.certification_urls, ""] },
                                                }))}
                                                className="text-xs font-semibold text-brand-orange hover:text-brand-orange/80 transition-colors"
                                            >
                                                + Add another certification
                                            </button>
                                            <Field label="Years of Experience">
                                                <input
                                                    type="number"
                                                    className={inputCls}
                                                    placeholder="5"
                                                    min="0"
                                                    value={verifEvidence.skill_assessment.years_experience}
                                                    onChange={(e) => setVerifEvidence((p) => ({
                                                        ...p,
                                                        skill_assessment: { ...p.skill_assessment, years_experience: e.target.value },
                                                    }))}
                                                />
                                            </Field>
                                        </div>
                                    )}

                                    {vt.key === "work_history" && (
                                        <div className="space-y-3">
                                            {form.linkedin_url && (
                                                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                                    <span className="text-xs">🔗</span>
                                                    <span className="text-xs text-blue-700">
                                                        LinkedIn from your profile will be included: <span className="font-semibold">{form.linkedin_url}</span>
                                                    </span>
                                                </div>
                                            )}
                                            <label className="block text-xs font-semibold text-brand-dark">Previous Roles</label>
                                            {verifEvidence.work_history.previous_jobs.map((job, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <input
                                                        className={inputCls + " flex-1"}
                                                        placeholder={i === 0 ? "e.g., Senior Dev at Google" : `Role ${i + 1}`}
                                                        value={job}
                                                        onChange={(e) => {
                                                            const updated = [...verifEvidence.work_history.previous_jobs];
                                                            updated[i] = e.target.value;
                                                            setVerifEvidence((p) => ({
                                                                ...p,
                                                                work_history: { ...p.work_history, previous_jobs: updated },
                                                            }));
                                                        }}
                                                    />
                                                    {verifEvidence.work_history.previous_jobs.length > 1 && (
                                                        <button type="button"
                                                            onClick={() => {
                                                                const updated = verifEvidence.work_history.previous_jobs.filter((_, j) => j !== i);
                                                                setVerifEvidence((p) => ({
                                                                    ...p,
                                                                    work_history: { ...p.work_history, previous_jobs: updated },
                                                                }));
                                                            }}
                                                            className="px-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all text-lg font-bold"
                                                            title="Remove"
                                                        >×</button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setVerifEvidence((p) => ({
                                                    ...p,
                                                    work_history: { ...p.work_history, previous_jobs: [...p.work_history.previous_jobs, ""] },
                                                }))}
                                                className="text-xs font-semibold text-brand-orange hover:text-brand-orange/80 transition-colors"
                                            >
                                                + Add another role
                                            </button>
                                        </div>
                                    )}

                                    {vt.key === "payment_method" && (() => {
                                        const taxIdInfo: Record<string, { label: string; placeholder: string; hint?: string; types?: { value: string; label: string }[] }> = {
                                            US: { label: "Tax ID", placeholder: "XXX-XX-XXXX", hint: "Required for tax reporting (1099)", types: [{ value: "ssn", label: "SSN (Social Security Number)" }, { value: "itin", label: "ITIN (Individual Taxpayer ID)" }, { value: "ein", label: "EIN (Employer Identification Number)" }] },
                                            MX: { label: "RFC", placeholder: "XAXX010101000", hint: "Registro Federal de Contribuyentes" },
                                            CA: { label: "SIN or BN", placeholder: "XXX-XXX-XXX", hint: "Social Insurance Number (individual) or Business Number" },
                                            GB: { label: "UTR or NI Number", placeholder: "XX-XX-XX-XX-X", hint: "Unique Taxpayer Reference or National Insurance Number" },
                                            DE: { label: "Steuer-ID", placeholder: "XX XXX XXX XXX", hint: "Steuerliche Identifikationsnummer" },
                                            FR: { label: "NIF (Numéro Fiscal)", placeholder: "XXXXXXXXXXXXX", hint: "Numéro d'Identification Fiscale" },
                                            ES: { label: "NIF / NIE", placeholder: "X-XXXXXXXX-X", hint: "Número de Identificación Fiscal" },
                                            BR: { label: "CPF or CNPJ", placeholder: "XXX.XXX.XXX-XX", hint: "Cadastro de Pessoa Física (individual) or CNPJ (business)" },
                                            IN: { label: "PAN", placeholder: "XXXXX0000X", hint: "Permanent Account Number" },
                                            AU: { label: "TFN or ABN", placeholder: "XXX XXX XXX", hint: "Tax File Number (individual) or Australian Business Number" },
                                            AR: { label: "CUIT / CUIL", placeholder: "XX-XXXXXXXX-X", hint: "Clave Única de Identificación Tributaria" },
                                            CO: { label: "NIT or CC", placeholder: "XXX.XXX.XXX-X", hint: "Número de Identificación Tributaria" },
                                            CL: { label: "RUT", placeholder: "XX.XXX.XXX-X", hint: "Rol Único Tributario" },
                                            IT: { label: "Codice Fiscale", placeholder: "XXXXXXXXXXXXXXXX", hint: "Codice Fiscale / Partita IVA" },
                                            JP: { label: "マイナンバー (My Number)", placeholder: "XXXX-XXXX-XXXX", hint: "Individual Number" },
                                            KR: { label: "주민등록번호", placeholder: "XXXXXX-XXXXXXX", hint: "Resident Registration Number" },
                                        };
                                        const billingCountry = verifEvidence.payment_method.billing_country || form.country;
                                        const info = taxIdInfo[billingCountry] || { label: "Tax ID / VAT Number", placeholder: "Enter your tax identification number" };
                                        return (
                                            <div className="space-y-4">
                                                {/* Tax ID Section */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {info.types && info.types.length > 0 && (
                                                        <Field label="Tax ID Type" required>
                                                            <select
                                                                className={selectCls}
                                                                value={verifEvidence.payment_method.tax_id_type}
                                                                onChange={(e) => setVerifEvidence((p) => ({
                                                                    ...p,
                                                                    payment_method: { ...p.payment_method, tax_id_type: e.target.value },
                                                                }))}
                                                            >
                                                                <option value="">Select type…</option>
                                                                {info.types.map((t) => (
                                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                                ))}
                                                            </select>
                                                        </Field>
                                                    )}
                                                    <Field label={info.types ? "Number" : info.label} required>
                                                        <input
                                                            className={inputCls}
                                                            placeholder={info.placeholder}
                                                            value={verifEvidence.payment_method.tax_id}
                                                            onChange={(e) => setVerifEvidence((p) => ({
                                                                ...p,
                                                                payment_method: { ...p.payment_method, tax_id: e.target.value },
                                                            }))}
                                                        />
                                                        {info.hint && (
                                                            <p className="text-[11px] text-brand-muted mt-1">{info.hint}</p>
                                                        )}
                                                    </Field>
                                                </div>

                                                {/* Billing Address Section — same approach as Identity */}
                                                <div className="border-t border-brand-border/30 pt-4">
                                                    <label className="block text-xs font-semibold text-brand-dark mb-3">Billing Address</label>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <Field label="Country" required>
                                                            <SearchableCountrySelect
                                                                value={verifEvidence.payment_method.billing_country || form.country}
                                                                onChange={(code) => setVerifEvidence((p) => ({
                                                                    ...p,
                                                                    payment_method: { ...p.payment_method, billing_country: code, billing_state: "" },
                                                                }))}
                                                                placeholder="Select your country…"
                                                            />
                                                        </Field>
                                                        <Field label="State / Province" required>
                                                            {(verifEvidence.payment_method.billing_country || form.country) && getStatesForCountry(verifEvidence.payment_method.billing_country || form.country).length > 0 ? (
                                                                <SearchableStateSelect
                                                                    countryCode={verifEvidence.payment_method.billing_country || form.country}
                                                                    value={verifEvidence.payment_method.billing_state}
                                                                    onChange={(val) => setVerifEvidence((p) => ({
                                                                        ...p,
                                                                        payment_method: { ...p.payment_method, billing_state: val },
                                                                    }))}
                                                                />
                                                            ) : (
                                                                <input
                                                                    className={inputCls}
                                                                    placeholder="e.g. California, Ontario…"
                                                                    value={verifEvidence.payment_method.billing_state}
                                                                    onChange={(e) => setVerifEvidence((p) => ({
                                                                        ...p,
                                                                        payment_method: { ...p.payment_method, billing_state: e.target.value },
                                                                    }))}
                                                                />
                                                            )}
                                                        </Field>
                                                        <Field label="City" required>
                                                            <input
                                                                className={inputCls}
                                                                placeholder="e.g. San Francisco, Toronto…"
                                                                value={verifEvidence.payment_method.billing_city}
                                                                onChange={(e) => setVerifEvidence((p) => ({
                                                                    ...p,
                                                                    payment_method: { ...p.payment_method, billing_city: e.target.value },
                                                                }))}
                                                            />
                                                        </Field>
                                                        <Field label="ZIP / Postal Code" required>
                                                            <input
                                                                className={inputCls}
                                                                placeholder="e.g. 94102, M5V 2T6…"
                                                                value={verifEvidence.payment_method.billing_zip}
                                                                onChange={(e) => setVerifEvidence((p) => ({
                                                                    ...p,
                                                                    payment_method: { ...p.payment_method, billing_zip: e.target.value },
                                                                }))}
                                                            />
                                                        </Field>
                                                        <div className="sm:col-span-2">
                                                            <Field label="Street Address" required>
                                                                <input
                                                                    className={inputCls}
                                                                    placeholder="123 Main St, Apt 4B"
                                                                    value={verifEvidence.payment_method.billing_address}
                                                                    onChange={(e) => setVerifEvidence((p) => ({
                                                                        ...p,
                                                                        payment_method: { ...p.payment_method, billing_address: e.target.value },
                                                                    }))}
                                                                />
                                                            </Field>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Submit button per type */}
                                    <button
                                        type="button"
                                        disabled={isSubmittingThis || isPending}
                                        onClick={() => submitVerification(vt.key)}
                                        className={`mt-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${isPending
                                            ? "bg-amber-100 text-amber-600 cursor-not-allowed"
                                            : isSubmittingThis
                                                ? "bg-gray-100 text-gray-400 cursor-wait"
                                                : "bg-brand-orange/10 text-brand-orange hover:bg-brand-orange hover:text-white border border-brand-orange/30"
                                            }`}
                                    >
                                        {isSubmittingThis
                                            ? "Submitting…"
                                            : isPending
                                                ? "Under Review"
                                                : isRejected
                                                    ? "Resubmit"
                                                    : "Submit for Verification"}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary bar */}
            {verifStatuses.length > 0 && (
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex gap-1">
                        {VERIFICATION_TYPES.map((vt) => {
                            const s = getVerifStatus(vt.key);
                            const color = !s
                                ? "bg-gray-200"
                                : s.status === "approved" || s.status === "auto_approved"
                                    ? "bg-emerald-400"
                                    : s.status === "rejected" || s.status === "auto_rejected"
                                        ? "bg-red-400"
                                        : "bg-amber-400";
                            return <div key={vt.key} className={`w-3 h-3 rounded-full ${color}`} title={vt.label} />;
                        })}
                    </div>
                    <span className="text-xs text-brand-muted">
                        {verifStatuses.filter((v) => v.status === "approved" || v.status === "auto_approved").length} of 5 verified
                    </span>
                </div>
            )}
        </div>
    );

    /* ── Layout ──────────────────────────────── */
    const isLastStep = step === steps.length - 1;

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
                    Complete Your Profile
                </h1>
                <p className="text-sm text-brand-muted mt-2">
                    {isClient
                        ? "Set up your company profile to start hiring talent."
                        : "Complete your profile to start finding work."}
                </p>
            </div>

            <Stepper steps={steps} current={step} />

            {/* Card */}
            <div className="bg-white rounded-2xl border border-brand-border/60 p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-bold text-brand-dark mb-6">
                    {steps[step]}
                </h2>

                {/* Step content */}
                {step === 0 && renderPersonalStep()}
                {isClient && step === 1 && renderClientCompanyStep()}
                {!isClient && step === 1 && renderFreelancerProfessionalStep()}
                {!isClient && step === 2 && renderFreelancerSkillsStep()}
                {!isClient && step === 3 && renderVerificationStep()}

                {/* Error */}
                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-brand-border/40">
                    {step > 0 ? (
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)}
                            className="px-5 py-2.5 text-sm font-semibold text-brand-dark border border-brand-border/60 rounded-xl hover:border-brand-dark/30 hover:shadow-sm transition-all"
                        >
                            ← Back
                        </button>
                    ) : (
                        <div />
                    )}
                    {isLastStep ? (
                        <button
                            type="button"
                            onClick={submit}
                            disabled={saving || !canNext()}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_32px_rgba(240,138,17,0.55)] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    <svg
                                        className="animate-spin h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        />
                                    </svg>
                                    Saving…
                                </span>
                            ) : (
                                "Complete Profile ✓"
                            )}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setStep(step + 1)}
                            disabled={!canNext()}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_32px_rgba(240,138,17,0.55)] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            Next →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
