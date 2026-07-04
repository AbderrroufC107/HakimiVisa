class AppValidators {
  AppValidators._();

  static String? required(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Ce champ est obligatoire';
    }
    return null;
  }

  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) return null;
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );
    if (!emailRegex.hasMatch(value)) {
      return 'Veuillez entrer une adresse email valide';
    }
    return null;
  }

  static String? phone(String? value) {
    if (value == null || value.trim().isEmpty) return null;
    final phoneRegex = RegExp(r'^\+?[\d\s\-()]{7,20}$');
    if (!phoneRegex.hasMatch(value)) {
      return 'Veuillez entrer un numéro de téléphone valide';
    }
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) return null;
    if (value.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères';
    }
    return null;
  }

  static String? url(String? value) {
    if (value == null || value.trim().isEmpty) return null;
    final urlRegex = RegExp(
      r'^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-\.~:/?#\[\]@!$&()*+,;=]*)?$',
    );
    if (!urlRegex.hasMatch(value)) {
      return 'Veuillez entrer une URL valide';
    }
    return null;
  }

  static String? min(int minLength, String? value) {
    if (value == null || value.isEmpty) return null;
    if (value.length < minLength) {
      return 'Ce champ doit contenir au moins $minLength caractères';
    }
    return null;
  }

  static String? max(int maxLength, String? value) {
    if (value == null || value.isEmpty) return null;
    if (value.length > maxLength) {
      return 'Ce champ ne doit pas dépasser $maxLength caractères';
    }
    return null;
  }
}
