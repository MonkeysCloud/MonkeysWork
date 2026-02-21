"use client";

import { useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${API}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });

            if (res.ok) {
                setSent(true);
            } else {
                const json = await res.json();
                setError(json.error || "Something went wrong.");
            }
        } catch {
            setError("Network error. Please try again.");
        }

        setLoading(false);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-lg border border-brand-border/60 p-8 max-w-md w-full">
                {!sent ? (
                    <>
                        <div className="text-center mb-6">
                            <span className="text-4xl block mb-3">🔐</span>
                            <h1 className="text-xl font-bold text-brand-dark">Forgot Password</h1>
                            <p className="text-sm text-brand-muted mt-1">
                                Enter your email and we&apos;ll send a reset link.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-brand-dark block mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full text-sm border border-brand-border rounded-lg p-3 focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none"
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-500">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !email.trim()}
                                className="w-full py-2.5 text-sm font-bold bg-brand-orange text-white rounded-xl hover:opacity-90 disabled:opacity-40 shadow-[0_4px_16px_rgba(240,138,17,0.3)]"
                            >
                                {loading ? "Sending…" : "Send Reset Link"}
                            </button>
                        </form>

                        <p className="text-center text-xs text-brand-muted mt-4">
                            <Link href="/auth/login" className="text-brand-orange hover:underline">
                                Back to Login
                            </Link>
                        </p>
                    </>
                ) : (
                    <div className="text-center">
                        <span className="text-5xl block mb-4">📧</span>
                        <h1 className="text-xl font-bold text-brand-dark mb-2">Check Your Email</h1>
                        <p className="text-sm text-brand-muted mb-4">
                            If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
                        </p>

                        <div className="bg-amber-50 rounded-lg p-4 mb-6">
                            <p className="text-xs text-amber-700">
                                📬 <strong>Can&apos;t find it?</strong> Check your spam or junk folder. The link expires in 1 hour.
                            </p>
                        </div>

                        <Link
                            href="/auth/login"
                            className="inline-block px-6 py-2.5 text-sm font-bold bg-brand-orange text-white rounded-xl hover:opacity-90"
                        >
                            Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
