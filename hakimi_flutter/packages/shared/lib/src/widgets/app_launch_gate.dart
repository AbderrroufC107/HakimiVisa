import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/src/environment/environment_manager.dart';
import 'package:hakimi_shared/src/environment/dev_server_setup_screen.dart';
import 'package:hakimi_shared/src/providers/app_preferences_provider.dart';
import 'package:hakimi_shared/src/theme/app_spacing.dart';

class AppLaunchGate extends ConsumerStatefulWidget {
  final Widget child;

  const AppLaunchGate({super.key, required this.child});

  @override
  ConsumerState<AppLaunchGate> createState() => _AppLaunchGateState();
}

class _AppLaunchGateState extends ConsumerState<AppLaunchGate> {
  bool _splashDone = false;
  bool _showSetup = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer(const Duration(seconds: 2), () {
      if (mounted) setState(() => _splashDone = true);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _onServerSaved() {
    setState(() => _showSetup = false);
    EnvironmentManager.instance.retryConnection();
  }

  @override
  Widget build(BuildContext context) {
    final preferences = ref.watch(appPreferencesProvider);
    final env = EnvironmentManager.instance;
    final connState = env.connectionState.value;

    if (!_splashDone || !preferences.isLoaded) {
      return const _HakimiSplashScreen();
    }

    if (!preferences.hasSelectedLanguage) {
      return const _LanguageSelectionScreen();
    }

    if (_showSetup) {
      return Navigator(
        onGenerateRoute: (settings) => MaterialPageRoute(
          builder: (_) => DevServerSetupScreen(onSaved: _onServerSaved),
        ),
      );
    }

    if (connState == EnvConnectionState.disconnected) {
      return _UnableToConnectPage(
        onRetry: () async {
          await env.retryConnection();
          if (mounted) setState(() {});
        },
        onChangeServer: () {
          setState(() => _showSetup = true);
        },
      );
    }

    if (connState == EnvConnectionState.initializing) {
      return const _HakimiSplashScreen();
    }

    return widget.child;
  }
}

class _UnableToConnectPage extends StatelessWidget {
  final VoidCallback onRetry;
  final VoidCallback onChangeServer;

  const _UnableToConnectPage({
    required this.onRetry,
    required this.onChangeServer,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.cloud_off,
                size: 80,
                color: theme.colorScheme.error,
              ),
              const SizedBox(height: 24),
              Text(
                'Unable to Connect',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'Unable to connect to HakimiVisa server.\n'
                'Make sure your computer and phone are '
                'connected to the same Wi-Fi network.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry Connection'),
                ),
              ),
              const SizedBox(height: 12),
              TextButton.icon(
                onPressed: onChangeServer,
                icon: const Icon(Icons.settings),
                label: const Text('Change Server'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HakimiSplashScreen extends StatelessWidget {
  const _HakimiSplashScreen();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0F766E), Color(0xFF2563EB), Color(0xFF111827)],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.24),
                  ),
                ),
                child: const Icon(
                  Icons.travel_explore,
                  color: Colors.white,
                  size: 52,
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(
                'HAKIMI VISA',
                style: theme.textTheme.headlineMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Container(
                width: 128,
                height: 3,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LanguageSelectionScreen extends ConsumerWidget {
  const _LanguageSelectionScreen();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              const Icon(Icons.language, size: 56),
              const SizedBox(height: AppSpacing.lg),
              Text(
                'Choose language',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Choisissez la langue | اختر اللغة',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: AppSpacing.xl),
              _LanguageButton(
                label: 'Français',
                subtitle: 'Interface en français',
                languageCode: 'fr',
                onSelected: (code) =>
                    ref.read(appPreferencesProvider.notifier).setLanguage(code),
              ),
              const SizedBox(height: AppSpacing.sm),
              _LanguageButton(
                label: 'English',
                subtitle: 'English interface',
                languageCode: 'en',
                onSelected: (code) =>
                    ref.read(appPreferencesProvider.notifier).setLanguage(code),
              ),
              const SizedBox(height: AppSpacing.sm),
              _LanguageButton(
                label: 'العربية',
                subtitle: 'واجهة باللغة العربية',
                languageCode: 'ar',
                onSelected: (code) =>
                    ref.read(appPreferencesProvider.notifier).setLanguage(code),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}

class _LanguageButton extends StatelessWidget {
  final String label;
  final String subtitle;
  final String languageCode;
  final ValueChanged<String> onSelected;

  const _LanguageButton({
    required this.label,
    required this.subtitle,
    required this.languageCode,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: () => onSelected(languageCode),
      style: OutlinedButton.styleFrom(
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.md,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 2),
                Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          const Icon(Icons.chevron_right),
        ],
      ),
    );
  }
}
