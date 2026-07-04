import 'package:hakimi_shared/src/enums/user_role.dart';

class UserModel {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final UserRole role;
  final bool isActive;
  final DateTime createdAt;

  const UserModel({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.isActive = true,
    required this.createdAt,
  });

  String get fullName => '$firstName $lastName';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: (json['first_name'] ?? json['firstName']) as String,
      lastName: (json['last_name'] ?? json['lastName']) as String,
      role: UserRole.fromJson(json['role'] as String),
      isActive: (json['is_active'] ?? json['isActive']) as bool? ?? true,
      createdAt: DateTime.parse(
        (json['created_at'] ?? json['createdAt'] ?? DateTime.now().toIso8601String()) as String,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'first_name': firstName,
      'last_name': lastName,
      'role': role.toJson(),
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
