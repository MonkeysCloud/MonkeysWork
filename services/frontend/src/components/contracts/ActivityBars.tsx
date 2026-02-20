"use client";

import { styles } from "./types";

interface ScreenshotData {
    id: string;
    file_url: string;
    click_count: number;
    key_count: number;
    activity_percent: number;
    captured_at: string;
}

interface Props {
    screenshots: ScreenshotData[];
    /** Show bars only – no minute labels, just activity representation */
}

/**
 * Horizontal bar chart showing activity level per screenshot interval.
 * Each bar = one screenshot interval. Height ∝ activity_percent.
 * Color: green (≥60%), yellow (30-60%), red (<30%).
 */
export default function ActivityBars({ screenshots }: Props) {
    if (screenshots.length === 0) return null;

    const maxH = 48; // max bar height in px

    return (
        <div style={{ ...styles.card, padding: "0.75rem 1rem" }}>
            <p
                style={{
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    color: "#8b8fa3",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "0.5rem",
                }}
            >
                Activity Level
            </p>
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 3,
                    height: maxH + 4,
                }}
            >
                {screenshots.map((ss) => {
                    const pct = parseFloat(String(ss.activity_percent));
                    const h = Math.max(3, (pct / 100) * maxH);
                    const color =
                        pct >= 60
                            ? "#16a34a"
                            : pct >= 30
                                ? "#eab308"
                                : "#ef4444";

                    return (
                        <div
                            key={ss.id}
                            title={`${Math.round(pct)}% · ${ss.click_count} clicks · ${ss.key_count} keys`}
                            style={{
                                flex: 1,
                                minWidth: 6,
                                maxWidth: 24,
                                height: h,
                                borderRadius: 3,
                                background: color,
                                opacity: 0.85,
                                transition: "height 0.3s ease",
                                cursor: "default",
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}
