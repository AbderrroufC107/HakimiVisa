import 'package:hakimi_shared/src/enums/notification_type.dart';

class NotificationModel {
  final String id;
  final NotificationType type;
  final String title;
  final String message;
  final bool read;
  final String userId;
  final String? link;
  final DateTime createdAt;

  const NotificationModel({
    this.id = '',
    required this.type,
    required this.title,
    required this.message,
    this.read = false,
    this.userId = '',
    this.link,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] as String? ?? '',
      type: NotificationType.fromJson(json['type'] as String),
      title: json['title'] as String,
      message: json['message'] as String,
      read: json['read'] as bool? ?? false,
      userId: json['userId'] as String? ?? '',
      link: json['link'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  factory NotificationModel.fromPublicJson(Map<String, dynamic> json) {
    return NotificationModel(
      type: NotificationType.fromJson(json['type'] as String),
      title: json['title'] as String,
      message: json['message'] as String,
      read: json['read'] as bool? ?? true,
      createdAt: DateTime.parse(json['date'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.toJson(),
      'title': title,
      'message': message,
      'read': read,
      'userId': userId,
      'link': link,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
