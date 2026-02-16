"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { getMenuForRole, type MenuItem } from "./sidebarMenus";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Sidebar nav item ───────────────────────────────── */
function NavItem({
    item,
    pathname,
    collapsed,
    badgeCounts = {},
}: {
    item: MenuItem;
    pathname: string;
    collapsed: boolean;
    badgeCounts?: Record<string, number>;
}) {
    const isActive =
        pathname === item.href ||
        (item.children?.some((c) => pathname.startsWith(c.href.split("?")[0])) ??
            false);
    const [open, setOpen] = useState(isActive);

    return (
        <div>
            {/* parent link */}
            <Link
                href={item.href}
                onClick={(e) => {
                    if (item.children && !collapsed) {
                        e.preventDefault();
                        setOpen(!open);
                    }
                }}
                className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                    ${isActive
                        ? "bg-brand-orange/10 text-brand-orange"
                        : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                    }
                `}
                title={collapsed ? item.label : undefined}
            >
                <span className="text-lg flex-shrink-0 w-6 text-center">
                    {item.icon}
                </span>
                {!collapsed && (
                    <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (badgeCounts[item.badge] ?? 0) > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-brand-orange/20 text-brand-orange rounded-full min-w-[18px] text-center">
                                {badgeCounts[item.badge]}
                            </span>
                        )}
                        {item.children && (
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                className={`transition-transform duration-200 text-white/40 ${open ? "rotate-180" : ""
                                    }`}
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        )}
                    </>
                )}
            </Link>

            {/* children */}
            {item.children && open && !collapsed && (
                <div className="ml-9 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                    {item.children.map((child) => {
                        const childBase = child.href.split("?")[0];
                        const childActive = pathname === childBase || (pathname.startsWith(childBase + "/") && !item.children?.some((s) => s.href !== child.href && pathname.startsWith(s.href.split("?")[0])));
                        return (
                            <Link
                                key={child.href}
                                href={child.href}
                                className={`
                                    block py-1.5 px-2 rounded-md text-xs transition-colors duration-150
                                    ${childActive
                                        ? "text-brand-orange font-semibold"
                                        : "text-white/50 hover:text-white/80"
                                    }
                                `}
                            >
                                {child.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ── Main shell ─────────────────────────────────────── */
export default function DashboardShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, token, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    /* ── Live notification count ── */
    const { unreadCount: liveUnread } = useNotifications(token ?? undefined);
    const [serverUnread, setServerUnread] = useState(0);

    const fetchUnreadCount = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setServerUnread(json.data?.unread_count ?? 0);
        } catch { /* ignore */ }
    }, [token]);

    useEffect(() => {
        fetchUnreadCount();
        const iv = setInterval(fetchUnreadCount, 30_000);
        return () => clearInterval(iv);
    }, [fetchUnreadCount]);

    // Combine: server count + any new live notifs since last fetch
    const totalUnread = serverUnread + liveUnread;

    const badgeCounts: Record<string, number> = {
        messages: totalUnread,
        notifications: totalUnread,
        verifications: 0, // could be wired to pending verifications count
    };

    if (!user) return null;

    const menu = getMenuForRole(user.role);

    function handleLogout() {
        logout();
        router.push("/login");
    }

    const sidebarWidth = collapsed ? "w-[68px]" : "w-[260px]";

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* logo area */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-white/10 flex-shrink-0">
                {!collapsed && (
                    <Link href="/" className="flex-shrink-0">
                        <Image
                            src="/monkeyswork.svg"
                            alt="MonkeysWork"
                            width={140}
                            height={40}
                            className="h-9 w-auto brightness-0 invert"
                        />
                    </Link>
                )}
                <button
                    onClick={() => {
                        setCollapsed(!collapsed);
                        setMobileOpen(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
                    >
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
            </div>

            {/* main nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-hide">
                {menu.main.map((item) => (
                    <NavItem
                        key={item.label}
                        item={item}
                        pathname={pathname}
                        collapsed={collapsed}
                        badgeCounts={badgeCounts}
                    />
                ))}
            </nav>

            {/* divider */}
            <div className="mx-3 border-t border-white/10" />

            {/* secondary nav */}
            <nav className="px-3 py-3 space-y-1">
                {menu.secondary.map((item) => (
                    <NavItem
                        key={item.label}
                        item={item}
                        pathname={pathname}
                        collapsed={collapsed}
                        badgeCounts={badgeCounts}
                    />
                ))}
                {/* logout */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 w-full"
                    title={collapsed ? "Log Out" : undefined}
                >
                    <span className="text-lg flex-shrink-0 w-6 text-center">
                        🚪
                    </span>
                    {!collapsed && <span>Log Out</span>}
                </button>
            </nav>

            {/* user card */}
            <div className="border-t border-white/10 px-3 py-3 flex-shrink-0">
                <div
                    className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}
                >
                    {user.avatar_url ? (
                        <img
                            src={user.avatar_url.startsWith("http") ? user.avatar_url : `${new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086").origin}${user.avatar_url}`}
                            alt={user.display_name}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold text-sm flex-shrink-0">
                            {user.display_name?.[0]?.toUpperCase() ?? "U"}
                        </div>
                    )}
                    {!collapsed && (
                        <div className="min-w-0">
                            <div className="text-sm font-semibold text-white truncate">
                                {user.display_name}
                            </div>
                            <div className="text-[11px] text-white/40 truncate capitalize">
                                {user.role}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f5f6fa] flex">
            {/* ── Desktop sidebar ── */}
            <aside
                className={`
                    hidden lg:flex flex-col bg-brand-dark ${sidebarWidth}
                    transition-all duration-300 fixed inset-y-0 left-0 z-30
                `}
            >
                {sidebarContent}
            </aside>

            {/* ── Mobile overlay ── */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="absolute top-0 left-0 bottom-0 w-[260px] bg-brand-dark z-50 animate-[slideInLeft_0.3s_ease-out]">
                        {sidebarContent}
                    </aside>
                </div>
            )}

            {/* ── Main content area ── */}
            <div
                className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? "lg:ml-[68px]" : "lg:ml-[260px]"
                    }`}
            >
                {/* top bar */}
                <header className="h-16 bg-white border-b border-brand-border/60 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
                    {/* mobile hamburger */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="lg:hidden p-2 text-brand-dark hover:text-brand-orange transition-colors"
                    >
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="3" y1="7" x2="21" y2="7" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="17" x2="21" y2="17" />
                        </svg>
                    </button>

                    {/* page title area */}
                    <div className="lg:flex-1" />

                    {/* right actions */}
                    <div className="flex items-center gap-3">
                        {/* notifications bell */}
                        <Link
                            href="/dashboard/notifications"
                            className="relative p-2 text-brand-muted hover:text-brand-dark transition-colors"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 01-3.46 0" />
                            </svg>
                            {totalUnread > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-1">
                                    {totalUnread > 99 ? "99+" : totalUnread}
                                </span>
                            )}
                        </Link>

                        {/* user mini */}
                        <div className="flex items-center gap-2 pl-3 border-l border-brand-border/60">
                            {user.avatar_url ? (
                                <img
                                    src={user.avatar_url.startsWith("http") ? user.avatar_url : `${new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086").origin}${user.avatar_url}`}
                                    alt={user.display_name}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-xs">
                                    {user.display_name?.[0]?.toUpperCase() ?? "U"}
                                </div>
                            )}
                            <span className="hidden sm:block text-sm font-medium text-brand-dark">
                                {user.display_name}
                            </span>
                        </div>
                    </div>
                </header>

                {/* page content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
