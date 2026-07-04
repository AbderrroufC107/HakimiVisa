import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import 'service_providers.dart';

final visaCasesProvider =
    FutureProvider.family<List<VisaCaseModel>, Map<String, dynamic>>(
  (ref, filters) async {
    final apiClient = ref.read(apiClientProvider);
    final response = await apiClient.get<List<VisaCaseModel>>(
      ApiConstants.visaCases,
      queryParameters: filters,
      fromJsonList: (list) => list
          .map((e) => VisaCaseModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
    return response.data ?? [];
  },
);

final visaCaseDetailProvider = FutureProvider.family<VisaCaseModel?, String>(
  (ref, caseId) async {
    final apiClient = ref.read(apiClientProvider);
    final response = await apiClient.get<VisaCaseModel>(
      ApiConstants.visaCaseById(caseId),
      fromJsonT: (json) => VisaCaseModel.fromJson(json),
    );
    return response.data;
  },
);

final updateVisaCaseStatusProvider =
    FutureProvider.family<VisaCaseModel?, ({String id, VisaStatus status})>(
  (ref, params) async {
    final apiClient = ref.read(apiClientProvider);
    final response = await apiClient.patch<VisaCaseModel>(
      '${ApiConstants.visaCaseStatus}/${params.id}',
      data: {'current_status': params.status.toJson()},
      fromJsonT: (json) => VisaCaseModel.fromJson(json),
    );
    return response.data;
  },
);

final createVisaCaseProvider =
    FutureProvider.family<VisaCaseModel?, Map<String, dynamic>>(
  (ref, data) async {
    final apiClient = ref.read(apiClientProvider);
    final response = await apiClient.post<VisaCaseModel>(
      ApiConstants.visaCases,
      data: data,
      fromJsonT: (json) => VisaCaseModel.fromJson(json),
    );
    return response.data;
  },
);
