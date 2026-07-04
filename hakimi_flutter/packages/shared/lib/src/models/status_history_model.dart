import 'package:hakimi_shared/src/enums/visa_status.dart';

class StatusHistoryModel {
  final String? id;
  final String? visaCaseId;
  final VisaStatus oldStatus;
  final VisaStatus newStatus;
  final String? changedBy;
  final DateTime changedAt;

  const StatusHistoryModel({
    this.id,
    this.visaCaseId,
    required this.oldStatus,
    required this.newStatus,
    this.changedBy,
    required this.changedAt,
  });

  factory StatusHistoryModel.fromJson(Map<String, dynamic> json) {
    return StatusHistoryModel(
      id: json['id'] as String?,
      visaCaseId: json['visaCaseId'] as String?,
      oldStatus: VisaStatus.fromJson(json['oldStatus'] as String),
      newStatus: VisaStatus.fromJson(json['newStatus'] as String),
      changedBy: json['changedBy'] as String?,
      changedAt: DateTime.parse(json['changedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'visaCaseId': visaCaseId,
      'oldStatus': oldStatus.toJson(),
      'newStatus': newStatus.toJson(),
      'changedBy': changedBy,
      'changedAt': changedAt.toIso8601String(),
    };
  }
}
