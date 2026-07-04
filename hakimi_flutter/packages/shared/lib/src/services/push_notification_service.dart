import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/src/api/api_client.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  await PushNotificationService.instance._handleBackgroundMessage(message);
}

const _androidIcon = '@mipmap/ic_launcher';

class PushNotificationService {
  PushNotificationService._();

  static final PushNotificationService _instance = PushNotificationService._();
  static PushNotificationService get instance => _instance;

  bool _initialized = false;
  String? _fcmToken;
  String? _userId;
  GoRouter? _router;

  late final FirebaseMessaging _messaging;
  FlutterLocalNotificationsPlugin? _localNotifications;

  final StreamController<String> _tokenController =
      StreamController<String>.broadcast();
  final StreamController<RemoteMessage> _notificationController =
      StreamController<RemoteMessage>.broadcast();

  Stream<String> get tokenStream => _tokenController.stream;
  Stream<RemoteMessage> get notificationStream => _notificationController.stream;
  String? get fcmToken => _fcmToken;

  void attachRouter(GoRouter router) {
    _router = router;
  }

  Future<void> initialize({
    GoRouter? router,
    String? userId,
  }) async {
    if (_initialized) return;
    _router = router;
    _userId = userId;

    await Firebase.initializeApp();
    _messaging = FirebaseMessaging.instance;
    await _initLocalNotifications();

    await _requestPermission();

    final token = await _messaging.getToken();
    if (token != null && token.isNotEmpty) {
      _fcmToken = token;
      _tokenController.add(token);
      if (userId != null) {
        await _registerToken(token);
      }
    }

    _messaging.onTokenRefresh.listen((token) {
      _fcmToken = token;
      _tokenController.add(token);
      if (_userId != null) {
        _registerToken(token);
      }
    });

    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationOpenedApp);

    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationOpenedApp(initialMessage);
    }

    _initialized = true;
  }

  Future<void> _initLocalNotifications() async {
    _localNotifications = FlutterLocalNotificationsPlugin();

    const androidSettings =
        AndroidInitializationSettings(_androidIcon);
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );
    await _localNotifications!.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (response) {
        final payload = response.payload;
        if (payload != null && payload.isNotEmpty) {
          _handleNotificationTap(payload);
        }
      },
    );

    final channel = AndroidNotificationChannel(
      'hakimi_notifications',
      'Hakimi Visa Notifications',
      description: 'Notifications des visas, rendez-vous et messages',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
      enableLights: true,
      showBadge: true,
    );
    await _localNotifications!
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  Future<void> _requestPermission() async {
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );
  }

  void setUserId(String userId) {
    _userId = userId;
    if (_fcmToken != null) {
      _registerToken(_fcmToken!);
    }
  }

  Future<void> _registerToken(String token) async {
    try {
      await ApiClient.instance.post('/device-tokens', data: {
        'token': token,
        'platform': 'android',
      });
    } catch (_) {}
  }

  Future<void> registerPhoneToken(String phone) async {
    if (_fcmToken == null) return;
    try {
      await ApiClient.instance.post('/public/device-tokens', data: {
        'token': _fcmToken,
        'phone': phone,
        'platform': 'android',
      });
    } catch (_) {}
  }

  Future<void> unregisterToken() async {
    if (_fcmToken == null) return;
    try {
      await ApiClient.instance.delete('/device-tokens/${_fcmToken}');
    } catch (_) {}
    _fcmToken = null;
  }

  void _handleForegroundMessage(RemoteMessage message) {
    _notificationController.add(message);
    _showLocalNotification(message);
  }

  Future<void> _handleBackgroundMessage(RemoteMessage message) async {
    await _initLocalNotifications();
    _showLocalNotification(message);
  }

  void _handleNotificationOpenedApp(RemoteMessage message) {
    _showLocalNotification(message);
    _handleNotificationPayload(message);
  }

  void _showLocalNotification(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    final data = message.data;
    final androidDetails = AndroidNotificationDetails(
      'hakimi_notifications',
      'Hakimi Visa Notifications',
      channelDescription: 'Notifications des visas, rendez-vous et messages',
      importance: Importance.high,
      priority: Priority.high,
      playSound: true,
      enableVibration: true,
      channelShowBadge: true,
      enableLights: true,
    );
    final details = NotificationDetails(android: androidDetails);

    if (_localNotifications == null) return;
    final id = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    _localNotifications!.show(
      id,
      notification.title,
      notification.body,
      details,
      payload: data.isNotEmpty ? _encodePayload(data) : null,
    );
  }

  String _encodePayload(Map<String, dynamic> data) {
    return data.entries.map((e) => '${e.key}=${e.value}').join('&');
  }

  Map<String, String> _decodePayload(String payload) {
    final map = <String, String>{};
    for (final part in payload.split('&')) {
      final eq = part.indexOf('=');
      if (eq > 0) {
        map[part.substring(0, eq)] = part.substring(eq + 1);
      }
    }
    return map;
  }

  void _handleNotificationTap(String payload) {
    final data = _decodePayload(payload);
    _handleNotificationPayloadFromData(data);
  }

  void _handleNotificationPayload(RemoteMessage message) {
    final data = Map<String, String>.from(message.data);
    _handleNotificationPayloadFromData(data);
  }

  void _handleNotificationPayloadFromData(Map<String, String> data) {
    final link = data['link'];
    if (link != null && link.isNotEmpty && _router != null) {
      try {
        _router!.go(link);
      } catch (_) {
        try {
          _router!.push(link);
        } catch (_) {}
      }
    }
  }
}
