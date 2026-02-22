"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import StatusBadge from "@/components/admin/StatusBadge";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    cover_image: string | null;
    status: string;
    author_name: string;
    tags: string;
    published_at: string | null;
    created_at: string;
    [key: string]: unknown;
}

const PER_PAGE = 20;

export default function AdminBlogPage() {
    const { token } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
    const [tagFilter, setTagFilter] = useState(searchParams.get("tag") ?? "");
    const [search, setSearch] = useState("");

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            per_page: String(PER_PAGE),
        });
        if (statusFilter) params.set("status", statusFilter);
        if (tagFilter) params.set("tag", tagFilter);
        if (search) params.set("search", search);

        try {
            const res = await fetch(`${API}/admin/blog?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setPosts(json.data ?? []);
            setTotal(json.meta?.total ?? 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token, page, statusFilter, tagFilter, search]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this post?")) return;
        await fetch(`${API}/admin/blog/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        fetchPosts();
    };

    const columns: Column<BlogPost>[] = [
        {
            key: "title",
            label: "Title",
            render: (p) => (
                <div className="flex items-center gap-3">
                    {p.cover_image && (
                        <img
                            src={p.cover_image}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover"
                        />
                    )}
                    <div>
                        <span className="font-semibold text-brand-text">{p.title}</span>
                        {p.excerpt && (
                            <div className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-xs">
                                {p.excerpt}
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        { key: "author_name", label: "Author" },
        {
            key: "status",
            label: "Status",
            render: (p) => <StatusBadge status={p.status} />,
        },
        {
            key: "tags",
            label: "Tags",
            render: (p) =>
                p.tags ? (
                    <div className="flex flex-wrap gap-1">
                        {p.tags.split(", ").map((t) => (
                            <span
                                key={t}
                                className="px-2 py-0.5 text-xs font-medium rounded-full bg-brand-orange-light text-brand-orange"
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-gray-300">—</span>
                ),
        },
        {
            key: "published_at",
            label: "Published",
            render: (p) =>
                p.published_at
                    ? new Date(p.published_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                      })
                    : <span className="text-gray-300">Draft</span>,
        },
        {
            key: "actions",
            label: "",
            render: (p) => (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => router.push(`/dashboard/admin/blog/${p.id}`)}
                        className="text-xs font-medium text-brand-orange hover:underline"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs font-medium text-red-500 hover:underline"
                    >
                        Delete
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text">Blog</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage blog posts and news
                    </p>
                </div>
                <button
                    onClick={() => router.push("/dashboard/admin/blog/new")}
                    className="px-4 py-2 text-sm font-semibold text-white bg-brand-orange rounded-lg hover:bg-brand-orange-hover transition-colors"
                >
                    + New Post
                </button>
            </div>

            <div className="flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Search posts…"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30 w-64"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                </select>
            </div>

            <AdminTable
                columns={columns}
                data={posts}
                loading={loading}
                page={page}
                totalPages={Math.ceil(total / PER_PAGE)}
                total={total}
                onPageChange={setPage}
                onRowClick={(p) => router.push(`/dashboard/admin/blog/${p.id}`)}
                emptyMessage="No blog posts yet. Click + New Post to create one."
            />
        </div>
    );
}
