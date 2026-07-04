import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../providers/auth_providers.dart';
import '../screens/login/login_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/clients/clients_list_screen.dart';
import '../screens/clients/create_client_screen.dart';
import '../screens/clients/client_detail_screen.dart';
import '../screens/clients/timeline_screen.dart';
import '../screens/kanban/kanban_screen.dart';
import '../screens/appointments/appointments_list_screen.dart';
import '../screens/appointments/create_appointment_screen.dart';
import '../screens/notifications/notifications_list_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/visa_cases/visa_case_detail_screen.dart';
import '../widgets/main_shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isAuthenticated = authState.status == AuthStatus.authenticated;
      final isLoginRoute = state.matchedLocation == '/login';

      if (!isAuthenticated && !isLoginRoute) {
        return '/login';
      }
      if (isAuthenticated && isLoginRoute) {
        return '/';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: '/',
            name: 'dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/clients',
            name: 'clients',
            builder: (context, state) => const ClientsListScreen(),
            routes: [
              GoRoute(
                path: 'new',
                name: 'create-client',
                builder: (context, state) => const CreateClientScreen(),
              ),
              GoRoute(
                path: ':id',
                name: 'client-detail',
                builder: (context, state) => ClientDetailScreen(
                  clientId: state.pathParameters['id']!,
                ),
                routes: [
                  GoRoute(
                    path: 'timeline',
                    name: 'client-timeline',
                    builder: (context, state) => TimelineScreen(
                      clientId: state.pathParameters['id']!,
                    ),
                  ),
                ],
              ),
            ],
          ),
          GoRoute(
            path: '/kanban',
            name: 'kanban',
            builder: (context, state) => const KanbanScreen(),
          ),
          GoRoute(
            path: '/appointments',
            name: 'appointments',
            builder: (context, state) => const AppointmentsListScreen(),
            routes: [
              GoRoute(
                path: 'new',
                name: 'create-appointment',
                builder: (context, state) => const CreateAppointmentScreen(),
              ),
            ],
          ),
          GoRoute(
            path: '/notifications',
            name: 'notifications',
            builder: (context, state) => const NotificationsListScreen(),
          ),
          GoRoute(
            path: '/settings',
            name: 'settings',
            builder: (context, state) => const SettingsScreen(),
          ),
          GoRoute(
            path: '/developer-settings',
            name: 'developer-settings',
            builder: (context, state) => const DevSettingsScreen(),
          ),
          GoRoute(
            path: '/visa-cases/:id',
            name: 'visa-case-detail',
            builder: (context, state) => VisaCaseDetailScreen(
              caseId: state.pathParameters['id']!,
            ),
          ),
        ],
      ),
    ],
  );
});
