import 'package:flutter/material.dart';

enum VisaStatus {
  enAttente,
  enTraitement,
  rdvOk,
  visaOk,
  visaRefusee;

  String get displayName {
    switch (this) {
      case VisaStatus.enAttente:
        return 'En attente';
      case VisaStatus.enTraitement:
        return 'En traitement';
      case VisaStatus.rdvOk:
        return 'RDV OK';
      case VisaStatus.visaOk:
        return 'Visa OK';
      case VisaStatus.visaRefusee:
        return 'Visa refusée';
    }
  }

  Color get color {
    switch (this) {
      case VisaStatus.enAttente:
        return const Color(0xFFF59E0B);
      case VisaStatus.enTraitement:
        return const Color(0xFF3B82F6);
      case VisaStatus.rdvOk:
        return const Color(0xFF8B5CF6);
      case VisaStatus.visaOk:
        return const Color(0xFF10B981);
      case VisaStatus.visaRefusee:
        return const Color(0xFFEF4444);
    }
  }

  String toJson() => name;

  static VisaStatus fromJson(String json) {
    final normalized = json.toLowerCase().replaceAll('_', '');
    return VisaStatus.values.firstWhere(
      (e) => e.name.toLowerCase() == normalized,
      orElse: () => VisaStatus.enAttente,
    );
  }
}
