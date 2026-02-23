"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Milestone {
    title: string;
    description: string;
    estimated_amount: number;
}

interface EnhanceResult {
    improved_title: string;
    improved_description: string;
    suggested_skills: string[];
    suggested_milestones: Milestone[];
    tips: string[];
    estimated_budget_range?: { min: number; max: number };
    status?: string;
}

interface Props {
    title: string;
    description: string;
    category: string;
    skills: string[];
    budgetMin: number | null;
    budgetMax: number | null;
    onApplyTitle: (title: string) => void;
    onApplyDescription: (desc: string) => void;
    onApplySkills: (skills: string[]) => void;
    onApplyMilestones: (milestones: { title: string; amount: string; description: string }[]) => void;
}

export default function AiJobAssistant({
    title, description, category, skills, budgetMin, budgetMax,
    onApplyTitle, onApplyDescription, onApplySkills, onApplyMilestones,
}: Props) {
    const { token } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<EnhanceResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [applied, setApplied] = useState<Record<string, boolean>>({});

    const generate = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        setApplied({});

        try {
            const res = await fetch(`${API}/ai/job/enhance`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    description,
                    category,
                    skills,
                    budget_min: budgetMin,
                    budget_max: budgetMax,
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
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-colors"
            >
                <span className="text-base">✨</span>
                AI Assistant — Enhance Your Job Post
            </button>
        );
    }

    return (
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200/60 rounded-2xl p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <h3 className="text-sm font-bold text-violet-800">AI Job Post Assistant</h3>
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
                Let AI analyze your job post and suggest improvements — better description, skills, milestones, and tips to attract top freelancers.
            </p>

            {/* Generate button */}
            {!result && (
                <button
                    type="button"
                    onClick={generate}
                    disabled={loading || (!title && !description)}
                    className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm"
                >
                    {loading ? (
                        <span className="inline-flex items-center gap-2">
                            <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Analyzing your job post...
                        </span>
                    ) : (
                        "🤖 Enhance Job Post"
                    )}
                </button>
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
                    {/* Improved Title */}
                    {result.improved_title && result.improved_title !== title && (
                        <div className="bg-white rounded-xl border border-violet-200/60 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">Improved Title</span>
                                {applied.title ? (
                                    <span className="text-[10px] font-semibold text-emerald-600">✓ Applied</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => { onApplyTitle(result.improved_title); markApplied("title"); }}
                                        className="text-[10px] font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition-colors"
                                    >
                                        Apply
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-brand-dark font-medium">{result.improved_title}</p>
                        </div>
                    )}

                    {/* Improved Description */}
                    {result.improved_description && (
                        <div className="bg-white rounded-xl border border-violet-200/60 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">Enhanced Description</span>
                                {applied.desc ? (
                                    <span className="text-[10px] font-semibold text-emerald-600">✓ Applied</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => { onApplyDescription(result.improved_description); markApplied("desc"); }}
                                        className="text-[10px] font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition-colors"
                                    >
                                        Apply
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-brand-muted whitespace-pre-wrap max-h-48 overflow-y-auto">
                                {result.improved_description}
                            </p>
                        </div>
                    )}

                    {/* Suggested Skills */}
                    {result.suggested_skills?.length > 0 && (
                        <div className="bg-white rounded-xl border border-violet-200/60 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">
                                    Suggested Skills (+{result.suggested_skills.length})
                                </span>
                                {applied.skills ? (
                                    <span className="text-[10px] font-semibold text-emerald-600">✓ Applied</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => { onApplySkills(result.suggested_skills); markApplied("skills"); }}
                                        className="text-[10px] font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition-colors"
                                    >
                                        Add All
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {result.suggested_skills.map((s) => (
                                    <span key={s} className="px-2.5 py-1 text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-200 rounded-full">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

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
                                                    amount: (m.estimated_amount ?? 0).toFixed(2),
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
                                            ${(m.estimated_amount ?? 0).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tips */}
                    {result.tips?.length > 0 && (
                        <div className="bg-white rounded-xl border border-violet-200/60 p-4">
                            <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider block mb-2">
                                💡 Posting Tips
                            </span>
                            <ul className="space-y-1.5">
                                {result.tips.map((tip, i) => (
                                    <li key={i} className="text-xs text-brand-muted flex items-start gap-2">
                                        <span className="text-violet-400 mt-0.5">•</span>
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Re-generate */}
                    <button
                        type="button"
                        onClick={generate}
                        disabled={loading}
                        className="w-full py-2.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {loading ? "Regenerating..." : "🔄 Regenerate Suggestions"}
                    </button>
                </div>
            )}
        </div>
    );
}
