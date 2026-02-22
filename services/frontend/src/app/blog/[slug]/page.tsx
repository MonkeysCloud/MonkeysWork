"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Tag {
    id: string;
    name: string;
    slug: string;
}

interface RelatedPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    cover_image: string | null;
    published_at: string;
    author_name: string;
}

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    cover_image: string | null;
    published_at: string;
    author_name: string;
    author_avatar: string | null;
    meta_title: string | null;
    meta_description: string | null;
    tags: Tag[];
    related: RelatedPost[];
}

export default function BlogArticlePage() {
    const params = useParams();
    const slug = params?.slug as string;

    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
        (async () => {
            try {
                const res = await fetch(`${API}/blog/${slug}`);
                if (!res.ok) return;
                const json = await res.json();
                setPost(json.data ?? null);

                // Set page title and OG meta dynamically
                if (json.data) {
                    document.title = json.data.meta_title || `${json.data.title} — MonkeysWork Blog`;

                    // OG meta tags
                    const setMeta = (prop: string, content: string) => {
                        let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement;
                        if (!el) {
                            el = document.createElement("meta");
                            el.setAttribute("property", prop);
                            document.head.appendChild(el);
                        }
                        el.content = content;
                    };
                    const setName = (name: string, content: string) => {
                        let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
                        if (!el) {
                            el = document.createElement("meta");
                            el.setAttribute("name", name);
                            document.head.appendChild(el);
                        }
                        el.content = content;
                    };

                    const d = json.data;
                    setMeta("og:title", d.meta_title || d.title);
                    setMeta("og:description", d.meta_description || d.excerpt || "");
                    setMeta("og:type", "article");
                    setMeta("og:site_name", "MonkeysWork");
                    if (d.cover_image) {
                        setMeta("og:image", d.cover_image);
                        setName("twitter:image", d.cover_image);
                    }
                    setName("twitter:card", "summary_large_image");
                    setName("twitter:title", d.meta_title || d.title);
                    setName("twitter:description", d.meta_description || d.excerpt || "");
                    setName("description", d.meta_description || d.excerpt || "");

                    // JSON-LD structured data
                    const jsonLd = {
                        "@context": "https://schema.org",
                        "@type": "Article",
                        headline: d.title,
                        description: d.excerpt || "",
                        image: d.cover_image || undefined,
                        datePublished: d.published_at,
                        author: {
                            "@type": "Person",
                            name: d.author_name,
                        },
                        publisher: {
                            "@type": "Organization",
                            name: "MonkeysWork",
                        },
                    };
                    let script = document.querySelector('script[type="application/ld+json"]');
                    if (!script) {
                        script = document.createElement("script");
                        script.setAttribute("type", "application/ld+json");
                        document.head.appendChild(script);
                    }
                    script.textContent = JSON.stringify(jsonLd);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });

    // Process content to embed YouTube URLs
    const processContent = (html: string) => {
        return html.replace(
            /(?:<p>)?(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)[^\s<]*)(?:<\/p>)?/g,
            (_match, _url, videoId) =>
                `<div class="my-6 aspect-video rounded-xl overflow-hidden shadow-lg"><iframe src="https://www.youtube.com/embed/${videoId}" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
        );
    };

    if (loading) {
        return (
            <>
                <main className="min-h-screen bg-brand-surface">
                    <div className="max-w-3xl mx-auto px-4 py-20">
                        <div className="animate-pulse space-y-6">
                            <div className="h-8 bg-gray-200 rounded w-3/4" />
                            <div className="h-4 bg-gray-100 rounded w-1/2" />
                            <div className="h-64 bg-gray-200 rounded-xl" />
                            <div className="space-y-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-4 bg-gray-100 rounded" />
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
        </>
        );
    }

    if (!post) {
        return (
            <>
                <main className="min-h-screen bg-brand-surface flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🔍</div>
                        <h1 className="text-2xl font-bold text-brand-text mb-2">
                            Article Not Found
                        </h1>
                        <p className="text-gray-500 mb-6">
                            This post may have been removed or doesn&apos;t exist.
                        </p>
                        <Link
                            href="/blog"
                            className="px-6 py-3 bg-brand-orange text-white font-semibold rounded-xl hover:bg-brand-orange-hover transition-colors"
                        >
                            Browse All Posts
                        </Link>
                    </div>
                </main>
        </>
        );
    }

    return (
        <>
            <main className="min-h-screen bg-brand-surface">
                {/* ── Cover Hero ──────────────────────────── */}
                {post.cover_image && (
                    <div className="relative h-[400px] md:h-[500px] overflow-hidden">
                        <img
                            src={post.cover_image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-3xl mx-auto">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {post.tags.map((tag) => (
                                    <Link
                                        key={tag.slug}
                                        href={`/blog?tag=${tag.slug}`}
                                        className="px-3 py-1 text-xs font-semibold rounded-full bg-brand-orange text-white hover:bg-brand-orange-hover transition-colors"
                                    >
                                        {tag.name}
                                    </Link>
                                ))}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                                {post.title}
                            </h1>
                            <div className="flex items-center gap-3 text-white/80 text-sm">
                                {post.author_avatar && (
                                    <img
                                        src={post.author_avatar}
                                        alt={post.author_name}
                                        className="w-8 h-8 rounded-full border-2 border-white/30"
                                    />
                                )}
                                <span className="font-medium">{post.author_name}</span>
                                <span>·</span>
                                <time>{formatDate(post.published_at)}</time>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Article Content ──────────────────────── */}
                <article className="max-w-3xl mx-auto px-4 py-12">
                    {/* Title section (when no cover image) */}
                    {!post.cover_image && (
                        <header className="mb-10">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {post.tags.map((tag) => (
                                    <Link
                                        key={tag.slug}
                                        href={`/blog?tag=${tag.slug}`}
                                        className="px-3 py-1 text-xs font-semibold rounded-full bg-brand-orange-light text-brand-orange hover:bg-brand-orange hover:text-white transition-colors"
                                    >
                                        {tag.name}
                                    </Link>
                                ))}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">
                                {post.title}
                            </h1>
                            <div className="flex items-center gap-3 text-gray-500 text-sm">
                                {post.author_avatar && (
                                    <img
                                        src={post.author_avatar}
                                        alt={post.author_name}
                                        className="w-8 h-8 rounded-full"
                                    />
                                )}
                                <span className="font-medium text-brand-text">
                                    {post.author_name}
                                </span>
                                <span>·</span>
                                <time>{formatDate(post.published_at)}</time>
                            </div>
                        </header>
                    )}

                    {/* Content */}
                    <div
                        className="prose prose-lg prose-gray max-w-none
                            prose-headings:text-brand-text prose-headings:font-bold
                            prose-a:text-brand-orange prose-a:no-underline hover:prose-a:underline
                            prose-img:rounded-xl prose-img:shadow-lg
                            prose-blockquote:border-brand-orange prose-blockquote:bg-brand-orange-light/30 prose-blockquote:rounded-r-xl prose-blockquote:py-1
                            prose-code:text-brand-orange prose-code:bg-brand-orange-light prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                            prose-pre:bg-brand-dark prose-pre:rounded-xl prose-pre:shadow-lg"
                        dangerouslySetInnerHTML={{
                            __html: processContent(post.content),
                        }}
                    />

                    {/* Share */}
                    <div className="mt-12 pt-8 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 mb-3">
                            Share this article
                        </h3>
                        <div className="flex gap-3">
                            <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://monkeysworks.com/blog/${post.slug}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                𝕏 Twitter
                            </a>
                            <a
                                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://monkeysworks.com/blog/${post.slug}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                LinkedIn
                            </a>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(
                                        `https://monkeysworks.com/blog/${post.slug}`
                                    );
                                }}
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                📋 Copy Link
                            </button>
                        </div>
                    </div>
                </article>

                {/* ── Related Posts ─────────────────────────── */}
                {post.related && post.related.length > 0 && (
                    <section className="max-w-6xl mx-auto px-4 pb-16">
                        <h2 className="text-xl font-bold text-brand-text mb-6">
                            Related Articles
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {post.related.map((r) => (
                                <Link
                                    key={r.id}
                                    href={`/blog/${r.slug}`}
                                    className="group"
                                >
                                    <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                                        <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                                            {r.cover_image ? (
                                                <img
                                                    src={r.cover_image}
                                                    alt={r.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-3xl opacity-20">
                                                    📄
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-brand-text group-hover:text-brand-orange transition-colors line-clamp-2 mb-1">
                                                {r.title}
                                            </h3>
                                            <p className="text-xs text-gray-400">
                                                {formatDate(r.published_at)}
                                            </p>
                                        </div>
                                    </article>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </>
    );
}
