import 'package:flutter/material.dart';
import 'config/theme.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'services/version_service.dart';

void main() {
  runApp(const MonkeysWorksApp());
}

class MonkeysWorksApp extends StatelessWidget {
  const MonkeysWorksApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MonkeysWorks',
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

  @override
  void initState() {
    super.initState();
    // Check app version after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      VersionService.showUpdateDialogIfNeeded(context);
    });
  }

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
