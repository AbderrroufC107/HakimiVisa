class Analytics {
  final List<Map<String, dynamic>> applicationsPerMonth;
  final List<Map<String, dynamic>> topCountries;
  final List<Map<String, dynamic>> statusDistribution;
  final double approvalRate;

  const Analytics({
    this.applicationsPerMonth = const [],
    this.topCountries = const [],
    this.statusDistribution = const [],
    this.approvalRate = 0.0,
  });

  factory Analytics.fromJson(Map<String, dynamic> json) {
    return Analytics(
      applicationsPerMonth: ((json['applications_per_month'] ?? json['applicationsPerMonth']) as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [],
      topCountries: ((json['top_countries'] ?? json['topCountries']) as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [],
      statusDistribution: ((json['status_distribution'] ?? json['statusDistribution']) as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [],
      approvalRate: ((json['approval_rate'] ?? json['approvalRate']) as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'applications_per_month': applicationsPerMonth,
      'top_countries': topCountries,
      'status_distribution': statusDistribution,
      'approval_rate': approvalRate,
    };
  }
}
