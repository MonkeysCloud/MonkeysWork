"use client";

import { useState } from "react";

/* ── testimonial data ───────────────────────────────── */
const TESTIMONIALS = [
    {
        quote: "We found our React developer in 24 hours. The AI matching was scarily accurate — the first candidate was a perfect fit.",
        name: "Sarah Thompson",
        role: "CTO",
        company: "Elevate Labs",
        type: "Client",
        avatar: "ST",
        color: "bg-violet-500",
    },
    {
        quote: "Best platform I've used for consistent, high-quality work. The escrow system means I never worry about getting paid.",
        name: "Marcus Chen",
        role: "Full-Stack Developer",
        company: "Freelancer",
        type: "Freelancer",
        avatar: "MC",
        color: "bg-blue-500",
    },
    {
        quote: "The Scope Assistant saved us weeks of back-and-forth. It broke our vague idea into actionable milestones instantly.",
        name: "Jessica Park",
        role: "Product Manager",
        company: "NovaTech",
        type: "Client",
        avatar: "JP",
        color: "bg-pink-500",
    },
    {
        quote: "I tripled my income in 6 months. The smart matching sends me projects I actually want to work on — no more cold pitching.",
        name: "David Okonkwo",
        role: "DevOps Engineer",
        company: "Freelancer",
        type: "Freelancer",
        avatar: "DO",
        color: "bg-emerald-500",
    },
    {
        quote: "We scaled from 2 to 15 contractors without any growing pains. The milestone system keeps everything transparent.",
        name: "Laura Sánchez",
        role: "VP of Engineering",
        company: "Streamline",
        type: "Client",
        avatar: "LS",
        color: "bg-amber-500",
    },
    {
        quote: "Finally, a freelance platform that treats verification seriously. My verified badge gets me 3x more project invites.",
        name: "Aisha Rahman",
        role: "UI/UX Designer",
        company: "Freelancer",
        type: "Freelancer",
        avatar: "AR",
        color: "bg-cyan-500",
    },
];

export default function Testimonials() {
    const [active, setActive] = useState(0);
    const pages = Math.ceil(TESTIMONIALS.length / 3);

    return (
        <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-14">
                    <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark">
                        What people are saying
                    </h2>
                    <p className="mt-4 text-brand-muted">
                        From companies and freelancers who trust MonkeysWorks
                    </p>
                </div>

                {/* carousel pages */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {TESTIMONIALS.slice(active * 3, active * 3 + 3).map((t) => (
                        <div
                            key={t.name}
                            className="bg-white rounded-2xl p-7 border border-brand-border/60 shadow-sm flex flex-col"
                        >
                            {/* type badge */}
                            <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${t.type === "Client"
                                    ? "text-blue-600 bg-blue-50"
                                    : "text-emerald-600 bg-emerald-50"
                                }`}>
                                {t.type}
                            </span>

                            {/* quote */}
                            <p className="text-sm text-brand-dark leading-relaxed mb-6 flex-1">
                                &ldquo;{t.quote}&rdquo;
                            </p>

                            {/* author */}
                            <div className="flex items-center gap-3 pt-4 border-t border-brand-border/40">
                                <div className={`w-10 h-10 ${t.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                                    {t.avatar}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-brand-dark">{t.name}</p>
                                    <p className="text-xs text-brand-muted">{t.role}, {t.company}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* pagination dots */}
                {pages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        {Array.from({ length: pages }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActive(i)}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${active === i
                                        ? "bg-brand-orange w-8"
                                        : "bg-brand-dark/15 hover:bg-brand-dark/30"
                                    }`}
                                aria-label={`Page ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
