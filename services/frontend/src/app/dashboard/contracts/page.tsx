"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ContractCard, Contract, API } from "@/components/contracts";

/* ── Tab config ────────────────────────────────────── */
const TABS = [
    { key: "all", label: "All Contracts", statuses: [] as string[] },
    { key: "active", label: "Active", statuses: ["active"] },
    { key: "completed", label: "Completed", statuses: ["completed"] },
    { key: "disputed", label: "Disputed", statuses: ["disputed"] },
    { key: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
];

/* ── Page ───────────────────────────────────────────── */
export default function ContractsPage() {
    const { token, user } = useAuth();
    const searchParams = useSearchParams();
    const isClient = user?.role === "client";

    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    /* active tab from URL */
    const statusParam = searchParams.get("status") ?? "";
    const activeTab =
        TABS.find((t) => t.statuses.length > 0 && t.statuses.includes(statusParam))?.key ?? "all";

    /* fetch contracts */
    useEffect(() => {
        if (!token) return;
        setLoading(true);
        const url = statusParam ? `${API}/contracts?status=${statusParam}` : `${API}/contracts`;

        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const json = await r.json();
                setContracts(json.data ?? []);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [token, statusParam]);

    /* client-side search filter */
    const filtered = useMemo(() => {
        if (!search.trim()) return contracts;
        const q = search.toLowerCase();
        return contracts.filter(
            (c) =>
                c.title.toLowerCase().includes(q) ||
                c.job_title?.toLowerCase().includes(q) ||
                c.client_name?.toLowerCase().includes(q) ||
                c.freelancer_name?.toLowerCase().includes(q)
        );
    }, [contracts, search]);

    return (
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    📄 Contracts
                </h1>
                <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
                    {isClient ? "Manage your freelancer contracts" : "Your active and past contracts"}
                </p>
            </div>

            {/* Tabs */}
            <div
                style={{
                    display: "flex",
                    gap: "0.25rem",
                    background: "#f1f5f9",
                    borderRadius: 12,
                    padding: 4,
                    marginBottom: "1.25rem",
                    overflowX: "auto",
                }}
            >
                {TABS.map((tab) => {
                    const isActive = tab.key === activeTab;
                    const href =
                        tab.statuses.length > 0
                            ? `/dashboard/contracts?status=${tab.statuses[0]}`
                            : "/dashboard/contracts";
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
                            }}
                        >
                            {tab.label}
                        </Link>
                    );
                })}
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: "1.25rem" }}>
                <span
                    style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "1rem",
                        color: "#94a3b8",
                        pointerEvents: "none",
                    }}
                >
                    🔍
                </span>
                <input
                    type="text"
                    placeholder="Search contracts…"
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
                    <p style={{ margin: 0 }}>Loading contracts…</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div
                    style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: 12,
                        padding: "1rem 1.25rem",
                        color: "#dc2626",
                        fontSize: "0.875rem",
                        marginBottom: "1rem",
                    }}
                >
                    ⚠️ {error}
                </div>
            )}

            {/* Empty */}
            {!loading && !error && filtered.length === 0 && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "4rem 2rem",
                        background: "#ffffff",
                        borderRadius: 16,
                        border: "1px solid #e2e8f0",
                    }}
                >
                    <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📄</div>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.25rem" }}>
                        No contracts found
                    </h3>
                    <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
                        {search
                            ? "Try adjusting your search terms"
                            : isClient
                                ? "Accept a proposal to create your first contract"
                                : "When a client accepts your proposal, a contract will appear here"}
                    </p>
                </div>
            )}

            {/* Contract list */}
            {!loading && filtered.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {filtered.map((c) => (
                        <ContractCard key={c.id} contract={c} isClient={isClient ?? false} />
                    ))}
                </div>
            )}
        </div>
    );
}
