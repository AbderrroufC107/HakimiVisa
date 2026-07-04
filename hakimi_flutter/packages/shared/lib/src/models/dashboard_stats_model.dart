class DashboardStats {
  final int totalClients;
  final int totalCases;
  final int enAttente;
  final int enTraitement;
  final int rdvOk;
  final int visaOk;
  final int refuse;

  const DashboardStats({
    this.totalClients = 0,
    this.totalCases = 0,
    this.enAttente = 0,
    this.enTraitement = 0,
    this.rdvOk = 0,
    this.visaOk = 0,
    this.refuse = 0,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalClients: (json['total_clients'] ?? json['totalClients']) as int? ?? 0,
      totalCases: (json['total_cases'] ?? json['totalCases']) as int? ?? 0,
      enAttente: (json['en_attente'] ?? json['enAttente']) as int? ?? 0,
      enTraitement: (json['en_traitement'] ?? json['enTraitement']) as int? ?? 0,
      rdvOk: (json['rdv_ok'] ?? json['rdvOk']) as int? ?? 0,
      visaOk: (json['visa_ok'] ?? json['visaOk']) as int? ?? 0,
      refuse: json['refuse'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'total_clients': totalClients,
      'total_cases': totalCases,
      'en_attente': enAttente,
      'en_traitement': enTraitement,
      'rdv_ok': rdvOk,
      'visa_ok': visaOk,
      'refuse': refuse,
    };
  }
}
