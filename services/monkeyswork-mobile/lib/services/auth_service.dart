import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import '../config/api_config.dart';
import 'api_service.dart';

/// Manages authentication via Firebase Auth + backend sync.
/// Firebase provides the auth UI/flow, then we sync the token
/// with our PHP backend for API authorization.
class AuthService extends ChangeNotifier {
  final fb.FirebaseAuth _firebaseAuth = fb.FirebaseAuth.instance;
  final ApiService _api = ApiService();

  fb.User? _firebaseUser;
  Map<String, dynamic>? _user;
  bool _loading = true;

  fb.User? get firebaseUser => _firebaseUser;
  Map<String, dynamic>? get user => _user;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null;
  String get role => _user?['role'] ?? 'client';
  bool get isAdmin => role == 'admin';

  AuthService() {
    _firebaseAuth.authStateChanges().listen(_onAuthChanged);
  }

  Future<void> _onAuthChanged(fb.User? user) async {
    _firebaseUser = user;
    if (user != null) {
      await _syncWithBackend();
    } else {
      _user = null;
      await _api.clearTokens();
    }
    _loading = false;
    notifyListeners();
  }

  /// Sync Firebase token with our PHP backend
  Future<void> _syncWithBackend() async {
    try {
      final idToken = await _firebaseUser?.getIdToken();
      if (idToken == null) return;

      // Send Firebase token to backend, get API token back
      final response = await _api.post(
        ApiConfig.login,
        data: {'firebase_token': idToken},
      );

      if (response.statusCode == 200) {
        final data = response.data['data'];
        await _api.setTokens(data['token'], data['refresh_token']);
        _user = data['user'];
      }
    } catch (e) {
      debugPrint('Backend sync failed: $e');
    }
  }

  // ── Email / Password ──

  Future<void> signInWithEmail(String email, String password) async {
    _loading = true;
    notifyListeners();
    try {
      // Try backend login first (existing auth system)
      final response = await _api.post(
        ApiConfig.login,
        data: {'email': email, 'password': password},
      );

      if (response.statusCode == 200) {
        final data = response.data['data'];
        await _api.setTokens(data['token'], data['refresh_token']);
        _user = data['user'];
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
        await _api.setTokens(data['token'], data['refresh_token']);
        _user = data['user'];
      }
    } catch (e) {
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  // ── Google Sign-In ──

  Future<void> signInWithGoogle() async {
    _loading = true;
    notifyListeners();
    try {
      final gsi = GoogleSignIn.instance;
      await gsi.initialize();
      // Authenticate with Google — will show sign-in UI
      await gsi.authenticate();
      // Sync the Google credential with our backend
      await _syncWithBackend();
      // _onAuthChanged will handle the rest
    } catch (e) {
      _loading = false;
      notifyListeners();
      rethrow;
    }
  }

  // ── Apple Sign-In ──

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

      final oauthCredential = fb.OAuthProvider('apple.com').credential(
        idToken: credential.identityToken,
        accessToken: credential.authorizationCode,
      );

      await _firebaseAuth.signInWithCredential(oauthCredential);
    } catch (e) {
      _loading = false;
      notifyListeners();
      rethrow;
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
    } catch (_) {}
  }

  // ── Sign Out ──

  Future<void> signOut() async {
    await _firebaseAuth.signOut();
    await _api.clearTokens();
    _user = null;
    notifyListeners();
  }
}
