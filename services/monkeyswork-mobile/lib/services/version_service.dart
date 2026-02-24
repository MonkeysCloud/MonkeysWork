import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/api_config.dart';

/// Result of a version check against the server.
class VersionCheckResult {
  final bool updateRequired;
  final String minVersion;
  final String latestVersion;
  final String currentVersion;
  final String downloadUrl;

  const VersionCheckResult({
    required this.updateRequired,
    required this.minVersion,
    required this.latestVersion,
    required this.currentVersion,
    required this.downloadUrl,
  });

  factory VersionCheckResult.fromJson(Map<String, dynamic> json) {
    return VersionCheckResult(
      updateRequired: json['update_required'] ?? false,
      minVersion: json['min_version'] ?? '1.0.0',
      latestVersion: json['latest_version'] ?? '1.0.0',
      currentVersion: json['current_version'] ?? '0.0.0',
      downloadUrl: json['download_url'] ?? '',
    );
  }
}

class VersionService {
  VersionService._();

  /// Check if app needs updating. Returns null on network error (fail open).
  static Future<VersionCheckResult?> check() async {
    try {
      final info = await PackageInfo.fromPlatform();
      final version = info.version; // e.g. "1.0.0"

      final dio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 5),
        receiveTimeout: const Duration(seconds: 5),
      ));

      final response = await dio.get(
        '${ApiConfig.baseUrl}/app/version-check',
        queryParameters: {'platform': 'mobile', 'version': version},
      );

      if (response.statusCode != 200) return null;

      final data = response.data['data'] as Map<String, dynamic>?;
      if (data == null) return null;
      return VersionCheckResult.fromJson(data);
    } catch (_) {
      return null; // fail open
    }
  }

  /// Show a blocking, non-dismissible dialog if update is required.
  static Future<void> showUpdateDialogIfNeeded(BuildContext context) async {
    final result = await check();
    if (result == null || !result.updateRequired) return;
    if (!context.mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => PopScope(
        canPop: false,
        child: AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.system_update, color: Color(0xFFF08A11), size: 28),
              SizedBox(width: 10),
              Text('Update Required'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'A newer version of MonkeysWork is required to continue.',
                style: TextStyle(fontSize: 14),
              ),
              const SizedBox(height: 16),
              _versionRow('Your version', result.currentVersion, Colors.red),
              const SizedBox(height: 6),
              _versionRow('Minimum required', result.minVersion, const Color(0xFFF08A11)),
              if (result.latestVersion != result.minVersion) ...[
                const SizedBox(height: 6),
                _versionRow('Latest', result.latestVersion, Colors.green),
              ],
            ],
          ),
          actions: [
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF08A11),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () {
                  final url = Uri.tryParse(result.downloadUrl);
                  if (url != null) launchUrl(url, mode: LaunchMode.externalApplication);
                },
                child: const Text('Update Now', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static Widget _versionRow(String label, String version, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: 13, color: Colors.grey[600])),
        Text(
          version,
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'monospace', color: color),
        ),
      ],
    );
  }
}
