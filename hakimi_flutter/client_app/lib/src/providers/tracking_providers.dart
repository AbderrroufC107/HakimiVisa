import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import 'package:hakimi_core/core.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient.instance);

final trackedPhoneProvider = StateProvider<String>((ref) => '');

final trackedReferenceProvider = StateProvider<String>((ref) => '');

/// A passport number carries letters or is short; a phone is digits, often
/// with a leading 0 or +. Guessing right means one request instead of a
/// failing passport lookup followed by the real one.
List<String> _lookupOrder(String query) {
  final digitsOnly = RegExp(r'^[+0-9\s-]+$').hasMatch(query);
  final looksLikePhone = digitsOnly && query.replaceAll(RegExp(r'[^0-9]'), '').length >= 9;
  return looksLikePhone ? ['phone', 'passport'] : ['passport', 'phone'];
}

final trackingSearchProvider = FutureProvider.autoDispose
    .family<TrackingQueryResult, ({String query, String reference})>((ref, params) async {
  final apiClient = ref.read(apiClientProvider);
  final query = params.query.trim();

  Object? lastError;
  for (final key in _lookupOrder(query)) {
    try {
      final response = await apiClient.get(
        ApiConstants.publicTracking,
        queryParameters: {
          key: query,
          if (params.reference.isNotEmpty) 'reference': params.reference,
        },
        fromJsonT: (json) => TrackingQueryResult.fromJson(json),
      );
      if (response.data != null) {
        // Hold the result so moving to the results screen reuses it instead
        // of dropping the provider and running the whole search again.
        ref.keepAlive();
        return response.data!;
      }
    } catch (e) {
      lastError = e;
    }
  }
  if (lastError != null) {
    throw ApiException(
      message: 'Aucun dossier trouvé avec ces informations',
    );
  }
  throw const ApiException(message: 'Aucun résultat trouvé');
});

final trackingCaseDetailProvider =
    FutureProvider.autoDispose.family<VisaCaseModel, String>(
        (ref, caseNumber) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get(
    ApiConstants.publicTrackingByCase(caseNumber),
    fromJsonT: (json) => VisaCaseModel.fromJson(json),
  );
  if (response.data == null) {
    throw const ApiException(message: 'Dossier introuvable');
  }
  return response.data!;
});

final trackingTimelineProvider =
    FutureProvider.autoDispose.family<List<TimelineEntry>, String>(
        (ref, caseNumber) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get(
    ApiConstants.publicTimeline(caseNumber),
    fromJsonList: (list) => list
        .map((e) => TimelineEntry.fromPublicJson(e as Map<String, dynamic>))
        .toList(),
  );
  return response.data ?? [];
});

final trackingAppointmentsProvider =
    FutureProvider.autoDispose.family<List<AppointmentModel>, String>(
        (ref, caseNumber) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get(
    ApiConstants.publicAppointments(caseNumber),
    fromJsonList: (list) => list
        .map((e) => AppointmentModel.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
  return response.data ?? [];
});

final trackingDocumentsProvider =
    FutureProvider.autoDispose.family<List<DocumentModel>, String>(
        (ref, caseNumber) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get(
    ApiConstants.publicDocuments(caseNumber),
    fromJsonList: (list) => list
        .map((e) => DocumentModel.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
  return response.data ?? [];
});

final clientNotificationsProvider =
    FutureProvider.autoDispose.family<List<Map<String, dynamic>>, String>(
        (ref, caseNumber) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get(
    ApiConstants.publicNotifications(caseNumber),
    fromJsonList: (list) => list
        .map((e) => e as Map<String, dynamic>)
        .toList(),
  );
  return response.data ?? [];
});

final clientAppointmentsProvider =
    FutureProvider.autoDispose.family<List<AppointmentModel>, String>(
        (ref, phone) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get(
    '${ApiConstants.publicTracking}/appointments',
    queryParameters: {'phone': phone},
    fromJsonList: (list) => list
        .map((e) => AppointmentModel.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
  return response.data ?? [];
});

final clientDocumentsProvider =
    FutureProvider.autoDispose.family<List<DocumentModel>, String>(
        (ref, phone) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get(
    '${ApiConstants.publicTracking}/documents',
    queryParameters: {'phone': phone},
    fromJsonList: (list) => list
        .map((e) => DocumentModel.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
  return response.data ?? [];
});

final phoneNotificationsProvider =
    FutureProvider.autoDispose.family<List<NotificationModel>, String>(
        (ref, phone) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get(
    '${ApiConstants.publicTracking}/notifications',
    queryParameters: {'phone': phone},
    fromJsonList: (list) => list
        .map((e) => NotificationModel.fromPublicJson(e as Map<String, dynamic>))
        .toList(),
  );
  return response.data ?? [];
});
