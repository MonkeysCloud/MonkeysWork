"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

export default function FreelancerMePage() {
    const router = useRouter();

    useEffect(() => {
        (async () => {
            const token = localStorage.getItem("mw_token");
            if (!token) {
                router.replace("/login");
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/freelancers/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error();
                const { data } = await res.json();
                router.replace(`/freelancers/${data.user_id}`);
            } catch {
                router.replace("/login");
            }
        })();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex items-center gap-3 text-gray-400">
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm font-medium">Redirecting to your profile…</span>
            </div>
        </div>
    );
}
