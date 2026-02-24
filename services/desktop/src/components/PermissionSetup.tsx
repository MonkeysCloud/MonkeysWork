import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@heroui/react";

type OS = "macos" | "windows" | "linux" | "unknown";

function detectOS(): OS {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("mac")) return "macos";
    if (ua.includes("win")) return "windows";
    if (ua.includes("linux")) return "linux";
    return "unknown";
}

const instructions: Record<OS, { title: string; steps: string[] }> = {
    macos: {
        title: "macOS — Required Permissions",
        steps: [
            "Open System Settings (Apple menu → System Settings)",
            "Go to Privacy & Security → Accessibility",
            'Find "MonkeysWork" in the list and toggle it ON',
            "Go back to Privacy & Security → Screen Recording",
            'Find "MonkeysWork" and toggle it ON',
            "You may need to restart the app after granting permission",
        ],
    },
    windows: {
        title: "Windows — No Setup Needed",
        steps: [
            "Activity tracking works automatically on Windows",
            "No additional permissions are required",
            "Click the button below to continue",
        ],
    },
    linux: {
        title: "Linux — Input Group Permission",
        steps: [
            "Open a terminal",
            "Run: sudo usermod -aG input $USER",
            "Log out and log back in for the change to take effect",
            "If using Wayland, you may also need to enable input monitoring in your DE settings",
        ],
    },
    unknown: {
        title: "Activity Tracking Setup",
        steps: [
            "Your operating system may require additional permissions for activity tracking",
            "Please refer to your OS documentation for input monitoring permissions",
        ],
    },
};

interface PermissionSetupProps {
    onDismiss: () => void;
}

export default function PermissionSetup({ onDismiss }: PermissionSetupProps) {
    const os = detectOS();
    const info = instructions[os];
    const [checking, setChecking] = useState(false);
    const [granted, setGranted] = useState(false);

    async function checkPermission() {
        setChecking(true);
        try {
            const okAccess: boolean = await invoke("check_accessibility_permission");
            const okScreen: boolean = await invoke("check_screen_recording_permission");
            const allOk = okAccess && okScreen;
            setGranted(allOk);
            
            // Request ones that are missing
            if (!okAccess) {
                invoke("request_accessibility_permission").catch(() => {});
            }
            // Add a small delay so OS doesn't potentially drop the second prompt
            if (!okScreen) {
                setTimeout(() => invoke("request_screen_recording_permission").catch(() => {}), 500);
            }

            if (allOk) {
                // small delay so the user sees the success state
                setTimeout(() => onDismiss(), 800);
            }
        } catch {
            // non-macOS or invoke error — treat as granted
            setGranted(true);
            setTimeout(() => onDismiss(), 800);
        } finally {
            setChecking(false);
        }
    }

    // Auto-check on mount
    useEffect(() => {
        checkPermission();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // If already granted on mount, skip the overlay
    if (granted) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(26, 27, 46, 0.92)",
                backdropFilter: "blur(20px)",
            }}
        >
            <div
                style={{
                    maxWidth: 460,
                    width: "90%",
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 20,
                    padding: "36px 32px",
                    color: "#fff",
                }}
            >
                {/* Icon */}
                <div
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: "rgba(240,138,17,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 20,
                        fontSize: 28,
                    }}
                >
                    🛡️
                </div>

                <h2
                    style={{
                        fontSize: 20,
                        fontWeight: 700,
                        margin: "0 0 6px",
                    }}
                >
                    Activity Tracking Setup
                </h2>

                <p
                    style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.55)",
                        margin: "0 0 20px",
                        lineHeight: 1.5,
                    }}
                >
                    MonkeysWork needs permission to count keyboard and mouse
                    activity system-wide. We only track{" "}
                    <strong style={{ color: "rgba(255,255,255,0.85)" }}>
                        counts
                    </strong>
                    , never the content of what you type.
                </p>

                {/* OS-specific instructions */}
                <div
                    style={{
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: 12,
                        padding: "16px 18px",
                        marginBottom: 24,
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: "#f08a11",
                            marginBottom: 12,
                        }}
                    >
                        {info.title}
                    </div>

                    <ol
                        style={{
                            margin: 0,
                            paddingLeft: 20,
                            fontSize: 13,
                            lineHeight: 1.8,
                            color: "rgba(255,255,255,0.80)",
                        }}
                    >
                        {info.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                        ))}
                    </ol>
                </div>

                {/* Actions */}
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                    }}
                >
                    <Button
                        size="sm"
                        variant="flat"
                        onPress={onDismiss}
                        style={{
                            color: "rgba(255,255,255,0.5)",
                            background: "rgba(255,255,255,0.06)",
                        }}
                    >
                        Skip for Now
                    </Button>
                    <Button
                        size="sm"
                        isLoading={checking}
                        onPress={checkPermission}
                        style={{
                            background:
                                "linear-gradient(135deg, #f08a11, #e07200)",
                            color: "#fff",
                            fontWeight: 600,
                        }}
                    >
                        {granted ? "✓ Granted!" : "Check Again"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
