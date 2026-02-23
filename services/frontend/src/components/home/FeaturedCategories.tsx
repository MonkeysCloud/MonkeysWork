import Link from "next/link";

/* ── category data ──────────────────────────────────── */
const CATEGORIES = [
    { name: "Web Development", slug: "web-development", count: 342, icon: "🌐" },
    { name: "Mobile Development", slug: "mobile-development", count: 198, icon: "📱" },
    { name: "UI/UX Design", slug: "ui-ux-design", count: 256, icon: "🎨" },
    { name: "Data Science & AI", slug: "data-science-ai", count: 187, icon: "🤖" },
    { name: "DevOps & Cloud", slug: "devops-cloud", count: 143, icon: "☁️" },
    { name: "Content Writing", slug: "content-writing", count: 312, icon: "✍️" },
    { name: "Marketing", slug: "marketing", count: 224, icon: "📈" },
    { name: "Video & Animation", slug: "video-animation", count: 165, icon: "🎬" },
    { name: "Blockchain", slug: "blockchain", count: 98, icon: "⛓️" },
    { name: "Cybersecurity", slug: "cybersecurity", count: 112, icon: "🔐" },
];

export default function FeaturedCategories() {
    return (
        <section className="py-20 sm:py-28 bg-brand-dark/[0.02]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-end justify-between mb-10">
                    <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark">
                        Explore by category
                    </h2>
                    <Link
                        href="/register"
                        className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors"
                    >
                        Browse all categories
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {/* scrollable cards */}
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
                    {CATEGORIES.map((cat) => (
                        <Link
                            key={cat.slug}
                            href="/register"
                            className="flex-shrink-0 snap-start w-[200px] group bg-white rounded-2xl p-6 border border-brand-border/60 hover:border-brand-orange/30 shadow-sm hover:shadow-[0_8px_32px_rgba(240,138,17,0.1)] transition-all duration-300"
                        >
                            <span className="text-3xl block mb-4">{cat.icon}</span>
                            <h3 className="text-sm font-bold text-brand-dark group-hover:text-brand-orange transition-colors">
                                {cat.name}
                            </h3>
                            <p className="text-xs text-brand-muted mt-1">
                                {cat.count} active jobs
                            </p>
                        </Link>
                    ))}
                </div>

                {/* mobile browse all */}
                <div className="mt-6 text-center sm:hidden">
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-brand-orange"
                    >
                        Browse all categories →
                    </Link>
                </div>
            </div>
        </section>
    );
}
