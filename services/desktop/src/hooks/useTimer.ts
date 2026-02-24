import { useState, useEffect, useRef, useCallback } from "react";
import { api, apiGet } from "@/lib/api";

export interface TimeEntry {
    id: string;
    contract_id: string;
    contract_title?: string;
    freelancer_id: string;
    started_at: string;
    ended_at?: string;
    duration_minutes?: number;
    amount?: string;
    status: "running" | "logged" | "approved" | "rejected";
    description?: string;
    task_label?: string;
    hourly_rate?: string;
    elapsed_minutes?: number;
    screenshot_urls?: string[];
}

export interface EntryFilters {
    from?: string;   // ISO date
    to?: string;     // ISO date
    contractId?: string;
    status?: string;
}

interface UseTimerReturn {
    isRunning: boolean;
    activeEntry: TimeEntry | null;
    elapsed: number; // seconds
    todayEntries: TimeEntry[];
    recentEntries: TimeEntry[];
    recentLoading: boolean;
    start: (contractId: string, taskLabel?: string, description?: string) => Promise<void>;
    stop: () => Promise<void>;
    refreshEntries: () => Promise<void>;
    fetchRecentEntries: (filters?: EntryFilters) => Promise<void>;
    error: string | null;
}

export function useTimer(): UseTimerReturn {
    const [isRunning, setIsRunning] = useState(false);
    const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
    const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
    const [recentLoading, setRecentLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Calculate elapsed from started_at
    const calcElapsed = useCallback((startedAt: string) => {
        if (!startedAt) return 0;
        // Normalize PostgreSQL timestamps: "2026-02-20 18:47:00+00" → "2026-02-20T18:47:00+00"
        let s = startedAt.replace(" ", "T");
        if (!s.includes("Z") && !/[+-]\d{2}(:\d{2})?$/.test(s)) {
            s += "Z";
        }
        const start = new Date(s).getTime();
        if (isNaN(start)) return 0;
        return Math.max(0, Math.floor((Date.now() - start) / 1000));
    }, []);

    // Start ticking
    const startTick = useCallback((startedAt: string) => {
        if (tickRef.current) clearInterval(tickRef.current);
        setElapsed(calcElapsed(startedAt));
        tickRef.current = setInterval(() => {
            setElapsed(calcElapsed(startedAt));
        }, 1000);
    }, [calcElapsed]);

    const stopTick = useCallback(() => {
        if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
        if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
    }, []);

    // Start heartbeat (every 60s)
    const startHeartbeat = useCallback((entryId: string) => {
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        heartbeatRef.current = setInterval(async () => {
            try {
                await api("/time/entries/heartbeat", {
                    method: "POST",
                    body: JSON.stringify({ entry_id: entryId }),
                });
            } catch { /* silent */ }
        }, 60_000);
    }, []);

    // Check for running timer on mount
    useEffect(() => {
        async function checkRunning() {
            try {
                const res = await apiGet<{ data: TimeEntry | null }>("/time/entries/running");
                if (res.data) {
                    setActiveEntry(res.data);
                    setIsRunning(true);
                    startTick(res.data.started_at);
                    startHeartbeat(res.data.id);
                }
            } catch { /* API not running */ }
        }
        checkRunning();
        return () => stopTick();
    }, [startTick, stopTick, startHeartbeat]);

    // Stop running timer when the app window closes
    useEffect(() => {
        function handleBeforeUnload() {
            if (!activeEntry) return;
            const token = localStorage.getItem("mw_token");
            const url = `${import.meta.env.VITE_API_BASE || "http://localhost:8086/api/v1"}/time/entries/${activeEntry.id}/stop`;
            // sendBeacon is fire-and-forget; works during unload
            const blob = new Blob([JSON.stringify({})], { type: "application/json" });
            const headers: Record<string, string> = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;
            // Try fetch with keepalive first (supports headers), fallback to sendBeacon
            try {
                fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: JSON.stringify({}),
                    keepalive: true,
                });
            } catch {
                navigator.sendBeacon(url, blob);
            }
        }

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [activeEntry]);

    // Fetch today's entries
    const refreshEntries = useCallback(async () => {
        try {
            const today = new Date().toISOString().split("T")[0];
            const res = await apiGet<{ data: TimeEntry[] }>(
                `/time/entries?from=${today}T00:00:00&to=${today}T23:59:59`
            );
            setTodayEntries(res.data || []);
        } catch { /* silent */ }
    }, []);

    useEffect(() => { refreshEntries(); }, [refreshEntries]);

    // Fetch recent/filtered entries
    const fetchRecentEntries = useCallback(async (filters?: EntryFilters) => {
        setRecentLoading(true);
        try {
            const params: string[] = [];
            if (filters?.from) params.push(`from=${filters.from}T00:00:00`);
            if (filters?.to) params.push(`to=${filters.to}T23:59:59`);
            if (filters?.contractId) params.push(`contract_id=${filters.contractId}`);
            if (filters?.status) params.push(`status=${filters.status}`);
            const qs = params.length > 0 ? `?${params.join("&")}` : "";
            const res = await apiGet<{ data: TimeEntry[] }>(`/time/entries${qs}`);
            setRecentEntries(res.data || []);
        } catch { /* silent */ }
        setRecentLoading(false);
    }, []);

    const start = useCallback(async (contractId: string, taskLabel?: string, description?: string) => {
        setError(null);
        try {
            const res = await api<{ data: { id: string; started_at: string } }>(
                "/time/entries/start",
                {
                    method: "POST",
                    body: JSON.stringify({
                        contract_id: contractId,
                        task_label: taskLabel || undefined,
                        description: description || undefined,
                    }),
                }
            );
            const entry: TimeEntry = {
                id: res.data.id,
                contract_id: contractId,
                freelancer_id: "",
                started_at: res.data.started_at,
                status: "running",
                task_label: taskLabel,
                description,
            };
            setActiveEntry(entry);
            setIsRunning(true);
            startTick(res.data.started_at);
            startHeartbeat(res.data.id);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to start timer");
        }
    }, [startTick, startHeartbeat]);

    const stop = useCallback(async () => {
        if (!activeEntry) return;
        setError(null);
        try {
            await api(`/time/entries/${activeEntry.id}/stop`, { method: "POST" });
            stopTick();
            setIsRunning(false);
            setActiveEntry(null);
            setElapsed(0);
            await refreshEntries();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to stop timer");
        }
    }, [activeEntry, stopTick, refreshEntries]);

    return {
        isRunning, activeEntry, elapsed,
        todayEntries, recentEntries, recentLoading,
        start, stop, refreshEntries, fetchRecentEntries,
        error,
    };
}

