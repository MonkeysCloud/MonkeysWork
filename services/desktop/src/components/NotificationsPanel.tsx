import { useEffect, useRef } from "react";

interface Notification {
    id: string;
    type: string;
    title: string;
    body?: string;
    data: Record<string, unknown>;
    priority: string;
    created_at: string;
    read: boolean;
}

interface Props {
    notifications: Notification[];
    onMarkRead: (id: string) => void;
    onClearAll: () => void;
    onClose: () => void;
}

const TYPE_ICON: Record<string, string> = {
    message: "💬",
    contract: "📄",
    milestone: "🎯",
    payment: "💰",
    dispute: "⚠️",
    proposal: "📝",
    review: "⭐",
    system: "🔔",
};

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function NotificationsPanel({ notifications, onMarkRead, onClearAll, onClose }: Props) {
    const panelRef = useRef<HTMLDivElement>(null);

    /* Close on outside click */
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [onClose]);

    const unread = notifications.filter((n) => !n.read);

    return (
        <div
            ref={panelRef}
            className="absolute top-12 right-4 z-50 w-80"
            style={{
                animation: "mw-fade-in 0.15s ease-out",
            }}
        >
            <div
                className="rounded-xl overflow-hidden border border-white/10 shadow-2xl"
                style={{
                    background: "rgba(42, 43, 61, 0.97)",
                    backdropFilter: "blur(20px)",
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Notifications</span>
                        {unread.length > 0 && (
                            <span className="text-[11px] font-bold text-[#f08a11] bg-[#f08a11]/15 px-1.5 py-0.5 rounded-full">
                                {unread.length}
                            </span>
                        )}
                    </div>
                    {notifications.length > 0 && (
                        <button
                            onClick={onClearAll}
                            className="text-xs font-semibold text-white/40 hover:text-white/70 transition-colors"
                        >
                            Clear all
                        </button>
                    )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 && (
                        <div className="text-center py-10">
                            <span className="text-2xl block mb-2">🔔</span>
                            <p className="text-white/30 text-xs">No notifications yet</p>
                        </div>
                    )}

                    {notifications.map((n) => {
                        const icon = TYPE_ICON[n.type] ?? "🔔";
                        return (
                            <button
                                key={n.id}
                                onClick={() => !n.read && onMarkRead(n.id)}
                                className={`
                                    w-full text-left px-4 py-3 border-b border-white/[0.04] transition-colors
                                    ${n.read
                                        ? "bg-transparent hover:bg-white/[0.03]"
                                        : "bg-white/[0.04] hover:bg-white/[0.07]"
                                    }
                                `}
                            >
                                <div className="flex gap-2.5">
                                    <span className="text-sm mt-0.5 flex-shrink-0">{icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-xs font-semibold truncate ${n.read ? "text-white/50" : "text-white"}`}>
                                                {n.title}
                                            </p>
                                            {!n.read && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#f08a11] flex-shrink-0 mt-1" />
                                            )}
                                        </div>
                                        {n.body && (
                                            <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{n.body}</p>
                                        )}
                                        <p className="text-[11px] text-white/25 mt-1">{timeAgo(n.created_at)}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
