import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import 'service_providers.dart';

final appointmentsProvider =
    FutureProvider.family<List<AppointmentModel>, Map<String, dynamic>>(
  (ref, filters) async {
    final apiClient = ref.read(apiClientProvider);
    final response = await apiClient.get<List<AppointmentModel>>(
      ApiConstants.appointments,
      queryParameters: filters,
      fromJsonList: (list) => list
          .map((e) => AppointmentModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
    return response.data ?? [];
  },
);

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
    final response = await apiClient.put<AppointmentModel>(
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
