import 'package:hakimi_shared/src/enums/visa_status.dart';

class StatusHistoryModel {
  final String? id;
  final String? visaCaseId;
  final VisaStatus oldStatus;
  final VisaStatus newStatus;
  final String? changedBy;

  /// Who made the change, in words. The API sends the person alongside the id;
  /// showing the id is no answer to "who moved this dossier".
  final String? changedByName;
  final DateTime changedAt;

  const StatusHistoryModel({
    this.id,
    this.visaCaseId,
    required this.oldStatus,
    required this.newStatus,
    this.changedBy,
    this.changedByName,
    required this.changedAt,
  });

  factory StatusHistoryModel.fromJson(Map<String, dynamic> json) {
    final changer = json['changer'] as Map<String, dynamic>?;
    final name = changer == null
        ? null
        : [changer['firstName'], changer['lastName']]
            .whereType<String>()
            .where((part) => part.isNotEmpty)
            .join(' ');

    return StatusHistoryModel(
      id: json['id'] as String?,
      visaCaseId: json['visaCaseId'] as String?,
      oldStatus: VisaStatus.fromJson(json['oldStatus'] as String),
      newStatus: VisaStatus.fromJson(json['newStatus'] as String),
      changedBy: json['changedBy'] as String?,
      changedByName: (name == null || name.isEmpty) ? null : name,
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
      'changedByName': changedByName,
      'changedAt': changedAt.toIso8601String(),
    };
  }
}
