"use client";

import Link from "next/link";
import { Contract, CONTRACT_STATUS, formatDate, formatMoney } from "./types";

interface Props {
    contract: Contract;
    isClient: boolean;
}

export default function ContractCard({ contract: c, isClient }: Props) {
    const st = CONTRACT_STATUS[c.status] ?? CONTRACT_STATUS.active;
    const counterparty = isClient ? c.freelancer_name : c.client_name;
    const counterpartyLabel = isClient ? "Freelancer" : "Client";

    return (
        <Link
            href={`/dashboard/contracts/${c.id}`}
            style={{
                display: "block",
                background: "#ffffff",
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                padding: "1.25rem 1.5rem",
                textDecoration: "none",
                color: "inherit",
                transition: "all 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#6366f1";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(99,102,241,0.12)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
        >
            {/* Title + status */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.75rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.4 }}>
                        {c.title || c.job_title}
                    </h3>
                    {c.job_title && c.title !== c.job_title && (
                        <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "0.15rem 0 0" }}>{c.job_title}</p>
                    )}
                </div>
                <span style={{
                    display: "inline-flex", alignItems: "center", gap: "0.25rem",
                    padding: "0.25rem 0.625rem", borderRadius: 999,
                    fontSize: "0.75rem", fontWeight: 600,
                    background: st.bg, color: st.fg,
                    whiteSpace: "nowrap", flexShrink: 0,
                }}>
                    {st.icon} {st.label}
                </span>
            </div>

            {/* Info row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1.5rem", fontSize: "0.8125rem", color: "#64748b" }}>
                {counterparty && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        👤 {counterpartyLabel}: <strong style={{ color: "#334155" }}>{counterparty}</strong>
                    </span>
                )}
                <span>{c.contract_type === "hourly" ? "⏰ Hourly" : "💼 Fixed Price"}</span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>💰 {formatMoney(c.total_amount, c.currency)}</span>
                {c.contract_type === "hourly" && c.hourly_rate && (
                    <span>📊 {formatMoney(c.hourly_rate, c.currency)}/hr{c.weekly_hour_limit ? ` (${c.weekly_hour_limit}h/wk)` : ""}</span>
                )}
                <span>📅 Started {formatDate(c.started_at)}</span>
                {c.completed_at && <span>✅ Completed {formatDate(c.completed_at)}</span>}
            </div>
        </Link>
    );
}
