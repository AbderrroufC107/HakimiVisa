class AppConstants {
  static const String appName = 'Hakimi Visa';
  static const String version = '1.0.0';
  static const int defaultPageSize = 20;
  static const int searchDebounceMs = 500;
  static const int maxLoginAttempts = 5;
  static const int lockoutDurationMinutes = 30;

  static const Duration connectTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration cacheExpiry = Duration(hours: 1);
  static const Duration tokenRefreshBuffer = Duration(minutes: 5);

  static const String cacheKeyUser = 'cached_user';
  static const String cacheKeyToken = 'cached_token';
  static const String cacheKeyDashboard = 'cached_dashboard';
  static const String cacheKeyClients = 'cached_clients';
  static const String cacheKeyVisaCases = 'cached_visa_cases';
  static const String cacheKeyNotifications = 'cached_notifications';
  static const String prefKeyTheme = 'theme_mode';
  static const String prefKeyLocale = 'locale';
  static const String prefKeyOnboarding = 'onboarding_complete';
}
