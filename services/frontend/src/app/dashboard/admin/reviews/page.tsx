"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminTable, { type Column } from "@/components/admin/AdminTable";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Review {
    id: string;
    contract_id: string;
    contract_title: string;
    overall_rating: number;
    communication_rating: number;
    quality_rating: number;
    timeliness_rating: number;
    professionalism_rating: number;
    comment: string;
    response: string | null;
    is_public: boolean;
    reviewer_name: string;
    reviewer_email: string;
    reviewer_avatar: string | null;
    reviewee_name: string;
    reviewee_email: string;
    reviewee_avatar: string | null;
    created_at: string;
    [key: string]: unknown;
}

const PER_PAGE = 20;

function Stars({ rating }: { rating: number }) {
    return (
        <span className="inline-flex items-center gap-0.5 text-sm">
            {[1, 2, 3, 4, 5].map((i) => (
                <span
                    key={i}
                    className={i <= Math.round(rating) ? "text-yellow-400" : "text-gray-200"}
                >
                    ★
                </span>
            ))}
            <span className="ml-1 text-xs font-medium text-gray-500">{Number(rating).toFixed(1)}</span>
        </span>
    );
}

export default function AdminReviewsPage() {
    const { token } = useAuth();

    const [reviews, setReviews] = useState<Review[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [publicFilter, setPublicFilter] = useState("");
    const [expanded, setExpanded] = useState<string | null>(null);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            per_page: String(PER_PAGE),
        });
        if (search) params.set("search", search);
        if (publicFilter) params.set("is_public", publicFilter);

        try {
            const res = await fetch(`${API}/admin/reviews?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setReviews(json.data ?? []);
            setTotal(json.meta?.total ?? 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token, page, search, publicFilter]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const toggleVisibility = async (id: string, isPublic: boolean) => {
        await fetch(`${API}/admin/reviews/${id}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ is_public: !isPublic }),
        });
        fetchReviews();
    };

    const hideReview = async (id: string) => {
        if (!confirm("Are you sure you want to hide this review?")) return;
        await fetch(`${API}/admin/reviews/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        fetchReviews();
    };

    const columns: Column<Review>[] = [
        {
            key: "reviewer_name",
            label: "Reviewer",
            render: (r) => (
                <div className="flex items-center gap-2">
                    {r.reviewer_avatar ? (
                        <img src={r.reviewer_avatar} alt="" className="w-7 h-7 rounded-full" />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                            {r.reviewer_name?.[0]}
                        </div>
                    )}
                    <div>
                        <span className="font-medium text-sm">{r.reviewer_name}</span>
                        <div className="text-xs text-gray-400">{r.reviewer_email}</div>
                    </div>
                </div>
            ),
        },
        {
            key: "reviewee_name",
            label: "Reviewee",
            render: (r) => (
                <div className="flex items-center gap-2">
                    {r.reviewee_avatar ? (
                        <img src={r.reviewee_avatar} alt="" className="w-7 h-7 rounded-full" />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
                            {r.reviewee_name?.[0]}
                        </div>
                    )}
                    <span className="font-medium text-sm">{r.reviewee_name}</span>
                </div>
            ),
        },
        {
            key: "overall_rating",
            label: "Rating",
            render: (r) => <Stars rating={r.overall_rating} />,
        },
        {
            key: "comment",
            label: "Comment",
            render: (r) => (
                <span className="text-sm text-gray-600 block max-w-xs truncate">
                    {r.comment || "—"}
                </span>
            ),
        },
        {
            key: "contract_title",
            label: "Contract",
            render: (r) => (
                <span className="text-sm text-gray-500 block max-w-xs truncate">
                    {r.contract_title || "—"}
                </span>
            ),
        },
        {
            key: "is_public",
            label: "Visibility",
            render: (r) => (
                <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.is_public
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                    }`}
                >
                    {r.is_public ? "👁 Public" : "🔒 Hidden"}
                </span>
            ),
        },
        {
            key: "created_at",
            label: "Date",
            render: (r) =>
                new Date(r.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }),
        },
        {
            key: "actions",
            label: "Actions",
            render: (r) => (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleVisibility(r.id, r.is_public);
                        }}
                        className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                        title={r.is_public ? "Hide review" : "Make public"}
                    >
                        {r.is_public ? "🔒 Hide" : "👁 Show"}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            hideReview(r.id);
                        }}
                        className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                    >
                        🗑️
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-brand-text">Reviews</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Moderate and manage platform reviews
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Search by name or comment…"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30 w-64"
                />
                <select
                    value={publicFilter}
                    onChange={(e) => {
                        setPublicFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                >
                    <option value="">All Reviews</option>
                    <option value="true">Public</option>
                    <option value="false">Hidden</option>
                </select>
            </div>

            <AdminTable
                columns={columns}
                data={reviews}
                loading={loading}
                page={page}
                totalPages={Math.ceil(total / PER_PAGE)}
                total={total}
                onPageChange={setPage}
                onRowClick={(r) => setExpanded(expanded === r.id ? null : r.id)}
                emptyMessage="No reviews found."
            />

            {/* Expanded review detail */}
            {expanded && (() => {
                const r = reviews.find((rv) => rv.id === expanded);
                if (!r) return null;
                return (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <h3 className="text-lg font-bold text-brand-text">
                                Review Detail
                            </h3>
                            <button
                                onClick={() => setExpanded(null)}
                                className="text-sm text-gray-400 hover:text-gray-600"
                            >
                                ✕ Close
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: "Overall", v: r.overall_rating },
                                { label: "Communication", v: r.communication_rating },
                                { label: "Quality", v: r.quality_rating },
                                { label: "Timeliness", v: r.timeliness_rating },
                            ].map(({ label, v }) => (
                                <div key={label} className="text-center">
                                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                                    <Stars rating={v} />
                                </div>
                            ))}
                        </div>
                        {r.comment && (
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Comment</p>
                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                    {r.comment}
                                </p>
                            </div>
                        )}
                        {r.response && (
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Response from Reviewee</p>
                                <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                                    {r.response}
                                </p>
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}
