"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Types ──────────────────────────────────── */
interface Skill {
    id: string;
    name: string;
    slug: string;
    years_experience?: number;
    proficiency?: string;
}

interface VerificationBadge {
    type: string;
    label: string;
    status: string;
    verified: boolean;
    confidence: number | null;
    verified_at: string | null;
}

interface Review {
    id: string;
    overall_rating: number;
    communication_rating: number;
    quality_rating: number;
    timeliness_rating: number;
    professionalism_rating: number;
    comment: string;
    response: string | null;
    response_at: string | null;
    created_at: string;
    reviewer_name: string;
    reviewer_avatar: string | null;
    contract_title: string | null;
}

interface WorkHistoryItem {
    id: string;
    title: string;
    contract_type: string;
    status: string;
    started_at: string;
    completed_at: string;
    client_name: string;
}

interface PortfolioItem {
    title: string;
    description?: string;
    url: string;
    image_url?: string;
}

interface Education {
    institution: string;
    degree: string;
    year: string;
}

interface Certification {
    name: string;
    issuer: string;
    year: string;
    url?: string;
}

interface FreelancerData {
    user_id: string;
    display_name: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    country: string | null;
    headline: string | null;
    bio: string | null;
    hourly_rate: string | null;
    currency: string;
    experience_years: number;
    availability_status: string;
    availability_hours_week: number | null;
    avg_rating: string;
    total_reviews: number;
    total_jobs_completed: number;
    total_hours_logged: string;
    success_rate: string;
    profile_completeness: number;
    member_since: string;
    website_url: string | null;
    github_url: string | null;
    linkedin_url: string | null;
    skills: Skill[];
    verification_badges: {
        level: string;
        badges: VerificationBadge[];
        total_approved: number;
        total_types: number;
    };
    reviews: Review[];
    work_history: WorkHistoryItem[];
    portfolio_urls: PortfolioItem[];
    education: Education[];
    certifications: Certification[];
    languages: Array<{ language: string; code: string; level: string }>;
}

/* ── Star rating ────────────────────────────── */
function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
    const px = size === "lg" ? "w-6 h-6" : size === "md" ? "w-5 h-5" : "w-4 h-4";
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className={`${px} ${i <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

/* ── Availability badge ─────────────────────── */
function AvailabilityBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; color: string }> = {
        available: { label: "Available", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
        busy: { label: "Busy", color: "bg-amber-100 text-amber-700 border-amber-200" },
        not_available: { label: "Not Available", color: "bg-red-100 text-red-700 border-red-200" },
    };
    const c = config[status] ?? config["available"];
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.color}`}>
            <span className={`w-2 h-2 rounded-full ${status === "available" ? "bg-emerald-500 animate-pulse" : status === "busy" ? "bg-amber-500" : "bg-red-500"}`} />
            {c.label}
        </span>
    );
}

/* ── Verification level badge ───────────────── */
function VerifLevelBadge({ level }: { level: string }) {
    const config: Record<string, { label: string; icon: string; cls: string }> = {
        premium: { label: "Premium Verified", icon: "💎", cls: "bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200" },
        verified: { label: "Verified", icon: "✅", cls: "bg-blue-100 text-blue-700 border-blue-200" },
        basic: { label: "Basic Verified", icon: "🔵", cls: "bg-sky-100 text-sky-700 border-sky-200" },
        none: { label: "Not Verified", icon: "⚪", cls: "bg-gray-100 text-gray-500 border-gray-200" },
    };
    const c = config[level] ?? config["none"];
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${c.cls}`}>
            {c.icon} {c.label}
        </span>
    );
}

/* ── Section card ───────────────────────────── */
function Card({ title, icon, children, className = "" }: { title: string; icon: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${className}`}>
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{title}</h2>
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    );
}

/* ── Date helper ────────────────────────────── */
function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function fmtDateFull(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/* ══════════════════════════════════════════════
   Public Freelancer Profile Page
   ══════════════════════════════════════════════ */
export default function FreelancerProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [data, setData] = useState<FreelancerData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(true);

    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/freelancers/${id}` : "";
    const copyLink = useCallback(() => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [shareUrl]);

    useEffect(() => {
        (async () => {
            try {
                const token = typeof window !== "undefined" ? localStorage.getItem("mw_token") : null;
                setIsLoggedIn(!!token);
                const headers: Record<string, string> = {};
                if (token) headers["Authorization"] = `Bearer ${token}`;

                const res = await fetch(`${API_BASE}/freelancers/${id}`, { headers });
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error((body as Record<string, string>).error || `Profile not found (${res.status})`);
                }
                const { data } = await res.json();
                setData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load profile");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-400">
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm font-medium">Loading profile…</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="text-5xl">🔒</div>
                    <h1 className="text-xl font-bold text-gray-900">{error}</h1>
                    <p className="text-sm text-gray-500">This profile may be private or require authentication.</p>
                    <Link href="/login" className="inline-block px-6 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors">
                        Sign in
                    </Link>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const d = data;
    const apiOrigin = new URL(API_BASE).origin;
    const avatarSrc = d.avatar_url
        ? d.avatar_url.startsWith("http") ? d.avatar_url : `${apiOrigin}${d.avatar_url}`
        : null;
    const fullName = [d.first_name, d.last_name].filter(Boolean).join(" ") || d.display_name;
    const avgRating = parseFloat(d.avg_rating) || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                {/* ── Hero section ────────────────────── */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-gray-100 shadow-md bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {avatarSrc ? (
                                <img src={avatarSrc} alt={fullName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-bold text-orange-400">{(fullName?.[0] ?? "?").toUpperCase()}</span>
                            )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{fullName}</h1>
                                <VerifLevelBadge level={d.verification_badges?.level ?? "none"} />
                                <AvailabilityBadge status={d.availability_status} />
                            </div>
                            {d.headline && <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-2">{d.headline}</p>}
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
                                {d.country && <span>📍 {d.country}</span>}
                                {d.member_since && <span>🗓️ Member since {fmtDate(d.member_since)}</span>}
                                {d.hourly_rate && <span className="font-bold text-gray-700 text-sm">${d.hourly_rate}/hr</span>}
                            </div>
                        </div>
                        {/* Rating + Share */}
                        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <Stars rating={avgRating} size="md" />
                                <span className="text-base font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                            </div>
                            <span className="text-xs text-gray-400">{d.total_reviews} review{d.total_reviews !== 1 ? "s" : ""}</span>
                            <button
                                onClick={copyLink}
                                className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-50 text-orange-600 text-xs font-semibold rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors"
                            >
                                {copied ? (
                                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Copied!</>
                                ) : (
                                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg> Share Profile</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Stats bar ───────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Jobs Completed", value: d.total_jobs_completed, icon: "📋" },
                        { label: "Hours Logged", value: `${Math.round(parseFloat(d.total_hours_logged) || 0)}h`, icon: "⏱️" },
                        { label: "Success Rate", value: `${Math.round(parseFloat(d.success_rate) || 0)}%`, icon: "🎯" },
                        { label: "Avg Rating", value: avgRating.toFixed(1), icon: "⭐" },
                    ].map((s) => (
                        <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:shadow-sm transition-shadow">
                            <div className="text-lg">{s.icon}</div>
                            <div className="text-xl font-extrabold text-gray-900 mt-1">{s.value}</div>
                            <div className="text-[11px] text-gray-400 font-medium mt-0.5">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ── Left column ─────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* About */}
                        {d.bio && (
                            <Card title="About" icon="👤">
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{d.bio}</p>
                                {d.experience_years > 0 && (
                                    <div className="mt-3 text-xs text-gray-400">{d.experience_years} years of experience</div>
                                )}
                            </Card>
                        )}

                        {/* Skills */}
                        {d.skills.length > 0 && (
                            <Card title="Skills" icon="🛠️">
                                <div className="flex flex-wrap gap-2">
                                    {d.skills.map((s) => (
                                        <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-semibold rounded-full border border-orange-100 hover:bg-orange-100 transition-colors">
                                            {s.name}
                                            {s.years_experience ? <span className="text-orange-400 font-normal">· {s.years_experience}y</span> : null}
                                        </span>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Portfolio */}
                        {d.portfolio_urls?.length > 0 && (
                            <Card title="Portfolio" icon="🎨">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {d.portfolio_urls.map((p, i) => (
                                        <a
                                            key={i}
                                            href={p.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all group"
                                        >
                                            <div className="font-semibold text-sm text-gray-900 group-hover:text-orange-600 transition-colors truncate">{p.title || "Project"}</div>
                                            {p.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
                                            <div className="text-[11px] text-orange-500 mt-2 truncate">↗ {p.url}</div>
                                        </a>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Reviews */}
                        {d.reviews?.length > 0 && (
                            <Card title={`Reviews (${d.total_reviews})`} icon="⭐">
                                <div className="space-y-4">
                                    {d.reviews.map((r) => (
                                        <div key={r.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0">
                                                        {r.reviewer_avatar ? (
                                                            <img src={r.reviewer_avatar.startsWith("http") ? r.reviewer_avatar : `${apiOrigin}${r.reviewer_avatar}`} alt={r.reviewer_name} className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            <span className="text-sm font-bold text-orange-500">{(r.reviewer_name?.[0] ?? "?").toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">{r.reviewer_name}</div>
                                                        {r.contract_title && <div className="text-[11px] text-gray-400">for {r.contract_title}</div>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <Stars rating={r.overall_rating} />
                                                    <span className="text-xs font-bold text-gray-700">{Number(r.overall_rating).toFixed(1)}</span>
                                                </div>
                                            </div>
                                            {r.comment && <p className="text-sm text-gray-600 mt-3 leading-relaxed">{r.comment}</p>}
                                            {r.response && (
                                                <div className="mt-3 pl-4 border-l-2 border-orange-200">
                                                    <div className="text-[11px] font-semibold text-orange-500 mb-1">Freelancer&apos;s Response</div>
                                                    <p className="text-xs text-gray-500">{r.response}</p>
                                                </div>
                                            )}
                                            <div className="text-[11px] text-gray-300 mt-2">{fmtDateFull(r.created_at)}</div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Work History */}
                        {d.work_history?.length > 0 && (
                            <Card title="Work History" icon="💼">
                                <div className="space-y-3">
                                    {d.work_history.map((w) => (
                                        <div key={w.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-gray-900 truncate">{w.title}</div>
                                                <div className="text-[11px] text-gray-400 mt-0.5">
                                                    {w.client_name} · {fmtDate(w.started_at)} – {fmtDate(w.completed_at)}
                                                </div>
                                            </div>
                                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex-shrink-0">
                                                ✓ Completed
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* ── Right sidebar ───────────────────── */}
                    <div className="space-y-6">
                        {/* Verification badges */}
                        {d.verification_badges?.badges?.length > 0 && (
                            <Card title="Verifications" icon="🛡️">
                                <div className="space-y-2.5">
                                    {d.verification_badges.badges.map((b) => (
                                        <div key={b.type} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700">{b.label}</span>
                                            {b.verified ? (
                                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Verified</span>
                                            ) : (
                                                <span className="text-xs text-gray-300">—</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                                    <span className="text-xs font-semibold text-gray-500">{d.verification_badges.total_approved}/{d.verification_badges.total_types} verified</span>
                                </div>
                            </Card>
                        )}

                        {/* Languages */}
                        {d.languages?.length > 0 && (
                            <Card title="Languages" icon="🌍">
                                <div className="space-y-2">
                                    {d.languages.map((l) => (
                                        <div key={l.code} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700">{l.language}</span>
                                            <span className="text-xs text-gray-400 capitalize">{l.level?.replace("_", " ")}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Education */}
                        {d.education?.length > 0 && (
                            <Card title="Education" icon="🎓">
                                <div className="space-y-3">
                                    {d.education.map((e, i) => (
                                        <div key={i}>
                                            <div className="text-sm font-semibold text-gray-900">{e.degree}</div>
                                            <div className="text-xs text-gray-500">{e.institution}{e.year ? ` · ${e.year}` : ""}</div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Certifications */}
                        {d.certifications?.length > 0 && (
                            <Card title="Certifications" icon="📜">
                                <div className="space-y-3">
                                    {d.certifications.map((c, i) => (
                                        <div key={i}>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {c.url ? (
                                                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">{c.name} ↗</a>
                                                ) : c.name}
                                            </div>
                                            <div className="text-xs text-gray-500">{c.issuer}{c.year ? ` · ${c.year}` : ""}</div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Social Links */}
                        {(d.website_url || d.github_url || d.linkedin_url) && (
                            <Card title="Links" icon="🔗">
                                <div className="space-y-2">
                                    {d.website_url && (
                                        <a href={d.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-500 transition-colors">
                                            🌐 <span className="truncate">{d.website_url.replace(/^https?:\/\//, "")}</span>
                                        </a>
                                    )}
                                    {d.github_url && (
                                        <a href={d.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-500 transition-colors">
                                            💻 <span className="truncate">{d.github_url.replace(/^https?:\/\//, "")}</span>
                                        </a>
                                    )}
                                    {d.linkedin_url && (
                                        <a href={d.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-500 transition-colors">
                                            💼 <span className="truncate">{d.linkedin_url.replace(/^https?:\/\//, "")}</span>
                                        </a>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Availability details */}
                        <Card title="Availability" icon="📅">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Status</span>
                                    <AvailabilityBadge status={d.availability_status} />
                                </div>
                                {d.availability_hours_week && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Hours/week</span>
                                        <span className="text-sm font-semibold text-gray-900">{d.availability_hours_week}h</span>
                                    </div>
                                )}
                                {d.hourly_rate && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Rate</span>
                                        <span className="text-sm font-bold text-gray-900">${d.hourly_rate}/{d.currency?.toLowerCase()}/hr</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center py-6 text-xs text-gray-300">
                    MonkeysWorks · © {new Date().getFullYear()}
                </div>
            </div>

            {/* ── Sticky CTA for logged-out visitors ── */}
            {!isLoggedIn && data && (
                <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">Want to work with {fullName}?</p>
                            <p className="text-xs text-gray-500 mt-0.5">Sign up as a client to send a proposal and start collaborating</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                                Sign in
                            </Link>
                            <Link
                                href="/register/client"
                                className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl shadow-[0_4px_14px_rgba(240,138,17,0.3)] hover:shadow-[0_6px_20px_rgba(240,138,17,0.45)] hover:bg-orange-600 transition-all"
                            >
                                Register to Hire
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
