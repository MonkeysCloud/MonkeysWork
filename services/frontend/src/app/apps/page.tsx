import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Download MonkeysWork — Desktop & Mobile Apps",
    description:
        "Get MonkeysWork on your desktop or mobile device. Available for macOS, Windows, Ubuntu, iOS, and Android.",
};

/* ── Release config ─────────────────────────────── */
const VERSION = "0.1.0";
const BASE_URL =
    "https://storage.googleapis.com/monkeyswork-releases/desktop";

const desktopDownloads = [
    {
        os: "macOS",
        icon: "🍎",
        format: ".dmg",
        requirement: "macOS 12 Monterey or later",
        chip: "Apple Silicon & Intel",
        href: `${BASE_URL}/v${VERSION}/MonkeysWork_${VERSION}_universal.dmg`,
        color: "#000000",
        gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    },
    {
        os: "Windows",
        icon: "🪟",
        format: ".exe",
        requirement: "Windows 10 or later",
        chip: "64-bit (x64)",
        href: `${BASE_URL}/v${VERSION}/MonkeysWork_${VERSION}_x64-setup.exe`,
        color: "#0078d4",
        gradient: "linear-gradient(135deg, #0078d4 0%, #005a9e 100%)",
    },
    {
        os: "Ubuntu / Linux",
        icon: "🐧",
        format: ".deb",
        requirement: "Ubuntu 20.04+ / Debian-based",
        chip: "64-bit (amd64)",
        href: `${BASE_URL}/v${VERSION}/MonkeysWork_${VERSION}_amd64.deb`,
        color: "#e95420",
        gradient: "linear-gradient(135deg, #e95420 0%, #c34113 100%)",
    },
];

const mobileApps = [
    {
        platform: "iOS",
        icon: "📱",
        store: "App Store",
        storeBadge: "🍏 App Store",
        note: "iPhone & iPad",
        color: "#007aff",
    },
    {
        platform: "Android",
        icon: "🤖",
        store: "Google Play",
        storeBadge: "▶️ Google Play",
        note: "Android 8.0+",
        color: "#34a853",
    },
];

const features = [
    {
        icon: "🔔",
        title: "Native Notifications",
        desc: "Get instant alerts for proposals, messages, and contract updates — even when the app is in the background.",
    },
    {
        icon: "⚡",
        title: "Blazing Fast",
        desc: "Built with Tauri and Rust, the desktop app starts in under a second and uses minimal memory.",
    },
    {
        icon: "🔄",
        title: "Auto-Updates",
        desc: "Always stay on the latest version. Updates download and install automatically in the background.",
    },
    {
        icon: "🖥️",
        title: "System Tray",
        desc: "Quick access from your system tray. Check notifications and jump to conversations without opening the full app.",
    },
    {
        icon: "🔒",
        title: "Secure by Default",
        desc: "End-to-end encrypted communications with your tokens stored securely in your OS keychain.",
    },
    {
        icon: "🌙",
        title: "Dark Mode",
        desc: "Beautiful dark mode that follows your system preferences. Easy on the eyes, day and night.",
    },
];

export default function AppsPage() {
    return (
        <div>
            {/* ── Hero ── */}
            <section
                style={{
                    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
                    padding: "5rem 1.5rem 4rem",
                    textAlign: "center",
                    color: "#ffffff",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Decorative glow */}
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 600,
                        height: 600,
                        background: "radial-gradient(circle, rgba(240,138,17,0.08) 0%, transparent 70%)",
                        pointerEvents: "none",
                    }}
                />
                <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            background: "rgba(240, 138, 17, 0.12)",
                            color: "#f08a11",
                            padding: "6px 16px",
                            borderRadius: 20,
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            marginBottom: 20,
                            border: "1px solid rgba(240,138,17,0.2)",
                        }}
                    >
                        ✨ Version {VERSION} Available
                    </span>
                    <h1
                        style={{
                            fontSize: "2.75rem",
                            fontWeight: 800,
                            margin: "0 0 16px",
                            lineHeight: 1.15,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        Take MonkeysWork{" "}
                        <span
                            style={{
                                background: "linear-gradient(135deg, #f08a11, #fbbf24)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            Everywhere
                        </span>
                    </h1>
                    <p
                        style={{
                            fontSize: "1.125rem",
                            color: "rgba(255,255,255,0.6)",
                            lineHeight: 1.7,
                            maxWidth: 550,
                            margin: "0 auto",
                        }}
                    >
                        Native desktop and mobile apps for a faster, more
                        immersive freelancing experience. Download now — it&apos;s free.
                    </p>
                </div>
            </section>

            {/* ── Desktop Downloads ── */}
            <section style={{ maxWidth: 1000, margin: "0 auto", padding: "4rem 1.5rem" }}>
                <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                    <h2
                        style={{
                            fontSize: "1.75rem",
                            fontWeight: 800,
                            color: "#0f172a",
                            margin: "0 0 8px",
                        }}
                    >
                        🖥️ Desktop App
                    </h2>
                    <p style={{ fontSize: "0.9375rem", color: "#64748b", margin: 0 }}>
                        Built with Rust for maximum performance and minimal resource usage.
                    </p>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: 20,
                    }}
                >
                    {desktopDownloads.map((dl) => (
                        <div
                            key={dl.os}
                            style={{
                                background: "#fff",
                                borderRadius: 20,
                                border: "1px solid #e2e8f0",
                                overflow: "hidden",
                                boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
                                transition: "transform 0.2s, box-shadow 0.2s",
                            }}
                        >
                            {/* Colored header */}
                            <div
                                style={{
                                    background: dl.gradient,
                                    padding: "28px 24px 24px",
                                    textAlign: "center",
                                    color: "#fff",
                                }}
                            >
                                <span style={{ fontSize: 48, display: "block", marginBottom: 8 }}>
                                    {dl.icon}
                                </span>
                                <h3
                                    style={{
                                        fontSize: "1.25rem",
                                        fontWeight: 800,
                                        margin: "0 0 4px",
                                    }}
                                >
                                    {dl.os}
                                </h3>
                                <span
                                    style={{
                                        display: "inline-block",
                                        background: "rgba(255,255,255,0.2)",
                                        padding: "3px 10px",
                                        borderRadius: 6,
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                    }}
                                >
                                    {dl.format}
                                </span>
                            </div>

                            {/* Details */}
                            <div style={{ padding: "20px 24px 24px" }}>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 8,
                                        marginBottom: 20,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            fontSize: "0.8125rem",
                                            color: "#64748b",
                                        }}
                                    >
                                        <span style={{ fontSize: "0.875rem" }}>💻</span>
                                        {dl.requirement}
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            fontSize: "0.8125rem",
                                            color: "#64748b",
                                        }}
                                    >
                                        <span style={{ fontSize: "0.875rem" }}>⚙️</span>
                                        {dl.chip}
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            fontSize: "0.8125rem",
                                            color: "#64748b",
                                        }}
                                    >
                                        <span style={{ fontSize: "0.875rem" }}>🏷️</span>
                                        Version {VERSION}
                                    </div>
                                </div>

                                <a
                                    href={dl.href}
                                    download
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 8,
                                        width: "100%",
                                        padding: "12px 0",
                                        background: "linear-gradient(135deg, #f08a11, #e07a00)",
                                        color: "#fff",
                                        borderRadius: 12,
                                        fontWeight: 700,
                                        fontSize: "0.9375rem",
                                        textDecoration: "none",
                                        boxShadow: "0 4px 16px rgba(240,138,17,0.3)",
                                        border: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    ⬇️ Download for {dl.os}
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Mobile Apps ── */}
            <section style={{ background: "#f8fafc", padding: "4rem 1.5rem" }}>
                <div style={{ maxWidth: 700, margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                        <h2
                            style={{
                                fontSize: "1.75rem",
                                fontWeight: 800,
                                color: "#0f172a",
                                margin: "0 0 8px",
                            }}
                        >
                            📱 Mobile Apps
                        </h2>
                        <p style={{ fontSize: "0.9375rem", color: "#64748b", margin: 0 }}>
                            Manage your projects on the go — coming soon to iOS and Android.
                        </p>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: 20,
                        }}
                    >
                        {mobileApps.map((app) => (
                            <div
                                key={app.platform}
                                style={{
                                    background: "#fff",
                                    borderRadius: 20,
                                    border: "1px solid #e2e8f0",
                                    padding: "32px 24px",
                                    textAlign: "center",
                                    position: "relative",
                                    overflow: "hidden",
                                }}
                            >
                                {/* Coming Soon ribbon */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 16,
                                        right: -32,
                                        background: "linear-gradient(135deg, #f08a11, #e07a00)",
                                        color: "#fff",
                                        fontSize: "0.625rem",
                                        fontWeight: 800,
                                        padding: "4px 40px",
                                        transform: "rotate(45deg)",
                                        letterSpacing: "0.05em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Coming Soon
                                </div>

                                <span style={{ fontSize: 56, display: "block", marginBottom: 16 }}>
                                    {app.icon}
                                </span>
                                <h3
                                    style={{
                                        fontSize: "1.25rem",
                                        fontWeight: 800,
                                        color: "#0f172a",
                                        margin: "0 0 4px",
                                    }}
                                >
                                    {app.platform}
                                </h3>
                                <p
                                    style={{
                                        fontSize: "0.8125rem",
                                        color: "#94a3b8",
                                        margin: "0 0 20px",
                                    }}
                                >
                                    {app.note}
                                </p>

                                <div
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 8,
                                        background: "#f1f5f9",
                                        color: "#94a3b8",
                                        padding: "10px 24px",
                                        borderRadius: 12,
                                        fontWeight: 700,
                                        fontSize: "0.875rem",
                                        border: "1px dashed #cbd5e1",
                                    }}
                                >
                                    {app.storeBadge}
                                </div>

                                <p
                                    style={{
                                        fontSize: "0.75rem",
                                        color: "#94a3b8",
                                        marginTop: 12,
                                        marginBottom: 0,
                                    }}
                                >
                                    Expected March 2026
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Why Native Apps ── */}
            <section style={{ maxWidth: 1000, margin: "0 auto", padding: "4rem 1.5rem" }}>
                <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                    <h2
                        style={{
                            fontSize: "1.75rem",
                            fontWeight: 800,
                            color: "#0f172a",
                            margin: "0 0 8px",
                        }}
                    >
                        Why Go Native?
                    </h2>
                    <p style={{ fontSize: "0.9375rem", color: "#64748b", margin: 0, maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
                        Our apps are built for performance, security, and a seamless experience.
                    </p>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: 20,
                    }}
                >
                    {features.map((f) => (
                        <div
                            key={f.title}
                            style={{
                                background: "#fff",
                                borderRadius: 14,
                                padding: "24px",
                                border: "1px solid #e2e8f0",
                            }}
                        >
                            <span style={{ fontSize: 28, display: "block", marginBottom: 12 }}>
                                {f.icon}
                            </span>
                            <h3
                                style={{
                                    fontSize: "1rem",
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    margin: "0 0 8px",
                                }}
                            >
                                {f.title}
                            </h3>
                            <p
                                style={{
                                    fontSize: "0.875rem",
                                    color: "#64748b",
                                    lineHeight: 1.6,
                                    margin: 0,
                                }}
                            >
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Open Source / Tech ── */}
            <section
                style={{
                    background: "linear-gradient(135deg, #0f172a, #1e293b)",
                    padding: "3rem 1.5rem",
                    textAlign: "center",
                    color: "#fff",
                }}
            >
                <div style={{ maxWidth: 600, margin: "0 auto" }}>
                    <h2
                        style={{
                            fontSize: "1.5rem",
                            fontWeight: 800,
                            margin: "0 0 12px",
                        }}
                    >
                        Built with Modern Tech
                    </h2>
                    <p
                        style={{
                            fontSize: "0.9375rem",
                            color: "rgba(255,255,255,0.6)",
                            lineHeight: 1.7,
                            margin: "0 0 24px",
                        }}
                    >
                        Our desktop app is built with Tauri &amp; Rust for a secure, lightweight,
                        and blazing-fast experience. The mobile app is built with Flutter
                        for smooth, native performance on both platforms.
                    </p>
                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            justifyContent: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        {["Tauri", "Rust", "React", "Flutter"].map((tech) => (
                            <span
                                key={tech}
                                style={{
                                    background: "rgba(255,255,255,0.1)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    padding: "6px 16px",
                                    borderRadius: 8,
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                    color: "rgba(255,255,255,0.8)",
                                }}
                            >
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
                <h2
                    style={{
                        fontSize: "1.5rem",
                        fontWeight: 800,
                        color: "#0f172a",
                        margin: "0 0 8px",
                    }}
                >
                    Don&apos;t have an account yet?
                </h2>
                <p
                    style={{
                        fontSize: "0.9375rem",
                        color: "#64748b",
                        margin: "0 0 24px",
                    }}
                >
                    Join thousands of freelancers and businesses on MonkeysWork.
                </p>
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        justifyContent: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <Link
                        href="/register"
                        style={{
                            display: "inline-block",
                            padding: "12px 28px",
                            background: "linear-gradient(135deg, #f08a11, #e07a00)",
                            color: "#fff",
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: "0.9375rem",
                            textDecoration: "none",
                            boxShadow: "0 4px 16px rgba(240,138,17,0.3)",
                        }}
                    >
                        Create Free Account
                    </Link>
                    <Link
                        href="/login"
                        style={{
                            display: "inline-block",
                            padding: "12px 28px",
                            background: "#0f172a",
                            color: "#fff",
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: "0.9375rem",
                            textDecoration: "none",
                        }}
                    >
                        Sign In →
                    </Link>
                </div>
            </section>

            {/* ── Footer credit ── */}
            <div
                style={{
                    textAlign: "center",
                    padding: "1rem 1.5rem 2rem",
                    fontSize: "0.75rem",
                    color: "#94a3b8",
                }}
            >
                Powered by{" "}
                <a
                    href="https://monkeyscloud.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#f08a11", fontWeight: 600, textDecoration: "none" }}
                >
                    MonkeysCloud
                </a>
            </div>
        </div>
    );
}
