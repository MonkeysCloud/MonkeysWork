"use client";

import { useState } from "react";
import { styles, API } from "./types";

interface ScreenshotData {
    id: string;
    file_url: string;
    click_count: number;
    key_count: number;
    activity_percent: number;
    captured_at: string;
}

interface Props {
    entryId: string;
    screenshots: ScreenshotData[];
    isFreelancer: boolean;
    apiOrigin: string;
    onDeleted?: () => void;
}

export default function TimeEntryScreenshots({
    entryId,
    screenshots,
    isFreelancer,
    apiOrigin,
    onDeleted,
}: Props) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [deleting, setDeleting] = useState(false);
    const [lightbox, setLightbox] = useState<string | null>(null);

    if (screenshots.length === 0) {
        return (
            <p style={{ color: "#b0b4c4", fontSize: "0.75rem", textAlign: "center", padding: "1rem 0" }}>
                No screenshots for this entry.
            </p>
        );
    }

    function toggle(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function toggleAll() {
        if (selected.size === screenshots.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(screenshots.map((s) => s.id)));
        }
    }

    async function handleDelete() {
        if (selected.size === 0) return;
        if (!confirm(`Delete ${selected.size} screenshot(s)? The corresponding time will also be removed.`)) return;

        setDeleting(true);
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            if (selected.size === 1) {
                const id = Array.from(selected)[0];
                await fetch(`${API}/time/screenshots/${id}`, { method: "DELETE", headers });
            } else {
                await fetch(`${API}/time/screenshots/batch-delete`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ ids: Array.from(selected) }),
                });
            }
            setSelected(new Set());
            onDeleted?.();
        } catch { /* silent */ }
        setDeleting(false);
    }

    function fmtTime(iso: string) {
        try {
            return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } catch { return "—"; }
    }

    function actColor(pct: number) {
        if (pct >= 60) return "#16a34a";
        if (pct >= 30) return "#eab308";
        return "#ef4444";
    }

    return (
        <div>
            {/* Toolbar */}
            {isFreelancer && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <button onClick={toggleAll} style={{ ...styles.btnOutline, fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}>
                        {selected.size === screenshots.length ? "Deselect All" : "Select All"}
                    </button>
                    {selected.size > 0 && (
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            style={{ ...styles.btnDanger, fontSize: "0.7rem", padding: "0.25rem 0.5rem", opacity: deleting ? 0.5 : 1 }}
                        >
                            🗑 Delete {selected.size} Selected
                        </button>
                    )}
                </div>
            )}

            {/* Screenshot Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                    gap: "0.5rem",
                }}
            >
                {screenshots.map((ss) => {
                    const pct = parseFloat(String(ss.activity_percent));
                    const imgUrl = ss.file_url.startsWith("http") ? ss.file_url : `${apiOrigin}${ss.file_url}`;
                    const isSelected = selected.has(ss.id);

                    return (
                        <div
                            key={ss.id}
                            style={{
                                borderRadius: 10,
                                border: isSelected ? "2px solid #6366f1" : "1px solid #e2e8f0",
                                overflow: "hidden",
                                background: "#fff",
                                cursor: isFreelancer ? "pointer" : "default",
                                transition: "border-color 0.15s",
                            }}
                            onClick={() => isFreelancer && toggle(ss.id)}
                        >
                            {/* Thumbnail */}
                            <div
                                style={{ position: "relative", paddingBottom: "62%", background: "#f1f5f9", cursor: "zoom-in" }}
                                onClick={(e) => { e.stopPropagation(); setLightbox(imgUrl); }}
                            >
                                <img
                                    src={imgUrl}
                                    alt="Screenshot"
                                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                                    loading="lazy"
                                />
                                {isFreelancer && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 4,
                                            left: 4,
                                            width: 18,
                                            height: 18,
                                            borderRadius: 4,
                                            border: "2px solid #fff",
                                            background: isSelected ? "#6366f1" : "rgba(255,255,255,0.7)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 10,
                                            color: "#fff",
                                        }}
                                        onClick={(e) => { e.stopPropagation(); toggle(ss.id); }}
                                    >
                                        {isSelected && "✓"}
                                    </div>
                                )}
                            </div>

                            {/* Info bar */}
                            <div style={{ padding: "0.375rem 0.5rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                                    <span style={{ fontSize: "0.625rem", color: "#8b8fa3" }}>
                                        {fmtTime(ss.captured_at)}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "0.575rem",
                                            fontWeight: 700,
                                            color: actColor(pct),
                                            background: `${actColor(pct)}18`,
                                            padding: "1px 5px",
                                            borderRadius: 4,
                                        }}
                                    >
                                        {Math.round(pct)}%
                                    </span>
                                </div>

                                {/* Activity bar */}
                                <div style={{ height: 4, borderRadius: 2, background: "#f1f5f9", overflow: "hidden" }}>
                                    <div
                                        style={{
                                            height: "100%",
                                            width: `${pct}%`,
                                            borderRadius: 2,
                                            background: actColor(pct),
                                            transition: "width 0.3s",
                                        }}
                                    />
                                </div>

                                {/* Counts */}
                                <div style={{ display: "flex", gap: "0.5rem", marginTop: 3, fontSize: "0.6rem", color: "#8b8fa3" }}>
                                    <span>🖱 {ss.click_count}</span>
                                    <span>⌨ {ss.key_count}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div
                    onClick={() => setLightbox(null)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        background: "rgba(0,0,0,0.85)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "zoom-out",
                    }}
                >
                    <img
                        src={lightbox}
                        alt="Screenshot"
                        style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8, boxShadow: "0 4px 40px rgba(0,0,0,0.4)" }}
                    />
                </div>
            )}
        </div>
    );
}
