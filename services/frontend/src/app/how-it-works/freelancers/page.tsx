import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "How It Works for Freelancers — Find Work & Grow | MonkeysWork",
    description:
        "Create your profile, get AI-matched with projects, submit proposals, and get paid securely through milestone-based escrow. Start earning on MonkeysWork today.",
    openGraph: {
        title: "How It Works for Freelancers — MonkeysWork",
        description:
            "Build your profile, get matched with ideal projects, and get paid securely. The smarter way to freelance.",
        type: "website",
        siteName: "MonkeysWork",
    },
    twitter: {
        card: "summary_large_image",
        title: "How It Works for Freelancers — MonkeysWork",
        description:
            "Build your profile, get matched with ideal projects, and get paid securely.",
    },
    alternates: {
        canonical: "https://monkeysworks.com/how-it-works/freelancers",
    },
};

/* ── Steps data ─────────────────────────────────────── */
const STEPS = [
    {
        num: "01",
        icon: "👤",
        title: "Create Your Profile",
        desc: "Build a professional profile showcasing your skills, portfolio, certifications, and work history. Our AI helps optimize your profile to stand out to clients.",
        details: [
            "Add skills, hourly rate & availability",
            "Upload portfolio samples & case studies",
            "Get verified for higher trust levels",
            "AI profile optimization suggestions",
        ],
    },
    {
        num: "02",
        icon: "🔍",
        title: "Find & Get Matched",
        desc: "Browse jobs or let our AI match you with projects that fit your skills and experience. Get notified instantly when high-fit opportunities appear.",
        details: [
            "AI-powered job recommendations",
            "Filter by budget, category, & duration",
            "Instant notifications for new matches",
            "See match scores before applying",
        ],
    },
    {
        num: "03",
        icon: "📝",
        title: "Submit Winning Proposals",
        desc: "Write tailored proposals with our AI assistant. Set your terms, propose milestones, and explain your approach. Clients see your AI match score too.",
        details: [
            "AI-assisted proposal writing",
            "Custom milestone & timeline suggestions",
            "Attach relevant portfolio pieces",
            "Track proposal status in real-time",
        ],
    },
    {
        num: "04",
        icon: "💰",
        title: "Deliver & Get Paid",
        desc: "Work through milestones, submit deliverables, and get paid securely. Funds are in escrow before you start — so you're always protected. Platform fee: 10% on the first $10K per client, then just 5%.",
        details: [
            "Milestone-based secure payments",
            "Time tracking for hourly contracts",
            "Submit deliverables with one click",
            "Get paid via Stripe or PayPal",
        ],
    },
];

const BENEFITS = [
    {
        icon: "💸",
        title: "Guaranteed Payment",
        desc: "Clients fund escrow before you start. Your work is always protected — no more chasing invoices.",
    },
    {
        icon: "🤖",
        title: "AI Job Matching",
        desc: "Our algorithms find opportunities that match your exact skillset. Spend less time searching, more time earning.",
    },
    {
        icon: "📈",
        title: "Build Your Reputation",
        desc: "Every completed project adds to your rating. Top-rated freelancers get featured and earn more.",
    },
    {
        icon: "🌍",
        title: "Work From Anywhere",
        desc: "Connect with clients worldwide. Set your own hours, choose your projects, and build the career you want.",
    },
    {
        icon: "🛡️",
        title: "Dispute Resolution",
        desc: "If something goes wrong, our resolution team mediates fairly. Your work is valued and protected.",
    },
    {
        icon: "📱",
        title: "Manage On The Go",
        desc: "Track projects, send messages, and submit work from our mobile app. Your office is wherever you are.",
    },
];

const STATS = [
    { value: "$2M+", label: "Paid to Freelancers" },
    { value: "5K+", label: "Active Projects" },
    { value: "4.8★", label: "Avg. Freelancer Rating" },
    { value: "48h", label: "Avg. Payment Speed" },
];

const CATEGORIES = [
    "Web Development", "Mobile Apps", "UI/UX Design", "AI & Machine Learning",
    "Content Writing", "Video Production", "Digital Marketing", "Data Science",
    "Blockchain", "Cloud & DevOps", "Graphic Design", "Virtual Assistance",
];

export default function HowItWorksFreelancersPage() {
    return (
        <main className="bg-brand-surface">
            {/* ── Hero ─────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand-dark-light to-brand-dark pt-32 pb-20">
                <div className="absolute top-[-120px] left-[-80px] w-[400px] h-[400px] rounded-full bg-brand-orange/10 blur-3xl transform-gpu" />
                <div className="absolute bottom-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full bg-brand-orange/5 blur-3xl transform-gpu" />

                <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
                    <span className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-orange bg-brand-orange/10 rounded-full mb-6">
                        For Freelancers
                    </span>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
                        Find Work You <span className="text-brand-orange">Love</span>,
                        <br className="hidden sm:block" />
                        Get Paid Securely
                    </h1>
                    <p className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
                        Build your freelance career on a platform that values your skills. AI-powered matching, guaranteed escrow payments, and tools designed for creators.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="/register"
                            className="px-8 py-4 text-base font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_20px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_28px_rgba(240,138,17,0.55)] transition-all duration-300 hover:-translate-y-0.5"
                        >
                            Create Free Account
                        </a>
                        <a
                            href="/jobs"
                            className="px-8 py-4 text-base font-semibold text-white/80 border border-white/20 rounded-xl hover:bg-white/5 transition-all duration-300"
                        >
                            Browse Open Jobs
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
                            Start Earning in 4 Steps
                        </h2>
                        <p className="mt-4 text-brand-muted text-lg max-w-xl mx-auto">
                            From creating your profile to getting paid — here&apos;s your path to freelance success.
                        </p>
                    </div>

                    <div className="space-y-16">
                        {STEPS.map((step, i) => (
                            <div
                                key={step.num}
                                className={`flex flex-col lg:flex-row items-start gap-8 lg:gap-16 ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
                            >
                                <div className="flex-shrink-0 w-full lg:w-[280px]">
                                    <div className="relative bg-gradient-to-br from-brand-orange/10 to-brand-orange/5 rounded-2xl p-8 text-center">
                                        <span className="absolute top-3 left-4 text-6xl font-black text-brand-orange/10">
                                            {step.num}
                                        </span>
                                        <span className="text-6xl block mb-2">{step.icon}</span>
                                    </div>
                                </div>

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
                            Why Freelancers Love MonkeysWork
                        </h2>
                        <p className="mt-4 text-brand-muted text-lg max-w-xl mx-auto">
                            A platform built with freelancers in mind — fair, transparent, and designed for growth.
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

            {/* ── Categories ───────────────────────────── */}
            <section className="py-20">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-extrabold text-brand-text mb-4">
                            Popular Categories
                        </h2>
                        <p className="text-brand-muted">
                            Find projects in your area of expertise
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        {CATEGORIES.map((cat) => (
                            <a
                                key={cat}
                                href={`/jobs?category=${encodeURIComponent(cat)}`}
                                className="px-5 py-2.5 text-sm font-medium bg-white border border-brand-border/60 rounded-full text-brand-text hover:border-brand-orange hover:text-brand-orange hover:shadow-sm transition-all duration-200"
                            >
                                {cat}
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Earnings example ──────────────────────── */}
            <section className="py-20 bg-white">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-brand-text mb-4">
                            What You Could Earn
                        </h2>
                        <p className="text-brand-muted max-w-lg mx-auto">
                            Freelancers on MonkeysWork set their own rates. Here&apos;s what top earners make in popular categories.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { cat: "Web Dev", range: "$40–120/hr", avg: "$75" },
                            { cat: "UI/UX Design", range: "$35–100/hr", avg: "$65" },
                            { cat: "Mobile Dev", range: "$50–150/hr", avg: "$90" },
                            { cat: "AI/ML", range: "$60–200/hr", avg: "$110" },
                        ].map((e) => (
                            <div key={e.cat} className="bg-brand-surface rounded-xl border border-brand-border/60 p-5 text-center">
                                <div className="text-sm font-semibold text-brand-text mb-1">{e.cat}</div>
                                <div className="text-2xl font-extrabold text-brand-orange">{e.avg}</div>
                                <div className="text-xs text-brand-muted mt-1">{e.range}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── AI-Powered ────────────────────────────── */}
            <section className="py-20 bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white relative overflow-hidden">
                <div className="absolute top-[-100px] right-[-60px] w-[350px] h-[350px] rounded-full bg-purple-500/10 blur-3xl transform-gpu" />
                <div className="absolute bottom-[-80px] left-[-40px] w-[300px] h-[300px] rounded-full bg-brand-orange/10 blur-3xl transform-gpu" />
                <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                    <span className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-purple-300 bg-purple-500/15 rounded-full mb-6 border border-purple-500/25">
                        AI-Powered
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                        Your <span className="text-brand-orange">AI</span> Advantage
                    </h2>
                    <p className="text-white/60 max-w-lg mx-auto mb-8 leading-relaxed">
                        Our AI helps you get matched to the right projects, write better proposals, and earn more — so you can focus on doing great work.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                        {[
                            { icon: "🤖", label: "AI Matching" },
                            { icon: "✍️", label: "Proposal Assistant" },
                            { icon: "📈", label: "Predictive Insights" },
                            { icon: "🔍", label: "Smart Search" },
                        ].map((item) => (
                            <div key={item.label} className="bg-white/5 rounded-xl border border-white/10 p-4">
                                <span className="text-2xl block mb-2">{item.icon}</span>
                                <span className="text-xs font-semibold text-white/70">{item.label}</span>
                            </div>
                        ))}
                    </div>
                    <a
                        href="/ai"
                        className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-[0_4px_20px_rgba(139,92,246,0.35)] transition-all duration-300 hover:-translate-y-0.5"
                    >
                        Explore AI Features
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </a>
                </div>
            </section>

            {/* ── Final CTA ────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand-dark-light to-brand-dark py-24">
                <div className="absolute top-[-100px] left-[-50px] w-[350px] h-[350px] rounded-full bg-brand-orange/8 blur-3xl transform-gpu" />
                <div className="relative mx-auto max-w-3xl px-4 text-center">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                        Your Next Project Is Waiting
                    </h2>
                    <p className="text-lg text-white/60 mb-10 max-w-lg mx-auto">
                        Join a growing community of freelancers earning on their own terms. Create your profile and start getting matched today.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="/register"
                            className="px-10 py-4 text-base font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_20px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_28px_rgba(240,138,17,0.55)] transition-all duration-300 hover:-translate-y-0.5"
                        >
                            Join MonkeysWork — It&apos;s Free
                        </a>
                        <a
                            href="/jobs"
                            className="px-10 py-4 text-base font-semibold text-white/80 border border-white/20 rounded-xl hover:bg-white/5 transition-all duration-300"
                        >
                            Browse Open Jobs
                        </a>
                    </div>
                    <p className="text-xs text-white/30 mt-6">Free forever · No monthly fees · 10% fee drops to 5% after $10K per client</p>
                </div>
            </section>
        </main>
    );
}
