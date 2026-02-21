"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { API } from "@/components/contracts";

/* ── Types ── */
interface Review {
    id: string;
    contract_id: string;
    reviewer_id: string;
    reviewee_id: string;
    reviewer_name: string;
    reviewer_avatar: string | null;
    reviewee_name: string;
    reviewee_avatar: string | null;
    contract_title: string | null;
    overall_rating: number;
    communication_rating: number | null;
    quality_rating: number | null;
    timeliness_rating: number | null;
    professionalism_rating: number | null;
    comment: string | null;
    response: string | null;
    response_at: string | null;
    is_public: boolean;
    created_at: string;
}

interface ReviewableContract {
    id: string;
    title: string;
    status: string;
    freelancer_id: string;
    client_id: string;
    client_name: string;
    freelancer_name: string;
    completed_at: string | null;
    already_reviewed: boolean;
}

interface Summary {
    received_count: number;
    given_count: number;
    avg_received_rating: number;
}

/* ── Star rating (display) ── */
function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
    return (
        <span className="inline-flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <svg
                    key={s}
                    width={size}
                    height={size}
                    viewBox="0 0 20 20"
                    fill={s <= Math.round(rating) ? "#f59e0b" : "#e5e7eb"}
                >
                    <path d="M10 1l2.39 4.84L17.82 7l-3.91 3.81.92 5.38L10 13.47l-4.83 2.72.92-5.38L2.18 7l5.43-.79z" />
                </svg>
            ))}
        </span>
    );
}

/* ── Star rating (interactive) ── */
function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hover, setHover] = useState(0);
    return (
        <span className="inline-flex gap-1 cursor-pointer">
            {[1, 2, 3, 4, 5].map((s) => (
                <svg
                    key={s}
                    width={28}
                    height={28}
                    viewBox="0 0 20 20"
                    fill={(hover || value) >= s ? "#f59e0b" : "#e5e7eb"}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => onChange(s)}
                    className="transition-transform hover:scale-110"
                >
                    <path d="M10 1l2.39 4.84L17.82 7l-3.91 3.81.92 5.38L10 13.47l-4.83 2.72.92-5.38L2.18 7l5.43-.79z" />
                </svg>
            ))}
        </span>
    );
}

/* ── Review card ── */
function ReviewCard({
    review,
    userId,
    onRespond,
}: {
    review: Review;
    userId: string;
    onRespond: (id: string, text: string) => void;
}) {
    const isReceived = review.reviewee_id === userId;
    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState("");

    const name = isReceived ? review.reviewer_name : review.reviewee_name;
    const avatar = isReceived ? review.reviewer_avatar : review.reviewee_avatar;
    const direction = isReceived ? "From" : "To";
    const date = new Date(review.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return (
        <div className="bg-white rounded-xl border border-brand-border/60 p-5 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-orange-light flex items-center justify-center text-brand-orange font-bold text-sm">
                        {avatar ? (
                            <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            name?.charAt(0)?.toUpperCase() || "?"
                        )}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-brand-dark">{name}</div>
                        <div className="text-xs text-brand-muted">
                            {direction} · {date}
                        </div>
                    </div>
                </div>
                <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isReceived
                            ? "bg-blue-50 text-blue-600"
                            : "bg-emerald-50 text-emerald-600"
                    }`}
                >
                    {isReceived ? "Received" : "Given"}
                </span>
            </div>

            {/* Contract title */}
            {review.contract_title && (
                <div className="text-xs text-brand-muted mb-2">
                    📄 {review.contract_title}
                </div>
            )}

            {/* Stars */}
            <div className="flex items-center gap-2 mb-2">
                <Stars rating={Number(review.overall_rating)} />
                <span className="text-sm font-bold text-brand-dark">
                    {Number(review.overall_rating).toFixed(1)}
                </span>
            </div>

            {/* Sub-ratings */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-brand-muted">
                {review.communication_rating && (
                    <span>💬 Communication: {Number(review.communication_rating).toFixed(1)}</span>
                )}
                {review.quality_rating && (
                    <span>✨ Quality: {Number(review.quality_rating).toFixed(1)}</span>
                )}
                {review.timeliness_rating && (
                    <span>⏱️ Timeliness: {Number(review.timeliness_rating).toFixed(1)}</span>
                )}
                {review.professionalism_rating && (
                    <span>👔 Professionalism: {Number(review.professionalism_rating).toFixed(1)}</span>
                )}
            </div>

            {/* Comment */}
            {review.comment && (
                <p className="text-sm text-brand-dark leading-relaxed mb-3">
                    &ldquo;{review.comment}&rdquo;
                </p>
            )}

            {/* Response */}
            {review.response && (
                <div className="bg-gray-50 rounded-lg p-3 border border-brand-border/30 mb-2">
                    <div className="text-xs font-semibold text-brand-muted mb-1">
                        ↩️ Response from {isReceived ? "you" : review.reviewee_name}
                    </div>
                    <p className="text-sm text-brand-dark">{review.response}</p>
                </div>
            )}

            {/* Reply button for received reviews without response */}
            {isReceived && !review.response && (
                <>
                    {!showReply ? (
                        <button
                            onClick={() => setShowReply(true)}
                            className="text-xs font-semibold text-brand-orange hover:underline"
                        >
                            ↩️ Write a response
                        </button>
                    ) : (
                        <div className="mt-2 space-y-2">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write your response..."
                                className="w-full text-sm border border-brand-border rounded-lg p-3 focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none resize-none"
                                rows={3}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        onRespond(review.id, replyText);
                                        setShowReply(false);
                                        setReplyText("");
                                    }}
                                    disabled={!replyText.trim()}
                                    className="px-4 py-1.5 text-xs font-semibold bg-brand-orange text-white rounded-lg disabled:opacity-40 hover:opacity-90"
                                >
                                    Submit Response
                                </button>
                                <button
                                    onClick={() => { setShowReply(false); setReplyText(""); }}
                                    className="px-4 py-1.5 text-xs font-semibold text-brand-muted hover:text-brand-dark"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ── Leave review modal ── */
function LeaveReviewModal({
    contracts,
    userId,
    onSubmit,
    onClose,
}: {
    contracts: ReviewableContract[];
    userId: string;
    onSubmit: (data: {
        contract_id: string;
        rating: number;
        communication_rating: number;
        quality_rating: number;
        timeliness_rating: number;
        comment: string;
    }) => void;
    onClose: () => void;
}) {
    const [contractId, setContractId] = useState("");
    const [rating, setRating] = useState(0);
    const [commRating, setCommRating] = useState(0);
    const [qualRating, setQualRating] = useState(0);
    const [timeRating, setTimeRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const eligible = contracts.filter((c) => !c.already_reviewed);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-brand-dark">Leave a Review</h2>
                        <button
                            onClick={onClose}
                            className="text-brand-muted hover:text-brand-dark text-xl"
                        >
                            ✕
                        </button>
                    </div>

                    {eligible.length === 0 ? (
                        <div className="text-center py-8">
                            <span className="text-4xl block mb-3">✅</span>
                            <p className="text-sm text-brand-muted">
                                You&apos;ve reviewed all eligible contracts!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Contract selector */}
                            <div>
                                <label className="text-xs font-semibold text-brand-dark block mb-1">
                                    Select Contract
                                </label>
                                <select
                                    value={contractId}
                                    onChange={(e) => setContractId(e.target.value)}
                                    className="w-full text-sm border border-brand-border rounded-lg p-2.5 focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none"
                                >
                                    <option value="">Choose a contract…</option>
                                    {eligible.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.title} — {c.client_id === userId ? c.freelancer_name : c.client_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Overall rating */}
                            <div>
                                <label className="text-xs font-semibold text-brand-dark block mb-1">
                                    Overall Rating
                                </label>
                                <StarInput value={rating} onChange={setRating} />
                            </div>

                            {/* Sub-ratings */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[10px] font-semibold text-brand-muted block mb-1">
                                        💬 Communication
                                    </label>
                                    <StarInput value={commRating} onChange={setCommRating} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-brand-muted block mb-1">
                                        ✨ Quality
                                    </label>
                                    <StarInput value={qualRating} onChange={setQualRating} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-brand-muted block mb-1">
                                        ⏱️ Timeliness
                                    </label>
                                    <StarInput value={timeRating} onChange={setTimeRating} />
                                </div>
                            </div>

                            {/* Comment */}
                            <div>
                                <label className="text-xs font-semibold text-brand-dark block mb-1">
                                    Your Review
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Share your experience working with this person..."
                                    className="w-full text-sm border border-brand-border rounded-lg p-3 focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none resize-none"
                                    rows={4}
                                />
                            </div>

                            {/* Submit */}
                            <button
                                onClick={async () => {
                                    setSubmitting(true);
                                    await onSubmit({
                                        contract_id: contractId,
                                        rating: rating,
                                        communication_rating: commRating || rating,
                                        quality_rating: qualRating || rating,
                                        timeliness_rating: timeRating || rating,
                                        comment,
                                    });
                                    setSubmitting(false);
                                }}
                                disabled={!contractId || !rating || submitting}
                                className="w-full py-2.5 text-sm font-bold bg-brand-orange text-white rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
                            >
                                {submitting ? "Submitting…" : "Submit Review"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Page ── */
export default function ReviewsPage() {
    const { user, token } = useAuth();
    const [tab, setTab] = useState<"all" | "received" | "given">("all");
    const [reviews, setReviews] = useState<Review[]>([]);
    const [summary, setSummary] = useState<Summary>({ received_count: 0, given_count: 0, avg_received_rating: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [reviewableContracts, setReviewableContracts] = useState<ReviewableContract[]>([]);

    const fetchReviews = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/reviews/me?tab=${tab}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setReviews(json.data ?? []);
            if (json.summary) setSummary(json.summary);
        } catch {
            setReviews([]);
        }
        setLoading(false);
    }, [token, tab]);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    const openModal = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/contracts/reviewable`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setReviewableContracts(json.data ?? []);
        } catch {
            setReviewableContracts([]);
        }
        setShowModal(true);
    };

    const submitReview = async (data: {
        contract_id: string;
        rating: number;
        communication_rating: number;
        quality_rating: number;
        timeliness_rating: number;
        comment: string;
    }) => {
        if (!token) return;
        try {
            await fetch(`${API}/reviews`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            setShowModal(false);
            fetchReviews();
        } catch {
            alert("Failed to submit review");
        }
    };

    const respondToReview = async (reviewId: string, text: string) => {
        if (!token) return;
        try {
            await fetch(`${API}/reviews/${reviewId}/respond`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ response: text }),
            });
            fetchReviews();
        } catch {
            alert("Failed to submit response");
        }
    };

    if (!user) return null;

    const tabs = [
        { key: "all" as const, label: "All Reviews" },
        { key: "received" as const, label: `Received (${summary.received_count})` },
        { key: "given" as const, label: `Given (${summary.given_count})` },
    ];

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
                        Reviews
                    </h1>
                    <p className="text-sm text-brand-muted mt-1">
                        Manage your reviews — see feedback received and reviews you&apos;ve given.
                    </p>
                </div>
                <button
                    onClick={openModal}
                    className="px-5 py-2.5 text-sm font-bold bg-brand-orange text-white rounded-xl hover:opacity-90 shadow-[0_4px_16px_rgba(240,138,17,0.3)] transition-all"
                >
                    ✍️ Leave a Review
                </button>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-brand-border/60 p-5 text-center">
                    <div className="text-2xl font-extrabold text-brand-dark">
                        {summary.avg_received_rating > 0 ? summary.avg_received_rating.toFixed(1) : "—"}
                    </div>
                    <Stars rating={summary.avg_received_rating} size={14} />
                    <div className="text-xs text-brand-muted mt-1">Avg Rating</div>
                </div>
                <div className="bg-white rounded-xl border border-brand-border/60 p-5 text-center">
                    <div className="text-2xl font-extrabold text-brand-dark">{summary.received_count}</div>
                    <div className="text-xs text-brand-muted mt-1">Reviews Received</div>
                </div>
                <div className="bg-white rounded-xl border border-brand-border/60 p-5 text-center">
                    <div className="text-2xl font-extrabold text-brand-dark">{summary.given_count}</div>
                    <div className="text-xs text-brand-muted mt-1">Reviews Given</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                            tab === t.key
                                ? "bg-white text-brand-dark shadow-sm"
                                : "text-brand-muted hover:text-brand-dark"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Reviews list */}
            {loading ? (
                <div className="text-center py-12">
                    <span className="text-3xl block animate-pulse mb-2">⏳</span>
                    <p className="text-sm text-brand-muted">Loading reviews…</p>
                </div>
            ) : reviews.length === 0 ? (
                <div className="bg-white rounded-xl border border-brand-border/60 p-8 text-center">
                    <span className="text-4xl block mb-3">⭐</span>
                    <p className="text-sm text-brand-muted">
                        {tab === "received"
                            ? "No reviews received yet. Complete contracts to get feedback!"
                            : tab === "given"
                            ? "You haven't left any reviews yet."
                            : "No reviews yet. Complete a contract and leave your first review!"}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((r) => (
                        <ReviewCard
                            key={r.id}
                            review={r}
                            userId={user.id}
                            onRespond={respondToReview}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <LeaveReviewModal
                    contracts={reviewableContracts}
                    userId={user.id}
                    onSubmit={submitReview}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
}
