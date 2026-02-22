import 'package:flutter/material.dart';
import 'config/theme.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';

void main() {
  runApp(const MonkeysWorkApp());
}

class MonkeysWorkApp extends StatelessWidget {
  const MonkeysWorkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MonkeysWork',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.light,
      home: const _AuthGate(),
    );
  }
}

/// Routes to Login or AppShell based on auth state.
/// Once Firebase is configured, this will listen to AuthService.
class _AuthGate extends StatefulWidget {
  const _AuthGate();

  @override
  State<_AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<_AuthGate> {
  bool _showLogin = true;

  // TODO: Replace with Provider<AuthService> listener
  // For now, show auth screens (login/register toggle)
  // Once logged in, navigate to AppShell

  @override
  Widget build(BuildContext context) {
    if (_showLogin) {
      return LoginScreen(
        onSwitchToRegister: () => setState(() => _showLogin = false),
      );
    }
    return RegisterScreen(
      onSwitchToLogin: () => setState(() => _showLogin = true),
    );
  }
}

/// To bypass auth and go directly to AppShell during development,
/// change `home: const _AuthGate()` to `home: const AppShell()`.
