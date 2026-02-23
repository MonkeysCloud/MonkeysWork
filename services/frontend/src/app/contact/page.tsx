"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const reasons = [
    { value: "general", label: "General Inquiry" },
    { value: "support", label: "Technical Support" },
    { value: "billing", label: "Billing & Payments" },
    { value: "partnership", label: "Partnership Opportunity" },
    { value: "press", label: "Press & Media" },
    { value: "enterprise", label: "Enterprise Sales" },
    { value: "privacy", label: "Privacy & Data Request" },
    { value: "other", label: "Other" },
];

const contactInfo = [
    { icon: "📧", label: "General", value: "hello@monkeysworks.com" },
    { icon: "🔒", label: "Privacy/GDPR", value: "privacy@monkeysworks.com" },
    { icon: "📋", label: "Legal", value: "legal@monkeysworks.com" },
    { icon: "🏢", label: "Enterprise", value: "enterprise@monkeysworks.com" },
];

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", reason: "general", message: "" });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSending(true);
        setError("");
        try {
            const res = await fetch(`${API}/api/support`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: `[Contact Form] ${reasons.find(r => r.value === form.reason)?.label}`,
                    description: `From: ${form.name} <${form.email}>\nReason: ${form.reason}\n\n${form.message}`,
                    priority: form.reason === "privacy" ? "high" : "normal",
                }),
            });
            if (!res.ok) throw new Error("Failed to send");
            setSent(true);
        } catch {
            setError("Something went wrong. Please email us directly.");
        } finally {
            setSending(false);
        }
    }

    return (
        <div>
            {/* Hero */}
            <section style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                padding: "4rem 1.5rem",
                textAlign: "center",
                color: "#ffffff",
            }}>
                <h1 style={{ fontSize: "2.25rem", fontWeight: 800, margin: "0 0 12px" }}>
                    Get in <span style={{ color: "#f08a11" }}>Touch</span>
                </h1>
                <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.6)", maxWidth: 500, margin: "0 auto" }}>
                    Have a question, feedback, or want to partner with us? We&apos;d love to hear from you.
                </p>
            </section>

            <div style={{
                maxWidth: 1000,
                margin: "0 auto",
                padding: "3rem 1.5rem 5rem",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "3rem",
            }}>
                {/* Form */}
                <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>
                        Send Us a Message
                    </h2>

                    {sent ? (
                        <div style={{
                            background: "#f0fdf4",
                            borderRadius: 14,
                            padding: "2rem",
                            border: "1px solid #bbf7d0",
                            textAlign: "center",
                        }}>
                            <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>✅</span>
                            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#166534", margin: "0 0 8px" }}>
                                Message Sent!
                            </h3>
                            <p style={{ fontSize: "0.875rem", color: "#4ade80", margin: 0 }}>
                                We&apos;ll get back to you within 24-48 hours.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                                    Your Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: 8,
                                        border: "1px solid #d1d5db",
                                        fontSize: "0.9375rem",
                                        outline: "none",
                                        boxSizing: "border-box",
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: 8,
                                        border: "1px solid #d1d5db",
                                        fontSize: "0.9375rem",
                                        outline: "none",
                                        boxSizing: "border-box",
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                                    Reason
                                </label>
                                <select
                                    value={form.reason}
                                    onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: 8,
                                        border: "1px solid #d1d5db",
                                        fontSize: "0.9375rem",
                                        outline: "none",
                                        background: "#fff",
                                        boxSizing: "border-box",
                                    }}
                                >
                                    {reasons.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                                    Message
                                </label>
                                <textarea
                                    required
                                    rows={5}
                                    value={form.message}
                                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: 8,
                                        border: "1px solid #d1d5db",
                                        fontSize: "0.9375rem",
                                        outline: "none",
                                        resize: "vertical",
                                        fontFamily: "inherit",
                                        boxSizing: "border-box",
                                    }}
                                />
                            </div>
                            {error && (
                                <p style={{ color: "#dc2626", fontSize: "0.875rem", marginBottom: 12 }}>{error}</p>
                            )}
                            <button
                                type="submit"
                                disabled={sending}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: 10,
                                    border: "none",
                                    background: sending ? "#94a3b8" : "linear-gradient(135deg, #f08a11, #e07a00)",
                                    color: "#fff",
                                    fontSize: "0.9375rem",
                                    fontWeight: 700,
                                    cursor: sending ? "default" : "pointer",
                                }}
                            >
                                {sending ? "Sending..." : "Send Message"}
                            </button>
                        </form>
                    )}
                </div>

                {/* Contact info sidebar */}
                <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>
                        Contact Information
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {contactInfo.map((c, i) => (
                            <div key={i} style={{
                                background: "#f8fafc",
                                borderRadius: 12,
                                padding: "16px 20px",
                                border: "1px solid #e2e8f0",
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                            }}>
                                <span style={{ fontSize: 24 }}>{c.icon}</span>
                                <div>
                                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        {c.label}
                                    </div>
                                    <a href={`mailto:${c.value}`} style={{ fontSize: "0.9375rem", color: "#f08a11", textDecoration: "none", fontWeight: 600 }}>
                                        {c.value}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Office */}
                    <div style={{
                        marginTop: 24,
                        background: "#f8fafc",
                        borderRadius: 12,
                        padding: "20px",
                        border: "1px solid #e2e8f0",
                    }}>
                        <span style={{ fontSize: 24, display: "block", marginBottom: 8 }}>📍</span>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
                            MonkeysCloud LLC
                        </h3>
                        <p style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                            Denver, Colorado, United States
                        </p>
                    </div>

                    {/* Response time */}
                    <div style={{
                        marginTop: 16,
                        background: "#eff6ff",
                        borderRadius: 12,
                        padding: "16px 20px",
                        border: "1px solid #dbeafe",
                        fontSize: "0.875rem",
                        color: "#1e40af",
                        lineHeight: 1.6,
                    }}>
                        ⏱ Average response time: <strong>24-48 hours</strong> for general inquiries.
                        Priority support for billing and privacy requests.
                    </div>
                </div>
            </div>
        </div>
    );
}
