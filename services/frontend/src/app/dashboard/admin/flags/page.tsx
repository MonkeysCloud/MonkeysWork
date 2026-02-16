"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface Flag {
    key: string;
    is_enabled: boolean;
    rollout_percentage: number;
    description: string | null;
    metadata: string | null;
    updated_at: string;
    [k: string]: unknown;
}

export default function AdminFlagsPage() {
    const { token } = useAuth();
    const [flags, setFlags] = useState<Flag[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const fetchFlags = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/admin/feature-flags/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setFlags(json.data ?? []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchFlags();
    }, [fetchFlags]);

    const updateFlag = async (
        key: string,
        updates: Partial<Pick<Flag, "is_enabled" | "rollout_percentage">>,
    ) => {
        setSaving(key);
        try {
            await fetch(`${API}/admin/feature-flags/${key}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updates),
            });
            setFlags((prev) =>
                prev.map((f) =>
                    f.key === key ? { ...f, ...updates } : f,
                ),
            );
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-brand-text">
                    Feature Flags
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Toggle features and control rollout percentages
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-14 bg-gray-100 rounded-lg animate-pulse"
                            />
                        ))}
                    </div>
                ) : flags.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        No feature flags configured.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {flags.map((flag) => (
                            <div
                                key={flag.key}
                                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                            >
                                {/* Toggle */}
                                <button
                                    onClick={() =>
                                        updateFlag(flag.key, {
                                            is_enabled: !flag.is_enabled,
                                        })
                                    }
                                    disabled={saving === flag.key}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${flag.is_enabled
                                            ? "bg-emerald-500"
                                            : "bg-gray-300"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${flag.is_enabled
                                                ? "translate-x-6"
                                                : "translate-x-1"
                                            }`}
                                    />
                                </button>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-mono text-sm font-medium text-brand-text">
                                        {flag.key}
                                    </p>
                                    {flag.description && (
                                        <p className="text-xs text-gray-400 truncate">
                                            {flag.description}
                                        </p>
                                    )}
                                </div>

                                {/* Rollout */}
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-400">
                                        Rollout
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={flag.rollout_percentage}
                                        onChange={(e) =>
                                            updateFlag(flag.key, {
                                                rollout_percentage: Number(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                        className="w-16 px-2 py-1 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                                    />
                                    <span className="text-xs text-gray-400">
                                        %
                                    </span>
                                </div>

                                {/* Last updated */}
                                <span className="text-xs text-gray-300 flex-shrink-0">
                                    {flag.updated_at
                                        ? new Date(
                                            flag.updated_at,
                                        ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })
                                        : "—"}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
