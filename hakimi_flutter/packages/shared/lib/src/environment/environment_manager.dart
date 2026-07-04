import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum EnvConnectionState { initializing, connected, disconnected }

class EnvironmentManager {
  EnvironmentManager._();

  static final EnvironmentManager _instance = EnvironmentManager._();
  static EnvironmentManager get instance => _instance;

  static const String _cachedUrlKey = 'hakimi_dev_server_url';
  static const String _productionUrl = 'https://hakimivisa.cloud/api';
  static const String _emulatorUrl = 'http://10.0.2.2:4000/api';
  static const Duration _healthCheckTimeout = Duration(seconds: 5);

  final ValueNotifier<EnvConnectionState> connectionState =
      ValueNotifier(EnvConnectionState.initializing);
  final ValueNotifier<String?> activeUrl = ValueNotifier(null);
  final ValueNotifier<int?> lastLatencyMs = ValueNotifier(null);
  final ValueNotifier<String?> lastError = ValueNotifier(null);

  String? _baseUrl;
  SharedPreferences? _prefs;

  bool get isRelease => kReleaseMode;
  bool get isConnected => _baseUrl != null;

  String get baseUrl {
    if (_baseUrl == null) {
      throw StateError(
        'EnvironmentManager not initialized. Call initialize() first.',
      );
    }
    return _baseUrl!;
  }

  String get baseUrlOrFallback => _baseUrl ?? '';

  String get webSocketUrl {
    if (_baseUrl == null) return '';
    try {
      final uri = Uri.parse(_baseUrl!);
      final wsScheme = uri.scheme == 'https' ? 'wss' : 'ws';
      return '$wsScheme://${uri.host}:${uri.port}';
    } catch (_) {
      return '';
    }
  }

  bool get isProductionUrl => _baseUrl == _productionUrl;

  Future<void> initialize() async {
    debugPrint('[EnvironmentManager] initialize() started');
    connectionState.value = EnvConnectionState.initializing;
    lastError.value = null;
    _prefs = await SharedPreferences.getInstance();

    // In release: try production first, then cached, then disconnected
    // In debug: try cached, then emulator, then disconnected
    final String primaryUrl;
    if (isRelease) {
      primaryUrl = _productionUrl;
      debugPrint('[EnvironmentManager] Release mode, primary URL: $primaryUrl');
    } else {
      debugPrint('[EnvironmentManager] Debug mode');
      final cached = _prefs!.getString(_cachedUrlKey);
      if (cached != null && cached.isNotEmpty) {
        debugPrint('[EnvironmentManager] Trying cached URL: $cached');
        final ok = await _healthCheck(cached);
        if (ok) {
          debugPrint('[EnvironmentManager] Cached URL works: $cached');
          _applyUrl(cached);
          return;
        }
        debugPrint('[EnvironmentManager] Cached URL failed: $cached');
      }
      primaryUrl = _emulatorUrl;
      debugPrint('[EnvironmentManager] Trying emulator URL: $primaryUrl');
    }

    final primaryOk = await _healthCheck(primaryUrl);
    if (primaryOk) {
      debugPrint('[EnvironmentManager] Primary URL works: $primaryUrl');
      _applyUrl(primaryUrl);
      if (!isRelease) {
        await _cacheUrl(primaryUrl);
      }
      return;
    }
    debugPrint('[EnvironmentManager] Primary URL failed: $primaryUrl');

    // In release, also try cached dev server as fallback
    if (isRelease) {
      final cached = _prefs!.getString(_cachedUrlKey);
      if (cached != null && cached.isNotEmpty && cached != primaryUrl) {
        debugPrint('[EnvironmentManager] Release fallback trying cached: $cached');
        final ok = await _healthCheck(cached);
        if (ok) {
          debugPrint('[EnvironmentManager] Cached fallback works: $cached');
          _applyUrl(cached);
          return;
        }
        debugPrint('[EnvironmentManager] Cached fallback failed: $cached');
      }
    }

    lastError.value = 'Could not reach $primaryUrl';
    connectionState.value = EnvConnectionState.disconnected;
    debugPrint('[EnvironmentManager] All URLs failed, state=disconnected');
  }

  Future<bool> testConnection(String url) async {
    final ok = await _healthCheck(url);
    if (ok) {
      _applyUrl(url);
      await _cacheUrl(url);
    }
    return ok;
  }

  Future<bool> configureDevServer(String host, int port) async {
    final url = 'http://$host:$port/api';
    final ok = await _healthCheck(url);
    if (ok) {
      _applyUrl(url);
      await _cacheUrl(url);
    }
    return ok;
  }

  Future<void> resetDevServer() async {
    _prefs ??= await SharedPreferences.getInstance();
    await _prefs!.remove(_cachedUrlKey);
    _baseUrl = null;
    activeUrl.value = null;
    lastLatencyMs.value = null;
    lastError.value = null;
    connectionState.value = EnvConnectionState.disconnected;
  }

  Future<String?> getCachedUrl() async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!.getString(_cachedUrlKey);
  }

  Future<void> retryConnection() async {
    await initialize();
  }

  void _applyUrl(String url) {
    debugPrint('[EnvironmentManager] Applying URL: $url');
    _baseUrl = url;
    activeUrl.value = url;
    connectionState.value = EnvConnectionState.connected;
  }

  Future<void> _cacheUrl(String url) async {
    _prefs ??= await SharedPreferences.getInstance();
    await _prefs!.setString(_cachedUrlKey, url);
  }

  Future<bool> _healthCheck(String url) async {
    final healthUrl = url.endsWith('/') ? '${url}health/live' : '$url/health/live';
    debugPrint('[EnvironmentManager] Health check: $healthUrl');
    final stopwatch = Stopwatch()..start();
    try {
      final client = HttpClient()
        ..connectionTimeout = _healthCheckTimeout;
      final request = await client.getUrl(Uri.parse(healthUrl));
      request.headers.set('Accept', 'application/json');
      final response = await request.close();
      stopwatch.stop();
      lastLatencyMs.value = stopwatch.elapsedMilliseconds;
      client.close();
      if (response.statusCode == 200) {
        debugPrint('[EnvironmentManager] Health check OK (${response.statusCode})');
        return true;
      }
      debugPrint('[EnvironmentManager] Health check bad status: ${response.statusCode}');
      return false;
    } catch (e) {
      stopwatch.stop();
      debugPrint('[EnvironmentManager] Health check failed: $e');
      return false;
    }
  }
}
