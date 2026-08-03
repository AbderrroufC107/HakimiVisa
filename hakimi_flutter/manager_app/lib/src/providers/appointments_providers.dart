import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import 'service_providers.dart';

final appointmentsProvider = FutureProvider.family<
    List<AppointmentModel>,
    ({DateTime? dateFrom, DateTime? dateTo})>((ref, filters) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get<List<AppointmentModel>>(
    ApiConstants.appointments,
    queryParameters: {
      if (filters.dateFrom != null)
        'dateFrom': filters.dateFrom!.toIso8601String(),
      if (filters.dateTo != null)
        'dateTo': filters.dateTo!.toIso8601String(),
    },
    fromJsonList: (list) => list
        .map((e) => AppointmentModel.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
  return response.data ?? [];
});

final createAppointmentProvider =
    FutureProvider.family<AppointmentModel?, Map<String, dynamic>>(
  (ref, data) async {
    final apiClient = ref.read(apiClientProvider);
    final response = await apiClient.post<AppointmentModel>(
      ApiConstants.appointments,
      data: data,
      fromJsonT: (json) => AppointmentModel.fromJson(json),
    );
    return response.data;
  },
);

final updateAppointmentProvider =
    FutureProvider.family<AppointmentModel?, ({String id, Map<String, dynamic> data})>(
  (ref, params) async {
    final apiClient = ref.read(apiClientProvider);
    final response = await apiClient.patch<AppointmentModel>(
      ApiConstants.appointmentUpdate(params.id),
      data: params.data,
      fromJsonT: (json) => AppointmentModel.fromJson(json),
    );
    return response.data;
  },
);

final deleteAppointmentProvider =
    FutureProvider.family<bool, String>(
  (ref, id) async {
    final apiClient = ref.read(apiClientProvider);
    await apiClient.delete(ApiConstants.appointmentDelete(id));
    return true;
  },
);
