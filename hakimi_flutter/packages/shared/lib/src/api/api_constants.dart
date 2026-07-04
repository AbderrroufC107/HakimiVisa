import '../environment/environment_manager.dart';

class ApiConstants {
  ApiConstants._();

  static String get baseUrl => EnvironmentManager.instance.baseUrlOrFallback;

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);
  static const Duration sendTimeout = Duration(seconds: 15);

  static const int maxRetries = 1;

  static const String health = '/health/live';

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refresh = '/auth/refresh';
  static const String profile = '/auth/profile';

  // Users
  static const String managerUsers = '/users/managers';

  // Clients
  static const String clients = '/clients';
  static const String clientDashboard = '/clients/dashboard';
  static const String clientAnalytics = '/clients/analytics';
  static String clientTimeline(String id) => '/clients/$id/timeline';
  static const String clientStats = '/clients/stats';
  static const String clientDocuments = '/clients/documents';
  static String clientById(String id) => '/clients/$id';
  static String clientUpdate(String id) => '/clients/$id';
  static String clientDelete(String id) => '/clients/$id';

  // Visa Cases
  static const String visaCases = '/visa-cases';
  static const String visaCaseStatus = '/visa-cases/status';
  static const String visaCaseHistory = '/visa-cases/history';
  static String visaCaseById(String id) => '/visa-cases/$id';
  static String visaCaseUpdate(String id) => '/visa-cases/$id';
  static String visaCaseDelete(String id) => '/visa-cases/$id';

  // Appointments
  static const String appointments = '/appointments';
  static String appointmentById(String id) => '/appointments/$id';
  static String appointmentUpdate(String id) => '/appointments/$id';
  static String appointmentDelete(String id) => '/appointments/$id';

  // Notifications
  static const String notifications = '/notifications';
  static const String notificationsUnreadCount = '/notifications/unread-count';
  static const String notificationsReadAll = '/notifications/read-all';
  static String notificationRead(String id) => '/notifications/$id/read';

  // Kanban
  static const String kanbanList = '/kanban';

  // Search
  static const String search = '/search';

  // Tracking
  static const String tracking = '/tracking';
  static String trackingById(String id) => '/tracking/$id';
  static String caseDocuments(String caseId) => '/tracking/$caseId/documents';

  // Public tracking (customer-facing)
  static const String publicTracking = '/public/tracking';
  static String publicTrackingByCase(String caseNumber) =>
      '/public/tracking/$caseNumber';
  static String publicTimeline(String caseNumber) =>
      '/public/tracking/$caseNumber/timeline';
  static String publicAppointments(String caseNumber) =>
      '/public/tracking/$caseNumber/appointments';
  static String publicDocuments(String caseNumber) =>
      '/public/tracking/$caseNumber/documents';
  static String publicNotifications(String caseNumber) =>
      '/public/tracking/$caseNumber/notifications';

  // Storage keys
  static const String accessTokenKey = 'hakimi_access_token';
  static const String refreshTokenKey = 'hakimi_refresh_token';
  static const String authTokensKey = 'hakimi_auth_tokens';
  static const String onboardingCompleteKey = 'hakimi_onboarding_complete';
  static const String savedPhoneKey = 'hakimi_saved_phone';
  static const String savedReferenceKey = 'hakimi_saved_reference';
}
