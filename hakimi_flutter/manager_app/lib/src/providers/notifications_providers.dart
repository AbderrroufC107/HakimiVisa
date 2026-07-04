import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import 'service_providers.dart';

final notificationsProvider = FutureProvider<List<NotificationModel>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get<List<NotificationModel>>(
    ApiConstants.notifications,
    fromJsonList: (list) => list
        .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
  return response.data ?? [];
});

final unreadCountProvider = FutureProvider<int>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get<int>(
    ApiConstants.notificationsUnreadCount,
  );
  return response.data ?? 0;
});

final markNotificationReadProvider =
    FutureProvider.family<bool, String>(
  (ref, id) async {
    final apiClient = ref.read(apiClientProvider);
    await apiClient.patch(ApiConstants.notificationRead(id));
    return true;
  },
);

final markAllNotificationsReadProvider = FutureProvider<bool>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  await apiClient.post(ApiConstants.notificationsReadAll);
  return true;
});
