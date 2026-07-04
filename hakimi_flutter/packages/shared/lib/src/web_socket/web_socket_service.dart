import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../api/token_storage.dart';
import '../environment/environment_manager.dart';

enum WebSocketEvent {
  visaCaseStatusChange,
  appointmentCreated,
  appointmentUpdated,
  appointmentDeleted,
  notification,
}

class WebSocketService {
  WebSocketService._();

  static final WebSocketService _instance = WebSocketService._();
  static WebSocketService get instance => _instance;

  static const int _maxReconnectAttempts = 10;
  static const Duration _initialReconnectDelay = Duration(seconds: 1);

  io.Socket? _socket;
  TokenStorage? _tokenStorage;
  bool _isConnected = false;
  int _reconnectAttempts = 0;
  Duration _reconnectDelay = _initialReconnectDelay;
  bool _intentionalDisconnect = false;

  final StreamController<bool> _connectionController =
      StreamController<bool>.broadcast();

  final Map<WebSocketEvent, StreamController<Map<String, dynamic>>>
      _eventControllers = {
    for (final event in WebSocketEvent.values)
      event: StreamController<Map<String, dynamic>>.broadcast(),
  };

  Stream<bool> get connectionStream => _connectionController.stream;
  bool get isConnected => _isConnected;

  Stream<Map<String, dynamic>> on(WebSocketEvent event) =>
      _eventControllers[event]!.stream;

  void connect({TokenStorage? tokenStorage}) {
    _tokenStorage = tokenStorage ?? TokenStorage.instance;
    _intentionalDisconnect = false;
    _reconnectAttempts = 0;
    _reconnectDelay = _initialReconnectDelay;
    _initSocket();
  }

  Future<void> _initSocket() async {
    final serverUrl = EnvironmentManager.instance.webSocketUrl;
    if (serverUrl.isEmpty) return;

    final accessToken = await _tokenStorage?.getAccessToken();

    _socket?.disconnect();
    _socket?.dispose();

    _socket = io.io(
      serverUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': accessToken ?? ''})
          .enableForceNew()
          .disableAutoConnect()
          .build(),
    );

    _socket?.onConnect((_) {
      _isConnected = true;
      _reconnectAttempts = 0;
      _reconnectDelay = _initialReconnectDelay;
      _connectionController.add(true);
      _setupEventListeners();
    });

    _socket?.onDisconnect((_) {
      _isConnected = false;
      _connectionController.add(false);
      _attemptReconnect();
    });

    _socket?.onConnectError((data) {
      _isConnected = false;
      _connectionController.add(false);
      _attemptReconnect();
    });

    _socket?.onError((data) {
      _isConnected = false;
      _connectionController.add(false);
      _attemptReconnect();
    });

    _socket?.connect();
  }

  void _setupEventListeners() {
    _socket?.on('visaCase:statusChange', (data) {
      _emitEvent(WebSocketEvent.visaCaseStatusChange, data);
    });

    _socket?.on('appointment:created', (data) {
      _emitEvent(WebSocketEvent.appointmentCreated, data);
    });

    _socket?.on('appointment:updated', (data) {
      _emitEvent(WebSocketEvent.appointmentUpdated, data);
    });

    _socket?.on('appointment:deleted', (data) {
      _emitEvent(WebSocketEvent.appointmentDeleted, data);
    });

    _socket?.on('notification', (data) {
      _emitEvent(WebSocketEvent.notification, data);
    });
  }

  void _emitEvent(WebSocketEvent event, dynamic data) {
    final controller = _eventControllers[event];
    if (controller == null || controller.isClosed) return;

    if (data is Map<String, dynamic>) {
      controller.add(data);
    } else if (data is String) {
      controller.add({'message': data});
    } else {
      controller.add({});
    }
  }

  void _attemptReconnect() {
    if (_intentionalDisconnect) return;

    _reconnectAttempts++;
    if (_reconnectAttempts > _maxReconnectAttempts) {
      return;
    }

    Future.delayed(_reconnectDelay, _initSocket);
    _reconnectDelay = Duration(
      milliseconds: (_reconnectDelay.inMilliseconds * 2)
          .clamp(1000, 30000),
    );
  }

  void disconnect() {
    _intentionalDisconnect = true;
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
    _connectionController.add(false);
  }

  void dispose() {
    disconnect();
    _connectionController.close();
    for (final controller in _eventControllers.values) {
      controller.close();
    }
  }
}
