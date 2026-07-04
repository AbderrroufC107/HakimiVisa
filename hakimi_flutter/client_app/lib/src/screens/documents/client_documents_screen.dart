import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/tracking_providers.dart';

class ClientDocumentsScreen extends ConsumerWidget {
  const ClientDocumentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final phone = ref.watch(trackedPhoneProvider);
    final asyncDocuments = ref.watch(clientDocumentsProvider(phone));

    return Scaffold(
      appBar: AppBar(title: const Text('Documents')),
      body: asyncDocuments.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => AppErrorWidget(
          message: error.toString(),
          onRetry: () => ref.invalidate(clientDocumentsProvider(phone)),
        ),
        data: (documents) {
          if (phone.isEmpty) {
            return const EmptyState(
              icon: Icons.phone_outlined,
              title: 'Recherchez d\'abord',
              subtitle: 'Entrez votre numéro de téléphone pour voir vos documents.',
            );
          }
          if (documents.isEmpty) {
            return const EmptyState(
              icon: Icons.description_outlined,
              title: 'Aucun document',
              subtitle: 'Aucun document n\'est disponible pour vos dossiers.',
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(clientDocumentsProvider(phone).future),
            child: ListView.builder(
              padding: const EdgeInsets.all(AppSpacing.md),
              itemCount: documents.length,
              itemBuilder: (context, index) {
                final doc = documents[index];
                return _DocumentCard(document: doc);
              },
            ),
          );
        },
      ),
    );
  }
}

class _DocumentCard extends StatelessWidget {
  final DocumentModel document;

  const _DocumentCard({required this.document});

  @override
  Widget build(BuildContext context) {
    final theme = context.theme;
    final fileIcon = _fileIcon(document.type);
    final fileColor = _fileColor(document.type);

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: AppCard(
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: fileColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(AppSpacing.borderRadiusSmall),
              ),
              child: Icon(fileIcon, color: fileColor, size: 24),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    document.name,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Text(
                        document.type.toUpperCase(),
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Text(
                        document.size.formatBytes(),
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.download_outlined),
              tooltip: 'Télécharger',
              onPressed: () {
                context.showSnackBar('Téléchargement de ${document.name}...');
              },
            ),
          ],
        ),
      ),
    );
  }

  IconData _fileIcon(String type) {
    switch (type) {
      case 'pdf':
        return Icons.picture_as_pdf;
      case 'image':
      case 'jpg':
      case 'jpeg':
      case 'png':
        return Icons.image_outlined;
      case 'word':
      case 'doc':
      case 'docx':
        return Icons.description_outlined;
      case 'excel':
      case 'xls':
      case 'xlsx':
        return Icons.table_chart_outlined;
      default:
        return Icons.insert_drive_file_outlined;
    }
  }

  Color _fileColor(String type) {
    switch (type) {
      case 'pdf':
        return Colors.red;
      case 'image':
      case 'jpg':
      case 'jpeg':
      case 'png':
        return Colors.green;
      case 'word':
      case 'doc':
      case 'docx':
        return Colors.blue;
      case 'excel':
      case 'xls':
      case 'xlsx':
        return Colors.teal;
      default:
        return AppColors.primary;
    }
  }
}
