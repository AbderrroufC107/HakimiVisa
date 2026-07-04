enum AppointmentType {
  tls,
  vfs,
  embassy,
  biometrics,
  interview,
  other;

  String get displayName {
    switch (this) {
      case AppointmentType.tls:
        return 'TLScontact';
      case AppointmentType.vfs:
        return 'VFS Global';
      case AppointmentType.embassy:
        return 'Ambassade';
      case AppointmentType.biometrics:
        return 'Données biométriques';
      case AppointmentType.interview:
        return 'Entretien';
      case AppointmentType.other:
        return 'Autre';
    }
  }

  String toJson() => name;

  static AppointmentType fromJson(String json) {
    final normalized = json.toLowerCase().replaceAll('_', '');
    return AppointmentType.values.firstWhere(
      (e) => e.name.toLowerCase() == normalized,
      orElse: () => AppointmentType.other,
    );
  }
}
