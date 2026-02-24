"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

export default function SelectRolePage() {
    const router = useRouter();
    const { user, token, refreshUser } = useAuth();
    const [selected, setSelected] = useState<"client" | "freelancer" | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // If user already has a role, redirect to dashboard
    if (user && user.role !== "pending") {
        router.push("/dashboard");
        return null;
    }

    async function handleContinue() {
        if (!selected || !token) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE}/auth/set-role`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role: selected }),
            });

            const body = await res.json();

            if (!res.ok) {
                throw new Error(body.message || "Failed to set role");
            }

            // Refresh user data in context so role is updated
            await refreshUser();
            router.push("/dashboard");
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    }

    const roles = [
        {
            id: "client" as const,
            icon: "🏢",
            title: "I want to hire",
            description:
                "Find and hire skilled freelancers for your projects. Post jobs, review proposals, and manage contracts.",
            features: [
                "Post unlimited projects",
                "Browse verified freelancers",
                "Secure escrow payments",
                "Track project milestones",
            ],
        },
        {
            id: "freelancer" as const,
            icon: "💼",
            title: "I want to work",
            description:
                "Showcase your skills and find exciting projects. Submit proposals, track time, and get paid securely.",
            features: [
                "Create a professional profile",
                "Browse curated job listings",
                "Built-in time tracker",
                "Fast & secure payouts",
            ],
        },
    ];

    return (
        <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-surface via-white to-brand-surface px-4 py-12">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-brand-orange to-brand-orange-hover flex items-center justify-center shadow-lg shadow-brand-orange/30">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 00-3-3.87" />
                            <path d="M16 3.13a4 4 0 010 7.75" />
                        </svg>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
                        How will you use MonkeysWork?
                    </h1>
                    <p className="mt-2 text-sm text-brand-muted max-w-md mx-auto">
                        Choose your role to personalize your experience. You can always update this later.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl text-center">
                        {error}
                    </div>
                )}

                {/* Role cards */}
                <div className="grid sm:grid-cols-2 gap-4">
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            type="button"
                            onClick={() => setSelected(role.id)}
                            className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 hover:shadow-lg ${
                                selected === role.id
                                    ? "border-brand-orange bg-brand-orange/5 shadow-md shadow-brand-orange/10"
                                    : "border-brand-border/60 bg-white hover:border-brand-muted/40"
                            }`}
                        >
                            {/* Check mark */}
                            {selected === role.id && (
                                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-brand-orange flex items-center justify-center">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                            )}

                            <span className="text-4xl">{role.icon}</span>
                            <h3 className="mt-3 text-lg font-bold text-brand-dark">
                                {role.title}
                            </h3>
                            <p className="mt-1.5 text-sm text-brand-muted leading-relaxed">
                                {role.description}
                            </p>

                            {/* Features */}
                            <ul className="mt-4 space-y-2">
                                {role.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex items-center gap-2 text-xs text-brand-muted"
                                    >
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke={
                                                selected === role.id
                                                    ? "#F08A11"
                                                    : "#9ca3af"
                                            }
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </button>
                    ))}
                </div>

                {/* Continue button */}
                <button
                    type="button"
                    disabled={!selected || loading}
                    onClick={handleContinue}
                    className="mt-8 w-full py-3.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_32px_rgba(240,138,17,0.55)] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_24px_rgba(240,138,17,0.4)] flex items-center justify-center gap-2"
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
                    {loading
                        ? "Setting up your account…"
                        : selected
                          ? `Continue as ${selected === "client" ? "Client" : "Freelancer"}`
                          : "Select a role to continue"}
                </button>

                {/* Small note */}
                <p className="mt-4 text-center text-xs text-brand-muted/60">
                    This helps us tailor your dashboard and features. You can change your role from settings anytime.
                </p>
            </div>
        </section>
    );
}
