class DocumentModel {
  final String? id;
  final String name;
  final String type;
  final String url;
  final String mimeType;
  final int size;
  final String? visaCaseId;

  const DocumentModel({
    this.id,
    required this.name,
    required this.type,
    required this.url,
    required this.mimeType,
    required this.size,
    this.visaCaseId,
  });

  factory DocumentModel.fromJson(Map<String, dynamic> json) {
    return DocumentModel(
      id: json['id'] as String?,
      name: json['name'] as String,
      type: json['type'] as String,
      url: json['url'] as String,
      mimeType: json['mimeType'] as String,
      size: json['size'] as int,
      visaCaseId: json['visaCaseId'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'url': url,
      'mimeType': mimeType,
      'size': size,
      'visaCaseId': visaCaseId,
    };
  }
}
