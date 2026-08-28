import 'package:hakimi_shared/src/enums/visa_status.dart';
import 'package:hakimi_shared/src/models/status_history_model.dart';

class VisaCaseModel {
  final String? id;
  final String caseNumber;
  final String? clientId;
  final dynamic client;
  final String visaCountry;
  final String visaType;
  final VisaStatus currentStatus;
  final bool archived;
  final DateTime openingDate;
  final DateTime? updatedAt;
  final String? notes;
  final DateTime? createdAt;
  final List<StatusHistoryModel>? statusHistories;
  final dynamic appointments;
  final double? price;
  final bool isPaid;

  /// Name of the partner agency that filed this case; null when the desk did.
  final String? submittedByAgencyName;

  const VisaCaseModel({
    this.id,
    required this.caseNumber,
    this.clientId,
    this.client,
    required this.visaCountry,
    required this.visaType,
    required this.currentStatus,
    this.archived = false,
    required this.openingDate,
    this.updatedAt,
    this.notes,
    this.createdAt,
    this.statusHistories,
    this.appointments,
    this.submittedByAgencyName,
    this.price,
    this.isPaid = false,
  });

  factory VisaCaseModel.fromJson(Map<String, dynamic> json) {
    return VisaCaseModel(
      id: json['id'] as String?,
      caseNumber: json['caseNumber'] as String,
      clientId: json['clientId'] as String?,
      client: json['client'],
      visaCountry: json['visaCountry'] as String? ?? '',
      visaType: json['visaType'] as String? ?? '',
      currentStatus: json['currentStatus'] != null
          ? VisaStatus.fromJson(json['currentStatus'] as String)
          : VisaStatus.enAttente,
      archived: json['archived'] as bool? ?? false,
      openingDate: json['openingDate'] != null
          ? DateTime.parse(json['openingDate'] as String)
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt'] as String) : null,
      notes: json['notes'] as String?,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'] as String) : null,
      statusHistories: (json['statusHistories'] as List<dynamic>?)
          ?.map((e) => StatusHistoryModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      appointments: json['appointments'],
      price: json['price'] != null
          ? (json['price'] as num).toDouble()
          : null,
      isPaid: json['isPaid'] as bool? ?? false,
      submittedByAgencyName:
          (json['submittedByAgency'] as Map<String, dynamic>?)?['name'] as String?,
    );
  }

  /// The client's name when the API sent one alongside the case. A phone
  /// number can be shared by a family, so a file has to say whose it is
  /// rather than borrowing the name at the top of the list.
  String? get clientName {
    final raw = client;
    if (raw is Map && raw['fullName'] is String) return raw['fullName'] as String;
    return null;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'caseNumber': caseNumber,
      'clientId': clientId,
      'client': client?.toJson(),
      'visaCountry': visaCountry,
      'visaType': visaType,
      'currentStatus': currentStatus.toJson(),
      'archived': archived,
      'openingDate': openingDate.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'notes': notes,
      'createdAt': createdAt?.toIso8601String(),
      'statusHistories': statusHistories?.map((e) => e.toJson()).toList(),
      'appointments': appointments?.map((e) => e.toJson()).toList(),
      'price': price,
      'isPaid': isPaid,
      'submittedByAgency':
          submittedByAgencyName == null ? null : {'name': submittedByAgencyName},
    };
  }
}
