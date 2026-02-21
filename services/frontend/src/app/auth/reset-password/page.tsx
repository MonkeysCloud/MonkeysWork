"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><span className="animate-pulse text-4xl">🔐</span></div>}>
            <ResetPasswordInner />
        </Suspense>
    );
}

function ResetPasswordInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [status, setStatus] = useState<"form" | "loading" | "success" | "error">("form");
    const [message, setMessage] = useState("");

    if (!token) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-lg border border-brand-border/60 p-8 max-w-md w-full text-center">
                    <span className="text-5xl block mb-4">❌</span>
                    <h1 className="text-xl font-bold text-brand-dark mb-2">Invalid Link</h1>
                    <p className="text-sm text-brand-muted">Missing reset token. Please request a new password reset.</p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 8) {
            setMessage("Password must be at least 8 characters.");
            setStatus("error");
            return;
        }

        if (password !== confirm) {
            setMessage("Passwords don't match.");
            setStatus("error");
            return;
        }

        setStatus("loading");

        try {
            const res = await fetch(`${API}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const json = await res.json();

            if (res.ok) {
                setStatus("success");
                setMessage(json.message || "Password reset successfully!");
            } else {
                setStatus("error");
                setMessage(json.error || "Reset failed. The link may have expired.");
            }
        } catch {
            setStatus("error");
            setMessage("Network error. Please try again.");
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-lg border border-brand-border/60 p-8 max-w-md w-full">
                {status === "success" ? (
                    <div className="text-center">
                        <span className="text-5xl block mb-4">✅</span>
                        <h1 className="text-xl font-bold text-brand-dark mb-2">Password Reset!</h1>
                        <p className="text-sm text-brand-muted mb-6">{message}</p>
                        <button
                            onClick={() => router.push("/auth/login")}
                            className="px-6 py-2.5 text-sm font-bold bg-brand-orange text-white rounded-xl hover:opacity-90 shadow-[0_4px_16px_rgba(240,138,17,0.3)]"
                        >
                            Go to Login
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-6">
                            <span className="text-4xl block mb-3">🔐</span>
                            <h1 className="text-xl font-bold text-brand-dark">Set New Password</h1>
                            <p className="text-sm text-brand-muted mt-1">
                                Choose a strong password for your account.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-brand-dark block mb-1">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setStatus("form"); }}
                                    placeholder="At least 8 characters"
                                    required
                                    minLength={8}
                                    className="w-full text-sm border border-brand-border rounded-lg p-3 focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-brand-dark block mb-1">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={confirm}
                                    onChange={(e) => { setConfirm(e.target.value); setStatus("form"); }}
                                    placeholder="Repeat your password"
                                    required
                                    className="w-full text-sm border border-brand-border rounded-lg p-3 focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange outline-none"
                                />
                            </div>

                            {status === "error" && message && (
                                <p className="text-sm text-red-500">{message}</p>
                            )}

                            <button
                                type="submit"
                                disabled={status === "loading" || !password || !confirm}
                                className="w-full py-2.5 text-sm font-bold bg-brand-orange text-white rounded-xl hover:opacity-90 disabled:opacity-40 shadow-[0_4px_16px_rgba(240,138,17,0.3)]"
                            >
                                {status === "loading" ? "Resetting…" : "Reset Password"}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
