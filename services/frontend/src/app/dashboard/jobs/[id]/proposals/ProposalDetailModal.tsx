"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";
const API_ORIGIN = API_BASE.replace(/\/api\/v1$/, "");

function fileUrl(relPath: string) {
    if (relPath.startsWith("http")) return relPath;
    return `${API_ORIGIN}${relPath}`;
}

/* ── Types ───────────────────────────────────────────── */
export interface ScoredProposal {
    id: string;
    job_id: string;
    cover_letter: string;
    bid_amount: number;
    bid_type?: string;
    estimated_duration_days?: number;
    status: string;
    freelancer_id: string;
    freelancer_first_name?: string;
    freelancer_last_name?: string;
    freelancer_avatar?: string;
    freelancer_hourly_rate?: number;
    freelancer_headline?: string;
    freelancer_experience_years?: number;
    milestones_proposed?: { title: string; amount: number | string; description?: string }[] | string;
    _score: number;
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

interface UploadedFile {
    id: string;
    file_name: string;
    file_url: string;
    file_size: number;
    mime_type: string;
}

/* ── Status badge config ─────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    submitted: { label: "New", color: "bg-amber-100 text-amber-700 border-amber-200", icon: "🆕" },
    viewed: { label: "Viewed", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "👁️" },
    shortlisted: { label: "Shortlisted", color: "bg-violet-100 text-violet-700 border-violet-200", icon: "⭐" },
    accepted: { label: "Accepted", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "✅" },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200", icon: "❌" },
    withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-600 border-gray-200", icon: "↩️" },
};

function scoreBadgeColor(score: number): string {
    if (score >= 80) return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (score >= 60) return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-slate-100 text-slate-600 border-slate-300";
}

function durationLabel(days?: number) {
    if (!days) return null;
    const weeks = Math.round(days / 7);
    if (weeks <= 1) return "< 1 week";
    if (weeks <= 4) return `${weeks} weeks`;
    return `${Math.round(weeks / 4)}+ months`;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DEFAULT_ACCEPT_MESSAGE =
    "Congratulations! I'm pleased to accept your proposal for this project. Let's discuss the next steps and get started. Looking forward to working with you!";

/* ── Props ────────────────────────────────────────────── */
interface ProposalDetailModalProps {
    proposal: ScoredProposal;
    jobTitle?: string;
    token: string | null;
    isClient: boolean;
    actionLoading: string | null;
    onAction: (proposalId: string, action: "accept" | "reject" | "shortlist") => void;
    onClose: () => void;
}

/* ── Component ────────────────────────────────────────── */
export default function ProposalDetailModal({
    proposal,
    jobTitle,
    token,
    isClient,
    actionLoading,
    onAction,
    onClose,
}: ProposalDetailModalProps) {
    const [profile, setProfile] = useState<FreelancerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [proposalAttachments, setProposalAttachments] = useState<{ id: string; file_name: string; file_url: string; file_size: number; mime_type: string }[]>([]);

    // ── Message composer state ──
    const [messageBody, setMessageBody] = useState("");
    const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [messageToast, setMessageToast] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Accept confirmation state ──
    const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
    const [acceptMessage, setAcceptMessage] = useState(DEFAULT_ACCEPT_MESSAGE);
    const [accepting, setAccepting] = useState(false);

    // Fetch full freelancer profile
    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const [profileRes, attachRes] = await Promise.all([
                    fetch(`${API_BASE}/freelancers/${proposal.freelancer_id}`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                    }),
                    fetch(`${API_BASE}/attachments/proposal/${proposal.id}`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                    }),
                ]);
                if (profileRes.ok && !cancelled) {
                    const data = await profileRes.json();
                    setProfile(data.data || null);
                }
                if (attachRes.ok && !cancelled) {
                    const data = await attachRes.json();
                    setProposalAttachments(data.data || []);
                }
            } catch { /* ignore */ }
            if (!cancelled) setLoading(false);
        }
        load();
        return () => { cancelled = true; };
    }, [proposal.freelancer_id, proposal.id, token]);

    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const st = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.submitted;
    const avatarUrl = profile?.avatar_url || proposal.freelancer_avatar;
    const displayName = profile?.display_name || `${proposal.freelancer_first_name || ""} ${proposal.freelancer_last_name || ""}`.trim() || "Freelancer";
    const headline = profile?.headline || proposal.freelancer_headline || "Freelancer";

    /* ── File upload handler ── */
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !token) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("entity_type", "proposal");
            formData.append("entity_id", proposal.id);
            for (let i = 0; i < files.length; i++) {
                formData.append("files[]", files[i]);
            }

            const res = await fetch(`${API_BASE}/attachments/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setAttachedFiles((prev) => [...prev, ...(data.data || [])]);
            }
        } catch { /* ignore */ }
        setUploading(false);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [token, proposal.id]);

    /* ── Remove attached file ── */
    const removeFile = useCallback(async (fileId: string) => {
        if (!token) return;
        try {
            await fetch(`${API_BASE}/attachments/${fileId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch { /* ignore */ }
        setAttachedFiles((prev) => prev.filter(f => f.id !== fileId));
    }, [token]);

    /* ── Send message ── */
    const sendMessage = useCallback(async (body: string) => {
        if (!body.trim() || !token) return;
        setSendingMessage(true);
        try {
            // 1. Create or find conversation
            const convRes = await fetch(`${API_BASE}/conversations`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    participant_ids: [proposal.freelancer_id],
                    subject: jobTitle ? `Re: ${jobTitle}` : "Message about your proposal",
                }),
            });

            if (!convRes.ok) throw new Error("Failed to create conversation");
            const convData = await convRes.json();
            const conversationId = convData.data?.id;
            if (!conversationId) throw new Error("No conversation ID");

            // 2. Build attachment URLs string
            const attachmentUrls = attachedFiles.map(f => f.file_url).join(", ");

            // 3. Send message
            const msgRes = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    body: body.trim(),
                    attachment_url: attachmentUrls || null,
                }),
            });

            if (msgRes.ok) {
                setMessageBody("");
                setAttachedFiles([]);
                setMessageToast("✅ Message sent!");
                setTimeout(() => setMessageToast(null), 3000);
            }
        } catch {
            setMessageToast("❌ Failed to send message");
            setTimeout(() => setMessageToast(null), 3000);
        }
        setSendingMessage(false);
    }, [token, proposal.freelancer_id, jobTitle, attachedFiles]);

    /* ── Accept with message ── */
    const handleAcceptConfirm = useCallback(async () => {
        setAccepting(true);
        try {
            // Send acceptance message first
            if (acceptMessage.trim()) {
                await sendMessage(acceptMessage);
            }
            // Then accept the proposal via parent handler
            onAction(proposal.id, "accept");
            setShowAcceptConfirm(false);
        } catch { /* ignore */ }
        setAccepting(false);
    }, [acceptMessage, sendMessage, onAction, proposal.id]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ─────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/40 bg-gradient-to-r from-slate-50 to-white shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        {avatarUrl ? (
                            <img src={fileUrl(avatarUrl)} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-brand-orange/30" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-brand-orange/15 flex items-center justify-center text-lg font-bold text-brand-orange">
                                {proposal.freelancer_first_name?.[0]?.toUpperCase() || "?"}
                            </div>
                        )}
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold text-brand-dark truncate">{displayName}</h3>
                            <p className="text-xs text-brand-muted truncate">{headline}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${scoreBadgeColor(proposal._score)}`}>
                            {proposal._score}% match
                        </span>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-brand-muted hover:text-brand-dark transition-colors text-lg">
                            ✕
                        </button>
                    </div>
                </div>

                {/* ── Body ────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Loading */}
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-orange" />
                        </div>
                    )}

                    {/* ── Proposal Details ── */}
                    <div>
                        <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wide mb-2">💼 Proposal</h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold">
                                💰 ${Number(proposal.bid_amount).toLocaleString()}{proposal.bid_type === "hourly" ? "/hr" : " fixed"}
                            </span>
                            {proposal.estimated_duration_days && (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 text-sm font-medium">
                                    🕐 {durationLabel(proposal.estimated_duration_days)}
                                </span>
                            )}
                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-bold border ${st.color}`}>
                                {st.icon} {st.label}
                            </span>
                        </div>
                        <div
                            className="text-sm text-brand-dark/80 leading-relaxed bg-slate-50 rounded-xl p-4 border border-brand-border/40"
                            dangerouslySetInnerHTML={{ __html: proposal.cover_letter || "<em>No cover letter provided</em>" }}
                        />
                    </div>

                    {/* ── Proposed Milestones ── */}
                    {(() => {
                        const raw = proposal.milestones_proposed;
                        const ms: { title: string; amount: number | string; description?: string }[] =
                            typeof raw === "string" ? (JSON.parse(raw || "[]") as typeof ms) : (raw ?? []);
                        if (!ms.length) return null;
                        const total = ms.reduce((s, m) => s + (parseFloat(String(m.amount)) || 0), 0);
                        return (
                            <div>
                                <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wide mb-2">📋 Proposed Milestones</h4>
                                <div className="bg-slate-50 rounded-xl border border-brand-border/40 divide-y divide-brand-border/30">
                                    {ms.map((m, i) => (
                                        <div key={i} className="flex items-start justify-between px-4 py-3 gap-3">
                                            <div className="flex items-start gap-2 min-w-0">
                                                <span className="shrink-0 w-5 h-5 rounded-full bg-brand-orange/15 text-brand-orange text-[10px] font-bold flex items-center justify-center mt-0.5">
                                                    {i + 1}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-brand-dark">{m.title}</p>
                                                    {m.description && (
                                                        <p className="text-xs text-brand-muted mt-0.5 line-clamp-2">{m.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="shrink-0 text-sm font-bold text-emerald-600">
                                                ${parseFloat(String(m.amount)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/60">
                                        <span className="text-xs font-bold text-brand-dark uppercase">Total</span>
                                        <span className="text-sm font-bold text-emerald-600">
                                            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* ── Proposal Attachments ── */}
                    {proposalAttachments.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wide mb-2">📎 Attachments</h4>
                            <div className="space-y-1.5">
                                {proposalAttachments.map((f) => {
                                    const ext = f.file_name.split(".").pop()?.toLowerCase() || "";
                                    const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
                                    const icon = isImage ? "🖼️" : ext === "pdf" ? "📄" : ["doc", "docx"].includes(ext) ? "📝" : ["xls", "xlsx", "csv"].includes(ext) ? "📊" : "📁";
                                    return (
                                        <a
                                            key={f.id}
                                            href={fileUrl(f.file_url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-brand-border/40 hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                                        >
                                            <span className="text-base">{icon}</span>
                                            <span className="flex-1 min-w-0 text-sm font-medium text-brand-dark group-hover:text-blue-700 truncate">{f.file_name}</span>
                                            <span className="shrink-0 text-[10px] text-brand-muted font-medium">{formatFileSize(f.file_size)}</span>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Profile Details ── */}
                    {profile && !loading && (
                        <>
                            {/* Bio */}
                            {profile.bio && (
                                <div>
                                    <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wide mb-2">📝 About</h4>
                                    <p className="text-sm text-brand-dark/80 leading-relaxed whitespace-pre-line">{profile.bio}</p>
                                </div>
                            )}

                            {/* Key Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {profile.hourly_rate && (
                                    <div className="bg-slate-50 rounded-xl p-3 text-center border border-brand-border/40">
                                        <div className="text-lg font-bold text-brand-dark">${Number(profile.hourly_rate).toLocaleString()}</div>
                                        <div className="text-[10px] text-brand-muted uppercase font-semibold tracking-wide">Hourly Rate</div>
                                    </div>
                                )}
                                {(profile.experience_years ?? 0) > 0 && (
                                    <div className="bg-slate-50 rounded-xl p-3 text-center border border-brand-border/40">
                                        <div className="text-lg font-bold text-brand-dark">{profile.experience_years}yr</div>
                                        <div className="text-[10px] text-brand-muted uppercase font-semibold tracking-wide">Experience</div>
                                    </div>
                                )}
                                {(profile.total_jobs_completed ?? 0) > 0 && (
                                    <div className="bg-slate-50 rounded-xl p-3 text-center border border-brand-border/40">
                                        <div className="text-lg font-bold text-brand-dark">{profile.total_jobs_completed}</div>
                                        <div className="text-[10px] text-brand-muted uppercase font-semibold tracking-wide">Jobs Done</div>
                                    </div>
                                )}
                                {(profile.avg_rating ?? 0) > 0 && (
                                    <div className="bg-slate-50 rounded-xl p-3 text-center border border-brand-border/40">
                                        <div className="text-lg font-bold text-brand-dark">⭐ {Number(profile.avg_rating).toFixed(1)}</div>
                                        <div className="text-[10px] text-brand-muted uppercase font-semibold tracking-wide">{profile.total_reviews} Reviews</div>
                                    </div>
                                )}
                            </div>

                            {/* Location & Availability */}
                            <div className="flex flex-wrap gap-2">
                                {profile.country && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium">
                                        📍 {profile.country}
                                    </span>
                                )}
                                {profile.availability_status && (
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${profile.availability_status === "available" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                        profile.availability_status === "busy" ? "bg-amber-50 text-amber-600 border-amber-200" :
                                            "bg-red-50 text-red-600 border-red-200"
                                        }`}>
                                        {profile.availability_status === "available" ? "🟢" : profile.availability_status === "busy" ? "🟡" : "🔴"} {profile.availability_status}
                                        {profile.availability_hours_week ? ` · ${profile.availability_hours_week}h/wk` : ""}
                                    </span>
                                )}
                                {(profile.success_rate ?? 0) > 0 && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-medium">
                                        ✅ {Number(profile.success_rate).toFixed(0)}% success rate
                                    </span>
                                )}
                                {profile.verification_badges && profile.verification_badges.total_approved > 0 && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 text-xs font-medium">
                                        🛡️ {profile.verification_badges.level} verified
                                    </span>
                                )}
                                {profile.member_since && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 text-xs font-medium">
                                        📅 Member since {new Date(profile.member_since).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                    </span>
                                )}
                            </div>

                            {/* Skills */}
                            {profile.skills && profile.skills.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wide mb-2">🎯 Skills</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {profile.skills.map((s) => (
                                            <span key={s.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-100 text-xs font-medium">
                                                {s.name}
                                                {s.years_experience ? <span className="text-violet-400">· {s.years_experience}yr</span> : null}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Languages */}
                            {profile.languages && profile.languages.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wide mb-2">🌐 Languages</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {profile.languages.map((l, i) => (
                                            <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 text-xs font-medium">
                                                {l.language}{l.proficiency ? ` (${l.proficiency})` : ""}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Education & Certifications */}
                            {((profile.education?.length ?? 0) > 0 || (profile.certifications?.length ?? 0) > 0) && (
                                <div>
                                    <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wide mb-2">🎓 Qualifications</h4>
                                    <div className="space-y-2">
                                        {profile.education?.map((e, i) => (
                                            <div key={`edu-${i}`} className="flex items-start gap-2 text-sm">
                                                <span className="text-brand-muted">🏫</span>
                                                <div>
                                                    <span className="font-semibold text-brand-dark">{e.degree || "Degree"}</span>
                                                    {e.field && <span className="text-brand-muted"> in {e.field}</span>}
                                                    {e.institution && <span className="text-brand-muted"> · {e.institution}</span>}
                                                    {e.year && <span className="text-brand-muted/60 text-xs"> ({e.year})</span>}
                                                </div>
                                            </div>
                                        ))}
                                        {profile.certifications?.map((c, i) => (
                                            <div key={`cert-${i}`} className="flex items-start gap-2 text-sm">
                                                <span className="text-brand-muted">📜</span>
                                                <div>
                                                    <span className="font-semibold text-brand-dark">{c.name || "Certification"}</span>
                                                    {c.issuer && <span className="text-brand-muted"> · {c.issuer}</span>}
                                                    {c.year && <span className="text-brand-muted/60 text-xs"> ({c.year})</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Work History */}
                            {profile.work_history && profile.work_history.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wide mb-2">💼 Past Jobs ({profile.work_history.length})</h4>
                                    <div className="space-y-2">
                                        {profile.work_history.slice(0, 5).map((w) => (
                                            <div key={w.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-brand-border/40">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-brand-dark truncate">{w.title}</p>
                                                    <p className="text-xs text-brand-muted">
                                                        {w.client_name} · {w.contract_type}
                                                        {w.completed_at && ` · Completed ${new Date(w.completed_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">✅ Completed</span>
                                            </div>
                                        ))}
                                        {profile.work_history.length > 5 && (
                                            <p className="text-xs text-brand-muted text-center pt-1">+ {profile.work_history.length - 5} more completed jobs</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Reviews */}
                            {profile.reviews && profile.reviews.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wide mb-2">⭐ Reviews ({profile.reviews.length})</h4>
                                    <div className="space-y-2">
                                        {profile.reviews.slice(0, 3).map((r) => (
                                            <div key={r.id} className="px-3 py-2.5 rounded-xl bg-amber-50/50 border border-amber-100">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-amber-700">{'⭐'.repeat(Math.min(5, Math.round(r.overall_rating)))}</span>
                                                    <span className="text-[10px] text-brand-muted">by {r.reviewer_name}</span>
                                                    {r.contract_title && <span className="text-[10px] text-brand-muted/60">· {r.contract_title}</span>}
                                                </div>
                                                {r.comment && <p className="text-xs text-brand-dark/70 line-clamp-2">{r.comment}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Links */}
                            {(profile.website_url || profile.github_url || profile.linkedin_url || (profile.portfolio_urls?.length ?? 0) > 0) && (
                                <div>
                                    <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wide mb-2">🔗 Links</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.website_url && (
                                            <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-brand-dark border border-brand-border/40 text-xs font-medium hover:bg-slate-100 transition-colors">
                                                🌐 Website
                                            </a>
                                        )}
                                        {profile.github_url && (
                                            <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-brand-dark border border-brand-border/40 text-xs font-medium hover:bg-slate-100 transition-colors">
                                                🐙 GitHub
                                            </a>
                                        )}
                                        {profile.linkedin_url && (
                                            <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-brand-dark border border-brand-border/40 text-xs font-medium hover:bg-slate-100 transition-colors">
                                                💼 LinkedIn
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Send Message Section ────────────────── */}
                    {isClient && proposal.status !== "rejected" && (
                        <div className="border-t border-brand-border/40 pt-5">
                            <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wide mb-3">💬 Send Message</h4>

                            {/* Message toast */}
                            {messageToast && (
                                <div className={`mb-3 px-3 py-2 rounded-xl text-xs font-semibold ${messageToast.startsWith("✅") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                                    {messageToast}
                                </div>
                            )}

                            <textarea
                                value={messageBody}
                                onChange={(e) => setMessageBody(e.target.value)}
                                placeholder={`Write a message to ${displayName}...`}
                                rows={3}
                                className="w-full px-4 py-3 text-sm rounded-xl border border-brand-border/60 bg-white focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 outline-none resize-none transition-colors placeholder:text-brand-muted/50"
                            />

                            {/* Attached files */}
                            {attachedFiles.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {attachedFiles.map((f) => (
                                        <div key={f.id} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                                            <span className="font-medium truncate max-w-[150px]">{f.file_name}</span>
                                            <span className="text-blue-400">{formatFileSize(f.file_size)}</span>
                                            <button
                                                onClick={() => removeFile(f.id)}
                                                className="text-blue-400 hover:text-red-500 transition-colors ml-0.5"
                                                title="Remove"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Actions row */}
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        className="hidden"
                                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                                        onChange={handleFileUpload}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-muted hover:text-brand-dark bg-slate-50 hover:bg-slate-100 border border-brand-border/40 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {uploading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-b border-brand-muted" />
                                                Uploading…
                                            </>
                                        ) : (
                                            <>📎 Attach Files</>
                                        )}
                                    </button>
                                </div>

                                <button
                                    onClick={() => sendMessage(messageBody)}
                                    disabled={sendingMessage || !messageBody.trim()}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sendingMessage ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white" />
                                            Sending…
                                        </>
                                    ) : (
                                        <>🚀 Send Message</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Accept Confirmation Panel ────────────── */}
                    {showAcceptConfirm && (
                        <div className="border-t-2 border-emerald-300 pt-5">
                            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">✅</span>
                                    <h4 className="text-sm font-bold text-emerald-800">Accept Proposal</h4>
                                </div>

                                {/* Contract terms preview */}
                                <div className="bg-white rounded-xl border border-emerald-200 p-4 space-y-2">
                                    <h5 className="text-xs font-bold text-brand-dark uppercase tracking-wide mb-2">📋 Contract Terms</h5>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-brand-muted text-xs">Freelancer</span>
                                            <p className="font-semibold text-brand-dark">{displayName}</p>
                                        </div>
                                        {jobTitle && (
                                            <div>
                                                <span className="text-brand-muted text-xs">Job</span>
                                                <p className="font-semibold text-brand-dark truncate">{jobTitle}</p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-brand-muted text-xs">Bid Amount</span>
                                            <p className="font-semibold text-emerald-700">
                                                ${Number(proposal.bid_amount).toLocaleString()}
                                                {proposal.bid_type === "hourly" ? "/hr" : " fixed"}
                                            </p>
                                        </div>
                                        {proposal.estimated_duration_days && (
                                            <div>
                                                <span className="text-brand-muted text-xs">Duration</span>
                                                <p className="font-semibold text-brand-dark">{durationLabel(proposal.estimated_duration_days)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Editable acceptance message */}
                                <div>
                                    <label className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-2 block">
                                        ✉️ Message to Freelancer
                                    </label>
                                    <textarea
                                        value={acceptMessage}
                                        onChange={(e) => setAcceptMessage(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 text-sm rounded-xl border border-emerald-200 bg-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300/30 outline-none resize-none transition-colors"
                                    />
                                    <p className="text-[10px] text-emerald-600/60 mt-1">This message will be sent to the freelancer along with the acceptance.</p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3 pt-1">
                                    <button
                                        onClick={() => setShowAcceptConfirm(false)}
                                        className="px-4 py-2 text-xs font-semibold text-brand-muted hover:text-brand-dark transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAcceptConfirm}
                                        disabled={accepting || !!actionLoading}
                                        className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                                    >
                                        {accepting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-b border-white" />
                                                Accepting…
                                            </>
                                        ) : (
                                            <>✅ Confirm & Accept</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer ─────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-brand-border/40 bg-slate-50/50 shrink-0">
                    <Link
                        href={`/freelancers/${proposal.freelancer_id}`}
                        className="text-xs font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors"
                    >
                        View Full Profile →
                    </Link>
                    <div className="flex gap-2">
                        {isClient && proposal.status !== "accepted" && proposal.status !== "rejected" && (
                            <>
                                {proposal.status !== "shortlisted" && (
                                    <button
                                        onClick={() => onAction(proposal.id, "shortlist")}
                                        disabled={!!actionLoading}
                                        className="px-4 py-2 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        ⭐ Shortlist
                                    </button>
                                )}
                                <button
                                    onClick={() => onAction(proposal.id, "reject")}
                                    disabled={!!actionLoading}
                                    className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    ❌ Decline
                                </button>
                                <button
                                    onClick={() => setShowAcceptConfirm(true)}
                                    disabled={!!actionLoading || showAcceptConfirm}
                                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    ✅ Accept
                                </button>
                            </>
                        )}
                        {proposal.status === "accepted" && (
                            <span className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">✅ Accepted</span>
                        )}
                        {proposal.status === "rejected" && (
                            <span className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-xl border border-red-200">❌ Declined</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
