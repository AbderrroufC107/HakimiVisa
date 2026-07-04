class TrackingQueryResult {
  final String clientName;
  final List<Map<String, dynamic>> cases;
  final int total;

  const TrackingQueryResult({
    required this.clientName,
    this.cases = const [],
    this.total = 0,
  });

  factory TrackingQueryResult.fromJson(Map<String, dynamic> json) {
    return TrackingQueryResult(
      clientName: json['clientName'] as String,
      cases: (json['cases'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [],
      total: json['total'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'client_name': clientName,
      'cases': cases,
      'total': total,
    };
  }
}
