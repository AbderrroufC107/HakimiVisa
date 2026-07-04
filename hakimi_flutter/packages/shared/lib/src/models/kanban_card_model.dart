import 'package:hakimi_shared/src/enums/visa_status.dart';

class KanbanCardModel {
  final String id;
  final String caseNumber;
  final String clientName;
  final String visaCountry;
  final String visaType;
  final VisaStatus status;
  final DateTime createdAt;

  const KanbanCardModel({
    required this.id,
    required this.caseNumber,
    required this.clientName,
    required this.visaCountry,
    required this.visaType,
    required this.status,
    required this.createdAt,
  });

  factory KanbanCardModel.fromJson(Map<String, dynamic> json) {
    final client = json['client'] as Map<String, dynamic>?;
    return KanbanCardModel(
      id: json['id'] as String,
      caseNumber: (json['case_number'] ?? json['caseNumber']) as String,
      clientName: (json['client_name'] ?? client?['fullName'] ?? '') as String,
      visaCountry: (json['visa_country'] ?? json['visaCountry']) as String,
      visaType: (json['visa_type'] ?? json['visaType']) as String,
      status: VisaStatus.fromJson((json['status'] ?? json['currentStatus']) as String),
      createdAt: DateTime.parse((json['created_at'] ?? json['createdAt']) as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'case_number': caseNumber,
      'client_name': clientName,
      'visa_country': visaCountry,
      'visa_type': visaType,
      'status': status.toJson(),
      'created_at': createdAt.toIso8601String(),
    };
  }
}
