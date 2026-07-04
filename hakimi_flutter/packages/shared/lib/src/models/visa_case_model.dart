import 'package:hakimi_shared/src/enums/visa_status.dart';
import 'package:hakimi_shared/src/models/status_history_model.dart';
import 'package:hakimi_shared/src/models/visa_details_model.dart';

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
  final VisaDetailsModel? visaDetails;

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
    this.visaDetails,
  });

  factory VisaCaseModel.fromJson(Map<String, dynamic> json) {
    return VisaCaseModel(
      id: json['id'] as String?,
      caseNumber: json['caseNumber'] as String,
      clientId: json['clientId'] as String?,
      client: json['client'],
      visaCountry: json['visaCountry'] as String,
      visaType: json['visaType'] as String,
      currentStatus: VisaStatus.fromJson(json['currentStatus'] as String),
      archived: json['archived'] as bool? ?? false,
      openingDate: DateTime.parse(json['openingDate'] as String),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt'] as String) : null,
      notes: json['notes'] as String?,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'] as String) : null,
      statusHistories: (json['statusHistories'] as List<dynamic>?)
          ?.map((e) => StatusHistoryModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      appointments: json['appointments'],
      visaDetails: json['visaDetails'] != null
          ? VisaDetailsModel.fromJson(
              json['visaDetails'] as Map<String, dynamic>)
          : null,
    );
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
      'visaDetails': visaDetails?.toJson(),
    };
  }
}
