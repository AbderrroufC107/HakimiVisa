import 'dart:async';
import 'package:dio/dio.dart';
import 'api_constants.dart';
import 'token_storage.dart';
import '../models/auth_tokens_model.dart';

enum AuthState { authenticated, unauthenticated, loading }

class AuthInterceptor extends Interceptor {
  final Dio _dio;
  final TokenStorage _tokenStorage;
  bool _isRefreshing = false;
  final StreamController<AuthState> _authStateController =
      StreamController<AuthState>.broadcast();
  Completer<AuthTokens?>? _pendingCompleter;

  AuthInterceptor({
    required Dio dio,
    TokenStorage? tokenStorage,
  })  : _dio = dio,
        _tokenStorage = tokenStorage ?? TokenStorage.instance;

  Stream<AuthState> get authStateStream => _authStateController.stream;

  void _emitAuthState(AuthState state) {
    if (!_authStateController.isClosed) {
      _authStateController.add(state);
    }
  }

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    if (options.path.contains(ApiConstants.refresh)) {
      return handler.next(options);
    }

    final token = await _tokenStorage.getAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401 &&
        !err.requestOptions.path.contains(ApiConstants.refresh) &&
        !err.requestOptions.path.contains(ApiConstants.login) &&
        !err.requestOptions.path.contains(ApiConstants.register)) {
      try {
        final tokens = await _refreshToken();
        if (tokens != null) {
          final retryResponse = await _retryRequest(err.requestOptions, tokens.accessToken);
          handler.resolve(retryResponse);
          return;
        }
      } catch (_) {
        _emitAuthState(AuthState.unauthenticated);
      }
    }
    handler.next(err);
  }

  Future<AuthTokens?> _refreshToken() async {
    if (_isRefreshing) {
      _pendingCompleter ??= Completer<AuthTokens?>();
      return _pendingCompleter!.future;
    }

    _isRefreshing = true;
    _pendingCompleter = null;
    _emitAuthState(AuthState.loading);

    try {
      final refreshToken = await _tokenStorage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        _emitAuthState(AuthState.unauthenticated);
        return null;
      }

      final response = await _dio.post(
        ApiConstants.refresh,
        data: {'refresh_token': refreshToken},
        options: Options(headers: {'Authorization': null}),
      );

      final data = response.data as Map<String, dynamic>;
      final tokens = AuthTokens.fromJson(data['data'] as Map<String, dynamic>? ?? data);
      await _tokenStorage.saveTokens(tokens);
      _emitAuthState(AuthState.authenticated);

      _pendingCompleter?.complete(tokens);

      return tokens;
    } catch (e) {
      await _tokenStorage.clearTokens();
      _emitAuthState(AuthState.unauthenticated);

      _pendingCompleter?.complete(null);

      return null;
    } finally {
      _isRefreshing = false;
    }
  }

  Future<Response> _retryRequest(RequestOptions requestOptions, String accessToken) async {
    requestOptions.headers['Authorization'] = 'Bearer $accessToken';
    return _dio.fetch(requestOptions);
  }

  void dispose() {
    _authStateController.close();
  }
}
