import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onSwitchToRegister;

  const LoginScreen({super.key, required this.onSwitchToRegister});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  bool _obscurePassword = true;
  String? _error;

  late AnimationController _animController;
  late Animation<double> _fadeIn;
  late Animation<Offset> _slideUp;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeIn = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _slideUp = Tween<Offset>(
      begin: const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOut));
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final auth = context.read<AuthService>();
      await auth.signInWithEmail(
        _emailController.text.trim(),
        _passwordController.text,
      );
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final auth = context.read<AuthService>();
      await auth.signInWithGoogle();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleAppleSignIn() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final auth = context.read<AuthService>();
      await auth.signInWithApple();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleGitHubSignIn() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final auth = context.read<AuthService>();
      await auth.signInWithGitHub();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isTablet = size.shortestSide >= 600;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        body: SingleChildScrollView(
          child: Column(
            children: [
              // ── Dark Hero Header with Brand Logo ──
              Container(
                width: double.infinity,
                padding: EdgeInsets.only(
                  top: MediaQuery.of(context).padding.top + 40,
                  bottom: 48,
                ),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFF363747),
                      Color(0xFF2A2B3D),
                      Color(0xFF363747),
                    ],
                  ),
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(32),
                    bottomRight: Radius.circular(32),
                  ),
                ),
                child: Column(
                  children: [
                    // MonkeysWork Logo (dark variant — white text on dark bg)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 48),
                      child: SvgPicture.asset(
                        'assets/images/monkeyswork-dark.svg',
                        width: 200,
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Welcome badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: BrandColors.orange.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        'WELCOME BACK',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: BrandColors.orange,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'Sign in to your account',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        color: Colors.white.withValues(alpha: 0.5),
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),

              // ── Form Area ──
              FadeTransition(
                opacity: _fadeIn,
                child: SlideTransition(
                  position: _slideUp,
                  child: Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: isTablet ? size.width * 0.2 : 24,
                      vertical: 28,
                    ),
                    child: Column(
                      children: [
                        // ── Social Login Buttons (matching web layout) ──
                        _OAuthButton(
                          onPressed: _loading ? null : _handleGoogleSignIn,
                          icon: _googleIcon(),
                          label: 'Continue with Google',
                        ),
                        const SizedBox(height: 12),
                        _OAuthButton(
                          onPressed: _loading ? null : _handleGitHubSignIn,
                          icon: _githubIcon(),
                          label: 'Continue with GitHub',
                        ),
                        const SizedBox(height: 12),
                        _OAuthButton(
                          onPressed: _loading ? null : _handleAppleSignIn,
                          icon: const Icon(Icons.apple_rounded,
                              size: 20, color: Colors.black),
                          label: 'Continue with Apple',
                        ),
                        const SizedBox(height: 28),

                        // ── Divider ──
                        Row(
                          children: [
                            Expanded(
                              child: Container(
                                height: 1,
                                color: BrandColors.border,
                              ),
                            ),
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                              child: Text(
                                'or log in with email',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: BrandColors.muted,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                            Expanded(
                              child: Container(
                                height: 1,
                                color: BrandColors.border,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // ── Error Banner ──
                        if (_error != null)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(14),
                            margin: const EdgeInsets.only(bottom: 20),
                            decoration: BoxDecoration(
                              color: BrandColors.errorLight,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: BrandColors.error.withValues(alpha: 0.2),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline_rounded,
                                    color: BrandColors.error, size: 20),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    _error!,
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      color: BrandColors.error,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                        // ── Email / Password Form ──
                        Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Email Address',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: BrandColors.muted,
                                ),
                              ),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _emailController,
                                keyboardType: TextInputType.emailAddress,
                                textInputAction: TextInputAction.next,
                                style: GoogleFonts.inter(fontSize: 14),
                                decoration: InputDecoration(
                                  hintText: 'you@example.com',
                                  filled: true,
                                  fillColor: Colors.white,
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 12,
                                  ),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide: BorderSide(
                                      color: BrandColors.border
                                          .withValues(alpha: 0.6),
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide: BorderSide(
                                      color: BrandColors.border
                                          .withValues(alpha: 0.6),
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide: const BorderSide(
                                      color: BrandColors.orange,
                                      width: 2,
                                    ),
                                  ),
                                ),
                                validator: (v) {
                                  if (v == null || v.isEmpty) {
                                    return 'Email is required';
                                  }
                                  if (!v.contains('@')) return 'Invalid email';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 18),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Password',
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: BrandColors.muted,
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () {},
                                    child: Text(
                                      'Forgot password?',
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        color: BrandColors.orange,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _passwordController,
                                obscureText: _obscurePassword,
                                textInputAction: TextInputAction.done,
                                onFieldSubmitted: (_) => _handleLogin(),
                                style: GoogleFonts.inter(fontSize: 14),
                                decoration: InputDecoration(
                                  hintText: 'Enter your password',
                                  filled: true,
                                  fillColor: Colors.white,
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 12,
                                  ),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide: BorderSide(
                                      color: BrandColors.border
                                          .withValues(alpha: 0.6),
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide: BorderSide(
                                      color: BrandColors.border
                                          .withValues(alpha: 0.6),
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide: const BorderSide(
                                      color: BrandColors.orange,
                                      width: 2,
                                    ),
                                  ),
                                  suffixIcon: IconButton(
                                    icon: Icon(
                                      _obscurePassword
                                          ? Icons.visibility_off_outlined
                                          : Icons.visibility_outlined,
                                      size: 18,
                                      color: BrandColors.muted,
                                    ),
                                    onPressed: () => setState(
                                      () =>
                                          _obscurePassword = !_obscurePassword,
                                    ),
                                  ),
                                ),
                                validator: (v) {
                                  if (v == null || v.isEmpty) {
                                    return 'Password is required';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 24),

                              // ── Sign In Button ──
                              SizedBox(
                                width: double.infinity,
                                height: 50,
                                child: DecoratedBox(
                                  decoration: BoxDecoration(
                                    gradient: BrandColors.orangeGradient,
                                    borderRadius: BorderRadius.circular(12),
                                    boxShadow: [
                                      BoxShadow(
                                        color: BrandColors.orange
                                            .withValues(alpha: 0.4),
                                        blurRadius: 24,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: ElevatedButton(
                                    onPressed: _loading ? null : _handleLogin,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.transparent,
                                      shadowColor: Colors.transparent,
                                      shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(12),
                                      ),
                                    ),
                                    child: _loading
                                        ? const SizedBox(
                                            width: 22,
                                            height: 22,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2.5,
                                              color: Colors.white,
                                            ),
                                          )
                                        : Text(
                                            'Sign In',
                                            style: GoogleFonts.inter(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w700,
                                              color: Colors.white,
                                            ),
                                          ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 32),

                        // ── Switch to Register ──
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "Don't have an account? ",
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                color: BrandColors.muted,
                              ),
                            ),
                            GestureDetector(
                              onTap: widget.onSwitchToRegister,
                              child: Text(
                                'Sign up',
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: BrandColors.orange,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Branded Google Icon (multi-color) ──
  Widget _googleIcon() {
    return SizedBox(
      width: 18,
      height: 18,
      child: CustomPaint(painter: _GoogleLogoPainter()),
    );
  }

  // ── GitHub Icon ──
  Widget _githubIcon() {
    return const Icon(Icons.code_rounded, size: 18, color: Color(0xFF24292F));
  }
}

// ── OAuth Button (matches web frontend style) ──
class _OAuthButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget icon;
  final String label;

  const _OAuthButton({
    required this.onPressed,
    required this.icon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          backgroundColor: Colors.white,
          side: BorderSide(color: BrandColors.border.withValues(alpha: 0.6)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            icon,
            const SizedBox(width: 10),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: BrandColors.text,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Google Logo Painter (multi-color G) ──
class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double w = size.width;
    final double h = size.height;

    // Blue
    final bluePaint = Paint()..color = const Color(0xFF4285F4);
    final bluePath = Path()
      ..moveTo(w * 0.94, h * 0.51)
      ..cubicTo(w * 0.94, h * 0.48, w * 0.93, h * 0.44, w * 0.93, h * 0.42)
      ..lineTo(w * 0.5, h * 0.42)
      ..lineTo(w * 0.5, h * 0.60)
      ..lineTo(w * 0.75, h * 0.60)
      ..cubicTo(w * 0.73, h * 0.67, w * 0.69, h * 0.72, w * 0.63, h * 0.76)
      ..lineTo(w * 0.78, h * 0.87)
      ..cubicTo(w * 0.87, h * 0.79, w * 0.94, h * 0.67, w * 0.94, h * 0.51);
    canvas.drawPath(bluePath, bluePaint);

    // Green
    final greenPaint = Paint()..color = const Color(0xFF34A853);
    final greenPath = Path()
      ..moveTo(w * 0.5, h * 0.96)
      ..cubicTo(w * 0.62, h * 0.96, w * 0.73, h * 0.92, w * 0.80, h * 0.85)
      ..lineTo(w * 0.63, h * 0.76)
      ..cubicTo(w * 0.59, h * 0.79, w * 0.54, h * 0.80, w * 0.5, h * 0.80)
      ..cubicTo(w * 0.38, h * 0.80, w * 0.28, h * 0.72, w * 0.24, h * 0.61)
      ..lineTo(w * 0.09, h * 0.73)
      ..cubicTo(w * 0.17, h * 0.86, w * 0.32, h * 0.96, w * 0.5, h * 0.96);
    canvas.drawPath(greenPath, greenPaint);

    // Yellow
    final yellowPaint = Paint()..color = const Color(0xFFFBBC05);
    final yellowPath = Path()
      ..moveTo(w * 0.24, h * 0.59)
      ..cubicTo(w * 0.23, h * 0.56, w * 0.22, h * 0.53, w * 0.22, h * 0.50)
      ..cubicTo(w * 0.22, h * 0.47, w * 0.23, h * 0.44, w * 0.24, h * 0.41)
      ..lineTo(w * 0.09, h * 0.29)
      ..cubicTo(w * 0.06, h * 0.36, w * 0.04, h * 0.43, w * 0.04, h * 0.50)
      ..cubicTo(w * 0.04, h * 0.57, w * 0.06, h * 0.64, w * 0.09, h * 0.73)
      ..lineTo(w * 0.24, h * 0.59);
    canvas.drawPath(yellowPath, yellowPaint);

    // Red
    final redPaint = Paint()..color = const Color(0xFFEA4335);
    final redPath = Path()
      ..moveTo(w * 0.5, h * 0.22)
      ..cubicTo(w * 0.57, h * 0.22, w * 0.63, h * 0.25, w * 0.68, h * 0.29)
      ..lineTo(w * 0.81, h * 0.16)
      ..cubicTo(w * 0.73, h * 0.09, w * 0.62, h * 0.04, w * 0.5, h * 0.04)
      ..cubicTo(w * 0.32, h * 0.04, w * 0.17, h * 0.14, w * 0.09, h * 0.29)
      ..lineTo(w * 0.24, h * 0.41)
      ..cubicTo(w * 0.28, h * 0.30, w * 0.38, h * 0.22, w * 0.5, h * 0.22);
    canvas.drawPath(redPath, redPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
