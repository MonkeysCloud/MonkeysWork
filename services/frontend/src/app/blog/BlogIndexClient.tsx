"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Tag {
    name: string;
    slug: string;
    post_count?: number;
}

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    cover_image: string | null;
    published_at: string;
    author_name: string;
    author_avatar: string | null;
    tags: string;
    tag_list: Tag[];
}

const PER_PAGE = 9;

export default function BlogIndexClient() {
    const searchParams = useSearchParams();
    const tagFilter = searchParams.get("tag") ?? "";

    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            per_page: String(PER_PAGE),
        });
        if (tagFilter) params.set("tag", tagFilter);
        if (search) params.set("search", search);

        try {
            const res = await fetch(`${API}/blog?${params}`);
            const json = await res.json();
            setPosts(json.data ?? []);
            setTotal(json.meta?.total ?? 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, tagFilter, search]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}/blog/tags`);
                const json = await res.json();
                setTags(json.data ?? []);
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const totalPages = Math.ceil(total / PER_PAGE);

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });

    return (
        <>
            <main className="min-h-screen bg-brand-surface">
                {/* ── Hero ─────────────────────────────────── */}
                <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand-dark-light to-brand-dark py-20 px-4">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-10 left-1/4 w-72 h-72 bg-brand-orange rounded-full blur-3xl" />
                        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-orange-400 rounded-full blur-3xl" />
                    </div>
                    <div className="relative max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Blog & News
                        </h1>
                        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                            Insights on freelancing, hiring, AI-powered project management, and
                            the latest from MonkeysWork.
                        </p>
                        <div className="mt-8 max-w-md mx-auto">
                            <input
                                type="text"
                                placeholder="Search articles…"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full px-5 py-3 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 text-sm"
                            />
                        </div>
                    </div>
                </section>

                {/* ── Tag Pills ────────────────────────────── */}
                {tags.length > 0 && (
                    <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-10">
                        <div className="flex flex-wrap gap-2 justify-center">
                            <Link
                                href="/blog"
                                className={`px-4 py-2 text-sm font-medium rounded-full shadow-sm transition-all ${
                                    !tagFilter
                                        ? "bg-brand-orange text-white shadow-brand-orange/30"
                                        : "bg-white text-gray-700 hover:shadow-md"
                                }`}
                            >
                                All
                            </Link>
                            {tags.map((tag) => (
                                <Link
                                    key={tag.slug}
                                    href={`/blog?tag=${tag.slug}`}
                                    className={`px-4 py-2 text-sm font-medium rounded-full shadow-sm transition-all ${
                                        tagFilter === tag.slug
                                            ? "bg-brand-orange text-white shadow-brand-orange/30"
                                            : "bg-white text-gray-700 hover:shadow-md"
                                    }`}
                                >
                                    {tag.name}
                                    {tag.post_count && (
                                        <span className="ml-1.5 text-xs opacity-60">
                                            ({tag.post_count})
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Post Grid ────────────────────────────── */}
                <section className="max-w-6xl mx-auto px-4 py-12">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse"
                                >
                                    <div className="h-48 bg-gray-200" />
                                    <div className="p-6 space-y-3">
                                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                                        <div className="h-3 bg-gray-100 rounded w-full" />
                                        <div className="h-3 bg-gray-100 rounded w-2/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-5xl mb-4">📝</div>
                            <h3 className="text-lg font-semibold text-gray-700">
                                No articles yet
                            </h3>
                            <p className="text-gray-400 mt-1">
                                Check back soon for new content!
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Featured (first post) */}
                            {page === 1 && posts.length > 0 && !tagFilter && (
                                <Link
                                    href={`/blog/${posts[0].slug}`}
                                    className="block mb-12 group"
                                >
                                    <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                                        <div className="grid md:grid-cols-2">
                                            <div className="h-64 md:h-auto bg-gradient-to-br from-brand-dark to-brand-dark-light">
                                                {posts[0].cover_image ? (
                                                    <img
                                                        src={posts[0].cover_image}
                                                        alt={posts[0].title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-6xl opacity-30">
                                                        📰
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-8 flex flex-col justify-center">
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {posts[0].tag_list?.map((t) => (
                                                        <span
                                                            key={t.slug}
                                                            className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-brand-orange-light text-brand-orange"
                                                        >
                                                            {t.name}
                                                        </span>
                                                    ))}
                                                </div>
                                                <h2 className="text-2xl font-bold text-brand-text group-hover:text-brand-orange transition-colors mb-3">
                                                    {posts[0].title}
                                                </h2>
                                                <p className="text-gray-500 line-clamp-3 mb-4">
                                                    {posts[0].excerpt}
                                                </p>
                                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                                    <span>{posts[0].author_name}</span>
                                                    <span>·</span>
                                                    <span>
                                                        {formatDate(posts[0].published_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {/* Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {(page === 1 && !tagFilter
                                    ? posts.slice(1)
                                    : posts
                                ).map((post) => (
                                    <Link
                                        key={post.id}
                                        href={`/blog/${post.slug}`}
                                        className="group"
                                    >
                                        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                                            <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                                                {post.cover_image ? (
                                                    <img
                                                        src={post.cover_image}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-4xl opacity-20">
                                                        📄
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-6 flex-1 flex flex-col">
                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    {post.tag_list?.map((t) => (
                                                        <span
                                                            key={t.slug}
                                                            className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-brand-orange-light text-brand-orange"
                                                        >
                                                            {t.name}
                                                        </span>
                                                    ))}
                                                </div>
                                                <h3 className="text-lg font-bold text-brand-text group-hover:text-brand-orange transition-colors mb-2 line-clamp-2">
                                                    {post.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 line-clamp-2 flex-1">
                                                    {post.excerpt}
                                                </p>
                                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400">
                                                    {post.author_avatar && (
                                                        <img
                                                            src={post.author_avatar}
                                                            alt=""
                                                            className="w-5 h-5 rounded-full"
                                                        />
                                                    )}
                                                    <span>{post.author_name}</span>
                                                    <span>·</span>
                                                    <span>
                                                        {formatDate(post.published_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </article>
                                    </Link>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center gap-2 mt-12">
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setPage(i + 1)}
                                            className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                                                page === i + 1
                                                    ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/30"
                                                    : "bg-white text-gray-600 hover:shadow-md"
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </section>
            </main>
        </>
    );
}
