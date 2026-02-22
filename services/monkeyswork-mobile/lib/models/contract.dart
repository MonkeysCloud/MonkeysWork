class Contract {
  final String id;
  final String title;
  final String? description;
  final String contractType; // 'fixed' | 'hourly'
  final String totalAmount;
  final String? hourlyRate;
  final int? weeklyHourLimit;
  final String currency;
  final String status;
  final String? platformFeePercent;
  final String? startedAt;
  final String? completedAt;
  final String? cancelledAt;
  final String createdAt;
  final String? clientName;
  final String? clientAvatar;
  final String? freelancerName;
  final String? freelancerAvatar;
  final String? jobTitle;
  final int milestoneCount;
  final int disputeCount;

  Contract({
    required this.id,
    required this.title,
    this.description,
    required this.contractType,
    required this.totalAmount,
    this.hourlyRate,
    this.weeklyHourLimit,
    required this.currency,
    required this.status,
    this.platformFeePercent,
    this.startedAt,
    this.completedAt,
    this.cancelledAt,
    required this.createdAt,
    this.clientName,
    this.clientAvatar,
    this.freelancerName,
    this.freelancerAvatar,
    this.jobTitle,
    this.milestoneCount = 0,
    this.disputeCount = 0,
  });

  factory Contract.fromJson(Map<String, dynamic> json) {
    return Contract(
      id: json['id'].toString(),
      title: json['title'] ?? '',
      description: json['description'],
      contractType: json['contract_type'] ?? 'fixed',
      totalAmount: json['total_amount']?.toString() ?? '0',
      hourlyRate: json['hourly_rate']?.toString(),
      weeklyHourLimit: json['weekly_hour_limit'],
      currency: json['currency'] ?? 'usd',
      status: json['status'] ?? 'draft',
      platformFeePercent: json['platform_fee_percent']?.toString(),
      startedAt: json['started_at'],
      completedAt: json['completed_at'],
      cancelledAt: json['cancelled_at'],
      createdAt: json['created_at'] ?? '',
      clientName: json['client_name'],
      clientAvatar: json['client_avatar'],
      freelancerName: json['freelancer_name'],
      freelancerAvatar: json['freelancer_avatar'],
      jobTitle: json['job_title'],
      milestoneCount: json['milestone_count'] ?? 0,
      disputeCount: json['dispute_count'] ?? 0,
    );
  }

  String get formattedAmount {
    final amount = double.tryParse(totalAmount) ?? 0;
    return '\$${amount.toStringAsFixed(2)}';
  }

  bool get isFixed => contractType == 'fixed';
  bool get isHourly => contractType == 'hourly';
  bool get isActive => status == 'active';
}
