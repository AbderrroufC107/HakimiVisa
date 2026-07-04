import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import 'package:go_router/go_router.dart';
import '../../providers/theme_providers.dart';

class ClientSettingsScreen extends ConsumerWidget {
  const ClientSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final isDark = themeMode == ThemeMode.dark;
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.settings)),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          Center(
            child: Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: Image.asset(
                'assets/logo.png',
                height: 80,
                width: 80,
                fit: BoxFit.contain,
              ),
            ),
          ),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  title: Text(l10n.darkMode),
                  subtitle: Text(
                    isDark
                        ? l10n.translate('darkModeEnabled')
                        : l10n.translate('darkModeDisabled'),
                  ),
                  secondary: Icon(isDark ? Icons.dark_mode : Icons.light_mode),
                  value: isDark,
                  onChanged: (value) {
                    ref.read(themeModeProvider.notifier).state = value
                        ? ThemeMode.dark
                        : ThemeMode.light;
                  },
                ),
                const Divider(height: 1, indent: 72),
                const LanguageSettingsTile(),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  title: Text(l10n.notifications),
                  subtitle: Text(l10n.translate('enableNotifications')),
                  secondary: const Icon(Icons.notifications_outlined),
                  value: true,
                  onChanged: (value) {
                    context.showSnackBar(
                      value
                          ? l10n.translate('notificationsOn')
                          : l10n.translate('notificationsOff'),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.cached_outlined),
                  title: Text(l10n.translate('clearCache')),
                  subtitle: Text(l10n.translate('freeSpace')),
                  onTap: () {
                    context.showSnackBar(l10n.translate('cacheCleared'));
                  },
                ),
                const Divider(height: 1, indent: 72),
                ListTile(
                  leading: const Icon(Icons.info_outline),
                  title: Text(l10n.version),
                  subtitle: const Text(AppConstants.version),
                ),
                const Divider(height: 1, indent: 72),
                ListTile(
                  leading: const Icon(Icons.share_outlined),
                  title: Text(l10n.translate('shareApp')),
                  onTap: () {
                    context.showSnackBar(l10n.translate('sharing'));
                  },
                ),
                const Divider(height: 1, indent: 72),
                ListTile(
                  leading: const Icon(Icons.headset_mic_outlined),
                  title: Text(l10n.translate('customerSupport')),
                  onTap: () => context.push('/contact'),
                  trailing: const Icon(Icons.chevron_right),
                ),
                const Divider(height: 1, indent: 72),
                ListTile(
                  leading: const Icon(Icons.help_outline),
                  title: Text(l10n.help),
                  onTap: () => context.push('/help'),
                  trailing: const Icon(Icons.chevron_right),
                ),
                const Divider(height: 1, indent: 72),
                ListTile(
                  leading: const Icon(Icons.info_outline),
                  title: Text(l10n.about),
                  subtitle: Text(l10n.translate('aboutSubtitle')),
                  onTap: () {
                    showAboutDialog(
                      context: context,
                      applicationName: l10n.appName,
                      applicationVersion: AppConstants.version,
                      applicationLegalese: '© 2024 Hakimi Visa',
                    );
                  },
                ),
                const Divider(height: 1, indent: 72),
                ListTile(
                  leading: const Icon(Icons.developer_mode),
                  title: const Text('Developer Settings'),
                  subtitle: const Text('Server URL, connection, latency'),
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const DevSettingsScreen(),
                      ),
                    );
                  },
                  trailing: const Icon(Icons.chevron_right),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
