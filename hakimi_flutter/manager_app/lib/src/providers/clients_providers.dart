import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import 'service_providers.dart';

final clientsProvider = FutureProvider.family<List<ClientModel>, String?>(
  (ref, searchQuery) async {
    final apiClient = ref.read(apiClientProvider);
    final params = <String, dynamic>{};
    if (searchQuery != null && searchQuery.isNotEmpty) {
      params['search'] = searchQuery;
    }
    final response = await apiClient.get<List<ClientModel>>(
      ApiConstants.clients,
      queryParameters: params,
      fromJsonList: (list) => list
          .map((e) => ClientModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
    return response.data ?? [];
  },
);

final clientDetailProvider = FutureProvider.family<ClientModel?, String>(
  (ref, clientId) async {
    final apiClient = ref.read(apiClientProvider);
    final response = await apiClient.get<ClientModel>(
      ApiConstants.clientById(clientId),
      fromJsonT: (json) => ClientModel.fromJson(json),
    );
    return response.data;
  },
);

final clientTimelineProvider = FutureProvider.family<List<TimelineEntry>, String>(
  (ref, clientId) async {
    final apiClient = ref.read(apiClientProvider);
    final response = await apiClient.get<List<TimelineEntry>>(
      ApiConstants.clientTimeline(clientId),
      fromJsonList: (list) => list
          .map((e) => TimelineEntry.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
    return response.data ?? [];
  },
);

final dashboardStatsProvider = FutureProvider<DashboardStats>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get<DashboardStats>(
    ApiConstants.clientDashboard,
    fromJsonT: (json) => DashboardStats.fromJson(json),
  );
  return response.data ?? const DashboardStats();
});

final analyticsProvider = FutureProvider<Analytics>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get<Analytics>(
    ApiConstants.clientAnalytics,
    fromJsonT: (json) => Analytics.fromJson(json),
  );
  return response.data ?? const Analytics();
});

final createClientProvider = FutureProvider.family<ClientModel?, Map<String, dynamic>>(
  (ref, data) async {
    final apiClient = ref.read(apiClientProvider);
    final response = await apiClient.post<ClientModel>(
      ApiConstants.clients,
      data: data,
      fromJsonT: (json) => ClientModel.fromJson(json),
    );
    return response.data;
  },
);

final updateClientProvider = FutureProvider.family<ClientModel?, ({String id, Map<String, dynamic> data})>(
  (ref, params) async {
    final apiClient = ref.read(apiClientProvider);
    final response = await apiClient.put<ClientModel>(
      ApiConstants.clientUpdate(params.id),
      data: params.data,
      fromJsonT: (json) => ClientModel.fromJson(json),
    );
    return response.data;
  },
);
