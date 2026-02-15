"use client";

import { useState } from "react";

/* ── step data ──────────────────────────────────────── */
const STEPS = {
    clients: [
        {
            num: "01",
            title: "Post Your Project",
            desc: "Describe your project. Our AI Scope Assistant breaks it into milestones, estimates timelines, and suggests a budget range.",
            icon: (
                <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                    <rect x="6" y="6" width="36" height="36" rx="8" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M16 24h16M24 16v16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
            ),
        },
        {
            num: "02",
            title: "Get Matched",
            desc: "Our matching engine ranks the most relevant freelancers based on skills, experience, success rate, and availability. No endless scrolling.",
            icon: (
                <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                    <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M16 24l5 5 11-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            num: "03",
            title: "Work with Confidence",
            desc: "Milestone-based escrow protects your budget. Pay only when deliverables are accepted. Disputes? Our resolution team has you covered.",
            icon: (
                <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                    <path d="M24 4l18 8v12c0 10-8 18-18 22C14 42 6 34 6 24V12l18-8z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                    <path d="M17 24l5 5 9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
    ],
    freelancers: [
        {
            num: "01",
            title: "Build Your Profile",
            desc: "Showcase your skills, portfolio, and certifications. Get verified to stand out and unlock premium projects.",
            icon: (
                <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                    <circle cx="24" cy="16" r="8" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M10 42c0-8 6-14 14-14s14 6 14 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
            ),
        },
        {
            num: "02",
            title: "Receive Relevant Projects",
            desc: "No more cold pitching. Get matched to projects that fit your expertise. Submit proposals with confidence.",
            icon: (
                <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                    <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M6 18l18 10 18-10" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            num: "03",
            title: "Get Paid on Time",
            desc: "Escrow-funded milestones mean your money is guaranteed before you start. Weekly payouts. No chasing invoices.",
            icon: (
                <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                    <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M24 14v4l6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
    ],
};

/* ── component ──────────────────────────────────────── */
export default function HowItWorks() {
    const [tab, setTab] = useState<"clients" | "freelancers">("clients");
    const steps = STEPS[tab];

    return (
        <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* heading + toggle */}
                <div className="text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark">
                        How it works
                    </h2>

                    {/* toggle */}
                    <div className="inline-flex mt-8 bg-brand-dark/5 rounded-xl p-1">
                        {(["clients", "freelancers"] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`
                  px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200
                  ${tab === t
                                        ? "bg-brand-orange text-white shadow-md"
                                        : "text-brand-muted hover:text-brand-dark"
                                    }
                `}
                            >
                                For {t === "clients" ? "Clients" : "Freelancers"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* step cards */}
                <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step) => (
                        <div
                            key={step.num}
                            className="relative group bg-white rounded-2xl p-8 border border-brand-border/60 hover:border-brand-orange/30 shadow-sm hover:shadow-[0_8px_32px_rgba(240,138,17,0.1)] transition-all duration-300"
                        >
                            {/* step number badge */}
                            <span className="absolute -top-3 -left-2 text-6xl font-black text-brand-orange/8 select-none">
                                {step.num}
                            </span>

                            <div className="text-brand-orange mb-5">{step.icon}</div>
                            <h3 className="text-xl font-bold text-brand-dark mb-3">{step.title}</h3>
                            <p className="text-sm text-brand-muted leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
