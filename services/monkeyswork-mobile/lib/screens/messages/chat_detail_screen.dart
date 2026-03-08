import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../config/api_config.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../models/message.dart';

class ChatDetailScreen extends StatefulWidget {
  final Conversation conversation;

  const ChatDetailScreen({super.key, required this.conversation});

  @override
  State<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<ChatDetailScreen> {
  final ApiService _api = ApiService();
  final TextEditingController _msgController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<Map<String, dynamic>> _messages = [];
  bool _loading = true;
  bool _sending = false;
  String _myUserId = '';

  @override
  void initState() {
    super.initState();
    _myUserId = context.read<AuthService>().user?['id']?.toString() ?? '';
    _fetchMessages();
    _markRead();
  }

  @override
  void dispose() {
    _msgController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _fetchMessages() async {
    try {
      final response = await _api.get(
        '${ApiConfig.conversations}/${widget.conversation.id}',
      );
      final data = response.data['data'] as Map<String, dynamic>? ?? {};
      final msgs = (data['messages'] as List?) ?? [];
      if (mounted) {
        setState(() {
          _messages = msgs
              .map((e) => Map<String, dynamic>.from(e))
              .toList()
              .reversed
              .toList(); // newest last
        });
      }
    } catch (e) {
      debugPrint('Error fetching messages: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _markRead() async {
    try {
      await _api.post('${ApiConfig.conversations}/${widget.conversation.id}/read');
    } catch (_) {}
  }

  Future<void> _sendMessage() async {
    final text = _msgController.text.trim();
    if (text.isEmpty) return;

    _msgController.clear();
    setState(() => _sending = true);

    try {
      await _api.post(
        ApiConfig.conversationMessages(widget.conversation.id),
        data: {'body': text},
      );
      await _fetchMessages();
      // Scroll to bottom
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to send: $e'),
            backgroundColor: BrandColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  String _formatTime(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(date);
      if (diff.inDays == 0) {
        return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
      } else if (diff.inDays == 1) {
        return 'Yesterday';
      } else if (diff.inDays < 7) {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days[date.weekday - 1];
      } else {
        return '${date.month}/${date.day}';
      }
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final conv = widget.conversation;

    return Scaffold(
      backgroundColor: BrandColors.surface,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back_rounded, color: BrandColors.text),
        ),
        title: Row(
          children: [
            // Avatar
            _buildAvatar(conv.otherPartyName, conv.otherPartyAvatar, 36),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    conv.otherPartyName,
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: BrandColors.text,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (conv.contractTitle != null)
                    Text(
                      conv.contractTitle!,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: BrandColors.muted,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // ── Messages List ──
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: BrandColors.orange),
                  )
                : _messages.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.chat_bubble_outline_rounded,
                                size: 48, color: BrandColors.muted),
                            const SizedBox(height: 12),
                            Text(
                              'No messages yet',
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                color: BrandColors.muted,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Start the conversation!',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: BrandColors.muted,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          final isMe =
                              msg['sender_id']?.toString() == _myUserId;
                          final content =
                              msg['content']?.toString() ?? '';
                          final senderName =
                              msg['sender_name']?.toString() ?? '';
                          final time = _formatTime(msg['created_at']?.toString());
                          final attachments = msg['attachments'];

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Row(
                              mainAxisAlignment: isMe
                                  ? MainAxisAlignment.end
                                  : MainAxisAlignment.start,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                if (!isMe) ...[
                                  _buildAvatar(senderName, null, 28),
                                  const SizedBox(width: 8),
                                ],
                                Flexible(
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 14, vertical: 10),
                                    decoration: BoxDecoration(
                                      color: isMe
                                          ? BrandColors.dark
                                          : Colors.white,
                                      borderRadius: BorderRadius.only(
                                        topLeft: const Radius.circular(18),
                                        topRight: const Radius.circular(18),
                                        bottomLeft: Radius.circular(
                                            isMe ? 18 : 4),
                                        bottomRight: Radius.circular(
                                            isMe ? 4 : 18),
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black
                                              .withValues(alpha: 0.05),
                                          blurRadius: 8,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: Column(
                                      crossAxisAlignment: isMe
                                          ? CrossAxisAlignment.end
                                          : CrossAxisAlignment.start,
                                      children: [
                                        if (!isMe)
                                          Padding(
                                            padding: const EdgeInsets.only(
                                                bottom: 4),
                                            child: Text(
                                              senderName,
                                              style: GoogleFonts.inter(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                                color: BrandColors.orange,
                                              ),
                                            ),
                                          ),
                                        Text(
                                          content,
                                          style: GoogleFonts.inter(
                                            fontSize: 14,
                                            color: isMe
                                                ? Colors.white
                                                : BrandColors.text,
                                            height: 1.4,
                                          ),
                                        ),
                                        // Attachments
                                        if (attachments != null &&
                                            attachments is List &&
                                            attachments.isNotEmpty)
                                          Padding(
                                            padding: const EdgeInsets.only(top: 8),
                                            child: Column(
                                              children: (attachments).map<Widget>((a) {
                                                final url = a is Map
                                                    ? a['url']?.toString() ?? ''
                                                    : a.toString();
                                                final name = url.split('/').last;
                                                final isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
                                                    .any((ext) => name.toLowerCase().endsWith(ext));

                                                if (isImage) {
                                                  return Padding(
                                                    padding: const EdgeInsets.only(bottom: 4),
                                                    child: ClipRRect(
                                                      borderRadius: BorderRadius.circular(10),
                                                      child: Image.network(
                                                        url,
                                                        width: 200,
                                                        fit: BoxFit.cover,
                                                        errorBuilder: (_, __, ___) =>
                                                            const Icon(Icons.broken_image, size: 40),
                                                      ),
                                                    ),
                                                  );
                                                }
                                                return Container(
                                                  margin: const EdgeInsets.only(top: 4),
                                                  padding: const EdgeInsets.symmetric(
                                                      horizontal: 10, vertical: 6),
                                                  decoration: BoxDecoration(
                                                    color: isMe
                                                        ? Colors.white.withValues(alpha: 0.15)
                                                        : BrandColors.surface,
                                                    borderRadius: BorderRadius.circular(8),
                                                  ),
                                                  child: Row(
                                                    mainAxisSize: MainAxisSize.min,
                                                    children: [
                                                      Icon(Icons.attachment_rounded,
                                                          size: 14,
                                                          color: isMe
                                                              ? Colors.white70
                                                              : BrandColors.muted),
                                                      const SizedBox(width: 6),
                                                      Flexible(
                                                        child: Text(
                                                          name,
                                                          style: GoogleFonts.inter(
                                                            fontSize: 12,
                                                            color: isMe
                                                                ? Colors.white70
                                                                : BrandColors.info,
                                                          ),
                                                          overflow: TextOverflow.ellipsis,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                );
                                              }).toList(),
                                            ),
                                          ),
                                        const SizedBox(height: 4),
                                        Text(
                                          time,
                                          style: GoogleFonts.inter(
                                            fontSize: 10,
                                            color: isMe
                                                ? Colors.white54
                                                : BrandColors.muted,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                if (isMe) const SizedBox(width: 8),
                              ],
                            ),
                          );
                        },
                      ),
          ),

          // ── Message Input ──
          Container(
            padding: EdgeInsets.only(
              left: 16,
              right: 8,
              top: 10,
              bottom: MediaQuery.of(context).padding.bottom + 10,
            ),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _msgController,
                    textCapitalization: TextCapitalization.sentences,
                    style: GoogleFonts.inter(fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      hintStyle: GoogleFonts.inter(color: BrandColors.muted),
                      filled: true,
                      fillColor: BrandColors.surface,
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    gradient: BrandColors.orangeGradient,
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: IconButton(
                    onPressed: _sending ? null : _sendMessage,
                    icon: _sending
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.send_rounded,
                            color: Colors.white, size: 20),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatar(String name, String? avatarUrl, double size) {
    if (avatarUrl != null && avatarUrl.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(size / 3),
        child: Image.network(
          avatarUrl,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _initialAvatar(name, size),
        ),
      );
    }
    return _initialAvatar(name, size);
  }

  Widget _initialAvatar(String name, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: BrandColors.darkGradient,
        borderRadius: BorderRadius.circular(size / 3),
      ),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: GoogleFonts.inter(
            fontSize: size * 0.4,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}
