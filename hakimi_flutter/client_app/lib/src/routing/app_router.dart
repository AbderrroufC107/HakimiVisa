import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../screens/tracking/phone_input_screen.dart';
import '../screens/tracking/tracking_results_screen.dart';
import '../screens/tracking/tracking_detail_screen.dart';
import '../screens/tracking/client_timeline_screen.dart';
import '../screens/settings/client_settings_screen.dart';
import '../screens/help/help_screen.dart';
import '../screens/contact/contact_screen.dart';
import '../widgets/tracking_bottom_nav.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/tracking',
    routes: [
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) {
          return TrackingBottomNav(child: child);
        },
        routes: [
          GoRoute(
            path: '/tracking',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: PhoneInputScreen(),
            ),
          ),
          GoRoute(
            path: '/tracking/results',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: TrackingResultsScreen(),
            ),
          ),
          GoRoute(
            path: '/tracking/:caseNumber',
            pageBuilder: (context, state) => NoTransitionPage(
              child: TrackingDetailScreen(
                caseNumber: state.pathParameters['caseNumber']!,
              ),
            ),
          ),
          GoRoute(
            path: '/settings',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ClientSettingsScreen(),
            ),
          ),
        ],
      ),
      GoRoute(
        path: '/tracking/:caseNumber/timeline',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => ClientTimelineScreen(
          caseNumber: state.pathParameters['caseNumber']!,
        ),
      ),
      GoRoute(
        path: '/help',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const HelpScreen(),
      ),
      GoRoute(
        path: '/contact',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const ContactScreen(),
      ),
    ],
  );
});
