import type { UserRole } from "@/contexts/AuthContext";

/* ── Types ──────────────────────────────────────────── */
export interface SubMenuItem {
    label: string;
    href: string;
}

export interface MenuItem {
    icon: string;
    label: string;
    href: string;
    badge?: string; // e.g. "active count" — rendered as placeholder
    children?: SubMenuItem[];
}

export interface MenuConfig {
    main: MenuItem[];
    secondary: MenuItem[];
}

/* ── Client (Hire) ──────────────────────────────────── */
const CLIENT_MENU: MenuConfig = {
    main: [
        { icon: "📊", label: "Dashboard", href: "/dashboard" },
        {
            icon: "📋",
            label: "My Jobs",
            href: "/dashboard/jobs",
            badge: "jobs",
            children: [
                { label: "All Jobs", href: "/dashboard/jobs" },
                { label: "Post New Job", href: "/dashboard/jobs/create" },
                { label: "Drafts", href: "/dashboard/jobs?status=draft" },
                { label: "Active", href: "/dashboard/jobs?status=open" },
                {
                    label: "Closed",
                    href: "/dashboard/jobs?status=completed,cancelled",
                },
            ],
        },
        {
            icon: "📝",
            label: "Proposals",
            href: "/dashboard/proposals",
            badge: "proposals",
            children: [
                { label: "Received", href: "/dashboard/proposals" },
                {
                    label: "Shortlisted",
                    href: "/dashboard/proposals?status=shortlisted",
                },
            ],
        },
        {
            icon: "📄",
            label: "Contracts",
            href: "/dashboard/contracts",
            badge: "contracts",
            children: [
                {
                    label: "Active",
                    href: "/dashboard/contracts?status=active",
                },
                { label: "Milestones", href: "/dashboard/milestones" },
                {
                    label: "Completed",
                    href: "/dashboard/contracts?status=completed",
                },
                { label: "Disputes", href: "/dashboard/disputes" },
            ],
        },
        {
            icon: "💬",
            label: "Messages",
            href: "/dashboard/messages",
            badge: "messages",
        },
        {
            icon: "💰",
            label: "Billing",
            href: "/dashboard/billing",
            children: [
                {
                    label: "Overview",
                    href: "/dashboard/billing",
                },
                {
                    label: "Transactions",
                    href: "/dashboard/billing/transactions",
                },
                { label: "Invoices", href: "/dashboard/billing/invoices" },
                {
                    label: "Payment Methods",
                    href: "/dashboard/billing/payment-methods",
                },
            ],
        },
    ],
    secondary: [
        {
            icon: "🔔",
            label: "Notifications",
            href: "/dashboard/notifications",
        },
        { icon: "🔍", label: "Find Talent", href: "/dashboard/freelancers" },
        { icon: "⭐", label: "Reviews Given", href: "/dashboard/reviews" },
        { icon: "📈", label: "Stats", href: "/dashboard/stats" },
        {
            icon: "⚙️",
            label: "Settings",
            href: "/dashboard/settings",
            children: [
                { label: "Profile", href: "/dashboard/settings/profile" },
                { label: "Company", href: "/dashboard/settings/company" },
                { label: "Security", href: "/dashboard/settings/security" },
                {
                    label: "Notifications",
                    href: "/dashboard/settings/notifications",
                },
                {
                    label: "Verification",
                    href: "/dashboard/settings/verification",
                },
            ],
        },
    ],
};

/* ── Freelancer ─────────────────────────────────────── */
const FREELANCER_MENU: MenuConfig = {
    main: [
        { icon: "📊", label: "Dashboard", href: "/dashboard" },
        {
            icon: "🔍",
            label: "Find Work",
            href: "/dashboard/jobs",
            children: [
                { label: "Browse Jobs", href: "/dashboard/jobs" },
                {
                    label: "Recommended",
                    href: "/dashboard/jobs/recommended",
                },
                { label: "Saved Jobs", href: "/dashboard/jobs/saved" },
                { label: "Invitations", href: "/dashboard/invitations" },
            ],
        },
        {
            icon: "📝",
            label: "My Proposals",
            href: "/dashboard/proposals",
            badge: "proposals",
            children: [
                {
                    label: "Active",
                    href: "/dashboard/proposals?status=submitted,viewed,shortlisted",
                },
                {
                    label: "Accepted",
                    href: "/dashboard/proposals?status=accepted",
                },
                {
                    label: "Archived",
                    href: "/dashboard/proposals?status=rejected,withdrawn",
                },
            ],
        },
        {
            icon: "📄",
            label: "Contracts",
            href: "/dashboard/contracts",
            badge: "contracts",
            children: [
                {
                    label: "Active",
                    href: "/dashboard/contracts?status=active",
                },
                { label: "Milestones", href: "/dashboard/milestones" },
                { label: "Deliverables", href: "/dashboard/deliverables" },
                {
                    label: "Completed",
                    href: "/dashboard/contracts?status=completed",
                },
                { label: "Disputes", href: "/dashboard/disputes" },
            ],
        },
        {
            icon: "💬",
            label: "Messages",
            href: "/dashboard/messages",
            badge: "messages",
        },
        {
            icon: "💰",
            label: "Billing",
            href: "/dashboard/billing",
            children: [
                { label: "Overview", href: "/dashboard/billing" },
                {
                    label: "Transactions",
                    href: "/dashboard/billing/transactions",
                },
                { label: "Payouts", href: "/dashboard/billing/payouts" },
                { label: "Invoices", href: "/dashboard/billing/invoices" },
            ],
        },
    ],
    secondary: [
        {
            icon: "🔔",
            label: "Notifications",
            href: "/dashboard/notifications",
        },
        { icon: "👤", label: "Public Profile", href: "/freelancers/me" },
        { icon: "⭐", label: "My Reviews", href: "/dashboard/reviews" },
        { icon: "📈", label: "Stats", href: "/dashboard/stats" },
        {
            icon: "⚙️",
            label: "Settings",
            href: "/dashboard/settings",
            children: [
                { label: "Profile", href: "/dashboard/settings/profile" },
                {
                    label: "Skills & Rate",
                    href: "/dashboard/settings/skills",
                },
                {
                    label: "Portfolio",
                    href: "/dashboard/settings/portfolio",
                },
                {
                    label: "Availability",
                    href: "/dashboard/settings/availability",
                },
                { label: "Security", href: "/dashboard/settings/security" },
                {
                    label: "Notifications",
                    href: "/dashboard/settings/notifications",
                },
                {
                    label: "Verification",
                    href: "/dashboard/settings/verification",
                },
                {
                    label: "Payout Methods",
                    href: "/dashboard/settings/payout-methods",
                },
            ],
        },
    ],
};

/* ── Admin ──────────────────────────────────────────── */
const ADMIN_MENU: MenuConfig = {
    main: [
        { icon: "📊", label: "Dashboard", href: "/dashboard/admin" },
        {
            icon: "👥",
            label: "Users",
            href: "/dashboard/admin/users",
            children: [
                { label: "All Users", href: "/dashboard/admin/users" },
                {
                    label: "Active",
                    href: "/dashboard/admin/users?status=active",
                },
                {
                    label: "Suspended",
                    href: "/dashboard/admin/users?status=suspended",
                },
                {
                    label: "Pending",
                    href: "/dashboard/admin/users?status=pending_verification",
                },
            ],
        },
        {
            icon: "📋",
            label: "Jobs",
            href: "/dashboard/admin/jobs",
            children: [
                { label: "All Jobs", href: "/dashboard/admin/jobs" },
                {
                    label: "Open",
                    href: "/dashboard/admin/jobs?status=open",
                },
                {
                    label: "Suspended",
                    href: "/dashboard/admin/jobs?status=suspended",
                },
            ],
        },
        {
            icon: "📄",
            label: "Contracts",
            href: "/dashboard/admin/contracts",
            children: [
                { label: "All Contracts", href: "/dashboard/admin/contracts" },
                { label: "Active", href: "/dashboard/admin/contracts?status=active" },
                { label: "Completed", href: "/dashboard/admin/contracts?status=completed" },
                { label: "Cancelled", href: "/dashboard/admin/contracts?status=cancelled" },
            ],
        },
        {
            icon: "✅",
            label: "Verifications",
            href: "/dashboard/admin/verifications",
            badge: "verifications",
        },
        {
            icon: "⚠️",
            label: "Disputes",
            href: "/dashboard/admin/disputes",
            badge: "disputes",
        },
        {
            icon: "🚩",
            label: "Reports",
            href: "/dashboard/admin/reports",
            badge: "reports",
        },
        {
            icon: "💰",
            label: "Billing",
            href: "/dashboard/admin/billing",
            children: [
                { label: "Overview", href: "/dashboard/admin/billing" },
                { label: "Transactions", href: "/dashboard/admin/billing/transactions" },
                { label: "Invoices", href: "/dashboard/admin/billing/invoices" },
                { label: "Payouts", href: "/dashboard/admin/billing/payouts" },
            ],
        },
        {
            icon: "⭐",
            label: "Reviews",
            href: "/dashboard/admin/reviews",
        },
        {
            icon: "💬",
            label: "Conversations",
            href: "/dashboard/admin/conversations",
        },
        {
            icon: "📰",
            label: "Blog",
            href: "/dashboard/admin/blog",
            children: [
                { label: "All Posts", href: "/dashboard/admin/blog" },
                { label: "Create New", href: "/dashboard/admin/blog/new" },
                { label: "Tags", href: "/dashboard/admin/blog?view=tags" },
            ],
        },
    ],
    secondary: [
        {
            icon: "📈",
            label: "Reports Dashboard",
            href: "/dashboard/admin/reports-dashboard",
        },
        {
            icon: "📜",
            label: "Activity Log",
            href: "/dashboard/admin/activity",
        },
        {
            icon: "🏁",
            label: "Feature Flags",
            href: "/dashboard/admin/flags",
        },
        { icon: "⚙️", label: "Settings", href: "/dashboard/settings" },
    ],
};

/* ── Accessor ───────────────────────────────────────── */
export function getMenuForRole(role: UserRole): MenuConfig {
    if (role === "admin") return ADMIN_MENU;
    return role === "client" ? CLIENT_MENU : FREELANCER_MENU;
}
