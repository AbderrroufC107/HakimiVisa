import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/src/l10n/app_localizations.dart';
import 'package:hakimi_shared/src/providers/app_preferences_provider.dart';

class LanguageSettingsTile extends ConsumerWidget {
  const LanguageSettingsTile({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final preferences = ref.watch(appPreferencesProvider);
    final l10n = AppLocalizations.of(context);

    return ListTile(
      leading: const Icon(Icons.language),
      title: Text(l10n.language),
      subtitle: Text(_languageLabel(preferences.locale.languageCode)),
      trailing: const Icon(Icons.chevron_right),
      onTap: () => _showLanguageSheet(context, ref),
    );
  }

  Future<void> _showLanguageSheet(BuildContext context, WidgetRef ref) {
    return showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        final current = ref.watch(appPreferencesProvider).locale.languageCode;

        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _LanguageOption(
                label: 'Français',
                languageCode: 'fr',
                currentLanguageCode: current,
              ),
              _LanguageOption(
                label: 'English',
                languageCode: 'en',
                currentLanguageCode: current,
              ),
              _LanguageOption(
                label: 'العربية',
                languageCode: 'ar',
                currentLanguageCode: current,
              ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  String _languageLabel(String code) {
    switch (code) {
      case 'ar':
        return 'العربية';
      case 'en':
        return 'English';
      case 'fr':
      default:
        return 'Français';
    }
  }
}

class _LanguageOption extends ConsumerWidget {
  final String label;
  final String languageCode;
  final String currentLanguageCode;

  const _LanguageOption({
    required this.label,
    required this.languageCode,
    required this.currentLanguageCode,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = languageCode == currentLanguageCode;

    return ListTile(
      title: Text(label),
      trailing: selected ? const Icon(Icons.check) : null,
      onTap: () async {
        await ref
            .read(appPreferencesProvider.notifier)
            .setLanguage(languageCode);
        if (context.mounted) Navigator.of(context).pop();
      },
    );
  }
}
