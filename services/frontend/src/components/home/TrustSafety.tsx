import Link from "next/link";

/* ── trust items ────────────────────────────────────── */
const ITEMS = [
    {
        emoji: "🛡️",
        title: "Escrow Protection",
        desc: "Funds are held securely until you approve the work.",
    },
    {
        emoji: "✅",
        title: "Verified Freelancers",
        desc: "Identity, skills, and portfolio verified through AI + human review.",
    },
    {
        emoji: "📊",
        title: "Transparent Ratings",
        desc: "Honest reviews after every contract. No fake profiles.",
    },
    {
        emoji: "🔒",
        title: "Secure Payments",
        desc: "PCI-compliant processing. Multiple payout methods.",
    },
    {
        emoji: "⚖️",
        title: "Fair Dispute Resolution",
        desc: "Dedicated ops team resolves conflicts with evidence-based decisions.",
    },
    {
        emoji: "🌍",
        title: "Global Talent",
        desc: "Work with verified professionals from 100+ countries.",
    },
];

export default function TrustSafety() {
    return (
        <section className="py-20 sm:py-28 bg-brand-dark/[0.02]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-14">
                    <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark">
                        Built on trust
                    </h2>
                    <p className="mt-4 text-brand-muted max-w-xl mx-auto">
                        Every feature is designed to protect both clients and freelancers.
                    </p>
                </div>

                {/* 2×3 grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ITEMS.map((item) => (
                        <div
                            key={item.title}
                            className="bg-white rounded-2xl p-7 border border-brand-border/60 hover:border-brand-orange/20 shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            <span className="text-3xl block mb-4">{item.emoji}</span>
                            <h3 className="text-base font-bold text-brand-dark mb-2">{item.title}</h3>
                            <p className="text-sm text-brand-muted leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-10 text-center">
                    <Link
                        href="/trust-safety"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors"
                    >
                        Learn more about trust &amp; safety
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}
