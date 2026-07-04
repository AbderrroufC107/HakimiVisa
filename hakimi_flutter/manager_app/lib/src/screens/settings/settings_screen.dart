import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_providers.dart';
import '../../providers/theme_providers.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(authStateProvider.notifier).refreshProfile());
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final themeMode = ref.watch(themeModeProvider);
    final theme = Theme.of(context);
    final l10n = context.l10n;

    return Scaffold(
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AppCard(
            child: Column(
              children: [
                AvatarWidget(
                  initials: authState.user != null
                      ? '${authState.user!.firstName[0]}${authState.user!.lastName[0]}'
                      : '?',
                  size: 72,
                ),
                const SizedBox(height: 12),
                Text(
                  authState.user?.fullName ?? l10n.translate('user'),
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  authState.user?.email ?? '',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    authState.user?.role.name.capitalize ?? '',
                    style: TextStyle(
                      color: theme.colorScheme.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            l10n.translate('account'),
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          AppCard(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.person_outline),
                  title: Text(l10n.translate('editProfile')),
                  subtitle: Text(authState.user?.fullName ?? ''),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: authState.user == null
                      ? null
                      : () => _showEditProfileDialog(
                          context,
                          ref,
                          authState.user!,
                        ),
                ),
                if (authState.user?.role == UserRole.admin) ...[
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.manage_accounts_outlined),
                    title: Text(l10n.translate('createManager')),
                    subtitle: Text(l10n.translate('newManager')),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => _showCreateManagerDialog(context, ref),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            l10n.translate('appearance'),
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          AppCard(
            child: Column(
              children: [
                SwitchListTile(
                  title: Text(l10n.darkMode),
                  subtitle: Text(
                    themeMode == ThemeMode.dark
                        ? l10n.translate('darkModeEnabled')
                        : l10n.translate('darkModeDisabled'),
                    style: theme.textTheme.bodySmall,
                  ),
                  value: themeMode == ThemeMode.dark,
                  onChanged: (_) {
                    ref.read(themeModeProvider.notifier).toggleTheme();
                  },
                ),
                const Divider(height: 1),
                const LanguageSettingsTile(),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            l10n.translate('information'),
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          AppCard(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.info_outline),
                  title: Text(l10n.version),
                  trailing: const Text('1.0.0'),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.storage),
                  title: Text(l10n.translate('cache')),
                  trailing: TextButton(
                    onPressed: () {},
                    child: Text(l10n.translate('clear')),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Developer',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          AppCard(
            child: ListTile(
              leading: const Icon(Icons.developer_mode),
              title: const Text('Developer Settings'),
              subtitle: const Text('Server URL, connection, latency'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/developer-settings'),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              onPressed: () => _showLogoutConfirmation(context, ref),
              icon: const Icon(Icons.logout),
              label: Text(l10n.logout),
              style: ElevatedButton.styleFrom(
                backgroundColor: theme.colorScheme.error,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showLogoutConfirmation(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.logout),
        content: Text(l10n.translate('logoutConfirm')),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(l10n.cancel),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              await ref.read(authStateProvider.notifier).logout();
            },
            child: Text(l10n.logout),
          ),
        ],
      ),
    );
  }

  void _showEditProfileDialog(
    BuildContext context,
    WidgetRef ref,
    UserModel user,
  ) {
    final l10n = context.l10n;
    final formKey = GlobalKey<FormState>();
    final firstNameController = TextEditingController(text: user.firstName);
    final lastNameController = TextEditingController(text: user.lastName);
    var isSaving = false;

    showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (builderContext, setState) {
          return AlertDialog(
            title: Text(l10n.translate('editProfile')),
            content: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: firstNameController,
                    decoration: InputDecoration(
                      labelText: l10n.translate('firstName'),
                    ),
                    textInputAction: TextInputAction.next,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return l10n.required;
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: lastNameController,
                    decoration: InputDecoration(
                      labelText: l10n.translate('lastName'),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return l10n.required;
                      }
                      return null;
                    },
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: isSaving
                    ? null
                    : () => Navigator.of(dialogContext).pop(),
                child: Text(l10n.cancel),
              ),
              ElevatedButton(
                onPressed: isSaving
                    ? null
                    : () async {
                        if (!formKey.currentState!.validate()) return;

                        setState(() => isSaving = true);
                        try {
                          await ref
                              .read(authStateProvider.notifier)
                              .updateProfile(
                                firstName: firstNameController.text.trim(),
                                lastName: lastNameController.text.trim(),
                              );
                          if (dialogContext.mounted) {
                            Navigator.of(dialogContext).pop();
                          }
                          if (context.mounted) {
                            context.showSuccess(
                              l10n.translate('profileUpdated'),
                            );
                          }
                        } on ApiException catch (e) {
                          if (context.mounted) context.showError(e.message);
                          setState(() => isSaving = false);
                        } catch (e) {
                          if (context.mounted) {
                            context.showError(l10n.errorOccurred);
                          }
                          setState(() => isSaving = false);
                        }
                      },
                child: isSaving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(l10n.save),
              ),
            ],
          );
        },
      ),
    ).whenComplete(() {
      firstNameController.dispose();
      lastNameController.dispose();
    });
  }

  void _showCreateManagerDialog(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final formKey = GlobalKey<FormState>();
    final firstNameController = TextEditingController();
    final lastNameController = TextEditingController();
    final emailController = TextEditingController();
    final passwordController = TextEditingController();
    var isSaving = false;

    showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (builderContext, setState) {
          return AlertDialog(
            title: Text(l10n.translate('newManager')),
            content: Form(
              key: formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextFormField(
                      controller: firstNameController,
                      decoration: InputDecoration(
                        labelText: l10n.translate('firstName'),
                      ),
                      textInputAction: TextInputAction.next,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return l10n.required;
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: AppSpacing.md),
                    TextFormField(
                      controller: lastNameController,
                      decoration: InputDecoration(
                        labelText: l10n.translate('lastName'),
                      ),
                      textInputAction: TextInputAction.next,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return l10n.required;
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: AppSpacing.md),
                    TextFormField(
                      controller: emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(labelText: l10n.email),
                      textInputAction: TextInputAction.next,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return l10n.required;
                        }
                        final emailError = AppValidators.email(value);
                        return emailError == null ? null : l10n.invalidEmail;
                      },
                    ),
                    const SizedBox(height: AppSpacing.md),
                    TextFormField(
                      controller: passwordController,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: l10n.translate('password'),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return l10n.required;
                        }
                        if (value.length < 8) {
                          return l10n.passwordMin;
                        }
                        return null;
                      },
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: isSaving
                    ? null
                    : () => Navigator.of(dialogContext).pop(),
                child: Text(l10n.cancel),
              ),
              ElevatedButton(
                onPressed: isSaving
                    ? null
                    : () async {
                        if (!formKey.currentState!.validate()) return;

                        setState(() => isSaving = true);
                        try {
                          await ref
                              .read(authStateProvider.notifier)
                              .createManager(
                                email: emailController.text.trim(),
                                password: passwordController.text,
                                firstName: firstNameController.text.trim(),
                                lastName: lastNameController.text.trim(),
                              );
                          if (dialogContext.mounted) {
                            Navigator.of(dialogContext).pop();
                          }
                          if (context.mounted) {
                            context.showSuccess(
                              l10n.translate('managerCreated'),
                            );
                          }
                        } on ApiException catch (e) {
                          if (context.mounted) context.showError(e.message);
                          setState(() => isSaving = false);
                        } catch (e) {
                          if (context.mounted) {
                            context.showError(l10n.errorOccurred);
                          }
                          setState(() => isSaving = false);
                        }
                      },
                child: isSaving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(l10n.create),
              ),
            ],
          );
        },
      ),
    ).whenComplete(() {
      firstNameController.dispose();
      lastNameController.dispose();
      emailController.dispose();
      passwordController.dispose();
    });
  }
}
