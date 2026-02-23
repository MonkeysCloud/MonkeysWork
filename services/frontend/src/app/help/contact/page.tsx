"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

const CATEGORIES = [
    { value: "general", label: "General Question" },
    { value: "account", label: "Account & Profile" },
    { value: "billing", label: "Payments & Billing" },
    { value: "contracts", label: "Contracts & Milestones" },
    { value: "disputes", label: "Disputes & Reports" },
    { value: "technical", label: "Technical Issue / Bug" },
    { value: "feature", label: "Feature Request" },
    { value: "other", label: "Other" },
];

const PRIORITIES = [
    { value: "low", label: "Low — General inquiry", color: "#6b7280" },
    { value: "normal", label: "Normal — Need help soon", color: "#f08a11" },
    { value: "high", label: "High — Blocking my work", color: "#ef4444" },
    { value: "urgent", label: "Urgent — Account or payment issue", color: "#dc2626" },
];

export default function ContactSupportPage() {
    const { user } = useAuth();
    const [form, setForm] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
        category: "general",
        priority: "normal",
    });

    // Pre-fill from logged-in user
    useEffect(() => {
        if (user) {
            setForm((f) => ({
                ...f,
                name: f.name || user.display_name || "",
                email: f.email || user.email || "",
            }));
        }
    }, [user]);
    const [files, setFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const addFiles = (newFiles: FileList | null) => {
        if (!newFiles) return;
        const arr = Array.from(newFiles).filter(
            (f) => f.size <= 10 * 1024 * 1024 // 10MB max per file
        );
        setFiles((prev) => [...prev, ...arr].slice(0, 5)); // max 5 files
    };

    const removeFile = (idx: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const fd = new FormData();
            fd.append("name", form.name);
            fd.append("email", form.email);
            fd.append("subject", form.subject);
            fd.append("message", form.message);
            fd.append("category", form.category);
            fd.append("priority", form.priority);
            files.forEach((f) => fd.append("attachments[]", f));

            const hdrs: Record<string, string> = {};
            if (user) {
                const token = localStorage.getItem("token");
                if (token) hdrs["Authorization"] = `Bearer ${token}`;
            }

            const res = await fetch(`${API}/support`, {
                method: "POST",
                headers: hdrs,
                body: fd,
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to submit");
            setSuccess(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <main className="min-h-screen bg-brand-surface flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="bg-white rounded-2xl border border-brand-border/60 shadow-lg p-10">
                        <div className="text-5xl mb-4">✅</div>
                        <h1 className="text-2xl font-bold text-brand-text mb-2">
                            Ticket Submitted!
                        </h1>
                        <p className="text-brand-muted text-sm mb-6">
                            We&apos;ve received your support request and will get back to
                            you at <strong>{form.email}</strong> within 24 hours.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <Link
                                href="/help"
                                className="px-5 py-2.5 text-sm font-semibold text-brand-text border border-brand-border rounded-xl hover:border-brand-dark transition-colors"
                            >
                                Help Center
                            </Link>
                            <Link
                                href="/"
                                className="px-5 py-2.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl transition-colors"
                            >
                                Go Home
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-brand-surface">
            {/* Hero */}
            <section className="bg-gradient-to-br from-brand-dark via-brand-dark-light to-brand-dark pt-32 pb-12">
                <div className="mx-auto max-w-2xl px-4 text-center">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                        Contact <span className="text-brand-orange">Support</span>
                    </h1>
                    <p className="mt-3 text-white/60 text-sm">
                        Describe your issue and we&apos;ll get back to you within 24 hours.
                    </p>
                    <Link
                        href="/help"
                        className="inline-block mt-4 text-brand-orange text-sm hover:underline"
                    >
                        ← Back to Help Center
                    </Link>
                </div>
            </section>

            {/* Form */}
            <section className="py-12">
                <div className="mx-auto max-w-2xl px-4">
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white rounded-2xl border border-brand-border/60 shadow-sm p-8 space-y-6"
                    >
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                                {error}
                            </div>
                        )}

                        {/* Name & Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-brand-text mb-1.5">
                                    Your Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-brand-border rounded-xl text-sm focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none transition-all"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-brand-text mb-1.5">
                                    Email Address <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-brand-border rounded-xl text-sm focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        {/* Category & Priority */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-brand-text mb-1.5">
                                    Category
                                </label>
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-brand-border rounded-xl text-sm focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none transition-all bg-white"
                                >
                                    {CATEGORIES.map((c) => (
                                        <option key={c.value} value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-brand-text mb-1.5">
                                    Priority
                                </label>
                                <select
                                    value={form.priority}
                                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-brand-border rounded-xl text-sm focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none transition-all bg-white"
                                >
                                    {PRIORITIES.map((p) => (
                                        <option key={p.value} value={p.value}>
                                            {p.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="block text-sm font-semibold text-brand-text mb-1.5">
                                Subject <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={form.subject}
                                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                className="w-full px-4 py-2.5 border border-brand-border rounded-xl text-sm focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none transition-all"
                                placeholder="Brief description of your issue"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm font-semibold text-brand-text mb-1.5">
                                Message <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                required
                                rows={6}
                                value={form.message}
                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                className="w-full px-4 py-3 border border-brand-border rounded-xl text-sm focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none transition-all resize-none"
                                placeholder="Describe your issue in detail. Include any relevant links, screenshots, or error messages."
                            />
                        </div>

                        {/* Attachments */}
                        <div>
                            <label className="block text-sm font-semibold text-brand-text mb-1.5">
                                Attachments <span className="text-brand-muted font-normal">(optional, max 5 files, 10MB each)</span>
                            </label>
                            <div
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-brand-orange"); }}
                                onDragLeave={(e) => e.currentTarget.classList.remove("border-brand-orange")}
                                onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-brand-orange"); addFiles(e.dataTransfer.files); }}
                                className="border-2 border-dashed border-brand-border rounded-xl p-4 text-center hover:border-brand-orange/50 transition-colors cursor-pointer"
                                onClick={() => document.getElementById("file-input")?.click()}
                            >
                                <input
                                    id="file-input"
                                    type="file"
                                    multiple
                                    className="hidden"
                                    accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                                    onChange={(e) => addFiles(e.target.files)}
                                />
                                <p className="text-sm text-brand-muted">
                                    📎 Click or drag files here
                                </p>
                                <p className="text-xs text-brand-muted/60 mt-1">
                                    Images, PDFs, documents, or ZIP files
                                </p>
                            </div>

                            {files.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {files.map((f, i) => (
                                        <div key={`${f.name}-${i}`} className="flex items-center gap-3 bg-brand-surface rounded-lg px-3 py-2">
                                            {f.type.startsWith("image/") ? (
                                                <img
                                                    src={URL.createObjectURL(f)}
                                                    alt={f.name}
                                                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <span className="text-lg flex-shrink-0">📄</span>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-brand-text truncate">{f.name}</p>
                                                <p className="text-[10px] text-brand-muted">{(f.size / 1024).toFixed(0)} KB</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(i)}
                                                className="text-brand-muted hover:text-red-500 text-sm transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-[0_2px_10px_rgba(240,138,17,0.3)] hover:shadow-[0_4px_16px_rgba(240,138,17,0.45)] transition-all duration-300"
                        >
                            {submitting ? "Submitting..." : "Submit Support Ticket"}
                        </button>

                        <p className="text-xs text-brand-muted text-center">
                            You can also email us directly at{" "}
                            <a
                                href="mailto:support@monkeysworks.com"
                                className="text-brand-orange hover:underline"
                            >
                                support@monkeysworks.com
                            </a>
                        </p>
                    </form>
                </div>
            </section>
        </main>
    );
}
