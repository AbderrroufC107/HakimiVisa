import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import 'src/app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final env = EnvironmentManager.instance;
  await env.initialize();

  ApiClient.instance.configure(
    baseUrl: env.baseUrlOrFallback,
    tokenStorage: TokenStorage.instance,
  );

  await PushNotificationService.instance.initialize();

  env.connectionState.addListener(() {
    final url = env.activeUrl.value;
    if (url != null && url.isNotEmpty) {
      ApiClient.instance.updateBaseUrl(url);
    }
  });

  runApp(const ProviderScope(child: ManagerApp()));
}
