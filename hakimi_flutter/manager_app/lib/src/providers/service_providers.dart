import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient.instance);

final authServiceProvider = Provider<AuthService>((ref) => AuthService());

final tokenStorageProvider = Provider<TokenStorage>((ref) => TokenStorage.instance);
