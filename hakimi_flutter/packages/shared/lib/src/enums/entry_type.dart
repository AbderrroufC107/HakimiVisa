enum EntryType {
  single,
  multiple;

  String get displayName {
    switch (this) {
      case EntryType.single:
        return 'Entrée simple';
      case EntryType.multiple:
        return 'Entrées multiples';
    }
  }

  String toJson() => name;

  static EntryType fromJson(String json) {
    return EntryType.values.firstWhere(
      (e) => e.name.toLowerCase() == json.toLowerCase(),
      orElse: () => EntryType.single,
    );
  }
}
