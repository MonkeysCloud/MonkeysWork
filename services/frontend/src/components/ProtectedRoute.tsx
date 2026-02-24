"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

interface Props {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) {
            router.replace("/login");
            return;
        }
        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
            router.replace("/dashboard");
            return;
        }
        // Redirect pending users to role selection
        if (user && user.role === "pending") {
            router.replace("/onboarding/select-role");
            return;
        }
        // Redirect to profile completion wizard if profile not completed (skip for admins)
        if (
            user &&
            user.role !== "admin" &&
            !user.profile_completed &&
            pathname !== "/dashboard/complete-profile"
        ) {
            router.replace("/dashboard/complete-profile");
        }
    }, [isAuthenticated, isLoading, user, allowedRoles, router, pathname]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <div className="flex flex-col items-center gap-3">
                    <svg
                        className="animate-spin h-8 w-8 text-brand-orange"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                    <span className="text-sm text-brand-muted">Loading…</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;
    if (allowedRoles && user && !allowedRoles.includes(user.role)) return null;

    return <>{children}</>;
}
