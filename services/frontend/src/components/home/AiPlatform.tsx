import Link from "next/link";

/* ── feature data ───────────────────────────────────── */
const FEATURES = [
    {
        title: "Scope Assistant",
        desc: "Paste your project description. Get a milestone breakdown, time estimate, and budget range in seconds.",
        icon: (
            <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
                <rect x="4" y="8" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
                <path d="M12 16h16M12 21h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        title: "Smart Matching",
        desc: "Our engine analyzes 50+ signals — skills, past performance, timezone, availability, communication style — to surface the best fits.",
        icon: (
            <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
                <circle cx="14" cy="14" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        title: "Fraud Protection",
        desc: "Behavioral analysis flags suspicious accounts before they waste your time. Every freelancer passes multi-layer verification.",
        icon: (
            <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
                <path d="M20 2l16 7v11c0 9-7 16-16 20C11 36 4 29 4 20V9l16-7z" stroke="currentColor" strokeWidth="2" />
                <path d="M14 20l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
];

export default function AiPlatform() {
    return (
        <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* left — illustration / visual */}
                    <div className="relative">
                        <div className="relative bg-gradient-to-br from-brand-dark to-[#2a2b3d] rounded-3xl p-8 sm:p-12 overflow-hidden">
                            {/* decorative code lines */}
                            <div className="space-y-4 font-mono text-sm">
                                <div className="flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full bg-red-400/60" />
                                    <span className="w-3 h-3 rounded-full bg-yellow-400/60" />
                                    <span className="w-3 h-3 rounded-full bg-green-400/60" />
                                </div>
                                <div className="space-y-2 pt-4">
                                    <p className="text-brand-orange/80">// AI Scope Analysis</p>
                                    <p className="text-white/60">
                                        <span className="text-purple-400">const</span>{" "}
                                        <span className="text-blue-300">scope</span>{" "}
                                        <span className="text-white/40">=</span>{" "}
                                        <span className="text-green-400">await</span>{" "}
                                        <span className="text-yellow-300">analyze</span>
                                        <span className="text-white/40">(</span>
                                        <span className="text-amber-300">project</span>
                                        <span className="text-white/40">)</span>
                                    </p>
                                    <div className="pl-4 border-l-2 border-brand-orange/20 space-y-1 mt-2">
                                        <p className="text-white/40">
                                            milestones: <span className="text-brand-orange">5</span>
                                        </p>
                                        <p className="text-white/40">
                                            estimated_weeks: <span className="text-brand-orange">8</span>
                                        </p>
                                        <p className="text-white/40">
                                            budget_range: <span className="text-brand-orange">&quot;$12k-$18k&quot;</span>
                                        </p>
                                        <p className="text-white/40">
                                            confidence: <span className="text-green-400">0.94</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* glow effect */}
                            <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand-orange/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
                        </div>
                    </div>

                    {/* right — content */}
                    <div>
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-orange bg-brand-orange/10 rounded-full mb-6">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                            AI-Powered
                        </span>

                        <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark leading-tight">
                            Smarter hiring.
                            <br />
                            Faster delivery.
                        </h2>

                        <p className="mt-4 text-brand-muted leading-relaxed">
                            MonkeysWork uses AI at every step — not to replace human judgment,
                            but to eliminate busywork.
                        </p>

                        {/* feature list */}
                        <div className="mt-8 space-y-6">
                            {FEATURES.map((f) => (
                                <div key={f.title} className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange">
                                        {f.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-brand-dark">{f.title}</h3>
                                        <p className="text-sm text-brand-muted mt-1 leading-relaxed">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link
                            href="/ai"
                            className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors"
                        >
                            See how our AI works
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
