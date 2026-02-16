export default function KpiCard({
    icon,
    label,
    value,
    sub,
}: {
    icon: string;
    label: string;
    value: string | number;
    sub?: string;
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
            <span className="text-2xl flex-shrink-0">{icon}</span>
            <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {label}
                </p>
                <p className="text-2xl font-bold text-brand-text mt-1 truncate">
                    {typeof value === "number" ? value.toLocaleString() : value}
                </p>
                {sub && (
                    <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                )}
            </div>
        </div>
    );
}
