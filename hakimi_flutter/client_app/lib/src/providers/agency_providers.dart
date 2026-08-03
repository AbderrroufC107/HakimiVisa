import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import 'tracking_providers.dart';

/// Agency contact details, edited by the agency in the web back-office and
/// served publicly so the client app never ships hard-coded values.
final agencyContactProvider = FutureProvider<AgencyContactModel>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get<AgencyContactModel>(
    ApiConstants.publicAgencyContact,
    fromJsonT: (json) => AgencyContactModel.fromJson(json),
  );
  return response.data ?? const AgencyContactModel();
});
