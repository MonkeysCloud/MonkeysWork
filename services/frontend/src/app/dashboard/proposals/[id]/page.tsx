"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";
const API_ORIGIN = API_BASE.replace(/\/api\/v1$/, "");

function fileUrl(relPath: string) {
    if (relPath.startsWith("http")) return relPath;
    return `${API_ORIGIN}${relPath}`;
}

/* ── Types ─────────────────────────────────────────── */
interface Proposal {
    id: string;
    job_id: string;
    job_title: string;
    freelancer_id: string;
    client_id: string;
    cover_letter: string;
    bid_amount: number;
    bid_type?: string;
    estimated_duration_days?: number;
    milestones_proposed?: string | { title: string; amount: number | string; description?: string }[];
    status: string;
    viewed_at?: string;
    shortlisted_at?: string;
    created_at: string;
    updated_at: string;
}

interface Job {
    id: string;
    title: string;
    description: string;
    category?: string;
    budget_min?: number;
    budget_max?: number;
    budget_type?: string;
    experience_level?: string;
    expected_duration?: string;
    skills?: { id: string; name: string; slug: string }[];
    status: string;
    created_at: string;
}

interface FreelancerProfile {
    user_id: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    country?: string;
    member_since?: string;
    headline?: string;
    bio?: string;
    hourly_rate?: number;
    currency?: string;
    experience_years?: number;
    availability_status?: string;
    availability_hours_week?: number;
    avg_rating?: number;
    total_reviews?: number;
    total_jobs_completed?: number;
    total_earnings?: number;
    success_rate?: number;
    profile_completeness?: number;
    verification_level?: string;
    skills?: { id: string; name: string; slug: string; years_experience?: number; proficiency?: string }[];
    education?: { institution?: string; degree?: string; field?: string; year?: number }[];
    certifications?: { name?: string; issuer?: string; year?: number }[];
    portfolio_urls?: string[];
    website_url?: string;
    github_url?: string;
    linkedin_url?: string;
    languages?: { language: string; proficiency?: string }[];
    verification_badges?: { level: string; badges: { type: string; status: string }[]; total_approved: number };
    reviews?: { id: string; overall_rating: number; comment: string; reviewer_name: string; reviewer_avatar?: string; contract_title?: string; created_at: string }[];
    work_history?: { id: string; title: string; contract_type: string; status: string; started_at: string; completed_at?: string; client_name: string }[];
}

/* ── Status badge config ───────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    submitted: { label: "Pending Review", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: "⏳" },
    viewed: { label: "Viewed by Client", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: "👁️" },
    shortlisted: { label: "Shortlisted", color: "text-violet-700", bg: "bg-violet-50 border-violet-200", icon: "⭐" },
    accepted: { label: "Accepted", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: "✅" },
    rejected: { label: "Declined", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: "❌" },
    withdrawn: { label: "Withdrawn", color: "text-gray-600", bg: "bg-gray-50 border-gray-200", icon: "↩️" },
};

/* ── Helpers ───────────────────────────────────────── */
function formatDate(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function durationLabel(days?: number) {
    if (!days) return null;
    const weeks = Math.round(days / 7);
    if (weeks <= 1) return "Less than 1 week";
    if (weeks <= 2) return "1–2 weeks";
    if (weeks <= 4) return "2–4 weeks";
    if (weeks <= 8) return "1–2 months";
    if (weeks <= 13) return "2–3 months";
    if (weeks <= 26) return "3–6 months";
    return "6+ months";
}

/* ── Page component ────────────────────────────────── */
export default function ProposalDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { token, user } = useAuth();
    const router = useRouter();

    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<{ id: string; file_name: string; file_url: string; file_size: number; mime_type: string }[]>([]);
    const [previewAttach, setPreviewAttach] = useState<{ name: string; url: string } | null>(null);
    const [freelancerProfile, setFreelancerProfile] = useState<FreelancerProfile | null>(null);

    const isClient = user?.role === "client";

    // Fetch proposal
    useEffect(() => {
        if (!token || !id) return;
        setLoading(true);
        fetch(`${API_BASE}/proposals/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => {
                if (!r.ok) throw new Error(r.status === 404 ? "Proposal not found" : "Failed to load proposal");
                return r.json();
            })
            .then((b) => {
                setProposal(b.data);
                // Fetch job details, attachments, and freelancer profile in parallel
                return Promise.all([
                    fetch(`${API_BASE}/jobs/${b.data.job_id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }).then((r) => r.json()),
                    fetch(`${API_BASE}/attachments/proposal/${b.data.id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }).then((r) => r.ok ? r.json() : { data: [] }),
                    fetch(`${API_BASE}/freelancers/${b.data.freelancer_id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }).then((r) => r.ok ? r.json() : null),
                ]);
            })
            .then(([jobData, attachData, profileData]) => {
                setJob(jobData.data);
                setAttachments(attachData.data || []);
                if (profileData?.data) setFreelancerProfile(profileData.data);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [token, id]);

    // Client actions
    const handleAction = useCallback(
        async (action: "accept" | "reject" | "shortlist") => {
            if (!token || !id) return;
            setActionLoading(action);
            setActionSuccess(null);
            try {
                const res = await fetch(`${API_BASE}/proposals/${id}/${action}`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.message || `Failed to ${action} proposal`);
                }
                const body = await res.json();
                // Update local status
                setProposal((prev) =>
                    prev ? { ...prev, status: body.data?.status || action + "ed" } : prev
                );
                setActionSuccess(
                    action === "accept"
                        ? "Proposal accepted! A contract will be created."
                        : action === "reject"
                            ? "Proposal declined."
                            : "Proposal shortlisted."
                );
            } catch (e: unknown) {
                setError((e as Error).message);
            } finally {
                setActionLoading(null);
            }
        },
        [token, id]
    );

    // Loading
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
            </div>
        );
    }

    // Error
    if (error && !proposal) {
        return (
            <div className="max-w-3xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                    <div className="text-4xl mb-3">⚠️</div>
                    <h1 className="text-lg font-bold text-red-800 mb-2">{error}</h1>
                    <Link
                        href="/dashboard/proposals"
                        className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-brand-dark bg-white border border-brand-border hover:bg-gray-50 rounded-xl transition-colors mt-2"
                    >
                        ← Back to Proposals
                    </Link>
                </div>
            </div>
        );
    }

    if (!proposal) return null;

    const st = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.submitted;
    const canAct =
        isClient &&
        ["submitted", "viewed", "shortlisted"].includes(proposal.status);

    return (
        <>
            <div className="max-w-3xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-brand-muted mb-5">
                    <Link
                        href="/dashboard/proposals"
                        className="hover:text-brand-orange transition-colors"
                    >
                        {isClient ? "Proposals Received" : "My Proposals"}
                    </Link>
                    <span>/</span>
                    <span className="text-brand-dark font-medium truncate">
                        {proposal.job_title}
                    </span>
                </div>

                {/* ── Status Banner ─────────────────────────── */}
                <div
                    className={`rounded-2xl border p-4 mb-6 flex items-center justify-between ${st.bg}`}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{st.icon}</span>
                        <div>
                            <p className={`text-sm font-bold ${st.color}`}>
                                {st.label}
                            </p>
                            <p className="text-xs text-brand-muted">
                                Last updated {formatDate(proposal.updated_at)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action success */}
                {actionSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 text-sm text-emerald-700 font-medium">
                        ✅ {actionSuccess}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-sm text-red-700">
                        ⚠️ {error}
                    </div>
                )}

                {/* ── Proposal Details Card ─────────────────── */}
                <div className="bg-white rounded-2xl border border-brand-border/60 p-6 mb-4">
                    <h2 className="text-lg font-extrabold text-brand-dark mb-4">
                        📝 Proposal Details
                    </h2>

                    {/* Key metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                        <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 px-4 py-3">
                            <p className="text-[11px] font-semibold text-brand-muted uppercase tracking-wide mb-0.5">
                                Bid Amount
                            </p>
                            <p className="text-xl font-bold text-emerald-700">
                                ${Number(proposal.bid_amount).toLocaleString()}
                                {proposal.bid_type === "hourly" && (
                                    <span className="text-sm font-medium">/hr</span>
                                )}
                            </p>
                        </div>
                        <div className="bg-blue-50/50 rounded-xl border border-blue-100 px-4 py-3">
                            <p className="text-[11px] font-semibold text-brand-muted uppercase tracking-wide mb-0.5">
                                Duration
                            </p>
                            <p className="text-base font-bold text-blue-700">
                                {durationLabel(proposal.estimated_duration_days) || "—"}
                            </p>
                        </div>
                        <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                            <p className="text-[11px] font-semibold text-brand-muted uppercase tracking-wide mb-0.5">
                                Submitted
                            </p>
                            <p className="text-sm font-semibold text-brand-dark">
                                {formatDate(proposal.created_at)}
                            </p>
                        </div>
                    </div>

                    {/* Cover letter */}
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-brand-dark mb-2">
                            Cover Letter
                        </h3>
                        <div
                            className="prose prose-sm max-w-none text-brand-dark/80 bg-slate-50 rounded-xl border border-brand-border/40 p-4"
                            dangerouslySetInnerHTML={{ __html: proposal.cover_letter }}
                        />
                    </div>

                    {/* Milestones */}
                    {(() => {
                        const raw = proposal.milestones_proposed;
                        const ms: { title: string; amount: number | string; description?: string }[] =
                            typeof raw === "string" ? (JSON.parse(raw || "[]") as typeof ms) : (raw ?? []);
                        if (!ms.length) return null;
                        const total = ms.reduce((s, m) => s + (parseFloat(String(m.amount)) || 0), 0);
                        return (
                            <div className="mb-4">
                                <h3 className="text-sm font-bold text-brand-dark mb-2">📋 Proposed Milestones</h3>
                                <div className="bg-slate-50 rounded-xl border border-brand-border/40 divide-y divide-brand-border/30">
                                    {ms.map((m, i) => (
                                        <div key={i} className="flex items-start justify-between px-4 py-3 gap-3">
                                            <div className="flex items-start gap-2.5 min-w-0">
                                                <span className="shrink-0 w-6 h-6 rounded-full bg-brand-orange/15 text-brand-orange text-xs font-bold flex items-center justify-center mt-0.5">
                                                    {i + 1}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-brand-dark">{m.title}</p>
                                                    {m.description && (
                                                        <p className="text-xs text-brand-muted mt-0.5">{m.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="shrink-0 text-sm font-bold text-emerald-600">
                                                ${parseFloat(String(m.amount)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/60 rounded-b-xl">
                                        <span className="text-xs font-bold text-brand-dark uppercase">Total</span>
                                        <span className="text-sm font-bold text-emerald-600">
                                            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Attachments */}
                    {attachments.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-brand-dark mb-2">📎 Attachments</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {attachments.map((f) => {
                                    const ext = f.file_name.split(".").pop()?.toLowerCase() || "";
                                    const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
                                    const isPdf = ext === "pdf";
                                    const icon = isImage ? "🖼️" : isPdf ? "📄" : ["doc", "docx"].includes(ext) ? "📝" : ["xls", "xlsx", "csv"].includes(ext) ? "📊" : "📁";
                                    const url = fileUrl(f.file_url);
                                    const sizeStr = f.file_size < 1024 ? `${f.file_size} B` : f.file_size < 1024 * 1024 ? `${(f.file_size / 1024).toFixed(0)} KB` : `${(f.file_size / (1024 * 1024)).toFixed(1)} MB`;
                                    return (
                                        <div key={f.id} className="rounded-xl border border-brand-border/40 bg-slate-50 overflow-hidden group hover:border-blue-200 transition-colors">
                                            {/* Image preview */}
                                            {isImage && (
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewAttach({ name: f.file_name, url })}
                                                    className="block w-full cursor-pointer"
                                                >
                                                    <img
                                                        src={url}
                                                        alt={f.file_name}
                                                        className="w-full h-32 object-cover bg-white hover:opacity-90 transition-opacity"
                                                    />
                                                </button>
                                            )}
                                            {/* File info row */}
                                            <div className="flex items-center gap-2.5 px-3 py-2.5">
                                                <span className="text-base shrink-0">{icon}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewAttach({ name: f.file_name, url })}
                                                    className="flex-1 min-w-0 text-sm font-medium text-brand-dark truncate text-left hover:text-blue-700 cursor-pointer"
                                                >
                                                    {f.file_name}
                                                </button>
                                                <span className="shrink-0 text-[10px] text-brand-muted font-medium">{sizeStr}</span>
                                                {/* Actions */}
                                                <a
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-100 text-brand-muted hover:text-blue-600 transition-colors"
                                                    title="Open in new tab"
                                                >
                                                    ↗
                                                </a>
                                                <a
                                                    href={url}
                                                    download={f.file_name}
                                                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-emerald-100 text-brand-muted hover:text-emerald-600 transition-colors"
                                                    title="Download"
                                                >
                                                    ⬇
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Freelancer Profile Card ─────────────────── */}
                {freelancerProfile && (
                    <div className="bg-white rounded-2xl border border-brand-border/60 p-6 mb-4 space-y-4">
                        {/* Header */}
                        <div className="flex items-center gap-4">
                            {freelancerProfile.avatar_url && (
                                <img
                                    src={fileUrl(freelancerProfile.avatar_url)}
                                    alt=""
                                    className="w-14 h-14 rounded-full object-cover border-2 border-brand-orange/30"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-extrabold text-brand-dark">
                                    {freelancerProfile.display_name || `${freelancerProfile.first_name || ''} ${freelancerProfile.last_name || ''}`.trim() || 'Freelancer'}
                                </h2>
                                {freelancerProfile.headline && (
                                    <p className="text-sm text-brand-muted truncate">{freelancerProfile.headline}</p>
                                )}
                            </div>
                            <Link
                                href={`/dashboard/freelancers/${freelancerProfile.user_id}`}
                                className="text-sm font-semibold text-brand-orange hover:underline shrink-0"
                            >
                                View Full Profile →
                            </Link>
                        </div>

                        {/* Bio */}
                        {freelancerProfile.bio && (
                            <div>
                                <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wide mb-2">📝 About</h4>
                                <p className="text-sm text-brand-dark/80 leading-relaxed whitespace-pre-line">{freelancerProfile.bio}</p>
                            </div>
                        )}

                        {/* Key Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {freelancerProfile.hourly_rate && (
                                <div className="bg-slate-50 rounded-xl p-3 text-center border border-brand-border/40">
                                    <div className="text-lg font-bold text-brand-dark">${Number(freelancerProfile.hourly_rate).toLocaleString()}</div>
                                    <div className="text-[10px] text-brand-muted uppercase font-semibold tracking-wide">Hourly Rate</div>
                                </div>
                            )}
                            {(freelancerProfile.experience_years ?? 0) > 0 && (
                                <div className="bg-slate-50 rounded-xl p-3 text-center border border-brand-border/40">
                                    <div className="text-lg font-bold text-brand-dark">{freelancerProfile.experience_years}yr</div>
                                    <div className="text-[10px] text-brand-muted uppercase font-semibold tracking-wide">Experience</div>
                                </div>
                            )}
                            {(freelancerProfile.total_jobs_completed ?? 0) > 0 && (
                                <div className="bg-slate-50 rounded-xl p-3 text-center border border-brand-border/40">
                                    <div className="text-lg font-bold text-brand-dark">{freelancerProfile.total_jobs_completed}</div>
                                    <div className="text-[10px] text-brand-muted uppercase font-semibold tracking-wide">Jobs Done</div>
                                </div>
                            )}
                            {(freelancerProfile.avg_rating ?? 0) > 0 && (
                                <div className="bg-slate-50 rounded-xl p-3 text-center border border-brand-border/40">
                                    <div className="text-lg font-bold text-brand-dark">⭐ {Number(freelancerProfile.avg_rating).toFixed(1)}</div>
                                    <div className="text-[10px] text-brand-muted uppercase font-semibold tracking-wide">{freelancerProfile.total_reviews} Reviews</div>
                                </div>
                            )}
                        </div>

                        {/* Location & Availability */}
                        <div className="flex flex-wrap gap-2">
                            {freelancerProfile.country && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium">
                                    📍 {freelancerProfile.country}
                                </span>
                            )}
                            {freelancerProfile.availability_status && (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${freelancerProfile.availability_status === 'available' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                    freelancerProfile.availability_status === 'busy' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                        'bg-red-50 text-red-600 border-red-200'
                                    }`}>
                                    {freelancerProfile.availability_status === 'available' ? '🟢' : freelancerProfile.availability_status === 'busy' ? '🟡' : '🔴'} {freelancerProfile.availability_status}
                                    {freelancerProfile.availability_hours_week ? ` · ${freelancerProfile.availability_hours_week}h/wk` : ''}
                                </span>
                            )}
                            {freelancerProfile.verification_badges && freelancerProfile.verification_badges.total_approved > 0 && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 text-xs font-medium">
                                    🛡️ {freelancerProfile.verification_badges.level} verified
                                </span>
                            )}
                            {freelancerProfile.member_since && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 text-xs font-medium">
                                    📅 Member since {new Date(freelancerProfile.member_since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </span>
                            )}
                        </div>

                        {/* Skills */}
                        {freelancerProfile.skills && freelancerProfile.skills.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wide mb-2">🎯 Skills</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {freelancerProfile.skills.map((s) => (
                                        <span key={s.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-100 text-xs font-medium">
                                            {s.name}
                                            {s.years_experience ? <span className="text-violet-400">· {s.years_experience}yr</span> : null}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Languages */}
                        {freelancerProfile.languages && freelancerProfile.languages.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wide mb-2">🌐 Languages</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {freelancerProfile.languages.map((l, i) => (
                                        <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 text-xs font-medium">
                                            {l.language}{l.proficiency ? ` (${l.proficiency})` : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Education & Certifications */}
                        {((freelancerProfile.education?.length ?? 0) > 0 || (freelancerProfile.certifications?.length ?? 0) > 0) && (
                            <div>
                                <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wide mb-2">🎓 Qualifications</h4>
                                <div className="space-y-2">
                                    {freelancerProfile.education?.map((e, i) => (
                                        <div key={`edu-${i}`} className="flex items-start gap-2 text-sm">
                                            <span className="text-brand-muted">🏫</span>
                                            <div>
                                                <span className="font-semibold text-brand-dark">{e.degree || 'Degree'}</span>
                                                {e.field && <span className="text-brand-muted"> in {e.field}</span>}
                                                {e.institution && <span className="text-brand-muted"> · {e.institution}</span>}
                                                {e.year && <span className="text-brand-muted/60 text-xs"> ({e.year})</span>}
                                            </div>
                                        </div>
                                    ))}
                                    {freelancerProfile.certifications?.map((c, i) => (
                                        <div key={`cert-${i}`} className="flex items-start gap-2 text-sm">
                                            <span className="text-brand-muted">📜</span>
                                            <div>
                                                <span className="font-semibold text-brand-dark">{c.name || 'Certification'}</span>
                                                {c.issuer && <span className="text-brand-muted"> · {c.issuer}</span>}
                                                {c.year && <span className="text-brand-muted/60 text-xs"> ({c.year})</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Links */}
                        {(freelancerProfile.website_url || freelancerProfile.github_url || freelancerProfile.linkedin_url) && (
                            <div>
                                <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wide mb-2">🔗 Links</h4>
                                <div className="flex flex-wrap gap-2">
                                    {freelancerProfile.website_url && (
                                        <a href={freelancerProfile.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-brand-dark border border-brand-border/40 text-xs font-medium hover:bg-slate-100 transition-colors">
                                            🌐 Website
                                        </a>
                                    )}
                                    {freelancerProfile.github_url && (
                                        <a href={freelancerProfile.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-brand-dark border border-brand-border/40 text-xs font-medium hover:bg-slate-100 transition-colors">
                                            🐙 GitHub
                                        </a>
                                    )}
                                    {freelancerProfile.linkedin_url && (
                                        <a href={freelancerProfile.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-brand-dark border border-brand-border/40 text-xs font-medium hover:bg-slate-100 transition-colors">
                                            💼 LinkedIn
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Job Details Card ──────────────────────── */}
                {job && (
                    <div className="bg-white rounded-2xl border border-brand-border/60 p-6 mb-4">
                        <div className="flex items-start justify-between mb-4">
                            <h2 className="text-lg font-extrabold text-brand-dark">
                                💼 Job Details
                            </h2>
                            <Link
                                href={`/dashboard/jobs/${job.id}`}
                                className="text-sm font-semibold text-brand-orange hover:underline"
                            >
                                View Full Job →
                            </Link>
                        </div>

                        <h3 className="text-base font-bold text-brand-dark mb-2">
                            {job.title}
                        </h3>

                        {/* Job meta */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {job.category && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 text-xs font-medium">
                                    📂 {job.category}
                                </span>
                            )}
                            {job.experience_level && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 text-xs font-medium">
                                    📊 {job.experience_level}
                                </span>
                            )}
                            {(job.budget_min || job.budget_max) && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-medium">
                                    💰 ${job.budget_min?.toLocaleString()}
                                    {job.budget_max ? ` – $${job.budget_max.toLocaleString()}` : ""}
                                    {job.budget_type === "hourly" ? "/hr" : ""}
                                </span>
                            )}
                            {job.expected_duration && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium">
                                    🕐 {job.expected_duration}
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        <div
                            className="prose prose-sm max-w-none text-brand-dark/80 line-clamp-6"
                            dangerouslySetInnerHTML={{ __html: job.description }}
                        />

                        {/* Skills */}
                        {job.skills && job.skills.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-1.5">
                                {job.skills.map((s) => (
                                    <span
                                        key={s.id || s.slug}
                                        className="px-2.5 py-1 rounded-full bg-brand-orange/8 text-brand-orange text-xs font-medium border border-brand-orange/15"
                                    >
                                        {s.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Client Action Buttons ─────────────────── */}
                {canAct && (
                    <div className="bg-white rounded-2xl border border-brand-border/60 p-6 mb-4">
                        <h2 className="text-base font-extrabold text-brand-dark mb-3">
                            ⚡ Actions
                        </h2>
                        <p className="text-sm text-brand-muted mb-4">
                            Review this proposal and take action.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => handleAction("accept")}
                                disabled={!!actionLoading}
                                className="flex-1 min-w-[140px] px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {actionLoading === "accept" ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                        Accepting…
                                    </span>
                                ) : (
                                    "✅ Accept Proposal"
                                )}
                            </button>

                            {proposal.status !== "shortlisted" && (
                                <button
                                    onClick={() => handleAction("shortlist")}
                                    disabled={!!actionLoading}
                                    className="flex-1 min-w-[140px] px-6 py-3 text-sm font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {actionLoading === "shortlist" ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-700" />
                                            Shortlisting…
                                        </span>
                                    ) : (
                                        "⭐ Shortlist"
                                    )}
                                </button>
                            )}

                            <button
                                onClick={() => handleAction("reject")}
                                disabled={!!actionLoading}
                                className="flex-1 min-w-[140px] px-6 py-3 text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {actionLoading === "reject" ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700" />
                                        Declining…
                                    </span>
                                ) : (
                                    "❌ Decline"
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Bottom nav ────────────────────────────── */}
                <div className="flex justify-between items-center pt-2">
                    <Link
                        href="/dashboard/proposals"
                        className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-brand-dark bg-white border border-brand-border hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        ← All Proposals
                    </Link>
                    <Link
                        href={`/dashboard/jobs/${proposal.job_id}`}
                        className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl transition-colors"
                    >
                        View Job →
                    </Link>
                </div>
            </div>

            {/* ── Attachment Preview Modal ── */}
            {previewAttach && (
                <div
                    onClick={() => setPreviewAttach(null)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        background: "rgba(0,0,0,0.7)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "2rem",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "#ffffff",
                            borderRadius: 16,
                            maxWidth: 720,
                            width: "100%",
                            maxHeight: "90vh",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
                        }}
                    >
                        {/* Modal header */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "1rem 1.25rem",
                                borderBottom: "1px solid #e2e8f0",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontSize: "1.25rem" }}>📎</span>
                                <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#1e293b" }}>
                                    {previewAttach.name.length > 40 ? previewAttach.name.slice(0, 37) + "..." : previewAttach.name}
                                </span>
                            </div>
                            <button
                                onClick={() => setPreviewAttach(null)}
                                style={{
                                    background: "#f1f5f9",
                                    border: "none",
                                    borderRadius: 8,
                                    width: 32,
                                    height: 32,
                                    fontSize: "1.125rem",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#64748b",
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Preview content */}
                        <div
                            style={{
                                flex: 1,
                                overflowY: "auto",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "1.5rem",
                                background: "#f8fafc",
                                minHeight: 200,
                            }}
                        >
                            {(() => {
                                const ext = previewAttach.url.split(".").pop()?.toLowerCase() ?? "";
                                if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
                                    return (
                                        <img
                                            src={previewAttach.url}
                                            alt={previewAttach.name}
                                            style={{ maxWidth: "100%", maxHeight: "60vh", borderRadius: 8, objectFit: "contain" }}
                                        />
                                    );
                                }
                                if (ext === "pdf") {
                                    return (
                                        <iframe
                                            src={previewAttach.url}
                                            title={previewAttach.name}
                                            style={{ width: "100%", height: "60vh", border: "none", borderRadius: 8 }}
                                        />
                                    );
                                }
                                return (
                                    <div style={{ textAlign: "center", padding: "2rem" }}>
                                        <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📄</div>
                                        <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
                                            Preview not available for this file type
                                        </p>
                                        <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                                            .{ext.toUpperCase()}
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Modal actions */}
                        <div
                            style={{
                                display: "flex",
                                gap: "0.625rem",
                                padding: "1rem 1.25rem",
                                borderTop: "1px solid #e2e8f0",
                                justifyContent: "flex-end",
                            }}
                        >
                            <a
                                href={previewAttach.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.375rem",
                                    padding: "0.5rem 1rem",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: 8,
                                    background: "#ffffff",
                                    color: "#334155",
                                    fontSize: "0.8125rem",
                                    fontWeight: 500,
                                    textDecoration: "none",
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                }}
                            >
                                🔗 Open in New Tab
                            </a>
                            <a
                                href={previewAttach.url}
                                download={previewAttach.name}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.375rem",
                                    padding: "0.5rem 1rem",
                                    border: "none",
                                    borderRadius: 8,
                                    background: "#6366f1",
                                    color: "#ffffff",
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                    textDecoration: "none",
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                }}
                            >
                                ⬇️ Download
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
