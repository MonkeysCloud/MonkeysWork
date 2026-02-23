import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getArticleBySlug, getRelatedArticles, getAllArticleSlugs } from "../articles";

/* ── Static params for build ─────────────────────────── */
export async function generateStaticParams() {
    return getAllArticleSlugs().map((slug) => ({ slug }));
}

/* ── Dynamic metadata ────────────────────────────────── */
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const article = getArticleBySlug(slug);
    if (!article) return { title: "Article Not Found" };

    return {
        title: `${article.title} — MonkeysWork Help Center`,
        description: `Learn about ${article.title.toLowerCase()} on MonkeysWork. ${article.category} guide.`,
        alternates: { canonical: `https://monkeysworks.com/help/${slug}` },
    };
}

/* ── Page ─────────────────────────────────────────────── */
export default async function HelpArticlePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const article = getArticleBySlug(slug);
    if (!article) notFound();

    const related = getRelatedArticles(article.category, article.slug);

    return (
        <main className="min-h-screen bg-brand-surface">
            {/* Hero */}
            <section className="bg-gradient-to-br from-brand-dark via-brand-dark-light to-brand-dark pt-32 pb-12">
                <div className="mx-auto max-w-3xl px-4">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm text-white/40 mb-6">
                        <Link href="/help" className="hover:text-white/70 transition-colors">
                            Help Center
                        </Link>
                        <span>/</span>
                        <span className="text-white/60">{article.category}</span>
                    </nav>

                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{article.categoryIcon}</span>
                        <span className="text-xs font-semibold text-brand-orange uppercase tracking-wider">
                            {article.category}
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        {article.title}
                    </h1>
                </div>
            </section>

            {/* Back navigation bar */}
            <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-brand-border/40">
                <div className="mx-auto max-w-3xl px-4 flex items-center justify-between py-3">
                    <Link
                        href="/help"
                        className="flex items-center gap-2 text-sm font-semibold text-brand-text hover:text-brand-orange transition-colors"
                    >
                        <span className="text-lg">←</span> Back to Help Center
                    </Link>
                    <Link
                        href="/help/contact"
                        className="px-4 py-1.5 text-xs font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-lg transition-colors"
                    >
                        Contact Support
                    </Link>
                </div>
            </div>

            {/* Content */}
            <section className="py-12">
                <div className="mx-auto max-w-3xl px-4">
                    <div className="bg-white rounded-2xl border border-brand-border/60 shadow-sm p-8 sm:p-10">
                        <div
                            className="prose prose-lg"
                            dangerouslySetInnerHTML={{ __html: article.content }}
                        />
                    </div>

                    {/* Related articles */}
                    {related.length > 0 && (
                        <div className="mt-10">
                            <h2 className="text-lg font-bold text-brand-text mb-4">
                                More in {article.category}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {related.map((r) => (
                                    <Link
                                        key={r.slug}
                                        href={`/help/${r.slug}`}
                                        className="bg-white rounded-xl border border-brand-border/60 p-4 hover:border-brand-orange/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                                    >
                                        <span className="text-sm font-semibold text-brand-text hover:text-brand-orange transition-colors">
                                            {r.title}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bottom CTA */}
                    <div className="mt-10 bg-gradient-to-br from-brand-dark to-brand-dark-light rounded-2xl p-8 text-center">
                        <h3 className="text-xl font-bold text-white mb-2">
                            Still have questions?
                        </h3>
                        <p className="text-white/60 text-sm mb-5">
                            Our support team is ready to help.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <Link
                                href="/help"
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-all"
                            >
                                ← Help Center
                            </Link>
                            <Link
                                href="/help/contact"
                                className="px-5 py-2.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_2px_10px_rgba(240,138,17,0.3)] transition-all"
                            >
                                Contact Support
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
