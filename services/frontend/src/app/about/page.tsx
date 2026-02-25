import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
    title: "About MonkeysWorks — AI-Powered Freelance Marketplace",
    description: "Learn about MonkeysWorks, the AI-powered freelance marketplace by MonkeysCloud. Our mission, values, and the team behind the platform.",
};

const stats = [
    { value: "50K+", label: "Freelancers" },
    { value: "12K+", label: "Projects Completed" },
    { value: "98%", label: "Satisfaction Rate" },
    { value: "150+", label: "Countries" },
];

const values = [
    { icon: "🤝", title: "Trust & Transparency", description: "Every payment is escrow-protected. Every review is verified. We build trust through radical transparency." },
    { icon: "🤖", title: "AI-First Innovation", description: "We use artificial intelligence not to replace humans, but to amplify their potential — smarter matching, faster workflows, better outcomes." },
    { icon: "🌍", title: "Global & Inclusive", description: "Talent knows no borders. We connect professionals from over 150 countries, creating opportunities for everyone regardless of location." },
    { icon: "🛡️", title: "Security & Privacy", description: "Your data is encrypted, your payments are protected, and your privacy is respected. GDPR and CCPA compliant by design." },
    { icon: "⚡", title: "Speed & Efficiency", description: "From posting a job to getting matched with the right talent — our AI-powered platform reduces time-to-hire from weeks to hours." },
    { icon: "🎯", title: "Quality Obsession", description: "AI-powered vetting, skill verification, and continuous quality monitoring ensure exceptional results on every project." },
];

const timeline = [
    { year: "2024", event: "MonkeysCloud founded with a vision to revolutionize freelance work" },
    { year: "2025", event: "MonkeysWorks marketplace beta launch with AI matching engine" },
    { year: "2026", event: "Platform launch with escrow payments, dispute resolution, and AI integration" },
];

const ecosystem = [
    { name: "MonkeysWorks", desc: "A freelancer marketplace focused on fair commissions and better collaboration", color: "#f08a11" },
    { name: "MonkeysCloud", desc: "An all-in-one SaaS platform for managing projects, code, and hosting", color: "#3b82f6" },
    { name: "MonkeysLegion", desc: "A modular development framework and tooling ecosystem for modern apps", color: "#8b5cf6" },
    { name: "MonkeysAI", desc: "A self-hosted AI platform running LLM training and inference on Google Cloud GPU clusters", color: "#22c55e" },
];

export default function AboutPage() {
    return (
        <div>
            {/* Hero */}
            <section style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                padding: "5rem 1.5rem",
                textAlign: "center",
                color: "#ffffff",
            }}>
                <div style={{ maxWidth: 800, margin: "0 auto" }}>
                    <span style={{
                        display: "inline-block",
                        background: "rgba(240, 138, 17, 0.15)",
                        color: "#f08a11",
                        padding: "6px 16px",
                        borderRadius: 20,
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        marginBottom: 20,
                    }}>
                        Part of MonkeysCloud
                    </span>
                    <h1 style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0 0 16px", lineHeight: 1.2 }}>
                        Building the Future of <span style={{ color: "#f08a11" }}>Freelance Work</span>
                    </h1>
                    <p style={{ fontSize: "1.125rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, maxWidth: 600, margin: "0 auto" }}>
                        MonkeysWorks is an AI-powered freelance marketplace that connects exceptional talent
                        with ambitious projects. We&apos;re making freelance work more efficient, transparent, and rewarding.
                    </p>
                </div>
            </section>

            {/* Stats */}
            <section style={{
                maxWidth: 900,
                margin: "-2rem auto 0",
                padding: "0 1.5rem",
            }}>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 1,
                    background: "#e2e8f0",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}>
                    {stats.map((s, i) => (
                        <div key={i} style={{ background: "#fff", padding: "24px 16px", textAlign: "center" }}>
                            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f08a11" }}>{s.value}</div>
                            <div style={{ fontSize: "0.8125rem", color: "#64748b", marginTop: 4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Mission */}
            <section style={{ maxWidth: 800, margin: "0 auto", padding: "4rem 1.5rem" }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px", textAlign: "center" }}>
                    Our Mission
                </h2>
                <p style={{ fontSize: "1.0625rem", lineHeight: 1.8, color: "#374151", textAlign: "center", maxWidth: 650, margin: "0 auto" }}>
                    We believe that the best work happens when the right people find each other. Our mission is to
                    use artificial intelligence to eliminate friction in the freelance economy — making it easier for
                    businesses to find exceptional talent, and for professionals to find meaningful work that matches
                    their skills and aspirations.
                </p>
            </section>

            {/* ── Founder ── */}
            <section style={{ background: "#f8fafc", padding: "4rem 1.5rem" }}>
                <div style={{ maxWidth: 900, margin: "0 auto" }}>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: "0 0 2rem", textAlign: "center" }}>
                        Meet the Founder
                    </h2>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "220px 1fr",
                        gap: 32,
                        alignItems: "start",
                        background: "#fff",
                        borderRadius: 20,
                        padding: 32,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
                    }}>
                        {/* Photo */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                            <div style={{
                                width: 180,
                                height: 180,
                                borderRadius: "50%",
                                overflow: "hidden",
                                border: "4px solid #f08a11",
                                boxShadow: "0 4px 20px rgba(240,138,17,0.2)",
                            }}>
                                <Image
                                    src="/jorge-peraza.jpg"
                                    alt="Jorge Peraza — Founder of MonkeysWorks"
                                    width={180}
                                    height={180}
                                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                                    priority
                                />
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", margin: "0 0 2px" }}>
                                    Jorge Peraza
                                </h3>
                                <p style={{ fontSize: "0.8125rem", color: "#f08a11", fontWeight: 600, margin: "0 0 6px" }}>
                                    Founder & CEO
                                </p>
                                <a
                                    href="https://www.linkedin.com/in/jorgeperaza/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        fontSize: "0.75rem",
                                        color: "#0a66c2",
                                        textDecoration: "none",
                                        fontWeight: 600,
                                        padding: "4px 10px",
                                        borderRadius: 6,
                                        background: "#f0f7ff",
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#0a66c2">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                    LinkedIn
                                </a>
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <p style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#374151", margin: "0 0 16px" }}>
                                Jorge Peraza is a full-stack engineer, cloud architect, and startup founder with more than
                                20 years of experience designing scalable web platforms and AI-powered infrastructure.
                            </p>

                            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a", margin: "0 0 10px" }}>
                                Creator of the Monkeys ecosystem:
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                                {ecosystem.map((e, i) => (
                                    <div key={i} style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        padding: "8px 12px",
                                        background: "#f8fafc",
                                        borderRadius: 8,
                                        borderLeft: `3px solid ${e.color}`,
                                    }}>
                                        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: e.color, minWidth: 120 }}>
                                            {e.name}
                                        </span>
                                        <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                                            {e.desc}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <p style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#374151", margin: "0 0 12px" }}>
                                Jorge specializes in Next.js, Symfony APIs, Kubernetes, DevOps automation, AI pipelines,
                                and scalable cloud systems, running production workloads across multiple domains with his own infrastructure.
                            </p>

                            <p style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#374151", margin: "0 0 16px" }}>
                                In parallel, he is the founder of <strong>ColibriV</strong>, a hydrogen-combustion aviation startup
                                preparing for a Reg CF raise and building sustainable aerospace technology.
                            </p>

                            <div style={{
                                background: "linear-gradient(135deg, #0f172a, #1e293b)",
                                borderRadius: 12,
                                padding: "16px 20px",
                                color: "#fff",
                            }}>
                                <p style={{ fontSize: "0.9375rem", fontWeight: 600, margin: 0, lineHeight: 1.6 }}>
                                    👉 &quot;Build tools that help developers and founders move faster, cheaper, and smarter.&quot;
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section style={{ background: "#f8fafc", padding: "4rem 1.5rem" }}>
                <div style={{ maxWidth: 1000, margin: "0 auto" }}>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: "0 0 2rem", textAlign: "center" }}>
                        Our Values
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                        {values.map((v, i) => (
                            <div key={i} style={{
                                background: "#fff",
                                borderRadius: 14,
                                padding: "24px",
                                border: "1px solid #e2e8f0",
                            }}>
                                <span style={{ fontSize: 28, display: "block", marginBottom: 12 }}>{v.icon}</span>
                                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
                                    {v.title}
                                </h3>
                                <p style={{ fontSize: "0.875rem", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                                    {v.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section style={{ maxWidth: 700, margin: "0 auto", padding: "4rem 1.5rem" }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: "0 0 2rem", textAlign: "center" }}>
                    Our Journey
                </h2>
                {timeline.map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: 20, marginBottom: 24, alignItems: "flex-start" }}>
                        <div style={{
                            background: "linear-gradient(135deg, #f08a11, #e07a00)",
                            color: "#fff",
                            fontWeight: 800,
                            fontSize: "0.875rem",
                            padding: "6px 14px",
                            borderRadius: 8,
                            flexShrink: 0,
                        }}>
                            {t.year}
                        </div>
                        <p style={{ fontSize: "0.9375rem", color: "#374151", lineHeight: 1.6, margin: 0 }}>
                            {t.event}
                        </p>
                    </div>
                ))}
            </section>

            {/* MonkeysCloud */}
            <section style={{
                background: "linear-gradient(135deg, #0f172a, #1e293b)",
                padding: "3rem 1.5rem",
                textAlign: "center",
                color: "#fff",
            }}>
                <div style={{ maxWidth: 600, margin: "0 auto" }}>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 12px" }}>
                        Part of MonkeysCloud
                    </h2>
                    <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, margin: "0 0 20px" }}>
                        MonkeysWorks is a product of MonkeysCloud, a technology company building AI-powered cloud
                        services for the modern workforce.
                    </p>
                    <a
                        href="https://monkeys.cloud"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: "inline-block",
                            padding: "10px 24px",
                            background: "#f08a11",
                            color: "#fff",
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: "0.875rem",
                            textDecoration: "none",
                        }}
                    >
                        Visit MonkeysCloud →
                    </a>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>
                    Ready to Get Started?
                </h2>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <Link href="/register/freelancer" style={{
                        display: "inline-block",
                        padding: "12px 28px",
                        background: "linear-gradient(135deg, #f08a11, #e07a00)",
                        color: "#fff",
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                        textDecoration: "none",
                    }}>
                        Join as Freelancer
                    </Link>
                    <Link href="/register/client" style={{
                        display: "inline-block",
                        padding: "12px 28px",
                        background: "#0f172a",
                        color: "#fff",
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                        textDecoration: "none",
                    }}>
                        Hire Talent
                    </Link>
                </div>
            </section>
        </div>
    );
}
