import '../api/api_client.dart';
import '../api/api_constants.dart';
import '../api/api_exception.dart';
import '../api/token_storage.dart';
import '../models/auth_tokens_model.dart';

class AuthService {
  final ApiClient _apiClient;
  final TokenStorage _tokenStorage;

  AuthService({
    ApiClient? apiClient,
    TokenStorage? tokenStorage,
  })  : _apiClient = apiClient ?? ApiClient.instance,
        _tokenStorage = tokenStorage ?? TokenStorage.instance;

  Future<AuthTokens> login(String email, String password) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.login,
        data: {'email': email, 'password': password},
      );

      if (response.data == null) {
        throw ApiException(message: 'Réponse invalide du serveur.');
      }

      final tokens = AuthTokens.fromJson(response.data as Map<String, dynamic>);
      await _tokenStorage.saveTokens(tokens);
      return tokens;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<void> loginWithPhone(String phone) async {
    try {
      await _apiClient.post(
        '${ApiConstants.login}/phone',
        data: {'phone': phone},
      );
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<AuthTokens> verifyOTP(String phone, String code) async {
    try {
      final response = await _apiClient.post(
        '${ApiConstants.login}/verify',
        data: {'phone': phone, 'code': code},
      );

      if (response.data == null) {
        throw ApiException(message: 'Code de vérification invalide.');
      }

      final tokens = AuthTokens.fromJson(response.data as Map<String, dynamic>);
      await _tokenStorage.saveTokens(tokens);
      return tokens;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<AuthTokens> refreshToken() async {
    try {
      final refreshToken = await _tokenStorage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        throw ApiException.fromStatusCode(401);
      }

      final response = await _apiClient.post(
        ApiConstants.refresh,
        data: {'refresh_token': refreshToken},
      );

      if (response.data == null) {
        throw ApiException(message: 'Impossible de rafraîchir la session.');
      }

      final tokens = AuthTokens.fromJson(response.data as Map<String, dynamic>);
      await _tokenStorage.saveTokens(tokens);
      return tokens;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<void> logout() async {
    try {
      final refreshToken = await _tokenStorage.getRefreshToken();
      if (refreshToken != null) {
        await _apiClient.post(
          '/auth/logout',
          data: {'refresh_token': refreshToken},
        );
      }
    } on ApiException {
      // Silently ignore logout API errors
    } finally {
      await _tokenStorage.clearTokens();
    }
  }
}
