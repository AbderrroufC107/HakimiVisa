enum UserRole {
  admin,
  manager,
  agent,
  viewer;

  String toJson() => name;

  static UserRole fromJson(String json) {
    final normalized = json.toLowerCase();
    return UserRole.values.firstWhere(
      (e) => e.name == normalized,
      orElse: () => UserRole.viewer,
    );
  }
}
