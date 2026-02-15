import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata = {
    title: "Dashboard — MonkeysWork",
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <DashboardShell>{children}</DashboardShell>
        </ProtectedRoute>
    );
}
