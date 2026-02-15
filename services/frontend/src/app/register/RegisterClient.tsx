"use client";

import Link from "next/link";

/* ── inline icons ───────────────────────────────────── */
function BriefcaseIcon() {
    return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            <line x1="12" y1="12" x2="12" y2="12.01" />
        </svg>
    );
}

function CodeIcon() {
    return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
        </svg>
    );
}

const ROLES = [
    {
        key: "client" as const,
        href: "/register/client",
        icon: <BriefcaseIcon />,
        accent: "blue",
        title: "Hire Freelancers",
        desc: "Post projects, review proposals, and collaborate with verified talent worldwide.",
        features: [
            "AI-powered talent matching",
            "Milestone-based escrow",
            "Free to post unlimited jobs",
        ],
        cta: "Continue as Client",
    },
    {
        key: "freelancer" as const,
        href: "/register/freelancer",
        icon: <CodeIcon />,
        accent: "emerald",
        title: "Work as a Freelancer",
        desc: "Build your profile, get matched with projects, and grow your freelance career.",
        features: [
            "Get matched to relevant projects",
            "Secure milestone payments",
            "Build verified reputation",
        ],
        cta: "Continue as Freelancer",
    },
];

export default function RegisterClient() {
    return (
        <>
            {/* ── Hero ── */}
            <section className="pt-16 sm:pt-24 pb-12 bg-gradient-to-b from-brand-dark/[0.03] to-brand-surface">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-dark tracking-tight">
                        Join MonkeysWork
                    </h1>
                    <p className="mt-4 text-lg text-brand-muted max-w-xl mx-auto leading-relaxed">
                        Create your free account and start collaborating with
                        the best talent — or find your next project.
                    </p>
                </div>
            </section>

            {/* ── Role Cards ── */}
            <section className="py-12 sm:py-20">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm font-semibold text-brand-muted uppercase tracking-widest mb-10">
                        I want to&hellip;
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {ROLES.map((role) => {
                            const isClient = role.key === "client";
                            return (
                                <Link
                                    key={role.key}
                                    href={role.href}
                                    className={`group relative rounded-2xl bg-white border-2 p-8 sm:p-10 transition-all duration-300 hover:-translate-y-1 ${isClient
                                            ? "border-blue-100 hover:border-blue-300 hover:shadow-[0_8px_32px_rgba(59,130,246,0.1)]"
                                            : "border-emerald-100 hover:border-emerald-300 hover:shadow-[0_8px_32px_rgba(16,185,129,0.1)]"
                                        }`}
                                >
                                    {/* icon */}
                                    <div
                                        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${isClient
                                                ? "bg-blue-50 group-hover:bg-blue-100"
                                                : "bg-emerald-50 group-hover:bg-emerald-100"
                                            }`}
                                    >
                                        {role.icon}
                                    </div>

                                    <h2 className="text-2xl font-bold text-brand-dark mb-2">
                                        {role.title}
                                    </h2>
                                    <p className="text-brand-muted text-sm leading-relaxed mb-6">
                                        {role.desc}
                                    </p>

                                    {/* feature bullets */}
                                    <ul className="space-y-2.5 mb-8">
                                        {role.features.map((f) => (
                                            <li
                                                key={f}
                                                className="flex items-center gap-2.5 text-sm text-brand-dark"
                                            >
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 20 20"
                                                    className={`flex-shrink-0 ${isClient
                                                            ? "text-blue-500"
                                                            : "text-emerald-500"
                                                        }`}
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA */}
                                    <span
                                        className={`inline-flex items-center gap-2 text-sm font-bold transition-colors ${isClient
                                                ? "text-blue-600 group-hover:text-blue-700"
                                                : "text-emerald-600 group-hover:text-emerald-700"
                                            }`}
                                    >
                                        {role.cta}
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="transition-transform group-hover:translate-x-1"
                                        >
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* login link */}
                    <p className="text-center text-sm text-brand-muted mt-10">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors"
                        >
                            Log in
                        </Link>
                    </p>
                </div>
            </section>
        </>
    );
}
