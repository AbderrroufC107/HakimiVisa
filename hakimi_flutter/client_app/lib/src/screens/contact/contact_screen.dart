import 'package:flutter/material.dart';
import 'package:hakimi_shared/shared.dart';

class ContactScreen extends StatelessWidget {
  const ContactScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = context.theme;

    return Scaffold(
      appBar: AppBar(title: const Text('Contact')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.business,
                      size: 40,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    'Hakimi Visa',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Agence de services visa',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Card(
            child: Column(
              children: [
                _ContactTile(
                  icon: Icons.location_on_outlined,
                  label: 'Adresse',
                  value: '123 Avenue Mohammed V\nCasablanca 20000, Maroc',
                ),
                const Divider(height: 1, indent: 72),
                _ContactTile(
                  icon: Icons.phone_outlined,
                  label: 'Téléphone',
                  value: '+212 5 22 12 34 56',
                ),
                const Divider(height: 1, indent: 72),
                _ContactTile(
                  icon: Icons.email_outlined,
                  label: 'Email',
                  value: 'contact@hakimivisa.ma',
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.access_time,
                        size: 20,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Text(
                        'Horaires d\'ouverture',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.md),
                  _HoursRow(day: 'Lundi - Jeudi', hours: '09:00 - 17:00'),
                  _HoursRow(day: 'Vendredi', hours: '09:00 - 12:00'),
                  _HoursRow(day: 'Samedi - Dimanche', hours: 'Fermé'),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.map_outlined,
                        size: 20,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Text(
                        'Notre localisation',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Container(
                    height: 180,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(
                        AppSpacing.borderRadiusMedium,
                      ),
                    ),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.map_outlined,
                            size: 48,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          Text(
                            '123 Avenue Mohammed V, Casablanca',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    context.showSnackBar('Appel en cours...');
                  },
                  icon: const Icon(Icons.phone_outlined),
                  label: const Text('Appeler'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(0, 50),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    context.showSnackBar('Email envoyé');
                  },
                  icon: const Icon(Icons.email_outlined),
                  label: const Text('Envoyer un email'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(0, 50),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
        ],
      ),
    );
  }
}

class _ContactTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _ContactTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primary),
      title: Text(label),
      subtitle: Text(value),
    );
  }
}

class _HoursRow extends StatelessWidget {
  final String day;
  final String hours;

  const _HoursRow({required this.day, required this.hours});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(day, style: context.textTheme.bodyMedium),
          Text(
            hours,
            style: context.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w500,
              color: hours == 'Fermé'
                  ? AppColors.error
                  : context.colorScheme.onSurface,
            ),
          ),
        ],
      ),
    );
  }
}
