import 'dart:async';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_constants.dart';
import '../models/auth_tokens_model.dart';

class TokenStorage {
  TokenStorage._();

  static final TokenStorage _instance = TokenStorage._();
  static TokenStorage get instance => _instance;

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  final StreamController<AuthTokens?> _tokenController =
      StreamController<AuthTokens?>.broadcast();

  Stream<AuthTokens?> get tokenStream => _tokenController.stream;

  Future<void> saveTokens(AuthTokens tokens) async {
    await Future.wait([
      _storage.write(key: ApiConstants.accessTokenKey, value: tokens.accessToken),
      _storage.write(key: ApiConstants.refreshTokenKey, value: tokens.refreshToken),
    ]);
    _tokenController.add(tokens);
  }

  Future<String?> getAccessToken() async {
    return _storage.read(key: ApiConstants.accessTokenKey);
  }

  Future<String?> getRefreshToken() async {
    return _storage.read(key: ApiConstants.refreshTokenKey);
  }

  Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(key: ApiConstants.accessTokenKey),
      _storage.delete(key: ApiConstants.refreshTokenKey),
    ]);
    _tokenController.add(null);
  }

  void dispose() {
    _tokenController.close();
  }
}
