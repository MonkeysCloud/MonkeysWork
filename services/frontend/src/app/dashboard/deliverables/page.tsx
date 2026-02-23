"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";
const API_ORIGIN = new URL(API).origin;

/* ── Types ─────────────────────────────────────────── */
interface Deliverable {
    id: string;
    milestone_id: string;
    file_name: string;
    file_url: string;
    file_size: number;
    mime_type: string;
    notes: string | null;
    version: number;
    created_at: string;
}

interface Milestone {
    id: string;
    contract_id: string;
    title: string;
    description: string | null;
    amount: string;
    currency: string;
    status: string;
    due_date: string | null;
    submitted_at: string | null;
    completed_at: string | null;
    revision_count: number;
    contract_title: string;
    contract_status: string;
    client_name: string;
    freelancer_name: string;
}

interface MilestoneWithDeliverables extends Milestone {
    deliverables: Deliverable[];
}

/* ── Tab config ────────────────────────────────────── */
const TABS = [
    { key: "all", label: "All", icon: "📦" },
    { key: "in_progress", label: "In Progress", icon: "🔨" },
    { key: "submitted", label: "Submitted", icon: "📤" },
    { key: "revision_requested", label: "Revisions", icon: "🔄" },
    { key: "accepted", label: "Completed", icon: "✅" },
];

/* ── Status config ─────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    pending: { label: "Pending", color: "#64748b", bg: "#f1f5f9", icon: "⏳" },
    in_progress: { label: "In Progress", color: "#2563eb", bg: "#eff6ff", icon: "🔨" },
    submitted: { label: "Submitted", color: "#7c3aed", bg: "#f5f3ff", icon: "📤" },
    revision_requested: { label: "Revision Requested", color: "#ea580c", bg: "#fff7ed", icon: "🔄" },
    accepted: { label: "Accepted", color: "#16a34a", bg: "#f0fdf4", icon: "✅" },
};

/* ── Helpers ────────────────────────────────────────── */
function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(d: string | null) {
    if (!d) return "";
    return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function fmtSize(bytes: number) {
    if (!bytes) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function fmtMoney(amount: string | number, currency = "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount));
}

function fileUrl(relPath: string) {
    if (!relPath) return "";
    if (relPath.startsWith("http")) return relPath;
    return `${API_ORIGIN}${relPath}`;
}

function getFileIcon(mime: string) {
    if (mime?.startsWith("image/")) return "🖼️";
    if (mime?.includes("pdf")) return "📄";
    if (mime?.includes("zip") || mime?.includes("archive")) return "📦";
    if (mime?.includes("video")) return "🎬";
    if (mime?.includes("spreadsheet") || mime?.includes("excel")) return "📊";
    if (mime?.includes("document") || mime?.includes("word")) return "📝";
    if (mime?.includes("text")) return "📃";
    return "📎";
}

/* ── Preview / Download Modal ──────────────────────── */
function PreviewModal({
    deliverable,
    onClose,
}: {
    deliverable: Deliverable;
    onClose: () => void;
}) {
    const url = fileUrl(deliverable.file_url);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/40">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-brand-dark truncate">
                            {deliverable.file_name}
                        </h3>
                        <p className="text-xs text-brand-muted mt-0.5">
                            {fmtSize(deliverable.file_size)} · {deliverable.mime_type}
                            {deliverable.version > 1 && ` · v${deliverable.version}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-brand-muted hover:text-brand-dark transition-colors text-lg"
                    >
                        ✕
                    </button>
                </div>

                {/* Body — preview */}
                <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-gray-50/50">
                    {deliverable.mime_type?.startsWith("image/") ? (
                        <img
                            src={url}
                            alt={deliverable.file_name}
                            className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm"
                        />
                    ) : deliverable.mime_type === "application/pdf" ? (
                        <iframe
                            src={url}
                            title={deliverable.file_name}
                            className="w-full h-[60vh] rounded-lg border border-brand-border/40"
                        />
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-4">{getFileIcon(deliverable.mime_type)}</div>
                            <p className="text-sm text-brand-dark font-semibold mb-1">
                                {deliverable.file_name}
                            </p>
                            <p className="text-xs text-brand-muted">
                                Preview not available for this file type
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer — actions */}
                <div className="flex items-center gap-3 px-6 py-4 border-t border-brand-border/40">
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                const resp = await fetch(url);
                                const blob = await resp.blob();
                                const blobUrl = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = blobUrl;
                                a.download = deliverable.file_name;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                URL.revokeObjectURL(blobUrl);
                            } catch {
                                window.open(url, "_blank");
                            }
                        }}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_32px_rgba(240,138,17,0.55)] transition-all duration-200 hover:-translate-y-0.5"
                    >
                        ⬇️ Download
                    </button>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 text-sm font-semibold text-brand-dark border border-brand-border/60 rounded-xl hover:border-brand-dark/30 hover:shadow-sm transition-all"
                    >
                        ↗ Open in New Tab
                    </a>
                </div>
            </div>
        </div>
    );
}

/* ── Upload Modal ──────────────────────────────────── */
function UploadModal({
    milestoneId,
    milestoneName,
    token,
    onClose,
    onUploaded,
}: {
    milestoneId: string;
    milestoneName: string;
    token: string;
    onClose: () => void;
    onUploaded: () => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [description, setDescription] = useState("");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleUpload() {
        if (!file) return;
        setUploading(true);
        setError(null);

        try {
            // Upload file via attachments endpoint to get a real URL
            const fd = new FormData();
            fd.append("entity_type", "milestone");
            fd.append("entity_id", milestoneId);
            fd.append("files[]", file);

            const uploadRes = await fetch(`${API}/attachments/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });

            let fileUrlValue = "";
            if (uploadRes.ok) {
                const uploadJson = await uploadRes.json();
                const uploaded = uploadJson.data?.[0];
                fileUrlValue = uploaded?.file_url || uploaded?.url || uploaded?.path || "";
            }

            if (!fileUrlValue) {
                throw new Error("File upload failed — no URL returned");
            }

            // Register as deliverable
            const res = await fetch(`${API}/milestones/${milestoneId}/deliverables`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    file_name: file.name,
                    file_url: fileUrlValue,
                    file_size: file.size,
                    mime_type: file.type || "application/octet-stream",
                    notes: description || null,
                    version: 1,
                }),
            });

            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.message || "Failed to register deliverable");
            }

            onUploaded();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-xl border border-brand-border/60 w-full max-w-lg mx-4 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-brand-dark">📤 Upload Deliverable</h3>
                    <button onClick={onClose} className="text-brand-muted hover:text-brand-dark text-xl">✕</button>
                </div>

                <p className="text-xs text-brand-muted mb-4">
                    For milestone: <span className="font-semibold text-brand-dark">{milestoneName}</span>
                </p>

                {/* File drop area */}
                <label
                    className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-4 ${
                        file ? "border-brand-orange bg-brand-orange/5" : "border-brand-border/60 hover:border-brand-orange/40 hover:bg-brand-orange/5"
                    }`}
                >
                    <input
                        type="file"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    {file ? (
                        <div>
                            <span className="text-2xl">{getFileIcon(file.type)}</span>
                            <p className="text-sm font-semibold text-brand-dark mt-2">{file.name}</p>
                            <p className="text-xs text-brand-muted">{fmtSize(file.size)}</p>
                        </div>
                    ) : (
                        <div>
                            <span className="text-3xl">📁</span>
                            <p className="text-sm text-brand-muted mt-2">Click to select a file or drag & drop</p>
                            <p className="text-xs text-brand-muted/60 mt-1">Max 20MB — Images, PDFs, ZIPs, Docs</p>
                        </div>
                    )}
                </label>

                {/* Description */}
                <div className="mb-4">
                    <label className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wide">
                        Description (optional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description of this deliverable..."
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-brand-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange text-brand-dark placeholder:text-brand-muted/50 resize-none"
                    />
                </div>

                {error && (
                    <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
                        ⚠️ {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 text-sm font-semibold text-brand-dark border border-brand-border/60 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="flex-1 py-2.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
                    >
                        {uploading ? "Uploading..." : "Upload"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Deliverable card ──────────────────────────────── */
function DeliverableCard({ d, onPreview }: { d: Deliverable; onPreview: () => void }) {
    return (
        <div
            className="flex items-center gap-3 bg-white rounded-xl border border-brand-border/40 p-3 hover:border-brand-orange/40 hover:shadow-sm transition-all cursor-pointer group"
            onClick={onPreview}
        >
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-xl shrink-0">
                {getFileIcon(d.mime_type)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-brand-dark truncate">{d.file_name}</span>
                    {d.version > 1 && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-violet-100 text-violet-600 rounded-full">
                            v{d.version}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-brand-muted">{fmtSize(d.file_size)}</span>
                    <span className="text-[11px] text-brand-muted">{fmtDate(d.created_at)} {fmtTime(d.created_at)}</span>
                    {d.notes && (
                        <span className="text-[11px] text-brand-muted truncate max-w-[200px]">{d.notes}</span>
                    )}
                </div>
            </div>
            <span className="px-3 py-1.5 text-xs font-semibold text-brand-orange bg-brand-orange/10 border border-brand-orange/20 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                👁️ Preview
            </span>
        </div>
    );
}

/* ── Main page content ─────────────────────────────── */
function DeliverablesContent() {
    const params = useSearchParams();
    const { user, token } = useAuth();
    const [milestones, setMilestones] = useState<MilestoneWithDeliverables[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadModal, setUploadModal] = useState<{ id: string; name: string } | null>(null);
    const [previewDel, setPreviewDel] = useState<Deliverable | null>(null);

    const activeTab = params.get("tab") || "all";

    const fetchData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);

        try {
            const msRes = await fetch(`${API}/milestones/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const msJson = await msRes.json();
            const msList: Milestone[] = msJson.data ?? [];

            // Fetch deliverables for each milestone in parallel
            const enriched = await Promise.all(
                msList.map(async (ms) => {
                    try {
                        const dRes = await fetch(`${API}/milestones/${ms.id}/deliverables`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const dJson = await dRes.json();
                        return { ...ms, deliverables: dJson.data ?? [] };
                    } catch {
                        return { ...ms, deliverables: [] };
                    }
                })
            );

            setMilestones(enriched);
        } catch {
            setError("Failed to load deliverables.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    /* Filter */
    const filtered = useMemo(() => {
        if (activeTab === "all") return milestones;
        return milestones.filter((m) => m.status === activeTab);
    }, [milestones, activeTab]);

    /* Stats */
    const stats = useMemo(() => {
        const totalDeliverables = milestones.reduce((s, m) => s + m.deliverables.length, 0);
        const withDeliverables = milestones.filter((m) => m.deliverables.length > 0).length;
        const pendingReview = milestones.filter((m) => m.status === "submitted").length;
        const needsRevision = milestones.filter((m) => m.status === "revision_requested").length;
        return { totalDeliverables, withDeliverables, pendingReview, needsRevision };
    }, [milestones]);

    const isFreelancer = user?.role === "freelancer";

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
                    📦 Deliverables
                </h1>
                <p className="text-sm text-brand-muted mt-1">
                    {isFreelancer
                        ? "Manage your file submissions and track client approvals across all milestones."
                        : "Review and approve deliverables submitted by freelancers."}
                </p>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-white rounded-2xl border border-brand-border/60 p-4 text-center">
                    <div className="text-2xl font-extrabold text-brand-dark">{stats.totalDeliverables}</div>
                    <div className="text-xs text-brand-muted mt-0.5">Total Files</div>
                </div>
                <div className="bg-white rounded-2xl border border-brand-border/60 p-4 text-center">
                    <div className="text-2xl font-extrabold text-blue-600">{stats.withDeliverables}</div>
                    <div className="text-xs text-brand-muted mt-0.5">Milestones with Files</div>
                </div>
                <div className="bg-white rounded-2xl border border-brand-border/60 p-4 text-center">
                    <div className="text-2xl font-extrabold text-violet-600">{stats.pendingReview}</div>
                    <div className="text-xs text-brand-muted mt-0.5">Pending Review</div>
                </div>
                <div className="bg-white rounded-2xl border border-brand-border/60 p-4 text-center">
                    <div className="text-2xl font-extrabold text-orange-500">{stats.needsRevision}</div>
                    <div className="text-xs text-brand-muted mt-0.5">Needs Revision</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 overflow-x-auto scrollbar-hide bg-white rounded-xl border border-brand-border/60 p-1">
                {TABS.map((tab) => {
                    const count = tab.key === "all"
                        ? milestones.length
                        : milestones.filter((m) => m.status === tab.key).length;
                    return (
                        <Link
                            key={tab.key}
                            href={tab.key === "all" ? "/dashboard/deliverables" : `/dashboard/deliverables?tab=${tab.key}`}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                activeTab === tab.key
                                    ? "bg-brand-orange text-white shadow-sm"
                                    : "text-brand-muted hover:text-brand-dark hover:bg-gray-50"
                            }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                activeTab === tab.key
                                    ? "bg-white/25 text-white"
                                    : "bg-gray-100 text-brand-muted"
                            }`}>
                                {count}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
                    ⚠️ {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin h-8 w-8 border-3 border-brand-orange border-t-transparent rounded-full" />
                </div>
            )}

            {/* Empty */}
            {!loading && filtered.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-brand-border/60">
                    <span className="text-5xl">📭</span>
                    <h3 className="text-lg font-bold text-brand-dark mt-4">No deliverables yet</h3>
                    <p className="text-sm text-brand-muted mt-1">
                        {activeTab === "all"
                            ? "When you have active milestones, you can upload deliverables here."
                            : "No milestones with this status."}
                    </p>
                </div>
            )}

            {/* Milestone cards with deliverables */}
            {!loading && filtered.length > 0 && (
                <div className="space-y-4">
                    {filtered.map((ms) => {
                        const sc = STATUS_CONFIG[ms.status] || STATUS_CONFIG.pending;
                        return (
                            <div key={ms.id} className="bg-white rounded-2xl border border-brand-border/60 overflow-hidden">
                                {/* Milestone header */}
                                <div className="p-5 border-b border-brand-border/40">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span
                                                    className="px-2 py-0.5 text-[10px] font-bold rounded-full"
                                                    style={{ color: sc.color, background: sc.bg }}
                                                >
                                                    {sc.icon} {sc.label}
                                                </span>
                                                {ms.revision_count > 0 && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-50 text-orange-600 rounded-full">
                                                        {ms.revision_count} revision{ms.revision_count > 1 ? "s" : ""}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-base font-bold text-brand-dark mt-1.5">{ms.title}</h3>
                                            {ms.description && (
                                                <p className="text-xs text-brand-muted mt-0.5 line-clamp-2">{ms.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 mt-2 text-xs text-brand-muted">
                                                <Link
                                                    href={`/dashboard/contracts/${ms.contract_id}`}
                                                    className="hover:text-brand-orange transition-colors"
                                                >
                                                    📄 {ms.contract_title}
                                                </Link>
                                                <span>👤 {isFreelancer ? ms.client_name : ms.freelancer_name}</span>
                                                <span className="font-semibold text-brand-dark">{fmtMoney(ms.amount, ms.currency)}</span>
                                                {ms.due_date && (
                                                    <span>📅 Due {fmtDate(ms.due_date)}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Upload button */}
                                        {isFreelancer && ["in_progress", "revision_requested"].includes(ms.status) && (
                                            <button
                                                onClick={() => setUploadModal({ id: ms.id, name: ms.title })}
                                                className="shrink-0 px-4 py-2 text-xs font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl transition-colors shadow-sm"
                                            >
                                                📤 Upload
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Deliverables list */}
                                <div className="p-4">
                                    {ms.deliverables.length === 0 ? (
                                        <div className="text-center py-6">
                                            <span className="text-2xl">📁</span>
                                            <p className="text-xs text-brand-muted mt-1.5">
                                                No files uploaded yet.
                                                {isFreelancer && ["in_progress", "revision_requested"].includes(ms.status) && (
                                                    <button
                                                        onClick={() => setUploadModal({ id: ms.id, name: ms.title })}
                                                        className="text-brand-orange font-semibold hover:underline ml-1"
                                                    >
                                                        Upload now →
                                                    </button>
                                                )}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-semibold text-brand-muted uppercase tracking-wider">
                                                    {ms.deliverables.length} file{ms.deliverables.length > 1 ? "s" : ""} uploaded
                                                </span>
                                            </div>
                                            {ms.deliverables.map((d) => (
                                                <DeliverableCard
                                                    key={d.id}
                                                    d={d}
                                                    onPreview={() => setPreviewDel(d)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Preview modal */}
            {previewDel && (
                <PreviewModal
                    deliverable={previewDel}
                    onClose={() => setPreviewDel(null)}
                />
            )}

            {/* Upload modal */}
            {uploadModal && token && (
                <UploadModal
                    milestoneId={uploadModal.id}
                    milestoneName={uploadModal.name}
                    token={token}
                    onClose={() => setUploadModal(null)}
                    onUploaded={fetchData}
                />
            )}
        </div>
    );
}

/* ── Export with Suspense ───────────────────────────── */
export default function DeliverablesPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin h-8 w-8 border-3 border-brand-orange border-t-transparent rounded-full" />
                </div>
            }
        >
            <DeliverablesContent />
        </Suspense>
    );
}
