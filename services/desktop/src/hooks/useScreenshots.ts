import { useEffect, useRef, useCallback, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { api } from "@/lib/api";

const API_BASE = "http://localhost:8086/api/v1";

interface UseScreenshotsOptions {
    /** Is a timer currently running? */
    isRunning: boolean;
    /** Active time entry ID */
    entryId?: string;
    /** Min interval in ms (default 5 min) */
    minInterval?: number;
    /** Max interval in ms (default 10 min) */
    maxInterval?: number;
    /** Called when user is idle for N consecutive screenshots (default: 2) */
    onIdle?: () => void;
    /** Number of consecutive idle screenshots before calling onIdle (default: 2) */
    idleThreshold?: number;
}

export interface Screenshot {
    id?: string;
    timestamp: string;
    url: string;
    click_count: number;
    key_count: number;
    activity_percent: number;
}

export interface ActivityCounters {
    clicks: number;
    keys: number;
}

interface UseScreenshotsReturn {
    screenshots: Screenshot[];
    lastCapture: string | null;
    captureNow: () => Promise<void>;
    /** Live counters since last screenshot */
    counters: ActivityCounters;
    /** Number of consecutive idle screenshots (0 clicks + 0 keys) */
    idleStreak: number;
}

/**
 * Upload a screenshot to the API via /attachments/upload.
 */
async function uploadScreenshot(base64Png: string, entryId: string): Promise<string> {
    const binaryStr = atob(base64Png);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "image/png" });

    const form = new FormData();
    form.append("entity_type", "timeentry");
    form.append("entity_id", entryId);
    const filename = `screenshot-${Date.now()}.png`;
    form.append("files[]", blob, filename);

    const token = localStorage.getItem("mw_token");
    const res = await fetch(`${API_BASE}/attachments/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Upload failed (${res.status})`);
    }

    const json = await res.json();
    const fileUrl = json?.data?.[0]?.file_url;
    if (!fileUrl) throw new Error("No file_url in upload response");
    return fileUrl;
}

export function useScreenshots(opts: UseScreenshotsOptions): UseScreenshotsReturn {
    const {
        isRunning,
        entryId,
        minInterval = 5 * 60_000,
        maxInterval = 10 * 60_000,
        onIdle,
        idleThreshold = 2,
    } = opts;

    const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
    const [lastCapture, setLastCapture] = useState<string | null>(null);
    const [counters, setCounters] = useState<ActivityCounters>({ clicks: 0, keys: 0 });
    const [idleStreak, setIdleStreak] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countersRef = useRef<ActivityCounters>({ clicks: 0, keys: 0 });
    const idleStreakRef = useRef(0);
    const onIdleRef = useRef(onIdle);
    onIdleRef.current = onIdle;

    // ── Poll Rust-side global input counters ──
    useEffect(() => {
        if (!isRunning) {
            countersRef.current = { clicks: 0, keys: 0 };
            setCounters({ clicks: 0, keys: 0 });
            return;
        }

        // Start the global rdev listener (idempotent)
        invoke("start_activity_listener").catch((err: unknown) =>
            console.warn("[activity] failed to start listener:", err)
        );

        // Poll Rust counters every 2s and accumulate
        const interval = setInterval(async () => {
            try {
                const delta: ActivityCounters = await invoke("get_activity_counters");
                countersRef.current.clicks += delta.clicks;
                countersRef.current.keys += delta.keys;
                setCounters({ ...countersRef.current });
            } catch (err) {
                console.warn("[activity] poll error:", err);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [isRunning]);

    const randomDelay = useCallback(
        () => Math.floor(Math.random() * (maxInterval - minInterval)) + minInterval,
        [minInterval, maxInterval]
    );

    const captureNow = useCallback(async () => {
        if (!entryId) return;
        try {
            // 1. Capture screenshot via Rust
            const base64: string = await invoke("capture_screenshot");
            const timestamp = new Date().toISOString();

            // 2. Upload to API
            const fileUrl = await uploadScreenshot(base64, entryId);

            // 3. Grab & reset counters
            const snapped = { ...countersRef.current };
            countersRef.current = { clicks: 0, keys: 0 };
            setCounters({ clicks: 0, keys: 0 });

            const total = snapped.clicks + snapped.keys;
            const actPct = Math.min(100, (total / 100) * 100);

            // Idle detection
            if (total === 0) {
                idleStreakRef.current++;
                setIdleStreak(idleStreakRef.current);
                if (idleStreakRef.current >= idleThreshold && onIdleRef.current) {
                    onIdleRef.current();
                }
            } else {
                idleStreakRef.current = 0;
                setIdleStreak(0);
            }

            setScreenshots((prev) => [
                ...prev,
                {
                    timestamp,
                    url: fileUrl,
                    click_count: snapped.clicks,
                    key_count: snapped.keys,
                    activity_percent: actPct,
                },
            ]);
            setLastCapture(timestamp);

            // 4. Send heartbeat with activity data
            await api("/time/entries/heartbeat", {
                method: "POST",
                body: JSON.stringify({
                    entry_id: entryId,
                    screenshot_url: fileUrl,
                    click_count: snapped.clicks,
                    key_count: snapped.keys,
                    activity_score: Math.round(actPct),
                }),
            });
        } catch (err) {
            console.warn("[screenshots] capture/upload failed:", err);
        }
    }, [entryId]);

    // Schedule random captures while running
    useEffect(() => {
        if (!isRunning || !entryId) {
            if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
            return;
        }

        function scheduleNext() {
            timerRef.current = setTimeout(async () => {
                await captureNow();
                scheduleNext();
            }, randomDelay());
        }

        scheduleNext();

        return () => {
            if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        };
    }, [isRunning, entryId, captureNow, randomDelay]);

    // Clear screenshots and idle streak when timer stops
    useEffect(() => {
        if (!isRunning) {
            setScreenshots([]);
            idleStreakRef.current = 0;
            setIdleStreak(0);
        }
    }, [isRunning]);

    return { screenshots, lastCapture, captureNow, counters, idleStreak };
}
