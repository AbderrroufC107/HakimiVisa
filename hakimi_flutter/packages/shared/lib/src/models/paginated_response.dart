import 'package:hakimi_shared/src/models/pagination_model.dart';

class PaginatedResponse<T> {
  final List<T> data;
  final PaginationMeta meta;

  const PaginatedResponse({
    required this.data,
    required this.meta,
  });

  factory PaginatedResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJsonT,
  ) {
    return PaginatedResponse(
      data: (json['data'] as List<dynamic>)
          .map((e) => fromJsonT(e as Map<String, dynamic>))
          .toList(),
      meta: PaginationMeta.fromJson(json['meta'] as Map<String, dynamic>),
    );
  }

  Map<String, dynamic> toJson(Map<String, dynamic> Function(T) toJsonT) {
    return {
      'data': data.map((e) => toJsonT(e)).toList(),
      'meta': meta.toJson(),
    };
  }
}
