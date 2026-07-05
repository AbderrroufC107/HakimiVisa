import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import 'service_providers.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final UserModel? user;
  final String? error;
  final bool isLoading;

  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
    this.error,
    this.isLoading = false,
  });

  AuthState copyWith({
    AuthStatus? status,
    UserModel? user,
    String? error,
    bool? isLoading,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: error,
      isLoading: isLoading ?? this.isLoading,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AuthState &&
          runtimeType == other.runtimeType &&
          status == other.status &&
          user?.id == other.user?.id &&
          error == other.error &&
          isLoading == other.isLoading;

  @override
  int get hashCode => Object.hash(status, user?.id, error, isLoading);
}

class AuthNotifier extends Notifier<AuthState> {
  StreamSubscription? _tokenSubscription;

  @override
  AuthState build() {
    _listenToTokenChanges();
    _checkExistingSession();
    return const AuthState();
  }

  void _listenToTokenChanges() {
    _tokenSubscription = TokenStorage.instance.tokenStream.listen((tokens) {
      if (tokens == null) {
        state = const AuthState(status: AuthStatus.unauthenticated);
      } else if (state.status != AuthStatus.authenticated) {
        _loadProfile();
      }
    });
  }

  Future<void> _checkExistingSession() async {
    final token = await TokenStorage.instance.getAccessToken();
    if (token != null && token.isNotEmpty) {
      _loadProfile();
    } else {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> _loadProfile() async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.get<UserModel>(
        ApiConstants.profile,
        fromJsonT: (json) => UserModel.fromJson(json),
      );
      if (response.data != null) {
        final newUser = response.data!;
        if (state.user?.id == newUser.id && state.status == AuthStatus.authenticated) {
          state = state.copyWith(user: newUser);
        } else {
          state = AuthState(
            status: AuthStatus.authenticated,
            user: newUser,
          );
        }
      } else {
        state = const AuthState(status: AuthStatus.unauthenticated);
      }
    } catch (_) {
      if (state.status != AuthStatus.authenticated) {
        state = const AuthState(status: AuthStatus.unauthenticated);
      }
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final authService = ref.read(authServiceProvider);
      final tokens = await authService.login(email, password);
      state = AuthState(
        status: AuthStatus.authenticated,
        user: tokens.user,
        isLoading: false,
      );
    } on ApiException catch (e) {
      state = AuthState(
        status: AuthStatus.unauthenticated,
        error: e.message,
        isLoading: false,
      );
      rethrow;
    } catch (e) {
      state = AuthState(
        status: AuthStatus.unauthenticated,
        error: e.toString(),
        isLoading: false,
      );
      rethrow;
    }
  }

  Future<void> refreshProfile() async {
    final token = await TokenStorage.instance.getAccessToken();
    if (token != null && token.isNotEmpty) {
      await _loadProfile();
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    try {
      final authService = ref.read(authServiceProvider);
      await authService.logout();
    } catch (_) {}
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  Future<void> updateProfile({
    required String firstName,
    required String lastName,
  }) async {
    final apiClient = ref.read(apiClientProvider);
    final response = await apiClient.patch<UserModel>(
      ApiConstants.profile,
      data: {'firstName': firstName, 'lastName': lastName},
      fromJsonT: (json) => UserModel.fromJson(json),
    );

    if (response.data != null) {
      state = state.copyWith(user: response.data);
    }
  }

  Future<UserModel?> createManager({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
  }) async {
    final apiClient = ref.read(apiClientProvider);
    final response = await apiClient.post<UserModel>(
      ApiConstants.managerUsers,
      data: {
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
      },
      fromJsonT: (json) => UserModel.fromJson(json),
    );
    return response.data;
  }

  void dispose() {
    _tokenSubscription?.cancel();
  }
}

final authStateProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);
