"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/* ───────────────────── nav data ─────────────────────── */
type DropdownItem = { label: string; href: string; desc: string };
type NavLink = { label: string; href: string; dropdown?: DropdownItem[] };

const NAV_LINKS: NavLink[] = [
    { label: "Find Work", href: "/jobs" },
    { label: "Find Talent", href: "/freelancers" },
    {
        label: "How It Works",
        href: "/how-it-works",
        dropdown: [
            { label: "For Clients", href: "/how-it-works/clients", desc: "Post jobs, hire top talent, manage projects" },
            { label: "For Freelancers", href: "/how-it-works/freelancers", desc: "Find work, build your profile, grow your career" },
        ],
    },
    { label: "Pricing", href: "/pricing" },
    { label: "Blog", href: "/blog" },
];

/* ── icons (inline SVG to avoid extra deps) ─────────── */
function HamburgerIcon({ open }: { open: boolean }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300">
            {open ? (
                <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </>
            ) : (
                <>
                    <line x1="3" y1="7" x2="21" y2="7" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="17" x2="21" y2="17" />
                </>
            )}
        </svg>
    );
}

function ChevronDown() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

/* ───────────────────── component ────────────────────── */
export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const dropdownTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuth();

    /* scroll listener ---------------------------------------------------- */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    /* lock body scroll when mobile menu is open -------------------------- */
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [mobileOpen]);

    /* dropdown hover handlers -------------------------------------------- */
    const openDropdown = () => {
        clearTimeout(dropdownTimeout.current);
        setDropdownOpen(true);
    };
    const closeDropdown = () => {
        dropdownTimeout.current = setTimeout(() => setDropdownOpen(false), 200);
    };

    // Hide on dashboard pages (after all hooks)
    if (pathname.startsWith("/dashboard")) return null;


    return (
        <>
            {/* ────── DESKTOP / TABLET HEADER ────── */}
            <header
                className={`
          fixed top-0 left-0 right-0 z-50 bg-white border-b transition-all duration-300
          ${scrolled
                        ? "shadow-[0_1px_3px_rgba(0,0,0,0.08)] border-brand-border/50"
                        : "border-transparent"
                    }
        `}
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-[72px]">

                        {/* ── Logo ── */}
                        <Link href="/" className="flex-shrink-0 relative z-10">
                            <Image
                                src="/monkeyswork.svg"
                                alt="MonkeysWork"
                                width={200}
                                height={60}
                                priority
                                className="h-14 w-auto"
                            />
                        </Link>

                        {/* ── Desktop Nav ── */}
                        <nav className="hidden md:flex items-center gap-1">
                            {NAV_LINKS.map((link) =>
                                link.dropdown ? (
                                    /* dropdown trigger */
                                    <div
                                        key={link.label}
                                        ref={dropdownRef}
                                        className="relative"
                                        onMouseEnter={openDropdown}
                                        onMouseLeave={closeDropdown}
                                    >
                                        <Link
                                            href={link.href}
                                            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-brand-dark hover:text-brand-orange rounded-lg transition-colors duration-200"
                                        >
                                            {link.label}
                                            <span className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}>
                                                <ChevronDown />
                                            </span>
                                        </Link>

                                        {/* dropdown panel */}
                                        {dropdownOpen && (
                                            <div
                                                className="absolute top-full left-1/2 -translate-x-1/2 pt-2"
                                                style={{ animation: "slideDown 0.2s ease-out" }}
                                            >
                                                <div className="bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-brand-border/60 p-2 min-w-[280px]">
                                                    {link.dropdown.map((sub) => (
                                                        <Link
                                                            key={sub.href}
                                                            href={sub.href}
                                                            className="flex flex-col gap-0.5 px-4 py-3 rounded-lg hover:bg-brand-orange-light transition-colors duration-150 group"
                                                        >
                                                            <span className="text-sm font-semibold text-brand-dark group-hover:text-brand-orange transition-colors">
                                                                {sub.label}
                                                            </span>
                                                            <span className="text-xs text-brand-muted">
                                                                {sub.desc}
                                                            </span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* regular link */
                                    <Link
                                        key={link.label}
                                        href={link.href}
                                        className="px-4 py-2 text-sm font-medium text-brand-dark hover:text-brand-orange rounded-lg transition-colors duration-200"
                                    >
                                        {link.label}
                                    </Link>
                                )
                            )}
                        </nav>

                        {/* ── Desktop CTAs ── */}
                        <div className="hidden md:flex items-center gap-3">
                            {isAuthenticated && user ? (
                                <>
                                    <Link
                                        href="/dashboard"
                                        className="px-5 py-2 text-sm font-semibold text-brand-dark hover:text-brand-orange border border-transparent hover:border-brand-border rounded-lg transition-all duration-200"
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={() => { logout(); router.push("/"); }}
                                        className="px-5 py-2 text-sm font-semibold text-brand-muted hover:text-red-500 transition-colors"
                                    >
                                        Log Out
                                    </button>
                                    <div className="w-9 h-9 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-sm">
                                        {user.display_name?.[0]?.toUpperCase() ?? "U"}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="px-5 py-2 text-sm font-semibold text-brand-dark hover:text-brand-orange border border-transparent hover:border-brand-border rounded-lg transition-all duration-200"
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-lg shadow-[0_2px_8px_rgba(240,138,17,0.35)] hover:shadow-[0_4px_16px_rgba(240,138,17,0.45)] transition-all duration-200 hover:-translate-y-0.5"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* ── Mobile Hamburger ── */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden relative z-10 p-2 text-brand-dark hover:text-brand-orange transition-colors"
                            aria-label="Toggle menu"
                        >
                            <HamburgerIcon open={mobileOpen} />
                        </button>
                    </div>
                </div>
            </header>

            {/* ────── MOBILE OVERLAY MENU ────── */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 md:hidden"
                    style={{ animation: "fadeIn 0.2s ease-out" }}
                >
                    {/* backdrop */}
                    <div
                        className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />

                    {/* slide-in panel */}
                    <div
                        className="absolute top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col"
                        style={{ animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
                    >
                        {/* top spacing for header */}
                        <div className="h-[72px] flex-shrink-0" />

                        {/* nav links */}
                        <nav className="flex-1 overflow-y-auto px-6 py-4">
                            {NAV_LINKS.map((link) => (
                                <div key={link.label}>
                                    <Link
                                        href={link.href}
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center py-3.5 text-base font-medium text-brand-dark hover:text-brand-orange border-b border-brand-border/40 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                    {link.dropdown && (
                                        <div className="pl-4 border-l-2 border-brand-orange/30 ml-2 mb-2">
                                            {link.dropdown.map((sub) => (
                                                <Link
                                                    key={sub.href}
                                                    href={sub.href}
                                                    onClick={() => setMobileOpen(false)}
                                                    className="block py-2.5 text-sm text-brand-muted hover:text-brand-orange transition-colors"
                                                >
                                                    {sub.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* mobile auth links */}
                            <div className="mt-6 space-y-3">
                                {isAuthenticated && user ? (
                                    <>
                                        <Link
                                            href="/dashboard"
                                            onClick={() => setMobileOpen(false)}
                                            className="block w-full text-center py-3 text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-lg shadow-[0_2px_8px_rgba(240,138,17,0.35)] transition-all"
                                        >
                                            Dashboard
                                        </Link>
                                        <button
                                            onClick={() => { logout(); setMobileOpen(false); router.push("/"); }}
                                            className="block w-full text-center py-3 text-sm font-semibold text-brand-dark border border-brand-border rounded-lg hover:border-red-400 hover:text-red-500 transition-colors"
                                        >
                                            Log Out
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            onClick={() => setMobileOpen(false)}
                                            className="block w-full text-center py-3 text-sm font-semibold text-brand-dark border border-brand-border rounded-lg hover:border-brand-dark transition-colors"
                                        >
                                            Log In
                                        </Link>
                                        <Link
                                            href="/register"
                                            onClick={() => setMobileOpen(false)}
                                            className="block w-full text-center py-3 text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-lg shadow-[0_2px_8px_rgba(240,138,17,0.35)] transition-all"
                                        >
                                            Get Started
                                        </Link>
                                    </>
                                )}
                            </div>
                        </nav>
                    </div>
                </div>
            )}

            {/* ────── MOBILE STICKY BOTTOM CTA ────── */}
            <div
                className={`
          fixed bottom-0 left-0 right-0 z-40 md:hidden
          bg-white/90 backdrop-blur-lg border-t border-brand-border/60
          px-4 py-3 transition-transform duration-300
          ${mobileOpen ? "translate-y-full" : "translate-y-0"}
        `}
            >
                <Link
                    href="/register"
                    className="block w-full text-center py-3 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_2px_12px_rgba(240,138,17,0.4)] transition-all"
                >
                    Get Started — It&apos;s Free
                </Link>
            </div>

            {/* ── spacer for sticky header ── */}
            <div className="h-[72px]" />
        </>
    );
}
