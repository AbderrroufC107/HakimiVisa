import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import 'service_providers.dart';

final globalSearchResultsProvider =
    FutureProvider.family<Map<String, dynamic>, String>(
  (ref, query) async {
    final apiClient = ref.read(apiClientProvider);
    final response = await apiClient.get<Map<String, dynamic>>(
      ApiConstants.search,
      queryParameters: {'q': query},
    );
    return response.data ?? {};
  },
);
