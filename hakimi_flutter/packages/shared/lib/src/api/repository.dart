import 'api_client.dart';
import 'api_exception.dart';
import 'api_response.dart';
import '../models/paginated_response.dart';
import '../models/pagination_model.dart';

class PaginationParams {
  final int page;
  final int limit;
  final String? sortBy;
  final String? sortOrder;

  const PaginationParams({
    this.page = 1,
    this.limit = 20,
    this.sortBy,
    this.sortOrder,
  });

  Map<String, dynamic> toQueryParameters() {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
    };
    if (sortBy != null) params['sortBy'] = sortBy;
    if (sortOrder != null) params['sortOrder'] = sortOrder;
    return params;
  }
}

abstract class BaseRepository {
  final ApiClient apiClient;

  BaseRepository(this.apiClient);

  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    T Function(Map<String, dynamic>)? fromJsonT,
    T Function(List<dynamic>)? fromJsonList,
  }) async {
    try {
      return await apiClient.get(
        path,
        queryParameters: queryParameters,
        fromJsonT: fromJsonT,
        fromJsonList: fromJsonList,
      );
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    T Function(Map<String, dynamic>)? fromJsonT,
    T Function(List<dynamic>)? fromJsonList,
  }) async {
    try {
      return await apiClient.post(
        path,
        data: data,
        queryParameters: queryParameters,
        fromJsonT: fromJsonT,
        fromJsonList: fromJsonList,
      );
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<ApiResponse<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    T Function(Map<String, dynamic>)? fromJsonT,
    T Function(List<dynamic>)? fromJsonList,
  }) async {
    try {
      return await apiClient.patch(
        path,
        data: data,
        queryParameters: queryParameters,
        fromJsonT: fromJsonT,
        fromJsonList: fromJsonList,
      );
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<ApiResponse<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    T Function(Map<String, dynamic>)? fromJsonT,
    T Function(List<dynamic>)? fromJsonList,
  }) async {
    try {
      return await apiClient.put(
        path,
        data: data,
        queryParameters: queryParameters,
        fromJsonT: fromJsonT,
        fromJsonList: fromJsonList,
      );
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<ApiResponse<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    T Function(Map<String, dynamic>)? fromJsonT,
    T Function(List<dynamic>)? fromJsonList,
  }) async {
    try {
      return await apiClient.delete(
        path,
        data: data,
        queryParameters: queryParameters,
        fromJsonT: fromJsonT,
        fromJsonList: fromJsonList,
      );
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<PaginatedResponse<T>> getPaginated<T>(
    String path, {
    PaginationParams? pagination,
    required T Function(Map<String, dynamic>) fromItem,
  }) async {
    final response = await apiClient.get<Map<String, dynamic>>(
      path,
      queryParameters: pagination?.toQueryParameters(),
    );

    if (response.data == null) {
      return PaginatedResponse<T>(
        data: [],
        meta: const PaginationMeta(
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        ),
      );
    }

    return PaginatedResponse<T>.fromJson(
      response.data!,
      fromItem,
    );
  }
}
