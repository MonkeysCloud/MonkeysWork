class ApiConfig {
  ApiConfig._();

  /// Base URL for the MonkeysWorks API
  /// In production, this should come from environment config
  static const String baseUrl = 'https://api.monkeysworks.com/api/v1';

  /// WebSocket server URL for real-time messaging
  static const String socketUrl = 'https://ws.monkeysworks.com';

  // ── Auth ──
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String me = '/auth/me';
  static const String refreshToken = '/auth/refresh';
  static String oauth(String provider) => '/auth/oauth/$provider';

  // ── Contracts ──
  static const String contracts = '/contracts';
  static String contractDetail(String id) => '/contracts/$id';
  static String contractMilestones(String id) => '/contracts/$id/milestones';
  static String contractComplete(String id) => '/contracts/$id/complete';
  static String contractCancel(String id) => '/contracts/$id/cancel';

  // ── Milestones ──
  static String milestoneSubmit(String id) => '/milestones/$id/submit';
  static String milestoneAccept(String id) => '/milestones/$id/accept';
  static String milestoneRevision(String id) => '/milestones/$id/request-revision';

  // ── Conversations / Messages ──
  static const String conversations = '/conversations';
  static String conversationMessages(String id) => '/conversations/$id/messages';
  static String sendMessage(String id) => '/conversations/$id/messages';

  // ── Reports ──
  static const String revenueReport = '/admin/billing/revenue-report';
  static const String contractReport = '/admin/contracts/report';
  static const String disputeReport = '/admin/disputes/report';

  // ── Profile ──
  static const String profile = '/profile';
  static const String updateProfile = '/profile';

  // ── Notifications ──
  static const String notifications = '/notifications';
  static String markRead(String id) => '/notifications/$id/read';

  // ── Devices ──
  static const String deviceRegister = '/devices/register';
  static const String deviceUnregister = '/devices/unregister';
}
