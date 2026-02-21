"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Preferences {
    account_emails: boolean;
    contract_emails: boolean;
    proposal_emails: boolean;
    message_digest: boolean;
    review_emails: boolean;
    payment_emails: boolean;
    job_recommendations: boolean;
    marketing_emails: boolean;
}

const PREFERENCE_META: Record<string, { label: string; description: string; roles: string[]; locked?: boolean }> = {
    account_emails: {
        label: "Account & Security",
        description: "Verification, password resets, security alerts",
        roles: ["client", "freelancer", "admin"],
        locked: true,
    },
    contract_emails: {
        label: "Contracts",
        description: "Contract accepted, completed, milestones",
        roles: ["client", "freelancer"],
    },
    proposal_emails: {
        label: "Proposals",
        description: "New proposals received, proposal status updates",
        roles: ["client", "freelancer"],
    },
    message_digest: {
        label: "Message Digest",
        description: "Unread message summaries (sent after 5 minutes)",
        roles: ["client", "freelancer"],
    },
    review_emails: {
        label: "Reviews",
        description: "New reviews received, review responses",
        roles: ["client", "freelancer"],
    },
    payment_emails: {
        label: "Payments & Billing",
        description: "Payment receipts, invoices, billing alerts",
        roles: ["client", "freelancer"],
    },
    job_recommendations: {
        label: "Job Recommendations",
        description: "Daily personalized job matches based on your skills",
        roles: ["freelancer"],
    },
    marketing_emails: {
        label: "Tips & Updates",
        description: "Product updates, tips, and promotional content",
        roles: ["client", "freelancer"],
    },
};

export default function NotificationsSettingsPage() {
    const { user } = useAuth();
    const [prefs, setPrefs] = useState<Preferences | null>(null);
    const [saving, setSaving] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPrefs();
    }, []);

    async function fetchPrefs() {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API}/email-preferences`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setPrefs(json.data);
        } catch {
            console.error("Failed to load email preferences");
        }
        setLoading(false);
    }

    async function togglePref(key: string, value: boolean) {
        setSaving(key);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API}/email-preferences`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ [key]: value }),
            });
            const json = await res.json();
            setPrefs(json.data);
        } catch {
            console.error("Failed to update preference");
        }
        setSaving(null);
    }

    const userRole = user?.role || "client";

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
                    Email Notifications
                </h1>
                <p className="text-sm text-brand-muted mt-1">
                    Choose which emails you'd like to receive. Security emails are always sent.
                </p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="animate-pulse bg-white rounded-xl h-16 border border-brand-border/40" />
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {Object.entries(PREFERENCE_META)
                        .filter(([, meta]) => meta.roles.includes(userRole))
                        .map(([key, meta]) => {
                            const checked = prefs?.[key as keyof Preferences] ?? true;
                            const isLocked = meta.locked;
                            const isSaving = saving === key;

                            return (
                                <div
                                    key={key}
                                    className={`flex items-center justify-between p-4 bg-white rounded-xl border transition-all duration-200 ${
                                        isLocked ? "border-brand-border/30 opacity-70" : "border-brand-border/50 hover:border-brand-border hover:shadow-sm"
                                    }`}
                                >
                                    <div className="flex-1 min-w-0 mr-4">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-semibold text-brand-dark">
                                                {meta.label}
                                            </h3>
                                            {isLocked && (
                                                <span className="text-[10px] font-bold text-brand-muted bg-brand-surface px-1.5 py-0.5 rounded">
                                                    ALWAYS ON
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-brand-muted mt-0.5">
                                            {meta.description}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => !isLocked && togglePref(key, !checked)}
                                        disabled={isLocked || !!isSaving}
                                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                                            checked ? "bg-brand-orange" : "bg-gray-200"
                                        } ${isLocked ? "cursor-not-allowed" : "cursor-pointer"}`}
                                    >
                                        <span
                                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                                                checked ? "translate-x-5" : ""
                                            }`}
                                        />
                                        {isSaving && (
                                            <span className="absolute inset-0 flex items-center justify-center">
                                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            </span>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                </div>
            )}

            <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200/60">
                <p className="text-xs text-amber-700 leading-relaxed">
                    📧 <strong>Note:</strong> Security-related emails (account verification, password resets, login alerts)
                    are always sent regardless of your preferences to keep your account safe.
                </p>
            </div>
        </div>
    );
}
