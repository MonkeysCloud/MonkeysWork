import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';
import '../../config/api_config.dart';
import '../../models/contract.dart';

class ContractsScreen extends StatefulWidget {
  const ContractsScreen({super.key});

  @override
  State<ContractsScreen> createState() => _ContractsScreenState();
}

class _ContractsScreenState extends State<ContractsScreen> {
  final ApiService _api = ApiService();
  List<Contract> _contracts = [];
  bool _loading = true;
  String _statusFilter = 'all';

  final _filters = ['all', 'active', 'completed', 'cancelled', 'draft'];

  @override
  void initState() {
    super.initState();
    _fetchContracts();
  }

  Future<void> _fetchContracts() async {
    setState(() => _loading = true);
    try {
      final params = <String, dynamic>{};
      if (_statusFilter != 'all') params['status'] = _statusFilter;

      final response = await _api.get(ApiConfig.contracts, queryParams: params);
      final items = (response.data['data'] as List?)
              ?.map((e) => Contract.fromJson(e))
              .toList() ??
          [];
      setState(() => _contracts = items);
    } catch (e) {
      debugPrint('Error fetching contracts: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Color _statusColor(String status) {
    return switch (status) {
      'active' => BrandColors.success,
      'completed' => BrandColors.info,
      'cancelled' => BrandColors.error,
      'suspended' => BrandColors.warning,
      'draft' => BrandColors.muted,
      _ => BrandColors.muted,
    };
  }

  Color _statusBg(String status) {
    return switch (status) {
      'active' => BrandColors.successLight,
      'completed' => BrandColors.infoLight,
      'cancelled' => BrandColors.errorLight,
      'suspended' => BrandColors.warningLight,
      'draft' => BrandColors.surface,
      _ => BrandColors.surface,
    };
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
                bottom: 16,
              ),
              color: Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Contracts',
                          style: GoogleFonts.inter(
                            fontSize: 26,
                            fontWeight: FontWeight.w800,
                            color: BrandColors.text,
                            letterSpacing: -0.5,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: BrandColors.orangeLight,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '${_contracts.length}',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: BrandColors.orange,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Filter chips
                  SizedBox(
                    height: 38,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _filters.length,
                      separatorBuilder: (_, i) => const SizedBox(width: 8),
                      itemBuilder: (_, i) {
                        final f = _filters[i];
                        final selected = _statusFilter == f;
                        return GestureDetector(
                          onTap: () {
                            setState(() => _statusFilter = f);
                            _fetchContracts();
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: selected
                                  ? BrandColors.dark
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: selected
                                    ? BrandColors.dark
                                    : BrandColors.border,
                              ),
                            ),
                            child: Text(
                              f[0].toUpperCase() + f.substring(1),
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight:
                                    selected ? FontWeight.w700 : FontWeight.w500,
                                color:
                                    selected ? Colors.white : BrandColors.muted,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 8)),

          // ── Content ──
          if (_loading)
            const SliverFillRemaining(
              child: Center(
                child: CircularProgressIndicator(color: BrandColors.orange),
              ),
            )
          else if (_contracts.isEmpty)
            SliverFillRemaining(child: _emptyState())
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList.separated(
                itemCount: _contracts.length,
                separatorBuilder: (_, i) => const SizedBox(height: 10),
                itemBuilder: (context, index) => _ContractCard(
                  contract: _contracts[index],
                  statusColor: _statusColor(_contracts[index].status),
                  statusBg: _statusBg(_contracts[index].status),
                  onTap: () {},
                ),
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }

  Widget _emptyState() {
    return Center(
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
            child: const Icon(Icons.description_outlined,
                size: 36, color: BrandColors.orange),
          ),
          const SizedBox(height: 20),
          Text(
            'No contracts yet',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: BrandColors.text,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Your contracts will appear here',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: BrandColors.muted,
            ),
          ),
        ],
      ),
    );
  }
}

class _ContractCard extends StatelessWidget {
  final Contract contract;
  final Color statusColor;
  final Color statusBg;
  final VoidCallback onTap;

  const _ContractCard({
    required this.contract,
    required this.statusColor,
    required this.statusBg,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: BrandColors.border.withValues(alpha: 0.6)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  // Type icon
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: BrandColors.surface,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      contract.isFixed
                          ? Icons.push_pin_rounded
                          : Icons.timer_rounded,
                      size: 18,
                      color: BrandColors.dark,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          contract.title,
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: BrandColors.text,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          contract.isFixed ? 'Fixed Price' : 'Hourly',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: BrandColors.muted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Status badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: statusBg,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      contract.status[0].toUpperCase() +
                          contract.status.substring(1),
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: statusColor,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Container(
                height: 1,
                color: BrandColors.divider,
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  // Amount
                  Text(
                    contract.formattedAmount,
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: BrandColors.text,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const Spacer(),
                  // Milestones
                  if (contract.milestoneCount > 0) ...[
                    _MetaBadge(
                      icon: Icons.flag_rounded,
                      label: '${contract.milestoneCount}',
                      color: BrandColors.info,
                    ),
                    const SizedBox(width: 8),
                  ],
                  // Disputes
                  if (contract.disputeCount > 0)
                    _MetaBadge(
                      icon: Icons.warning_rounded,
                      label: '${contract.disputeCount}',
                      color: BrandColors.warning,
                    ),
                  // Arrow
                  const SizedBox(width: 8),
                  Icon(Icons.chevron_right_rounded,
                      color: BrandColors.muted, size: 20),
                ],
              ),
              // Parties
              if (contract.freelancerName != null ||
                  contract.clientName != null) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    if (contract.freelancerName != null) ...[
                      CircleAvatar(
                        radius: 12,
                        backgroundColor:
                            BrandColors.info.withValues(alpha: 0.1),
                        child: Text(
                          contract.freelancerName![0].toUpperCase(),
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: BrandColors.info,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        contract.freelancerName!,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: BrandColors.muted,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                    if (contract.clientName != null) ...[
                      if (contract.freelancerName != null)
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          child: Icon(Icons.arrow_forward_rounded,
                              size: 12, color: BrandColors.border),
                        ),
                      CircleAvatar(
                        radius: 12,
                        backgroundColor:
                            BrandColors.orange.withValues(alpha: 0.1),
                        child: Text(
                          contract.clientName![0].toUpperCase(),
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: BrandColors.orange,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        contract.clientName!,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: BrandColors.muted,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _MetaBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _MetaBadge({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
