"use client";

import { useState } from "react";
import Link from "next/link";

/* ── step data ──────────────────────────────────────── */
const CLIENT_STEPS = [
    {
        num: "01",
        title: "Post Your Project",
        desc: "Describe what you need. Choose a category, set your budget (fixed or hourly), and add required skills. Our AI Scope Assistant will suggest milestones and a realistic timeline.",
        visual: "job-form",
    },
    {
        num: "02",
        title: "Review AI-Matched Talent",
        desc: "Within minutes, our matching engine surfaces the most relevant freelancers. Each match includes a compatibility score, skill breakdown, and past project history. No manual filtering required.",
        visual: "match-results",
    },
    {
        num: "03",
        title: "Receive & Compare Proposals",
        desc: "Freelancers submit detailed proposals with their approach, timeline, and cost breakdown. Shortlist your favorites, ask questions through our messaging system.",
        visual: "proposals",
    },
    {
        num: "04",
        title: "Hire & Fund Escrow",
        desc: "Accept a proposal to start the contract. Fund the first milestone — your money is held securely in escrow until you approve the work.",
        visual: "escrow",
    },
    {
        num: "05",
        title: "Collaborate on Milestones",
        desc: "Track progress through milestones. Review deliverables, request revisions if needed, or approve and release payment. Everything in one place.",
        visual: "milestones",
    },
    {
        num: "06",
        title: "Leave a Review",
        desc: "After the project wraps, leave an honest review. Your feedback helps the community and improves future AI matching.",
        visual: "review",
    },
];

const FREELANCER_STEPS = [
    {
        num: "01",
        title: "Create Your Profile",
        desc: "Add your skills, experience, portfolio, and hourly rate. Complete the verification steps to earn a Verified badge and access premium projects.",
        visual: "profile",
    },
    {
        num: "02",
        title: "Get Matched to Projects",
        desc: "Our AI analyzes your profile against open projects and sends you relevant opportunities. You can also browse and search all open jobs.",
        visual: "matching",
    },
    {
        num: "03",
        title: "Submit Proposals",
        desc: "Write a cover letter, propose your approach and milestones, set your price. Stand out with your portfolio and verified credentials.",
        visual: "proposal",
    },
    {
        num: "04",
        title: "Start Working",
        desc: "Once hired, the client funds escrow. You can work with confidence knowing the money is secured. Submit deliverables per milestone.",
        visual: "working",
    },
    {
        num: "05",
        title: "Get Paid",
        desc: "When the client approves a milestone, funds are released immediately. Choose your payout method: bank transfer or PayPal. Weekly automated payouts.",
        visual: "payout",
    },
    {
        num: "06",
        title: "Build Your Reputation",
        desc: "Each completed project adds to your track record. Higher ratings and more completions unlock better visibility and premium features.",
        visual: "reputation",
    },
];

const GUARANTEES = [
    {
        icon: "🔄",
        text: "If you're not satisfied with proposals within 7 days, we'll help you re-scope and re-post — free.",
    },
    {
        icon: "🔒",
        text: "Escrow funds are never released without your approval.",
    },
    {
        icon: "⚖️",
        text: "Dispute resolution available at every milestone.",
    },
];

/* ── inline visual mockups ──────────────────────────── */
function StepVisual({ type, isClient }: { type: string; isClient: boolean }) {
    const accent = isClient ? "brand-orange" : "emerald-500";
    const accentBg = isClient ? "brand-orange/10" : "emerald-500/10";

    const visuals: Record<string, React.ReactNode> = {
        /* ── client visuals ── */
        "job-form": (
            <div className="space-y-3">
                <div className="flex gap-2 items-center">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                    <div className="w-3 h-3 rounded-full bg-green-400/60" />
                </div>
                <div className={`h-3 w-2/3 bg-${accentBg} rounded`} />
                <div className="h-8 w-full bg-white/10 rounded-lg border border-white/10" />
                <div className="flex gap-2">
                    <div className="h-6 w-20 bg-white/10 rounded-md" />
                    <div className="h-6 w-16 bg-white/10 rounded-md" />
                    <div className={`h-6 w-24 bg-${accentBg} rounded-md`} />
                </div>
                <div className="h-16 w-full bg-white/10 rounded-lg border border-white/10" />
                <div className={`h-8 w-32 bg-${accent} rounded-lg mx-auto`} />
            </div>
        ),
        "match-results": (
            <div className="space-y-2.5">
                {[92, 87, 81].map((score) => (
                    <div key={score} className="flex items-center gap-3 bg-white/5 rounded-lg p-2.5">
                        <div className={`w-8 h-8 rounded-full bg-${accentBg} flex items-center justify-center text-xs font-bold text-${accent}`}>
                            {score}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="h-2.5 w-24 bg-white/15 rounded" />
                            <div className="h-2 w-16 bg-white/8 rounded" />
                        </div>
                        <div className={`h-2 w-12 bg-${accent} rounded-full opacity-60`} />
                    </div>
                ))}
            </div>
        ),
        proposals: (
            <div className="space-y-2.5">
                {["⭐", "🏆", "✨"].map((badge) => (
                    <div key={badge} className="flex items-center gap-3 bg-white/5 rounded-lg p-2.5">
                        <span className="text-lg">{badge}</span>
                        <div className="flex-1 space-y-1">
                            <div className="h-2.5 w-28 bg-white/15 rounded" />
                            <div className="h-2 w-20 bg-white/8 rounded" />
                        </div>
                        <div className="text-xs font-semibold text-white/40">$4,500</div>
                    </div>
                ))}
            </div>
        ),
        escrow: (
            <div className="text-center space-y-3">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-orange/15 flex items-center justify-center text-2xl">🔒</div>
                <div className="h-2.5 w-32 bg-white/15 rounded mx-auto" />
                <div className="text-2xl font-bold text-brand-orange">$5,000</div>
                <div className="h-2 w-24 bg-white/8 rounded mx-auto" />
                <div className="flex items-center justify-center gap-1 text-xs text-green-400">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    Secured in Escrow
                </div>
            </div>
        ),
        milestones: (
            <div className="space-y-2">
                {["Design", "Frontend", "Backend", "Testing"].map((m, i) => (
                    <div key={m} className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] ${i < 2 ? "border-green-400 bg-green-400/20 text-green-400" : i === 2 ? `border-${accent} bg-${accentBg} text-${accent}` : "border-white/20"
                            }`}>
                            {i < 2 ? "✓" : ""}
                        </div>
                        <div className="flex-1">
                            <div className="text-xs text-white/50">{m}</div>
                        </div>
                        <div className={`text-[10px] font-semibold ${i < 2 ? "text-green-400" : i === 2 ? `text-${accent}` : "text-white/20"}`}>
                            {i < 2 ? "Paid" : i === 2 ? "In Progress" : "Pending"}
                        </div>
                    </div>
                ))}
            </div>
        ),
        review: (
            <div className="text-center space-y-3">
                <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <svg key={i} width="20" height="20" viewBox="0 0 20 20" fill="#f08a11">
                            <path d="M10 1.5l2.47 5.01L18 7.24l-4 3.9.94 5.49L10 13.88l-4.94 2.75.94-5.49-4-3.9 5.53-.73L10 1.5z" />
                        </svg>
                    ))}
                </div>
                <div className="h-12 w-full bg-white/5 rounded-lg border border-white/10" />
                <div className="h-7 w-28 bg-brand-orange rounded-lg mx-auto" />
            </div>
        ),

        /* ── freelancer visuals ── */
        profile: (
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">JD</div>
                    <div className="space-y-1">
                        <div className="h-2.5 w-24 bg-white/15 rounded" />
                        <div className="h-2 w-16 bg-white/8 rounded" />
                    </div>
                </div>
                <div className="flex gap-1.5">
                    {["React", "Node", "TS"].map((s) => (
                        <span key={s} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md">{s}</span>
                    ))}
                </div>
                <div className="h-16 w-full bg-white/5 rounded-lg border border-white/10" />
                <div className="flex items-center gap-1 text-xs text-emerald-400">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path d="M10 0l2.24 3.76L16.5 2.5l-1.26 4.24L20 8.76l-3.76 2.24L17.5 15.5l-4.24-1.26L11.24 20H8.76l-2.02-5.76L2.5 15.5l1.26-4.26L0 8.76l4.74-2.02L3.5 2.5l4.26 1.26L10 0z" /></svg>
                    Verified
                </div>
            </div>
        ),
        matching: (
            <div className="space-y-2.5">
                <div className="text-xs text-white/40 mb-1">New matches for you</div>
                {["E-commerce Rebuild", "Mobile App MVP", "API Integration"].map((p) => (
                    <div key={p} className="flex items-center gap-2.5 bg-white/5 rounded-lg p-2.5">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                        <div className="flex-1 text-xs text-white/60">{p}</div>
                        <div className="text-[10px] text-emerald-400 font-semibold">95%</div>
                    </div>
                ))}
            </div>
        ),
        proposal: (
            <div className="space-y-3">
                <div className="h-3 w-1/2 bg-white/10 rounded" />
                <div className="h-20 w-full bg-white/5 rounded-lg border border-white/10" />
                <div className="flex gap-2">
                    <div className="h-6 w-16 bg-white/10 rounded-md text-center text-[10px] leading-6 text-white/40">$85/hr</div>
                    <div className="h-6 w-20 bg-white/10 rounded-md text-center text-[10px] leading-6 text-white/40">4 weeks</div>
                </div>
                <div className="h-8 w-28 bg-emerald-500 rounded-lg mx-auto" />
            </div>
        ),
        working: (
            <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-white/40">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Active Project
                </div>
                {["Milestone 1 — Design", "Milestone 2 — Dev"].map((m, i) => (
                    <div key={m} className="flex items-center gap-2 bg-white/5 rounded-lg p-2.5">
                        <div className={`w-4 h-4 rounded-full ${i === 0 ? "bg-emerald-400/20 text-emerald-400 text-[8px] flex items-center justify-center" : "border border-white/20"}`}>
                            {i === 0 ? "✓" : ""}
                        </div>
                        <div className="flex-1 text-xs text-white/50">{m}</div>
                    </div>
                ))}
                <div className="text-xs text-center text-emerald-400 font-semibold">🔒 Escrow Funded</div>
            </div>
        ),
        payout: (
            <div className="text-center space-y-3">
                <div className="text-3xl font-bold text-emerald-400">$4,250</div>
                <div className="text-xs text-white/40">Released to your account</div>
                <div className="flex justify-center gap-2">
                    {["🏦", "💸"].map((m) => (
                        <div key={m} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg border border-white/10">{m}</div>
                    ))}
                </div>
                <div className="flex items-center justify-center gap-1 text-xs text-emerald-400">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    Weekly Auto-Payout
                </div>
            </div>
        ),
        reputation: (
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <svg key={i} width="14" height="14" viewBox="0 0 20 20" fill="#10b981"><path d="M10 1.5l2.47 5.01L18 7.24l-4 3.9.94 5.49L10 13.88l-4.94 2.75.94-5.49-4-3.9 5.53-.73L10 1.5z" /></svg>
                        ))}
                    </div>
                    <span className="text-xs text-white/40">4.9 (127)</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                    {[["42", "Projects"], ["98%", "Success"], ["Top 5%", "Rank"]].map(([v, l]) => (
                        <div key={l} className="bg-white/5 rounded-lg p-2">
                            <div className="text-sm font-bold text-emerald-400">{v}</div>
                            <div className="text-[10px] text-white/30">{l}</div>
                        </div>
                    ))}
                </div>
            </div>
        ),
    };

    return (
        <div className="bg-gradient-to-br from-brand-dark to-[#2a2b3d] rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            {visuals[type] || null}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-brand-orange/5 rounded-full blur-3xl transform-gpu pointer-events-none" />
        </div>
    );
}

/* ── main component ─────────────────────────────────── */
export default function HowItWorksPage() {
    const [tab, setTab] = useState<"clients" | "freelancers">("clients");
    const isClient = tab === "clients";
    const steps = isClient ? CLIENT_STEPS : FREELANCER_STEPS;

    return (
        <>
            {/* ── Hero ── */}
            <section className="pt-16 sm:pt-24 pb-12 bg-gradient-to-b from-brand-dark/[0.03] to-brand-surface">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-dark tracking-tight">
                        {isClient ? "Hire with confidence" : "Find work you love"}
                    </h1>
                    <p className="mt-4 text-lg text-brand-muted max-w-2xl mx-auto leading-relaxed">
                        {isClient
                            ? "From posting your first project to paying the final milestone — here's how MonkeysWorks works for you."
                            : "From creating your profile to getting paid — here's how MonkeysWorks helps you grow your freelance career."}
                    </p>

                    {/* Toggle */}
                    <div className="inline-flex mt-10 bg-brand-dark/5 rounded-xl p-1">
                        {(["clients", "freelancers"] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${tab === t
                                    ? "bg-brand-orange text-white shadow-md"
                                    : "text-brand-muted hover:text-brand-dark"
                                    }`}
                            >
                                For {t === "clients" ? "Clients" : "Freelancers"}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Vertical Timeline ── */}
            <section className="py-16 sm:py-24">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="relative">
                        {/* timeline line */}
                        <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-px bg-brand-border/60 -translate-x-1/2 hidden sm:block" />

                        <div className="space-y-16 sm:space-y-24">
                            {steps.map((step, i) => {
                                const isLeft = i % 2 === 0;
                                return (
                                    <div key={step.num} className="relative">
                                        {/* timeline dot */}
                                        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border-2 border-brand-orange items-center justify-center text-sm font-bold text-brand-orange shadow-[0_0_0_4px_rgba(240,138,17,0.1)] z-10">
                                            {step.num}
                                        </div>

                                        <div className={`sm:grid sm:grid-cols-2 sm:gap-16 items-center ${isLeft ? "" : "direction-rtl"}`}>
                                            {/* content side */}
                                            <div className={`${isLeft ? "sm:text-right sm:pr-8" : "sm:text-left sm:pl-8 sm:col-start-2"} mb-6 sm:mb-0`}>
                                                {/* mobile step number */}
                                                <div className="sm:hidden flex items-center gap-3 mb-3">
                                                    <span className="w-9 h-9 rounded-full bg-brand-orange/10 flex items-center justify-center text-sm font-bold text-brand-orange">
                                                        {step.num}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl sm:text-2xl font-bold text-brand-dark mb-3">
                                                    {step.title}
                                                </h3>
                                                <p className="text-brand-muted leading-relaxed">
                                                    {step.desc}
                                                </p>
                                            </div>

                                            {/* visual side */}
                                            <div className={`${isLeft ? "sm:col-start-2 sm:pl-8" : "sm:col-start-1 sm:row-start-1 sm:pr-8"}`}>
                                                <StepVisual type={step.visual} isClient={isClient} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Platform Guarantees (clients only) ── */}
            {isClient && (
                <section className="py-16 sm:py-20 bg-brand-dark/[0.02]">
                    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark text-center mb-10">
                            Our guarantees to you
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {GUARANTEES.map((g) => (
                                <div
                                    key={g.text}
                                    className="bg-white rounded-2xl p-6 border border-brand-border/60 shadow-sm text-center"
                                >
                                    <span className="text-3xl block mb-3">{g.icon}</span>
                                    <p className="text-sm text-brand-muted leading-relaxed">{g.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Bottom CTA ── */}
            <section className="relative overflow-hidden bg-gradient-to-b from-brand-dark via-[#2a2b3d] to-brand-dark text-white">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-brand-orange/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        {isClient ? "Ready to find your perfect match?" : "Ready to grow your freelance career?"}
                    </h2>
                    <p className="mt-4 text-white/50 max-w-lg mx-auto">
                        {isClient
                            ? "Post your first project and let our AI do the rest."
                            : "Create your free profile and start getting matched today."}
                    </p>
                    <Link
                        href={isClient ? "/register/client" : "/register/freelancer"}
                        className="inline-block mt-8 px-8 py-4 text-base font-bold text-brand-dark bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_32px_rgba(240,138,17,0.55)] transition-all duration-200 hover:-translate-y-0.5"
                    >
                        {isClient ? "Post Your First Project" : "Create Your Free Profile"}
                    </Link>
                </div>
            </section>
        </>
    );
}
