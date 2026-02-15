import Link from "next/link";

/* ── mock freelancer data ───────────────────────────── */
const FREELANCERS = [
    {
        id: "1",
        name: "Sofia Martinez",
        headline: "Senior React & Next.js Engineer",
        rating: 4.9,
        reviewCount: 127,
        rate: 85,
        skills: ["React", "TypeScript", "Node.js"],
        avatar: "SM",
        color: "bg-violet-500",
        verified: true,
    },
    {
        id: "2",
        name: "Alex Chen",
        headline: "Full-Stack Developer & AI Specialist",
        rating: 5.0,
        reviewCount: 84,
        rate: 120,
        skills: ["Python", "FastAPI", "ML"],
        avatar: "AC",
        color: "bg-blue-500",
        verified: true,
    },
    {
        id: "3",
        name: "Maya Johnson",
        headline: "Product Designer & Brand Strategist",
        rating: 4.8,
        reviewCount: 203,
        rate: 95,
        skills: ["Figma", "UI/UX", "Branding"],
        avatar: "MJ",
        color: "bg-pink-500",
        verified: true,
    },
    {
        id: "4",
        name: "Raj Patel",
        headline: "DevOps & Cloud Architecture Expert",
        rating: 4.9,
        reviewCount: 156,
        rate: 110,
        skills: ["AWS", "Terraform", "Kubernetes"],
        avatar: "RP",
        color: "bg-emerald-500",
        verified: true,
    },
    {
        id: "5",
        name: "Emma Wilson",
        headline: "Technical Writer & Content Strategist",
        rating: 5.0,
        reviewCount: 91,
        rate: 65,
        skills: ["Copywriting", "SEO", "Docs"],
        avatar: "EW",
        color: "bg-amber-500",
        verified: true,
    },
    {
        id: "6",
        name: "Carlos Rivera",
        headline: "Mobile App Developer (iOS/Android)",
        rating: 4.7,
        reviewCount: 68,
        rate: 90,
        skills: ["Swift", "Kotlin", "Flutter"],
        avatar: "CR",
        color: "bg-cyan-500",
        verified: true,
    },
];

function Stars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <svg
                    key={i}
                    width="14"
                    height="14"
                    viewBox="0 0 20 20"
                    fill={i <= Math.floor(rating) ? "#f08a11" : "none"}
                    stroke="#f08a11"
                    strokeWidth="1.5"
                >
                    <path d="M10 1.5l2.47 5.01L18 7.24l-4 3.9.94 5.49L10 13.88l-4.94 2.75.94-5.49-4-3.9 5.53-.73L10 1.5z" />
                </svg>
            ))}
        </div>
    );
}

export default function TopFreelancers() {
    return (
        <section className="py-20 sm:py-28 bg-brand-dark/[0.02]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-end justify-between mb-10">
                    <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark">
                        Featured freelancers
                    </h2>
                    <Link
                        href="/freelancers"
                        className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors"
                    >
                        Explore freelancers
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {/* horizontal scroll */}
                <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
                    {FREELANCERS.map((f) => (
                        <Link
                            key={f.id}
                            href={`/freelancers/${f.id}`}
                            className="flex-shrink-0 snap-start w-[260px] group bg-white rounded-2xl p-6 border border-brand-border/60 hover:border-brand-orange/30 shadow-sm hover:shadow-[0_8px_32px_rgba(240,138,17,0.1)] transition-all duration-300"
                        >
                            {/* avatar + verified */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-12 h-12 ${f.color} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                                    {f.avatar}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-bold text-brand-dark truncate">{f.name}</span>
                                        {f.verified && (
                                            <svg width="14" height="14" viewBox="0 0 20 20" fill="#f08a11">
                                                <path d="M10 0l2.24 3.76L16.5 2.5l-1.26 4.24L20 8.76l-3.76 2.24L17.5 15.5l-4.24-1.26L11.24 20H8.76l-2.02-5.76L2.5 15.5l1.26-4.26L0 8.76l4.74-2.02L3.5 2.5l4.26 1.26L10 0z" />
                                            </svg>
                                        )}
                                    </div>
                                    <p className="text-xs text-brand-muted truncate">{f.headline}</p>
                                </div>
                            </div>

                            {/* rating */}
                            <div className="flex items-center gap-2 mb-3">
                                <Stars rating={f.rating} />
                                <span className="text-xs font-semibold text-brand-dark">{f.rating}</span>
                                <span className="text-xs text-brand-muted">({f.reviewCount})</span>
                            </div>

                            {/* rate */}
                            <p className="text-lg font-bold text-brand-dark mb-3">
                                ${f.rate}<span className="text-xs font-normal text-brand-muted">/hr</span>
                            </p>

                            {/* skills */}
                            <div className="flex flex-wrap gap-1.5">
                                {f.skills.map((s) => (
                                    <span key={s} className="text-[11px] font-medium text-brand-muted bg-brand-dark/5 px-2 py-0.5 rounded-md">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-6 text-center sm:hidden">
                    <Link href="/freelancers" className="text-sm font-semibold text-brand-orange">
                        Explore freelancers →
                    </Link>
                </div>
            </div>
        </section>
    );
}
