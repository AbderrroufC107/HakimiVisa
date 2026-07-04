import 'package:dio/dio.dart';

class ApiException implements Exception {
  final int? statusCode;
  final String message;
  final Map<String, dynamic>? errors;
  final String? errorId;

  const ApiException({
    this.statusCode,
    this.message = 'Une erreur est survenue',
    this.errors,
    this.errorId,
  });

  factory ApiException.fromDioException(DioException exception) {
    switch (exception.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException(
          statusCode: null,
          message: 'La connexion a expiré. Veuillez réessayer.',
          errorId: 'timeout',
        );

      case DioExceptionType.connectionError:
        return ApiException(
          statusCode: null,
          message: 'Impossible de se connecter au serveur. Vérifiez votre connexion.',
          errorId: 'connection_error',
        );

      case DioExceptionType.cancel:
        return ApiException(
          statusCode: null,
          message: 'La requête a été annulée.',
          errorId: 'cancelled',
        );

      case DioExceptionType.badResponse:
        final response = exception.response;
        final data = response?.data as Map<String, dynamic>?;
        return ApiException(
          statusCode: response?.statusCode,
          message: data?['message'] as String? ??
              _defaultMessageForStatusCode(response?.statusCode),
          errors: data?['errors'] as Map<String, dynamic>?,
          errorId: data?['errorId'] as String?,
        );

      case DioExceptionType.badCertificate:
        return ApiException(
          statusCode: null,
          message: 'Erreur de sécurité de la connexion.',
          errorId: 'bad_certificate',
        );

      case DioExceptionType.unknown:
        return ApiException(
          statusCode: null,
          message: 'Une erreur inattendue est survenue.',
          errorId: 'unknown',
        );
    }
  }

  factory ApiException.fromStatusCode(int? statusCode, [String? overrideMessage]) {
    return ApiException(
      statusCode: statusCode,
      message: overrideMessage ?? _defaultMessageForStatusCode(statusCode),
      errorId: 'status_$statusCode',
    );
  }

  static String _defaultMessageForStatusCode(int? statusCode) {
    switch (statusCode) {
      case 400:
        return 'Requête invalide.';
      case 401:
        return 'Session expirée. Veuillez vous reconnecter.';
      case 403:
        return 'Accès refusé.';
      case 404:
        return 'Ressource introuvable.';
      case 409:
        return 'Conflit avec l\'état actuel de la ressource.';
      case 422:
        return 'Données invalides.';
      case 429:
        return 'Trop de requêtes. Veuillez réessayer plus tard.';
      case 500:
        return 'Erreur interne du serveur.';
      case 502:
        return 'Service temporairement indisponible.';
      case 503:
        return 'Service en maintenance.';
      default:
        return 'Une erreur est survenue.';
    }
  }

  @override
  String toString() {
    final buffer = StringBuffer('ApiException(');
    if (statusCode != null) buffer.write('statusCode: $statusCode, ');
    buffer.write('message: $message');
    if (errors != null && errors!.isNotEmpty) {
      buffer.write(', errors: $errors');
    }
    if (errorId != null) buffer.write(', errorId: $errorId');
    buffer.write(')');
    return buffer.toString();
  }
}
