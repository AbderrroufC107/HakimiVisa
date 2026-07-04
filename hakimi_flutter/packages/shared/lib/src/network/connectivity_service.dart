import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityService {
  ConnectivityService._();

  static final ConnectivityService _instance = ConnectivityService._();
  static ConnectivityService get instance => _instance;

  final Connectivity _connectivity = Connectivity();
  final StreamController<bool> _connectionController =
      StreamController<bool>.broadcast();

  late StreamSubscription<List<ConnectivityResult>> _subscription;
  bool _isOnline = true;
  bool _initialized = false;

  Stream<bool> get connectionStream => _connectionController.stream;
  bool get isOnline => _isOnline;

  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;

    final results = await _connectivity.checkConnectivity();
    _isOnline = _evaluateConnectivity(results);
    _connectionController.add(_isOnline);

    _subscription = _connectivity.onConnectivityChanged.listen((results) {
      final online = _evaluateConnectivity(results);
      if (online != _isOnline) {
        _isOnline = online;
        _connectionController.add(_isOnline);
      }
    });
  }

  bool _evaluateConnectivity(List<ConnectivityResult> results) {
    return results.any((result) => result != ConnectivityResult.none);
  }

  void dispose() {
    _subscription.cancel();
    _connectionController.close();
  }
}
