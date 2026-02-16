"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import KpiCard from "@/components/admin/KpiCard";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

interface DashboardData {
    total_users: number;
    active_users: number;
    total_jobs: number;
    open_jobs: number;
    total_contracts: number;
    active_contracts: number;
    open_disputes: number;
    platform_revenue: number;
}

export default function AdminDashboardPage() {
    const { token } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/admin/dashboard/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                setData(json.data);
            } catch (e) {
                console.error("Dashboard fetch error:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-brand-text">
                    Admin Dashboard
                </h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-xl border border-gray-100 p-5 h-28 animate-pulse"
                        >
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
                            <div className="h-7 bg-gray-200 rounded w-1/3" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-20 text-gray-400">
                Failed to load dashboard data.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-brand-text">
                    Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Platform overview and key metrics
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    icon="👥"
                    label="Total Users"
                    value={data.total_users}
                    sub={`${data.active_users} active`}
                />
                <KpiCard
                    icon="📋"
                    label="Total Jobs"
                    value={data.total_jobs}
                    sub={`${data.open_jobs} open`}
                />
                <KpiCard
                    icon="📄"
                    label="Contracts"
                    value={data.total_contracts}
                    sub={`${data.active_contracts} active`}
                />
                <KpiCard
                    icon="⚠️"
                    label="Open Disputes"
                    value={data.open_disputes}
                />
                <KpiCard
                    icon="💰"
                    label="Platform Revenue"
                    value={`$${data.platform_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    sub="Total earned"
                />
            </div>
        </div>
    );
}
