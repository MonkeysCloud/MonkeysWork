class Conversation {
  final String id;
  final String otherPartyName;
  final String? otherPartyAvatar;
  final String? lastMessage;
  final String? lastMessageAt;
  final int unreadCount;
  final String? contractTitle;

  Conversation({
    required this.id,
    required this.otherPartyName,
    this.otherPartyAvatar,
    this.lastMessage,
    this.lastMessageAt,
    this.unreadCount = 0,
    this.contractTitle,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'].toString(),
      otherPartyName: json['other_party_name'] ?? json['participant_name'] ?? '',
      otherPartyAvatar: json['other_party_avatar'] ?? json['participant_avatar'],
      lastMessage: json['last_message'],
      lastMessageAt: json['last_message_at'],
      unreadCount: json['unread_count'] ?? 0,
      contractTitle: json['contract_title'],
    );
  }
}

class Message {
  final String id;
  final String conversationId;
  final String senderId;
  final String senderName;
  final String? senderAvatar;
  final String body;
  final String? attachmentUrl;
  final String? attachmentType;
  final String createdAt;
  final bool isMe;

  Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.senderName,
    this.senderAvatar,
    required this.body,
    this.attachmentUrl,
    this.attachmentType,
    required this.createdAt,
    this.isMe = false,
  });

  factory Message.fromJson(Map<String, dynamic> json, String currentUserId) {
    return Message(
      id: json['id'].toString(),
      conversationId: json['conversation_id'].toString(),
      senderId: json['sender_id'].toString(),
      senderName: json['sender_name'] ?? '',
      senderAvatar: json['sender_avatar'],
      body: json['body'] ?? '',
      attachmentUrl: json['attachment_url'],
      attachmentType: json['attachment_type'],
      createdAt: json['created_at'] ?? '',
      isMe: json['sender_id'].toString() == currentUserId,
    );
  }
}
