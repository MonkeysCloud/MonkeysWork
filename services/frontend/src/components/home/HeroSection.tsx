"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/* ── animated mesh background ───────────────────────── */
function MeshBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        const particles: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
        const count = 60;

        const resize = () => {
            canvas.width = canvas.offsetWidth * 2;
            canvas.height = canvas.offsetHeight * 2;
        };
        resize();
        window.addEventListener("resize", resize);

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                r: Math.random() * 2 + 1,
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(240,138,17,0.25)";
                ctx.fill();
            }

            // draw lines
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 200) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(240,138,17,${0.08 * (1 - dist / 200)})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
            animId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
        />
    );
}

/* ── component ──────────────────────────────────────── */
export default function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-dark via-[#2a2b3d] to-[#1e1f2e] text-white -mt-[72px] pt-[72px]">
            <MeshBackground />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40 text-center">
                {/* headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.08]">
                    Where great work
                    <br />
                    <span className="bg-gradient-to-r from-brand-orange via-amber-400 to-brand-orange bg-clip-text text-transparent">
                        finds great talent.
                    </span>
                </h1>

                {/* subheadline */}
                <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
                    AI-powered matching. Milestone escrow. Verified freelancers.
                    <br className="hidden sm:inline" />
                    The freelance marketplace built for projects that matter.
                </p>

                {/* dual CTA */}
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/register/client"
                        className="px-8 py-4 text-base font-bold text-brand-dark bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-[0_4px_24px_rgba(240,138,17,0.4)] hover:shadow-[0_6px_32px_rgba(240,138,17,0.55)] transition-all duration-200 hover:-translate-y-0.5"
                    >
                        Hire a Freelancer
                    </Link>
                    <Link
                        href="/register/freelancer"
                        className="px-8 py-4 text-base font-bold text-white border-2 border-white/20 hover:border-white/40 rounded-xl backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5"
                    >
                        Find Work
                    </Link>
                </div>

                {/* trust bar */}
                <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/40">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Trusted by 2,500+ companies
                    </span>
                    <span className="hidden sm:inline text-white/20">·</span>
                    <span>15,000+ verified freelancers</span>
                    <span className="hidden sm:inline text-white/20">·</span>
                    <span>$12M+ paid out</span>
                </div>
            </div>

            {/* bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-brand-surface to-transparent" />
        </section>
    );
}
