import 'package:hakimi_shared/src/enums/entry_type.dart';

class VisaDetailsModel {
  final String? id;
  final String? visaCaseId;
  final DateTime validFrom;
  final DateTime validUntil;
  final int durationDays;
  final EntryType entryType;
  final String? visaNumber;
  final String? notes;

  const VisaDetailsModel({
    this.id,
    this.visaCaseId,
    required this.validFrom,
    required this.validUntil,
    required this.durationDays,
    required this.entryType,
    this.visaNumber,
    this.notes,
  });

  factory VisaDetailsModel.fromJson(Map<String, dynamic> json) {
    return VisaDetailsModel(
      id: json['id'] as String?,
      visaCaseId: json['visaCaseId'] as String?,
      validFrom: DateTime.parse(json['validFrom'] as String),
      validUntil: DateTime.parse(json['validUntil'] as String),
      durationDays: json['durationDays'] as int,
      entryType: EntryType.fromJson(json['entryType'] as String),
      visaNumber: json['visaNumber'] as String?,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'visaCaseId': visaCaseId,
      'validFrom': validFrom.toIso8601String(),
      'validUntil': validUntil.toIso8601String(),
      'durationDays': durationDays,
      'entryType': entryType.toJson(),
      'visaNumber': visaNumber,
      'notes': notes,
    };
  }
}
