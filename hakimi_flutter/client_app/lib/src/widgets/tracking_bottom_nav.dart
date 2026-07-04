import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';

class TrackingBottomNav extends StatelessWidget {
  final Widget child;

  const TrackingBottomNav({super.key, required this.child});

  int _currentIndex(String location) {
    if (location.startsWith('/tracking')) return 0;
    if (location.startsWith('/settings')) return 1;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final l10n = context.l10n;

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex(location),
        onDestinationSelected: (index) {
          switch (index) {
            case 0:
              context.go('/tracking');
              break;
            case 1:
              context.go('/settings');
              break;
          }
        },
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.search_outlined),
            selectedIcon: const Icon(Icons.search),
            label: l10n.tracking,
          ),
          NavigationDestination(
            icon: const Icon(Icons.settings_outlined),
            selectedIcon: const Icon(Icons.settings),
            label: l10n.settings,
          ),
        ],
      ),
    );
  }
}
