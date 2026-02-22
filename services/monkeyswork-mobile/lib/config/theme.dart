import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

// ── Brand Colors (matching desktop web app) ───────────
class BrandColors {
  BrandColors._();

  // Primary palette
  static const Color dark = Color(0xFF363747);
  static const Color darkLight = Color(0xFF454660);
  static const Color darkDeep = Color(0xFF2A2B3D);
  static const Color darkSurface = Color(0xFF1E1F2E);

  // Accent
  static const Color orange = Color(0xFFF08A11);
  static const Color orangeHover = Color(0xFFE07A00);
  static const Color orangeLight = Color(0xFFFEF3E2);
  static const Color orangeSubtle = Color(0xFFFFF8F0);

  // Surfaces
  static const Color surface = Color(0xFFF8F9FC);
  static const Color cardWhite = Color(0xFFFFFFFF);
  static const Color white = Colors.white;

  // Text
  static const Color text = Color(0xFF1A1B2E);
  static const Color textSecondary = Color(0xFF4A4B5E);
  static const Color muted = Color(0xFF8E8FA3);
  static const Color placeholder = Color(0xFFB0B1C3);

  // Borders & dividers
  static const Color border = Color(0xFFE8E9F0);
  static const Color divider = Color(0xFFF0F1F5);

  // Status
  static const Color success = Color(0xFF10B981);
  static const Color successLight = Color(0xFFECFDF5);
  static const Color error = Color(0xFFEF4444);
  static const Color errorLight = Color(0xFFFEF2F2);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFFFBEB);
  static const Color info = Color(0xFF6366F1);
  static const Color infoLight = Color(0xFFEEF2FF);

  // Gradients
  static const LinearGradient darkGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF363747), Color(0xFF2A2B3D)],
  );

  static const LinearGradient orangeGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF08A11), Color(0xFFE07A00)],
  );

  static const LinearGradient heroGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF363747), Color(0xFF454660)],
  );
}

// ── App Theme ─────────────────────────────────────────
class AppTheme {
  AppTheme._();

  static ThemeData get light {
    final base = ThemeData.light(useMaterial3: true);
    final textTheme = GoogleFonts.interTextTheme(base.textTheme);

    return base.copyWith(
      colorScheme: ColorScheme.light(
        primary: BrandColors.orange,
        onPrimary: Colors.white,
        secondary: BrandColors.dark,
        onSecondary: Colors.white,
        surface: BrandColors.surface,
        onSurface: BrandColors.text,
        error: BrandColors.error,
        onError: Colors.white,
        outline: BrandColors.border,
      ),
      scaffoldBackgroundColor: BrandColors.surface,
      textTheme: textTheme.copyWith(
        headlineLarge: textTheme.headlineLarge?.copyWith(
          color: BrandColors.text,
          fontWeight: FontWeight.w800,
          fontSize: 28,
          letterSpacing: -0.5,
        ),
        headlineMedium: textTheme.headlineMedium?.copyWith(
          color: BrandColors.text,
          fontWeight: FontWeight.w700,
          fontSize: 22,
          letterSpacing: -0.3,
        ),
        titleLarge: textTheme.titleLarge?.copyWith(
          color: BrandColors.text,
          fontWeight: FontWeight.w600,
          fontSize: 18,
        ),
        titleMedium: textTheme.titleMedium?.copyWith(
          color: BrandColors.text,
          fontWeight: FontWeight.w600,
          fontSize: 15,
        ),
        bodyLarge: textTheme.bodyLarge?.copyWith(
          color: BrandColors.text,
          fontSize: 15,
        ),
        bodyMedium: textTheme.bodyMedium?.copyWith(
          color: BrandColors.textSecondary,
          fontSize: 14,
        ),
        bodySmall: textTheme.bodySmall?.copyWith(
          color: BrandColors.muted,
          fontSize: 13,
        ),
        labelSmall: textTheme.labelSmall?.copyWith(
          color: BrandColors.muted,
          fontWeight: FontWeight.w600,
          fontSize: 11,
          letterSpacing: 0.8,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: BrandColors.text,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
        centerTitle: false,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: BrandColors.text,
          letterSpacing: -0.3,
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: BrandColors.orange,
        unselectedItemColor: BrandColors.muted,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.3,
        ),
        unselectedLabelStyle: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w500,
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: BrandColors.border.withValues(alpha: 0.7),
          ),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: BrandColors.orange,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.2,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: BrandColors.text,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          side: BorderSide(color: BrandColors.border),
          textStyle: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: BrandColors.surface,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: BrandColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: BrandColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide:
              const BorderSide(color: BrandColors.orange, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: BrandColors.error),
        ),
        hintStyle: GoogleFonts.inter(
          fontSize: 14,
          color: BrandColors.placeholder,
        ),
        labelStyle: GoogleFonts.inter(
          fontSize: 14,
          color: BrandColors.muted,
        ),
        prefixIconColor: BrandColors.muted,
      ),
      dividerTheme: const DividerThemeData(
        color: BrandColors.divider,
        thickness: 1,
        space: 1,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: BrandColors.surface,
        selectedColor: BrandColors.orangeLight,
        labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        side: BorderSide(color: BrandColors.border),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      ),
    );
  }

  static ThemeData get dark {
    final base = ThemeData.dark(useMaterial3: true);
    final textTheme = GoogleFonts.interTextTheme(base.textTheme);

    return base.copyWith(
      colorScheme: ColorScheme.dark(
        primary: BrandColors.orange,
        onPrimary: Colors.white,
        secondary: BrandColors.orangeLight,
        surface: const Color(0xFF1E1F2E),
        onSurface: Colors.white,
        error: BrandColors.error,
        outline: const Color(0xFF3A3B4F),
      ),
      scaffoldBackgroundColor: const Color(0xFF151623),
      textTheme: textTheme.apply(
        bodyColor: const Color(0xFFE0E0E8),
        displayColor: Colors.white,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: const Color(0xFF1E1F2E),
        foregroundColor: Colors.white,
        elevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.light,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),
      cardTheme: CardThemeData(
        color: const Color(0xFF1E1F2E),
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFF3A3B4F)),
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: const Color(0xFF1E1F2E),
        selectedItemColor: BrandColors.orange,
        unselectedItemColor: const Color(0xFF8E8FA3),
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
    );
  }
}
