"use client";

import { useEffect, useState, useCallback } from "react";
import { Milestone, Deliverable, formatDate, styles, API, FILE_HOST } from "./types";

interface Props {
    milestones: Milestone[];
    token: string;
}

export default function DeliverablesList({ milestones, token }: Props) {
    const [deliverables, setDeliverables] = useState<Record<string, Deliverable[]>>({});

    const fetchAll = useCallback(async () => {
        if (!token) return;
        const results: Record<string, Deliverable[]> = {};
        await Promise.all(
            milestones.map(async (m) => {
                try {
                    const r = await fetch(`${API}/milestones/${m.id}/deliverables`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const j = await r.json();
                    results[m.id] = j.data ?? [];
                } catch {
                    results[m.id] = [];
                }
            })
        );
        setDeliverables(results);
    }, [token, milestones]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    if (milestones.length === 0) {
        return (
            <div style={{ ...styles.card, textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                <div style={{ fontSize: "2rem" }}>📁</div>
                <p>No milestones to show deliverables for</p>
            </div>
        );
    }

    return (
        <div>
            {milestones.map((m) => {
                const dls = deliverables[m.id] ?? [];
                return (
                    <div key={m.id} style={styles.card}>
                        <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
                            {m.title}
                        </h4>

                        {dls.length === 0 && (
                            <p style={{ color: "#94a3b8", fontSize: "0.8125rem", margin: 0 }}>
                                No deliverables uploaded
                            </p>
                        )}

                        {dls.map((d) => (
                            <div
                                key={d.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                    padding: "0.5rem 0",
                                    borderTop: "1px solid #f1f5f9",
                                    fontSize: "0.8125rem",
                                }}
                            >
                                <span style={{ fontSize: "1.25rem" }}>📎</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <a
                                        href={`${FILE_HOST}${d.file_url ?? d.url ?? ""}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}
                                    >
                                        {d.file_name ?? d.filename ?? "file"}
                                    </a>
                                    <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                                        v{d.version} · {d.uploader_name ?? "Unknown"} · {formatDate(d.created_at)}
                                    </div>
                                    {(d.notes ?? d.description) && (
                                        <div style={{ color: "#475569", marginTop: 2 }}>
                                            {d.notes ?? d.description}
                                        </div>
                                    )}
                                </div>
                                <a
                                    href={`${FILE_HOST}${d.file_url ?? d.url ?? ""}`}
                                    download
                                    style={{ ...styles.btnOutline, padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                                >
                                    ⬇ Download
                                </a>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}
