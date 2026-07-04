import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AppPreferencesState {
  final bool isLoaded;
  final bool hasSelectedLanguage;
  final Locale locale;

  const AppPreferencesState({
    required this.isLoaded,
    required this.hasSelectedLanguage,
    required this.locale,
  });

  AppPreferencesState copyWith({
    bool? isLoaded,
    bool? hasSelectedLanguage,
    Locale? locale,
  }) {
    return AppPreferencesState(
      isLoaded: isLoaded ?? this.isLoaded,
      hasSelectedLanguage: hasSelectedLanguage ?? this.hasSelectedLanguage,
      locale: locale ?? this.locale,
    );
  }
}

class AppPreferencesNotifier extends Notifier<AppPreferencesState> {
  static const _storage = FlutterSecureStorage();
  static const _localeKey = 'hakimi_locale';
  static const _languageSelectedKey = 'hakimi_language_selected';

  @override
  AppPreferencesState build() {
    _load();
    return const AppPreferencesState(
      isLoaded: false,
      hasSelectedLanguage: false,
      locale: Locale('fr'),
    );
  }

  Future<void> _load() async {
    final localeCode = await _storage.read(key: _localeKey);
    final hasSelectedLanguage =
        await _storage.read(key: _languageSelectedKey) == 'true';

    state = AppPreferencesState(
      isLoaded: true,
      hasSelectedLanguage: hasSelectedLanguage,
      locale: Locale(_normalizeLocale(localeCode)),
    );
  }

  Future<void> setLanguage(String languageCode) async {
    final normalized = _normalizeLocale(languageCode);
    await _storage.write(key: _localeKey, value: normalized);
    await _storage.write(key: _languageSelectedKey, value: 'true');

    state = state.copyWith(
      isLoaded: true,
      hasSelectedLanguage: true,
      locale: Locale(normalized),
    );
  }

  String _normalizeLocale(String? languageCode) {
    switch (languageCode) {
      case 'ar':
      case 'en':
      case 'fr':
        return languageCode!;
      default:
        return 'fr';
    }
  }
}

final appPreferencesProvider =
    NotifierProvider<AppPreferencesNotifier, AppPreferencesState>(
      AppPreferencesNotifier.new,
    );
