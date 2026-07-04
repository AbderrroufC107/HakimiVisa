import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'api_constants.dart';
import 'api_exception.dart';
import 'api_response.dart';
import 'auth_interceptor.dart';
import 'token_storage.dart';

class ApiClient {
  ApiClient._();

  static final ApiClient _instance = ApiClient._();
  static ApiClient get instance => _instance;

  late final Dio _dio;
  late final AuthInterceptor _authInterceptor;

  AuthInterceptor get authInterceptor => _authInterceptor;

  void configure({
    String? baseUrl,
    TokenStorage? tokenStorage,
  }) {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl ?? ApiConstants.baseUrl,
        connectTimeout: ApiConstants.connectTimeout,
        receiveTimeout: ApiConstants.receiveTimeout,
        sendTimeout: ApiConstants.sendTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _authInterceptor = AuthInterceptor(
      dio: _dio,
      tokenStorage: tokenStorage,
    );

    _dio.interceptors.addAll([
      _authInterceptor,
      _VerboseLogInterceptor(),
      LogInterceptor(
        request: true,
        requestBody: true,
        responseBody: true,
        error: true,
      ),
      _ErrorInterceptor(),
    ]);
  }

  void updateBaseUrl(String baseUrl) {
    debugPrint('[ApiClient] Updating baseUrl to: $baseUrl');
    _dio.options.baseUrl = baseUrl;
  }

  Dio get dio => _dio;

  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    T Function(Map<String, dynamic>)? fromJsonT,
    T Function(List<dynamic>)? fromJsonList,
  }) async {
    return _execute(
      () => _dio.get(path, queryParameters: queryParameters),
      fromJsonT: fromJsonT,
      fromJsonList: fromJsonList,
    );
  }

  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    T Function(Map<String, dynamic>)? fromJsonT,
    T Function(List<dynamic>)? fromJsonList,
  }) async {
    return _execute(
      () => _dio.post(path, data: data, queryParameters: queryParameters),
      fromJsonT: fromJsonT,
      fromJsonList: fromJsonList,
    );
  }

  Future<ApiResponse<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    T Function(Map<String, dynamic>)? fromJsonT,
    T Function(List<dynamic>)? fromJsonList,
  }) async {
    return _execute(
      () => _dio.patch(path, data: data, queryParameters: queryParameters),
      fromJsonT: fromJsonT,
      fromJsonList: fromJsonList,
    );
  }

  Future<ApiResponse<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    T Function(Map<String, dynamic>)? fromJsonT,
    T Function(List<dynamic>)? fromJsonList,
  }) async {
    return _execute(
      () => _dio.put(path, data: data, queryParameters: queryParameters),
      fromJsonT: fromJsonT,
      fromJsonList: fromJsonList,
    );
  }

  Future<ApiResponse<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    T Function(Map<String, dynamic>)? fromJsonT,
    T Function(List<dynamic>)? fromJsonList,
  }) async {
    return _execute(
      () => _dio.delete(path, data: data, queryParameters: queryParameters),
      fromJsonT: fromJsonT,
      fromJsonList: fromJsonList,
    );
  }

  Future<ApiResponse<T>> _execute<T>(
    Future<Response> Function() request, {
    T Function(Map<String, dynamic>)? fromJsonT,
    T Function(List<dynamic>)? fromJsonList,
    int retryCount = 0,
  }) async {
    try {
      final response = await request();
      debugPrint('[ApiClient] Response OK: ${response.statusCode}');
      final data = response.data as Map<String, dynamic>? ?? <String, dynamic>{};
      return ApiResponse<T>.fromJson(
        data,
        fromJsonT: fromJsonT,
        fromJsonList: fromJsonList,
      );
    } on DioException catch (e) {
      debugPrint('[ApiClient] DioException: type=${e.type} message=${e.message} url=${e.requestOptions.uri}');
      if (_isRetryable(e) && retryCount < ApiConstants.maxRetries) {
        await Future.delayed(Duration(seconds: 1 * (retryCount + 1)));
        return _execute(
          request,
          fromJsonT: fromJsonT,
          fromJsonList: fromJsonList,
          retryCount: retryCount + 1,
        );
      }
      throw ApiException.fromDioException(e);
    }
  }

  bool _isRetryable(DioException e) {
    return e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.connectionTimeout ||
        (e.type == DioExceptionType.badResponse &&
            e.response?.statusCode != null &&
            e.response!.statusCode! >= 500);
  }
}

class _VerboseLogInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    debugPrint('[HTTP -->] ${options.method} ${options.uri}');
    debugPrint('[HTTP -->] Headers: ${options.headers}');
    if (options.data != null) {
      debugPrint('[HTTP -->] Body: ${options.data}');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    debugPrint('[HTTP <--] ${response.statusCode} ${response.requestOptions.uri}');
    debugPrint('[HTTP <--] Body: ${response.data}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    debugPrint('[HTTP ERROR] ${err.type} ${err.message}');
    debugPrint('[HTTP ERROR] URL: ${err.requestOptions.uri}');
    if (err.response != null) {
      debugPrint('[HTTP ERROR] Status: ${err.response?.statusCode}');
      debugPrint('[HTTP ERROR] Body: ${err.response?.data}');
    }
    handler.next(err);
  }
}

class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.type != DioExceptionType.badResponse &&
        err.type != DioExceptionType.cancel &&
        err.response?.statusCode != 401) {
      handler.next(err);
      return;
    }
    handler.next(err);
  }
}
