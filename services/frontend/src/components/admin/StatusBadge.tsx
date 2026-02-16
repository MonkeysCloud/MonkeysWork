const STATUS_STYLES: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    open: "bg-blue-50 text-blue-700 ring-blue-600/20",
    in_review: "bg-blue-50 text-blue-700 ring-blue-600/20",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    pending_verification: "bg-amber-50 text-amber-700 ring-amber-600/20",
    human_review: "bg-amber-50 text-amber-700 ring-amber-600/20",
    info_requested: "bg-violet-50 text-violet-700 ring-violet-600/20",
    draft: "bg-gray-50 text-gray-600 ring-gray-500/20",
    suspended: "bg-red-50 text-red-700 ring-red-600/20",
    rejected: "bg-red-50 text-red-700 ring-red-600/20",
    deactivated: "bg-red-50 text-red-700 ring-red-600/20",
    cancelled: "bg-red-50 text-red-700 ring-red-600/20",
    closed: "bg-gray-100 text-gray-600 ring-gray-500/20",
};

export default function StatusBadge({ status }: { status: string }) {
    const style =
        STATUS_STYLES[status] ??
        "bg-gray-50 text-gray-600 ring-gray-500/20";
    const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
        >
            {label}
        </span>
    );
}
