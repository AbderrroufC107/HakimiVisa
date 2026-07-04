import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'routing/app_router.dart';
import 'providers/theme_providers.dart';

class ClientApp extends ConsumerWidget {
  const ClientApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final router = ref.watch(appRouterProvider);
    final preferences = ref.watch(appPreferencesProvider);

    PushNotificationService.instance.attachRouter(router);

    return MaterialApp.router(
      title: 'Suivi Visa',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
      locale: preferences.locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizationsDelegate(),
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      builder: (context, child) {
        return AppLaunchGate(child: child ?? const SizedBox.shrink());
      },
    );
  }
}
