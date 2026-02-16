"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import StatusBadge from "@/components/admin/StatusBadge";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface UserDetail {
    id: string;
    email: string;
    role: string;
    status: string;
    display_name: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    country: string | null;
    timezone: string | null;
    locale: string | null;
    email_verified_at: string | null;
    two_factor_enabled: boolean;
    last_login_at: string | null;
    last_login_ip: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    state: string | null;
    languages: string[] | null;
    profile_completed: boolean;
    freelancer_profile: {
        headline: string | null;
        bio: string | null;
        hourly_rate: number | null;
        currency: string | null;
        experience_years: number | null;
        portfolio_urls: string[] | null;
        website_url: string | null;
        linkedin_url: string | null;
        github_url: string | null;
        verification_level: string | null;
        availability_status: string | null;
        availability_hours_week: number | null;
        avg_rating: number | null;
        total_reviews: number | null;
        total_jobs_completed: number | null;
        total_earnings: number | null;
        success_rate: number | null;
        profile_completeness: number | null;
    } | null;
    jobs_count: number;
    contracts_count: number;
    verifications: {
        id: string;
        type: string;
        status: string;
        created_at: string;
    }[];
}

function InfoRow({
    label,
    value,
    mono,
}: {
    label: string;
    value: React.ReactNode;
    mono?: boolean;
}) {
    return (
        <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
            <span className="text-xs text-gray-400 uppercase tracking-wider">
                {label}
            </span>
            <span
                className={`text-sm text-gray-700 text-right ${mono ? "font-mono" : ""}`}
            >
                {value || "—"}
            </span>
        </div>
    );
}

export default function AdminUserDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { token } = useAuth();
    const router = useRouter();
    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}/admin/users/${id}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("User not found");
                const json = await res.json();
                setUser(json.data);
            } catch (e) {
                setError((e as Error).message);
            } finally {
                setLoading(false);
            }
        })();
    }, [id, token]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48" />
                <div className="bg-white rounded-xl border p-6 space-y-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-4 bg-gray-100 rounded w-3/4"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400 text-lg">{error || "User not found"}</p>
                <button
                    onClick={() => router.back()}
                    className="mt-4 text-sm text-brand-orange hover:underline"
                >
                    ← Back to Users
                </button>
            </div>
        );
    }

    const fmtDate = (d: string | null) =>
        d
            ? new Date(d).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })
            : null;

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    ← Back
                </button>
            </div>

            <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange text-2xl font-bold flex-shrink-0">
                    {user.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        (user.display_name || user.email)?.[0]?.toUpperCase() ??
                        "?"
                    )}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-brand-text">
                        {user.display_name || `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email}
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        <StatusBadge status={user.status} />
                        <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                            {user.role}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <p className="text-2xl font-bold text-brand-text">
                        {user.jobs_count}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Jobs</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <p className="text-2xl font-bold text-brand-text">
                        {user.contracts_count}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Contracts</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <p className="text-2xl font-bold text-brand-text">
                        {user.verifications.length}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Verifications</p>
                </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-600">
                        Account Information
                    </h2>
                </div>
                <div className="px-5 py-2">
                    <InfoRow label="User ID" value={user.id} mono />
                    <InfoRow label="Email" value={user.email} />
                    <InfoRow
                        label="Name"
                        value={`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()}
                    />
                    <InfoRow label="Phone" value={user.phone} />
                    <InfoRow label="Country" value={user.country} />
                    <InfoRow label="Timezone" value={user.timezone} />
                    <InfoRow label="Locale" value={user.locale} />
                    <InfoRow
                        label="Email Verified"
                        value={
                            user.email_verified_at ? (
                                <span className="text-emerald-600">
                                    ✓ {fmtDate(user.email_verified_at)}
                                </span>
                            ) : (
                                <span className="text-red-500">✗ Not verified</span>
                            )
                        }
                    />
                    <InfoRow
                        label="2FA"
                        value={
                            user.two_factor_enabled ? (
                                <span className="text-emerald-600">Enabled</span>
                            ) : (
                                <span className="text-gray-400">Disabled</span>
                            )
                        }
                    />
                    <InfoRow
                        label="Profile Completed"
                        value={
                            user.profile_completed ? (
                                <span className="text-emerald-600">✓ Yes</span>
                            ) : (
                                <span className="text-amber-500">✗ No</span>
                            )
                        }
                    />
                    <InfoRow label="Last Login" value={fmtDate(user.last_login_at)} />
                    <InfoRow label="Last Login IP" value={user.last_login_ip} mono />
                    <InfoRow label="Registered" value={fmtDate(user.created_at)} />
                    <InfoRow label="Updated" value={fmtDate(user.updated_at)} />
                    {user.languages && user.languages.length > 0 && (
                        <InfoRow
                            label="Languages"
                            value={
                                <div className="flex flex-wrap gap-1 justify-end">
                                    {(typeof user.languages === "string"
                                        ? JSON.parse(user.languages)
                                        : user.languages
                                    ).map((lang: unknown, i: number) => {
                                        const label =
                                            typeof lang === "string"
                                                ? lang
                                                : (lang as Record<string, string>)?.language ?? String(lang);
                                        const prof = typeof lang === "object" && lang !== null
                                            ? (lang as Record<string, string>)?.proficiency
                                            : null;
                                        return (
                                            <span
                                                key={i}
                                                className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
                                            >
                                                {label}{prof ? ` (${prof})` : ""}
                                            </span>
                                        );
                                    })}
                                </div>
                            }
                        />
                    )}
                </div>
            </div>

            {/* Freelancer Profile */}
            {user.freelancer_profile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-600">
                            Freelancer Profile
                        </h2>
                    </div>
                    <div className="px-5 py-2">
                        <InfoRow
                            label="Headline"
                            value={user.freelancer_profile.headline}
                        />
                        <InfoRow
                            label="Bio"
                            value={
                                user.freelancer_profile.bio ? (
                                    <span className="max-w-sm block text-right">
                                        {user.freelancer_profile.bio}
                                    </span>
                                ) : null
                            }
                        />
                        <InfoRow
                            label="Hourly Rate"
                            value={
                                user.freelancer_profile.hourly_rate
                                    ? `$${user.freelancer_profile.hourly_rate}/hr (${user.freelancer_profile.currency ?? "USD"})`
                                    : null
                            }
                        />
                        <InfoRow
                            label="Experience"
                            value={
                                user.freelancer_profile.experience_years != null
                                    ? `${user.freelancer_profile.experience_years} years`
                                    : null
                            }
                        />
                        <InfoRow
                            label="Availability"
                            value={user.freelancer_profile.availability_status}
                        />
                        {user.freelancer_profile.availability_hours_week != null && (
                            <InfoRow
                                label="Hours/Week"
                                value={user.freelancer_profile.availability_hours_week}
                            />
                        )}
                        <InfoRow
                            label="Rating"
                            value={
                                user.freelancer_profile.avg_rating != null
                                    ? `${user.freelancer_profile.avg_rating} ⭐ (${user.freelancer_profile.total_reviews ?? 0} reviews)`
                                    : null
                            }
                        />
                        <InfoRow
                            label="Jobs Completed"
                            value={user.freelancer_profile.total_jobs_completed}
                        />
                        <InfoRow
                            label="Total Earnings"
                            value={
                                user.freelancer_profile.total_earnings != null
                                    ? `$${Number(user.freelancer_profile.total_earnings).toLocaleString()}`
                                    : null
                            }
                        />
                        <InfoRow
                            label="Success Rate"
                            value={
                                user.freelancer_profile.success_rate != null
                                    ? `${user.freelancer_profile.success_rate}%`
                                    : null
                            }
                        />
                        <InfoRow
                            label="Profile Completeness"
                            value={
                                user.freelancer_profile.profile_completeness != null
                                    ? `${user.freelancer_profile.profile_completeness}%`
                                    : null
                            }
                        />
                        {user.freelancer_profile.website_url && (
                            <InfoRow label="Website" value={user.freelancer_profile.website_url} />
                        )}
                        {user.freelancer_profile.linkedin_url && (
                            <InfoRow label="LinkedIn" value={user.freelancer_profile.linkedin_url} />
                        )}
                        {user.freelancer_profile.github_url && (
                            <InfoRow label="GitHub" value={user.freelancer_profile.github_url} />
                        )}
                    </div>
                </div>
            )}

            {/* Verifications */}
            {user.verifications.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-600">
                            Recent Verifications
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {user.verifications.map((v) => (
                            <div
                                key={v.id}
                                className="px-5 py-3 flex items-center justify-between"
                            >
                                <div>
                                    <span className="text-sm font-medium text-brand-text capitalize">
                                        {v.type}
                                    </span>
                                    <span className="text-xs text-gray-400 ml-2">
                                        {fmtDate(v.created_at)}
                                    </span>
                                </div>
                                <StatusBadge status={v.status} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
