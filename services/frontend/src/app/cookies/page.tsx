import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Cookie Policy — MonkeysWorks",
    description: "MonkeysWorks Cookie Policy — detailed information about cookies and tracking technologies we use.",
};

const LAST_UPDATED = "February 22, 2026";

const cookieCategories = [
    {
        name: "Essential Cookies",
        icon: "🔒",
        required: true,
        description: "Required for basic Platform functionality. Cannot be disabled.",
        cookies: [
            { name: "mw_session", purpose: "Maintains your login session", duration: "Session", provider: "MonkeysWorks" },
            { name: "mw_csrf", purpose: "Prevents cross-site request forgery attacks", duration: "Session", provider: "MonkeysWorks" },
            { name: "mw_cookie_consent", purpose: "Stores your cookie preferences", duration: "1 year", provider: "MonkeysWorks" },
            { name: "__stripe_mid", purpose: "Payment fraud prevention", duration: "1 year", provider: "Stripe" },
            { name: "__stripe_sid", purpose: "Payment session identification", duration: "Session", provider: "Stripe" },
        ],
    },
    {
        name: "Analytics Cookies",
        icon: "📊",
        required: false,
        description: "Help us understand how visitors interact with our Platform to improve the experience.",
        cookies: [
            { name: "_ga", purpose: "Distinguishes unique users for Google Analytics", duration: "2 years", provider: "Google" },
            { name: "_ga_*", purpose: "Maintains session state for Google Analytics 4", duration: "2 years", provider: "Google" },
            { name: "_gid", purpose: "Distinguishes users for page view tracking", duration: "24 hours", provider: "Google" },
            { name: "_gat", purpose: "Throttles analytics request rate", duration: "1 minute", provider: "Google" },
        ],
    },
    {
        name: "Functional Cookies",
        icon: "⚙️",
        required: false,
        description: "Enable enhanced functionality like chat support, preferences, and personalized features.",
        cookies: [
            { name: "mw_theme", purpose: "Stores your display theme preference", duration: "1 year", provider: "MonkeysWorks" },
            { name: "mw_lang", purpose: "Stores your language preference", duration: "1 year", provider: "MonkeysWorks" },
            { name: "mw_sidebar", purpose: "Dashboard sidebar state", duration: "1 year", provider: "MonkeysWorks" },
        ],
    },
    {
        name: "Marketing Cookies",
        icon: "📢",
        required: false,
        description: "Used to deliver relevant advertisements and track campaign effectiveness. Currently not in use.",
        cookies: [],
    },
];

export default function CookiesPage() {
    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>
            <div style={{ marginBottom: "2.5rem" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                    Cookie Policy
                </h1>
                <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
                    Last updated: {LAST_UPDATED}
                </p>
            </div>

            {/* Intro */}
            <div style={{
                background: "#fff7ed",
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: "2rem",
                border: "1px solid #fed7aa",
                fontSize: "0.875rem",
                color: "#9a3412",
                lineHeight: 1.6,
            }}>
                🍪 This Cookie Policy explains what cookies are, how we use them on MonkeysWorks, and your choices regarding cookies.
                This policy is compliant with the <strong>EU ePrivacy Directive</strong>, <strong>GDPR</strong>, and <strong>CCPA</strong>.
            </div>

            {/* What are cookies */}
            <section style={{ marginBottom: "2.5rem" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", margin: "0 0 10px" }}>
                    What Are Cookies?
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#374151", margin: 0 }}>
                    Cookies are small text files stored on your device when you visit a website. They help the site remember
                    your preferences, understand how you use it, and improve your experience. Some cookies are essential for
                    the site to function, while others are optional and require your consent.
                </p>
            </section>

            {/* Your choices */}
            <section style={{ marginBottom: "2.5rem" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", margin: "0 0 10px" }}>
                    Your Cookie Choices
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#374151", margin: "0 0 12px" }}>
                    When you first visit MonkeysWorks, a cookie banner allows you to accept all cookies, reject non-essential cookies,
                    or customize your preferences by category. You can change your preferences at any time:
                </p>
                <div style={{
                    background: "#f8fafc",
                    borderRadius: 10,
                    padding: "14px 18px",
                    border: "1px solid #e2e8f0",
                    fontSize: "0.875rem",
                    color: "#374151",
                    lineHeight: 1.7,
                }}>
                    <strong>Method 1:</strong> Clear your browser cookies for monkeysworks.com — the cookie banner will reappear on your next visit.<br />
                    <strong>Method 2:</strong> Use your browser&apos;s built-in cookie settings to block or delete specific cookies.<br />
                    <strong>Method 3:</strong> Use browser extensions like &quot;Privacy Badger&quot; or &quot;uBlock Origin&quot; for granular control.
                </div>
            </section>

            {/* Cookie categories */}
            {cookieCategories.map((cat, i) => (
                <section key={i} style={{ marginBottom: "2rem" }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 10,
                        paddingBottom: 8,
                        borderBottom: "1px solid #f1f5f9",
                    }}>
                        <span style={{ fontSize: 20 }}>{cat.icon}</span>
                        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                            {cat.name}
                        </h2>
                        <span style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 20,
                            background: cat.required ? "#dbeafe" : "#f1f5f9",
                            color: cat.required ? "#1d4ed8" : "#64748b",
                        }}>
                            {cat.required ? "Always Active" : "Optional"}
                        </span>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "0 0 12px", lineHeight: 1.6 }}>
                        {cat.description}
                    </p>

                    {cat.cookies.length > 0 && (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: "0.8125rem",
                            }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc" }}>
                                        {["Cookie", "Purpose", "Duration", "Provider"].map((h) => (
                                            <th key={h} style={{
                                                textAlign: "left",
                                                padding: "8px 12px",
                                                fontWeight: 700,
                                                color: "#64748b",
                                                borderBottom: "1px solid #e2e8f0",
                                                fontSize: "0.75rem",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                            }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {cat.cookies.map((c, j) => (
                                        <tr key={j}>
                                            <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, color: "#0f172a", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                                                {c.name}
                                            </td>
                                            <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", color: "#374151" }}>
                                                {c.purpose}
                                            </td>
                                            <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", color: "#64748b", whiteSpace: "nowrap" }}>
                                                {c.duration}
                                            </td>
                                            <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", color: "#64748b" }}>
                                                {c.provider}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {cat.cookies.length === 0 && (
                        <p style={{ fontSize: "0.8125rem", color: "#94a3b8", fontStyle: "italic" }}>
                            No marketing cookies are currently in use.
                        </p>
                    )}
                </section>
            ))}

            {/* Third-party info */}
            <section style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", margin: "0 0 10px" }}>
                    Third-Party Cookies & Opt-Out
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#374151", margin: 0 }}>
                    Google Analytics: You can opt out by installing the{" "}
                    <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer"
                        style={{ color: "#f08a11", textDecoration: "underline" }}>
                        Google Analytics Opt-out Browser Add-on
                    </a>.
                    We use IP anonymization (anonymize_ip) to mask the last octet of your IP address before it is stored.
                    Stripe: Payment cookies are strictly necessary and cannot be disabled while using payment features.
                    Learn more at{" "}
                    <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer"
                        style={{ color: "#f08a11", textDecoration: "underline" }}>
                        Stripe&apos;s Privacy Policy
                    </a>.
                </p>
            </section>

            {/* Do Not Track */}
            <section style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", margin: "0 0 10px" }}>
                    Do Not Track (DNT)
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#374151", margin: 0 }}>
                    We honor Do Not Track browser signals. When DNT is enabled, we treat it as equivalent to rejecting
                    non-essential cookies and will not load analytics or marketing cookies.
                </p>
            </section>

            {/* Contact */}
            <section style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", margin: "0 0 10px" }}>
                    Contact
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#374151", margin: 0 }}>
                    For questions about our cookie practices, contact us at privacy@monkeysworks.com.
                </p>
            </section>

            {/* Links */}
            <div style={{
                background: "#f8fafc",
                borderRadius: 12,
                padding: "16px 20px",
                marginTop: "2rem",
                border: "1px solid #e2e8f0",
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                fontSize: "0.875rem",
            }}>
                <Link href="/privacy" style={{ color: "#f08a11", textDecoration: "none", fontWeight: 600 }}>🔒 Privacy Policy</Link>
                <Link href="/terms" style={{ color: "#f08a11", textDecoration: "none", fontWeight: 600 }}>📋 Terms of Service</Link>
                <Link href="/contact" style={{ color: "#f08a11", textDecoration: "none", fontWeight: 600 }}>📧 Contact Us</Link>
            </div>
        </div>
    );
}
