import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../firebase_options.dart';
import '../config/api_config.dart';
import '../services/api_service.dart';

/// Top-level handler for background/terminated-state messages.
/// Must be a top-level function (not a class method).
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Background handler runs in a separate isolate, so Firebase must be initialized here too
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  debugPrint('[NotificationService] Background message: ${message.messageId}');
}

/// Manages push-notification permissions, token retrieval,
/// and foreground/background message handling via FCM.
class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  static String? _currentToken;

  /// Call once after Firebase.initializeApp().
  static Future<void> init() async {
    try {
      debugPrint('[NotificationService] Initializing...');

      // Register the background handler
      FirebaseMessaging.onBackgroundMessage(
          _firebaseMessagingBackgroundHandler);

      // Request permission (critical for iOS)
      final settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      debugPrint('[NotificationService] Permission: ${settings.authorizationStatus}');

      // Get APNs token first (iOS-specific)
      if (Platform.isIOS) {
        final apnsToken = await _messaging.getAPNSToken();
        debugPrint('[NotificationService] APNs token: ${apnsToken != null ? '${apnsToken.substring(0, 20)}...' : 'NULL'}');
        if (apnsToken == null) {
          debugPrint('[NotificationService] ⚠️ No APNs token - waiting and retrying...');
          // APNs token may take a moment on first launch
          await Future.delayed(const Duration(seconds: 3));
          final retryApns = await _messaging.getAPNSToken();
          debugPrint('[NotificationService] APNs retry: ${retryApns != null ? '${retryApns.substring(0, 20)}...' : 'STILL NULL'}');
        }
      }

      // Get the FCM token
      final token = await _messaging.getToken();
      debugPrint('[NotificationService] FCM Token: ${token != null ? '${token.substring(0, 30)}...' : 'NULL'}');
      _currentToken = token;
      // Don't send to backend here — user isn't authenticated yet.
      // Token will be sent after login via registerTokenWithBackend().

      // Listen for token refresh
      _messaging.onTokenRefresh.listen((newToken) {
        debugPrint('[NotificationService] FCM Token refreshed: ${newToken.substring(0, 30)}...');
        _currentToken = newToken;
        // Try to register (will silently fail if not authenticated)
        _sendTokenToBackend(newToken);
      });

      // --- Foreground notifications (show as local notification) ---
      const androidChannel = AndroidNotificationChannel(
        'high_importance_channel',
        'High Importance Notifications',
        description: 'Used for important notifications.',
        importance: Importance.high,
      );

      await _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(androidChannel);

      const initSettings = InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(),
      );
      await _localNotifications.initialize(settings: initSettings);

      // Show a local notification when a message arrives in the foreground
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('[NotificationService] Foreground message: ${message.notification?.title}');
        final notification = message.notification;
        if (notification == null) return;

        _localNotifications.show(
          id: notification.hashCode,
          title: notification.title,
          body: notification.body,
          notificationDetails: NotificationDetails(
            android: AndroidNotificationDetails(
              androidChannel.id,
              androidChannel.name,
              channelDescription: androidChannel.description,
              importance: Importance.high,
              priority: Priority.high,
            ),
            iOS: const DarwinNotificationDetails(
              presentAlert: true,
              presentBadge: true,
              presentSound: true,
            ),
          ),
        );
      });

      // Handle notification taps (when app is in background, not terminated)
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('[NotificationService] Notification tapped: ${message.data}');
      });

      debugPrint('[NotificationService] ✅ Initialization complete');
    } catch (e, stack) {
      debugPrint('[NotificationService] ❌ Init error: $e');
      debugPrint('[NotificationService] Stack: $stack');
    }
  }

  /// Send FCM token to backend for push notification targeting.
  static Future<void> _sendTokenToBackend(String? token) async {
    if (token == null || token.isEmpty) {
      debugPrint('[NotificationService] No token to register');
      return;
    }
    try {
      final api = ApiService();
      await api.post(
        ApiConfig.deviceRegister,
        data: {
          'token': token,
          'platform': Platform.isIOS ? 'ios' : 'android',
        },
      );
      debugPrint('[NotificationService] ✅ Token registered with backend');
    } catch (e) {
      debugPrint('[NotificationService] ⚠️ Failed to register token: $e');
    }
  }

  /// Re-register the current token with the backend (call after login/auth).
  static Future<void> registerTokenWithBackend() async {
    debugPrint('[NotificationService] Registering token after auth, token=${_currentToken != null ? 'present' : 'NULL'}');
    await _sendTokenToBackend(_currentToken);
  }
}
