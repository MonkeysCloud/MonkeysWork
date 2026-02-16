"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user?.role !== "admin") {
            router.replace("/dashboard");
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="animate-spin h-8 w-8 border-4 border-brand-orange border-t-transparent rounded-full" />
            </div>
        );
    }

    if (user?.role !== "admin") return null;

    return <>{children}</>;
}
