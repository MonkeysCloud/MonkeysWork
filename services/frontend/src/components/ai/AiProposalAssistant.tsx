"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface ProposalMilestone {
    title: string;
    description: string;
    amount: number;
}

interface ProposalResult {
    cover_letter: string;
    suggested_bid: number;
    suggested_milestones: ProposalMilestone[];
    suggested_duration_weeks: number;
    key_talking_points: string[];
    status?: string;
}

interface Props {
    jobId: string;
    onApplyCoverLetter: (text: string) => void;
    onApplyBid: (amount: string) => void;
    onApplyDuration: (weeks: number) => void;
    onApplyMilestones: (milestones: { title: string; amount: string; description: string }[]) => void;
}

const TONES = [
    { value: "professional", label: "💼 Professional", desc: "Formal and polished" },
    { value: "friendly", label: "😊 Friendly", desc: "Warm and approachable" },
    { value: "technical", label: "⚙️ Technical", desc: "Detail-oriented" },
];

export default function AiProposalAssistant({
    jobId, onApplyCoverLetter, onApplyBid, onApplyDuration, onApplyMilestones,
}: Props) {
    const { token } = useAuth();
    const [open, setOpen] = useState(false);
    const [tone, setTone] = useState("professional");
    const [highlights, setHighlights] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ProposalResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [applied, setApplied] = useState<Record<string, boolean>>({});

    const generate = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        setApplied({});

        try {
            const res = await fetch(`${API}/ai/proposal/generate`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    job_id: jobId,
                    tone,
                    highlights,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json.message || json.error || "AI service returned an error. Please try again.");
                return;
            }

            const data = json.data ?? json;

            if (data.status === "ai_service_unavailable") {
                setError("AI service is temporarily unavailable. Please try again.");
            } else {
                setResult(data);
            }
        } catch {
            setError("Failed to connect to AI service.");
        } finally {
            setLoading(false);
        }
    };

    const markApplied = (key: string) => setApplied((p) => ({ ...p, [key]: true }));

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-violet-700 bg-gradient-to-r from-violet-50 to-indigo-50 hover:from-violet-100 hover:to-indigo-100 border border-violet-200 rounded-2xl transition-colors"
            >
                <span className="text-lg">🤖</span>
                AI Proposal Assistant — Draft your proposal with AI
            </button>
        );
    }

    return (
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200/60 rounded-2xl p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <h3 className="text-sm font-bold text-violet-800">AI Proposal Assistant</h3>
                </div>
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-violet-400 hover:text-violet-600 text-sm"
                >
                    ✕
                </button>
            </div>

            <p className="text-xs text-violet-600/80">
                Generate a tailored cover letter, suggested bid, milestones, and talking points based on the job requirements and your profile.
            </p>

            {/* Tone selector */}
            {!result && (
                <>
                    <div>
                        <label className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider block mb-2">
                            Choose Tone
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {TONES.map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setTone(t.value)}
                                    className={`text-center py-2.5 px-2 rounded-xl text-xs font-medium border transition-all ${
                                        tone === t.value
                                            ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                                            : "bg-white text-violet-700 border-violet-200 hover:border-violet-400"
                                    }`}
                                >
                                    <div>{t.label}</div>
                                    <div className={`text-[10px] mt-0.5 ${tone === t.value ? "text-violet-200" : "text-violet-400"}`}>
                                        {t.desc}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Highlights */}
                    <div>
                        <label className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider block mb-1.5">
                            Extra Highlights (optional)
                        </label>
                        <textarea
                            value={highlights}
                            onChange={(e) => setHighlights(e.target.value)}
                            placeholder="Mention specific experience, certifications, or relevant projects..."
                            rows={2}
                            className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-brand-dark placeholder:text-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 resize-none"
                        />
                    </div>

                    {/* Generate button */}
                    <button
                        type="button"
                        onClick={generate}
                        disabled={loading}
                        className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm"
                    >
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                Generating your proposal...
                            </span>
                        ) : (
                            "✨ Generate Proposal"
                        )}
                    </button>
                </>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-4 py-3">
                    ⚠️ {error}
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-4">
                    {/* Key Talking Points */}
                    {result.key_talking_points?.length > 0 && (
                        <div className="bg-white rounded-xl border border-violet-200/60 p-4">
                            <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider block mb-2">
                                🎯 Key Talking Points
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {result.key_talking_points.map((pt, i) => (
                                    <span key={i} className="px-2.5 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                                        ✓ {pt}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cover Letter */}
                    {result.cover_letter && (
                        <div className="bg-white rounded-xl border border-violet-200/60 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">
                                    Generated Cover Letter
                                </span>
                                {applied.cover ? (
                                    <span className="text-[10px] font-semibold text-emerald-600">✓ Applied</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => { onApplyCoverLetter(result.cover_letter); markApplied("cover"); }}
                                        className="text-[10px] font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition-colors"
                                    >
                                        Use This
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-brand-muted whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed">
                                {result.cover_letter}
                            </p>
                        </div>
                    )}

                    {/* Bid & Duration */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Suggested Bid */}
                        <div className="bg-white rounded-xl border border-violet-200/60 p-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">Suggested Bid</span>
                                {applied.bid ? (
                                    <span className="text-[10px] font-semibold text-emerald-600">✓</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => { onApplyBid((result.suggested_bid ?? 0).toFixed(2)); markApplied("bid"); }}
                                        className="text-[10px] font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded-lg transition-colors"
                                    >
                                        Apply
                                    </button>
                                )}
                            </div>
                            <p className="text-xl font-extrabold text-emerald-600">
                                ${(result.suggested_bid ?? 0).toLocaleString()}
                            </p>
                        </div>

                        {/* Suggested Duration */}
                        <div className="bg-white rounded-xl border border-violet-200/60 p-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">Duration</span>
                                {applied.duration ? (
                                    <span className="text-[10px] font-semibold text-emerald-600">✓</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => { onApplyDuration(result.suggested_duration_weeks); markApplied("duration"); }}
                                        className="text-[10px] font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded-lg transition-colors"
                                    >
                                        Apply
                                    </button>
                                )}
                            </div>
                            <p className="text-xl font-extrabold text-brand-dark">
                                {result.suggested_duration_weeks ?? 4} <span className="text-sm font-medium text-brand-muted">weeks</span>
                            </p>
                        </div>
                    </div>

                    {/* Suggested Milestones */}
                    {result.suggested_milestones?.length > 0 && (
                        <div className="bg-white rounded-xl border border-violet-200/60 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">
                                    Suggested Milestones ({result.suggested_milestones.length})
                                </span>
                                {applied.milestones ? (
                                    <span className="text-[10px] font-semibold text-emerald-600">✓ Applied</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onApplyMilestones(
                                                result.suggested_milestones.map((m) => ({
                                                    title: m.title,
                                                    amount: (m.amount ?? 0).toFixed(2),
                                                    description: m.description,
                                                }))
                                            );
                                            markApplied("milestones");
                                        }}
                                        className="text-[10px] font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition-colors"
                                    >
                                        Apply All
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2">
                                {result.suggested_milestones.map((m, i) => (
                                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-violet-100 last:border-0">
                                        <div>
                                            <span className="text-xs font-medium text-brand-dark">{m.title}</span>
                                            <p className="text-[10px] text-brand-muted">{m.description}</p>
                                        </div>
                                        <span className="text-xs font-bold text-emerald-600 ml-3 shrink-0">
                                            ${(m.amount ?? 0).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between pt-2 border-t border-violet-200">
                                    <span className="text-xs font-semibold text-brand-dark">Total</span>
                                    <span className="text-sm font-bold text-brand-dark">
                                        ${result.suggested_milestones.reduce((s, m) => s + (m.amount ?? 0), 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Re-generate */}
                    <button
                        type="button"
                        onClick={() => { setResult(null); }}
                        className="w-full py-2.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-colors"
                    >
                        🔄 Generate Again (change tone or add highlights)
                    </button>
                </div>
            )}
        </div>
    );
}
