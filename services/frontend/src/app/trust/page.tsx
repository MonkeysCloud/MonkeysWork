import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Trust & Safety — MonkeysWork",
    description: "How MonkeysWork protects clients and freelancers with escrow payments, identity verification, dispute resolution, and AI-powered content moderation.",
};

const pillars = [
    {
        icon: "🛡️",
        title: "Escrow Payment Protection",
        description: "Every fixed-price milestone is funded in escrow before work begins. Funds are only released when the client approves the deliverable — or after the 14-day auto-acceptance window. This ensures freelancers get paid for completed work and clients only pay for satisfactory results.",
        highlights: ["Funds held securely in escrow", "14-day review period for clients", "Automatic dispute mediation", "Stripe-powered payment processing"],
    },
    {
        icon: "🔍",
        title: "Identity Verification",
        description: "All users undergo verification to ensure they are who they say they are. Our multi-step process includes email verification, document checks, and profile review to create a trusted community.",
        highlights: ["Email and phone verification", "Government ID verification", "Profile completeness scoring", "Verified badges for trusted users"],
    },
    {
        icon: "🤖",
        title: "AI Content Moderation",
        description: "Our Vertex AI-powered moderation system reviews all job posts, proposals, and content in real-time. It detects spam, fraudulent listings, inappropriate content, and policy violations — escalating edge cases to our human review team.",
        highlights: ["Real-time AI content scanning", "Spam and scam detection", "Human review for edge cases", "Continuous model improvement"],
    },
    {
        icon: "⚖️",
        title: "Dispute Resolution",
        description: "When disagreements arise, our structured dispute resolution process helps both parties reach a fair outcome. Evidence is reviewed, communication records are considered, and binding decisions are made regarding escrowed funds.",
        highlights: ["Structured mediation process", "Evidence-based decisions", "Timeline-bound resolution", "Escalation to arbitration if needed"],
    },
    {
        icon: "🔒",
        title: "Data Security & Privacy",
        description: "Your data is protected with enterprise-grade security. We use TLS 1.3 encryption, AES-256 at rest, and are hosted on SOC 2 compliant infrastructure. We are fully GDPR and CCPA compliant.",
        highlights: ["TLS 1.3 + AES-256 encryption", "SOC 2 cloud infrastructure", "GDPR & CCPA compliant", "72-hour breach notification"],
    },
    {
        icon: "🚫",
        title: "Fraud Prevention",
        description: "Our multi-layered fraud detection system monitors for suspicious activity including fake accounts, payment fraud, review manipulation, and fee circumvention. Machine learning models continuously adapt to new fraud patterns.",
        highlights: ["Multi-layered fraud detection", "Behavioral analysis", "Rate limiting & monitoring", "Zero tolerance for fee circumvention"],
    },
];

const reporting = [
    { icon: "🚩", label: "Report a user", description: "Flag inappropriate behavior or policy violations" },
    { icon: "⚠️", label: "Report a job", description: "Report spam, scam, or misleading job listings" },
    { icon: "📢", label: "Report content", description: "Flag inappropriate messages or portfolio content" },
    { icon: "💳", label: "Payment issue", description: "Report payment fraud or unauthorized charges" },
];

export default function TrustPage() {
    return (
        <div>
            {/* Hero */}
            <section style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                padding: "5rem 1.5rem",
                textAlign: "center",
                color: "#ffffff",
            }}>
                <div style={{ maxWidth: 700, margin: "0 auto" }}>
                    <span style={{
                        display: "inline-block",
                        background: "rgba(34, 197, 94, 0.15)",
                        color: "#4ade80",
                        padding: "6px 16px",
                        borderRadius: 20,
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        marginBottom: 20,
                        border: "1px solid rgba(34, 197, 94, 0.25)",
                    }}>
                        Your Safety Matters
                    </span>
                    <h1 style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0 0 16px", lineHeight: 1.2 }}>
                        Trust & <span style={{ color: "#f08a11" }}>Safety</span>
                    </h1>
                    <p style={{ fontSize: "1.125rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                        We protect every transaction, verify every user, and moderate every interaction
                        to create the safest freelance marketplace on the web.
                    </p>
                </div>
            </section>

            {/* Pillars */}
            <section style={{ maxWidth: 1000, margin: "0 auto", padding: "4rem 1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                    {pillars.map((p, i) => (
                        <div key={i} style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 32,
                            alignItems: "center",
                            background: "#fff",
                            borderRadius: 16,
                            padding: 32,
                            border: "1px solid #e2e8f0",
                        }}>
                            <div style={{ order: i % 2 === 0 ? 1 : 2 }}>
                                <span style={{ fontSize: 36, display: "block", marginBottom: 12 }}>{p.icon}</span>
                                <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>
                                    {p.title}
                                </h2>
                                <p style={{ fontSize: "0.9375rem", color: "#64748b", lineHeight: 1.7, margin: 0 }}>
                                    {p.description}
                                </p>
                            </div>
                            <div style={{ order: i % 2 === 0 ? 2 : 1 }}>
                                <div style={{
                                    background: "#f8fafc",
                                    borderRadius: 12,
                                    padding: 20,
                                    border: "1px solid #f1f5f9",
                                }}>
                                    {p.highlights.map((h, j) => (
                                        <div key={j} style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            padding: "8px 0",
                                            borderBottom: j < p.highlights.length - 1 ? "1px solid #f1f5f9" : "none",
                                        }}>
                                            <span style={{ color: "#22c55e", fontSize: 16, flexShrink: 0 }}>✓</span>
                                            <span style={{ fontSize: "0.875rem", color: "#374151" }}>{h}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Report section */}
            <section style={{ background: "#f8fafc", padding: "4rem 1.5rem" }}>
                <div style={{ maxWidth: 800, margin: "0 auto" }}>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", textAlign: "center", margin: "0 0 12px" }}>
                        See Something? Report It.
                    </h2>
                    <p style={{ fontSize: "0.9375rem", color: "#64748b", textAlign: "center", margin: "0 0 2rem" }}>
                        Our team reviews every report within 24 hours. All reports are confidential.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                        {reporting.map((r, i) => (
                            <Link href="/help/contact" key={i} style={{
                                background: "#fff",
                                borderRadius: 12,
                                padding: "20px",
                                border: "1px solid #e2e8f0",
                                textDecoration: "none",
                                textAlign: "center",
                            }}>
                                <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}>{r.icon}</span>
                                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                                    {r.label}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                                    {r.description}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: "3.5rem 1.5rem", textAlign: "center" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>
                    Questions About Safety?
                </h2>
                <p style={{ fontSize: "0.9375rem", color: "#64748b", margin: "0 0 20px" }}>
                    Visit our Help Center or contact our Trust & Safety team directly.
                </p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <Link href="/help" style={{
                        display: "inline-block", padding: "12px 28px",
                        background: "linear-gradient(135deg, #f08a11, #e07a00)", color: "#fff",
                        borderRadius: 10, fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none",
                    }}>Help Center</Link>
                    <Link href="/contact" style={{
                        display: "inline-block", padding: "12px 28px",
                        background: "#0f172a", color: "#fff",
                        borderRadius: 10, fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none",
                    }}>Contact Safety Team</Link>
                </div>
            </section>
        </div>
    );
}
