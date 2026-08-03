import 'package:flutter/material.dart';

enum VisaStatus {
  enAttente,
  dossierIncomplet,
  enTraitement,
  rdvOk,
  visaOk,
  visaRefusee,
  livree;

  String get displayName {
    switch (this) {
      case VisaStatus.enAttente:
        return 'En attente';
      case VisaStatus.dossierIncomplet:
        return 'Dossier incomplet';
      case VisaStatus.enTraitement:
        return 'En traitement';
      case VisaStatus.rdvOk:
        return 'RDV OK';
      case VisaStatus.visaOk:
        return 'Visa OK';
      case VisaStatus.visaRefusee:
        return 'Visa refusée';
      case VisaStatus.livree:
        return 'Livrée';
    }
  }

  Color get color {
    switch (this) {
      case VisaStatus.enAttente:
        return const Color(0xFFF59E0B);
      case VisaStatus.dossierIncomplet:
        return const Color(0xFFF97316);
      case VisaStatus.enTraitement:
        return const Color(0xFF3B82F6);
      case VisaStatus.rdvOk:
        return const Color(0xFF8B5CF6);
      case VisaStatus.visaOk:
        return const Color(0xFF10B981);
      case VisaStatus.visaRefusee:
        return const Color(0xFFEF4444);
      case VisaStatus.livree:
        return const Color(0xFF22C55E);
    }
  }

  String toJson() {
    switch (this) {
      case VisaStatus.enAttente:
        return 'EN_ATTENTE';
      case VisaStatus.dossierIncomplet:
        return 'DOSSIER_INCOMPLET';
      case VisaStatus.enTraitement:
        return 'EN_TRAITEMENT';
      case VisaStatus.rdvOk:
        return 'RDV_OK';
      case VisaStatus.visaOk:
        return 'VISA_OK';
      case VisaStatus.visaRefusee:
        return 'VISA_REFUSEE';
      case VisaStatus.livree:
        return 'LIVREE';
    }
  }

  static VisaStatus fromJson(String json) {
    final normalized = json.toLowerCase().replaceAll('_', '');
    return VisaStatus.values.firstWhere(
      (e) => e.name.toLowerCase() == normalized,
      orElse: () => VisaStatus.enAttente,
    );
  }
}
