import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/tracking_providers.dart';

class PhoneInputScreen extends ConsumerStatefulWidget {
  const PhoneInputScreen({super.key});

  @override
  ConsumerState<PhoneInputScreen> createState() => _PhoneInputScreenState();
}

class _PhoneInputScreenState extends ConsumerState<PhoneInputScreen> {
  final _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final phone = _phoneController.text.trim();

    ref.read(trackedPhoneProvider.notifier).state = phone;
    ref.read(trackedReferenceProvider.notifier).state = '';

    try {
      final params = (phone: phone, reference: '');
      ref.invalidate(trackingSearchProvider(params));
      await ref.read(trackingSearchProvider(params).future);

      if (mounted) context.push('/tracking/results');
    } on ApiException catch (e) {
      if (mounted) context.showError(e.message);
    } catch (e) {
      if (mounted) context.showError(context.l10n.errorOccurred);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = context.theme;
    final l10n = context.l10n;

    return Scaffold(
      body: SingleChildScrollView(
        physics: const ClampingScrollPhysics(),
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: EdgeInsets.only(
                top: context.mediaQuery.padding.top + AppSpacing.xl,
                bottom: AppSpacing.xxl,
              ),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [AppColors.primary, AppColors.primaryLight],
                ),
              ),
              child: Column(
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(
                      Icons.visibility_outlined,
                      size: 44,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    l10n.appName,
                    style: theme.textTheme.displaySmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    l10n.translate('appTagline'),
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.9),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(AppSpacing.lg),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              l10n.translate('searchMyCase'),
                              style: theme.textTheme.titleLarge,
                            ),
                            const SizedBox(height: AppSpacing.md),
                            Directionality(
                              textDirection: TextDirection.ltr,
                              child: TextFormField(
                                controller: _phoneController,
                                keyboardType: TextInputType.phone,
                                textDirection: TextDirection.ltr,
                                decoration: const InputDecoration(
                                  labelText: 'Phone Number *',
                                  hintText: 'Ex: +212 6 12 34 56 78',
                                  prefixIcon: Icon(Icons.phone_outlined),
                                ),
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty) {
                                    return l10n.translate('phoneNumberRequired');
                                  }
                                  return null;
                                },
                              ),
                            ),
                            const SizedBox(height: AppSpacing.lg),
                            SizedBox(
                              height: 50,
                              child: ElevatedButton(
                                onPressed: _isLoading ? null : _search,
                                child: _isLoading
                                    ? const SizedBox(
                                        width: 22,
                                        height: 22,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Colors.white,
                                        ),
                                      )
                                    : Text(
                                        l10n.search,
                                        style: const TextStyle(fontSize: 16),
                                      ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        TextButton.icon(
                          onPressed: () => context.push('/help'),
                          icon: const Icon(Icons.help_outline, size: 20),
                          label: Text(l10n.help),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        TextButton.icon(
                          onPressed: () => context.push('/contact'),
                          icon: const Icon(
                            Icons.contact_support_outlined,
                            size: 20,
                          ),
                          label: Text(l10n.translate('contact')),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Center(
                      child: TextButton.icon(
                        onPressed: () => context.push('/contact'),
                        icon: const Icon(Icons.business_outlined, size: 20),
                        label: Text(l10n.translate('agencyInfo')),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
