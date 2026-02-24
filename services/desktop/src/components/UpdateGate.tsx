import { useState, useEffect } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { getApiBase } from "@/lib/api";

declare const __APP_VERSION__: string;

interface VersionCheckResult {
    update_required: boolean;
    min_version: string;
    latest_version: string;
    current_version: string;
    download_url: string;
}

export default function UpdateGate({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<"checking" | "ok" | "update_required">("checking");
    const [info, setInfo] = useState<VersionCheckResult | null>(null);

    useEffect(() => {
        async function check() {
            try {
                const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";
                const res = await fetch(
                    `${getApiBase()}/app/version-check?platform=desktop&version=${version}`
                );
                if (!res.ok) { setStatus("ok"); return; } // fail open

                const body = await res.json();
                const data: VersionCheckResult = body.data;

                if (data.update_required) {
                    setInfo(data);
                    setStatus("update_required");
                } else {
                    setStatus("ok");
                }
            } catch {
                // If server unreachable, allow the app to work
                setStatus("ok");
            }
        }
        check();
    }, []);

    if (status === "checking") {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-b from-[#2a2b3d] to-[#1a1b2e]">
                <div className="flex flex-col items-center gap-3">
                    <svg
                        className="animate-spin h-8 w-8 text-[#f08a11]"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <circle
                            className="opacity-25"
                            cx="12" cy="12" r="10"
                            stroke="currentColor" strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                    <span className="text-sm text-white/50">Checking for updates…</span>
                </div>
            </div>
        );
    }

    if (status === "update_required" && info) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-b from-[#2a2b3d] to-[#1a1b2e] px-6">
                {/* Drag region */}
                <div data-tauri-drag-region className="absolute top-0 left-0 right-0 h-8 z-50" />

                {/* Decorative glow */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#f08a11]/10 rounded-full blur-[120px]" />
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#f08a11]/5 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 text-center max-w-sm">
                    {/* Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#f08a11] to-[#e07200] flex items-center justify-center shadow-lg shadow-[#f08a11]/30">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-extrabold text-white mb-2">
                        Update Required
                    </h1>
                    <p className="text-white/60 text-sm leading-relaxed mb-6">
                        A new version of MonkeysWork is available. Please update to continue using the app.
                    </p>

                    {/* Version info */}
                    <div className="bg-white/[0.07] rounded-xl border border-white/10 px-4 py-3 mb-6">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-white/50">Your version</span>
                            <span className="text-red-400 font-mono font-bold">{info.current_version}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Minimum required</span>
                            <span className="text-[#f08a11] font-mono font-bold">{info.min_version}</span>
                        </div>
                        {info.latest_version !== info.min_version && (
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-white/50">Latest</span>
                                <span className="text-green-400 font-mono font-bold">{info.latest_version}</span>
                            </div>
                        )}
                    </div>

                    {/* CTA */}
                    <button
                        onClick={async () => {
                            try {
                                await openUrl(info.download_url);
                            } catch {
                                window.open(info.download_url, "_blank");
                            }
                        }}
                        className="w-full py-3.5 text-sm font-bold text-white bg-gradient-to-r from-[#f08a11] to-[#e07200] rounded-xl shadow-lg shadow-[#f08a11]/25 hover:shadow-[#f08a11]/40 transition-all duration-200 hover:-translate-y-0.5"
                    >
                        Download Update
                    </button>

                    <p className="text-white/30 text-xs mt-4">
                        After updating, relaunch the app to continue.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
