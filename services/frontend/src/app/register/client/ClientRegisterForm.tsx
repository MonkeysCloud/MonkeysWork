"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

const COMPANY_SIZES = [
    "Just me",
    "2–10 employees",
    "11–50 employees",
    "51–200 employees",
    "201–500 employees",
    "500+ employees",
];

/* ── OAuth button ───────────────────────────────────── */
function OAuthButton({
    provider,
    icon,
}: {
    provider: string;
    icon: React.ReactNode;
}) {
    return (
        <button
            type="button"
            className="flex items-center justify-center gap-2.5 w-full py-3 px-4 text-sm font-semibold text-brand-dark bg-white border border-brand-border/60 rounded-xl hover:border-brand-dark/30 hover:shadow-sm transition-all duration-200"
        >
            {icon}
            Continue with {provider}
        </button>
    );
}

export default function ClientRegisterForm() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        companyName: "",
        companySize: "",
    });

    function set(field: string) {
        return (
            e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
        ) => {
            setForm((prev) => ({ ...prev, [field]: e.target.value }));
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
            setError(null);
        };
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setFieldErrors({});

        // Client-side validation
        const errs: Record<string, string> = {};
        if (!form.fullName.trim()) errs.fullName = "Name is required";
        if (!form.email.trim()) errs.email = "Email is required";
        if (!form.password || form.password.length < 8)
            errs.password = "Password must be at least 8 characters";
        if (!agreed) errs.terms = "You must accept the legal agreements to continue";
        if (Object.keys(errs).length) {
            setFieldErrors(errs);
            return;
        }

        // Split full name into first / last
        const parts = form.fullName.trim().split(/\s+/);
        const firstName = parts[0];
        const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: form.email.trim(),
                    password: form.password,
                    display_name: form.fullName.trim(),
                    first_name: firstName,
                    last_name: lastName,
                    role: "client",
                    timezone:
                        Intl.DateTimeFormat().resolvedOptions().timeZone ??
                        "UTC",
                    locale: navigator.language?.slice(0, 2) ?? "en",
                    accepted_terms: agreed,
                    accepted_fees: agreed,
                    accepted_contractor: agreed,
                    metadata: JSON.stringify({
                        company_name: form.companyName || null,
                        company_size: form.companySize || null,
                    }),
                }),
            });

            const body = await res.json();

            if (!res.ok) {
                if (res.status === 409) {
                    setFieldErrors({ email: "This email is already registered" });
                } else if (res.status === 422 && body.details) {
                    setFieldErrors(body.details);
                } else {
                    setError(body.error || "Registration failed. Please try again.");
                }
                return;
            }

            // Success — redirect to a success / verification page
            router.push("/register/success?email=" + encodeURIComponent(form.email));
        } catch {
            setError("Unable to reach the server. Please check your connection.");
        } finally {
            setLoading(false);
        }
    }

    const inputCls = (field?: string) =>
        `w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange text-brand-dark placeholder:text-brand-muted/50 ${field && fieldErrors[field]
            ? "border-red-400 bg-red-50/30"
            : "border-brand-border/60"
        }`;

    return (
        <section className="min-h-[calc(100vh-72px)] flex">
            {/* ── Left decorative panel ── */}
            <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-brand-dark via-[#2a2b3d] to-brand-dark relative overflow-hidden">
                {/* glow effects */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[250px] bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[200px] bg-brand-orange/10 rounded-full blur-[80px]" />

                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
                    <div className="mb-8">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">
                            For Clients
                        </span>
                    </div>
                    <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
                        Find the perfect
                        <br />
                        talent for your
                        <br />
                        next project
                    </h2>
                    <p className="mt-5 text-white/40 leading-relaxed max-w-sm">
                        Join thousands of businesses hiring top freelancers on
                        MonkeysWorks. Post your first project in minutes.
                    </p>

                    {/* trust items */}
                    <div className="mt-10 space-y-4">
                        {[
                            { icon: "🤖", text: "AI matches you with the best-fit talent" },
                            { icon: "🔒", text: "Milestone escrow protects your payments" },
                            { icon: "⚡", text: "Get proposals within hours, not days" },
                        ].map((item) => (
                            <div key={item.text} className="flex items-center gap-3">
                                <span className="text-lg">{item.icon}</span>
                                <span className="text-sm text-white/60">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 sm:py-16 bg-brand-surface">
                <div className="w-full max-w-md">
                    {/* back link */}
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark transition-colors mb-8"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back
                    </Link>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
                        Create your client account
                    </h1>
                    <p className="mt-2 text-sm text-brand-muted">
                        Start hiring top freelancers in minutes.
                    </p>

                    {/* global error */}
                    {error && (
                        <div className="mt-6 px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* OAuth */}
                    <div className="mt-8 space-y-3">
                        <button
                            type="button"
                            onClick={() => {
                                const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
                                const redirectUri = `${window.location.origin}/auth/google/callback`;
                                const scope = "openid email profile";
                                window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&access_type=offline&prompt=consent`;
                            }}
                            className="flex items-center justify-center gap-2.5 w-full py-3 px-4 text-sm font-semibold text-brand-dark bg-white border border-brand-border/60 rounded-xl hover:border-brand-dark/30 hover:shadow-sm transition-all duration-200"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "";
                                const redirectUri = `${window.location.origin}/auth/github/callback`;
                                window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
                            }}
                            className="flex items-center justify-center gap-2.5 w-full py-3 px-4 text-sm font-semibold text-brand-dark bg-white border border-brand-border/60 rounded-xl hover:border-brand-dark/30 hover:shadow-sm transition-all duration-200"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            Continue with GitHub
                        </button>
                    </div>

                    {/* divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-brand-border/60" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-brand-surface px-4 text-xs text-brand-muted">
                                or register with email
                            </span>
                        </div>
                    </div>

                    {/* form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* full name */}
                        <div>
                            <label htmlFor="fullName" className="block text-xs font-semibold text-brand-muted mb-1.5">
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                value={form.fullName}
                                onChange={set("fullName")}
                                placeholder="Jane Smith"
                                className={inputCls("fullName")}
                            />
                            {fieldErrors.fullName && <p className="mt-1 text-xs text-red-500">{fieldErrors.fullName}</p>}
                        </div>

                        {/* email */}
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-brand-muted mb-1.5">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={set("email")}
                                placeholder="jane@company.com"
                                className={inputCls("email")}
                            />
                            {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
                        </div>

                        {/* password */}
                        <div>
                            <label htmlFor="password" className="block text-xs font-semibold text-brand-muted mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={form.password}
                                    onChange={set("password")}
                                    placeholder="Min. 8 characters"
                                    className={`${inputCls("password")} pr-11`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark transition-colors"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
                        </div>

                        {/* company name */}
                        <div>
                            <label htmlFor="companyName" className="block text-xs font-semibold text-brand-muted mb-1.5">
                                Company Name{" "}
                                <span className="text-brand-muted/50 font-normal">(optional)</span>
                            </label>
                            <input
                                id="companyName"
                                type="text"
                                value={form.companyName}
                                onChange={set("companyName")}
                                placeholder="Acme Inc."
                                className={inputCls()}
                            />
                        </div>

                        {/* company size */}
                        <div>
                            <label htmlFor="companySize" className="block text-xs font-semibold text-brand-muted mb-1.5">
                                Company Size
                            </label>
                            <select
                                id="companySize"
                                value={form.companySize}
                                onChange={set("companySize")}
                                className={inputCls() + " bg-white"}
                            >
                                <option value="" disabled>Select company size</option>
                                {COMPANY_SIZES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* ── Legal acceptance ── */}
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => {
                                    setAgreed(e.target.checked);
                                    setFieldErrors((prev) => { const n = { ...prev }; delete n.terms; return n; });
                                }}
                                className="mt-0.5 w-4 h-4 rounded border-brand-border/60 text-brand-orange focus:ring-brand-orange/30"
                            />
                            <span className={`text-xs leading-relaxed ${fieldErrors.terms ? "text-red-500" : "text-brand-muted"}`}>
                                I agree to the{" "}
                                <Link href="/terms" className="text-brand-orange hover:text-brand-orange-hover font-medium">Terms of Service</Link>,{" "}
                                <Link href="/privacy" className="text-brand-orange hover:text-brand-orange-hover font-medium">Privacy Policy</Link>, and{" "}
                                <Link href="/cookies" className="text-brand-orange hover:text-brand-orange-hover font-medium">Cookie Policy</Link>.
                                I acknowledge the{" "}
                                <Link href="/terms#fees" className="text-brand-orange hover:text-brand-orange-hover font-medium">platform fees</Link>,{" "}
                                <Link href="/terms#disputes" className="text-brand-orange hover:text-brand-orange-hover font-medium">dispute resolution process</Link>,
                                and that MonkeysWorks is a marketplace —{" "}
                                <Link href="/terms#relationship" className="text-brand-orange hover:text-brand-orange-hover font-medium">no employer-employee relationship</Link>{" "}
                                is created.
                            </span>
                        </label>

                        {/* submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_32px_rgba(240,138,17,0.55)] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_24px_rgba(240,138,17,0.4)] flex items-center justify-center gap-2"
                        >
                            {loading && (
                                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            )}
                            {loading ? "Creating Account…" : "Create Client Account"}
                        </button>
                    </form>

                    {/* login link */}
                    <p className="text-center text-sm text-brand-muted mt-8">
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
}
