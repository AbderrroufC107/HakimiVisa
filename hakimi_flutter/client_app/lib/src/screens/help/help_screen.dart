import 'package:flutter/material.dart';
import 'package:hakimi_shared/shared.dart';
import 'package:go_router/go_router.dart';

class HelpScreen extends StatefulWidget {
  const HelpScreen({super.key});

  @override
  State<HelpScreen> createState() => _HelpScreenState();
}

class _HelpScreenState extends State<HelpScreen> {
  int? _expandedIndex;

  final _faqItems = [
    {
      'question': 'Comment suivre ma demande de visa ?',
      'answer':
          'Entrez votre numéro de téléphone dans la page d\'accueil pour retrouver tous vos dossiers de visa. Vous pouvez également ajouter un numéro de dossier pour affiner la recherche.',
    },
    {
      'question': 'Que signifient les différents statuts ?',
      'answer':
          '• En attente : Votre dossier a été créé mais n\'est pas encore en traitement.\n'
          '• En traitement : Votre dossier est en cours d\'examen.\n'
          '• RDV OK : Un rendez-vous a été fixé.\n'
          '• Visa OK : Votre visa a été approuvé.\n'
          '• Visa refusée : Votre demande de visa a été refusée.',
    },
    {
      'question': 'Comment puis-je prendre un rendez-vous ?',
      'answer':
          'Les rendez-vous sont planifiés par notre équipe. Vous serez notifié dès qu\'un créneau vous sera attribué. Consultez l\'onglet "Rendez-vous" pour voir vos rendez-vous.',
    },
    {
      'question': 'Comment télécharger mes documents ?',
      'answer':
          'Rendez-vous dans l\'onglet "Documents" pour voir tous les documents associés à vos dossiers. Appuyez sur le bouton de téléchargement à côté de chaque document.',
    },
    {
      'question': 'Comment contacter l\'agence ?',
      'answer':
          'Vous pouvez nous contacter via l\'onglet "Contact" ou en vous rendant directement à notre agence aux heures d\'ouverture.',
    },
    {
      'question': 'Les informations sont-elles mises à jour en temps réel ?',
      'answer':
          'Oui, dès qu\'un changement est effectué sur votre dossier par notre équipe, les informations sont mises à jour instantanément.',
    },
    {
      'question': 'Puis-je suivre plusieurs dossiers avec le même numéro ?',
      'answer':
          'Oui, si vous avez plusieurs demandes de visa, elles apparaîtront toutes lors de la recherche avec votre numéro de téléphone.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final theme = context.theme;

    return Scaffold(
      appBar: AppBar(title: const Text('Aide')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primary.withValues(alpha: 0.08),
                  AppColors.primaryLight.withValues(alpha: 0.04),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(AppSpacing.borderRadiusLarge),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.help_outline,
                  size: 48,
                  color: AppColors.primary,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Comment pouvons-nous vous aider ?',
                  style: theme.textTheme.titleLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Consultez les questions fréquentes ou contactez-nous',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'Questions fréquentes',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          ..._faqItems.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            final isExpanded = _expandedIndex == index;

            return Card(
              margin: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: InkWell(
                onTap: () {
                  setState(() {
                    _expandedIndex = isExpanded ? null : index;
                  });
                },
                borderRadius: BorderRadius.circular(AppSpacing.borderRadiusMedium),
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              item['question']!,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          Icon(
                            isExpanded
                                ? Icons.expand_less
                                : Icons.expand_more,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ],
                      ),
                      if (isExpanded) ...[
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          item['answer']!,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            );
          }),
          const SizedBox(height: AppSpacing.lg),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                children: [
                  Icon(
                    Icons.support_agent_outlined,
                    size: 40,
                    color: AppColors.primary,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Vous n\'avez pas trouvé votre réponse ?',
                    style: theme.textTheme.titleMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Notre équipe est là pour vous aider',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  ElevatedButton(
                    onPressed: () => context.push('/contact'),
                    child: const Text('Nous contacter'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
