import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
    return (
        <section className="flex flex-col items-center justify-center min-h-[calc(100vh-72px)] px-6 text-center">
            {/* bouncing monkey icon */}
            <div className="animate-bounce mb-6">
                <Image
                    src="/monkeyswork-icon.svg"
                    alt="Lost monkey"
                    width={280}
                    height={280}
                    className="w-56 h-56 sm:w-64 sm:h-64 drop-shadow-xl"
                />
            </div>

            {/* big 404 */}
            <h1 className="text-[8rem] sm:text-[12rem] font-black leading-none tracking-tighter text-brand-dark/10 select-none">
                404
            </h1>

            {/* funny message */}
            <h2 className="text-2xl sm:text-4xl font-bold text-brand-dark -mt-6 sm:-mt-10">
                Oops! This monkey swung too far 🐒
            </h2>
            <p className="mt-4 text-base sm:text-lg text-brand-muted max-w-md">
                The page you&apos;re looking for got lost in the jungle.
                <br />
                Maybe it&apos;s hanging from a branch somewhere…
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                    href="/"
                    className="px-8 py-3.5 text-base font-semibold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_16px_rgba(240,138,17,0.35)] hover:shadow-[0_6px_24px_rgba(240,138,17,0.45)] transition-all duration-200 hover:-translate-y-0.5"
                >
                    Take Me Home
                </Link>
                <Link
                    href="/jobs"
                    className="px-8 py-3.5 text-base font-semibold text-brand-dark border-2 border-brand-border hover:border-brand-dark rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                    Find Work Instead
                </Link>
            </div>
        </section>
    );
}
