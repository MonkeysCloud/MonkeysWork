import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { getApiBase, FRONTEND_URL } from "@/lib/api";
import Tracker from "@/pages/Tracker";
import Chat from "@/pages/Chat";
import Contracts from "@/pages/Contracts";
import PermissionSetup from "@/components/PermissionSetup";
import NotificationsPanel from "@/components/NotificationsPanel";

type Tab = "timer" | "chat" | "contracts";

const DASHBOARD_LINKS = [
    { label: "📊 Dashboard", path: "/dashboard" },
    { label: "💼 Jobs", path: "/dashboard/jobs" },
    { label: "💰 Billing", path: "/dashboard/billing" },
    { label: "⚙️ Settings", path: "/dashboard/settings" },
];

export default function AppShell() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const { notifications, unreadCount, markRead, clearAll } = useNotifications(token ?? undefined);
    const [activeTab, setActiveTab] = useState<Tab>("timer");
    const [showPermSetup, setShowPermSetup] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showDashMenu, setShowDashMenu] = useState(false);
    const dashMenuRef = useRef<HTMLDivElement>(null);

    // Check accessibility permission on mount
    useEffect(() => {
        if (localStorage.getItem("permissionDismissed")) return;
        invoke("check_accessibility_permission")
            .then((ok) => {
                if (!ok) setShowPermSetup(true);
            })
            .catch(() => { }); // non-Tauri env
    }, []);

    // Close dashboard menu on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dashMenuRef.current && !dashMenuRef.current.contains(e.target as Node)) {
                setShowDashMenu(false);
            }
        }
        if (showDashMenu) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [showDashMenu]);

    function dismissPermSetup() {
        setShowPermSetup(false);
        localStorage.setItem("permissionDismissed", "1");
    }

    if (!user) return null;

    const apiOrigin = new URL(getApiBase()).origin;

    function handleLogout() {
        logout();
        navigate("/login");
    }

    async function openDashboard(path: string) {
        try {
            await openUrl(`${FRONTEND_URL}${path}`);
        } catch {
            // Fallback for non-Tauri environments
            window.open(`${FRONTEND_URL}${path}`, "_blank");
        }
        setShowDashMenu(false);
    }

    return (
        <div className="h-screen flex flex-col bg-gradient-to-b from-[#2a2b3d] to-[#1a1b2e] overflow-hidden">
            {/* Permission setup overlay */}
            {showPermSetup && <PermissionSetup onDismiss={dismissPermSetup} />}
            {/* ── Top Bar (drag region) ── */}
            <header
                data-tauri-drag-region
                className="h-12 bg-[#363747] flex items-center justify-between px-4 flex-shrink-0 select-none"
                style={{ paddingTop: "6px" }} /* macOS traffic light offset */
            >
                {/* Left: Logo + Tabs */}
                <div className="flex items-center gap-1">
                    {/* Spacer for macOS traffic lights */}
                    <div className="w-16 flex-shrink-0" />
                    <img
                        src="/monkeyswork-icon.svg"
                        alt="MW"
                        className="h-6 w-6 brightness-0 invert opacity-60 mr-2"
                    />

                    <TabButton
                        active={activeTab === "timer"}
                        onClick={() => setActiveTab("timer")}
                        icon="⏱"
                        label="Timer"
                    />
                    <TabButton
                        active={activeTab === "chat"}
                        onClick={() => setActiveTab("chat")}
                        icon="💬"
                        label="Chat"
                    />
                    <TabButton
                        active={activeTab === "contracts"}
                        onClick={() => setActiveTab("contracts")}
                        icon="📄"
                        label="Contracts"
                    />

                    {/* Dashboard dropdown */}
                    <div className="relative" ref={dashMenuRef}>
                        <button
                            onClick={() => setShowDashMenu((v) => !v)}
                            className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
                                ${showDashMenu
                                    ? "bg-white/10 text-[#f08a11]"
                                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                                }
                            `}
                        >
                            <span className="text-sm">🌐</span>
                            <span>Dashboard</span>
                            <span className="text-[10px] opacity-60">▼</span>
                        </button>

                        {showDashMenu && (
                            <div
                                className="absolute left-0 top-full mt-1 w-48 bg-[#2e2f42] border border-white/15 rounded-xl shadow-2xl overflow-hidden z-50"
                                style={{ animation: "mw-fade-in 0.15s ease-out" }}
                            >
                                {DASHBOARD_LINKS.map((link) => (
                                    <button
                                        key={link.path}
                                        onClick={() => openDashboard(link.path)}
                                        className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                                    >
                                        {link.label}
                                    </button>
                                ))}
                                <div className="border-t border-white/10" />
                                <p className="px-4 py-2 text-xs text-white/30">
                                    Opens in your browser
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Notifications + User */}
                <div className="flex items-center gap-3">
                    {/* Notification bell */}
                    <button
                        className="relative p-1.5 text-white/50 hover:text-white transition-colors"
                        onClick={() => setShowNotifications((v) => !v)}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 01-3.46 0" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#f08a11] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* User avatar + name → opens Settings */}
                    <button
                        onClick={() => openDashboard("/dashboard/settings")}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                        title="Open Settings"
                    >
                        {user.avatar_url ? (
                            <img
                                src={user.avatar_url.startsWith("http") ? user.avatar_url : `${apiOrigin}${user.avatar_url}`}
                                alt={user.display_name}
                                className="w-7 h-7 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-[#f08a11]/20 flex items-center justify-center text-[#f08a11] font-bold text-[10px]">
                                {user.display_name?.[0]?.toUpperCase() ?? "U"}
                            </div>
                        )}
                        <span className="text-xs font-medium text-white/70 hidden sm:block">
                            {user.display_name?.split(" ")[0]}
                        </span>
                    </button>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                        title="Log Out"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* ── Content ── */}
            <main className="flex-1 overflow-hidden relative">
                {activeTab === "timer" && <Tracker />}
                {activeTab === "chat" && <Chat />}
                {activeTab === "contracts" && <Contracts />}

                {/* Notifications dropdown */}
                {showNotifications && (
                    <NotificationsPanel
                        notifications={notifications}
                        onMarkRead={markRead}
                        onClearAll={clearAll}
                        onClose={() => setShowNotifications(false)}
                    />
                )}
            </main>
        </div>
    );
}

/* ── Tab Button ── */
function TabButton({
    active,
    onClick,
    icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: string;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
        ${active
                    ? "bg-white/10 text-[#f08a11]"
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                }
      `}
        >
            <span className="text-sm">{icon}</span>
            <span>{label}</span>
        </button>
    );
}

