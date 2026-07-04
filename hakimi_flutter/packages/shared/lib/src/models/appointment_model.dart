import 'package:hakimi_shared/src/enums/appointment_type.dart';
import 'package:hakimi_shared/src/models/user_model.dart';
import 'package:hakimi_shared/src/models/visa_case_model.dart';

class AppointmentModel {
  final String? id;
  final String? visaCaseId;
  final VisaCaseModel? visaCase;
  final DateTime appointmentDate;
  final String appointmentTime;
  final String appointmentCenter;
  final AppointmentType appointmentType;
  final String? notes;
  final String? userId;
  final UserModel? user;

  const AppointmentModel({
    this.id,
    this.visaCaseId,
    this.visaCase,
    required this.appointmentDate,
    required this.appointmentTime,
    required this.appointmentCenter,
    required this.appointmentType,
    this.notes,
    this.userId,
    this.user,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      id: json['id'] as String?,
      visaCaseId: json['visaCaseId'] as String?,
      visaCase: json['visaCase'] != null
          ? VisaCaseModel.fromJson(
              json['visaCase'] as Map<String, dynamic>)
          : null,
      appointmentDate: DateTime.parse(json['appointmentDate'] as String),
      appointmentTime: json['appointmentTime'] as String,
      appointmentCenter: json['appointmentCenter'] as String,
      appointmentType:
          AppointmentType.fromJson(json['appointmentType'] as String),
      notes: json['notes'] as String?,
      userId: json['userId'] as String?,
      user: json['user'] != null
          ? UserModel.fromJson(json['user'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'visaCaseId': visaCaseId,
      'visaCase': visaCase?.toJson(),
      'appointmentDate': appointmentDate.toIso8601String(),
      'appointmentTime': appointmentTime,
      'appointmentCenter': appointmentCenter,
      'appointmentType': appointmentType.toJson(),
      'notes': notes,
      'userId': userId,
      'user': user?.toJson(),
    };
  }
}
