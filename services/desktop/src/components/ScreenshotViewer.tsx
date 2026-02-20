import { useState, useEffect, useCallback } from "react";
import { Spinner } from "@heroui/react";
import { apiGet, api } from "@/lib/api";
import { getApiBase } from "@/lib/api";

/* ── Types ── */
interface Screenshot {
    id: string;
    file_url: string;
    click_count: number;
    key_count: number;
    activity_percent: number;
    captured_at: string;
}

interface Props {
    entryId: string;
    durationMinutes?: number;
    onDeleted?: () => void;
    onClose: () => void;
}

/* ── Helpers ── */
function normalizeTimestamp(ts: string): string {
    let s = ts.replace(" ", "T");
    if (!s.includes("Z") && !/[+-]\d{2}(:\d{2})?$/.test(s)) s += "Z";
    return s;
}

function fmtTime(iso: string) {
    try {
        return new Date(normalizeTimestamp(iso)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch { return "—"; }
}

function actColor(pct: number): string {
    if (pct >= 60) return "#4ade80";
    if (pct >= 30) return "#fbbf24";
    return "#f87171";
}

/* ── Component ── */
export default function ScreenshotViewer({ entryId, durationMinutes, onDeleted, onClose }: Props) {
    const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [deleting, setDeleting] = useState(false);
    const [lightbox, setLightbox] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const apiOrigin = new URL(getApiBase()).origin;

    const fetchScreenshots = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiGet<{ data: Screenshot[] }>(`/time/entries/${entryId}/screenshots`);
            setScreenshots(res.data || []);
        } catch { /* silent */ }
        setLoading(false);
    }, [entryId]);

    useEffect(() => { fetchScreenshots(); }, [fetchScreenshots]);

    function toggle(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function toggleAll() {
        if (selected.size === screenshots.length) setSelected(new Set());
        else setSelected(new Set(screenshots.map((s) => s.id)));
    }

    /* Calculate time that will be deducted */
    const totalScreenshots = screenshots.length;
    const deductMinutes =
        totalScreenshots > 0 && durationMinutes
            ? Math.round((durationMinutes / totalScreenshots) * selected.size)
            : 0;

    async function handleDelete() {
        if (selected.size === 0) return;
        setDeleting(true);
        try {
            if (selected.size === 1) {
                const id = Array.from(selected)[0];
                await api(`/time/screenshots/${id}`, { method: "DELETE" });
            } else {
                await api("/time/screenshots/batch-delete", {
                    method: "POST",
                    body: JSON.stringify({ ids: Array.from(selected) }),
                });
            }
            setSelected(new Set());
            setShowConfirm(false);
            await fetchScreenshots();
            onDeleted?.();
        } catch { /* silent */ }
        setDeleting(false);
    }

    return (
        <>
            <div
                className="mt-2 ml-3 pl-3 border-l-2 border-[#f08a11]/30"
                style={{ animation: "mw-fade-in 0.2s ease-out" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                        📸 Screenshots ({screenshots.length})
                    </p>
                    <button
                        onClick={onClose}
                        className="text-xs text-white/30 hover:text-white/60 transition-colors"
                    >
                        ✕ Close
                    </button>
                </div>

                {loading && (
                    <div className="py-4 flex justify-center">
                        <Spinner size="sm" color="warning" />
                    </div>
                )}

                {!loading && screenshots.length === 0 && (
                    <p className="text-white/30 text-xs py-3">No screenshots for this entry.</p>
                )}

                {!loading && screenshots.length > 0 && (
                    <>
                        {/* Toolbar */}
                        <div className="flex items-center gap-2 mb-2">
                            <button
                                onClick={toggleAll}
                                className="text-[11px] font-semibold px-2 py-1 rounded-md bg-white/[0.07] text-white/50 hover:text-white/80 hover:bg-white/[0.10] transition-colors"
                            >
                                {selected.size === screenshots.length ? "Deselect All" : "Select All"}
                            </button>
                            {selected.size > 0 && (
                                <button
                                    onClick={() => setShowConfirm(true)}
                                    className="text-[11px] font-semibold px-2 py-1 rounded-md bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                                >
                                    🗑 Delete {selected.size} ({deductMinutes}m will be deducted)
                                </button>
                            )}
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-3 gap-1.5">
                            {screenshots.map((ss) => {
                                const pct = parseFloat(String(ss.activity_percent));
                                const imgUrl = ss.file_url.startsWith("http")
                                    ? ss.file_url
                                    : `${apiOrigin}${ss.file_url}`;
                                const isSelected = selected.has(ss.id);

                                return (
                                    <div
                                        key={ss.id}
                                        className={`
                                            rounded-lg overflow-hidden cursor-pointer transition-all duration-150
                                            ${isSelected
                                                ? "ring-2 ring-[#f08a11] ring-offset-1 ring-offset-[#1a1b2e]"
                                                : "ring-1 ring-white/10 hover:ring-white/20"
                                            }
                                        `}
                                        onClick={() => toggle(ss.id)}
                                    >
                                        {/* Thumbnail */}
                                        <div
                                            className="relative pb-[62%] bg-[#1a1b2e]"
                                            style={{ cursor: "zoom-in" }}
                                        >
                                            <img
                                                src={imgUrl}
                                                alt="Screenshot"
                                                className="absolute inset-0 w-full h-full object-cover"
                                                loading="lazy"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setLightbox(imgUrl);
                                                }}
                                            />
                                            {/* Selection checkbox */}
                                            <div
                                                className={`
                                                    absolute top-1 left-1 w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold border
                                                    ${isSelected
                                                        ? "bg-[#f08a11] border-[#f08a11] text-white"
                                                        : "bg-black/40 border-white/30 text-transparent"
                                                    }
                                                `}
                                            >
                                                ✓
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="bg-white/[0.05] px-1.5 py-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-white/40">{fmtTime(ss.captured_at)}</span>
                                                <span
                                                    className="text-[9px] font-bold px-1 py-0.5 rounded"
                                                    style={{
                                                        color: actColor(pct),
                                                        background: `${actColor(pct)}18`,
                                                    }}
                                                >
                                                    {Math.round(pct)}%
                                                </span>
                                            </div>
                                            {/* Activity bar */}
                                            <div className="h-[3px] rounded-full bg-white/[0.08] mt-0.5 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(100, pct)}%`,
                                                        background: actColor(pct),
                                                    }}
                                                />
                                            </div>
                                            <div className="flex gap-2 mt-0.5 text-[9px] text-white/30">
                                                <span>🖱 {ss.click_count}</span>
                                                <span>⌨ {ss.key_count}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* ── Confirmation Modal ── */}
            {showConfirm && (
                <div
                    className="fixed inset-0 z-[9998] flex items-center justify-center"
                    style={{ background: "rgba(26,27,46,0.85)", backdropFilter: "blur(8px)" }}
                >
                    <div
                        className="bg-[#2a2b3d] border border-white/10 rounded-xl p-6 max-w-sm w-[90%] shadow-2xl"
                        style={{ animation: "mw-fade-in 0.15s ease-out" }}
                    >
                        <div className="text-center mb-4">
                            <span className="text-3xl block mb-2">⚠️</span>
                            <h3 className="text-sm font-bold text-white mb-1">Delete Screenshots?</h3>
                            <p className="text-[11px] text-white/50 leading-relaxed">
                                You are about to delete <strong className="text-white">{selected.size}</strong> screenshot{selected.size > 1 ? "s" : ""}.
                                This will deduct approximately{" "}
                                <strong className="text-red-400">{deductMinutes} minute{deductMinutes !== 1 ? "s" : ""}</strong>{" "}
                                from this time entry.
                            </p>
                            <p className="text-xs text-white/30 mt-2">
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 rounded-lg text-[11px] font-semibold bg-white/[0.07] text-white/60 hover:text-white hover:bg-white/[0.10] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 rounded-lg text-[11px] font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            >
                                {deleting ? "Deleting…" : `Delete & Deduct ${deductMinutes}m`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Lightbox ── */}
            {lightbox && (
                <div
                    onClick={() => setLightbox(null)}
                    className="fixed inset-0 z-[9999] flex items-center justify-center cursor-zoom-out"
                    style={{ background: "rgba(0,0,0,0.9)" }}
                >
                    <img
                        src={lightbox}
                        alt="Screenshot"
                        className="max-w-[90vw] max-h-[90vh] rounded-lg"
                        style={{ boxShadow: "0 4px 40px rgba(0,0,0,0.4)" }}
                    />
                </div>
            )}
        </>
    );
}
