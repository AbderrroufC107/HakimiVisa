import 'package:hakimi_shared/src/models/user_model.dart';

class AuthTokens {
  final UserModel user;
  final String accessToken;
  final String refreshToken;

  const AuthTokens({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
  });

  factory AuthTokens.fromJson(Map<String, dynamic> json) {
    return AuthTokens(
      user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
      accessToken: (json['access_token'] ?? json['accessToken']) as String,
      refreshToken: (json['refresh_token'] ?? json['refreshToken']) as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user': user.toJson(),
      'access_token': accessToken,
      'refresh_token': refreshToken,
    };
  }
}
