import Link from "next/link";

export default function FinalCTA() {
    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-dark via-[#2a2b3d] to-brand-dark text-white">
            {/* subtle glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-orange/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                    Ready to get started?
                </h2>
                <p className="mt-4 text-lg text-white/50 max-w-xl mx-auto">
                    Join thousands of companies and freelancers already working smarter.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/register/client"
                        className="px-8 py-4 text-base font-bold text-brand-dark bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_32px_rgba(240,138,17,0.55)] transition-all duration-200 hover:-translate-y-0.5"
                    >
                        Hire a Freelancer
                    </Link>
                    <Link
                        href="/register/freelancer"
                        className="px-8 py-4 text-base font-bold text-white border-2 border-white/20 hover:border-white/40 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                    >
                        Find Work
                    </Link>
                </div>
            </div>
        </section>
    );
}
