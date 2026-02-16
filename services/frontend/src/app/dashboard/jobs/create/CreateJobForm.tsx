"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
    ssr: false,
    loading: () => <div className="w-full h-[120px] bg-gray-50 rounded-xl animate-pulse" />,
});
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Types ──────────────────────────────────────────── */
type Category = {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
};

type Skill = {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    category_name?: string;
};

type AttachmentFile = {
    file: File;
    preview: string;
    id: string;
};

const ALLOWED_MIME = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.text',
    'application/rtf',
    'text/plain',
    'text/csv',
];
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 10;

function formatBytes(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/* ── Helpers ────────────────────────────────────────── */
const inputCls = (hasError?: boolean) =>
    `w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange text-brand-dark placeholder:text-brand-muted/50 transition-colors ${hasError ? "border-red-400 bg-red-50/30" : "border-brand-border/60"
    }`;

const labelCls =
    "block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wide";

/* strip HTML tags for text-only length checking */
function stripHtml(html: string): string {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

/* ── Step indicator ─────────────────────────────────── */
function StepBar({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: total }, (_, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${i < current
                            ? "bg-brand-orange text-white"
                            : i === current
                                ? "bg-brand-orange/10 text-brand-orange border-2 border-brand-orange"
                                : "bg-brand-border/30 text-brand-muted"
                            }`}
                    >
                        {i < current ? "✓" : i + 1}
                    </div>
                    {i < total - 1 && (
                        <div
                            className={`flex-1 h-0.5 rounded ${i < current
                                ? "bg-brand-orange"
                                : "bg-brand-border/40"
                                }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

/* ── Component ──────────────────────────────────────── */
export default function CreateJobForm() {
    const router = useRouter();
    const { token } = useAuth();

    /* form state */
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [categories, setCategories] = useState<Category[]>([]);
    const [successId, setSuccessId] = useState<string | null>(null);

    /* skill search state */
    const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
    const [skillQuery, setSkillQuery] = useState("");
    const [skillResults, setSkillResults] = useState<Skill[]>([]);
    const [skillsLoading, setSkillsLoading] = useState(false);
    const [showSkillDropdown, setShowSkillDropdown] = useState(false);
    const skillInputRef = useRef<HTMLInputElement>(null);
    const skillDropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* attachment state */
    const [attachedFiles, setAttachedFiles] = useState<AttachmentFile[]>([]);
    const [dragOver, setDragOver] = useState(false);

    const [form, setForm] = useState({
        title: "",
        description: "",
        category_id: "",
        budget_type: "fixed" as "fixed" | "hourly",
        budget_min: "",
        budget_max: "",
        currency: "USD",
        experience_level: "intermediate",
        duration_weeks: "",
        visibility: "public",
        skills: [] as string[],
    });

    /* fetch categories */
    useEffect(() => {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        fetch(`${API_BASE}/categories/`, { headers })
            .then((r) => r.json())
            .then((body) => setCategories(body.data ?? []))
            .catch((err) => console.warn("Failed to fetch categories:", err));
    }, [token]);

    /* skill search with debounce */
    const searchSkills = useCallback(
        (query: string) => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (query.length < 2) {
                setSkillResults([]);
                setShowSkillDropdown(false);
                return;
            }
            setSkillsLoading(true);
            debounceRef.current = setTimeout(async () => {
                try {
                    const params = new URLSearchParams({ q: query });
                    if (form.category_id) params.set("category_id", form.category_id);
                    const headers: Record<string, string> = {};
                    if (token) headers.Authorization = `Bearer ${token}`;
                    const res = await fetch(
                        `${API_BASE}/skills/search?${params}`,
                        { headers }
                    );
                    const body = await res.json();
                    const results = (body.data ?? []).filter(
                        (s: Skill) => !selectedSkills.some((sel) => sel.id === s.id)
                    );
                    setSkillResults(results);
                    setShowSkillDropdown(results.length > 0);
                } catch (err) {
                    console.warn("Skill search failed:", err);
                } finally {
                    setSkillsLoading(false);
                }
            }, 300);
        },
        [form.category_id, token, selectedSkills]
    );

    /* close dropdown on outside click */
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                skillDropdownRef.current &&
                !skillDropdownRef.current.contains(e.target as Node) &&
                skillInputRef.current &&
                !skillInputRef.current.contains(e.target as Node)
            ) {
                setShowSkillDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function addSkill(skill: Skill) {
        if (selectedSkills.some((s) => s.id === skill.id)) return;
        setSelectedSkills((prev) => [...prev, skill]);
        setSkillQuery("");
        setSkillResults([]);
        setShowSkillDropdown(false);
        skillInputRef.current?.focus();
    }

    function removeSkill(skillId: string) {
        setSelectedSkills((prev) => prev.filter((s) => s.id !== skillId));
    }

    /* file attachment helpers */
    function handleFilesSelected(fileList: FileList | null) {
        if (!fileList) return;
        const newFiles: AttachmentFile[] = [];
        for (let i = 0; i < fileList.length; i++) {
            const f = fileList[i];
            if (!ALLOWED_MIME.includes(f.type)) continue;
            if (f.size > MAX_FILE_SIZE) continue;
            if (attachedFiles.length + newFiles.length >= MAX_FILES) break;
            newFiles.push({
                file: f,
                preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : '',
                id: crypto.randomUUID(),
            });
        }
        setAttachedFiles((prev) => [...prev, ...newFiles]);
    }

    function removeFile(id: string) {
        setAttachedFiles((prev) => {
            const removed = prev.find((f) => f.id === id);
            if (removed?.preview) URL.revokeObjectURL(removed.preview);
            return prev.filter((f) => f.id !== id);
        });
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        handleFilesSelected(e.dataTransfer.files);
    }

    async function uploadAttachments(jobId: string) {
        if (attachedFiles.length === 0) return;
        const fd = new FormData();
        fd.append('entity_type', 'job');
        fd.append('entity_id', jobId);
        attachedFiles.forEach((af) => fd.append('files[]', af.file));
        await fetch(`${API_BASE}/attachments/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
        });
    }

    /* field helpers */
    function set(field: string) {
        return (
            e: React.ChangeEvent<
                HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            >,
        ) => {
            setForm((prev) => ({ ...prev, [field]: e.target.value }));
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
            setError(null);
        };
    }

    /* step validation */
    function validateStep(): boolean {
        const errs: Record<string, string> = {};

        if (step === 0) {
            if (!form.title.trim()) errs.title = "Title is required";
            else if (form.title.trim().length < 3)
                errs.title = "Title must be at least 3 characters";
            else if (form.title.trim().length > 200)
                errs.title = "Title must be under 200 characters";

            if (!stripHtml(form.description).trim())
                errs.description = "Description is required";
            else if (stripHtml(form.description).trim().length < 20)
                errs.description =
                    "Description must be at least 20 characters";

            if (!form.category_id) errs.category_id = "Category is required";
        }

        if (step === 1) {
            if (!form.budget_min) errs.budget_min = "Minimum budget is required";
            else if (Number(form.budget_min) <= 0)
                errs.budget_min = "Must be a positive number";

            if (!form.budget_max) errs.budget_max = "Maximum budget is required";
            else if (Number(form.budget_max) <= 0)
                errs.budget_max = "Must be a positive number";
            else if (
                form.budget_min &&
                Number(form.budget_max) < Number(form.budget_min)
            )
                errs.budget_max = "Must be ≥ minimum budget";
        }

        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function next() {
        if (validateStep()) setStep((s) => s + 1);
    }
    function prev() {
        setStep((s) => Math.max(0, s - 1));
    }

    /* submit */
    async function handleSubmit() {
        if (!validateStep()) return;
        setLoading(true);
        setError(null);

        try {
            const payload: Record<string, unknown> = {
                title: form.title.trim(),
                description: form.description.trim(),
                category_id: form.category_id,
                budget_type: form.budget_type,
                budget_min: Number(form.budget_min),
                budget_max: Number(form.budget_max),
                currency: form.currency,
                experience_level: form.experience_level,
                visibility: form.visibility,
            };
            if (form.duration_weeks)
                payload.duration_weeks = Number(form.duration_weeks);
            if (selectedSkills.length > 0)
                payload.skill_ids = selectedSkills.map((s) => s.id);

            const res = await fetch(`${API_BASE}/jobs/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const body = await res.json();

            if (!res.ok) {
                if (body.details) {
                    setFieldErrors(body.details);
                    // Go to the step with the first error
                    const firstKey = Object.keys(body.details)[0];
                    if (["title", "description", "category_id"].includes(firstKey))
                        setStep(0);
                    else if (
                        ["budget_type", "budget_min", "budget_max"].includes(
                            firstKey,
                        )
                    )
                        setStep(1);
                } else {
                    setError(
                        body.message || body.error || "Failed to create job.",
                    );
                }
                return;
            }

            const jobId = body.data?.id ?? null;

            // Upload attachments if any
            if (jobId && attachedFiles.length > 0) {
                try {
                    await uploadAttachments(jobId);
                } catch {
                    // Non-fatal: job created but attachments failed
                    console.warn('Attachment upload failed');
                }
            }

            // Redirect to job management page
            if (jobId) {
                router.push(`/dashboard/jobs/${jobId}`);
                return;
            }
            setSuccessId(jobId);
        } catch {
            setError(
                "Unable to reach the server. Please check your connection.",
            );
        } finally {
            setLoading(false);
        }
    }

    /* publish draft */
    async function handlePublish() {
        if (!successId) return;
        setLoading(true);
        try {
            await fetch(`${API_BASE}/jobs/${successId}/publish`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            router.push("/dashboard/jobs");
        } catch {
            setError("Failed to publish. You can publish later from My Jobs.");
        } finally {
            setLoading(false);
        }
    }

    /* ── Success state ──────────────────────────────── */
    if (successId) {
        return (
            <div className="max-w-lg mx-auto text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center">
                    <span className="text-4xl">✅</span>
                </div>
                <h2 className="text-2xl font-extrabold text-brand-dark mb-2">
                    Job Created Successfully!
                </h2>
                <p className="text-sm text-brand-muted mb-8">
                    Your job has been saved as a{" "}
                    <span className="font-semibold text-brand-orange">
                        draft
                    </span>
                    . Publish it now to make it visible to freelancers, or
                    review it first.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={handlePublish}
                        disabled={loading}
                        className="px-6 py-3 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_32px_rgba(240,138,17,0.55)] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
                    >
                        {loading ? "Publishing…" : "🚀 Publish Now"}
                    </button>
                    <button
                        onClick={() => router.push("/dashboard/jobs")}
                        className="px-6 py-3 text-sm font-semibold text-brand-dark border border-brand-border/60 rounded-xl hover:border-brand-dark/30 hover:shadow-sm transition-all"
                    >
                        Review in My Jobs
                    </button>
                </div>
            </div>
        );
    }

    /* ── Multi-step form ────────────────────────────── */
    return (
        <div className="max-w-2xl mx-auto">
            {/* header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
                    Post a New Job
                </h1>
                <p className="text-sm text-brand-muted mt-1">
                    Describe your project and set your budget to attract the
                    right freelancers.
                </p>
            </div>

            <StepBar current={step} total={3} />

            {/* global error */}
            {error && (
                <div className="mb-6 px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
                    {error}
                </div>
            )}

            {/* ── STEP 0: Details ──────────────────────── */}
            {step === 0 && (
                <div className="bg-white rounded-2xl border border-brand-border/60 p-6 sm:p-8 space-y-6">
                    <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                        <span className="text-xl">📝</span> Job Details
                    </h2>

                    {/* title */}
                    <div>
                        <label htmlFor="title" className={labelCls}>
                            Job Title
                        </label>
                        <input
                            id="title"
                            value={form.title}
                            onChange={set("title")}
                            placeholder="e.g. Build a responsive landing page"
                            className={inputCls(!!fieldErrors.title)}
                            maxLength={200}
                        />
                        <div className="flex justify-between mt-1">
                            {fieldErrors.title ? (
                                <p className="text-xs text-red-500">
                                    {fieldErrors.title}
                                </p>
                            ) : (
                                <span />
                            )}
                            <span className="text-xs text-brand-muted">
                                {form.title.length}/200
                            </span>
                        </div>
                    </div>

                    {/* description */}
                    <div>
                        <label className={labelCls}>
                            Description
                        </label>
                        <RichTextEditor
                            value={form.description}
                            onChange={(html) => {
                                setForm((prev) => ({ ...prev, description: html }));
                                setFieldErrors((prev) => {
                                    const next = { ...prev };
                                    delete next.description;
                                    return next;
                                });
                                setError(null);
                            }}
                            placeholder="Describe the project scope, deliverables, and any specific requirements…"
                            hasError={!!fieldErrors.description}
                        />
                        {fieldErrors.description && (
                            <p className="mt-1 text-xs text-red-500">
                                {fieldErrors.description}
                            </p>
                        )}
                    </div>

                    {/* category */}
                    <div>
                        <label htmlFor="category_id" className={labelCls}>
                            Category
                        </label>
                        <select
                            id="category_id"
                            value={form.category_id}
                            onChange={set("category_id")}
                            className={inputCls(!!fieldErrors.category_id)}
                        >
                            <option value="">Select a category…</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        {fieldErrors.category_id && (
                            <p className="mt-1 text-xs text-red-500">
                                {fieldErrors.category_id}
                            </p>
                        )}
                    </div>

                    {/* experience level */}
                    <div>
                        <label
                            htmlFor="experience_level"
                            className={labelCls}
                        >
                            Experience Level
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {(
                                [
                                    {
                                        value: "entry",
                                        label: "Entry",
                                        icon: "🌱",
                                        desc: "Looking for beginners",
                                    },
                                    {
                                        value: "intermediate",
                                        label: "Intermediate",
                                        icon: "⚡",
                                        desc: "Some experience",
                                    },
                                    {
                                        value: "expert",
                                        label: "Expert",
                                        icon: "🏆",
                                        desc: "Highly skilled",
                                    },
                                ] as const
                            ).map((lvl) => (
                                <button
                                    key={lvl.value}
                                    type="button"
                                    onClick={() =>
                                        setForm((p) => ({
                                            ...p,
                                            experience_level: lvl.value,
                                        }))
                                    }
                                    className={`p-3 rounded-xl border text-left transition-all duration-200 ${form.experience_level === lvl.value
                                        ? "border-brand-orange bg-brand-orange/5 shadow-sm"
                                        : "border-brand-border/60 hover:border-brand-dark/20"
                                        }`}
                                >
                                    <span className="text-lg">{lvl.icon}</span>
                                    <div className="text-sm font-semibold text-brand-dark mt-1">
                                        {lvl.label}
                                    </div>
                                    <div className="text-xs text-brand-muted">
                                        {lvl.desc}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Skills picker ──────────────── */}
                    <div>
                        <label className={labelCls}>
                            Skills{" "}
                            <span className="text-brand-muted/60 font-normal normal-case">
                                (search and add up to 15)
                            </span>
                        </label>

                        {/* selected chips */}
                        {selectedSkills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {selectedSkills.map((skill) => (
                                    <span
                                        key={skill.id}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-orange/10 text-brand-orange text-xs font-semibold rounded-full border border-brand-orange/20 transition-all hover:bg-brand-orange/20"
                                    >
                                        {skill.name}
                                        <button
                                            type="button"
                                            onClick={() => removeSkill(skill.id)}
                                            className="hover:text-red-500 transition-colors ml-0.5"
                                            aria-label={`Remove ${skill.name}`}
                                        >
                                            ✕
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* search input */}
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted/50">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                            </div>
                            <input
                                ref={skillInputRef}
                                type="text"
                                value={skillQuery}
                                onChange={(e) => {
                                    setSkillQuery(e.target.value);
                                    searchSkills(e.target.value);
                                }}
                                onFocus={() => {
                                    if (skillResults.length > 0) setShowSkillDropdown(true);
                                }}
                                placeholder={
                                    selectedSkills.length >= 15
                                        ? "Maximum skills reached"
                                        : form.category_id
                                            ? "Search skills for this category…"
                                            : "Select a category first to search skills…"
                                }
                                disabled={selectedSkills.length >= 15}
                                className={`${inputCls()} pl-9`}
                            />
                            {skillsLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <svg className="animate-spin h-4 w-4 text-brand-muted" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                </div>
                            )}

                            {/* dropdown */}
                            {showSkillDropdown && (
                                <div
                                    ref={skillDropdownRef}
                                    className="absolute z-20 w-full mt-1 bg-white border border-brand-border/60 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                                >
                                    {skillResults.map((skill) => (
                                        <button
                                            key={skill.id}
                                            type="button"
                                            onClick={() => addSkill(skill)}
                                            className="w-full px-4 py-2.5 text-left text-sm text-brand-dark hover:bg-brand-orange/5 flex items-center justify-between transition-colors"
                                        >
                                            <span className="font-medium">{skill.name}</span>
                                            {skill.category_name && (
                                                <span className="text-xs text-brand-muted/60">
                                                    {skill.category_name}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-brand-muted/60 mt-1.5">
                            {selectedSkills.length}/15 skills selected
                        </p>
                    </div>
                </div>
            )}

            {/* ── STEP 1: Budget ───────────────────────── */}
            {step === 1 && (
                <div className="bg-white rounded-2xl border border-brand-border/60 p-6 sm:p-8 space-y-6">
                    <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                        <span className="text-xl">💰</span> Budget & Timeline
                    </h2>

                    {/* budget type */}
                    <div>
                        <label className={labelCls}>Budget Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(
                                [
                                    {
                                        value: "fixed",
                                        label: "Fixed Price",
                                        icon: "🎯",
                                        desc: "Pay a set amount for the entire project",
                                    },
                                    {
                                        value: "hourly",
                                        label: "Hourly Rate",
                                        icon: "⏱️",
                                        desc: "Pay by the hour as work is completed",
                                    },
                                ] as const
                            ).map((bt) => (
                                <button
                                    key={bt.value}
                                    type="button"
                                    onClick={() =>
                                        setForm((p) => ({
                                            ...p,
                                            budget_type: bt.value,
                                        }))
                                    }
                                    className={`p-4 rounded-xl border text-left transition-all duration-200 ${form.budget_type === bt.value
                                        ? "border-brand-orange bg-brand-orange/5 shadow-sm"
                                        : "border-brand-border/60 hover:border-brand-dark/20"
                                        }`}
                                >
                                    <span className="text-2xl">{bt.icon}</span>
                                    <div className="text-sm font-bold text-brand-dark mt-2">
                                        {bt.label}
                                    </div>
                                    <div className="text-xs text-brand-muted mt-0.5">
                                        {bt.desc}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* budget range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="budget_min" className={labelCls}>
                                {form.budget_type === "hourly"
                                    ? "Min $/hr"
                                    : "Min Budget ($)"}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-brand-muted">
                                    $
                                </span>
                                <input
                                    id="budget_min"
                                    type="number"
                                    min="1"
                                    value={form.budget_min}
                                    onChange={set("budget_min")}
                                    placeholder="500"
                                    className={`${inputCls(!!fieldErrors.budget_min)} pl-7`}
                                />
                            </div>
                            {fieldErrors.budget_min && (
                                <p className="mt-1 text-xs text-red-500">
                                    {fieldErrors.budget_min}
                                </p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="budget_max" className={labelCls}>
                                {form.budget_type === "hourly"
                                    ? "Max $/hr"
                                    : "Max Budget ($)"}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-brand-muted">
                                    $
                                </span>
                                <input
                                    id="budget_max"
                                    type="number"
                                    min="1"
                                    value={form.budget_max}
                                    onChange={set("budget_max")}
                                    placeholder="2000"
                                    className={`${inputCls(!!fieldErrors.budget_max)} pl-7`}
                                />
                            </div>
                            {fieldErrors.budget_max && (
                                <p className="mt-1 text-xs text-red-500">
                                    {fieldErrors.budget_max}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* duration */}
                    <div>
                        <label htmlFor="duration_weeks" className={labelCls}>
                            Estimated Duration (weeks){" "}
                            <span className="text-brand-muted font-normal">
                                — optional
                            </span>
                        </label>
                        <input
                            id="duration_weeks"
                            type="number"
                            min="1"
                            value={form.duration_weeks}
                            onChange={set("duration_weeks")}
                            placeholder="e.g. 4"
                            className={inputCls()}
                        />
                    </div>

                    {/* attachments */}
                    <div>
                        <label className={labelCls}>
                            Attachments{" "}
                            <span className="text-brand-muted font-normal">
                                — optional (max {MAX_FILES} files, 20MB each)
                            </span>
                        </label>
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragOver
                                ? "border-brand-orange bg-brand-orange/5"
                                : "border-brand-border/60 hover:border-brand-dark/20"
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.odt,.rtf,.txt,.csv"
                                className="hidden"
                                onChange={(e) => {
                                    handleFilesSelected(e.target.files);
                                    e.target.value = '';
                                }}
                            />
                            <div className="text-3xl mb-2">📎</div>
                            <div className="text-sm font-semibold text-brand-dark">
                                Drop files here or click to browse
                            </div>
                            <div className="text-xs text-brand-muted mt-1">
                                Images, PDF, Word, Excel, Text, CSV
                            </div>
                        </div>

                        {attachedFiles.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {attachedFiles.map((af) => (
                                    <div
                                        key={af.id}
                                        className="flex items-center gap-3 p-2.5 border border-brand-border/40 rounded-lg bg-white"
                                    >
                                        {af.preview ? (
                                            <img
                                                src={af.preview}
                                                alt={af.file.name}
                                                className="w-10 h-10 rounded object-cover shrink-0"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-red-50 flex items-center justify-center shrink-0">
                                                <span className="text-lg">📄</span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-brand-dark truncate">
                                                {af.file.name}
                                            </div>
                                            <div className="text-xs text-brand-muted">
                                                {formatBytes(af.file.size)}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); removeFile(af.id); }}
                                            className="text-brand-muted hover:text-red-500 text-sm font-bold p-1 transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* visibility */}
                    <div>
                        <label className={labelCls}>Visibility</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(
                                [
                                    {
                                        value: "public",
                                        label: "Public",
                                        icon: "🌐",
                                    },
                                    {
                                        value: "invite_only",
                                        label: "Invite Only",
                                        icon: "✉️",
                                    },
                                    {
                                        value: "private",
                                        label: "Private",
                                        icon: "🔒",
                                    },
                                ] as const
                            ).map((v) => (
                                <button
                                    key={v.value}
                                    type="button"
                                    onClick={() =>
                                        setForm((p) => ({
                                            ...p,
                                            visibility: v.value,
                                        }))
                                    }
                                    className={`p-3 rounded-xl border text-center transition-all duration-200 ${form.visibility === v.value
                                        ? "border-brand-orange bg-brand-orange/5 shadow-sm"
                                        : "border-brand-border/60 hover:border-brand-dark/20"
                                        }`}
                                >
                                    <span className="text-lg">{v.icon}</span>
                                    <div className="text-xs font-semibold text-brand-dark mt-1">
                                        {v.label}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── STEP 2: Review ───────────────────────── */}
            {step === 2 && (
                <div className="bg-white rounded-2xl border border-brand-border/60 p-6 sm:p-8 space-y-5">
                    <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                        <span className="text-xl">🔍</span> Review & Submit
                    </h2>

                    <div className="space-y-4">
                        <ReviewRow label="Title" value={form.title} />
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                            <div className="text-xs font-semibold text-brand-muted uppercase tracking-wide w-32 shrink-0 pt-0.5">
                                Description
                            </div>
                            <div
                                className="text-sm text-brand-dark flex-1 prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: form.description }}
                            />
                        </div>
                        <ReviewRow
                            label="Category"
                            value={
                                categories.find(
                                    (c) => c.id === form.category_id,
                                )?.name ?? "—"
                            }
                        />
                        <ReviewRow
                            label="Experience"
                            value={
                                form.experience_level.charAt(0).toUpperCase() +
                                form.experience_level.slice(1)
                            }
                        />
                        <div className="border-t border-brand-border/40 pt-4" />
                        <ReviewRow
                            label="Budget Type"
                            value={
                                form.budget_type === "fixed"
                                    ? "Fixed Price"
                                    : "Hourly Rate"
                            }
                        />
                        <ReviewRow
                            label="Budget Range"
                            value={`$${Number(form.budget_min).toLocaleString()} – $${Number(form.budget_max).toLocaleString()}`}
                        />
                        {form.duration_weeks && (
                            <ReviewRow
                                label="Duration"
                                value={`${form.duration_weeks} week${Number(form.duration_weeks) === 1 ? "" : "s"}`}
                            />
                        )}
                        <ReviewRow
                            label="Visibility"
                            value={
                                form.visibility.charAt(0).toUpperCase() +
                                form.visibility.slice(1).replace("_", " ")
                            }
                        />
                        {selectedSkills.length > 0 && (
                            <>
                                <div className="border-t border-brand-border/40 pt-4" />
                                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                                    <div className="text-xs font-semibold text-brand-muted uppercase tracking-wide w-32 shrink-0 pt-0.5">
                                        Skills
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 flex-1">
                                        {selectedSkills.map((s) => (
                                            <span
                                                key={s.id}
                                                className="px-2.5 py-1 bg-brand-orange/10 text-brand-orange text-xs font-semibold rounded-full"
                                            >
                                                {s.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                        {attachedFiles.length > 0 && (
                            <>
                                <div className="border-t border-brand-border/40 pt-4" />
                                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                                    <div className="text-xs font-semibold text-brand-muted uppercase tracking-wide w-32 shrink-0 pt-0.5">
                                        Attachments
                                    </div>
                                    <div className="flex flex-wrap gap-2 flex-1">
                                        {attachedFiles.map((af) => (
                                            <div key={af.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg">
                                                {af.preview ? (
                                                    <img src={af.preview} alt="" className="w-5 h-5 rounded object-cover" />
                                                ) : (
                                                    <span className="text-sm">📄</span>
                                                )}
                                                <span className="text-xs font-medium text-brand-dark max-w-[120px] truncate">
                                                    {af.file.name}
                                                </span>
                                                <span className="text-xs text-brand-muted">
                                                    {formatBytes(af.file.size)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="bg-blue-50/60 border border-blue-200/60 rounded-xl p-4 text-sm text-blue-700">
                        💡 Your job will be saved as a{" "}
                        <strong>draft</strong>. You can publish it
                        immediately after, or review it first from My Jobs.
                    </div>
                </div>
            )}

            {/* ── Navigation buttons ───────────────────── */}
            <div className="flex items-center justify-between mt-8">
                {step > 0 ? (
                    <button
                        type="button"
                        onClick={prev}
                        className="px-5 py-2.5 text-sm font-semibold text-brand-dark border border-brand-border/60 rounded-xl hover:border-brand-dark/30 hover:shadow-sm transition-all"
                    >
                        ← Back
                    </button>
                ) : (
                    <span />
                )}

                {step < 2 ? (
                    <button
                        type="button"
                        onClick={next}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_32px_rgba(240,138,17,0.55)] transition-all duration-200 hover:-translate-y-0.5"
                    >
                        Continue →
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_32px_rgba(240,138,17,0.55)] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && (
                            <svg
                                className="animate-spin h-4 w-4 text-white"
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
                        )}
                        {loading ? "Creating…" : "Create Job"}
                    </button>
                )}
            </div>
        </div>
    );
}

/* ── Review row ─────────────────────────────────────── */
function ReviewRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
            <div className="text-xs font-semibold text-brand-muted uppercase tracking-wide w-32 shrink-0 pt-0.5">
                {label}
            </div>
            <div className="text-sm text-brand-dark flex-1">{value}</div>
        </div>
    );
}
