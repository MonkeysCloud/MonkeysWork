/* ── ecosystem logos (inline text since we don't have actual SVGs) ── */
const PRODUCTS = [
    {
        name: "MonkeysLegion",
        desc: "High-performance PHP framework",
        href: "https://monkeys.cloud/legion",
    },
    {
        name: "MonkeysMail",
        desc: "Transactional email service",
        href: "https://monkeys.cloud/mail",
    },
    {
        name: "MonkeysCMS",
        desc: "Headless content management",
        href: "https://monkeys.cloud/cms",
    },
];

export default function Ecosystem() {
    return (
        <section className="py-16 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="rounded-3xl bg-gradient-to-r from-brand-dark/[0.04] to-brand-orange/[0.04] border border-brand-border/40 p-8 sm:p-12 lg:p-16">
                    <div className="max-w-3xl mx-auto text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-brand-muted mb-4">
                            Part of the MonkeysCloud ecosystem
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark leading-tight">
                            Built with open-source tools,
                            <br className="hidden sm:inline" />
                            powered by MonkeysCloud
                        </h2>
                        <p className="mt-4 text-brand-muted max-w-xl mx-auto">
                            MonkeysWork is built with MonkeysLegion and powered by MonkeysMail.
                            Our tools are open-source, battle-tested, and built for developers.
                        </p>

                        {/* product cards */}
                        <div className="flex flex-wrap justify-center gap-4 mt-10">
                            {PRODUCTS.map((p) => (
                                <a
                                    key={p.name}
                                    href={p.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-brand-border/60 hover:border-brand-orange/30 shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    <span className="w-8 h-8 rounded-lg bg-brand-dark flex items-center justify-center text-white text-xs font-black">
                                        M
                                    </span>
                                    <div className="text-left">
                                        <span className="text-sm font-bold text-brand-dark group-hover:text-brand-orange transition-colors">
                                            {p.name}
                                        </span>
                                        <span className="block text-xs text-brand-muted">{p.desc}</span>
                                    </div>
                                </a>
                            ))}
                        </div>

                        <a
                            href="https://monkeys.cloud"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors"
                        >
                            Explore MonkeysCloud
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
