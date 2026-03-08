import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as sio;
import '../config/api_config.dart';

/// Singleton service for Socket.IO real-time messaging.
///
/// Connects to ws.monkeysworks.com with JWT auth and provides
/// streams for real-time message events.
class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  sio.Socket? _messagesSocket;
  String? _token;

  /// Stream controller for incoming message events
  final _messageController =
      StreamController<Map<String, dynamic>>.broadcast();

  /// Stream of new messages from the socket server
  Stream<Map<String, dynamic>> get onNewMessage => _messageController.stream;

  /// Whether the messages socket is connected
  bool get isConnected => _messagesSocket?.connected ?? false;

  /// Connect to the socket server with JWT auth.
  /// Call after user login.
  void connect(String jwtToken) {
    if (_messagesSocket?.connected == true && _token == jwtToken) {
      debugPrint('[SocketService] Already connected, skipping');
      return;
    }

    _token = jwtToken;
    disconnect(); // Clean up any previous connection

    debugPrint('[SocketService] Connecting to ${ApiConfig.socketUrl}/messages');

    _messagesSocket = sio.io(
      '${ApiConfig.socketUrl}/messages',
      sio.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .enableAutoConnect()
          .enableReconnection()
          .setAuth({'token': 'Bearer $jwtToken'})
          .build(),
    );

    _messagesSocket!.onConnect((_) {
      debugPrint('[SocketService] ✅ Connected to /messages');
    });

    _messagesSocket!.onDisconnect((reason) {
      debugPrint('[SocketService] Disconnected: $reason');
    });

    _messagesSocket!.onConnectError((err) {
      debugPrint('[SocketService] ❌ Connection error: $err');
    });

    // Listen for new messages
    _messagesSocket!.on('message:new', (data) {
      debugPrint('[SocketService] 📩 message:new received');
      if (data is Map<String, dynamic>) {
        _messageController.add(data);
      } else if (data is Map) {
        _messageController.add(Map<String, dynamic>.from(data));
      }
    });
  }

  /// Join a conversation room to receive its messages.
  void joinConversation(String conversationId) {
    if (_messagesSocket?.connected != true) {
      debugPrint('[SocketService] Not connected, cannot join conversation');
      return;
    }
    debugPrint('[SocketService] Joining conversation:$conversationId');
    _messagesSocket!.emit('join:conversation', {
      'conversation_id': conversationId,
    });
  }

  /// Leave a conversation room.
  void leaveConversation(String conversationId) {
    if (_messagesSocket?.connected != true) return;
    debugPrint('[SocketService] Leaving conversation:$conversationId');
    _messagesSocket!.emit('leave:conversation', {
      'conversation_id': conversationId,
    });
  }

  /// Disconnect from the socket server. Call on logout.
  void disconnect() {
    _messagesSocket?.dispose();
    _messagesSocket = null;
    _token = null;
    debugPrint('[SocketService] Disconnected and cleaned up');
  }
}
