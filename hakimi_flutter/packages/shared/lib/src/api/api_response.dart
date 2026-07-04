class ApiResponse<T> {
  final T? data;
  final String? message;
  final int? statusCode;

  const ApiResponse({
    this.data,
    this.message,
    this.statusCode,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json, {
    T Function(Map<String, dynamic>)? fromJsonT,
    T Function(List<dynamic>)? fromJsonList,
  }) {
    T? parsedData;

    final rawData = json['data'];
    if (rawData != null) {
      if (fromJsonT != null && rawData is Map<String, dynamic>) {
        parsedData = fromJsonT(rawData);
      } else if (fromJsonList != null && rawData is List<dynamic>) {
        parsedData = fromJsonList(rawData);
      } else if (fromJsonList != null &&
          rawData is Map<String, dynamic> &&
          rawData['data'] is List<dynamic>) {
        parsedData = fromJsonList(rawData['data'] as List<dynamic>);
      } else if (rawData is T) {
        parsedData = rawData;
      }
    }

    return ApiResponse<T>(
      data: parsedData,
      message: json['message'] as String?,
      statusCode: json['statusCode'] as int?,
    );
  }

  R? unwrap<R>(R Function(T data) transform) {
    if (data == null) return null;
    return transform(data as T);
  }

  bool get isSuccess => statusCode != null && statusCode! >= 200 && statusCode! < 300;
}
