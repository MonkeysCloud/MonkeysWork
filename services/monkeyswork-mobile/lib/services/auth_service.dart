import 'package:flutter/foundation.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import '../config/api_config.dart';
import 'notification_service.dart';
import 'api_service.dart';

/// Manages authentication against the MonkeysWorks PHP backend.
/// Uses email/password for standard login and sends OAuth authorization
/// codes to the backend's /auth/oauth/{provider} endpoint.
class AuthService extends ChangeNotifier {
  final ApiService _api = ApiService();

  Map<String, dynamic>? _user;
  bool _loading = false;

  Map<String, dynamic>? get user => _user;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null;
  String get role => _user?['role'] ?? 'client';
  bool get isAdmin => role == 'admin';

  AuthService() {
    _tryRestoreSession();
  }

  /// On startup, check if we have a stored token and fetch the user.
  Future<void> _tryRestoreSession() async {
    _loading = true;
    notifyListeners();
    try {
      final token = await _api.getToken();
      if (token != null) {
        await fetchCurrentUser();
      }
    } catch (_) {}
    _loading = false;
    notifyListeners();
  }

  /// Parse the backend's standard auth response format.
  /// Both /auth/login and /auth/oauth/{provider} return:
  /// { "data": { "user_id", "role", "display_name", "token", "refresh", ... } }
  Future<void> _handleAuthResponse(Map<String, dynamic> data) async {
    debugPrint('[AuthService] Handling auth response: $data');
    await _api.setTokens(data['token'], data['refresh']);
    _user = {
      'id': data['user_id'],
      'role': data['role'],
      'display_name': data['display_name'],
      'profile_completed': data['profile_completed'] ?? false,
      'avatar_url': data['avatar_url'],
    };
    debugPrint('[AuthService] User set: $_user, isAuthenticated=$isAuthenticated');
    notifyListeners();

    // Re-register FCM token with backend now that we're authenticated
    NotificationService.registerTokenWithBackend();
  }

  // ── Email / Password ──

  Future<void> signInWithEmail(String email, String password) async {
    _loading = true;
    notifyListeners();
    try {
      final response = await _api.post(
        ApiConfig.login,
        data: {'email': email, 'password': password},
      );

      if (response.statusCode == 200) {
        await _handleAuthResponse(response.data['data']);
      }
    } catch (e) {
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> registerWithEmail({
    required String name,
    required String email,
    required String password,
    required String role,
  }) async {
    _loading = true;
    notifyListeners();
    try {
      final response = await _api.post(
        ApiConfig.register,
        data: {
          'name': name,
          'email': email,
          'password': password,
          'role': role,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data['data'];
        if (data['token'] != null) {
          await _handleAuthResponse(data);
        }
      }
    } catch (e) {
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  // ── Google Sign-In ──
  // Uses google_sign_in v7 API to authenticate and get server auth code

  Future<void> signInWithGoogle() async {
    _loading = true;
    notifyListeners();
    try {
      final gsi = GoogleSignIn.instance;
      await gsi.initialize(serverClientId: _googleWebClientId);

      // Authenticate to get user info
      final account = await gsi.authenticate(
        scopeHint: ['email', 'profile'],
      );

      // Get server authorization code to send to our backend
      final serverAuth = await account.authorizationClient.authorizeServer(
        ['email', 'profile'],
      );

      if (serverAuth == null) {
        throw Exception('Could not get server auth code from Google');
      }

      // Send authorization code to our backend
      final response = await _api.post(
        ApiConfig.oauth('google'),
        data: {'code': serverAuth.serverAuthCode},
      );

      if (response.statusCode == 200) {
        await _handleAuthResponse(response.data['data']);
      }
    } catch (e) {
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  // ── Apple Sign-In ──
  // Gets authorization code from Apple, sends to backend

  Future<void> signInWithApple() async {
    _loading = true;
    notifyListeners();
    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      // Send the authorization code to our backend
      final response = await _api.post(
        ApiConfig.oauth('apple'),
        data: {'code': credential.authorizationCode},
      );

      if (response.statusCode == 200) {
        await _handleAuthResponse(response.data['data']);
      }
    } catch (e) {
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  // ── GitHub Sign-In ──
  // Opens GitHub OAuth in browser, captures redirect with code

  Future<void> signInWithGitHub() async {
    _loading = true;
    notifyListeners();
    try {
      // GitHub OAuth App is configured with the web callback URL.
      // We don't send redirect_uri so GitHub uses its default callback.
      // flutter_web_auth_2 intercepts the redirect to capture the code.
      const callbackUrl = 'https://monkeysworks.com/auth/github/callback';

      final authUrl = Uri.https('github.com', '/login/oauth/authorize', {
        'client_id': _githubClientId,
        'redirect_uri': callbackUrl,
        'scope': 'read:user user:email',
      });

      final result = await FlutterWebAuth2.authenticate(
        url: authUrl.toString(),
        callbackUrlScheme: 'https',
        options: const FlutterWebAuth2Options(
          preferEphemeral: true,
        ),
      );

      final code = Uri.parse(result).queryParameters['code'];
      if (code == null) {
        throw Exception('GitHub sign-in failed: no authorization code received');
      }

      // Send code to our backend
      final response = await _api.post(
        ApiConfig.oauth('github'),
        data: {'code': code},
      );

      if (response.statusCode == 200) {
        await _handleAuthResponse(response.data['data']);
      }
    } catch (e) {
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  // ── Fetch current user from API ──

  Future<void> fetchCurrentUser() async {
    try {
      final response = await _api.get(ApiConfig.me);
      if (response.statusCode == 200) {
        _user = response.data['data'];
        notifyListeners();
      }
    } catch (_) {
      // Token expired or invalid — clear session
      _user = null;
      await _api.clearTokens();
    }
  }

  // ── Sign Out ──

  Future<void> signOut() async {
    await _api.clearTokens();
    _user = null;
    notifyListeners();
  }

  // ── Config ──
  // Google Web Client ID (needed to get serverAuthCode for backend exchange)
  static const String _googleWebClientId =
      '559418104290-tk38nu25vv0n2c1s5ridc6vms0sv0t3r.apps.googleusercontent.com';

  // GitHub OAuth Client ID
  static const String _githubClientId = 'Ov23liRF2ExGiHoaVacL';
}
