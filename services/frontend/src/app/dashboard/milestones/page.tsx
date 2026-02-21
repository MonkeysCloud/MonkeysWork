"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Types ─────────────────────────────────────────── */
interface Milestone {
    id: string;
    contract_id: string;
    title: string;
    description: string | null;
    amount: string;
    currency: string;
    status: string;
    sort_order: number;
    due_date: string | null;
    started_at: string | null;
    submitted_at: string | null;
    completed_at: string | null;
    revision_count: number;
    escrow_funded: boolean;
    escrow_released: boolean;
    created_at: string;
    updated_at: string;
    contract_title: string;
    contract_status: string;
    client_id: string;
    freelancer_id: string;
    client_name: string;
    freelancer_name: string;
}

interface Summary {
    total: number;
    pending: number;
    in_progress: number;
    submitted: number;
    accepted: number;
    revision_requested: number;
    total_amount: string;
    funded_amount: string;
    released_amount: string;
}

/* ── Tab config ────────────────────────────────────── */
const TABS = [
    { key: "all", label: "All", status: "" },
    { key: "pending", label: "Pending", status: "pending" },
    { key: "in_progress", label: "In Progress", status: "in_progress" },
    { key: "submitted", label: "Submitted", status: "submitted" },
    { key: "revision_requested", label: "Revisions", status: "revision_requested" },
    { key: "accepted", label: "Accepted", status: "accepted" },
];

/* ── Status configuration ──────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    pending: { label: "Pending", color: "#64748b", bg: "#f1f5f9", icon: "⏳" },
    in_progress: { label: "In Progress", color: "#2563eb", bg: "#eff6ff", icon: "🔨" },
    submitted: { label: "Submitted", color: "#7c3aed", bg: "#f5f3ff", icon: "📤" },
    revision_requested: { label: "Revision", color: "#ea580c", bg: "#fff7ed", icon: "🔄" },
    accepted: { label: "Accepted", color: "#16a34a", bg: "#f0fdf4", icon: "✅" },
};

/* ── Helpers ────────────────────────────────────────── */
function fmtMoney(amount: string | number, currency = "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount));
}

function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── Summary card ──────────────────────────────────── */
function SummaryCard({ label, value, sub, icon, accent }: { label: string; value: string | number; sub?: string; icon: string; accent: string }) {
    return (
        <div style={{
            background: "#fff",
            borderRadius: 14,
            padding: "1.25rem",
            border: "1px solid #e2e8f0",
            flex: "1 1 0%",
            minWidth: 150,
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: "1.5rem" }}>{icon}</span>
                <span style={{
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: accent,
                    background: accent + "15",
                    padding: "2px 8px",
                    borderRadius: 20,
                }}>{label}</span>
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>{value}</div>
            {sub && <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
        </div>
    );
}

/* ── Milestone card ────────────────────────────────── */
function MilestoneCard({ ms, isClient }: { ms: Milestone; isClient: boolean }) {
    const sc = STATUS_CONFIG[ms.status] || STATUS_CONFIG.pending;
    const otherParty = isClient ? ms.freelancer_name : ms.client_name;

    return (
        <div style={{
            background: "#ffffff",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            padding: "1.25rem",
            transition: "box-shadow 0.15s, border-color 0.15s",
        }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
        >
            {/* Top row: title + status */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
                        {ms.title}
                    </h3>
                    <Link href={`/dashboard/contracts/${ms.contract_id}`}
                        style={{ fontSize: "0.75rem", color: "#f08a11", textDecoration: "none", fontWeight: 600 }}>
                        {ms.contract_title}
                    </Link>
                </div>
                <span style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    color: sc.color,
                    background: sc.bg,
                    padding: "3px 10px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                }}>
                    {sc.icon} {sc.label}
                </span>
            </div>

            {/* Description */}
            {ms.description && (
                <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "0 0 12px", lineHeight: 1.5 }}>
                    {ms.description.length > 120 ? ms.description.slice(0, 120) + "…" : ms.description}
                </p>
            )}

            {/* Meta row */}
            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                fontSize: "0.75rem",
                color: "#64748b",
                borderTop: "1px solid #f1f5f9",
                paddingTop: 10,
            }}>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.875rem" }}>
                    {fmtMoney(ms.amount, ms.currency)}
                </span>
                <span>👤 {otherParty}</span>
                {ms.due_date && <span>📅 Due {fmtDate(ms.due_date)}</span>}
                {ms.revision_count > 0 && <span>🔄 {ms.revision_count} revision{ms.revision_count > 1 ? "s" : ""}</span>}
                {ms.escrow_funded && !ms.escrow_released && (
                    <span style={{ color: "#2563eb", fontWeight: 600 }}>🔒 Funded</span>
                )}
                {ms.escrow_released && (
                    <span style={{ color: "#16a34a", fontWeight: 600 }}>💸 Released</span>
                )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {isClient && ms.status === "pending" && !ms.escrow_funded && (
                    <ActionBtn label="Fund Escrow" color="#2563eb" />
                )}
                {!isClient && ms.status === "in_progress" && (
                    <ActionBtn label="Submit Work" color="#7c3aed" />
                )}
                {isClient && ms.status === "submitted" && (
                    <>
                        <ActionBtn label="Accept" color="#16a34a" />
                        <ActionBtn label="Request Revision" color="#ea580c" outline />
                    </>
                )}
                <Link
                    href={`/dashboard/contracts/${ms.contract_id}`}
                    style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#64748b",
                        textDecoration: "none",
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        marginLeft: "auto",
                    }}
                >
                    View Contract →
                </Link>
            </div>
        </div>
    );
}

function ActionBtn({ label, color, outline }: { label: string; color: string; outline?: boolean }) {
    return (
        <button
            style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: outline ? color : "#fff",
                background: outline ? "transparent" : color,
                border: `1.5px solid ${color}`,
                padding: "6px 14px",
                borderRadius: 8,
                cursor: "pointer",
            }}
        >
            {label}
        </button>
    );
}

/* ── Main page ─────────────────────────────────────── */
export default function MilestonesPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>Loading…</div>}>
            <MilestonesInner />
        </Suspense>
    );
}

function MilestonesInner() {
    const { token, user } = useAuth();
    const searchParams = useSearchParams();
    const isClient = user?.role === "client";

    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const statusParam = searchParams.get("status") ?? "";
    const activeTab = TABS.find((t) => t.status === statusParam)?.key ?? "all";

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        const url = statusParam
            ? `${API}/milestones/me?status=${statusParam}&per_page=50`
            : `${API}/milestones/me?per_page=50`;

        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const json = await r.json();
                setMilestones(json.data ?? []);
                setSummary(json.summary ?? null);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [token, statusParam]);

    /* Client-side search */
    const filtered = useMemo(() => {
        if (!search.trim()) return milestones;
        const q = search.toLowerCase();
        return milestones.filter(
            (m) =>
                m.title.toLowerCase().includes(q) ||
                m.contract_title?.toLowerCase().includes(q) ||
                m.client_name?.toLowerCase().includes(q) ||
                m.freelancer_name?.toLowerCase().includes(q)
        );
    }, [milestones, search]);

    return (
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    🎯 Milestones
                </h1>
                <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
                    {isClient
                        ? "Track and manage milestones across your contracts"
                        : "View your milestones and submit completed work"}
                </p>
            </div>

            {/* Summary cards */}
            {summary && (
                <div style={{
                    display: "flex",
                    gap: "0.75rem",
                    marginBottom: "1.5rem",
                    overflowX: "auto",
                    paddingBottom: 4,
                }}>
                    <SummaryCard icon="📊" label="Total" value={summary.total} sub={fmtMoney(summary.total_amount)} accent="#0f172a" />
                    <SummaryCard icon="🔨" label="In Progress" value={Number(summary.in_progress) + Number(summary.pending)} sub="Active milestones" accent="#2563eb" />
                    <SummaryCard icon="📤" label="Submitted" value={summary.submitted} sub="Awaiting review" accent="#7c3aed" />
                    <SummaryCard icon="🔒" label="Funded" value={fmtMoney(summary.funded_amount)} sub="In escrow" accent="#f08a11" />
                    <SummaryCard icon="💸" label="Released" value={fmtMoney(summary.released_amount)} sub="Paid out" accent="#16a34a" />
                </div>
            )}

            {/* Tabs */}
            <div style={{
                display: "flex",
                gap: "0.25rem",
                background: "#f1f5f9",
                borderRadius: 12,
                padding: 4,
                marginBottom: "1.25rem",
                overflowX: "auto",
            }}>
                {TABS.map((tab) => {
                    const isActive = tab.key === activeTab;
                    const count =
                        summary && tab.key !== "all"
                            ? Number((summary as unknown as Record<string, unknown>)[tab.status] ?? 0)
                            : undefined;
                    const href = tab.status
                        ? `/dashboard/milestones?status=${tab.status}`
                        : "/dashboard/milestones";

                    return (
                        <Link
                            key={tab.key}
                            href={href}
                            style={{
                                padding: "0.5rem 1rem",
                                borderRadius: 8,
                                fontSize: "0.8125rem",
                                fontWeight: isActive ? 600 : 500,
                                color: isActive ? "#0f172a" : "#64748b",
                                background: isActive ? "#ffffff" : "transparent",
                                boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                textDecoration: "none",
                                whiteSpace: "nowrap",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            {tab.label}
                            {count !== undefined && count > 0 && (
                                <span style={{
                                    fontSize: "0.625rem",
                                    fontWeight: 700,
                                    background: isActive ? "#f08a11" : "#cbd5e1",
                                    color: isActive ? "#fff" : "#64748b",
                                    padding: "1px 6px",
                                    borderRadius: 10,
                                    minWidth: 18,
                                    textAlign: "center",
                                }}>{count}</span>
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: "1.25rem" }}>
                <span style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "1rem",
                    color: "#94a3b8",
                    pointerEvents: "none",
                }}>🔍</span>
                <input
                    type="text"
                    placeholder="Search milestones…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "0.625rem 0.75rem 0.625rem 2.25rem",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.875rem",
                        background: "#ffffff",
                        outline: "none",
                    }}
                />
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
                    <p style={{ margin: 0 }}>Loading milestones…</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 12,
                    padding: "1rem 1.25rem",
                    color: "#dc2626",
                    fontSize: "0.875rem",
                    marginBottom: "1rem",
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Empty */}
            {!loading && !error && filtered.length === 0 && (
                <div style={{
                    textAlign: "center",
                    padding: "4rem 2rem",
                    background: "#ffffff",
                    borderRadius: 16,
                    border: "1px solid #e2e8f0",
                }}>
                    <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🎯</div>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.25rem" }}>
                        No milestones found
                    </h3>
                    <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
                        {search
                            ? "Try adjusting your search terms"
                            : statusParam
                                ? "No milestones with this status"
                                : isClient
                                    ? "Milestones will appear when you create a contract with milestone-based payment"
                                    : "Milestones will appear once a contract is set up with milestone payments"}
                    </p>
                </div>
            )}

            {/* Milestone list */}
            {!loading && filtered.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {filtered.map((ms) => (
                        <MilestoneCard key={ms.id} ms={ms} isClient={isClient ?? false} />
                    ))}
                </div>
            )}
        </div>
    );
}
