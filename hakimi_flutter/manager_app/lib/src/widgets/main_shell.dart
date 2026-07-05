import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../providers/auth_providers.dart';
import '../providers/notifications_providers.dart';

class MainShell extends ConsumerWidget {
  final Widget child;

  const MainShell({super.key, required this.child});

  int? _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location == '/') return 0;
    if (location.startsWith('/clients')) return 1;
    if (location.startsWith('/kanban')) return 2;
    if (location.startsWith('/settings')) return 3;
    return null;
  }

  void _onTap(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/');
        break;
      case 1:
        context.go('/clients');
        break;
      case 2:
        context.go('/kanban');
        break;
      case 3:
        context.go('/settings');
        break;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final unreadAsync = ref.watch(unreadCountProvider);
    final currentIndex = _currentIndex(context);
    final theme = Theme.of(context);
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(currentIndex != null ? _titleForIndex(currentIndex, l10n) : ''),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => context.push('/clients?search='),
          ),
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () => context.push('/notifications'),
              ),
              unreadAsync.when(
                data: (count) {
                  if (count > 0) {
                    return Positioned(
                      right: 6,
                      top: 6,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          '$count',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    );
                  }
                  return const SizedBox();
                },
                error: (_, __) => const SizedBox(),
                loading: () => const SizedBox(),
              ),
            ],
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: BoxDecoration(color: theme.colorScheme.primary),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  AvatarWidget(
                    initials: authState.user != null &&
                            authState.user!.firstName.isNotEmpty &&
                            authState.user!.lastName.isNotEmpty
                        ? '${authState.user!.firstName[0]}${authState.user!.lastName[0]}'
                        : 'H',
                    size: 56,
                    backgroundColor: Colors.white,
                    foregroundColor: theme.colorScheme.primary,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    authState.user?.fullName ?? 'Hakimi Visa',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  Text(
                    authState.user?.email ?? '',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.8),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.dashboard),
              title: Text(l10n.dashboard),
              onTap: () {
                Navigator.of(context).pop();
                context.go('/');
              },
            ),
            ListTile(
              leading: const Icon(Icons.people),
              title: Text(l10n.clients),
              onTap: () {
                Navigator.of(context).pop();
                context.go('/clients');
              },
            ),
            ListTile(
              leading: const Icon(Icons.dashboard_customize),
              title: Text(l10n.kanban),
              onTap: () {
                Navigator.of(context).pop();
                context.go('/kanban');
              },
            ),
            ListTile(
              leading: const Icon(Icons.calendar_today),
              title: Text(l10n.appointments),
              onTap: () {
                Navigator.of(context).pop();
                context.go('/appointments');
              },
            ),
            ListTile(
              leading: const Icon(Icons.notifications),
              title: Text(l10n.notifications),
              onTap: () {
                Navigator.of(context).pop();
                context.push('/notifications');
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.settings),
              title: Text(l10n.settings),
              onTap: () {
                Navigator.of(context).pop();
                context.go('/settings');
              },
            ),
          ],
        ),
      ),
      body: child,
      bottomNavigationBar: currentIndex != null
          ? NavigationBar(
              selectedIndex: currentIndex,
              onDestinationSelected: (index) => _onTap(context, index),
              destinations: [
                NavigationDestination(
                  icon: const Icon(Icons.dashboard_outlined),
                  selectedIcon: const Icon(Icons.dashboard),
                  label: l10n.dashboard,
                ),
                NavigationDestination(
                  icon: const Icon(Icons.people_outlined),
                  selectedIcon: const Icon(Icons.people),
                  label: l10n.clients,
                ),
                NavigationDestination(
                  icon: const Icon(Icons.dashboard_customize_outlined),
                  selectedIcon: const Icon(Icons.dashboard_customize),
                  label: l10n.kanban,
                ),
                NavigationDestination(
                  icon: const Icon(Icons.settings_outlined),
                  selectedIcon: const Icon(Icons.settings),
                  label: l10n.settings,
                ),
              ],
            )
          : null,
    );
  }

  String _titleForIndex(int index, AppLocalizations l10n) {
    switch (index) {
      case 0:
        return l10n.dashboard;
      case 1:
        return l10n.clients;
      case 2:
        return l10n.kanban;
      case 3:
        return l10n.settings;
      default:
        return 'Hakimi Visa';
    }
  }
}
