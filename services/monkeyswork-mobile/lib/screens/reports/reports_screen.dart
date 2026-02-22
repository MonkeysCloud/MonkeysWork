import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/theme.dart';

class ReportsScreen extends StatelessWidget {
  const ReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BrandColors.surface,
      body: CustomScrollView(
        slivers: [
          // ── Header ──
          SliverToBoxAdapter(
            child: Container(
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 20,
                left: 20,
                right: 20,
                bottom: 20,
              ),
              color: Colors.white,
              child: Text(
                'Reports',
                style: GoogleFonts.inter(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: BrandColors.text,
                  letterSpacing: -0.5,
                ),
              ),
            ),
          ),

          // ── Coming Soon ──
          SliverFillRemaining(
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: BrandColors.infoLight,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: const Icon(Icons.bar_chart_rounded,
                        size: 36, color: BrandColors.info),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Reports Dashboard',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: BrandColors.text,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Revenue, contracts, and disputes\nreports coming soon',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: BrandColors.muted,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
