"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Styling ────────────────────────────────────── */
const btnPrimary =
    "px-6 py-2.5 rounded-xl bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange/90 transition-all shadow-sm disabled:opacity-50";
const btnOutline =
    "px-4 py-2 rounded-xl border border-brand-border/60 text-sm font-medium text-brand-dark hover:bg-brand-bg transition-all disabled:opacity-50";

/* ── Types ──────────────────────────────────────── */
interface Badge {
    type: string;
    label: string;
    status: string;
    verified: boolean;
    confidence: number | null;
    verified_at: string | null;
}

interface BadgeSummary {
    level: string;
    badges: Badge[];
    total_approved: number;
    total_types: number;
}

interface VerifRecord {
    id: string;
    type: string;
    status: string;
    created_at: string;
    reviewed_at: string | null;
    updated_at: string | null;
}

interface EvaluateResult {
    evaluated: number;
    created: { id: string; type: string }[];
    skipped: { type: string; status: string; reason: string }[];
    not_applicable: string[];
    reasons: Record<string, string>;
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

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
    approved: { bg: "bg-green-100", text: "text-green-700", label: "Verified" },
    auto_approved: { bg: "bg-green-100", text: "text-green-700", label: "Auto-Verified" },
    pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pending Review" },
    in_review: { bg: "bg-blue-100", text: "text-blue-700", label: "In Review" },
    rejected: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
    auto_rejected: { bg: "bg-red-100", text: "text-red-700", label: "Not Passed" },
    human_review: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Manual Review" },
    expired: { bg: "bg-gray-100", text: "text-gray-600", label: "Expired" },
    not_submitted: { bg: "bg-gray-100", text: "text-gray-500", label: "Not Started" },
    not_applicable: { bg: "bg-gray-50", text: "text-gray-400", label: "Not Applicable" },
};

const LEVEL_BADGE: Record<string, { bg: string; text: string; icon: string }> = {
    premium: { bg: "bg-purple-100", text: "text-purple-700", icon: "💎" },
    verified: { bg: "bg-blue-100", text: "text-blue-700", icon: "✅" },
    basic: { bg: "bg-green-100", text: "text-green-700", icon: "🟢" },
    none: { bg: "bg-gray-100", text: "text-gray-500", icon: "⬜" },
};

const VERIFICATION_TYPES = [
    { value: "identity", label: "Identity Verification", icon: "🪪", desc: "Government-issued ID verification" },
    { value: "skill_assessment", label: "Skill Assessment", icon: "🧠", desc: "Expertise evaluated from your skills profile" },
    { value: "portfolio", label: "Portfolio Review", icon: "🎨", desc: "Portfolio & certifications review" },
    { value: "work_history", label: "Work History", icon: "📋", desc: "Employment and project history verification" },
    { value: "payment_method", label: "Payment Method", icon: "💳", desc: "Payment method verification" },
];

/* ── Main Page ──────────────────────────────────── */
export default function VerificationPage() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [evaluating, setEvaluating] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [lastResult, setLastResult] = useState<EvaluateResult | null>(null);

    const [badgeSummary, setBadgeSummary] = useState<BadgeSummary | null>(null);
    const [verifications, setVerifications] = useState<VerifRecord[]>([]);

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    /* ── Load ────────────────────────────────────── */
    const loadData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [profileRes, verifRes] = await Promise.all([
                fetch(`${API_BASE}/freelancers/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE}/verifications`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (profileRes.ok) {
                const { data } = await profileRes.json();
                setBadgeSummary(data.verification_badges ?? null);
            }

            if (verifRes.ok) {
                const { data } = await verifRes.json();
                setVerifications(data || []);
            }
        } catch (err) {
            setToast({ message: (err as Error).message, type: "error" });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { loadData(); }, [loadData]);

    /* ── Run Verification ────────────────────────── */
    const runVerification = async () => {
        if (!token) return;
        setEvaluating(true);
        setLastResult(null);
        try {
            const res = await fetch(`${API_BASE}/verifications/evaluate`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Evaluation failed");
            }
            const { data } = await res.json();
            setLastResult(data);

            const created = data.created?.length ?? 0;
            const skipped = data.skipped?.length ?? 0;

            if (created > 0) {
                setToast({
                    message: `${created} verification(s) started! ${skipped > 0 ? `${skipped} already in progress.` : ""}`,
                    type: "success",
                });
            } else if (skipped > 0) {
                setToast({
                    message: `All applicable verifications are already in progress or completed.`,
                    type: "success",
                });
            } else {
                setToast({
                    message: "No new verifications to run. Complete your profile to enable more.",
                    type: "success",
                });
            }

            await loadData(); // Refresh
        } catch (err) {
            setToast({ message: (err as Error).message, type: "error" });
        } finally {
            setEvaluating(false);
        }
    };

    /* ── Helpers ──────────────────────────────────── */
    const getBadgeForType = (type: string): Badge | null => {
        return badgeSummary?.badges.find(b => b.type === type) ?? null;
    };

    const getVerifRecord = (type: string): VerifRecord | undefined => {
        return verifications.find(v => v.type === type);
    };

    const isNotApplicable = (type: string): boolean => {
        return lastResult?.not_applicable?.includes(type) ?? false;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
            </div>
        );
    }

    const level = badgeSummary?.level ?? "none";
    const levelInfo = LEVEL_BADGE[level] ?? LEVEL_BADGE.none;
    const hasAnyPending = verifications.some(v => v.status === "pending");

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-10">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg transition-all max-w-sm ${toast.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                    {toast.message}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-brand-dark">Verification</h1>
                    <p className="text-sm text-brand-muted mt-0.5">
                        Your profile data is automatically evaluated to build trust with clients.
                    </p>
                </div>
                <button
                    className={btnPrimary}
                    onClick={runVerification}
                    disabled={evaluating}
                >
                    {evaluating ? (
                        <span className="flex items-center gap-2">
                            <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                            Evaluating…
                        </span>
                    ) : hasAnyPending ? (
                        "Re-evaluate"
                    ) : (
                        "Run Verification"
                    )}
                </button>
            </div>

            {/* ── Verification Level ── */}
            <Section title="Verification Level">
                <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl ${levelInfo.bg} flex items-center justify-center text-3xl`}>
                        {levelInfo.icon}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-brand-dark capitalize">{level}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelInfo.bg} ${levelInfo.text}`}>
                                {badgeSummary?.total_approved ?? 0} / {badgeSummary?.total_types ?? 5} verified
                            </span>
                        </div>
                        <p className="text-sm text-brand-muted mt-0.5">
                            {level === "premium"
                                ? "Top-tier verification — you stand out to clients."
                                : level === "verified"
                                    ? "Well-verified profile — great trust signals."
                                    : level === "basic"
                                        ? "Getting started — complete more verifications to improve trust."
                                        : "No verifications yet — click 'Run Verification' to start."}
                        </p>
                        {/* Progress bar */}
                        <div className="mt-3 h-2 bg-brand-border/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-orange rounded-full transition-all duration-500"
                                style={{ width: `${((badgeSummary?.total_approved ?? 0) / (badgeSummary?.total_types ?? 5)) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── Verification Badges ── */}
            <Section title="Verification Badges" description="Each badge is automatically evaluated based on your profile data.">
                <div className="space-y-3">
                    {VERIFICATION_TYPES.map((vtype) => {
                        const badge = getBadgeForType(vtype.value);
                        const record = getVerifRecord(vtype.value);
                        const notApplicable = isNotApplicable(vtype.value);
                        const isVerified = badge?.verified ?? false;
                        const isPending = record && record.status === "pending";
                        const isInReview = record && ["in_review", "human_review", "info_requested"].includes(record.status);
                        const isRejected = record && ["rejected", "auto_rejected"].includes(record.status);

                        const statusKey = notApplicable
                            ? "not_applicable"
                            : badge?.status ?? record?.status ?? "not_submitted";
                        const statusInfo = STATUS_BADGE[statusKey] ?? STATUS_BADGE.not_submitted;

                        // Get the reason from lastResult if available
                        const reason = lastResult?.reasons?.[vtype.value];

                        return (
                            <div
                                key={vtype.value}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isVerified
                                    ? "border-green-200 bg-green-50/30"
                                    : isPending
                                        ? "border-yellow-200 bg-yellow-50/30"
                                        : isInReview
                                            ? "border-blue-200 bg-blue-50/30"
                                            : isRejected
                                                ? "border-red-200 bg-red-50/20"
                                                : notApplicable
                                                    ? "border-gray-200/60 bg-gray-50/30 opacity-60"
                                                    : "border-brand-border/60"
                                    }`}
                            >
                                <div className="text-2xl w-10 h-10 flex items-center justify-center flex-shrink-0">
                                    {vtype.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-brand-dark">{vtype.label}</p>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-brand-muted mt-0.5">
                                        {notApplicable
                                            ? `Add ${vtype.value === "skill_assessment" ? "skills" : vtype.value === "portfolio" ? "portfolio items or certifications" : vtype.value === "work_history" ? "work experience" : "data"} to your profile to enable this`
                                            : reason || vtype.desc}
                                    </p>
                                    {badge?.confidence != null && (
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="h-1.5 flex-1 max-w-[120px] bg-brand-border/30 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${badge.confidence >= 0.8 ? "bg-green-500" : badge.confidence >= 0.5 ? "bg-yellow-500" : "bg-red-500"}`}
                                                    style={{ width: `${badge.confidence * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-brand-muted">
                                                {Math.round(badge.confidence * 100)}% confidence
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-shrink-0">
                                    {isVerified ? (
                                        <span className="text-green-600 text-lg">✓</span>
                                    ) : isPending ? (
                                        <span className="flex items-center gap-1.5 text-xs text-yellow-600 font-medium">
                                            <span className="animate-spin h-3 w-3 border-2 border-yellow-400/30 border-t-yellow-600 rounded-full" />
                                            Processing
                                        </span>
                                    ) : isInReview ? (
                                        <span className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                                            🔍 In Review
                                        </span>
                                    ) : isRejected ? (
                                        <span className="text-red-500 text-lg">✗</span>
                                    ) : notApplicable ? (
                                        <span className="text-gray-300 text-lg">—</span>
                                    ) : (
                                        <span className="text-gray-300 text-lg">○</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Section>

            {/* ── Last Evaluation Summary ── */}
            {lastResult && (
                <Section title="Last Evaluation" description="Results from the most recent verification run.">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                            <p className="text-2xl font-bold text-green-700">{lastResult.created.length}</p>
                            <p className="text-xs text-green-600 mt-1">New Started</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <p className="text-2xl font-bold text-blue-700">{lastResult.skipped.length}</p>
                            <p className="text-xs text-blue-600 mt-1">Already Active</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <p className="text-2xl font-bold text-gray-500">{lastResult.not_applicable.length}</p>
                            <p className="text-xs text-gray-500 mt-1">Not Applicable</p>
                        </div>
                    </div>
                </Section>
            )}

            {/* ── History ── */}
            {verifications.length > 0 && (
                <Section title="Verification History" description="Track your verification submissions.">
                    <div className="space-y-2">
                        {verifications.map((v) => {
                            const statusInfo = STATUS_BADGE[v.status] ?? STATUS_BADGE.not_submitted;
                            return (
                                <div key={v.id} className="flex items-center justify-between p-3 bg-brand-bg/50 rounded-lg border border-brand-border/30">
                                    <div>
                                        <p className="text-sm font-medium text-brand-dark capitalize">
                                            {v.type.replace(/_/g, " ")}
                                        </p>
                                        <p className="text-[11px] text-brand-muted">
                                            Submitted {new Date(v.created_at).toLocaleDateString()}
                                            {v.reviewed_at && ` · Reviewed ${new Date(v.reviewed_at).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                                        {statusInfo.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Section>
            )}
        </div>
    );
}
