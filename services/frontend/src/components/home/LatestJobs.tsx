import Link from "next/link";

/* ── mock job data (API-ready structure) ────────────── */
const JOBS = [
    {
        id: "1",
        title: "Full-Stack Engineer for SaaS Dashboard",
        category: "Web Development",
        budgetMin: 5000,
        budgetMax: 12000,
        skills: ["React", "Node.js", "PostgreSQL"],
        postedAgo: "2h ago",
        proposals: 8,
    },
    {
        id: "2",
        title: "Mobile App Redesign (iOS + Android)",
        category: "Mobile Development",
        budgetMin: 8000,
        budgetMax: 15000,
        skills: ["React Native", "Figma", "TypeScript"],
        postedAgo: "4h ago",
        proposals: 12,
    },
    {
        id: "3",
        title: "AI-Powered Chatbot Integration",
        category: "Data Science & AI",
        budgetMin: 3000,
        budgetMax: 7000,
        skills: ["Python", "OpenAI", "FastAPI"],
        postedAgo: "6h ago",
        proposals: 5,
    },
    {
        id: "4",
        title: "Brand Identity & Landing Page Design",
        category: "UI/UX Design",
        budgetMin: 2000,
        budgetMax: 5000,
        skills: ["Figma", "Branding", "Web Design"],
        postedAgo: "8h ago",
        proposals: 19,
    },
];

function formatBudget(min: number, max: number) {
    return `$${(min / 1000).toFixed(0)}k – $${(max / 1000).toFixed(0)}k`;
}

export default function LatestJobs() {
    return (
        <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark">
                            Latest projects looking for talent
                        </h2>
                        <p className="mt-2 text-brand-muted">Fresh opportunities posted today</p>
                    </div>
                    <Link
                        href="/jobs"
                        className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors"
                    >
                        Browse all jobs
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {JOBS.map((job) => (
                        <Link
                            key={job.id}
                            href={`/jobs/${job.id}`}
                            className="group bg-white rounded-2xl p-6 border border-brand-border/60 hover:border-brand-orange/30 shadow-sm hover:shadow-[0_8px_32px_rgba(240,138,17,0.1)] transition-all duration-300 flex flex-col"
                        >
                            {/* category tag */}
                            <span className="self-start text-xs font-semibold text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-full mb-3">
                                {job.category}
                            </span>

                            {/* title */}
                            <h3 className="text-sm font-bold text-brand-dark group-hover:text-brand-orange transition-colors line-clamp-2 mb-3">
                                {job.title}
                            </h3>

                            {/* budget */}
                            <p className="text-lg font-bold text-brand-dark mb-3">
                                {formatBudget(job.budgetMin, job.budgetMax)}
                            </p>

                            {/* skills */}
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {job.skills.map((s) => (
                                    <span key={s} className="text-[11px] font-medium text-brand-muted bg-brand-dark/5 px-2 py-0.5 rounded-md">
                                        {s}
                                    </span>
                                ))}
                            </div>

                            {/* meta */}
                            <div className="mt-auto flex items-center justify-between text-xs text-brand-muted pt-3 border-t border-brand-border/40">
                                <span>{job.postedAgo}</span>
                                <span>{job.proposals} proposals</span>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-8 text-center sm:hidden">
                    <Link href="/jobs" className="text-sm font-semibold text-brand-orange">
                        Browse all jobs →
                    </Link>
                </div>
            </div>
        </section>
    );
}
