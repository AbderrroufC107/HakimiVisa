import 'package:flutter/material.dart';

enum NotificationType {
  info,
  warning,
  error,
  success,
  visaExpiring,
  appointmentReminder,
  statusChange,
  system;

  IconData get icon {
    switch (this) {
      case NotificationType.info:
        return Icons.info_outline;
      case NotificationType.warning:
        return Icons.warning_amber_rounded;
      case NotificationType.error:
        return Icons.error_outline;
      case NotificationType.success:
        return Icons.check_circle_outline;
      case NotificationType.visaExpiring:
        return Icons.timer_outlined;
      case NotificationType.appointmentReminder:
        return Icons.calendar_today;
      case NotificationType.statusChange:
        return Icons.swap_horiz;
      case NotificationType.system:
        return Icons.settings;
    }
  }

  Color get color {
    switch (this) {
      case NotificationType.info:
        return const Color(0xFF3B82F6);
      case NotificationType.warning:
        return const Color(0xFFF59E0B);
      case NotificationType.error:
        return const Color(0xFFEF4444);
      case NotificationType.success:
        return const Color(0xFF10B981);
      case NotificationType.visaExpiring:
        return const Color(0xFF8B5CF6);
      case NotificationType.appointmentReminder:
        return const Color(0xFF06B6D4);
      case NotificationType.statusChange:
        return const Color(0xFFF97316);
      case NotificationType.system:
        return const Color(0xFF6B7280);
    }
  }

  String toJson() => name;

  static NotificationType fromJson(String json) {
    final normalized = json.toLowerCase().replaceAll('_', '');
    return NotificationType.values.firstWhere(
      (e) => e.name.toLowerCase() == normalized,
      orElse: () => NotificationType.info,
    );
  }
}
