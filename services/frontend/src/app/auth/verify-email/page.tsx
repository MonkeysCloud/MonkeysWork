"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><span className="animate-pulse text-5xl">✉️</span></div>}>
            <VerifyEmailInner />
        </Suspense>
    );
}

function VerifyEmailInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Missing verification token.");
            return;
        }

        (async () => {
            try {
                const res = await fetch(`${API}/auth/verify-email`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });
                const json = await res.json();

                if (res.ok) {
                    setStatus("success");
                    setMessage(json.message || "Email verified successfully!");
                } else {
                    setStatus("error");
                    setMessage(json.error || "Verification failed. The link may have expired.");
                }
            } catch {
                setStatus("error");
                setMessage("Network error. Please try again.");
            }
        })();
    }, [token]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-lg border border-brand-border/60 p-8 max-w-md w-full text-center">
                {status === "loading" && (
                    <>
                        <span className="text-5xl block mb-4 animate-pulse">✉️</span>
                        <h1 className="text-xl font-bold text-brand-dark mb-2">Verifying your email…</h1>
                        <p className="text-sm text-brand-muted">Please wait a moment.</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <span className="text-5xl block mb-4">✅</span>
                        <h1 className="text-xl font-bold text-brand-dark mb-2">Email Verified!</h1>
                        <p className="text-sm text-brand-muted mb-6">{message}</p>
                        <button
                            onClick={() => router.push("/auth/login")}
                            className="px-6 py-2.5 text-sm font-bold bg-brand-orange text-white rounded-xl hover:opacity-90 shadow-[0_4px_16px_rgba(240,138,17,0.3)]"
                        >
                            Go to Login
                        </button>
                    </>
                )}

                {status === "error" && (
                    <>
                        <span className="text-5xl block mb-4">❌</span>
                        <h1 className="text-xl font-bold text-brand-dark mb-2">Verification Failed</h1>
                        <p className="text-sm text-brand-muted mb-6">{message}</p>
                        <button
                            onClick={() => router.push("/auth/login")}
                            className="px-6 py-2.5 text-sm font-bold bg-brand-orange text-white rounded-xl hover:opacity-90"
                        >
                            Go to Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
