import 'package:intl/intl.dart';

extension DateTimeExtensions on DateTime {
  String formatDate({String pattern = 'dd/MM/yyyy'}) {
    return DateFormat(pattern).format(this);
  }

  String formatTime({String pattern = 'HH:mm'}) {
    return DateFormat(pattern).format(this);
  }

  String formatRelative() {
    final now = DateTime.now();
    final diff = now.difference(this);

    if (diff.inSeconds < 60) {
      return "À l'instant";
    } else if (diff.inMinutes < 60) {
      final m = diff.inMinutes;
      return 'Il y a $m ${m == 1 ? 'minute' : 'minutes'}';
    } else if (diff.inHours < 24) {
      final h = diff.inHours;
      return 'Il y a $h ${h == 1 ? 'heure' : 'heures'}';
    } else if (diff.inDays < 7) {
      final d = diff.inDays;
      return 'Il y a $d ${d == 1 ? 'jour' : 'jours'}';
    } else if (diff.inDays < 30) {
      final w = diff.inDays ~/ 7;
      return 'Il y a $w ${w == 1 ? 'semaine' : 'semaines'}';
    } else {
      return formatDate();
    }
  }

  bool get isToday {
    final now = DateTime.now();
    return year == now.year && month == now.month && day == now.day;
  }

  bool get isPast {
    return isBefore(DateTime.now());
  }

  int dayDifference(DateTime other) {
    final a = DateTime(year, month, day);
    final b = DateTime(other.year, other.month, other.day);
    return b.difference(a).inDays.abs();
  }
}
