import 'package:hakimi_shared/src/models/kanban_card_model.dart';

class KanbanColumn {
  final String id;
  final String title;
  final String color;
  final List<KanbanCardModel> cards;
  final int count;

  const KanbanColumn({
    required this.id,
    required this.title,
    required this.color,
    required this.cards,
    required this.count,
  });

  factory KanbanColumn.fromJson(Map<String, dynamic> json) {
    return KanbanColumn(
      id: json['id'] as String,
      title: json['title'] as String,
      color: json['color'] as String,
      cards: (json['cards'] as List<dynamic>?)
              ?.map((e) => KanbanCardModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      count: json['count'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'color': color,
      'cards': cards.map((e) => e.toJson()).toList(),
      'count': count,
    };
  }
}
