"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

export default function SecuritySettingsPage() {
    const { token, user } = useAuth();

    /* ── Change Password ── */
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleChangePassword = async () => {
        if (!currentPw || !newPw) return showToast("Please fill in all fields", "error");
        if (newPw.length < 8) return showToast("New password must be at least 8 characters", "error");
        if (newPw !== confirmPw) return showToast("Passwords do not match", "error");

        setSaving(true);
        try {
            const res = await fetch(`${API}/auth/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    current_password: currentPw,
                    new_password: newPw,
                }),
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || "Failed to change password");
            showToast("Password changed successfully!", "success");
            setCurrentPw("");
            setNewPw("");
            setConfirmPw("");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to change password", "error");
        } finally {
            setSaving(false);
        }
    };

    const pwStrength = (() => {
        if (!newPw) return null;
        let score = 0;
        if (newPw.length >= 8) score++;
        if (newPw.length >= 12) score++;
        if (/[A-Z]/.test(newPw) && /[a-z]/.test(newPw)) score++;
        if (/\d/.test(newPw)) score++;
        if (/[^A-Za-z0-9]/.test(newPw)) score++;
        if (score <= 2) return { label: "Weak", color: "bg-red-400", width: "w-1/3" };
        if (score <= 3) return { label: "Fair", color: "bg-amber-400", width: "w-2/3" };
        return { label: "Strong", color: "bg-emerald-500", width: "w-full" };
    })();

    return (
        <div className="max-w-3xl mx-auto">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-[slideDown_0.2s_ease-out] ${
                    toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                }`}>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">Security</h1>
                <p className="text-sm text-brand-muted mt-0.5">Manage your password and account security</p>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-xl border border-brand-border/60 p-6 mb-6">
                <h2 className="text-sm font-bold text-brand-dark mb-4 flex items-center gap-2">
                    <span className="text-lg">👤</span> Account
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-brand-muted text-xs font-medium">Email</span>
                        <p className="text-brand-dark font-medium mt-0.5">{user?.email || "—"}</p>
                    </div>
                    <div>
                        <span className="text-brand-muted text-xs font-medium">Role</span>
                        <p className="text-brand-dark font-medium mt-0.5 capitalize">{user?.role || "—"}</p>
                    </div>
                </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl border border-brand-border/60 p-6 mb-6">
                <h2 className="text-sm font-bold text-brand-dark mb-4 flex items-center gap-2">
                    <span className="text-lg">🔑</span> Change Password
                </h2>

                <div className="space-y-4">
                    {/* Current Password */}
                    <div>
                        <label className="block text-xs font-semibold text-brand-dark mb-1.5">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrent ? "text" : "password"}
                                value={currentPw}
                                onChange={(e) => setCurrentPw(e.target.value)}
                                placeholder="Enter current password"
                                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-brand-border bg-gray-50 text-sm text-brand-dark placeholder-brand-muted/50 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange/40 outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark text-xs transition-colors"
                            >
                                {showCurrent ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-xs font-semibold text-brand-dark mb-1.5">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showNew ? "text" : "password"}
                                value={newPw}
                                onChange={(e) => setNewPw(e.target.value)}
                                placeholder="At least 8 characters"
                                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-brand-border bg-gray-50 text-sm text-brand-dark placeholder-brand-muted/50 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange/40 outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark text-xs transition-colors"
                            >
                                {showNew ? "Hide" : "Show"}
                            </button>
                        </div>
                        {/* Strength meter */}
                        {pwStrength && (
                            <div className="mt-2">
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-300 ${pwStrength.color} ${pwStrength.width}`} />
                                </div>
                                <p className={`text-[10px] font-semibold mt-1 ${
                                    pwStrength.label === "Weak" ? "text-red-500" :
                                    pwStrength.label === "Fair" ? "text-amber-500" : "text-emerald-600"
                                }`}>
                                    {pwStrength.label}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-xs font-semibold text-brand-dark mb-1.5">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            value={confirmPw}
                            onChange={(e) => setConfirmPw(e.target.value)}
                            placeholder="Re-enter new password"
                            className={`w-full px-3 py-2.5 rounded-lg border text-sm text-brand-dark placeholder-brand-muted/50 focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all ${
                                confirmPw && confirmPw !== newPw
                                    ? "border-red-300 bg-red-50/50 focus:border-red-400"
                                    : "border-brand-border bg-gray-50 focus:border-brand-orange/40"
                            }`}
                        />
                        {confirmPw && confirmPw !== newPw && (
                            <p className="text-[10px] text-red-500 font-medium mt-1">Passwords do not match</p>
                        )}
                    </div>

                    <button
                        onClick={handleChangePassword}
                        disabled={saving || !currentPw || !newPw || !confirmPw || newPw !== confirmPw}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-brand-orange rounded-lg hover:bg-brand-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                    >
                        {saving ? "Changing..." : "Change Password"}
                    </button>
                </div>
            </div>

            {/* Security Tips */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-brand-border/40 p-6">
                <h2 className="text-sm font-bold text-brand-dark mb-3 flex items-center gap-2">
                    <span className="text-lg">🛡️</span> Security Tips
                </h2>
                <ul className="space-y-2 text-xs text-brand-muted">
                    <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        Use a unique password you don&apos;t use on other sites
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        Include uppercase, lowercase, numbers, and special characters
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        Make it at least 12 characters for best security
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        Consider using a password manager
                    </li>
                </ul>
            </div>
        </div>
    );
}
