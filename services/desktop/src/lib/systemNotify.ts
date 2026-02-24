/**
 * System notification helper.
 * Uses Tauri's notification plugin to send native OS notifications.
 * Falls back silently in non-Tauri environments (e.g. browser dev).
 */
import {
    isPermissionGranted,
    requestPermission,
    sendNotification,
} from "@tauri-apps/plugin-notification";

let _permissionChecked = false;
let _permissionGranted = false;

/**
 * Ensure notification permission is granted. Call once on app boot.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
    if (_permissionChecked) return _permissionGranted;
    try {
        _permissionGranted = await isPermissionGranted();
        if (!_permissionGranted) {
            const result = await requestPermission();
            _permissionGranted = result === "granted";
        }
        _permissionChecked = true;
    } catch {
        // Not running in Tauri — silently ignore
        _permissionChecked = true;
        _permissionGranted = false;
    }
    return _permissionGranted;
}

/**
 * Send a native system notification (non-blocking, fire-and-forget).
 */
export function systemNotify(title: string, body?: string) {
    if (!_permissionGranted) return;
    try {
        sendNotification({ title, body });
    } catch {
        // ignore
    }
}
