"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
    ssr: false,
    loading: () => (
        <div className="h-40 rounded-xl border border-brand-border/60 bg-slate-50 animate-pulse" />
    ),
});

/* strip HTML tags for text-only length checking */
function stripHtml(html: string): string {
    if (typeof document === "undefined") return html.replace(/<[^>]*>/g, "");
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Duration options ────────────────────────────────── */
const DURATION_OPTIONS = [
    { value: 1, label: "Less than 1 week" },
    { value: 2, label: "1–2 weeks" },
    { value: 4, label: "2–4 weeks" },
    { value: 8, label: "1–2 months" },
    { value: 13, label: "2–3 months" },
    { value: 26, label: "3–6 months" },
    { value: 52, label: "6+ months" },
];

interface Job {
    id: string;
    title: string;
    budget_type: string;
    budget_min: number | null;
    budget_max: number | null;
    currency: string;
    experience_level: string;
    category_name?: string;
    client_name?: string;
    skills?: string[];
}

interface ProposedMilestone {
    title: string;
    amount: string;
    description: string;
}

export default function ProposalPage() {
    const { id: jobId } = useParams<{ id: string }>();
    const router = useRouter();
    const { token } = useAuth();

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);
    const [existingProposal, setExistingProposal] = useState<{ id: string; status: string; bid_amount: number; created_at: string } | null>(null);

    // Form state
    const [coverLetter, setCoverLetter] = useState("");
    const [bidAmount, setBidAmount] = useState("");
    const [durationWeeks, setDurationWeeks] = useState<number>(4);
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);

    // Milestones state
    const [milestones, setMilestones] = useState<ProposedMilestone[]>([]);

    const isFixed = job?.budget_type === "fixed";

    // Compute milestone total
    const milestoneTotal = milestones.reduce(
        (sum, m) => sum + (parseFloat(m.amount) || 0),
        0
    );

    // Fetch job details + check existing proposal
    useEffect(() => {
        if (!token || !jobId) return;
        Promise.all([
            fetch(`${API_BASE}/jobs/${jobId}`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((r) => r.json()),
            fetch(`${API_BASE}/proposals/me?per_page=100`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((r) => r.json()),
        ])
            .then(([jobBody, proposalsBody]) => {
                const j = jobBody.data ?? jobBody;
                setJob(j);
                if (j.budget_min && j.budget_max) {
                    setBidAmount(String(Math.round((j.budget_min + j.budget_max) / 2)));
                }
                // Check if already submitted
                const existing = (proposalsBody.data || []).find(
                    (p: { job_id: string }) => p.job_id === jobId
                );
                if (existing) setExistingProposal(existing);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [token, jobId]);

    /* ── Milestone helpers ─────────────────────────────── */
    function addMilestone() {
        setMilestones((prev) => [
            ...prev,
            { title: "", amount: "", description: "" },
        ]);
    }

    function updateMilestone(idx: number, field: keyof ProposedMilestone, value: string) {
        setMilestones((prev) =>
            prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
        );
    }

    function removeMilestone(idx: number) {
        setMilestones((prev) => prev.filter((_, i) => i !== idx));
    }

    /* ── Auto-sync bid amount from milestones ─────────── */
    useEffect(() => {
        if (isFixed && milestones.length > 0 && milestoneTotal > 0) {
            setBidAmount(milestoneTotal.toFixed(2));
        }
    }, [milestoneTotal, isFixed, milestones.length]);

    function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        setAttachments((prev) => [...prev, ...files].slice(0, 5)); // max 5
        e.target.value = "";
    }

    function removeAttachment(idx: number) {
        setAttachments((prev) => prev.filter((_, i) => i !== idx));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!token || !jobId) return;

        // Client validation
        const errs: Record<string, string> = {};
        if (stripHtml(coverLetter).length < 50) errs.cover_letter = "Cover letter must be at least 50 characters.";
        if (!bidAmount || parseFloat(bidAmount) <= 0) errs.bid_amount = "Enter a valid bid amount.";
        if (!durationWeeks) errs.estimated_duration_weeks = "Select an estimated duration.";

        // Milestone validation for fixed projects
        if (isFixed && milestones.length > 0) {
            const hasEmpty = milestones.some((m) => !m.title.trim() || !m.amount || parseFloat(m.amount) <= 0);
            if (hasEmpty) errs.milestones = "Each milestone needs a title and valid amount.";
        }

        if (Object.keys(errs).length) { setFieldErrors(errs); return; }

        setSubmitting(true);
        setError(null);
        setFieldErrors({});

        try {
            const payload: Record<string, unknown> = {
                job_id: jobId,
                cover_letter: coverLetter,
                bid_amount: parseFloat(bidAmount),
                bid_type: job?.budget_type === "hourly" ? "hourly" : "fixed",
                estimated_duration_weeks: durationWeeks,
                currency: job?.currency || "USD",
            };

            // Include milestones if any are defined
            if (isFixed && milestones.length > 0) {
                payload.milestones_proposed = milestones.map((m) => ({
                    title: m.title.trim(),
                    amount: parseFloat(m.amount).toFixed(2),
                    description: m.description.trim() || undefined,
                }));
            }

            const res = await fetch(`${API_BASE}/proposals`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const body = await res.json();
            if (!res.ok) {
                if (body.details) {
                    setFieldErrors(body.details);
                } else {
                    setError(body.error || body.message || "Failed to submit proposal");
                }
                return;
            }

            setSuccess(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Network error");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
            </div>
        );
    }

    if (existingProposal && !success) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl border border-brand-border/60 p-10 text-center">
                    <div className="text-5xl mb-4">📋</div>
                    <h1 className="text-2xl font-extrabold text-brand-dark mb-2">Already Submitted</h1>
                    <p className="text-sm text-brand-muted mb-2">
                        You already submitted a proposal for <strong>{job?.title}</strong>.
                    </p>
                    <p className="text-xs text-brand-muted mb-6">
                        Bid: <strong className="text-brand-dark">${Number(existingProposal.bid_amount).toLocaleString()}</strong>
                        {" · "}
                        Status: <span className="capitalize font-medium text-brand-orange">{existingProposal.status}</span>
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link
                            href={`/dashboard/jobs/${jobId}`}
                            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-brand-dark bg-white border border-brand-border hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            ← Back to Job
                        </Link>
                        <Link
                            href="/dashboard/jobs"
                            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-brand-dark bg-white border border-brand-border hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            🔍 Browse Jobs
                        </Link>
                        <Link
                            href="/dashboard/jobs/recommended"
                            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-brand-dark bg-white border border-brand-border hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            ✨ Recommended
                        </Link>
                        <Link
                            href="/dashboard/proposals"
                            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl transition-colors"
                        >
                            View My Proposals
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl border border-brand-border/60 p-10 text-center">
                    <div className="text-5xl mb-4">🎉</div>
                    <h1 className="text-2xl font-extrabold text-brand-dark mb-2">Proposal Submitted!</h1>
                    <p className="text-sm text-brand-muted mb-6">
                        Your proposal for <strong>{job?.title}</strong> has been submitted successfully.
                        The client will be notified.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link
                            href={`/dashboard/jobs/${jobId}`}
                            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-brand-dark bg-white border border-brand-border hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            ← Back to Job
                        </Link>
                        <Link
                            href="/dashboard/jobs"
                            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-brand-dark bg-white border border-brand-border hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            🔍 Browse Jobs
                        </Link>
                        <Link
                            href="/dashboard/jobs/recommended"
                            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-brand-dark bg-white border border-brand-border hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            ✨ Recommended
                        </Link>
                        <Link
                            href="/dashboard/proposals"
                            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl transition-colors"
                        >
                            View My Proposals
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href={`/dashboard/jobs/${jobId}`}
                    className="text-sm text-brand-muted hover:text-brand-orange transition-colors mb-2 inline-block"
                >
                    ← Back to job
                </Link>
                <h1 className="text-2xl font-extrabold text-brand-dark">
                    Submit Proposal
                </h1>
                {job && (
                    <p className="text-sm text-brand-muted mt-1">
                        For: <strong className="text-brand-dark">{job.title}</strong>
                    </p>
                )}
            </div>

            {/* Job summary card */}
            {job && (
                <div className="bg-gradient-to-r from-brand-orange/5 to-violet-50 border border-brand-border/60 rounded-2xl p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium">
                            💰 {job.budget_type === "fixed" ? "Fixed Price" : "Hourly"}: ${job.budget_min?.toLocaleString()} – ${job.budget_max?.toLocaleString()}
                        </span>
                        {job.experience_level && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 border border-violet-200 font-medium">
                                📊 {job.experience_level}
                            </span>
                        )}
                        {job.category_name && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-medium">
                                📂 {job.category_name}
                            </span>
                        )}
                        {job.client_name && (
                            <span className="text-brand-muted">👤 {job.client_name}</span>
                        )}
                    </div>
                </div>
            )}

            {/* Error banner */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-sm text-red-700">
                    ⚠️ {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cover Letter */}
                <div className="bg-white rounded-2xl border border-brand-border/60 p-5">
                    <label className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wide">
                        Cover Letter *
                    </label>
                    <RichTextEditor
                        value={coverLetter}
                        onChange={(html) => setCoverLetter(html)}
                        placeholder="Explain why you're the best fit for this job. Describe your relevant experience, approach, and what makes you stand out..."
                        hasError={!!fieldErrors.cover_letter}
                        minHeight="180px"
                    />
                    <div className="flex justify-between mt-1.5">
                        {fieldErrors.cover_letter && (
                            <p className="text-xs text-red-500">{fieldErrors.cover_letter}</p>
                        )}
                        <p className={`text-xs ml-auto ${stripHtml(coverLetter).length < 50 ? "text-amber-500" : "text-brand-muted"}`}>
                            {stripHtml(coverLetter).length}/50 min
                        </p>
                    </div>
                </div>

                {/* Bid Amount & Duration */}
                <div className="bg-white rounded-2xl border border-brand-border/60 p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Bid Amount */}
                        <div>
                            <label className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wide">
                                Your Bid {job?.budget_type === "hourly" ? "(Per Hour)" : "(Total)"} *
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-brand-muted font-medium">$</span>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                    placeholder="0.00"
                                    readOnly={isFixed && milestones.length > 0}
                                    className={`w-full rounded-xl border ${fieldErrors.bid_amount ? "border-red-300" : "border-brand-border/60"} bg-white pl-8 pr-4 py-3 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-colors ${isFixed && milestones.length > 0 ? "bg-slate-50 cursor-not-allowed" : ""}`}
                                />
                            </div>
                            {fieldErrors.bid_amount && (
                                <p className="text-xs text-red-500 mt-1">{fieldErrors.bid_amount}</p>
                            )}
                            {isFixed && milestones.length > 0 && (
                                <p className="text-xs text-brand-muted mt-1">
                                    Auto-calculated from milestones below
                                </p>
                            )}
                            {job?.budget_min && job?.budget_max && !(isFixed && milestones.length > 0) && (
                                <p className="text-xs text-brand-muted mt-1">
                                    Client budget: ${job.budget_min.toLocaleString()} – ${job.budget_max.toLocaleString()}
                                </p>
                            )}
                        </div>

                        {/* Estimated Duration */}
                        <div>
                            <label className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wide">
                                Estimated Duration *
                            </label>
                            <select
                                value={durationWeeks}
                                onChange={(e) => setDurationWeeks(Number(e.target.value))}
                                className={`w-full rounded-xl border ${fieldErrors.estimated_duration_weeks ? "border-red-300" : "border-brand-border/60"} bg-white px-4 py-3 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-colors`}
                            >
                                {DURATION_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.estimated_duration_weeks && (
                                <p className="text-xs text-red-500 mt-1">{fieldErrors.estimated_duration_weeks}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Milestones (fixed-price only) ──────────── */}
                {isFixed && (
                    <div className="bg-white rounded-2xl border border-brand-border/60 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-brand-dark flex items-center gap-2">
                                    🎯 Project Milestones
                                </h3>
                                <p className="text-xs text-brand-muted mt-0.5">
                                    Break down your project into milestones so the client knows your plan and can fund escrow per milestone.
                                </p>
                            </div>
                            {milestones.length > 0 && (
                                <div className="text-right shrink-0 ml-4">
                                    <div className="text-xs text-brand-muted">Total</div>
                                    <div className={`text-sm font-bold ${milestoneTotal > 0 ? "text-emerald-600" : "text-brand-muted"}`}>
                                        ${milestoneTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {fieldErrors.milestones && (
                            <div className="mb-3 px-3 py-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl">
                                {fieldErrors.milestones}
                            </div>
                        )}

                        {/* Milestone list */}
                        {milestones.length > 0 && (
                            <div className="space-y-3 mb-4">
                                {milestones.map((ms, idx) => (
                                    <div
                                        key={idx}
                                        className="relative border border-brand-border/60 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-colors"
                                    >
                                        {/* Remove button */}
                                        <button
                                            type="button"
                                            onClick={() => removeMilestone(idx)}
                                            className="absolute top-3 right-3 text-brand-muted hover:text-red-500 transition-colors"
                                            title="Remove milestone"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>

                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold shrink-0">
                                                {idx + 1}
                                            </span>
                                            <span className="text-xs font-medium text-brand-muted uppercase tracking-wide">
                                                Milestone {idx + 1}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
                                            {/* Title */}
                                            <input
                                                type="text"
                                                value={ms.title}
                                                onChange={(e) => updateMilestone(idx, "title", e.target.value)}
                                                placeholder="e.g. Design mockups, Backend API, Final delivery..."
                                                className="w-full rounded-lg border border-brand-border/60 bg-white px-3 py-2.5 text-sm text-brand-dark placeholder:text-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-colors"
                                            />
                                            {/* Amount */}
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-brand-muted">$</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={ms.amount}
                                                    onChange={(e) => updateMilestone(idx, "amount", e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full rounded-lg border border-brand-border/60 bg-white pl-7 pr-3 py-2.5 text-sm text-brand-dark placeholder:text-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-colors"
                                                />
                                            </div>
                                        </div>

                                        {/* Description (optional) */}
                                        <textarea
                                            value={ms.description}
                                            onChange={(e) => updateMilestone(idx, "description", e.target.value)}
                                            placeholder="Brief description of deliverables for this milestone (optional)"
                                            rows={2}
                                            className="w-full mt-3 rounded-lg border border-brand-border/60 bg-white px-3 py-2 text-sm text-brand-dark placeholder:text-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-colors resize-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add milestone button */}
                        <button
                            type="button"
                            onClick={addMilestone}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-brand-orange bg-brand-orange/10 hover:bg-brand-orange/20 rounded-xl transition-colors border border-brand-orange/20"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add Milestone
                        </button>

                        {milestones.length === 0 && (
                            <p className="text-xs text-brand-muted mt-2">
                                💡 Adding milestones helps clients understand your plan and allows escrow funding per milestone.
                                You can also skip this — the client can add milestones after accepting.
                            </p>
                        )}

                        {/* Budget comparison */}
                        {milestones.length > 0 && job?.budget_min && job?.budget_max && (
                            <div className="mt-4 pt-3 border-t border-brand-border/40">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-brand-muted">Client budget range</span>
                                    <span className="font-medium text-brand-dark">
                                        ${job.budget_min.toLocaleString()} – ${job.budget_max.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs mt-1">
                                    <span className="text-brand-muted">Your milestone total</span>
                                    <span className={`font-bold ${milestoneTotal >= (job.budget_min || 0) && milestoneTotal <= (job.budget_max || Infinity)
                                        ? "text-emerald-600"
                                        : "text-amber-600"
                                        }`}>
                                        ${milestoneTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        {milestoneTotal > 0 && milestoneTotal < (job.budget_min || 0) && " ⬇ below range"}
                                        {milestoneTotal > (job.budget_max || Infinity) && " ⬆ above range"}
                                        {milestoneTotal >= (job.budget_min || 0) && milestoneTotal <= (job.budget_max || Infinity) && milestoneTotal > 0 && " ✓"}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Attachments */}
                <div className="bg-white rounded-2xl border border-brand-border/60 p-5">
                    <label className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wide">
                        Attachments (optional)
                    </label>
                    <p className="text-xs text-brand-muted mb-3">
                        Add portfolio samples, mockups, or relevant documents. Max 5 files, 10MB each.
                    </p>

                    {/* File list */}
                    {attachments.length > 0 && (
                        <div className="space-y-2 mb-3">
                            {attachments.map((file, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                                >
                                    <span className="text-brand-dark truncate">📎 {file.name}</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-brand-muted">
                                            {(file.size / 1024).toFixed(0)} KB
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(idx)}
                                            className="text-red-400 hover:text-red-600 text-xs font-bold"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {attachments.length < 5 && (
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-brand-orange bg-brand-orange/10 hover:bg-brand-orange/20 rounded-xl transition-colors border border-brand-orange/20"
                        >
                            📁 Add File
                        </button>
                    )}
                    <input
                        ref={fileRef}
                        type="file"
                        multiple
                        onChange={handleFileAdd}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.txt,.md"
                    />
                </div>

                {/* Submit */}
                <div className="flex items-center justify-between">
                    <Link
                        href={`/dashboard/jobs/${jobId}`}
                        className="text-sm text-brand-muted hover:text-brand-dark transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
                    >
                        {submitting ? (
                            <>
                                <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                Submitting...
                            </>
                        ) : (
                            "🚀 Submit Proposal"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
