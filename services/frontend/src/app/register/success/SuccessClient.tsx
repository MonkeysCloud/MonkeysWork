"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
    const params = useSearchParams();
    const email = params.get("email");

    return (
        <section className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-gradient-to-b from-brand-dark/[0.03] to-brand-surface px-4">
            <div className="max-w-md w-full text-center">
                {/* check icon */}
                <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-8">
                    <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-emerald-500"
                    >
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                </div>

                <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">
                    Account created!
                </h1>
                <p className="mt-4 text-brand-muted leading-relaxed">
                    We&apos;ve sent a verification email to{" "}
                    {email ? (
                        <span className="font-semibold text-brand-dark">
                            {email}
                        </span>
                    ) : (
                        "your inbox"
                    )}
                    . Please check your email and click the link to activate
                    your account.
                </p>

                <div className="mt-10 space-y-3">
                    <Link
                        href="/login"
                        className="block w-full py-3.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] transition-all duration-200 hover:-translate-y-0.5"
                    >
                        Go to Login
                    </Link>
                    <Link
                        href="/"
                        className="block w-full py-3 text-sm font-semibold text-brand-muted hover:text-brand-dark transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default function SuccessClient() {
    return (
        <Suspense
            fallback={
                <section className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-brand-surface">
                    <div className="animate-pulse text-brand-muted">Loading…</div>
                </section>
            }
        >
            <SuccessContent />
        </Suspense>
    );
}
