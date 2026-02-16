"use client";

interface ActionModalProps {
    open: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    onConfirm: () => void;
    confirmLabel?: string;
    confirmColor?: "orange" | "red" | "green" | "blue";
    loading?: boolean;
}

const COLOR_MAP = {
    orange: "bg-brand-orange hover:bg-brand-orange-hover text-white",
    red: "bg-red-600 hover:bg-red-700 text-white",
    green: "bg-emerald-600 hover:bg-emerald-700 text-white",
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
};

export default function ActionModal({
    open,
    title,
    children,
    onClose,
    onConfirm,
    confirmLabel = "Confirm",
    confirmColor = "orange",
    loading = false,
}: ActionModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-brand-text mb-4">
                        {title}
                    </h3>
                    <div className="space-y-4">{children}</div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${COLOR_MAP[confirmColor]}`}
                    >
                        {loading ? "Processing…" : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
