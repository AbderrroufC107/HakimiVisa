import 'package:flutter/material.dart';
import 'package:hakimi_shared/src/enums/visa_status.dart';
import 'package:hakimi_shared/src/l10n/app_localizations.dart';
import 'package:hakimi_shared/src/theme/app_spacing.dart';

class StatusBadge extends StatelessWidget {
  final VisaStatus status;
  final double fontSize;
  final EdgeInsetsGeometry? padding;

  const StatusBadge({
    super.key,
    required this.status,
    this.fontSize = 12,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding:
          padding ?? const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: status.color.withValues(alpha: isDark ? 0.2 : 0.12),
        borderRadius: BorderRadius.circular(AppSpacing.borderRadiusSmall),
        border: Border.all(color: status.color.withValues(alpha: 0.4)),
      ),
      child: Text(
        _statusLabel(context),
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
          color: status.color,
        ),
      ),
    );
  }

  String _statusLabel(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    switch (status) {
      case VisaStatus.enAttente:
        return l10n.translate('statusEnAttente');
      case VisaStatus.enTraitement:
        return l10n.translate('statusEnTraitement');
      case VisaStatus.rdvOk:
        return l10n.translate('statusRdvOk');
      case VisaStatus.visaOk:
        return l10n.translate('statusVisaOk');
      case VisaStatus.visaRefusee:
        return l10n.translate('statusVisaRefusee');
    }
  }
}
