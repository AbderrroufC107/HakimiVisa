import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import 'service_providers.dart';

final kanbanColumnsProvider = FutureProvider<List<KanbanColumn>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get<List<KanbanColumn>>(
    ApiConstants.kanbanList,
    fromJsonList: (list) => list
        .map((e) => KanbanColumn.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
  return response.data ?? [];
});

final moveKanbanCardProvider =
    FutureProvider.family<bool, ({String caseId, String newStatus})>(
  (ref, params) async {
    final apiClient = ref.read(apiClientProvider);
    await apiClient.patch(
      '${ApiConstants.visaCases}/${params.caseId}/status',
      data: {'status': params.newStatus},
    );
    return true;
  },
);
