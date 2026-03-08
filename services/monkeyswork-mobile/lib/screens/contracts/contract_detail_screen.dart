import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'dart:io';
import '../../config/theme.dart';
import '../../config/api_config.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../models/contract.dart';

class ContractDetailScreen extends StatefulWidget {
  final Contract contract;

  const ContractDetailScreen({super.key, required this.contract});

  @override
  State<ContractDetailScreen> createState() => _ContractDetailScreenState();
}

class _ContractDetailScreenState extends State<ContractDetailScreen> {
  final ApiService _api = ApiService();
  List<Map<String, dynamic>> _milestones = [];
  bool _loadingMilestones = true;
  bool _actionLoading = false;
  late String _currentStatus;

  @override
  void initState() {
    super.initState();
    _currentStatus = widget.contract.status;
    _fetchMilestones();
  }

  Future<void> _fetchMilestones() async {
    try {
      final response = await _api.get(
        ApiConfig.contractMilestones(widget.contract.id),
      );
      final items = (response.data['data'] as List?)
              ?.map((e) => Map<String, dynamic>.from(e))
              .toList() ??
          [];
      if (mounted) setState(() => _milestones = items);
    } catch (e) {
      debugPrint('Error fetching milestones: $e');
    } finally {
      if (mounted) setState(() => _loadingMilestones = false);
    }
  }

  Color _statusColor(String status) {
    return switch (status) {
      'active' => BrandColors.success,
      'completed' => BrandColors.info,
      'cancelled' => BrandColors.error,
      'suspended' => BrandColors.warning,
      'draft' => BrandColors.muted,
      'paid' => BrandColors.success,
      'pending' => BrandColors.warning,
      'in_progress' => BrandColors.info,
      _ => BrandColors.muted,
    };
  }

  Color _statusBg(String status) {
    return switch (status) {
      'active' => BrandColors.successLight,
      'completed' => BrandColors.infoLight,
      'cancelled' => BrandColors.errorLight,
      'suspended' => BrandColors.warningLight,
      'paid' => BrandColors.successLight,
      'pending' => BrandColors.warningLight,
      'in_progress' => BrandColors.infoLight,
      _ => BrandColors.surface,
    };
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '—';
    try {
      final date = DateTime.parse(dateStr);
      final months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return '${months[date.month - 1]} ${date.day}, ${date.year}';
    } catch (_) {
      return dateStr;
    }
  }

  /// Strips HTML tags from text for clean display.
  String _stripHtml(String html) {
    return html
        .replaceAll(RegExp(r'<br\s*/?>'), '\n')
        .replaceAll(RegExp(r'</p>\s*<p[^>]*>'), '\n\n')
        .replaceAll(RegExp(r'<[^>]+>'), '')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll('&nbsp;', ' ')
        .trim();
  }

  // ── Send Message ──
  void _handleSendMessage() {
    final c = widget.contract;
    final auth = context.read<AuthService>();
    final myUserId = auth.user?['id']?.toString() ?? '';
    // Determine the other party
    final otherPartyId = (c.clientId == myUserId) ? c.freelancerId : c.clientId;
    final otherParty = (c.clientId == myUserId)
        ? (c.freelancerName ?? 'the other party')
        : (c.clientName ?? 'the other party');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _MessageSheet(
        recipientName: otherParty,
        onSend: (message, attachmentUrls) async {
          Navigator.pop(ctx);
          try {
            setState(() => _actionLoading = true);

            // 1. Find existing conversation for this contract
            String? conversationId;
            try {
              final convResponse = await _api.get(ApiConfig.conversations);
              final convList = convResponse.data['data'] as List? ?? [];
              for (final conv in convList) {
                if (conv['contract_id']?.toString() == c.id) {
                  conversationId = conv['id']?.toString();
                  break;
                }
              }
            } catch (_) {}

            // 2. Create conversation if not found
            if (conversationId == null && otherPartyId != null) {
              final createResp = await _api.post(
                ApiConfig.conversations,
                data: {
                  'contract_id': c.id,
                  'participant_ids': [otherPartyId],
                  'title': c.title,
                },
              );
              conversationId = createResp.data['data']?['id']?.toString();
            }

            if (conversationId == null) {
              throw Exception('Could not find or create conversation');
            }

            // 3. Send message
            await _api.post(
              ApiConfig.conversationMessages(conversationId),
              data: {
                'body': message,
                if (attachmentUrls.isNotEmpty)
                  'attachments': attachmentUrls.map((u) => {'url': u}).toList(),
              },
            );

            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Message sent to $otherParty'),
                  backgroundColor: BrandColors.success,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              );
            }
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Failed to send message: $e'),
                  backgroundColor: BrandColors.error,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              );
            }
          } finally {
            if (mounted) setState(() => _actionLoading = false);
          }
        },
      ),
    );
  }

  // ── Close / Cancel Contract ──
  void _handleCloseContract() {
    final c = widget.contract;
    final isActive = _currentStatus == 'active';

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: BrandColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            // Warning icon
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: BrandColors.errorLight,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(
                Icons.warning_rounded,
                color: BrandColors.error,
                size: 32,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              isActive ? 'Cancel Contract?' : 'Close Contract?',
              style: GoogleFonts.inter(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: BrandColors.text,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              isActive
                  ? 'Are you sure you want to cancel "${c.title}"? This action cannot be undone and will notify the other party.'
                  : 'Are you sure you want to close "${c.title}"?',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: BrandColors.muted,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 28),
            // Buttons
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 50,
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: BrandColors.border),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: Text(
                        'Keep Contract',
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: BrandColors.text,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SizedBox(
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () async {
                        Navigator.pop(ctx);
                        await _executeCloseContract();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: BrandColors.error,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: Text(
                        isActive ? 'Cancel' : 'Close',
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
            SizedBox(height: MediaQuery.of(ctx).padding.bottom + 8),
          ],
        ),
      ),
    );
  }

  Future<void> _executeCloseContract() async {
    setState(() => _actionLoading = true);
    try {
      await _api.post(ApiConfig.contractCancel(widget.contract.id));
      if (mounted) {
        setState(() => _currentStatus = 'cancelled');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Contract cancelled successfully'),
            backgroundColor: BrandColors.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to cancel contract: $e'),
            backgroundColor: BrandColors.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  Future<void> _handleMilestoneAction(String milestoneId, String action, String label) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        content: Text(
          'Are you sure you want to $label for this milestone?',
          style: GoogleFonts.inter(color: BrandColors.muted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('Cancel', style: GoogleFonts.inter(color: BrandColors.muted)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: BrandColors.orange,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Confirm', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _actionLoading = true);
    try {
      final endpoint = '/milestones/$milestoneId/$action';
      await _api.post(endpoint);
      // Refresh milestones
      await _fetchMilestones();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$label completed successfully'),
            backgroundColor: BrandColors.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed: $e'),
            backgroundColor: BrandColors.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.contract;

    return Scaffold(
      backgroundColor: BrandColors.surface,
      body: CustomScrollView(
        slivers: [
          // ── Header ──
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                gradient: BrandColors.heroGradient,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(28),
                  bottomRight: Radius.circular(28),
                ),
              ),
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(8, 8, 16, 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Back button
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.arrow_back_rounded,
                            color: Colors.white),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Status badge
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                c.status[0].toUpperCase() +
                                    c.status.substring(1),
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            // Title
                            Text(
                              c.title,
                              style: GoogleFonts.inter(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                                letterSpacing: -0.3,
                              ),
                            ),
                            if (c.jobTitle != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                c.jobTitle!,
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  color: Colors.white.withValues(alpha: 0.6),
                                ),
                              ),
                            ],
                            const SizedBox(height: 16),
                            // Amount
                            Text(
                              c.formattedAmount,
                              style: GoogleFonts.inter(
                                fontSize: 32,
                                fontWeight: FontWeight.w800,
                                color: BrandColors.orange,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              c.isFixed ? 'Fixed Price' : 'Hourly Rate',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: Colors.white.withValues(alpha: 0.5),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // ── Content ──
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList.list(
              children: [
                // ── Parties ──
                if (c.clientName != null || c.freelancerName != null)
                  _buildSection(
                    'Parties',
                    child: Column(
                      children: [
                        if (c.clientName != null)
                          _PartyRow(
                            label: 'Client',
                            name: c.clientName!,
                            avatarColor: BrandColors.orange,
                          ),
                        if (c.clientName != null && c.freelancerName != null)
                          const SizedBox(height: 12),
                        if (c.freelancerName != null)
                          _PartyRow(
                            label: 'Freelancer',
                            name: c.freelancerName!,
                            avatarColor: BrandColors.info,
                          ),
                      ],
                    ),
                  ),

                // ── Details ──
                _buildSection(
                  'Contract Details',
                  child: Column(
                    children: [
                      _DetailRow(
                          label: 'Type',
                          value: c.isFixed ? 'Fixed Price' : 'Hourly'),
                      if (c.isHourly && c.hourlyRate != null)
                        _DetailRow(
                            label: 'Hourly Rate',
                            value: '\$${c.hourlyRate}/hr'),
                      if (c.isHourly && c.weeklyHourLimit != null)
                        _DetailRow(
                            label: 'Weekly Limit',
                            value: '${c.weeklyHourLimit} hrs'),
                      _DetailRow(
                          label: 'Currency',
                          value: c.currency.toUpperCase()),
                      if (c.platformFeePercent != null)
                        _DetailRow(
                            label: 'Platform Fee',
                            value: '${c.platformFeePercent}%'),
                      _DetailRow(
                          label: 'Created', value: _formatDate(c.createdAt)),
                      if (c.startedAt != null)
                        _DetailRow(
                            label: 'Started', value: _formatDate(c.startedAt)),
                      if (c.completedAt != null)
                        _DetailRow(
                            label: 'Completed',
                            value: _formatDate(c.completedAt)),
                      if (c.cancelledAt != null)
                        _DetailRow(
                            label: 'Cancelled',
                            value: _formatDate(c.cancelledAt)),
                    ],
                  ),
                ),

                // ── Description ──
                if (c.description != null && c.description!.isNotEmpty)
                  _buildSection(
                    'Description',
                    child: Text(
                      _stripHtml(c.description!),
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: BrandColors.textSecondary,
                        height: 1.6,
                      ),
                    ),
                  ),

                // ── Milestones ──
                _buildSection(
                  'Milestones',
                  trailing: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: BrandColors.orangeLight,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${_milestones.length}',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: BrandColors.orange,
                      ),
                    ),
                  ),
                  child: _loadingMilestones
                      ? const Center(
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: CircularProgressIndicator(
                                color: BrandColors.orange),
                          ),
                        )
                      : _milestones.isEmpty
                          ? Padding(
                              padding: const EdgeInsets.all(20),
                              child: Column(
                                children: [
                                  Icon(Icons.flag_outlined,
                                      size: 32, color: BrandColors.muted),
                                  const SizedBox(height: 8),
                                  Text(
                                    'No milestones yet',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      color: BrandColors.muted,
                                    ),
                                  ),
                                ],
                              ),
                            )
                          : Column(
                              children: _milestones.asMap().entries.map((e) {
                                final i = e.key;
                                final m = e.value;
                                final status =
                                    m['status']?.toString() ?? 'pending';
                                final amount =
                                    double.tryParse(m['amount']?.toString() ?? '0') ??
                                        0;
                                final msId = m['id']?.toString() ?? '';
                                final userRole = context.read<AuthService>().role;
                                return Column(
                                  children: [
                                    if (i > 0)
                                      Container(
                                          height: 1,
                                          color: BrandColors.divider),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(
                                          vertical: 14),
                                      child: Column(
                                        children: [
                                          Row(
                                            children: [
                                              // Index
                                              Container(
                                                width: 32,
                                                height: 32,
                                                decoration: BoxDecoration(
                                                  color: _statusBg(status),
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                ),
                                                child: Center(
                                                  child: Text(
                                                    '${i + 1}',
                                                    style: GoogleFonts.inter(
                                                      fontSize: 13,
                                                      fontWeight: FontWeight.w700,
                                                      color: _statusColor(status),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 12),
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment:
                                                      CrossAxisAlignment.start,
                                                  children: [
                                                    Text(
                                                      m['title']?.toString() ??
                                                          'Milestone ${i + 1}',
                                                      style: GoogleFonts.inter(
                                                        fontSize: 14,
                                                        fontWeight: FontWeight.w600,
                                                        color: BrandColors.text,
                                                      ),
                                                    ),
                                                    const SizedBox(height: 2),
                                                    Text(
                                                      status.replaceAll('_', ' ').split(' ').map((w) => w[0].toUpperCase() + w.substring(1)).join(' '),
                                                      style: GoogleFonts.inter(
                                                        fontSize: 12,
                                                        color:
                                                            _statusColor(status),
                                                        fontWeight: FontWeight.w500,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                              Text(
                                                '\$${amount.toStringAsFixed(2)}',
                                                style: GoogleFonts.inter(
                                                  fontSize: 15,
                                                  fontWeight: FontWeight.w700,
                                                  color: BrandColors.text,
                                                ),
                                              ),
                                            ],
                                          ),
                                          // Milestone action button
                                          if (msId.isNotEmpty) ...[
                                            if (status == 'in_progress' && userRole == 'freelancer')
                                              Padding(
                                                padding: const EdgeInsets.only(top: 10),
                                                child: SizedBox(
                                                  width: double.infinity,
                                                  height: 36,
                                                  child: ElevatedButton.icon(
                                                    onPressed: _actionLoading
                                                        ? null
                                                        : () => _handleMilestoneAction(msId, 'submit', 'Submit Work'),
                                                    icon: const Icon(Icons.check_circle_outline, size: 16),
                                                    label: Text('Submit Work',
                                                        style: GoogleFonts.inter(
                                                            fontSize: 13,
                                                            fontWeight: FontWeight.w600)),
                                                    style: ElevatedButton.styleFrom(
                                                      backgroundColor: BrandColors.info,
                                                      foregroundColor: Colors.white,
                                                      shape: RoundedRectangleBorder(
                                                        borderRadius: BorderRadius.circular(10),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            if (status == 'submitted' && userRole == 'client')
                                              Padding(
                                                padding: const EdgeInsets.only(top: 10),
                                                child: Row(
                                                  children: [
                                                    Expanded(
                                                      child: SizedBox(
                                                        height: 36,
                                                        child: OutlinedButton(
                                                          onPressed: _actionLoading
                                                              ? null
                                                              : () => _handleMilestoneAction(msId, 'request-revision', 'Request Revision'),
                                                          style: OutlinedButton.styleFrom(
                                                            side: BorderSide(color: BrandColors.warning.withValues(alpha: 0.5)),
                                                            shape: RoundedRectangleBorder(
                                                              borderRadius: BorderRadius.circular(10),
                                                            ),
                                                          ),
                                                          child: Text('Revision',
                                                              style: GoogleFonts.inter(
                                                                  fontSize: 13,
                                                                  fontWeight: FontWeight.w600,
                                                                  color: BrandColors.warning)),
                                                        ),
                                                      ),
                                                    ),
                                                    const SizedBox(width: 8),
                                                    Expanded(
                                                      child: SizedBox(
                                                        height: 36,
                                                        child: ElevatedButton.icon(
                                                          onPressed: _actionLoading
                                                              ? null
                                                              : () => _handleMilestoneAction(msId, 'accept', 'Accept & Pay'),
                                                          icon: const Icon(Icons.check_rounded, size: 16),
                                                          label: Text('Accept',
                                                              style: GoogleFonts.inter(
                                                                  fontSize: 13,
                                                                  fontWeight: FontWeight.w600)),
                                                          style: ElevatedButton.styleFrom(
                                                            backgroundColor: BrandColors.success,
                                                            foregroundColor: Colors.white,
                                                            shape: RoundedRectangleBorder(
                                                              borderRadius: BorderRadius.circular(10),
                                                            ),
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                          ],
                                        ],
                                      ),
                                    ),
                                  ],
                                );
                              }).toList(),
                            ),
                ),

                // ── Action Buttons ──
                if (_currentStatus == 'active' || _currentStatus == 'paused')
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    child: Column(
                      children: [
                        // Send message
                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton.icon(
                            onPressed: _actionLoading ? null : _handleSendMessage,
                            icon: const Icon(Icons.chat_bubble_outline_rounded,
                                size: 18),
                            label: Text(
                              'Send Message',
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: BrandColors.dark,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        // Close / Cancel contract
                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: OutlinedButton.icon(
                            onPressed: _actionLoading ? null : _handleCloseContract,
                            icon: const Icon(Icons.cancel_outlined,
                                size: 18, color: BrandColors.error),
                            label: Text(
                              'Cancel Contract',
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: BrandColors.error,
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(
                                  color: BrandColors.error.withValues(alpha: 0.3)),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Loading overlay
                if (_actionLoading)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: CircularProgressIndicator(
                          color: BrandColors.orange),
                    ),
                  ),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(String title,
      {required Widget child, Widget? trailing}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: BrandColors.border.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Row(
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: BrandColors.text,
                  ),
                ),
                const Spacer(),
                if (trailing != null) trailing,
              ],
            ),
          ),
          Container(height: 1, color: BrandColors.divider),
          Padding(
            padding: const EdgeInsets.all(16),
            child: child,
          ),
        ],
      ),
    );
  }
}

class _PartyRow extends StatelessWidget {
  final String label;
  final String name;
  final Color avatarColor;

  const _PartyRow({
    required this.label,
    required this.name,
    required this.avatarColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          radius: 18,
          backgroundColor: avatarColor.withValues(alpha: 0.12),
          child: Text(
            name[0].toUpperCase(),
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: avatarColor,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: BrandColors.muted,
                  letterSpacing: 0.5,
                ),
              ),
              Text(
                name,
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: BrandColors.text,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: BrandColors.muted,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: BrandColors.text,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Message Sheet with File Attachments ──
class _MessageSheet extends StatefulWidget {
  final String recipientName;
  final Future<void> Function(String message, List<String> attachmentUrls) onSend;

  const _MessageSheet({
    required this.recipientName,
    required this.onSend,
  });

  @override
  State<_MessageSheet> createState() => _MessageSheetState();
}

class _MessageSheetState extends State<_MessageSheet> {
  final _controller = TextEditingController();
  bool _sending = false;
  final List<PlatformFile> _attachedFiles = [];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _pickFiles() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: true,
        type: FileType.any,
      );
      if (result != null) {
        setState(() => _attachedFiles.addAll(result.files));
      }
    } catch (e) {
      debugPrint('File picker error: $e');
    }
  }

  Future<List<String>> _uploadFiles() async {
    final urls = <String>[];
    for (final file in _attachedFiles) {
      if (file.path == null) continue;
      try {
        final ref = FirebaseStorage.instance
            .ref('chat-attachments/${DateTime.now().millisecondsSinceEpoch}_${file.name}');
        await ref.putFile(File(file.path!));
        final url = await ref.getDownloadURL();
        urls.add(url);
      } catch (e) {
        debugPrint('Upload error for ${file.name}: $e');
      }
    }
    return urls;
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle bar
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: BrandColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Send Message',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: BrandColors.text,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'To ${widget.recipientName}',
            style: GoogleFonts.inter(
              fontSize: 13,
              color: BrandColors.muted,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _controller,
            maxLines: 4,
            autofocus: true,
            onChanged: (_) => setState(() {}),
            style: GoogleFonts.inter(fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Type your message...',
              hintStyle: GoogleFonts.inter(color: BrandColors.muted),
              filled: true,
              fillColor: BrandColors.surface,
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
                borderSide: const BorderSide(color: BrandColors.orange, width: 2),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Attached files
          if (_attachedFiles.isNotEmpty) ...[
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _attachedFiles.asMap().entries.map((e) {
                final file = e.value;
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: BrandColors.surface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: BrandColors.border),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.attachment_rounded, size: 14, color: BrandColors.muted),
                      const SizedBox(width: 6),
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 150),
                        child: Text(
                          file.name,
                          style: GoogleFonts.inter(fontSize: 12, color: BrandColors.text),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _formatFileSize(file.size),
                        style: GoogleFonts.inter(fontSize: 10, color: BrandColors.muted),
                      ),
                      const SizedBox(width: 6),
                      GestureDetector(
                        onTap: () => setState(() => _attachedFiles.removeAt(e.key)),
                        child: const Icon(Icons.close, size: 14, color: BrandColors.error),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 12),
          ],

          // Action row: Attach + Send
          Row(
            children: [
              // Attach button
              SizedBox(
                height: 50,
                child: OutlinedButton.icon(
                  onPressed: _sending ? null : _pickFiles,
                  icon: const Icon(Icons.attach_file_rounded, size: 18),
                  label: Text('Attach', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: BrandColors.text,
                    side: BorderSide(color: BrandColors.border),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Send button
              Expanded(
                child: SizedBox(
                  height: 50,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: BrandColors.orangeGradient,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: ElevatedButton(
                      onPressed: _sending || _controller.text.trim().isEmpty
                          ? null
                          : () async {
                              setState(() => _sending = true);
                              // Upload files if any
                              final urls = _attachedFiles.isNotEmpty
                                  ? await _uploadFiles()
                                  : <String>[];
                              await widget.onSend(_controller.text.trim(), urls);
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: _sending
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Colors.white,
                              ),
                            )
                          : Text(
                              'Send',
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
