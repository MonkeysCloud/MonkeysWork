import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "How It Works for Clients — Hire Top Freelancers | MonkeysWork",
    description:
        "Post a job, get AI-matched proposals, hire verified freelancers, and pay securely through milestone-based escrow. Start hiring in minutes on MonkeysWork.",
    openGraph: {
        title: "How It Works for Clients — MonkeysWork",
        description:
            "Post a job, get AI-matched proposals, hire verified freelancers, and pay securely. The smarter way to outsource.",
        type: "website",
        siteName: "MonkeysWork",
    },
    twitter: {
        card: "summary_large_image",
        title: "How It Works for Clients — MonkeysWork",
        description:
            "Post a job, get AI-matched proposals, hire verified freelancers, and pay securely.",
    },
    alternates: {
        canonical: "https://monkeysworks.com/how-it-works/clients",
    },
};

/* ── Steps data ─────────────────────────────────────── */
const STEPS = [
    {
        num: "01",
        icon: "📝",
        title: "Post Your Project",
        desc: "Describe your project, set your budget and timeline. Our AI Scope Assistant helps you define clear milestones and deliverables — so freelancers know exactly what you need.",
        details: [
            "Detailed job descriptions with AI suggestions",
            "Budget range or fixed price options",
            "AI-generated milestone breakdown",
            "Public or invite-only listings",
        ],
    },
    {
        num: "02",
        icon: "🤖",
        title: "Get AI-Matched Proposals",
        desc: "Our AI ranks incoming proposals based on skill fit, past performance, and delivery reliability. No more sifting through hundreds of unqualified bids.",
        details: [
            "Smart matching scores for every proposal",
            "Verified freelancer profiles with reviews",
            "Portfolio & work history at a glance",
            "Shortlist, compare, and interview in-app",
        ],
    },
    {
        num: "03",
        icon: "🤝",
        title: "Hire & Kick Off",
        desc: "Accept a proposal and the contract is created automatically with escrow protection. Fund milestones upfront with a transparent 5% platform fee — your money is held safely until work is approved.",
        details: [
            "One-click contract creation",
            "Milestone-based escrow payments",
            "Built-in messaging & file sharing",
            "Time tracking for hourly contracts",
        ],
    },
    {
        num: "04",
        icon: "✅",
        title: "Review & Pay",
        desc: "Review deliverables, request revisions, and release payment when satisfied. Rate your freelancer to help the community and improve future AI matches.",
        details: [
            "Visual deliverable review interface",
            "Revision requests with clear feedback",
            "Secure payment release via Stripe or PayPal",
            "Two-way ratings & reviews",
        ],
    },
];

const BENEFITS = [
    {
        icon: "🛡️",
        title: "Escrow Protection",
        desc: "Your funds are held securely until you approve the deliverables. If there's a dispute, our resolution team steps in.",
    },
    {
        icon: "🧠",
        title: "AI-Powered Matching",
        desc: "Our algorithms analyze skills, reviews, and work history to surface the best freelancers for your specific project.",
    },
    {
        icon: "📊",
        title: "Project Dashboard",
        desc: "Track milestones, review deliverables, monitor time logs, and manage invoices from a single dashboard.",
    },
    {
        icon: "🔍",
        title: "AI Fraud Detection",
        desc: "Every proposal and freelancer profile is screened by our AI fraud detection system to keep the platform trustworthy.",
    },
    {
        icon: "💬",
        title: "Built-in Communication",
        desc: "Real-time messaging, file attachments, and video call scheduling — everything you need without leaving the platform.",
    },
    {
        icon: "📱",
        title: "Mobile App",
        desc: "Review proposals, approve milestones, and message freelancers on the go with our iOS and Android apps.",
    },
];

const STATS = [
    { value: "10K+", label: "Verified Freelancers" },
    { value: "98%", label: "Client Satisfaction" },
    { value: "24h", label: "Avg. First Proposal" },
    { value: "150+", label: "Skill Categories" },
];

export default function HowItWorksClientsPage() {
    return (
        <main className="bg-brand-surface">
            {/* ── Hero ─────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand-dark-light to-brand-dark pt-32 pb-20">
                {/* decorative blobs */}
                <div className="absolute top-[-120px] right-[-80px] w-[400px] h-[400px] rounded-full bg-brand-orange/10 blur-3xl" />
                <div className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full bg-brand-orange/5 blur-3xl" />

                <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
                    <span className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-orange bg-brand-orange/10 rounded-full mb-6">
                        For Clients
                    </span>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
                        Hire the <span className="text-brand-orange">Right Freelancer</span>,
                        <br className="hidden sm:block" />
                        Powered by AI
                    </h1>
                    <p className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
                        Post your project, get AI-ranked proposals from verified talent, and manage everything through secure milestone-based contracts. Start hiring in minutes.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="/register"
                            className="px-8 py-4 text-base font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_20px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_28px_rgba(240,138,17,0.55)] transition-all duration-300 hover:-translate-y-0.5"
                        >
                            Post a Job — It&apos;s Free
                        </a>
                        <a
                            href="#how-it-works"
                            className="px-8 py-4 text-base font-semibold text-white/80 border border-white/20 rounded-xl hover:bg-white/5 transition-all duration-300"
                        >
                            See How It Works ↓
                        </a>
                    </div>
                </div>
            </section>

            {/* ── Stats bar ────────────────────────────── */}
            <section className="bg-white border-b border-brand-border/60">
                <div className="mx-auto max-w-5xl px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {STATS.map((s) => (
                        <div key={s.label} className="text-center">
                            <div className="text-3xl sm:text-4xl font-extrabold text-brand-orange">{s.value}</div>
                            <div className="text-sm text-brand-muted mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Step-by-step ─────────────────────────── */}
            <section id="how-it-works" className="py-20 lg:py-28">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text tracking-tight">
                            4 Simple Steps to Hire
                        </h2>
                        <p className="mt-4 text-brand-muted text-lg max-w-xl mx-auto">
                            From posting your job to paying for completed work — here&apos;s how MonkeysWork makes hiring effortless.
                        </p>
                    </div>

                    <div className="space-y-16">
                        {STEPS.map((step, i) => (
                            <div
                                key={step.num}
                                className={`flex flex-col lg:flex-row items-start gap-8 lg:gap-16 ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
                            >
                                {/* visual */}
                                <div className="flex-shrink-0 w-full lg:w-[280px]">
                                    <div className="relative bg-gradient-to-br from-brand-orange/10 to-brand-orange/5 rounded-2xl p-8 text-center">
                                        <span className="absolute top-3 left-4 text-6xl font-black text-brand-orange/10">
                                            {step.num}
                                        </span>
                                        <span className="text-6xl block mb-2">{step.icon}</span>
                                    </div>
                                </div>

                                {/* content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-orange text-white text-sm font-bold">
                                            {step.num}
                                        </span>
                                        <h3 className="text-xl sm:text-2xl font-bold text-brand-text">
                                            {step.title}
                                        </h3>
                                    </div>
                                    <p className="text-brand-muted text-base leading-relaxed mb-4">
                                        {step.desc}
                                    </p>
                                    <ul className="space-y-2">
                                        {step.details.map((d) => (
                                            <li key={d} className="flex items-start gap-2 text-sm text-brand-muted">
                                                <span className="text-brand-orange mt-0.5">✓</span>
                                                {d}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Benefits grid ────────────────────────── */}
            <section className="py-20 bg-white">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text tracking-tight">
                            Why Clients Choose MonkeysWork
                        </h2>
                        <p className="mt-4 text-brand-muted text-lg max-w-xl mx-auto">
                            Everything you need to hire confidently and manage projects efficiently.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {BENEFITS.map((b) => (
                            <div
                                key={b.title}
                                className="bg-brand-surface rounded-2xl border border-brand-border/60 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                            >
                                <span className="text-3xl block mb-3">{b.icon}</span>
                                <h3 className="text-lg font-bold text-brand-text mb-2">{b.title}</h3>
                                <p className="text-sm text-brand-muted leading-relaxed">{b.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Comparison ───────────────────────────── */}
            <section className="py-20">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-brand-text mb-4">
                            MonkeysWork vs Traditional Hiring
                        </h2>
                    </div>
                    <div className="bg-white rounded-2xl border border-brand-border/60 overflow-hidden shadow-sm">
                        <div className="grid grid-cols-3 text-center text-sm font-bold bg-brand-dark text-white">
                            <div className="p-4">Feature</div>
                            <div className="p-4 bg-brand-orange">MonkeysWork</div>
                            <div className="p-4">Others</div>
                        </div>
                        {[
                            ["AI Proposal Matching", "✅", "❌"],
                            ["Escrow Protection", "✅", "Sometimes"],
                            ["AI Scope Analysis", "✅", "❌"],
                            ["AI Fraud Detection", "✅", "❌"],
                            ["Milestone Payments", "✅", "Basic"],
                            ["Built-in Messaging", "✅", "✅"],
                            ["Mobile App", "✅", "Some"],
                            ["Platform Fee", "5% (client)", "15–20%"],
                        ].map(([feature, us, them], i) => (
                            <div
                                key={feature}
                                className={`grid grid-cols-3 text-center text-sm ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                            >
                                <div className="p-3.5 font-medium text-brand-text text-left pl-6">{feature}</div>
                                <div className="p-3.5 font-semibold text-brand-orange">{us}</div>
                                <div className="p-3.5 text-brand-muted">{them}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Final CTA ────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand-dark-light to-brand-dark py-24">
                <div className="absolute top-[-100px] right-[-50px] w-[350px] h-[350px] rounded-full bg-brand-orange/8 blur-3xl" />
                <div className="relative mx-auto max-w-3xl px-4 text-center">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                        Ready to Hire Smarter?
                    </h2>
                    <p className="text-lg text-white/60 mb-10 max-w-lg mx-auto">
                        Join thousands of clients who trust MonkeysWork to find, vet, and manage top freelance talent.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="/register"
                            className="px-10 py-4 text-base font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_20px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_28px_rgba(240,138,17,0.55)] transition-all duration-300 hover:-translate-y-0.5"
                        >
                            Post Your First Job — Free
                        </a>
                        <a
                            href="/pricing"
                            className="px-10 py-4 text-base font-semibold text-white/80 border border-white/20 rounded-xl hover:bg-white/5 transition-all duration-300"
                        >
                            View Pricing
                        </a>
                    </div>
                    <p className="text-xs text-white/30 mt-6">No credit card required · Free to post · Pay only when you hire</p>
                </div>
            </section>
        </main>
    );
}
