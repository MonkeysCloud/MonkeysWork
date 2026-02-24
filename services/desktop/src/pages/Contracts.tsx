import { useState, useEffect, useCallback } from "react";
import { Spinner } from "@heroui/react";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet } from "@/lib/api";

/* ── Types ── */
interface Contract {
    id: string;
    title?: string;
    job_title?: string;
    client_id: string;
    freelancer_id: string;
    client_name?: string;
    freelancer_name?: string;
    contract_type: string;
    total_amount: string;
    hourly_rate?: string;
    weekly_hour_limit?: number;
    currency: string;
    status: string;
    started_at: string;
    completed_at?: string;
    created_at: string;
}

interface Milestone {
    id: string;
    title: string;
    description?: string;
    amount: string;
    currency: string;
    status: string;
    sort_order: number;
    due_date?: string;
}

/* ── Status styles (dark-theme) ── */
const STATUS_MAP: Record<string, { label: string; bg: string; fg: string; icon: string }> = {
    active: { label: "Active", bg: "rgba(74,222,128,0.15)", fg: "#4ade80", icon: "🟢" },
    paused: { label: "Paused", bg: "rgba(251,191,36,0.15)", fg: "#fbbf24", icon: "⏸️" },
    completed: { label: "Completed", bg: "rgba(96,165,250,0.15)", fg: "#60a5fa", icon: "✅" },
    disputed: { label: "Disputed", bg: "rgba(248,113,113,0.15)", fg: "#f87171", icon: "⚠️" },
    cancelled: { label: "Cancelled", bg: "rgba(148,163,184,0.15)", fg: "#94a3b8", icon: "❌" },
};

const MS_STATUS: Record<string, { bg: string; fg: string }> = {
    pending: { bg: "rgba(148,163,184,0.15)", fg: "#94a3b8" },
    in_progress: { bg: "rgba(96,165,250,0.15)", fg: "#60a5fa" },
    submitted: { bg: "rgba(251,191,36,0.15)", fg: "#fbbf24" },
    revision_requested: { bg: "rgba(244,114,182,0.15)", fg: "#f472b6" },
    accepted: { bg: "rgba(74,222,128,0.15)", fg: "#4ade80" },
    disputed: { bg: "rgba(248,113,113,0.15)", fg: "#f87171" },
};

const TABS = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Done" },
    { key: "cancelled", label: "Cancelled" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ── Helpers ── */
function formatMoney(amount: string | number, currency = "USD") {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(num);
}

function formatDate(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── Component ── */
export default function Contracts() {
    const { user } = useAuth();
    const isClient = user?.role === "client";

    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>("all");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [milestones, setMilestones] = useState<Record<string, Milestone[]>>({});
    const [loadingMs, setLoadingMs] = useState<string | null>(null);

    /* Fetch contracts */
    useEffect(() => {
        (async () => {
            try {
                const res = await apiGet<{ data: Contract[] }>("/contracts");
                setContracts(res.data || []);
            } catch { /* silent */ }
            setLoading(false);
        })();
    }, []);

    /* Fetch milestones when expanding a contract */
    const toggleExpand = useCallback(async (id: string) => {
        if (expandedId === id) { setExpandedId(null); return; }
        setExpandedId(id);
        if (!milestones[id]) {
            setLoadingMs(id);
            try {
                const res = await apiGet<{ data: Milestone[] }>(`/contracts/${id}/milestones`);
                setMilestones((prev) => ({ ...prev, [id]: res.data || [] }));
            } catch { /* silent */ }
            setLoadingMs(null);
        }
    }, [expandedId, milestones]);

    /* Filter */
    const filtered =
        activeTab === "all"
            ? contracts
            : contracts.filter((c) => c.status === activeTab);

    return (
        <div className="h-full flex flex-col bg-transparent">
            {/* ── Header ── */}
            <div className="flex-shrink-0 px-5 pt-5 pb-3">
                <h2 className="text-lg font-bold text-white mb-3">📄 Contracts</h2>

                {/* Tab bar */}
                <div className="flex gap-1 bg-white/[0.05] rounded-lg p-0.5">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`
                                flex-1 px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-150
                                ${activeTab === tab.key
                                    ? "bg-white/10 text-[#f08a11]"
                                    : "text-white/50 hover:text-white/80"
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── List ── */}
            <div className="flex-1 overflow-y-auto px-5 pb-5">
                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <Spinner size="lg" color="warning" />
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="text-center py-16">
                        <span className="text-3xl block mb-2">📄</span>
                        <p className="text-white/50 text-sm">
                            {activeTab === "all"
                                ? "No contracts yet."
                                : `No ${activeTab} contracts.`}
                        </p>
                    </div>
                )}

                {!loading && filtered.length > 0 && (
                    <div className="space-y-2">
                        {filtered.map((c, i) => {
                            const st = STATUS_MAP[c.status] ?? STATUS_MAP.active;
                            const counterparty = isClient ? c.freelancer_name : c.client_name;
                            const counterLabel = isClient ? "Freelancer" : "Client";
                            const isExpanded = expandedId === c.id;
                            const ms = milestones[c.id];

                            return (
                                <div
                                    key={c.id}
                                    style={{ animation: `mw-fade-in ${0.1 + i * 0.04}s ease-out` }}
                                >
                                    {/* Card */}
                                    <button
                                        onClick={() => toggleExpand(c.id)}
                                        className={`
                                            w-full text-left bg-white/[0.07] rounded-xl border transition-all duration-200 px-4 py-3
                                            ${isExpanded
                                                ? "border-[#f08a11]/40 bg-white/[0.09]"
                                                : "border-white/10 hover:bg-white/[0.10] hover:border-white/20"
                                            }
                                        `}
                                    >
                                        {/* Row 1: title + status */}
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <h3 className="text-sm font-bold text-white truncate flex-1">
                                                {c.title || c.job_title || "Contract"}
                                            </h3>
                                            <span
                                                className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide flex-shrink-0"
                                                style={{ background: st.bg, color: st.fg }}
                                            >
                                                {st.icon} {st.label}
                                            </span>
                                        </div>

                                        {/* Row 2: meta */}
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/50">
                                            {counterparty && (
                                                <span>
                                                    👤 {counterLabel}: <strong className="text-white/70">{counterparty}</strong>
                                                </span>
                                            )}
                                            <span>{c.contract_type === "hourly" ? "⏰ Hourly" : "💼 Fixed"}</span>
                                            <span className="font-semibold text-white/70">
                                                💰 {formatMoney(c.total_amount, c.currency)}
                                            </span>
                                            {c.contract_type === "hourly" && c.hourly_rate && (
                                                <span>
                                                    📊 {formatMoney(c.hourly_rate, c.currency)}/hr
                                                    {c.weekly_hour_limit ? ` (${c.weekly_hour_limit}h/wk)` : ""}
                                                </span>
                                            )}
                                            <span>📅 {formatDate(c.started_at)}</span>
                                        </div>

                                        {/* Expand chevron */}
                                        <div className="text-center mt-1">
                                            <span
                                                className="text-white/30 text-sm inline-block transition-transform duration-200"
                                                style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                                            >
                                                ▼
                                            </span>
                                        </div>
                                    </button>

                                    {/* Expanded: milestones */}
                                    {isExpanded && (
                                        <div
                                            className="ml-3 mt-1 pl-3 border-l-2 border-[#f08a11]/30 space-y-1.5"
                                            style={{ animation: "mw-fade-in 0.2s ease-out" }}
                                        >
                                            <p className="text-xs font-bold text-white/60 uppercase tracking-widest pt-1">
                                                Milestones
                                            </p>

                                            {loadingMs === c.id && (
                                                <div className="py-3 flex justify-center">
                                                    <Spinner size="sm" color="warning" />
                                                </div>
                                            )}

                                            {ms && ms.length === 0 && (
                                                <p className="text-white/50 text-sm py-2">No milestones defined.</p>
                                            )}

                                            {ms && ms.map((m) => {
                                                const mst = MS_STATUS[m.status] ?? MS_STATUS.pending;
                                                return (
                                                    <div
                                                        key={m.id}
                                                        className="bg-white/[0.05] rounded-lg border border-white/[0.06] px-3 py-2"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-sm font-semibold text-white truncate flex-1">
                                                                {m.title}
                                                            </span>
                                                            <span
                                                                className="text-xs px-2 py-0.5 rounded-md font-bold uppercase tracking-wide flex-shrink-0"
                                                                style={{ background: mst.bg, color: mst.fg }}
                                                            >
                                                                {m.status.replace(/_/g, " ")}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-3 mt-1 text-xs text-white/50">
                                                            <span className="font-semibold text-white/60">
                                                                {formatMoney(m.amount, m.currency)}
                                                            </span>
                                                            {m.due_date && <span>Due: {formatDate(m.due_date)}</span>}
                                                        </div>
                                                        {m.description && (
                                                            <p className="text-xs text-white/50 mt-1 line-clamp-2">
                                                                {m.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
