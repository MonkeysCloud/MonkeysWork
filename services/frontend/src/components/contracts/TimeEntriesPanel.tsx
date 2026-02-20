"use client";

import { useState, useEffect, useCallback } from "react";
import TimeEntryScreenshots from "./TimeEntryScreenshots";
import TimeEntryClaims from "./TimeEntryClaims";
import ActivityBars from "./ActivityBars";
import { styles, API, FILE_HOST, formatDate } from "./types";

interface TimeEntry {
    id: string;
    contract_id: string;
    task_label?: string;
    started_at: string;
    ended_at?: string;
    duration_minutes: number;
    hourly_rate: string;
    amount: string;
    activity_score?: string;
    status: string;
}

interface ScreenshotData {
    id: string;
    file_url: string;
    click_count: number;
    key_count: number;
    activity_percent: number;
    captured_at: string;
}

interface Claim {
    id: string;
    type: string;
    message: string;
    status: string;
    response?: string;
    resolved_at?: string;
    created_at: string;
}

interface Props {
    contractId: string;
    isClient: boolean;
    token: string;
}

export default function TimeEntriesPanel({ contractId, isClient, token }: Props) {
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
    const [screenshots, setScreenshots] = useState<Record<string, ScreenshotData[]>>({});
    const [claims, setClaims] = useState<Record<string, Claim[]>>({});

    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const fetchEntries = useCallback(async () => {
        try {
            const r = await fetch(`${API}/time/entries?contract_id=${contractId}`, { headers: { Authorization: `Bearer ${token}` } });
            const j = await r.json();
            setEntries(j.data ?? []);
        } catch { /* silent */ }
        setLoading(false);
    }, [contractId, token]);

    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    async function fetchScreenshots(entryId: string) {
        try {
            const r = await fetch(`${API}/time/entries/${entryId}/screenshots`, { headers: { Authorization: `Bearer ${token}` } });
            const j = await r.json();
            setScreenshots((prev) => ({ ...prev, [entryId]: j.data ?? [] }));
        } catch { /* silent */ }
    }

    async function fetchClaims(entryId: string) {
        try {
            const r = await fetch(`${API}/time/entries/${entryId}/claims`, { headers: { Authorization: `Bearer ${token}` } });
            const j = await r.json();
            setClaims((prev) => ({ ...prev, [entryId]: j.data ?? [] }));
        } catch { /* silent */ }
    }

    function toggleExpand(entryId: string) {
        if (expandedEntry === entryId) {
            setExpandedEntry(null);
        } else {
            setExpandedEntry(entryId);
            if (!screenshots[entryId]) fetchScreenshots(entryId);
            if (!claims[entryId]) fetchClaims(entryId);
        }
    }

    function fmtTime(iso?: string) {
        if (!iso) return "—";
        try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
        catch { return "—"; }
    }

    function fmtDuration(mins: number) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    const statusStyle: Record<string, { bg: string; fg: string }> = {
        logged: { bg: "#eff6ff", fg: "#3b82f6" },
        approved: { bg: "#dcfce7", fg: "#15803d" },
        disputed: { bg: "#fef3c7", fg: "#92400e" },
        rejected: { bg: "#fef2f2", fg: "#dc2626" },
        running: { bg: "#f0e7fe", fg: "#7c3aed" },
    };

    if (loading) {
        return <p style={{ textAlign: "center", color: "#94a3b8", padding: "2rem 0" }}>Loading time entries…</p>;
    }

    if (entries.length === 0) {
        return (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏱</div>
                <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>No time entries yet for this contract.</p>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {entries.map((entry) => {
                const isExp = expandedEntry === entry.id;
                const ss = statusStyle[entry.status] ?? statusStyle.logged;

                return (
                    <div key={entry.id} style={{ ...styles.card, padding: 0, overflow: "hidden" }}>
                        {/* Entry row (clickable) */}
                        <div
                            onClick={() => toggleExpand(entry.id)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "0.875rem 1.25rem",
                                cursor: "pointer",
                                background: isExp ? "#f8fafc" : "#fff",
                                transition: "background 0.15s",
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>
                                        {entry.task_label || "Time Entry"}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "0.625rem",
                                            fontWeight: 700,
                                            padding: "2px 8px",
                                            borderRadius: 999,
                                            background: ss.bg,
                                            color: ss.fg,
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        {entry.status}
                                    </span>
                                </div>
                                <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                                    {formatDate(entry.started_at)} · {fmtTime(entry.started_at)} → {fmtTime(entry.ended_at)}
                                </span>
                            </div>
                            <div style={{ textAlign: "right", marginLeft: "1rem" }}>
                                <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                    {fmtDuration(entry.duration_minutes)}
                                </p>
                                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#f08a11", margin: 0 }}>
                                    ${parseFloat(entry.amount).toFixed(2)}
                                </p>
                            </div>
                            <span style={{ marginLeft: "0.75rem", fontSize: "0.75rem", color: "#94a3b8", transition: "transform 0.2s", transform: isExp ? "rotate(180deg)" : "rotate(0)" }}>
                                ▼
                            </span>
                        </div>

                        {/* Expanded panel */}
                        {isExp && (
                            <div style={{ borderTop: "1px solid #f1f5f9", padding: "1rem 1.25rem" }}>
                                {/* Activity Bars */}
                                {screenshots[entry.id] && screenshots[entry.id].length > 0 && (
                                    <div style={{ marginBottom: "1rem" }}>
                                        <ActivityBars screenshots={screenshots[entry.id]} />
                                    </div>
                                )}

                                {/* Screenshots grid */}
                                <div style={{ marginBottom: "1rem" }}>
                                    <h4 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.5rem" }}>
                                        📸 Screenshots
                                    </h4>
                                    <TimeEntryScreenshots
                                        entryId={entry.id}
                                        screenshots={screenshots[entry.id] ?? []}
                                        isFreelancer={!isClient}
                                        apiOrigin={FILE_HOST}
                                        onDeleted={() => {
                                            fetchScreenshots(entry.id);
                                            fetchEntries(); // refresh duration/amount
                                        }}
                                    />
                                </div>

                                {/* Claims */}
                                <TimeEntryClaims
                                    entryId={entry.id}
                                    claims={claims[entry.id] ?? []}
                                    isClient={isClient}
                                    onUpdated={() => fetchClaims(entry.id)}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
