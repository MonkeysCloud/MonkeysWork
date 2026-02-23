"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

/* ── Cookie consent types ────────────────────────── */
export interface CookieConsent {
    essential: boolean;     // Always true
    analytics: boolean;
    functional: boolean;
    marketing: boolean;
}

const STORAGE_KEY = "mw_cookie_consent";
const CONSENT_VERSION = "1.0";

function getStoredConsent(): CookieConsent | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed.version !== CONSENT_VERSION) return null;
        return parsed.consent as CookieConsent;
    } catch {
        return null;
    }
}

function storeConsent(consent: CookieConsent) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: CONSENT_VERSION, consent, timestamp: new Date().toISOString() })
    );
}

/** Check if analytics consent was given */
export function hasAnalyticsConsent(): boolean {
    const consent = getStoredConsent();
    return consent?.analytics ?? false;
}

/* ── Component ───────────────────────────────────── */
export default function CookieBanner() {
    const [visible, setVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [consent, setConsent] = useState<CookieConsent>({
        essential: true,
        analytics: true,
        functional: true,
        marketing: false,
    });

    useEffect(() => {
        const stored = getStoredConsent();
        if (!stored) {
            // Small delay so it doesn't flash on page load
            const t = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(t);
        }
    }, []);

    const handleAcceptAll = useCallback(() => {
        const all: CookieConsent = { essential: true, analytics: true, functional: true, marketing: true };
        storeConsent(all);
        setVisible(false);
        window.dispatchEvent(new CustomEvent("cookie_consent_update", { detail: all }));
    }, []);

    const handleRejectNonEssential = useCallback(() => {
        const minimal: CookieConsent = { essential: true, analytics: false, functional: false, marketing: false };
        storeConsent(minimal);
        setVisible(false);
        window.dispatchEvent(new CustomEvent("cookie_consent_update", { detail: minimal }));
    }, []);

    const handleSavePreferences = useCallback(() => {
        storeConsent(consent);
        setVisible(false);
        window.dispatchEvent(new CustomEvent("cookie_consent_update", { detail: consent }));
    }, [consent]);

    if (!visible) return null;

    return (
        <div
            style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                animation: "slideUp 0.4s ease-out",
            }}
        >
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
            <div
                style={{
                    maxWidth: 640,
                    margin: "0 auto 16px",
                    padding: "20px 24px",
                    background: "rgba(15, 23, 42, 0.97)",
                    backdropFilter: "blur(12px)",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 -4px 30px rgba(0,0,0,0.3)",
                    color: "#e2e8f0",
                    marginLeft: 16,
                    marginRight: 16,
                }}
            >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 24 }}>🍪</span>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>
                        Cookie Preferences
                    </h3>
                </div>

                {/* Description */}
                <p style={{ fontSize: 13, lineHeight: 1.6, color: "#94a3b8", margin: "0 0 16px" }}>
                    We use cookies to enhance your experience, analyze site traffic, and personalize content.
                    You can choose which cookies to allow. See our{" "}
                    <Link href="/cookies" style={{ color: "#f08a11", textDecoration: "underline" }}>
                        Cookie Policy
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" style={{ color: "#f08a11", textDecoration: "underline" }}>
                        Privacy Policy
                    </Link>{" "}
                    for details.
                </p>

                {/* ── Detailed toggles ── */}
                {showDetails && (
                    <div style={{
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: 10,
                        padding: 14,
                        marginBottom: 16,
                        border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                        {([
                            { key: "essential" as const, label: "Essential", desc: "Required for site functionality", locked: true },
                            { key: "analytics" as const, label: "Analytics", desc: "Google Analytics, performance data", locked: false },
                            { key: "functional" as const, label: "Functional", desc: "Preferences, chat, enhanced features", locked: false },
                            { key: "marketing" as const, label: "Marketing", desc: "Personalized ads, retargeting", locked: false },
                        ]).map((cat) => (
                            <label
                                key={cat.key}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "8px 0",
                                    borderBottom: cat.key !== "marketing" ? "1px solid rgba(255,255,255,0.06)" : "none",
                                    cursor: cat.locked ? "default" : "pointer",
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{cat.label}</div>
                                    <div style={{ fontSize: 11, color: "#64748b" }}>{cat.desc}</div>
                                </div>
                                <div style={{
                                    width: 40,
                                    height: 22,
                                    borderRadius: 11,
                                    background: consent[cat.key] ? "#f08a11" : "#334155",
                                    position: "relative",
                                    transition: "background 0.2s",
                                    opacity: cat.locked ? 0.6 : 1,
                                    flexShrink: 0,
                                    marginLeft: 16,
                                }}>
                                    <div style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: "50%",
                                        background: "#fff",
                                        position: "absolute",
                                        top: 2,
                                        left: consent[cat.key] ? 20 : 2,
                                        transition: "left 0.2s",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                                    }} />
                                    {!cat.locked && (
                                        <input
                                            type="checkbox"
                                            checked={consent[cat.key]}
                                            onChange={() => setConsent(prev => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                                            style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer", top: 0, left: 0, margin: 0 }}
                                        />
                                    )}
                                </div>
                            </label>
                        ))}
                    </div>
                )}

                {/* ── GDPR/CCPA notice ── */}
                <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 14px", lineHeight: 1.5 }}>
                    🇪🇺 GDPR: You have the right to withdraw consent at any time.{" "}
                    🇺🇸 CCPA: California residents may opt out of the sale of personal information.{" "}
                    <Link href="/privacy#your-rights" style={{ color: "#f08a11" }}>Learn more →</Link>
                </p>

                {/* ── Buttons ── */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                        onClick={handleRejectNonEssential}
                        style={{
                            padding: "9px 16px",
                            borderRadius: 8,
                            border: "1px solid rgba(255,255,255,0.15)",
                            background: "transparent",
                            color: "#94a3b8",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Reject All
                    </button>
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        style={{
                            padding: "9px 16px",
                            borderRadius: 8,
                            border: "1px solid rgba(255,255,255,0.15)",
                            background: "transparent",
                            color: "#e2e8f0",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        {showDetails ? "Hide Details" : "Customize"}
                    </button>
                    {showDetails ? (
                        <button
                            onClick={handleSavePreferences}
                            style={{
                                padding: "9px 20px",
                                borderRadius: 8,
                                border: "none",
                                background: "linear-gradient(135deg, #f08a11, #e07a00)",
                                color: "#fff",
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: "pointer",
                                marginLeft: "auto",
                            }}
                        >
                            Save Preferences
                        </button>
                    ) : (
                        <button
                            onClick={handleAcceptAll}
                            style={{
                                padding: "9px 20px",
                                borderRadius: 8,
                                border: "none",
                                background: "linear-gradient(135deg, #f08a11, #e07a00)",
                                color: "#fff",
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: "pointer",
                                marginLeft: "auto",
                            }}
                        >
                            Accept All
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
