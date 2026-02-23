import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Help Center — MonkeysWork Support",
    description:
        "Get help with MonkeysWork. Browse guides for clients and freelancers, learn how to use the dashboard, manage contracts, and contact our support team.",
    alternates: { canonical: "https://monkeysworks.com/help" },
};

/* ── Help categories ─────────────────────────────────── */
const CATEGORIES = [
    {
        icon: "🚀",
        title: "Getting Started",
        desc: "New to MonkeysWork? Start here.",
        articles: [
            { title: "Creating your account", slug: "creating-account" },
            { title: "Setting up your profile", slug: "profile-setup" },
            { title: "Choosing your role: Client vs Freelancer", slug: "choose-role" },
            { title: "Verifying your identity", slug: "identity-verification" },
        ],
    },
    {
        icon: "📋",
        title: "For Clients — Posting & Hiring",
        desc: "Post jobs, review proposals, and hire talent.",
        articles: [
            { title: "How to post a job", slug: "post-job" },
            { title: "Understanding AI-matched proposals", slug: "ai-matching" },
            { title: "Reviewing and shortlisting freelancers", slug: "reviewing-proposals" },
            { title: "Creating a contract & funding escrow", slug: "contracts-escrow" },
            { title: "Approving milestones & releasing payment", slug: "milestone-approval" },
        ],
    },
    {
        icon: "💼",
        title: "For Freelancers — Finding Work",
        desc: "Find projects, submit proposals, deliver work.",
        articles: [
            { title: "Browsing and filtering jobs", slug: "browse-jobs" },
            { title: "Writing a winning proposal", slug: "writing-proposals" },
            { title: "Using the AI proposal assistant", slug: "ai-proposal-assistant" },
            { title: "Submitting deliverables", slug: "submit-deliverables" },
            { title: "Getting paid: Stripe & PayPal", slug: "getting-paid" },
        ],
    },
    {
        icon: "📊",
        title: "Dashboard & Project Management",
        desc: "Navigate your dashboard and manage projects.",
        articles: [
            { title: "Dashboard overview", slug: "dashboard-overview" },
            { title: "Managing contracts & milestones", slug: "manage-contracts" },
            { title: "Time tracking for hourly contracts", slug: "time-tracking" },
            { title: "Messaging & file sharing", slug: "messaging" },
            { title: "Notifications & preferences", slug: "notifications" },
            { title: "Viewing stats & analytics", slug: "stats-analytics" },
        ],
    },
    {
        icon: "💰",
        title: "Payments & Billing",
        desc: "Escrow, invoices, payouts, and fees.",
        articles: [
            { title: "How escrow protection works", slug: "escrow-explained" },
            { title: "Payment methods: Stripe & PayPal", slug: "payment-methods" },
            { title: "Understanding platform fees", slug: "platform-fees" },
            { title: "Invoices & transaction history", slug: "invoices" },
            { title: "Requesting a payout", slug: "payouts" },
        ],
    },
    {
        icon: "🛡️",
        title: "Trust & Safety",
        desc: "Disputes, fraud protection, and policies.",
        articles: [
            { title: "How disputes work", slug: "disputes" },
            { title: "AI fraud detection explained", slug: "fraud-detection" },
            { title: "Reporting a user", slug: "reporting" },
            { title: "Community guidelines", slug: "community-guidelines" },
            { title: "Data privacy & security", slug: "privacy-security" },
        ],
    },
    {
        icon: "📱",
        title: "Mobile App",
        desc: "Use MonkeysWork on iOS and Android.",
        articles: [
            { title: "Downloading the mobile app", slug: "download-app" },
            { title: "Mobile dashboard features", slug: "mobile-dashboard" },
            { title: "Push notifications setup", slug: "push-notifications" },
            { title: "Managing projects on mobile", slug: "mobile-projects" },
        ],
    },
    {
        icon: "⚙️",
        title: "Account & Settings",
        desc: "Profile, security, and account management.",
        articles: [
            { title: "Editing your profile", slug: "edit-profile" },
            { title: "Changing your password", slug: "change-password" },
            { title: "Two-factor authentication", slug: "2fa" },
            { title: "Email & notification preferences", slug: "email-preferences" },
            { title: "Deleting your account", slug: "delete-account" },
        ],
    },
];

const FAQ = [
    {
        q: "Is MonkeysWork free to use?",
        a: "Yes! Creating an account and posting jobs is completely free. We only charge a small platform fee when a contract is completed.",
    },
    {
        q: "How does escrow protection work?",
        a: "When a contract starts, the client funds the milestone into escrow. The money is held securely by MonkeysWork and only released to the freelancer when the client approves the deliverable.",
    },
    {
        q: "What payment methods are supported?",
        a: "We support Stripe (credit/debit cards) and PayPal for both paying freelancers and receiving payouts.",
    },
    {
        q: "How does AI matching work?",
        a: "Our AI analyzes the job requirements, freelancer skills, past ratings, delivery speed, and portfolio to rank proposals by fit. Clients see a match score for each proposal.",
    },
    {
        q: "What if I have a dispute with a client or freelancer?",
        a: "You can open a dispute directly from the contract page. Our support team reviews the evidence from both sides and mediates a fair resolution.",
    },
    {
        q: "Is there a mobile app?",
        a: "Yes! MonkeysWork is available on iOS and Android. You can manage projects, send messages, review deliverables, and track time on the go.",
    },
];

export default function HelpCenterPage() {
    return (
        <main className="min-h-screen bg-brand-surface">
            {/* ── Hero ────────────────────────────────── */}
            <section className="bg-gradient-to-br from-brand-dark via-brand-dark-light to-brand-dark pt-32 pb-16">
                <div className="mx-auto max-w-4xl px-4 text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                        How can we <span className="text-brand-orange">help</span>?
                    </h1>
                    <p className="mt-4 text-lg text-white/60 max-w-xl mx-auto">
                        Browse our guides or contact support. We&apos;re here to help you get the most out of MonkeysWork.
                    </p>

                    {/* Quick links */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="#categories"
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-all"
                        >
                            📚 Browse Guides
                        </Link>
                        <Link
                            href="#faq"
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-all"
                        >
                            ❓ FAQ
                        </Link>
                        <Link
                            href="/help/contact"
                            className="px-5 py-2.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_2px_10px_rgba(240,138,17,0.3)] transition-all"
                        >
                            ✉️ Contact Support
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Categories grid ─────────────────────── */}
            <section id="categories" className="py-16">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {CATEGORIES.map((cat) => (
                            <div
                                key={cat.title}
                                className="bg-white rounded-2xl border border-brand-border/60 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                            >
                                <span className="text-3xl block mb-3">{cat.icon}</span>
                                <h2 className="text-lg font-bold text-brand-text mb-1">{cat.title}</h2>
                                <p className="text-xs text-brand-muted mb-4">{cat.desc}</p>
                                <ul className="space-y-2">
                                    {cat.articles.map((a) => (
                                        <li key={a.slug}>
                                            <Link
                                                href={`/help/${a.slug}`}
                                                className="text-sm text-brand-muted hover:text-brand-orange transition-colors"
                                            >
                                                → {a.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FAQ ──────────────────────────────────── */}
            <section id="faq" className="py-16 bg-white">
                <div className="mx-auto max-w-3xl px-4 sm:px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-brand-text">
                            Frequently Asked Questions
                        </h2>
                        <p className="mt-3 text-brand-muted">
                            Quick answers to the most common questions.
                        </p>
                    </div>
                    <div className="space-y-4">
                        {FAQ.map((item) => (
                            <details
                                key={item.q}
                                className="group bg-brand-surface border border-brand-border/60 rounded-xl overflow-hidden"
                            >
                                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-brand-text font-semibold hover:text-brand-orange transition-colors">
                                    {item.q}
                                    <span className="text-brand-muted group-open:rotate-180 transition-transform text-lg ml-4">
                                        ▼
                                    </span>
                                </summary>
                                <div className="px-6 pb-4 text-sm text-brand-muted leading-relaxed">
                                    {item.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Contact CTA ─────────────────────────── */}
            <section className="py-16">
                <div className="mx-auto max-w-2xl px-4 text-center">
                    <div className="bg-gradient-to-br from-brand-dark to-brand-dark-light rounded-2xl p-10">
                        <h2 className="text-2xl font-bold text-white mb-3">
                            Still need help?
                        </h2>
                        <p className="text-white/60 mb-6 text-sm">
                            Our support team is ready to assist you. Submit a ticket and we&apos;ll respond within 24 hours.
                        </p>
                        <Link
                            href="/help/contact"
                            className="inline-block px-8 py-3.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_16px_rgba(240,138,17,0.35)] hover:shadow-[0_6px_24px_rgba(240,138,17,0.5)] transition-all duration-300 hover:-translate-y-0.5"
                        >
                            Contact Support
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
