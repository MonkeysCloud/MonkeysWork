"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

type Category = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    job_count: number;
    parent_id: string | null;
};

const FALLBACK: Category[] = [
    { id: "1", name: "Web Development", slug: "web-development", description: "Build responsive websites, web apps, and APIs", icon: "code", job_count: 342, parent_id: null },
    { id: "2", name: "Mobile Development", slug: "mobile-development", description: "iOS, Android, and cross-platform mobile apps", icon: "smartphone", job_count: 198, parent_id: null },
    { id: "3", name: "UI/UX Design", slug: "ui-ux-design", description: "User interfaces, prototypes, and design systems", icon: "palette", job_count: 256, parent_id: null },
    { id: "4", name: "Data Science & AI", slug: "data-science-ai", description: "Machine learning, analytics, and AI solutions", icon: "cpu", job_count: 187, parent_id: null },
    { id: "5", name: "DevOps & Cloud", slug: "devops-cloud", description: "CI/CD, AWS, GCP, and infrastructure automation", icon: "cloud", job_count: 143, parent_id: null },
    { id: "6", name: "Content Writing", slug: "content-writing", description: "Blog posts, copywriting, and technical writing", icon: "pen-tool", job_count: 312, parent_id: null },
    { id: "7", name: "Marketing", slug: "marketing", description: "SEO, social media, and growth strategies", icon: "trending-up", job_count: 224, parent_id: null },
    { id: "8", name: "Video & Animation", slug: "video-animation", description: "Motion graphics, video editing, and 3D", icon: "film", job_count: 165, parent_id: null },
    { id: "9", name: "Blockchain", slug: "blockchain", description: "Smart contracts, DeFi, and Web3 development", icon: "link", job_count: 98, parent_id: null },
    { id: "10", name: "Cybersecurity", slug: "cybersecurity", description: "Penetration testing, audits, and security ops", icon: "shield", job_count: 112, parent_id: null },
];

/* Map DB icon names → emojis */
const ICON_MAP: Record<string, string> = {
    "headphones": "🎧", "palette": "🎨", "code": "💻", "pen-tool": "✍️",
    "dollar-sign": "💰", "briefcase": "💼", "trending-up": "📈", "shield": "🔐",
    "cpu": "🤖", "cloud": "☁️", "smartphone": "📱", "film": "🎬",
    "link": "⛓️", "globe": "🌐", "server": "🖥️", "database": "🗄️",
    "music": "🎵", "camera": "📷", "book": "📚", "tool": "🔧",
    "heart": "❤️", "star": "⭐", "zap": "⚡", "award": "🏆",
    "users": "👥", "settings": "⚙️", "truck": "🚚", "home": "🏠",
    "box": "📦", "layers": "📐", "bar-chart": "📊", "edit": "📝",
};

function iconEmoji(raw: string | null): string {
    if (!raw) return "📂";
    if (ICON_MAP[raw]) return ICON_MAP[raw];
    // If it's already an emoji (starts with non-ASCII), return as-is
    if (raw.codePointAt(0)! > 127) return raw;
    return "📂";
}

export default function CategoriesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>(FALLBACK);
    const [loading, setLoading] = useState(true);

    // Redirect authenticated users to dashboard jobs browse
    useEffect(() => {
        if (user) {
            router.replace("/dashboard/jobs");
        }
    }, [user, router]);

    useEffect(() => {
        fetch(`${API}/categories`)
            .then((r) => r.json())
            .then((j) => {
                if (j.data?.length > 0) setCategories(j.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (user) return null;

    const topCategories = categories.filter((c) => !c.parent_id);
    const totalJobs = topCategories.reduce((sum, c) => sum + (Number(c.job_count) || 0), 0);

    return (
        <main className="min-h-screen bg-white">
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-gray-900 to-brand-dark pt-32 pb-20 sm:pt-40 sm:pb-28">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/3 w-96 h-96 bg-brand-orange/8 rounded-full blur-3xl transform-gpu" />
                    <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl transform-gpu" />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm font-medium text-white/80 mb-6">
                        <span className="text-lg">🏷️</span>
                        {topCategories.length}+ Professional Categories
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6">
                        Find the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-amber-400">perfect talent</span>
                        <br className="hidden sm:block" />
                        for every project
                    </h1>

                    <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10">
                        Browse our curated categories to find skilled freelancers across 
                        {totalJobs > 0 ? ` ${totalJobs.toLocaleString()}+` : ""} active opportunities.
                    </p>

                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <Link
                            href="/register"
                            className="px-8 py-3.5 text-sm font-bold text-white bg-brand-orange rounded-xl hover:bg-brand-orange/90 shadow-lg shadow-brand-orange/25 hover:shadow-brand-orange/40 transition-all duration-200"
                        >
                            Get Started Free →
                        </Link>
                        <Link
                            href="/how-it-works"
                            className="px-6 py-3.5 text-sm font-semibold text-white/80 border border-white/20 rounded-xl hover:bg-white/5 transition-all"
                        >
                            How it works
                        </Link>
                    </div>
                </div>
            </section>

            {/* Categories Grid */}
            <section className="py-20 sm:py-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-3">
                            Browse by category
                        </h2>
                        <p className="text-brand-muted max-w-xl mx-auto">
                            Each category is packed with vetted professionals ready to bring your project to life.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="flex items-center gap-3 text-brand-muted">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Loading categories...
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {topCategories.map((cat) => (
                                <Link
                                    key={cat.slug}
                                    href="/register"
                                    className="group bg-white rounded-2xl border-2 border-brand-border/60 p-6 hover:border-brand-orange/30 hover:shadow-[0_8px_32px_rgba(240,138,17,0.1)] transition-all duration-300"
                                >
                                    <div className="flex items-start gap-4">
                                        <span className="text-3xl flex-shrink-0 mt-0.5">
                                            {iconEmoji(cat.icon)}
                                        </span>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-brand-dark group-hover:text-brand-orange transition-colors mb-1">
                                                {cat.name}
                                            </h3>
                                            {cat.description && (
                                                <p className="text-xs text-brand-muted line-clamp-2 mb-2">
                                                    {cat.description}
                                                </p>
                                            )}
                                            <span className="text-[11px] font-semibold text-brand-orange/80">
                                                {Number(cat.job_count) || 0} active jobs →
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-gradient-to-br from-brand-orange/5 via-white to-amber-50">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
                    <span className="text-5xl mb-6 block">🚀</span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4">
                        Ready to start?
                    </h2>
                    <p className="text-brand-muted text-lg mb-8 max-w-xl mx-auto">
                        Join thousands of businesses and freelancers already working together on MonkeysWorks.
                    </p>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <Link
                            href="/register"
                            className="px-8 py-3.5 text-sm font-bold text-white bg-brand-orange rounded-xl hover:bg-brand-orange/90 shadow-lg shadow-brand-orange/25 transition-all"
                        >
                            Create Free Account
                        </Link>
                        <Link
                            href="/jobs"
                            className="px-6 py-3.5 text-sm font-semibold text-brand-dark border border-brand-border rounded-xl hover:border-brand-orange/40 transition-all"
                        >
                            Browse Jobs
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
