"use client";

import { useState } from "react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════
   Section: Pricing Cards
   ═══════════════════════════════════════════════════════ */
const CLIENT_FEATURES = [
    { text: "Free to create an account", included: true },
    { text: "Free to post unlimited jobs", included: true },
    { text: "AI Scope Assistant", included: true },
    { text: "AI-Powered Matching", included: true },
    { text: "Messaging & collaboration", included: true },
    { text: "Milestone escrow protection", included: true },
];

const FREELANCER_FEATURES = [
    { text: "Free to create a profile", included: true },
    { text: "Browse all jobs", included: true },
    { text: "Submit proposals", included: true },
    { text: "10 free proposals/month, then $0.50 each", included: true },
    { text: "Optional verification badge", included: true },
    { text: "Invoicing and payout tools", included: true },
];

/* ═══════════════════════════════════════════════════════
   Section: FAQ
   ═══════════════════════════════════════════════════════ */
const FAQS = [
    {
        q: "When am I charged?",
        a: "You're charged only when a milestone is approved and payment is released.",
    },
    {
        q: "Are there subscription fees?",
        a: "No. Core marketplace usage is free. Fees apply only when paid work happens (and for extra proposals beyond free monthly limits).",
    },
    {
        q: "Can I negotiate fees?",
        a: "Enterprise clients and high-volume teams can request custom pricing.",
    },
    {
        q: "What payment methods are accepted?",
        a: "Clients can pay by card (and eligible bank methods). Freelancers can receive payouts via supported bank rails, PayPal, and (where available) crypto.",
    },
    {
        q: "Are there refunds?",
        a: "If a dispute is resolved in your favor, eligible escrowed funds are returned according to the dispute outcome and policy terms.",
    },
];

/* ═══════════════════════════════════════════════════════
   FAQ Accordion Item
   ═══════════════════════════════════════════════════════ */
function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-brand-border/40">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between py-5 text-left group"
            >
                <span className="text-base font-semibold text-brand-dark group-hover:text-brand-orange transition-colors pr-4">
                    {q}
                </span>
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`flex-shrink-0 text-brand-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ${open ? "max-h-40 pb-5" : "max-h-0"}`}
            >
                <p className="text-sm text-brand-muted leading-relaxed">{a}</p>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   Fee Calculator
   ═══════════════════════════════════════════════════════ */
function FeeCalculator() {
    const [amount, setAmount] = useState(5000);
    const [feeTier, setFeeTier] = useState<10 | 5>(10);
    const [paymentMethod, setPaymentMethod] = useState<"card" | "bank">("card");
    const [payoutMethod, setPayoutMethod] = useState<"bank" | "paypal" | "crypto">("bank");

    // Client side
    const clientPlatformFee = amount * 0.05;
    const clientProcessing = paymentMethod === "card" ? amount * 0.029 + 0.3 : 0;
    const clientTotal = amount + clientPlatformFee + clientProcessing;

    // Freelancer side
    const freelancerPlatformFee = amount * (feeTier / 100);
    const payoutFees: Record<string, number> = { bank: 0, paypal: amount * 0.01, crypto: amount * 0.005 };
    const freelancerPayout = payoutFees[payoutMethod];
    const freelancerReceives = amount - freelancerPlatformFee - freelancerPayout;

    const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="bg-white rounded-2xl border border-brand-border/60 shadow-sm overflow-hidden">
            {/* inputs */}
            <div className="p-6 sm:p-8 border-b border-brand-border/40">
                <h3 className="text-lg font-bold text-brand-dark mb-6">Fee Calculator</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* project amount */}
                    <div>
                        <label className="block text-xs font-semibold text-brand-muted mb-1.5">Project Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-sm">$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                                className="w-full pl-7 pr-3 py-2.5 text-sm border border-brand-border/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange text-brand-dark"
                            />
                        </div>
                    </div>

                    {/* freelancer fee tier */}
                    <div>
                        <label className="block text-xs font-semibold text-brand-muted mb-1.5">Freelancer Fee Tier</label>
                        <select
                            value={feeTier}
                            onChange={(e) => setFeeTier(Number(e.target.value) as 10 | 5)}
                            className="w-full px-3 py-2.5 text-sm border border-brand-border/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange text-brand-dark bg-white"
                        >
                            <option value={10}>10% (first $10K per client)</option>
                            <option value={5}>5% (after $10K per client)</option>
                        </select>
                    </div>

                    {/* payment method */}
                    <div>
                        <label className="block text-xs font-semibold text-brand-muted mb-1.5">Client Payment Method</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as "card" | "bank")}
                            className="w-full px-3 py-2.5 text-sm border border-brand-border/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange text-brand-dark bg-white"
                        >
                            <option value="card">Card (2.9% + $0.30)</option>
                            <option value="bank">Bank Transfer</option>
                        </select>
                    </div>

                    {/* payout method */}
                    <div>
                        <label className="block text-xs font-semibold text-brand-muted mb-1.5">Freelancer Payout Method</label>
                        <select
                            value={payoutMethod}
                            onChange={(e) => setPayoutMethod(e.target.value as "bank" | "paypal" | "crypto")}
                            className="w-full px-3 py-2.5 text-sm border border-brand-border/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange text-brand-dark bg-white"
                        >
                            <option value="bank">Bank Transfer (Free)</option>
                            <option value="paypal">PayPal (1%)</option>
                            <option value="crypto">Crypto (0.5%)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* results */}
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-brand-border/40">
                {/* client side */}
                <div className="p-6 sm:p-8">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">Client Pays</h4>
                    <div className="space-y-2.5">
                        <div className="flex justify-between text-sm">
                            <span className="text-brand-muted">Project amount</span>
                            <span className="text-brand-dark font-medium">{fmt(amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-brand-muted">Platform fee (5%)</span>
                            <span className="text-brand-dark font-medium">{fmt(clientPlatformFee)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-brand-muted">Processing fee</span>
                            <span className="text-brand-dark font-medium">{fmt(clientProcessing)}</span>
                        </div>
                        <div className="border-t border-brand-border/40 pt-2.5 flex justify-between text-base font-bold">
                            <span className="text-brand-dark">Total</span>
                            <span className="text-blue-600">{fmt(clientTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* freelancer side */}
                <div className="p-6 sm:p-8">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-4">Freelancer Receives</h4>
                    <div className="space-y-2.5">
                        <div className="flex justify-between text-sm">
                            <span className="text-brand-muted">Project amount</span>
                            <span className="text-brand-dark font-medium">{fmt(amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-brand-muted">Platform fee ({feeTier}%)</span>
                            <span className="text-red-500 font-medium">-{fmt(freelancerPlatformFee)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-brand-muted">Payout fee</span>
                            <span className={`font-medium ${freelancerPayout === 0 ? "text-emerald-600" : "text-red-500"}`}>
                                {freelancerPayout === 0 ? "Free" : `-${fmt(freelancerPayout)}`}
                            </span>
                        </div>
                        <div className="border-t border-brand-border/40 pt-2.5 flex justify-between text-base font-bold">
                            <span className="text-brand-dark">You receive</span>
                            <span className="text-emerald-600">{fmt(freelancerReceives)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* disclaimer */}
            <div className="px-6 sm:px-8 py-4 bg-brand-dark/[0.02] border-t border-brand-border/40">
                <p className="text-xs text-brand-muted text-center">
                    Fees shown are estimates and may vary by country, currency, tax treatment, payment method, and payout rail.
                </p>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════════ */
export default function PricingClient() {
    return (
        <>
            {/* ── Section 1: Hero ── */}
            <section className="pt-16 sm:pt-24 pb-12 bg-gradient-to-b from-brand-dark/[0.03] to-brand-surface">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-dark tracking-tight">
                        Simple, transparent pricing
                    </h1>
                    <p className="mt-4 text-lg text-brand-muted max-w-xl mx-auto leading-relaxed">
                        No monthly subscriptions. No hidden costs.
                        <br />
                        You only pay when milestones are approved and work gets done.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/register/freelancer"
                            className="px-7 py-3.5 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] transition-all duration-200 hover:-translate-y-0.5"
                        >
                            Create Your Free Profile
                        </Link>
                        <Link
                            href="/register/client"
                            className="px-7 py-3.5 text-sm font-bold text-brand-dark border-2 border-brand-border hover:border-brand-dark/30 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                        >
                            Post a Job for Free
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Section 2: Pricing Cards ── */}
            <section className="py-16 sm:py-24">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Client card */}
                        <div className="rounded-2xl border border-brand-border/60 bg-white shadow-sm overflow-hidden">
                            <div className="p-7 sm:p-8 border-b border-brand-border/40">
                                <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                    For Clients
                                </span>
                                <div className="mt-5">
                                    <span className="text-4xl font-extrabold text-brand-dark">5%</span>
                                    <span className="text-brand-muted ml-2 text-sm">platform fee per milestone</span>
                                </div>
                                <p className="mt-2 text-xs text-brand-muted">
                                    + 2.9% + $0.30 per card transaction. Bank transfer fees may vary by provider and region.
                                </p>
                            </div>
                            <div className="p-7 sm:p-8">
                                <ul className="space-y-3">
                                    {CLIENT_FEATURES.map((f) => (
                                        <li key={f.text} className="flex items-start gap-2.5 text-sm text-brand-dark">
                                            <svg width="18" height="18" viewBox="0 0 20 20" className="flex-shrink-0 mt-0.5 text-emerald-500" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            {f.text}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/register/client"
                                    className="block mt-8 w-full text-center py-3 text-sm font-bold text-white bg-brand-dark hover:bg-brand-dark/90 rounded-xl transition-colors"
                                >
                                    Get Started as Client
                                </Link>
                            </div>
                        </div>

                        {/* Freelancer card */}
                        <div className="rounded-2xl border-2 border-brand-orange/30 bg-white shadow-[0_0_0_1px_rgba(240,138,17,0.05),0_8px_32px_rgba(240,138,17,0.08)] overflow-hidden relative">
                            <div className="absolute top-0 right-0 px-3 py-1 bg-brand-orange text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-lg">
                                Popular
                            </div>
                            <div className="p-7 sm:p-8 border-b border-brand-border/40">
                                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                    For Freelancers
                                </span>
                                <div className="mt-5">
                                    <span className="text-4xl font-extrabold text-brand-dark">10%</span>
                                    <span className="text-brand-muted ml-2 text-sm">then 5% after $10K/client</span>
                                </div>
                                <p className="mt-2 text-xs text-brand-muted">
                                    Payouts: Bank (free) · PayPal (1%) · Crypto (0.5%). Availability depends on country and compliance.
                                </p>
                            </div>
                            <div className="p-7 sm:p-8">
                                <ul className="space-y-3">
                                    {FREELANCER_FEATURES.map((f) => (
                                        <li key={f.text} className="flex items-start gap-2.5 text-sm text-brand-dark">
                                            <svg width="18" height="18" viewBox="0 0 20 20" className="flex-shrink-0 mt-0.5 text-emerald-500" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            {f.text}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/register/freelancer"
                                    className="block mt-8 w-full text-center py-3 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_2px_12px_rgba(240,138,17,0.3)] transition-all"
                                >
                                    Create Your Free Profile
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section 3: Fee Calculator ── */}
            <section className="py-16 sm:py-24 bg-brand-dark/[0.02]">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark">
                            See exactly what you&apos;ll pay
                        </h2>
                        <p className="mt-3 text-brand-muted">
                            Adjust the inputs to see real-time fee breakdowns for both sides.
                        </p>
                    </div>
                    <FeeCalculator />
                </div>
            </section>

            {/* ── Section 4: Enterprise Teaser ── */}
            <section className="py-16 sm:py-20">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-3xl bg-gradient-to-r from-brand-dark to-[#2a2b3d] p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand-orange/10 rounded-full blur-3xl" />
                        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
                        <div className="relative">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white">
                                Need more than self-serve?
                            </h2>
                            <p className="mt-4 text-white/50 max-w-xl mx-auto leading-relaxed">
                                MonkeysWork for Teams includes volume pricing, centralized billing,
                                role-based permissions, compliance workflows, and dedicated account support.
                            </p>
                            <Link
                                href="/enterprise"
                                className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 text-sm font-bold text-brand-dark bg-white hover:bg-white/90 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                            >
                                Learn about Enterprise
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section 5: FAQ ── */}
            <section className="py-16 sm:py-24 bg-brand-dark/[0.02]">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark text-center mb-10">
                        Frequently asked questions
                    </h2>
                    <div className="bg-white rounded-2xl border border-brand-border/60 shadow-sm px-6 sm:px-8">
                        {FAQS.map((faq) => (
                            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Section 6: Why Milestone-First Pricing ── */}
            <section className="py-16 sm:py-24">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark">
                        Why milestone-first pricing?
                    </h2>
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[
                            { icon: "🛡️", title: "Lower risk for clients", desc: "Pay as work is approved" },
                            { icon: "⚡", title: "Faster trust for freelancers", desc: "Pre-funded milestones" },
                            { icon: "✅", title: "Fewer disputes", desc: "Clear acceptance criteria" },
                            { icon: "📈", title: "Better project outcomes", desc: "Structured delivery" },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="bg-white rounded-2xl p-6 border border-brand-border/60 shadow-sm hover:shadow-md hover:border-brand-orange/20 transition-all duration-300"
                            >
                                <span className="text-3xl block mb-3">{item.icon}</span>
                                <h3 className="text-sm font-bold text-brand-dark mb-1">{item.title}</h3>
                                <p className="text-xs text-brand-muted">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                    <Link
                        href="/register/client"
                        className="inline-block mt-10 px-8 py-4 text-base font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] transition-all duration-200 hover:-translate-y-0.5"
                    >
                        Start with Your First Milestone
                    </Link>
                </div>
            </section>
        </>
    );
}
