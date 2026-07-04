import 'package:hakimi_shared/src/enums/visa_status.dart';

class TimelineEntry {
  final String id;
  final String type;
  final String label;
  final String description;
  final String? userId;
  final DateTime timestamp;
  final Map<String, dynamic>? metadata;

  const TimelineEntry({
    this.id = '',
    required this.type,
    required this.label,
    required this.description,
    this.userId,
    required this.timestamp,
    this.metadata,
  });

  factory TimelineEntry.fromJson(Map<String, dynamic> json) {
    return TimelineEntry(
      id: json['id'] as String? ?? '',
      type: json['type'] as String,
      label: json['label'] as String,
      description: json['description'] as String,
      userId: json['userId'] as String?,
      timestamp: DateTime.parse(json['timestamp'] as String),
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  factory TimelineEntry.fromPublicJson(Map<String, dynamic> json) {
    final oldStatus = VisaStatus.fromJson(json['oldStatus'] as String);
    final newStatus = VisaStatus.fromJson(json['newStatus'] as String);
    return TimelineEntry(
      type: 'status_change',
      label: newStatus.displayName,
      description: 'Statut mis à jour de "${oldStatus.displayName}" vers "${newStatus.displayName}"',
      timestamp: DateTime.parse(json['changedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'label': label,
      'description': description,
      'userId': userId,
      'timestamp': timestamp.toIso8601String(),
      'metadata': metadata,
    };
  }
}
