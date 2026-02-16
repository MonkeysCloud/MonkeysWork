"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Styling ────────────────────────────────────── */
const inputCls =
    "w-full px-4 py-3 rounded-xl border border-brand-border/60 bg-white text-sm text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all";
const btnPrimary =
    "px-6 py-2.5 rounded-xl bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange/90 transition-all shadow-sm";
const btnOutline =
    "px-4 py-2 rounded-xl border border-brand-border/60 text-sm font-medium text-brand-dark hover:bg-brand-bg transition-all";

/* ── Components ─────────────────────────────────── */
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-brand-border/60 overflow-hidden">
            <div className="px-6 py-5 border-b border-brand-border/40">
                <h2 className="text-base font-bold text-brand-dark">{title}</h2>
                {description && <p className="text-xs text-brand-muted mt-0.5">{description}</p>}
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1.5">{label}</label>
            {children}
            {hint && <p className="text-[11px] text-brand-muted mt-1">{hint}</p>}
        </div>
    );
}

const STATUS_OPTIONS = [
    { value: "available", label: "Available", desc: "Actively looking for new projects", color: "bg-green-500" },
    { value: "limited", label: "Limited Availability", desc: "Open to select opportunities", color: "bg-yellow-500" },
    { value: "unavailable", label: "Not Available", desc: "Not taking on new work right now", color: "bg-red-500" },
];

/* ── Main Page ──────────────────────────────────── */
export default function AvailabilityPage() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const [availabilityStatus, setAvailabilityStatus] = useState("available");
    const [hoursPerWeek, setHoursPerWeek] = useState(40);

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    /* ── Load ────────────────────────────────────── */
    const loadData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/freelancers/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to load profile");
            const { data } = await res.json();

            setAvailabilityStatus(data.availability_status ?? "available");
            setHoursPerWeek(data.availability_hours_week ?? 40);
        } catch (err) {
            setToast({ message: (err as Error).message, type: "error" });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { loadData(); }, [loadData]);

    /* ── Save ────────────────────────────────────── */
    const handleSave = async () => {
        if (!token) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/freelancers/me`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    availability_status: availabilityStatus,
                    availability_hours_week: hoursPerWeek,
                }),
            });
            if (!res.ok) throw new Error("Failed to save");
            setToast({ message: "Availability updated!", type: "success" });
        } catch (err) {
            setToast({ message: (err as Error).message, type: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-10">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg transition-all ${toast.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                    {toast.message}
                </div>
            )}

            <div>
                <h1 className="text-xl font-bold text-brand-dark">Availability</h1>
                <p className="text-sm text-brand-muted mt-0.5">
                    Let clients know when you&apos;re available for new projects.
                </p>
            </div>

            {/* ── Status ── */}
            <Section title="Availability Status" description="Your current availability for new work.">
                <div className="space-y-3">
                    {STATUS_OPTIONS.map((opt) => (
                        <label
                            key={opt.value}
                            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${availabilityStatus === opt.value
                                    ? "border-brand-orange bg-brand-orange/5 ring-2 ring-brand-orange/20"
                                    : "border-brand-border/60 hover:bg-brand-bg/50"
                                }`}
                        >
                            <input
                                type="radio"
                                name="availability"
                                value={opt.value}
                                checked={availabilityStatus === opt.value}
                                onChange={() => setAvailabilityStatus(opt.value)}
                                className="sr-only"
                            />
                            <div className={`w-3 h-3 rounded-full ${opt.color} flex-shrink-0`} />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-brand-dark">{opt.label}</p>
                                <p className="text-xs text-brand-muted mt-0.5">{opt.desc}</p>
                            </div>
                            {availabilityStatus === opt.value && (
                                <span className="text-brand-orange text-lg">✓</span>
                            )}
                        </label>
                    ))}
                </div>
            </Section>

            {/* ── Hours per Week ── */}
            <Section title="Hours per Week" description="How many hours per week can you dedicate to freelance work?">
                <div className="space-y-4">
                    <Field label="Hours per Week" hint="Drag the slider or type a value (0–60 hours)">
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min={0}
                                max={60}
                                step={5}
                                value={hoursPerWeek}
                                onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
                                className="flex-1 h-2 bg-brand-border/40 rounded-full appearance-none cursor-pointer accent-brand-orange"
                            />
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    min={0}
                                    max={60}
                                    className={inputCls + " !w-20 text-center"}
                                    value={hoursPerWeek}
                                    onChange={(e) => setHoursPerWeek(Math.min(60, Math.max(0, parseInt(e.target.value) || 0)))}
                                />
                                <span className="text-xs text-brand-muted">hrs</span>
                            </div>
                        </div>
                    </Field>

                    {/* Visual indicator */}
                    <div className="flex items-center gap-3 p-4 bg-brand-bg/50 rounded-xl border border-brand-border/30">
                        <div className="text-2xl">
                            {hoursPerWeek >= 35 ? "💼" : hoursPerWeek >= 20 ? "⏰" : hoursPerWeek >= 10 ? "🕐" : "🌙"}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-brand-dark">
                                {hoursPerWeek >= 35
                                    ? "Full-time"
                                    : hoursPerWeek >= 20
                                        ? "Part-time"
                                        : hoursPerWeek >= 10
                                            ? "A few hours"
                                            : hoursPerWeek > 0
                                                ? "Minimal"
                                                : "None"}
                            </p>
                            <p className="text-xs text-brand-muted">
                                {hoursPerWeek} hours per week
                                {hoursPerWeek > 0 && ` (~${Math.round(hoursPerWeek / 5)} hrs/day)`}
                            </p>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── Save ── */}
            <div className="flex justify-end gap-3 pt-2">
                <button className={btnOutline} onClick={loadData} disabled={saving}>
                    Reset
                </button>
                <button className={btnPrimary} onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : "Save Changes"}
                </button>
            </div>
        </div>
    );
}
