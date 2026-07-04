import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'routing/app_router.dart';
import 'providers/theme_providers.dart';
import 'providers/auth_providers.dart';

class ManagerApp extends ConsumerStatefulWidget {
  const ManagerApp({super.key});

  @override
  ConsumerState<ManagerApp> createState() => _ManagerAppState();
}

class _ManagerAppState extends ConsumerState<ManagerApp> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.read(authStateProvider.notifier).refreshProfile();
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeModeProvider);
    final router = ref.watch(routerProvider);
    final preferences = ref.watch(appPreferencesProvider);

    PushNotificationService.instance.attachRouter(router);

    ref.listen(authStateProvider, (prev, next) {
      if (prev?.status != next.status) {
        if (next.status == AuthStatus.authenticated && next.user != null) {
          PushNotificationService.instance.setUserId(next.user!.id);
        } else if (next.status == AuthStatus.unauthenticated) {
          router.go('/login');
          PushNotificationService.instance.unregisterToken();
        }
      }
    });

    return MaterialApp.router(
      title: 'Hakimi Visa - Gestion',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
      localizationsDelegates: const [
        AppLocalizationsDelegate(),
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: AppLocalizations.supportedLocales,
      locale: preferences.locale,
      builder: (context, child) {
        return AppLaunchGate(child: child ?? const SizedBox.shrink());
      },
    );
  }
}
