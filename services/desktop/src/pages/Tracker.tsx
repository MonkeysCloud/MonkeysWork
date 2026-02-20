import { useState, useEffect, useMemo } from "react";
import { Select, SelectItem, Button, Input, Progress, Spinner } from "@heroui/react";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer, type EntryFilters } from "@/hooks/useTimer";
import { useScreenshots } from "@/hooks/useScreenshots";
import { apiGet } from "@/lib/api";
import ScreenshotViewer from "@/components/ScreenshotViewer";

/* ── Types ── */
interface Contract {
    id: string;
    title?: string;
    job_title?: string;
    client_name?: string;
    freelancer_name?: string;
    contract_type: string;
    hourly_rate?: string;
    weekly_hour_limit?: number;
    status: string;
}

interface WeeklyInfo {
    current_week_minutes: number;
    weekly_hour_limit: number | null;
    hourly_rate: string | null;
}

/* ── CSS Keyframes (injected once) ── */
const ANIM_ID = "mw-tracker-keyframes";
if (typeof document !== "undefined" && !document.getElementById(ANIM_ID)) {
    const style = document.createElement("style");
    style.id = ANIM_ID;
    style.textContent = `
        @keyframes mw-pulse-ring {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50%      { opacity: 1;   transform: scale(1.04); }
        }
        @keyframes mw-fade-in {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mw-tick {
            0%   { opacity: 1; }
            50%  { opacity: 0.6; }
            100% { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

export default function Tracker() {
    const { user } = useAuth();
    const {
        isRunning, activeEntry, elapsed,
        todayEntries, recentEntries, recentLoading,
        start, stop, refreshEntries, fetchRecentEntries, error,
    } = useTimer();
    const [screenshotEntryId, setScreenshotEntryId] = useState<string | null>(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyFrom, setHistoryFrom] = useState("");
    const [historyTo, setHistoryTo] = useState("");
    const [historyContract, setHistoryContract] = useState("");
    const [historyStatus, setHistoryStatus] = useState("");
    const [showIdleAlert, setShowIdleAlert] = useState(false);

    const handleIdle = useMemo(() => () => {
        setShowIdleAlert(true);
        // Auto-stop after a short delay so the user sees the alert
        stop();
    }, [stop]);

    const { screenshots, counters, idleStreak } = useScreenshots({
        isRunning,
        entryId: activeEntry?.id,
        onIdle: handleIdle,
    });

    const [contracts, setContracts] = useState<Contract[]>([]);
    const [selectedContract, setSelectedContract] = useState<string>("");
    const [taskLabel, setTaskLabel] = useState("");
    const [loadingContracts, setLoadingContracts] = useState(true);
    const [weeklyInfo, setWeeklyInfo] = useState<WeeklyInfo | null>(null);

    // Fetch active hourly contracts
    useEffect(() => {
        (async () => {
            try {
                const res = await apiGet<{ data: Contract[] }>("/contracts?status=active");
                const hourly = (res.data || []).filter((c) => c.contract_type === "hourly");
                setContracts(hourly);
                if (hourly.length === 1) setSelectedContract(hourly[0].id);
            } catch { /* silent */ }
            setLoadingContracts(false);
        })();
    }, [user]);

    // Fetch weekly summary
    useEffect(() => {
        if (!selectedContract) { setWeeklyInfo(null); return; }
        (async () => {
            try {
                const res = await apiGet<{ data: WeeklyInfo }>(`/time/summary?contract_id=${selectedContract}`);
                setWeeklyInfo(res.data);
            } catch { setWeeklyInfo(null); }
        })();
    }, [selectedContract]);

    /* ── Derived values ── */
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    const todayMins = todayEntries
        .filter((e) => e.status !== "running")
        .reduce((a, e) => a + (e.duration_minutes || 0), 0) + Math.floor(elapsed / 60);
    const todayHrs = (todayMins / 60).toFixed(1);
    const todayEarnings = todayEntries
        .filter((e) => e.status !== "running")
        .reduce((a, e) => a + parseFloat(e.amount || "0"), 0);

    const weeklyLimit = weeklyInfo?.weekly_hour_limit ?? null;
    const weekMins = weeklyInfo?.current_week_minutes ?? 0;
    const weekHrs = +(weekMins / 60).toFixed(1);
    const limitReached = weeklyLimit != null && weekMins >= weeklyLimit * 60;
    const weekPct = weeklyLimit ? Math.min(100, (weekHrs / weeklyLimit) * 100) : 0;

    const selectedContractObj = useMemo(
        () => contracts.find((c) => c.id === selectedContract),
        [contracts, selectedContract]
    );

    async function handleToggle() {
        setShowIdleAlert(false);
        if (isRunning) { await stop(); }
        else if (selectedContract) { await start(selectedContract, taskLabel || undefined); }
    }

    /* ── SVG ring for the timer ── */
    const RING_R = 98;
    const RING_C = 2 * Math.PI * RING_R;
    // One full rotation every 60s (seconds hand)
    const ringOffset = isRunning ? RING_C * (1 - (seconds / 60)) : RING_C;

    return (
        <div className="h-full flex flex-col bg-transparent">
            {/* ═══ Timer Hero ═══ */}
            <div
                className="flex-shrink-0 relative overflow-hidden transition-all duration-700"
                style={{
                    background: isRunning
                        ? "linear-gradient(160deg, #1a1b2e 0%, #2d1f4e 40%, #3b1f5e 100%)"
                        : "linear-gradient(160deg, #2a2b3d 0%, #232438 50%, #1a1b2e 100%)",
                    paddingTop: 24,
                    paddingBottom: 28,
                }}
            >
                {/* Subtle animated glow behind the ring when running */}
                {isRunning && (
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background:
                                "radial-gradient(circle at 50% 50%, rgba(240,138,17,0.12) 0%, transparent 60%)",
                            animation: "mw-pulse-ring 3s ease-in-out infinite",
                        }}
                    />
                )}

                {/* Contract selector (idle) */}
                {!isRunning && (
                    <div
                        className="max-w-xs mx-auto mb-5 space-y-2 px-6"
                        style={{ animation: "mw-fade-in 0.3s ease-out" }}
                    >
                        <Select
                            label="Contract"
                            placeholder="Pick a contract"
                            selectedKeys={selectedContract ? [selectedContract] : []}
                            onSelectionChange={(keys) => setSelectedContract((Array.from(keys)[0] as string) || "")}
                            variant="flat"
                            size="sm"
                            isLoading={loadingContracts}
                            classNames={{
                                trigger:
                                    "bg-white/[0.07] backdrop-blur border border-white/10 shadow-sm hover:border-[#f08a11]/40 transition-colors data-[open=true]:border-[#f08a11]/60",
                                value: "text-white text-xs",
                                label: "text-white/60 text-xs font-semibold uppercase tracking-wider",
                            }}
                        >
                            {contracts.map((c) => (
                                <SelectItem key={c.id} textValue={c.job_title || c.title || c.id}>
                                    <div className="py-0.5">
                                        <p className="text-xs font-semibold truncate">{c.job_title || c.title}</p>
                                        <p className="text-xs opacity-60">
                                            {c.client_name} · ${c.hourly_rate}/hr
                                            {c.weekly_hour_limit ? ` · ${c.weekly_hour_limit}h/wk` : ""}
                                        </p>
                                    </div>
                                </SelectItem>
                            ))}
                        </Select>

                        <Input
                            placeholder="What are you working on?"
                            value={taskLabel}
                            onValueChange={setTaskLabel}
                            size="sm"
                            variant="flat"
                            classNames={{
                                inputWrapper:
                                    "bg-white/[0.07] backdrop-blur border border-white/10 shadow-sm hover:border-[#f08a11]/40",
                                input: "text-xs text-white placeholder:text-white/50",
                            }}
                        />
                    </div>
                )}

                {/* Running badge */}
                {isRunning && activeEntry && (
                    <div
                        className="text-center mb-3 px-6"
                        style={{ animation: "mw-fade-in 0.35s ease-out" }}
                    >
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-xs font-semibold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f08a11]" style={{ animation: "mw-tick 1.5s ease-in-out infinite" }} />
                            {activeEntry.contract_title || activeEntry.task_label || "Tracking"}
                        </span>
                    </div>
                )}

                {/* ── Timer Ring ── */}
                <div className="relative w-52 h-52 mx-auto mb-5">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 220 220">
                        {/* bg track */}
                        <circle
                            cx="110" cy="110" r={RING_R}
                            fill="none"
                            stroke={isRunning ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.07)"}
                            strokeWidth="6"
                        />
                        {/* progress arc */}
                        <circle
                            cx="110" cy="110" r={RING_R}
                            fill="none"
                            stroke={isRunning ? "#f08a11" : "rgba(240,138,17,0.3)"}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={RING_C}
                            strokeDashoffset={ringOffset}
                            style={{ transition: "stroke-dashoffset 0.4s ease" }}
                        />
                    </svg>

                    {/* Time text centered */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span
                            className={`font-mono font-black tracking-tight leading-none transition-colors duration-500 ${isRunning ? "text-white text-4xl" : "text-white text-3xl"
                                }`}
                        >
                            {pad(hours)}
                            <span style={{ animation: isRunning ? "mw-tick 1s ease-in-out infinite" : undefined }}>:</span>
                            {pad(minutes)}
                            <span style={{ animation: isRunning ? "mw-tick 1s ease-in-out infinite" : undefined }}>:</span>
                            {pad(seconds)}
                        </span>
                        {isRunning && (
                            <span className="text-xs text-white/30 mt-1 font-medium">
                                ${selectedContractObj?.hourly_rate ?? "—"}/hr
                            </span>
                        )}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center px-6">
                    <Button
                        size="lg"
                        onClick={handleToggle}
                        isDisabled={(!isRunning && !selectedContract) || (!isRunning && !taskLabel.trim()) || (!isRunning && limitReached)}
                        className={`
                            px-12 h-11 font-bold text-sm rounded-xl shadow-lg transition-all duration-300
                            ${isRunning
                                ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/25 hover:shadow-red-500/40"
                                : "bg-gradient-to-r from-[#f08a11] to-[#e07200] text-white shadow-[#f08a11]/25 hover:shadow-[#f08a11]/40"
                            }
                        `}
                    >
                        {isRunning ? "■  Stop" : "▶  Start"}
                    </Button>

                    {error && (
                        <p className="text-red-400 text-xs mt-2 font-medium">{error}</p>
                    )}

                    {isRunning && (
                        <div className="mt-3 flex items-center justify-center gap-4">
                            <span className="text-white/40 text-xs font-medium flex items-center gap-1">
                                🖱 <span className="text-white/70 tabular-nums">{counters.clicks}</span> clicks
                            </span>
                            <span className="text-white/40 text-xs font-medium flex items-center gap-1">
                                ⌨ <span className="text-white/70 tabular-nums">{counters.keys}</span> keys
                            </span>
                            {screenshots.length > 0 && (
                                <span className="text-white/25 text-xs">
                                    📸 {screenshots.length}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Weekly limit bar (idle & has limit) */}
                {!isRunning && weeklyLimit != null && selectedContract && (
                    <div
                        className="max-w-xs mx-auto mt-4 px-6"
                        style={{ animation: "mw-fade-in 0.3s ease-out" }}
                    >
                        <div className="bg-white/[0.07] backdrop-blur rounded-xl border border-white/10 px-3 py-2.5">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                                    Weekly Hours
                                </span>
                                <span className={`text-[11px] font-bold ${limitReached ? "text-red-400" : "text-white"}`}>
                                    {weekHrs} <span className="text-white/40 font-normal">/ {weeklyLimit}h</span>
                                </span>
                            </div>
                            <Progress
                                value={weekPct}
                                size="sm"
                                color={limitReached ? "danger" : weekPct > 80 ? "warning" : "primary"}
                                classNames={{
                                    track: "bg-white/10 h-1.5",
                                    indicator: "rounded-full",
                                }}
                            />
                            {limitReached && (
                                <p className="text-[11px] text-red-400 font-semibold mt-1.5 flex items-center gap-1">
                                    <span>⚠️</span> Weekly limit reached — timer disabled
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ Bottom Panel ═══ */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {/* Idle Alert */}
                    {showIdleAlert && (
                        <div
                            className="col-span-3 bg-amber-500/15 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-amber-500/20 transition-colors"
                            onClick={() => setShowIdleAlert(false)}
                        >
                            <span className="text-lg">⚠️</span>
                            <div>
                                <p className="text-xs font-semibold text-amber-300">
                                    Timer stopped — no activity detected
                                </p>
                                <p className="text-xs text-amber-300/60 mt-0.5">
                                    2 consecutive screenshots showed no keyboard or mouse activity. Click to dismiss.
                                </p>
                            </div>
                        </div>
                    )}
                    <StatCard
                        label="Today"
                        value={`${todayHrs}h`}
                        accent={isRunning ? "#f08a11" : undefined}
                    />
                    <StatCard
                        label="Earned"
                        value={`$${todayEarnings.toFixed(2)}`}
                        accent={todayEarnings > 0 ? "#4ade80" : undefined}
                    />
                    <StatCard
                        label="Entries"
                        value={String(todayEntries.filter((e) => e.status !== "running").length)}
                    />
                </div>

                {/* Today Activity */}
                <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">
                    Today&apos;s Activity
                </h3>

                {todayEntries.filter((e) => e.status !== "running").length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-white/40 text-xs">No entries yet today.</p>
                        <p className="text-white/20 text-xs mt-0.5">Start the timer above to begin.</p>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {todayEntries
                            .filter((e) => e.status !== "running")
                            .map((entry, i) => (
                                <div key={entry.id}>
                                    <div
                                        className="bg-white/[0.07] rounded-xl border border-white/10 px-3.5 py-2.5 hover:bg-white/[0.10] transition-colors"
                                        style={{ animation: `mw-fade-in ${0.15 + i * 0.05}s ease-out` }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold text-white truncate">
                                                    {entry.contract_title || entry.task_label || "Time Entry"}
                                                </p>
                                                {entry.task_label && entry.contract_title && (
                                                    <p className="text-xs text-white/50 truncate mt-0.5">
                                                        {entry.task_label}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right ml-3 flex-shrink-0">
                                                <p className="text-xs font-bold text-white tabular-nums">
                                                    {entry.duration_minutes ? fmtDuration(entry.duration_minutes) : "—"}
                                                </p>
                                                <p className="text-xs font-semibold text-[#f08a11] tabular-nums">
                                                    ${parseFloat(entry.amount || "0").toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/[0.06]">
                                            <span className="text-[11px] text-white/30 tabular-nums">
                                                {fmtTime(entry.started_at)} → {entry.ended_at ? fmtTime(entry.ended_at) : "—"}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setScreenshotEntryId(screenshotEntryId === entry.id ? null : entry.id)}
                                                    className={`text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                                                        screenshotEntryId === entry.id
                                                            ? "bg-[#f08a11]/20 text-[#f08a11]"
                                                            : "text-white/30 hover:text-white/60 hover:bg-white/[0.06]"
                                                    }`}
                                                    title="View screenshots"
                                                >
                                                    📸
                                                </button>
                                                <StatusPill status={entry.status} />
                                            </div>
                                        </div>
                                    </div>
                                    {screenshotEntryId === entry.id && (
                                        <ScreenshotViewer
                                            entryId={entry.id}
                                            durationMinutes={entry.duration_minutes}
                                            onDeleted={() => refreshEntries()}
                                            onClose={() => setScreenshotEntryId(null)}
                                        />
                                    )}
                                </div>
                            ))}
                    </div>
                )}

                {/* ═══ Entry History ═══ */}
                <div className="mt-6">
                    <button
                        onClick={() => {
                            setHistoryOpen(!historyOpen);
                            if (!historyOpen && recentEntries.length === 0) {
                                // Default: last 7 days
                                const to = new Date().toISOString().split("T")[0];
                                const from = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
                                setHistoryFrom(from);
                                setHistoryTo(to);
                                fetchRecentEntries({ from, to });
                            }
                        }}
                        className="flex items-center gap-2 text-[11px] font-bold text-white/40 uppercase tracking-widest hover:text-white/60 transition-colors mb-3"
                    >
                        <span
                            className="inline-block transition-transform duration-200"
                            style={{ transform: historyOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                        >
                            ▶
                        </span>
                        Previous Entries
                    </button>

                    {historyOpen && (
                        <div style={{ animation: "mw-fade-in 0.2s ease-out" }}>
                            {/* Filters */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <Input
                                    type="date"
                                    label="From"
                                    value={historyFrom}
                                    onValueChange={setHistoryFrom}
                                    size="sm"
                                    variant="flat"
                                    classNames={{
                                        inputWrapper: "bg-white/[0.07] border border-white/10 h-8",
                                        input: "text-xs text-white",
                                        label: "text-[10px] text-white/40",
                                    }}
                                />
                                <Input
                                    type="date"
                                    label="To"
                                    value={historyTo}
                                    onValueChange={setHistoryTo}
                                    size="sm"
                                    variant="flat"
                                    classNames={{
                                        inputWrapper: "bg-white/[0.07] border border-white/10 h-8",
                                        input: "text-xs text-white",
                                        label: "text-[10px] text-white/40",
                                    }}
                                />
                                <Select
                                    label="Contract"
                                    placeholder="All"
                                    selectedKeys={historyContract ? [historyContract] : []}
                                    onSelectionChange={(keys) => setHistoryContract((Array.from(keys)[0] as string) || "")}
                                    variant="flat"
                                    size="sm"
                                    classNames={{
                                        trigger: "bg-white/[0.07] border border-white/10 h-8",
                                        value: "text-white text-xs",
                                        label: "text-[10px] text-white/40",
                                    }}
                                >
                                    {contracts.map((c) => (
                                        <SelectItem key={c.id} textValue={c.job_title || c.title || c.id}>
                                            <span className="text-xs">{c.job_title || c.title}</span>
                                        </SelectItem>
                                    ))}
                                </Select>
                                <Select
                                    label="Status"
                                    placeholder="All"
                                    selectedKeys={historyStatus ? [historyStatus] : []}
                                    onSelectionChange={(keys) => setHistoryStatus((Array.from(keys)[0] as string) || "")}
                                    variant="flat"
                                    size="sm"
                                    classNames={{
                                        trigger: "bg-white/[0.07] border border-white/10 h-8",
                                        value: "text-white text-xs",
                                        label: "text-[10px] text-white/40",
                                    }}
                                >
                                    {["logged", "approved", "rejected"].map((s) => (
                                        <SelectItem key={s} textValue={s}>
                                            <span className="text-xs capitalize">{s}</span>
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => {
                                    const filters: EntryFilters = {};
                                    if (historyFrom) filters.from = historyFrom;
                                    if (historyTo) filters.to = historyTo;
                                    if (historyContract) filters.contractId = historyContract;
                                    if (historyStatus) filters.status = historyStatus;
                                    fetchRecentEntries(filters);
                                }}
                                className="w-full mb-3 h-8 text-xs font-semibold bg-[#f08a11]/20 text-[#f08a11] hover:bg-[#f08a11]/30"
                            >
                                🔍 Search
                            </Button>

                            {/* Results */}
                            {recentLoading && (
                                <div className="py-4 flex justify-center">
                                    <Spinner size="sm" color="warning" />
                                </div>
                            )}

                            {!recentLoading && recentEntries.length === 0 && (
                                <p className="text-white/30 text-xs text-center py-4">No entries found.</p>
                            )}

                            {!recentLoading && recentEntries.length > 0 && (
                                <div className="space-y-1.5">
                                    {recentEntries.map((entry, i) => (
                                        <div key={entry.id}>
                                            <div
                                                className="bg-white/[0.07] rounded-xl border border-white/10 px-3.5 py-2.5 hover:bg-white/[0.10] transition-colors"
                                                style={{ animation: `mw-fade-in ${0.1 + i * 0.03}s ease-out` }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold text-white truncate">
                                                            {entry.contract_title || entry.task_label || "Time Entry"}
                                                        </p>
                                                        {entry.task_label && entry.contract_title && (
                                                            <p className="text-xs text-white/50 truncate mt-0.5">
                                                                {entry.task_label}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right ml-3 flex-shrink-0">
                                                        <p className="text-xs font-bold text-white tabular-nums">
                                                            {entry.duration_minutes ? fmtDuration(entry.duration_minutes) : "—"}
                                                        </p>
                                                        <p className="text-xs font-semibold text-[#f08a11] tabular-nums">
                                                            ${parseFloat(entry.amount || "0").toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/[0.06]">
                                                    <span className="text-[11px] text-white/30 tabular-nums">
                                                        {fmtDate(entry.started_at)} {fmtTime(entry.started_at)} → {entry.ended_at ? fmtTime(entry.ended_at) : "—"}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setScreenshotEntryId(screenshotEntryId === entry.id ? null : entry.id)}
                                                            className={`text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                                                                screenshotEntryId === entry.id
                                                                    ? "bg-[#f08a11]/20 text-[#f08a11]"
                                                                    : "text-white/30 hover:text-white/60 hover:bg-white/[0.06]"
                                                            }`}
                                                            title="View screenshots"
                                                        >
                                                            📸
                                                        </button>
                                                        <StatusPill status={entry.status} />
                                                    </div>
                                                </div>
                                            </div>
                                            {screenshotEntryId === entry.id && (
                                                <ScreenshotViewer
                                                    entryId={entry.id}
                                                    durationMinutes={entry.duration_minutes}
                                                    onDeleted={() => {
                                                        refreshEntries();
                                                        const filters: EntryFilters = {};
                                                        if (historyFrom) filters.from = historyFrom;
                                                        if (historyTo) filters.to = historyTo;
                                                        if (historyContract) filters.contractId = historyContract;
                                                        if (historyStatus) filters.status = historyStatus;
                                                        fetchRecentEntries(filters);
                                                    }}
                                                    onClose={() => setScreenshotEntryId(null)}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ═══ Sub-components ═══ */

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
    return (
        <div className="bg-white/[0.07] rounded-xl border border-white/10 px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</p>
            <p
                className="text-base font-extrabold mt-0.5 tabular-nums"
                style={{ color: accent || "#ffffff" }}
            >
                {value}
            </p>
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const map: Record<string, { bg: string; fg: string }> = {
        approved: { bg: "rgba(74,222,128,0.15)", fg: "#4ade80" },
        rejected: { bg: "rgba(248,113,113,0.15)", fg: "#f87171" },
        logged: { bg: "rgba(96,165,250,0.15)", fg: "#60a5fa" },
    };
    const s = map[status] ?? { bg: "rgba(255,255,255,0.07)", fg: "rgba(255,255,255,0.5)" };
    return (
        <span
            className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide"
            style={{ background: s.bg, color: s.fg }}
        >
            {status}
        </span>
    );
}

/* ═══ Helpers ═══ */
function pad(n: number) { return String(n).padStart(2, "0"); }

function fmtDuration(m: number) {
    const h = Math.floor(m / 60);
    const r = m % 60;
    return h > 0 ? `${h}h ${r}m` : `${r}m`;
}

function fmtTime(iso: string | undefined | null) {
    if (!iso) return "—";
    try {
        const d = new Date(normalizeTimestamp(iso));
        if (isNaN(d.getTime())) return "—";
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch { return "—"; }
}

function fmtDate(iso: string | undefined | null) {
    if (!iso) return "";
    try {
        const d = new Date(normalizeTimestamp(iso));
        if (isNaN(d.getTime())) return "";
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch { return ""; }
}

/** Normalize PostgreSQL timestamps into valid ISO-8601 for `new Date()`. */
function normalizeTimestamp(ts: string): string {
    // Replace space separator with T: "2026-02-20 18:47:00+00" → "2026-02-20T18:47:00+00"
    let s = ts.replace(" ", "T");
    // If no timezone info (no Z, no +/- offset after time), append Z
    if (!s.includes("Z") && !/[+-]\d{2}(:\d{2})?$/.test(s)) {
        s += "Z";
    }
    return s;
}

