"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

type Category = { id: string; name: string };
type Skill = { id: string; name: string; slug: string };
type ExistingAttachment = {
    id: string;
    file_name: string;
    file_url: string;
    file_size: number;
    mime_type: string;
};

const ALLOWED_MIME = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function formatBytes(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const inputCls = (hasError?: boolean) =>
    `w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange text-brand-dark placeholder:text-brand-muted/50 transition-colors ${hasError ? "border-red-400 bg-red-50/30" : "border-brand-border/60"}`;

const labelCls =
    "block text-sm font-semibold text-brand-dark mb-1.5 tracking-tight";

export default function EditJobPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { token } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [categories, setCategories] = useState<Category[]>([]);

    /* attachment state */
    const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        title: "",
        description: "",
        category_id: "",
        budget_type: "fixed",
        budget_min: "",
        budget_max: "",
        currency: "USD",
        experience_level: "mid",
        visibility: "public",
        duration_weeks: "",
    });

    /* skill state */
    const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
    const [skillQuery, setSkillQuery] = useState("");
    const [skillResults, setSkillResults] = useState<Skill[]>([]);
    const [showSkillDropdown, setShowSkillDropdown] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const skillInputRef = useRef<HTMLInputElement>(null);
    const skillDropdownRef = useRef<HTMLDivElement>(null);

    /* Fetch categories */
    useEffect(() => {
        fetch(`${API_BASE}/categories/`)
            .then((r) => r.json())
            .then((b) => setCategories(b.data ?? []))
            .catch(() => { });
    }, []);

    /* Fetch existing job */
    const fetchJob = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/jobs/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const body = await res.json();
            if (!res.ok) {
                setError(body.message || "Job not found");
                return;
            }
            const j = body.data;
            setForm({
                title: j.title ?? "",
                description: j.description ?? "",
                category_id: j.category_id ?? "",
                budget_type: j.budget_type ?? "fixed",
                budget_min: String(j.budget_min ?? ""),
                budget_max: String(j.budget_max ?? ""),
                currency: j.currency ?? "USD",
                experience_level: j.experience_level ?? "mid",
                visibility: j.visibility ?? "public",
                duration_weeks: j.estimated_duration ? String(j.estimated_duration) : "",
            });
            setSelectedSkills(j.skills ?? []);
            setExistingAttachments(j.attachments ?? []);
        } catch {
            setError("Failed to load job");
        } finally {
            setLoading(false);
        }
    }, [id, token]);

    useEffect(() => {
        fetchJob();
    }, [fetchJob]);

    /* Skill search */
    useEffect(() => {
        if (skillQuery.length < 2) {
            setSkillResults([]);
            return;
        }
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `${API_BASE}/skills/search?q=${encodeURIComponent(skillQuery)}`,
                );
                const body = await res.json();
                const available = (body.data ?? []).filter(
                    (s: Skill) => !selectedSkills.some((sel) => sel.id === s.id),
                );
                setSkillResults(available.slice(0, 8));
                setShowSkillDropdown(available.length > 0);
            } catch {
                /* ignore */
            }
        }, 300);
    }, [skillQuery, selectedSkills]);

    /* Close dropdown on outside click */
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (
                skillDropdownRef.current &&
                !skillDropdownRef.current.contains(e.target as Node) &&
                skillInputRef.current &&
                !skillInputRef.current.contains(e.target as Node)
            ) {
                setShowSkillDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    function addSkill(skill: Skill) {
        setSelectedSkills((prev) => [...prev, skill]);
        setSkillQuery("");
        setSkillResults([]);
        setShowSkillDropdown(false);
    }

    function removeSkill(skillId: string) {
        setSelectedSkills((prev) => prev.filter((s) => s.id !== skillId));
    }

    function set(field: string) {
        return (
            e: React.ChangeEvent<
                HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            >,
        ) => {
            setForm((prev) => ({ ...prev, [field]: e.target.value }));
            setFieldErrors((prev) => {
                const copy = { ...prev };
                delete copy[field];
                return copy;
            });
        };
    }

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    }

    /* ── Attachment handlers ── */
    function handleFilesSelected(fileList: FileList | null) {
        if (!fileList) return;
        const valid = Array.from(fileList).filter(
            (f) => ALLOWED_MIME.includes(f.type) && f.size <= MAX_FILE_SIZE,
        );
        setNewFiles((prev) => [...prev, ...valid].slice(0, 10));
    }

    function removeNewFile(idx: number) {
        setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    }

    async function deleteExistingAttachment(attId: string) {
        if (!confirm('Delete this attachment?')) return;
        try {
            await fetch(`${API_BASE}/attachments/${attId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            setExistingAttachments((prev) => prev.filter((a) => a.id !== attId));
        } catch {
            setError('Failed to delete attachment');
        }
    }

    async function uploadNewFiles() {
        if (newFiles.length === 0) return;
        const fd = new FormData();
        fd.append('entity_type', 'job');
        fd.append('entity_id', id);
        newFiles.forEach((f) => fd.append('files[]', f));
        await fetch(`${API_BASE}/attachments/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
        });
    }

    async function handleSave() {
        setSaving(true);
        setError(null);
        setFieldErrors({});

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
                payload.estimated_duration = Number(form.duration_weeks);

            const res = await fetch(`${API_BASE}/jobs/${id}`, {
                method: "PATCH",
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
                } else {
                    setError(body.message || body.error || "Failed to update job.");
                }
                return;
            }

            // Upload new attachments if any
            if (newFiles.length > 0) {
                try {
                    await uploadNewFiles();
                } catch {
                    console.warn('Attachment upload failed');
                }
            }

            showToast("Job updated successfully!");
            setTimeout(() => router.push(`/dashboard/jobs/${id}`), 1200);
        } catch {
            setError("Unable to reach the server. Please check your connection.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto py-16 text-center">
                <div className="animate-spin w-8 h-8 border-3 border-brand-orange border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-brand-muted mt-4">Loading job…</p>
            </div>
        );
    }

    if (error && !form.title) {
        return (
            <div className="max-w-2xl mx-auto py-16 text-center">
                <div className="text-4xl mb-4">😕</div>
                <h2 className="text-xl font-bold text-brand-dark mb-2">
                    Job Not Found
                </h2>
                <p className="text-sm text-brand-muted mb-6">{error}</p>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="px-5 py-2.5 text-sm font-semibold text-brand-dark border border-brand-border/60 rounded-xl hover:border-brand-dark/30 hover:shadow-sm transition-all"
                >
                    ← Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Toast */}
            {toast && (
                <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-lg">
                    {toast}
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.push(`/dashboard/jobs/${id}`)}
                    className="text-xs text-brand-muted hover:text-brand-dark transition-colors mb-3 flex items-center gap-1"
                >
                    ← Back to Job
                </button>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
                    Edit Job
                </h1>
                <p className="text-sm text-brand-muted mt-1">
                    Update your job details below.
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
                    {error}
                </div>
            )}

            {/* Form */}
            <div className="bg-white rounded-2xl border border-brand-border/60 p-6 sm:p-8 space-y-5">
                {/* Title */}
                <div>
                    <label className={labelCls}>Job Title</label>
                    <input
                        className={inputCls(!!fieldErrors.title)}
                        placeholder="e.g. Build a React Dashboard"
                        value={form.title}
                        onChange={set("title")}
                    />
                    {fieldErrors.title && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className={labelCls}>Description</label>
                    <textarea
                        className={inputCls(!!fieldErrors.description) + " min-h-[140px] resize-y"}
                        placeholder="Describe the project in detail…"
                        value={form.description}
                        onChange={set("description")}
                        rows={6}
                    />
                    {fieldErrors.description && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p>
                    )}
                </div>

                {/* Category */}
                <div>
                    <label className={labelCls}>Category</label>
                    <select
                        className={inputCls(!!fieldErrors.category_id)}
                        value={form.category_id}
                        onChange={set("category_id")}
                    >
                        <option value="">Select a category…</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Experience Level */}
                <div>
                    <label className={labelCls}>Experience Level</label>
                    <div className="flex gap-2">
                        {(["entry", "mid", "senior", "expert"] as const).map((lvl) => (
                            <button
                                key={lvl}
                                type="button"
                                onClick={() =>
                                    setForm((p) => ({ ...p, experience_level: lvl }))
                                }
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg border transition-all ${form.experience_level === lvl
                                    ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                                    : "border-brand-border/60 text-brand-muted hover:border-brand-dark/20"
                                    }`}
                            >
                                {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-t border-brand-border/40 pt-5" />

                {/* Budget Type */}
                <div>
                    <label className={labelCls}>Budget Type</label>
                    <div className="flex gap-3">
                        {(["fixed", "hourly"] as const).map((bt) => (
                            <button
                                key={bt}
                                type="button"
                                onClick={() => setForm((p) => ({ ...p, budget_type: bt }))}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg border transition-all ${form.budget_type === bt
                                    ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                                    : "border-brand-border/60 text-brand-muted hover:border-brand-dark/20"
                                    }`}
                            >
                                {bt === "fixed" ? "💰 Fixed Price" : "⏰ Hourly Rate"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Budget Range */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>
                            {form.budget_type === "hourly" ? "Min $/hr" : "Min Budget ($)"}
                        </label>
                        <input
                            type="number"
                            className={inputCls(!!fieldErrors.budget_min)}
                            value={form.budget_min}
                            onChange={set("budget_min")}
                            min={0}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>
                            {form.budget_type === "hourly" ? "Max $/hr" : "Max Budget ($)"}
                        </label>
                        <input
                            type="number"
                            className={inputCls(!!fieldErrors.budget_max)}
                            value={form.budget_max}
                            onChange={set("budget_max")}
                            min={0}
                        />
                    </div>
                </div>

                {/* Duration */}
                <div>
                    <label className={labelCls}>
                        Estimated Duration (weeks){" "}
                        <span className="text-brand-muted font-normal">— optional</span>
                    </label>
                    <input
                        type="number"
                        className={inputCls()}
                        placeholder="e.g. 4"
                        value={form.duration_weeks}
                        onChange={set("duration_weeks")}
                        min={1}
                        max={52}
                    />
                </div>

                {/* Visibility */}
                <div>
                    <label className={labelCls}>Visibility</label>
                    <select
                        className={inputCls()}
                        value={form.visibility}
                        onChange={set("visibility")}
                    >
                        <option value="public">Public</option>
                        <option value="invite_only">Invite Only</option>
                    </select>
                </div>

                <div className="border-t border-brand-border/40 pt-5" />

                {/* Skills */}
                <div>
                    <label className={labelCls}>Skills</label>
                    {selectedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {selectedSkills.map((s) => (
                                <span
                                    key={s.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-orange/10 text-brand-orange text-xs font-semibold rounded-full"
                                >
                                    {s.name}
                                    <button
                                        type="button"
                                        onClick={() => removeSkill(s.id)}
                                        className="hover:text-red-500 font-bold"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="relative">
                        <input
                            ref={skillInputRef}
                            className={inputCls()}
                            placeholder="Search skills…"
                            value={skillQuery}
                            onChange={(e) => setSkillQuery(e.target.value)}
                            onFocus={() =>
                                skillResults.length > 0 && setShowSkillDropdown(true)
                            }
                        />
                        {showSkillDropdown && (
                            <div
                                ref={skillDropdownRef}
                                className="absolute z-20 left-0 right-0 mt-1 bg-white border border-brand-border/60 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                            >
                                {skillResults.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-brand-orange/5 transition-colors"
                                        onClick={() => addSkill(s)}
                                    >
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-brand-border/40 pt-5" />

                {/* Attachments */}
                <div>
                    <label className={labelCls}>Attachments</label>

                    {/* Existing */}
                    {existingAttachments.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {existingAttachments.map((att) => (
                                <div
                                    key={att.id}
                                    className="flex items-center gap-3 p-3 border border-brand-border/40 rounded-lg"
                                >
                                    <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center shrink-0">
                                        <span className="text-sm">
                                            {att.mime_type?.startsWith('image/') ? '🖼️' : '📄'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-brand-dark truncate">
                                            {att.file_name}
                                        </div>
                                        <div className="text-xs text-brand-muted">
                                            {formatBytes(att.file_size)}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => deleteExistingAttachment(att.id)}
                                        className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
                                    >
                                        🗑️ Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* New files list */}
                    {newFiles.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {newFiles.map((f, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-3 border border-emerald-200 bg-emerald-50/30 rounded-lg"
                                >
                                    <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center shrink-0">
                                        <span className="text-sm">📎</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-brand-dark truncate">
                                            {f.name}
                                            <span className="text-xs text-emerald-600 ml-2">NEW</span>
                                        </div>
                                        <div className="text-xs text-brand-muted">
                                            {formatBytes(f.size)}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeNewFile(i)}
                                        className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Drop zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFilesSelected(e.dataTransfer.files);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-brand-border/60 rounded-xl p-6 text-center cursor-pointer hover:border-brand-orange/40 hover:bg-brand-orange/5 transition-colors"
                    >
                        <div className="text-2xl mb-1">📁</div>
                        <p className="text-sm text-brand-muted">
                            Drag & drop files or <span className="text-brand-orange font-semibold">browse</span>
                        </p>
                        <p className="text-xs text-brand-muted/70 mt-1">
                            Images, PDF, Word, Excel, CSV — max 20 MB each
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            accept={ALLOWED_MIME.join(',')}
                            onChange={(e) => handleFilesSelected(e.target.files)}
                        />
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between mt-8 mb-12">
                <button
                    type="button"
                    onClick={() => router.push(`/dashboard/jobs/${id}`)}
                    className="px-5 py-2.5 text-sm font-semibold text-brand-dark border border-brand-border/60 rounded-xl hover:border-brand-dark/30 hover:shadow-sm transition-all"
                >
                    ← Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_32px_rgba(240,138,17,0.55)] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
                >
                    {saving ? "Saving…" : "💾 Save Changes"}
                </button>
            </div>
        </div>
    );
}
