import 'package:flutter/material.dart';
import 'package:hakimi_shared/src/theme/app_spacing.dart';

class AppDecoration {
  AppDecoration._();

  static BoxDecoration get card => BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.borderRadiusMedium),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      );

  static BoxDecoration cardDark(BuildContext context) => BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(AppSpacing.borderRadiusMedium),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      );

  static BoxDecoration get elevated => BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.borderRadiusMedium),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      );

  static BoxDecoration get outlined => BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.borderRadiusMedium),
        border: Border.all(
          color: Colors.grey.shade300,
          width: 1,
        ),
      );

  static BoxDecoration get statusBadge => BoxDecoration(
        borderRadius: BorderRadius.circular(AppSpacing.borderRadiusSmall),
      );

  static BoxDecoration rounded({
    double radius = AppSpacing.borderRadiusMedium,
    Color? color,
    Color? borderColor,
    List<BoxShadow>? shadows,
  }) {
    return BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(radius),
      border: borderColor != null
          ? Border.all(color: borderColor, width: 1)
          : null,
      boxShadow: shadows,
    );
  }

  static BoxDecoration get topRounded => BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(AppSpacing.borderRadiusXl),
          topRight: Radius.circular(AppSpacing.borderRadiusXl),
        ),
      );

  static BoxDecoration get shimmer => BoxDecoration(
        color: Colors.grey.shade300,
        borderRadius: BorderRadius.circular(AppSpacing.borderRadiusSmall),
      );
}
