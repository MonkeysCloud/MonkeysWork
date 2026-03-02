"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RichTextEditor from "@/components/RichTextEditor";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Tag {
    id: string;
    name: string;
    slug: string;
}

export default function BlogEditorPage() {
    const { token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const postId = params?.id as string | undefined;
    const isNew = !postId;

    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [content, setContent] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
    const [metaTitle, setMetaTitle] = useState("");
    const [metaDescription, setMetaDescription] = useState("");
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [newTagName, setNewTagName] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(!isNew);

    // Promote modal state
    const [showPromote, setShowPromote] = useState(false);
    const [promoteAudience, setPromoteAudience] = useState<"freelancers" | "clients" | "all">("all");
    const [promoteCounts, setPromoteCounts] = useState<{ freelancers: number; clients: number; all: number } | null>(null);
    const [promoting, setPromoting] = useState(false);
    const [promoteResult, setPromoteResult] = useState<{ sent: number; failed: number } | null>(null);

    // Auto-generate slug from date + title
    useEffect(() => {
        if (isNew && title) {
            const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            const titleSlug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
                .slice(0, 180);
            setSlug(`${date}-${titleSlug}`);
        }
    }, [title, isNew]);

    // Fetch tags
    const fetchTags = useCallback(async () => {
        try {
            const res = await fetch(`${API}/admin/blog/tags`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setAllTags(json.data ?? []);
        } catch (e) {
            console.error(e);
        }
    }, [token]);

    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    // Fetch post for editing
    useEffect(() => {
        if (!postId) return;
        (async () => {
            try {
                const res = await fetch(`${API}/admin/blog/${postId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                const p = json.data;
                if (p) {
                    setTitle(p.title ?? "");
                    setSlug(p.slug ?? "");
                    setExcerpt(p.excerpt ?? "");
                    setContent(p.content ?? "");
                    setCoverImage(p.cover_image ?? "");
                    setStatus(p.status ?? "draft");
                    setMetaTitle(p.meta_title ?? "");
                    setMetaDescription(p.meta_description ?? "");
                    setSelectedTagIds((p.tags ?? []).map((t: Tag) => t.id));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [postId, token]);

    const handleSave = async (publishNow = false) => {
        setSaving(true);
        try {
            const body = {
                title,
                slug,
                excerpt,
                content,
                cover_image: coverImage || null,
                status: publishNow ? "published" : status,
                meta_title: metaTitle || null,
                meta_description: metaDescription || null,
                tag_ids: selectedTagIds,
            };

            const url = isNew ? `${API}/admin/blog` : `${API}/admin/blog/${postId}`;
            const method = isNew ? "POST" : "PUT";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                router.push("/dashboard/admin/blog");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        try {
            const res = await fetch(`${API}/admin/blog/tags`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: newTagName.trim() }),
            });
            const json = await res.json();
            if (json.data) {
                setAllTags((prev) => [...prev, json.data]);
                setSelectedTagIds((prev) => [...prev, json.data.id]);
                setNewTagName("");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("image", file);
            const res = await fetch(`${API}/admin/blog/upload-image`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const json = await res.json();
            if (json.data?.url) {
                // Build full URL from API base
                const apiBase = API.replace(/\/api\/v1$/, "");
                setCoverImage(`${apiBase}${json.data.url}`);
            }
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const toggleTag = (tagId: string) => {
        setSelectedTagIds((prev) =>
            prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
        );
    };

    const openPromoteModal = async () => {
        setShowPromote(true);
        setPromoteResult(null);
        setPromoteAudience("all");
        try {
            const res = await fetch(`${API}/admin/blog/${postId}/promote/count`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setPromoteCounts(json.data ?? null);
        } catch (e) {
            console.error(e);
        }
    };

    const handlePromote = async () => {
        setPromoting(true);
        setPromoteResult(null);
        try {
            const res = await fetch(`${API}/admin/blog/${postId}/promote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ audience: promoteAudience }),
            });
            const json = await res.json();
            setPromoteResult(json.data ?? null);
        } catch (e) {
            console.error(e);
        } finally {
            setPromoting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-orange border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text">
                        {isNew ? "New Blog Post" : "Edit Post"}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isNew ? "Create a new blog post" : `Editing: ${title}`}
                    </p>
                </div>
                <div className="flex gap-2">
                    {!isNew && (
                        <button
                            onClick={openPromoteModal}
                            className="px-4 py-2 text-sm font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                        >
                            📧 Promote
                        </button>
                    )}
                    <button
                        onClick={() => router.push("/dashboard/admin/blog")}
                        className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleSave(false)}
                        disabled={saving || !title}
                        className="px-4 py-2 text-sm font-medium text-brand-orange border border-brand-orange rounded-lg hover:bg-brand-orange-light transition-colors disabled:opacity-50"
                    >
                        {saving ? "Saving…" : "Save Draft"}
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={saving || !title}
                        className="px-4 py-2 text-sm font-semibold text-white bg-brand-orange rounded-lg hover:bg-brand-orange-hover transition-colors disabled:opacity-50"
                    >
                        {saving ? "Publishing…" : "Publish"}
                    </button>
                </div>
            </div>

            {/* Title */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Your blog post title…"
                        className="w-full px-4 py-3 text-lg font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Slug
                        <span className="text-gray-400 font-normal ml-1">(URL path)</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">/blog/</span>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                        />
                    </div>
                </div>
            </div>

            {/* Cover Image */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>

                {coverImage ? (
                    <div className="relative group">
                        <img
                            src={coverImage}
                            alt="Cover preview"
                            className="w-full max-h-56 object-cover rounded-lg border border-gray-100"
                        />
                        <button
                            type="button"
                            onClick={() => setCoverImage("")}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                            ✕
                        </button>
                    </div>
                ) : (
                    <label
                        className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                            uploading
                                ? "border-brand-orange bg-brand-orange-light/20"
                                : "border-gray-200 hover:border-brand-orange hover:bg-gray-50"
                        }`}
                    >
                        {uploading ? (
                            <>
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-orange border-t-transparent mb-2" />
                                <span className="text-sm text-brand-muted">Uploading…</span>
                            </>
                        ) : (
                            <>
                                <span className="text-3xl mb-1">📷</span>
                                <span className="text-sm font-medium text-gray-600">Click to upload cover image</span>
                                <span className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP — max 10 MB</span>
                            </>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                )}

                <div className="mt-3">
                    <label className="block text-xs text-gray-400 mb-1">Or paste image URL</label>
                    <input
                        type="url"
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                    />
                </div>
            </div>

            {/* Excerpt */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Excerpt
                    <span className="text-gray-400 font-normal ml-1">(shown on cards)</span>
                </label>
                <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={3}
                    placeholder="A brief summary of your post…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30 resize-none"
                />
            </div>

            {/* Rich Content Editor */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Write your blog post…"
                    minHeight="400px"
                />
                <p className="text-xs text-gray-400 mt-2">
                    💡 Tip: Paste YouTube URLs and they will be embedded automatically.
                </p>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {allTags.map((tag) => (
                        <button
                            key={tag.id}
                            onClick={() => toggleTag(tag.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                                selectedTagIds.includes(tag.id)
                                    ? "bg-brand-orange text-white border-brand-orange"
                                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-brand-orange"
                            }`}
                        >
                            {tag.name}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                        placeholder="Add new tag…"
                        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30 w-48"
                    />
                    <button
                        onClick={handleCreateTag}
                        className="px-3 py-1.5 text-xs font-medium text-brand-orange border border-brand-orange rounded-lg hover:bg-brand-orange-light transition-colors"
                    >
                        + Add Tag
                    </button>
                </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    🔍 SEO Settings
                </h3>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Meta Title</label>
                    <input
                        type="text"
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        placeholder={title || "Page title for search engines"}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                    />
                    <p className="text-xs text-gray-300 mt-1">
                        {(metaTitle || title).length}/60 characters
                    </p>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Meta Description</label>
                    <textarea
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        rows={2}
                        placeholder={excerpt || "Description for search results"}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30 resize-none"
                    />
                    <p className="text-xs text-gray-300 mt-1">
                        {(metaDescription || excerpt).length}/160 characters
                    </p>
                </div>
            </div>

            {/* Promote Modal */}
            {showPromote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 animate-in fade-in">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-brand-text">📧 Promote Post</h2>
                            <button
                                onClick={() => setShowPromote(false)}
                                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-sm text-gray-500">
                            Send a promotional email about <strong>&quot;{title}&quot;</strong> to your users.
                        </p>

                        {/* Audience selection */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Send to:</label>
                            {(["freelancers", "clients", "all"] as const).map((opt) => (
                                <label
                                    key={opt}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                        promoteAudience === opt
                                            ? "border-brand-orange bg-brand-orange-light/20"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="audience"
                                        value={opt}
                                        checked={promoteAudience === opt}
                                        onChange={() => setPromoteAudience(opt)}
                                        className="accent-brand-orange"
                                    />
                                    <span className="text-sm font-medium text-gray-700 capitalize">{opt === "all" ? "Everyone" : opt}</span>
                                    {promoteCounts && (
                                        <span className="ml-auto text-xs text-gray-400">
                                            {promoteCounts[opt]} user{promoteCounts[opt] !== 1 ? "s" : ""}
                                        </span>
                                    )}
                                </label>
                            ))}
                        </div>

                        {/* Result feedback */}
                        {promoteResult && (
                            <div className={`p-3 rounded-lg text-sm ${
                                promoteResult.failed === 0
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                                ✅ Sent <strong>{promoteResult.sent}</strong> email{promoteResult.sent !== 1 ? "s" : ""}
                                {promoteResult.failed > 0 && (
                                    <> · <span className="text-red-600">{promoteResult.failed} failed</span></>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowPromote(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                {promoteResult ? "Close" : "Cancel"}
                            </button>
                            {!promoteResult && (
                                <button
                                    onClick={handlePromote}
                                    disabled={promoting}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                >
                                    {promoting ? "Sending…" : `Send to ${promoteAudience === "all" ? "everyone" : promoteAudience}`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
