import 'package:flutter/material.dart';

enum VisaStatus {
  enAttente,
  dossierIncomplet,
  enTraitement,
  rdvOk,
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
      case VisaStatus.livree:
        return 'Livree';
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
