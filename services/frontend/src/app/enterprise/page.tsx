import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Enterprise Solutions — MonkeysWork",
    description: "Scale your workforce with MonkeysWork Enterprise. Dedicated account management, custom contracts, compliance, and bulk hiring for organizations.",
};

const features = [
    {
        icon: "👤",
        title: "Dedicated Account Manager",
        description: "A single point of contact who understands your business, manages your talent pool, and ensures every project meets your standards.",
    },
    {
        icon: "📝",
        title: "Custom Contracts & SLAs",
        description: "Tailored service level agreements, custom payment terms, and flexible contracts designed for enterprise procurement workflows.",
    },
    {
        icon: "🔐",
        title: "Compliance & Security",
        description: "SOC 2 compliance, SSO/SAML integration, custom NDAs, IP assignment agreements, and data residency options for regulated industries.",
    },
    {
        icon: "👥",
        title: "Team & Bulk Hiring",
        description: "Hire entire teams of vetted freelancers for large-scale projects. Our AI matching engine finds the right combination of skills and availability.",
    },
    {
        icon: "📊",
        title: "Analytics Dashboard",
        description: "Real-time reporting on spend, project progress, freelancer performance, and budget utilization across your organization.",
    },
    {
        icon: "🏦",
        title: "Consolidated Billing",
        description: "Single invoice, purchase order support, net-30/60/90 payment terms, and integration with your AP system.",
    },
    {
        icon: "🤖",
        title: "AI Talent Matching",
        description: "Our Vertex AI engine analyzes your requirements and matches you with pre-vetted freelancers who have proven track records in your industry.",
    },
    {
        icon: "⚖️",
        title: "Legal & Tax Compliance",
        description: "Automated W-9/W-8 collection, 1099 filing, contractor classification guidance, and compliance with local labor laws across 150+ countries.",
    },
];

const useCases = [
    { icon: "🏗️", title: "Product Development", description: "Augment your in-house team with specialized developers, designers, and QA engineers for product sprints." },
    { icon: "📈", title: "Marketing Campaigns", description: "Access top creative talent for content creation, social media, SEO, and paid advertising campaigns." },
    { icon: "🔬", title: "Research & Analysis", description: "Engage data scientists, researchers, and analysts for market research, competitive analysis, and insights." },
    { icon: "🌐", title: "Localization", description: "Translate and localize your products for global markets with native-speaking professionals." },
];

export default function EnterprisePage() {
    return (
        <div>
            {/* Hero */}
            <section style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
                padding: "5rem 1.5rem",
                textAlign: "center",
                color: "#ffffff",
                position: "relative",
                overflow: "hidden",
            }}>
                <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 600,
                    height: 600,
                    background: "radial-gradient(circle, rgba(240,138,17,0.08) 0%, transparent 70%)",
                    borderRadius: "50%",
                }} />
                <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
                    <span style={{
                        display: "inline-block",
                        background: "rgba(240, 138, 17, 0.15)",
                        color: "#f08a11",
                        padding: "6px 16px",
                        borderRadius: 20,
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        marginBottom: 20,
                        border: "1px solid rgba(240,138,17,0.25)",
                    }}>
                        Enterprise Solutions
                    </span>
                    <h1 style={{ fontSize: "2.75rem", fontWeight: 800, margin: "0 0 16px", lineHeight: 1.15 }}>
                        Scale Your Workforce with <span style={{ color: "#f08a11" }}>Confidence</span>
                    </h1>
                    <p style={{ fontSize: "1.125rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 550, margin: "0 auto 28px" }}>
                        Enterprise-grade freelance talent management with dedicated support,
                        compliance, and AI-powered matching for organizations of all sizes.
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                        <Link href="/contact?reason=enterprise" style={{
                            display: "inline-block",
                            padding: "14px 32px",
                            background: "linear-gradient(135deg, #f08a11, #e07a00)",
                            color: "#fff",
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: "1rem",
                            textDecoration: "none",
                        }}>
                            Talk to Sales
                        </Link>
                        <Link href="/pricing" style={{
                            display: "inline-block",
                            padding: "14px 32px",
                            background: "transparent",
                            color: "#fff",
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: "1rem",
                            textDecoration: "none",
                            border: "1px solid rgba(255,255,255,0.2)",
                        }}>
                            View Pricing
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features grid */}
            <section style={{ maxWidth: 1100, margin: "0 auto", padding: "4rem 1.5rem" }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", textAlign: "center", margin: "0 0 12px" }}>
                    Everything Your Organization Needs
                </h2>
                <p style={{ fontSize: "1rem", color: "#64748b", textAlign: "center", margin: "0 0 2.5rem", maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
                    Built for teams that demand reliability, security, and scale.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
                    {features.map((f, i) => (
                        <div key={i} style={{
                            background: "#fff",
                            borderRadius: 14,
                            padding: "24px",
                            border: "1px solid #e2e8f0",
                            transition: "box-shadow 0.2s",
                        }}>
                            <span style={{ fontSize: 28, display: "block", marginBottom: 12 }}>{f.icon}</span>
                            <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
                                {f.title}
                            </h3>
                            <p style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                                {f.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Use cases */}
            <section style={{ background: "#f8fafc", padding: "4rem 1.5rem" }}>
                <div style={{ maxWidth: 900, margin: "0 auto" }}>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", textAlign: "center", margin: "0 0 2rem" }}>
                        Common Use Cases
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
                        {useCases.map((u, i) => (
                            <div key={i} style={{
                                background: "#fff",
                                borderRadius: 14,
                                padding: "24px",
                                border: "1px solid #e2e8f0",
                                textAlign: "center",
                            }}>
                                <span style={{ fontSize: 36, display: "block", marginBottom: 12 }}>{u.icon}</span>
                                <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
                                    {u.title}
                                </h3>
                                <p style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.5, margin: 0 }}>
                                    {u.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trusted by */}
            <section style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
                    Trusted by forward-thinking companies
                </p>
                <p style={{ fontSize: "0.875rem", color: "#cbd5e1" }}>
                    From startups to Fortune 500 — MonkeysWork Enterprise scales with you.
                </p>
            </section>

            {/* CTA */}
            <section style={{
                background: "linear-gradient(135deg, #f08a11 0%, #e07a00 100%)",
                padding: "3.5rem 1.5rem",
                textAlign: "center",
                color: "#fff",
            }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0 0 12px" }}>
                    Ready to Transform Your Workforce?
                </h2>
                <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.85)", margin: "0 0 24px", maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
                    Get a customized plan for your organization. Our enterprise team will help you get started.
                </p>
                <Link href="/contact?reason=enterprise" style={{
                    display: "inline-block",
                    padding: "14px 36px",
                    background: "#fff",
                    color: "#e07a00",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: "1rem",
                    textDecoration: "none",
                }}>
                    Schedule a Demo
                </Link>
            </section>
        </div>
    );
}
