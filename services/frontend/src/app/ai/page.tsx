import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "AI Features — MonkeysWorks",
    description: "Discover how MonkeysWorks uses advanced AI for smart job matching, proposal assistance, content moderation, and scope analysis.",
};

const features = [
    {
        icon: "🎯",
        title: "Smart Job Matching",
        color: "#f08a11",
        description: "Our AI analyzes freelancer skills, experience, ratings, past projects, and work preferences to rank candidates with a match score. Clients see the best-fit talent first — reducing time-to-hire by up to 80%.",
        details: ["Multi-dimensional skill matching", "Experience & budget alignment", "Location & timezone awareness", "Continuous learning from hiring outcomes"],
    },
    {
        icon: "✍️",
        title: "AI Proposal Assistant",
        color: "#8b5cf6",
        description: "Freelancers can generate tailored proposal drafts powered by our AI engine. The assistant analyzes the job description, highlights relevant experience, and crafts a compelling pitch — giving freelancers a competitive edge.",
        details: ["Job-aware proposal generation", "Tone & length customization", "Highlights relevant portfolio work", "Budget & timeline suggestions"],
    },
    {
        icon: "🔬",
        title: "AI Scope Analysis",
        color: "#06b6d4",
        description: "When clients post a job, our AI breaks it down into suggested milestones, estimates timelines, and recommends budgets based on similar completed projects. This helps set realistic expectations from the start.",
        details: ["Automatic milestone suggestions", "Timeline estimation", "Budget benchmarking", "Complexity assessment"],
    },
    {
        icon: "🛡️",
        title: "AI Content Moderation",
        color: "#22c55e",
        description: "Every job post and proposal passes through our AI moderation pipeline. It scores content for quality, detects spam, flags policy violations, and either auto-approves or escalates to human review — all within seconds.",
        details: ["Real-time quality scoring", "Spam & scam detection", "Policy violation flagging", "Confidence-based auto-approve/reject"],
    },
    {
        icon: "💡",
        title: "AI Job Enhancement",
        color: "#eab308",
        description: "Clients can improve their job descriptions with AI suggestions. The assistant analyzes clarity, completeness, and appeal — then recommends specific improvements to attract better talent.",
        details: ["Clarity & completeness analysis", "SEO-optimized titles", "Skill tag suggestions", "Competitive benchmark tips"],
    },
    {
        icon: "🔍",
        title: "Smart Search & Discovery",
        color: "#ec4899",
        description: "Natural language search powered by AI lets you find talent or jobs by describing what you need in plain English. No complex filters needed — just say what you're looking for.",
        details: ["Natural language queries", "Semantic understanding", "Related skill expansion", "Personalized results ranking"],
    },
];

const aiCapabilities = [
    { icon: "🧠", name: "Intelligent Matching", desc: "Multi-signal algorithms that learn from every hire to surface better talent over time" },
    { icon: "⚡", name: "Real-Time Analysis", desc: "Instant scoring, moderation, and recommendations — no waiting around" },
    { icon: "🔮", name: "Predictive Insights", desc: "Budget estimates, timeline forecasting, and success probability for every project" },
    { icon: "🔒", name: "Privacy-First Design", desc: "Anonymized, aggregated data powers our models — your personal info stays private" },
];

export default function AiPage() {
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
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "radial-gradient(ellipse at 30% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(240, 138, 17, 0.08) 0%, transparent 50%)",
                }} />
                <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
                    <span style={{
                        display: "inline-block",
                        background: "rgba(139, 92, 246, 0.15)",
                        color: "#a78bfa",
                        padding: "6px 16px",
                        borderRadius: 20,
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        marginBottom: 20,
                        border: "1px solid rgba(139, 92, 246, 0.25)",
                    }}>
                        AI-Powered Platform
                    </span>
                    <h1 style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0 0 16px", lineHeight: 1.2 }}>
                        AI That Makes Freelancing <span style={{ color: "#f08a11" }}>Smarter</span>
                    </h1>
                    <p style={{ fontSize: "1.125rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                        From intelligent matching to automated moderation, AI is at the core of everything
                        we do — helping both clients and freelancers work more efficiently.
                    </p>
                </div>
            </section>

            {/* Features */}
            <section style={{ maxWidth: 1000, margin: "0 auto", padding: "4rem 1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                    {features.map((f, i) => (
                        <div key={i} style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 32,
                            alignItems: "center",
                            background: "#fff",
                            borderRadius: 16,
                            padding: 32,
                            border: "1px solid #e2e8f0",
                            borderLeft: `4px solid ${f.color}`,
                        }}>
                            <div style={{ order: i % 2 === 0 ? 1 : 2 }}>
                                <span style={{ fontSize: 36, display: "block", marginBottom: 12 }}>{f.icon}</span>
                                <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>
                                    {f.title}
                                </h2>
                                <p style={{ fontSize: "0.9375rem", color: "#64748b", lineHeight: 1.7, margin: 0 }}>
                                    {f.description}
                                </p>
                            </div>
                            <div style={{ order: i % 2 === 0 ? 2 : 1 }}>
                                <div style={{
                                    background: "#f8fafc",
                                    borderRadius: 12,
                                    padding: 20,
                                    border: "1px solid #f1f5f9",
                                }}>
                                    {f.details.map((d, j) => (
                                        <div key={j} style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            padding: "8px 0",
                                            borderBottom: j < f.details.length - 1 ? "1px solid #f1f5f9" : "none",
                                        }}>
                                            <span style={{ color: f.color, fontSize: 16, flexShrink: 0 }}>✓</span>
                                            <span style={{ fontSize: "0.875rem", color: "#374151" }}>{d}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* AI Capabilities */}
            <section style={{ background: "#f8fafc", padding: "3rem 1.5rem" }}>
                <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                        Built for Performance at Scale
                    </h2>
                    <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "0 0 24px" }}>
                        Our AI infrastructure is designed to handle millions of matches, proposals, and decisions — reliably and fast
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                        {aiCapabilities.map((c, i) => (
                            <div key={i} style={{
                                background: "#fff",
                                borderRadius: 12,
                                padding: "20px 12px",
                                border: "1px solid #e2e8f0",
                            }}>
                                <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
                                <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                                    {c.name}
                                </div>
                                <div style={{ fontSize: "0.6875rem", color: "#94a3b8", lineHeight: 1.5 }}>
                                    {c.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Ethics */}
            <section style={{ maxWidth: 700, margin: "0 auto", padding: "3rem 1.5rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px", textAlign: "center" }}>
                    Our AI Ethics Principles
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                        { emoji: "🤝", principle: "Transparency", detail: "We tell you when AI is involved in a decision. No hidden algorithms." },
                        { emoji: "⚖️", principle: "Fairness", detail: "Our models are regularly audited for bias across gender, ethnicity, and geography." },
                        { emoji: "👤", principle: "Human Override", detail: "Every automated decision can be reviewed and overridden by a human." },
                        { emoji: "🔒", principle: "Privacy First", detail: "AI models never see your personal data. We use anonymized, aggregated patterns." },
                        { emoji: "🎯", principle: "Augmentation, Not Replacement", detail: "AI helps humans work smarter — it doesn't replace human judgment." },
                    ].map((p, i) => (
                        <div key={i} style={{
                            display: "flex",
                            gap: 14,
                            alignItems: "flex-start",
                            background: "#fff",
                            borderRadius: 12,
                            padding: "16px 20px",
                            border: "1px solid #e2e8f0",
                        }}>
                            <span style={{ fontSize: 24, flexShrink: 0 }}>{p.emoji}</span>
                            <div>
                                <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>
                                    {p.principle}
                                </div>
                                <div style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.5 }}>
                                    {p.detail}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                padding: "3.5rem 1.5rem",
                textAlign: "center",
                color: "#fff",
            }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0 0 12px" }}>
                    Experience AI-Powered Freelancing
                </h2>
                <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.8)", margin: "0 0 24px", maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
                    Join thousands of professionals already using MonkeysWorks to find better matches, faster.
                </p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <Link href="/register" style={{
                        display: "inline-block", padding: "14px 32px",
                        background: "#fff", color: "#7c3aed",
                        borderRadius: 10, fontWeight: 700, fontSize: "1rem", textDecoration: "none",
                    }}>Get Started Free</Link>
                    <Link href="/how-it-works" style={{
                        display: "inline-block", padding: "14px 32px",
                        background: "transparent", color: "#fff",
                        borderRadius: 10, fontWeight: 700, fontSize: "1rem", textDecoration: "none",
                        border: "1px solid rgba(255,255,255,0.3)",
                    }}>How It Works</Link>
                </div>
            </section>
        </div>
    );
}
