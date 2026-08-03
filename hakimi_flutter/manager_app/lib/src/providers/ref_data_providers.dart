import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import 'service_providers.dart';

/// The countries and visa types the agency already uses, offered as
/// suggestions so staff stop retyping (and misspelling) the same values.
final countriesProvider = FutureProvider<List<String>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get<List<String>>(
    ApiConstants.refCountries,
    fromJsonList: (list) => list
        .map((e) => ((e as Map<String, dynamic>)['name'] ?? '') as String)
        .where((name) => name.isNotEmpty)
        .toList(),
  );
  return response.data ?? [];
});

final visaTypesProvider = FutureProvider<List<String>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get<List<String>>(
    ApiConstants.refVisaTypes,
    fromJsonList: (list) => list
        .map((e) => ((e as Map<String, dynamic>)['name'] ?? '') as String)
        .where((name) => name.isNotEmpty)
        .toList(),
  );
  return response.data ?? [];
});

/// Adds a value the agency has never used before, so the next case can pick it
/// from the list instead of typing it again.
final addCountryProvider =
    FutureProvider.family<void, String>((ref, name) async {
  final apiClient = ref.read(apiClientProvider);
  await apiClient.post(ApiConstants.refCountries, data: {'name': name});
});

final addVisaTypeProvider =
    FutureProvider.family<void, String>((ref, name) async {
  final apiClient = ref.read(apiClientProvider);
  await apiClient.post(ApiConstants.refVisaTypes, data: {'name': name});
});
