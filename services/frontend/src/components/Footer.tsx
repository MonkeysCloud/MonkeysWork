"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/* ── footer link columns ─────────────────────────────── */
const COLUMNS = [
    {
        title: "Platform",
        links: [
            { label: "Find Work", href: "/jobs" },
            { label: "Find Talent", href: "/freelancers" },
            { label: "Pricing", href: "/pricing" },
            { label: "How It Works", href: "/how-it-works" },
            { label: "Categories", href: "/categories" },
            { label: "Apps", href: "/apps" },
        ],
    },
    {
        title: "Resources",
        links: [
            { label: "Help Center", href: "/help" },
            { label: "Blog", href: "/blog" },
            { label: "Trust & Safety", href: "/trust" },
            { label: "AI Features", href: "/ai" },
        ],
    },
    {
        title: "Company",
        links: [
            { label: "About", href: "/about" },
            { label: "Contact", href: "/contact" },
            { label: "Enterprise", href: "/enterprise" },
        ],
    },
    {
        title: "Legal",
        links: [
            { label: "Terms", href: "/terms" },
            { label: "Privacy", href: "/privacy" },
            { label: "Cookies", href: "/cookies" },
        ],
    },
] as const;

/* ── social icons ────────────────────────────────────── */
function XIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

function LinkedInIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    );
}

function GitHubIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
    );
}

/* ───────────────────── component ────────────────────── */
export default function Footer() {
    const pathname = usePathname();
    const { user, isAuthenticated } = useAuth();
    if (pathname.startsWith("/dashboard")) return null;

    /* Role-based link filtering for Platform column */
    const filteredColumns = COLUMNS.map((col) => {
        if (col.title !== "Platform" || !isAuthenticated || !user) return col;
        return {
            ...col,
            links: col.links.filter((link) => {
                if (user.role === "freelancer" && link.href === "/freelancers") return false;
                if (user.role === "client" && link.href === "/jobs") return false;
                return true;
            }),
        };
    });

    return (
        <footer className="bg-brand-dark text-white/80">
            {/* ── main content ── */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-8">

                {/* top row: logo + columns */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">

                    {/* brand column */}
                    <div className="col-span-2">
                        <Link href="/" className="inline-block">
                            <Image
                                src="/monkeyswork-dark.svg"
                                alt="MonkeysWork"
                                width={200}
                                height={60}
                                className="h-16 w-auto"
                            />
                        </Link>
                        <p className="mt-4 text-sm text-white/50 max-w-xs leading-relaxed">
                            AI-powered freelance marketplace connecting top talent with ambitious projects.
                        </p>
                    </div>

                    {/* link columns */}
                    {filteredColumns.map((col) => (
                        <div key={col.title}>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">
                                {col.title}
                            </h3>
                            <ul className="space-y-2.5">
                                {col.links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-white/60 hover:text-brand-orange transition-colors duration-200"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* ── divider ── */}
                <div className="mt-12 pt-8 border-t border-white/10">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

                        {/* copyright */}
                        <p className="text-xs text-white/40 order-2 sm:order-1">
                            © 2026 MonkeysWork · Part of{" "}
                            <a
                                href="https://monkeyscloud.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-brand-orange transition-colors"
                            >
                                MonkeysCloud
                            </a>
                        </p>

                        {/* social icons */}
                        <div className="flex items-center gap-4 order-1 sm:order-2">
                            <a
                                href="https://x.com/monkeyswork"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white/40 hover:text-brand-orange transition-colors duration-200 p-2 rounded-lg hover:bg-white/5"
                                aria-label="X (Twitter)"
                            >
                                <XIcon />
                            </a>
                            <a
                                href="https://linkedin.com/company/monkeyswork"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white/40 hover:text-brand-orange transition-colors duration-200 p-2 rounded-lg hover:bg-white/5"
                                aria-label="LinkedIn"
                            >
                                <LinkedInIcon />
                            </a>
                            <a
                                href="https://github.com/MonkeysCloud"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white/40 hover:text-brand-orange transition-colors duration-200 p-2 rounded-lg hover:bg-white/5"
                                aria-label="GitHub"
                            >
                                <GitHubIcon />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Powered by */}
            <div className="bg-white/95 mt-8 py-3 flex items-center justify-center gap-2 rounded-t-xl">
                <span className="text-xs text-gray-400">Powered by</span>
                <a
                    href="https://monkeyslegion.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
                >
                    <img src="/MonkeysLegion.svg" alt="MonkeysLegion" className="h-5 w-auto" />
                </a>
            </div>

            {/* bottom safe area for mobile CTA bar */}
            <div className="h-16 md:h-0" />
        </footer>
    );
}
