import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';
import '../../config/api_config.dart';
import '../../models/message.dart';
import 'chat_detail_screen.dart';

class ConversationsScreen extends StatefulWidget {
  const ConversationsScreen({super.key});

  @override
  ConversationsScreenState createState() => ConversationsScreenState();
}

class ConversationsScreenState extends State<ConversationsScreen>
    with WidgetsBindingObserver {
  final ApiService _api = ApiService();
  List<Conversation> _conversations = [];
  bool _loading = true;
  Timer? _refreshTimer;

  /// Public method to refresh conversations from outside.
  void refresh() => _fetchConversations();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _fetchConversations();
    // Poll every 10 seconds for new conversations/messages
    _refreshTimer = Timer.periodic(
      const Duration(seconds: 10),
      (_) => _fetchConversations(),
    );
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _fetchConversations();
      // Restart polling timer
      _refreshTimer?.cancel();
      _refreshTimer = Timer.periodic(
        const Duration(seconds: 10),
        (_) => _fetchConversations(),
      );
    } else if (state == AppLifecycleState.paused) {
      // Stop polling when app is in background
      _refreshTimer?.cancel();
    }
  }

  Future<void> _fetchConversations() async {
    if (!_loading) {
      // Don't show full loading spinner on refresh, just fetch silently
    } else {
      setState(() => _loading = true);
    }
    try {
      final response = await _api.get(ApiConfig.conversations);
      final items = (response.data['data'] as List?)
              ?.map((e) => Conversation.fromJson(e))
              .toList() ??
          [];
      if (mounted) setState(() => _conversations = items);
    } catch (e) {
      debugPrint('Error fetching conversations: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _timeAgo(String? dateStr) {
    if (dateStr == null) return '';
    final date = DateTime.tryParse(dateStr);
    if (date == null) return '';
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'Now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return '${date.month}/${date.day}';
  }

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
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Messages',
                      style: GoogleFonts.inter(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: BrandColors.text,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ),
                  // Unread count
                  if (_conversations.any((c) => c.unreadCount > 0))
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: BrandColors.orange,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${_conversations.where((c) => c.unreadCount > 0).length} new',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // ── Content ──
          if (_loading)
            const SliverFillRemaining(
              child: Center(
                child: CircularProgressIndicator(color: BrandColors.orange),
              ),
            )
          else if (_conversations.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: BrandColors.orangeLight,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: const Icon(Icons.chat_bubble_outline_rounded,
                          size: 36, color: BrandColors.orange),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'No conversations yet',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: BrandColors.text,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Start a conversation from a contract',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: BrandColors.muted,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            SliverList.builder(
              itemCount: _conversations.length,
              itemBuilder: (context, index) {
                final conv = _conversations[index];
                return _ConversationTile(
                  conversation: conv,
                  timeAgo: _timeAgo(conv.lastMessageAt),
                  onTap: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ChatDetailScreen(conversation: conv),
                      ),
                    );
                    // Refresh after returning from chat
                    _fetchConversations();
                  },
                );
              },
            ),
        ],
      ),
    );
  }
}

class _ConversationTile extends StatelessWidget {
  final Conversation conversation;
  final String timeAgo;
  final VoidCallback onTap;

  const _ConversationTile({
    required this.conversation,
    required this.timeAgo,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final hasUnread = conversation.unreadCount > 0;

    return Material(
      color: Colors.white,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(color: BrandColors.divider, width: 1),
            ),
            color: hasUnread
                ? BrandColors.orangeSubtle
                : Colors.white,
          ),
          child: Row(
            children: [
              // ── Avatar ──
              _buildAvatar(conversation.otherPartyName,
                  conversation.otherPartyAvatar, hasUnread),
              const SizedBox(width: 14),

              // ── Name + Message ──
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            conversation.otherPartyName,
                            style: GoogleFonts.inter(
                              fontSize: 15,
                              fontWeight:
                                  hasUnread ? FontWeight.w700 : FontWeight.w600,
                              color: BrandColors.text,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          timeAgo,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: hasUnread
                                ? BrandColors.orange
                                : BrandColors.muted,
                            fontWeight:
                                hasUnread ? FontWeight.w700 : FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            conversation.lastMessage ?? 'No messages yet',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: hasUnread
                                  ? BrandColors.textSecondary
                                  : BrandColors.muted,
                              fontWeight:
                                  hasUnread ? FontWeight.w500 : FontWeight.w400,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (hasUnread) ...[
                          const SizedBox(width: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: BrandColors.orange,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '${conversation.unreadCount}',
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (conversation.contractTitle != null) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(Icons.description_outlined,
                              size: 12, color: BrandColors.muted),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              conversation.contractTitle!,
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                color: BrandColors.muted,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar(String name, String? avatarUrl, bool hasUnread) {
    if (avatarUrl != null && avatarUrl.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Image.network(
          avatarUrl,
          width: 52,
          height: 52,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _initialAvatar(name, hasUnread),
        ),
      );
    }
    return _initialAvatar(name, hasUnread);
  }

  Widget _initialAvatar(String name, bool hasUnread) {
    return Container(
      width: 52,
      height: 52,
      decoration: BoxDecoration(
        gradient: hasUnread
            ? BrandColors.orangeGradient
            : BrandColors.darkGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}
