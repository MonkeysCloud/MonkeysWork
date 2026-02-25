import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Join MonkeysWork — Early Access for Freelancers",
    description:
        "Be among the first freelancers on MonkeysWork. Get priority matching, a verified early-adopter badge, and reduced fees. Claim your spot — it's free.",
    openGraph: {
        title: "Join MonkeysWork — Early Access for Freelancers",
        description:
            "Be the first. Get matched first. Join MonkeysWork early and unlock exclusive freelancer benefits.",
        type: "website",
        siteName: "MonkeysWork",
    },
    twitter: {
        card: "summary_large_image",
        title: "Join MonkeysWork — Early Access for Freelancers",
        description:
            "Be the first. Get matched first. Claim your free spot today.",
    },
    alternates: {
        canonical: "https://monkeysworks.com/join/freelancers",
    },
};

/* ── Data ────────────────────────────────────────────── */

const EARLY_BENEFITS = [
    {
        icon: "🏆",
        title: "Featured Profile",
        desc: "Early members receive a verified early-adopter badge and priority placement in client search results.",
        highlight: "Top visibility from day one",
    },
    {
        icon: "🎯",
        title: "First Access to Projects",
        desc: "See and bid on jobs before the crowd. Early freelancers get a head start when clients launch.",
        highlight: "Beat the competition",
    },
    {
        icon: "💸",
        title: "Reduced Platform Fees",
        desc: "Lock in a special introductory rate. Early adopters pay less — a reward for trusting us from the start.",
        highlight: "Lower fees, forever",
    },
];

const STEPS = [
    {
        num: "01",
        icon: "👤",
        title: "Create Your Profile",
        desc: "Sign up in under 2 minutes. Add your skills, set your rate, and let our AI optimize your profile.",
    },
    {
        num: "02",
        icon: "🤖",
        title: "Get AI-Matched",
        desc: "When clients go live, you'll be first in line. Our AI matches you with projects that fit your expertise.",
    },
    {
        num: "03",
        icon: "💰",
        title: "Start Earning",
        desc: "Submit proposals, deliver great work, and get paid securely through milestone-based escrow.",
    },
];

const CATEGORIES = [
    "Web Development",
    "Mobile Apps",
    "UI/UX Design",
    "AI & Machine Learning",
    "Content Writing",
    "Video Production",
    "Digital Marketing",
    "Data Science",
    "Blockchain",
    "Cloud & DevOps",
    "Graphic Design",
    "Virtual Assistance",
    "Cybersecurity",
    "Project Management",
];

const TRUST_ITEMS = [
    { icon: "🔒", text: "Escrow-protected payments" },
    { icon: "🤖", text: "AI-powered job matching" },
    { icon: "📈", text: "Build verified reputation" },
    { icon: "🌍", text: "Work with global clients" },
];

/* ── Page ────────────────────────────────────────────── */

export default function JoinFreelancersPage() {
    return (
        <main className="bg-brand-surface">
            {/* ── Hero ─────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#0c0e1a] via-[#141830] to-[#0c0e1a] pt-32 pb-24 lg:pb-32">
                {/* Decorative glows */}
                <div className="absolute top-[-150px] left-[-100px] w-[500px] h-[500px] rounded-full bg-brand-orange/8 blur-[120px] transform-gpu" />
                <div className="absolute bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-purple-500/8 blur-[100px] transform-gpu" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-brand-orange/5 blur-[140px] transform-gpu" />

                <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
                    {/* Early access badge */}
                    <span className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-widest text-amber-300 bg-amber-400/10 rounded-full mb-8 border border-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.15)]">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                        </span>
                        Early Access — Limited Spots
                    </span>

                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
                        Be the First.
                        <br />
                        <span className="bg-gradient-to-r from-brand-orange via-amber-400 to-brand-orange bg-clip-text text-transparent">
                            Get Matched First.
                        </span>
                    </h1>

                    <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                        MonkeysWork is launching soon. Register now to secure your spot,
                        get a verified early-adopter badge, and be first in line when
                        clients start posting projects.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register/freelancer"
                            className="group relative px-10 py-4 text-base font-bold text-white bg-gradient-to-r from-brand-orange to-amber-500 rounded-xl shadow-[0_4px_30px_rgba(240,138,17,0.5)] hover:shadow-[0_8px_40px_rgba(240,138,17,0.65)] transition-all duration-300 hover:-translate-y-1"
                        >
                            Claim Your Spot — It&apos;s Free
                            <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </Link>
                    </div>

                    <p className="mt-5 text-sm text-white/30">
                        No credit card required · Free forever · Takes 2 minutes
                    </p>

                    {/* Social proof counter */}
                    <div className="mt-12 inline-flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10">
                        <div className="flex -space-x-2">
                            {["🧑‍💻", "👩‍🎨", "👨‍💼", "👩‍💻"].map((emoji, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-brand-dark-light to-brand-dark border-2 border-[#141830] text-sm"
                                >
                                    {emoji}
                                </span>
                            ))}
                        </div>
                        <span className="text-sm text-white/60">
                            <strong className="text-white font-semibold">500+</strong> freelancers already joined
                        </span>
                    </div>
                </div>
            </section>

            {/* ── Trust bar ──────────────────────────────── */}
            <section className="bg-white border-b border-brand-border/60">
                <div className="mx-auto max-w-5xl px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {TRUST_ITEMS.map((item) => (
                        <div key={item.text} className="flex items-center justify-center gap-3">
                            <span className="text-2xl">{item.icon}</span>
                            <span className="text-sm font-medium text-brand-text">{item.text}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Why Join Early ──────────────────────────── */}
            <section className="py-20 lg:py-28">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-orange bg-brand-orange/10 rounded-full mb-4">
                            Early Adopter Perks
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text tracking-tight">
                            Why Join Before Launch?
                        </h2>
                        <p className="mt-4 text-brand-muted text-lg max-w-xl mx-auto">
                            Early freelancers get exclusive benefits that won&apos;t be available after public launch.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {EARLY_BENEFITS.map((b) => (
                            <div
                                key={b.title}
                                className="relative bg-white rounded-2xl border border-brand-border/60 p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
                            >
                                {/* Subtle gradient on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative">
                                    <span className="text-4xl block mb-4">{b.icon}</span>
                                    <h3 className="text-xl font-bold text-brand-text mb-2">{b.title}</h3>
                                    <p className="text-sm text-brand-muted leading-relaxed mb-4">{b.desc}</p>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-orange">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        {b.highlight}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How It Works ───────────────────────────── */}
            <section className="py-20 bg-white">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text tracking-tight">
                            How It Works
                        </h2>
                        <p className="mt-4 text-brand-muted text-lg max-w-xl mx-auto">
                            From sign-up to first paycheck — it&apos;s simple.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {STEPS.map((step, i) => (
                            <div key={step.num} className="relative text-center">
                                {/* Connector line */}
                                {i < STEPS.length - 1 && (
                                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-brand-orange/30 to-transparent" />
                                )}
                                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-orange/10 to-brand-orange/5 mb-6">
                                    <span className="text-4xl">{step.icon}</span>
                                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center shadow-lg">
                                        {step.num}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-brand-text mb-2">{step.title}</h3>
                                <p className="text-sm text-brand-muted leading-relaxed max-w-xs mx-auto">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Categories ─────────────────────────────── */}
            <section className="py-20">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-extrabold text-brand-text mb-4">
                            What&apos;s Your Expertise?
                        </h2>
                        <p className="text-brand-muted">
                            We&apos;re looking for talented freelancers across all categories
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        {CATEGORIES.map((cat) => (
                            <Link
                                key={cat}
                                href="/register/freelancer"
                                className="px-5 py-2.5 text-sm font-medium bg-white border border-brand-border/60 rounded-full text-brand-text hover:border-brand-orange hover:text-brand-orange hover:shadow-sm transition-all duration-200"
                            >
                                {cat}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Platform highlights ─────────────────────── */}
            <section className="py-20 bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white relative overflow-hidden">
                <div className="absolute top-[-100px] right-[-60px] w-[350px] h-[350px] rounded-full bg-purple-500/10 blur-3xl transform-gpu" />
                <div className="absolute bottom-[-80px] left-[-40px] w-[300px] h-[300px] rounded-full bg-brand-orange/10 blur-3xl transform-gpu" />
                <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <span className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-purple-300 bg-purple-500/15 rounded-full mb-6 border border-purple-500/25">
                            Built for Freelancers
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                            A Platform That <span className="text-brand-orange">Values</span> Your Work
                        </h2>
                        <p className="text-white/50 max-w-lg mx-auto leading-relaxed">
                            MonkeysWork combines AI technology with fair, transparent policies — so you can focus on what you do best.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { icon: "🔒", title: "Escrow Protection", desc: "Clients fund milestones before work begins. Your payment is always guaranteed." },
                            { icon: "🤖", title: "AI Matching", desc: "Our algorithms find projects that match your exact skills and experience." },
                            { icon: "⚡", title: "Fast Payments", desc: "Get paid within 48 hours of milestone approval via Stripe or PayPal." },
                            { icon: "📊", title: "Growth Tools", desc: "Analytics, AI proposal assistant, and reputation building to grow your career." },
                        ].map((item) => (
                            <div key={item.title} className="bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/8 transition-colors duration-300">
                                <span className="text-3xl block mb-3">{item.icon}</span>
                                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Final CTA ──────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#0c0e1a] via-[#1a1333] to-[#0c0e1a] py-28">
                <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-brand-orange/10 blur-[140px] transform-gpu" />
                <div className="relative mx-auto max-w-3xl px-4 text-center">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300 bg-amber-400/10 rounded-full mb-6 border border-amber-400/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                        </span>
                        Limited Early Access
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
                        Don&apos;t Miss Your
                        <br />
                        <span className="bg-gradient-to-r from-brand-orange via-amber-400 to-brand-orange bg-clip-text text-transparent">
                            Head Start
                        </span>
                    </h2>
                    <p className="text-lg text-white/50 mb-10 max-w-lg mx-auto leading-relaxed">
                        The first wave of freelancers will have the biggest advantage.
                        Create your profile today and be ready when clients arrive.
                    </p>
                    <Link
                        href="/register/freelancer"
                        className="group relative inline-flex items-center gap-2 px-12 py-5 text-lg font-bold text-white bg-gradient-to-r from-brand-orange to-amber-500 rounded-xl shadow-[0_4px_30px_rgba(240,138,17,0.5)] hover:shadow-[0_8px_40px_rgba(240,138,17,0.65)] transition-all duration-300 hover:-translate-y-1"
                    >
                        Register Now — It&apos;s Free
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>
                    <p className="text-xs text-white/25 mt-6">
                        Free forever · No monthly fees · Early adopter perks included
                    </p>
                </div>
            </section>
        </main>
    );
}
