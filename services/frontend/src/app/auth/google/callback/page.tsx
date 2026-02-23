"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

function GoogleCallbackInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { loginWithOAuth } = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get("code");
        if (!code) {
            setError("No authorization code received from Google.");
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                await loginWithOAuth("google", code);
                if (!cancelled) {
                    router.push("/dashboard");
                }
            } catch (err: unknown) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Google authentication failed."
                    );
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [searchParams, loginWithOAuth, router]);

    if (error) {
        return (
            <section className="min-h-screen flex items-center justify-center bg-brand-surface">
                <div className="w-full max-w-md text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-brand-dark mb-2">
                        Authentication Failed
                    </h1>
                    <p className="text-sm text-brand-muted mb-6">{error}</p>
                    <a
                        href="/login"
                        className="inline-block px-6 py-2.5 text-sm font-semibold text-white bg-brand-orange rounded-xl hover:bg-brand-orange-hover transition-colors"
                    >
                        Back to Login
                    </a>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen flex items-center justify-center bg-brand-surface">
            <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 border-4 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
                <p className="text-sm text-brand-muted">
                    Signing in with Google…
                </p>
            </div>
        </section>
    );
}

export default function GoogleCallbackPage() {
    return (
        <Suspense>
            <GoogleCallbackInner />
        </Suspense>
    );
}
