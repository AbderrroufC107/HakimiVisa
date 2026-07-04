import 'package:hakimi_shared/src/models/visa_case_model.dart';

class ClientModel {
  final String id;
  final String fullName;
  final String phoneNumber;
  final String? whatsappNumber;
  final String? email;
  final String passportNumber;
  final String nationality;
  final String? notes;
  final DateTime createdAt;
  final List<VisaCaseModel>? visaCases;

  const ClientModel({
    required this.id,
    required this.fullName,
    required this.phoneNumber,
    this.whatsappNumber,
    this.email,
    required this.passportNumber,
    required this.nationality,
    this.notes,
    required this.createdAt,
    this.visaCases,
  });

  factory ClientModel.fromJson(Map<String, dynamic> json) {
    return ClientModel(
      id: json['id'] as String,
      fullName: (json['full_name'] ?? json['fullName']) as String,
      phoneNumber: (json['phone_number'] ?? json['phoneNumber']) as String,
      whatsappNumber: (json['whatsapp_number'] ?? json['whatsappNumber']) as String?,
      email: json['email'] as String?,
      passportNumber: (json['passport_number'] ?? json['passportNumber'] ?? '') as String,
      nationality: json['nationality'] as String,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse((json['created_at'] ?? json['createdAt']) as String),
      visaCases: ((json['visa_cases'] ?? json['visaCases']) as List<dynamic>?)
          ?.map((e) => VisaCaseModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'full_name': fullName,
      'phone_number': phoneNumber,
      'whatsapp_number': whatsappNumber,
      'email': email,
      'passport_number': passportNumber,
      'nationality': nationality,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'visa_cases': visaCases?.map((e) => e.toJson()).toList(),
    };
  }
}
