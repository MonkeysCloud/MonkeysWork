use base64::{engine::general_purpose::STANDARD, Engine as _};
use serde::Serialize;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use xcap::Monitor;

// ── Global counters (lock-free) ─────────────────────────────────────────────
static CLICK_COUNT: AtomicU64 = AtomicU64::new(0);
static KEY_COUNT: AtomicU64 = AtomicU64::new(0);
static LISTENER_RUNNING: AtomicBool = AtomicBool::new(false);

#[derive(Serialize)]
pub struct ActivityCounters {
    clicks: u64,
    keys: u64,
}

// ── macOS: Direct CGEventTap listener (avoids rdev's TSM crash) ─────────────
#[cfg(target_os = "macos")]
mod macos_listener {
    use std::ffi::c_void;
    use std::sync::atomic::Ordering;

    // CGEventType constants
    const KCG_EVENT_KEY_DOWN: u32 = 10;
    const KCG_EVENT_LEFT_MOUSE_DOWN: u32 = 1;
    const KCG_EVENT_RIGHT_MOUSE_DOWN: u32 = 3;
    const KCG_EVENT_OTHER_MOUSE_DOWN: u32 = 25;

    // CGEventTapLocation
    const KCG_SESSION_EVENT_TAP: u32 = 1;
    // CGEventTapPlacement
    const KCG_HEAD_INSERT_EVENT_TAP: u32 = 0;
    // CGEventTapOptions
    const KCG_EVENT_TAP_OPTION_LISTEN_ONLY: u32 = 1;

    type CGEventRef = *mut c_void;
    type CGEventTapProxy = *mut c_void;
    type CFMachPortRef = *mut c_void;
    type CFRunLoopSourceRef = *mut c_void;
    type CFRunLoopRef = *mut c_void;
    type CFStringRef = *const c_void;
    type CFAllocatorRef = *const c_void;

    type CGEventTapCallBack = unsafe extern "C" fn(
        proxy: CGEventTapProxy,
        event_type: u32,
        event: CGEventRef,
        user_info: *mut c_void,
    ) -> CGEventRef;

    extern "C" {
        fn CGPreflightListenEventAccess() -> bool;
        fn CGRequestListenEventAccess() -> bool;

        fn CGPreflightScreenCaptureAccess() -> bool;
        fn CGRequestScreenCaptureAccess() -> bool;

        fn CGEventTapCreate(
            tap: u32,
            place: u32,
            options: u32,
            events_of_interest: u64,
            callback: CGEventTapCallBack,
            user_info: *mut c_void,
        ) -> CFMachPortRef;

        fn CFMachPortCreateRunLoopSource(
            allocator: CFAllocatorRef,
            port: CFMachPortRef,
            order: i64,
        ) -> CFRunLoopSourceRef;

        fn CFRunLoopGetCurrent() -> CFRunLoopRef;
        fn CFRunLoopAddSource(rl: CFRunLoopRef, source: CFRunLoopSourceRef, mode: CFStringRef);
        fn CFRunLoopRun();
        fn CGEventTapEnable(tap: CFMachPortRef, enable: bool);

        static kCFRunLoopCommonModes: CFStringRef;
    }

    /// Minimal event tap callback — only increments counters, never touches TSM.
    unsafe extern "C" fn tap_callback(
        _proxy: CGEventTapProxy,
        event_type: u32,
        event: CGEventRef,
        _user_info: *mut c_void,
    ) -> CGEventRef {
        match event_type {
            KCG_EVENT_KEY_DOWN => {
                super::KEY_COUNT.fetch_add(1, Ordering::Relaxed);
            }
            KCG_EVENT_LEFT_MOUSE_DOWN
            | KCG_EVENT_RIGHT_MOUSE_DOWN
            | KCG_EVENT_OTHER_MOUSE_DOWN => {
                super::CLICK_COUNT.fetch_add(1, Ordering::Relaxed);
            }
            _ => {}
        }
        event
    }

    pub fn check_permission() -> bool {
        unsafe { CGPreflightListenEventAccess() }
    }

    pub fn request_permission() -> bool {
        unsafe { CGRequestListenEventAccess() }
    }

    pub fn check_screen_recording_permission() -> bool {
        unsafe { CGPreflightScreenCaptureAccess() }
    }

    pub fn request_screen_recording_permission() -> bool {
        unsafe { CGRequestScreenCaptureAccess() }
    }

    /// Start a CGEventTap on the current thread (blocks via CFRunLoopRun).
    pub fn start_listener() -> Result<(), String> {
        let events_of_interest: u64 = (1u64 << KCG_EVENT_KEY_DOWN)
            | (1u64 << KCG_EVENT_LEFT_MOUSE_DOWN)
            | (1u64 << KCG_EVENT_RIGHT_MOUSE_DOWN)
            | (1u64 << KCG_EVENT_OTHER_MOUSE_DOWN);

        let tap = unsafe {
            CGEventTapCreate(
                KCG_SESSION_EVENT_TAP,
                KCG_HEAD_INSERT_EVENT_TAP,
                KCG_EVENT_TAP_OPTION_LISTEN_ONLY,
                events_of_interest,
                tap_callback,
                std::ptr::null_mut(),
            )
        };

        if tap.is_null() {
            return Err(
                "Failed to create event tap — grant Accessibility permission in System Settings"
                    .to_string(),
            );
        }

        unsafe {
            let source = CFMachPortCreateRunLoopSource(std::ptr::null(), tap, 0);
            if source.is_null() {
                return Err("Failed to create run loop source".to_string());
            }
            let run_loop = CFRunLoopGetCurrent();
            CFRunLoopAddSource(run_loop, source, kCFRunLoopCommonModes);
            CGEventTapEnable(tap, true);
            CFRunLoopRun(); // blocks forever
        }

        Ok(())
    }
}

// ── Non-macOS: use rdev ─────────────────────────────────────────────────────
#[cfg(not(target_os = "macos"))]
mod other_listener {
    use std::sync::atomic::Ordering;

    pub fn check_permission() -> bool {
        true
    }

    pub fn request_permission() -> bool {
        true
    }

    pub fn check_screen_recording_permission() -> bool {
        true
    }

    pub fn request_screen_recording_permission() -> bool {
        true
    }

    pub fn start_listener() -> Result<(), String> {
        let cb = move |event: rdev::Event| match event.event_type {
            rdev::EventType::ButtonPress(_) => {
                super::CLICK_COUNT.fetch_add(1, Ordering::Relaxed);
            }
            rdev::EventType::KeyPress(_) => {
                super::KEY_COUNT.fetch_add(1, Ordering::Relaxed);
            }
            _ => {}
        };

        rdev::listen(cb).map_err(|e| format!("rdev::listen error: {:?}", e))
    }
}

// ── Platform-agnostic wrappers ──────────────────────────────────────────────
#[cfg(target_os = "macos")]
use macos_listener as platform;
#[cfg(not(target_os = "macos"))]
use other_listener as platform;

/// Start the global input listener on a background thread.
#[tauri::command]
fn start_activity_listener() -> Result<(), String> {
    if !platform::check_permission() {
        return Err("Accessibility permission not granted".to_string());
    }

    if LISTENER_RUNNING.swap(true, Ordering::SeqCst) {
        return Ok(()); // already running
    }

    std::thread::spawn(|| {
        if let Err(e) = platform::start_listener() {
            eprintln!("[activity] listener error: {e}");
        }
        LISTENER_RUNNING.store(false, Ordering::SeqCst);
    });

    Ok(())
}

/// Get current counters and reset them atomically.
#[tauri::command]
fn get_activity_counters() -> ActivityCounters {
    ActivityCounters {
        clicks: CLICK_COUNT.swap(0, Ordering::Relaxed),
        keys: KEY_COUNT.swap(0, Ordering::Relaxed),
    }
}

/// Check whether the app has Accessibility / Input Monitoring permission.
#[tauri::command]
fn check_accessibility_permission() -> bool {
    platform::check_permission()
}

/// Request accessibility permission (opens macOS system dialog).
#[tauri::command]
fn request_accessibility_permission() -> bool {
    platform::request_permission()
}

/// Check whether the app has Screen Recording permission (required for screenshots).
#[tauri::command]
fn check_screen_recording_permission() -> bool {
    platform::check_screen_recording_permission()
}

/// Request Screen Recording permission (opens macOS system dialog).
#[tauri::command]
fn request_screen_recording_permission() -> bool {
    platform::request_screen_recording_permission()
}

// ── Screenshot capture ──────────────────────────────────────────────────────

/// Capture a screenshot of ALL monitors and stitch them into one image.
/// Returns base64 PNG.
#[tauri::command]
fn capture_screenshot() -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| format!("Failed to list monitors: {e}"))?;

    if monitors.is_empty() {
        return Err("No monitors found".to_string());
    }

    // Single monitor → fast path (no stitching)
    if monitors.len() == 1 {
        let image = monitors[0]
            .capture_image()
            .map_err(|e| format!("Failed to capture screenshot: {e}"))?;
        return encode_image(&image);
    }

    // Multi-monitor: capture all, compute bounding box, stitch
    let mut captures: Vec<(i32, i32, image::RgbaImage)> = Vec::new();
    let mut min_x: i32 = i32::MAX;
    let mut min_y: i32 = i32::MAX;
    let mut max_x: i32 = i32::MIN;
    let mut max_y: i32 = i32::MIN;

    for mon in &monitors {
        let img = mon
            .capture_image()
            .map_err(|e| format!("Failed to capture monitor: {e}"))?;

        let x = mon.x().map_err(|e| format!("Failed to get monitor x: {e}"))?;
        let y = mon.y().map_err(|e| format!("Failed to get monitor y: {e}"))?;
        let w = img.width() as i32;
        let h = img.height() as i32;

        min_x = min_x.min(x);
        min_y = min_y.min(y);
        max_x = max_x.max(x + w);
        max_y = max_y.max(y + h);

        captures.push((x, y, img));
    }

    let total_w = (max_x - min_x) as u32;
    let total_h = (max_y - min_y) as u32;

    let mut canvas = image::RgbaImage::new(total_w, total_h);

    for (x, y, img) in &captures {
        let offset_x = (x - min_x) as i64;
        let offset_y = (y - min_y) as i64;
        image::imageops::overlay(&mut canvas, img, offset_x, offset_y);
    }

    encode_image(&canvas)
}

fn encode_image(img: &image::RgbaImage) -> Result<String, String> {
    let mut buf = Vec::new();
    {
        let mut cursor = std::io::Cursor::new(&mut buf);
        img.write_to(&mut cursor, image::ImageFormat::Png)
            .map_err(|e| format!("Failed to encode PNG: {e}"))?;
    }
    Ok(STANDARD.encode(&buf))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            capture_screenshot,
            start_activity_listener,
            get_activity_counters,
            check_accessibility_permission,
            request_accessibility_permission,
            check_screen_recording_permission,
            request_screen_recording_permission,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
