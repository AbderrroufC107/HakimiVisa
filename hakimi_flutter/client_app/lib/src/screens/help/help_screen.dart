import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';

class HelpScreen extends StatefulWidget {
  const HelpScreen({super.key});

  @override
  State<HelpScreen> createState() => _HelpScreenState();
}

class _HelpScreenState extends State<HelpScreen> {
  int? _expandedIndex;

  List<Map<String, String>> _faqItems(BuildContext context) {
    final language = context.l10n.locale.languageCode;
    if (language == 'ar') {
      return [
        {
          'question': 'كيف أتابع طلب التأشيرة؟',
          'answer':
              'أدخل رقم هاتفك في الصفحة الرئيسية للعثور على ملفاتك. ويمكنك إضافة رقم الملف لتضييق البحث.',
        },
        {
          'question': 'ماذا تعني الحالات المختلفة؟',
          'answer':
              'قيد الانتظار: تم إنشاء الملف ولم يبدأ العمل عليه. قيد المعالجة: الملف قيد المراجعة. الموعد مؤكد: تم تحديد موعد. Visa OK: تمت الموافقة. مرفوضة: تم رفض الطلب.',
        },
        {
          'question': 'كيف أحجز موعداً؟',
          'answer':
              'يتم تحديد المواعيد من طرف فريقنا. ستتلقى إشعاراً عند تخصيص موعد لك.',
        },
        {
          'question': 'كيف أحمّل مستنداتي؟',
          'answer':
              'افتح قسم المستندات ثم اضغط زر التحميل بجانب المستند المطلوب.',
        },
        {
          'question': 'كيف أتواصل مع الوكالة؟',
          'answer': 'استخدم قسم التواصل أو زر اتصل بنا من الصفحة الرئيسية.',
        },
        {
          'question': 'هل يتم تحديث المعلومات فوراً؟',
          'answer':
              'نعم، يتم تحديث المعلومات مباشرة بعد تعديل ملفك من طرف الفريق.',
        },
        {
          'question': 'هل يمكنني متابعة عدة ملفات؟',
          'answer': 'نعم، ستظهر كل ملفاتك عند البحث برقم هاتفك.',
        },
      ];
    }
    if (language == 'en') {
      return [
        {
          'question': 'How do I track my visa request?',
          'answer':
              'Enter your phone number on the home page to find your files. Add a case number to narrow the search.',
        },
        {
          'question': 'What do the different statuses mean?',
          'answer':
              'Pending means the file is waiting to be processed. Processing means it is under review. RDV OK means an appointment is confirmed. Delivered means the file is closed and ready.',
        },
        {
          'question': 'How can I book an appointment?',
          'answer':
              'Appointments are scheduled by our team. You will receive a notification when a slot is assigned.',
        },
        {
          'question': 'How do I download my documents?',
          'answer':
              'Open Documents and press the download button beside the required document.',
        },
        {
          'question': 'How can I contact the agency?',
          'answer':
              'Use the Contact section or the Contact us button on the home page.',
        },
        {
          'question': 'Are the details updated in real time?',
          'answer':
              'Yes, your information is updated immediately after our team changes your file.',
        },
        {
          'question': 'Can I track several files?',
          'answer':
              'Yes, all your files appear when you search with your phone number.',
        },
      ];
    }
    return [
      {
        'question': 'Comment suivre ma demande de visa ?',
        'answer':
            'Entrez votre numéro de téléphone sur la page d’accueil pour retrouver vos dossiers.',
      },
      {
        'question': 'Que signifient les différents statuts ?',
        'answer':
            'En attente signifie que le dossier attend son traitement. En traitement signifie qu’il est en cours d’examen. RDV OK signifie qu’un rendez-vous est fixé. Visa OK signifie que la demande est approuvée. Refusée signifie qu’elle est rejetée.',
      },
      {
        'question': 'Comment puis-je prendre un rendez-vous ?',
        'answer':
            'Les rendez-vous sont planifiés par notre équipe. Vous recevrez une notification lorsqu’un créneau sera attribué.',
      },
      {
        'question': 'Comment télécharger mes documents ?',
        'answer':
            'Ouvrez la section Documents puis appuyez sur le bouton de téléchargement.',
      },
      {
        'question': 'Comment contacter l’agence ?',
        'answer': 'Utilisez la section Contact ou le bouton Nous contacter.',
      },
      {
        'question': 'Les informations sont-elles mises à jour en temps réel ?',
        'answer':
            'Oui, les informations sont mises à jour immédiatement après toute modification.',
      },
      {
        'question': 'Puis-je suivre plusieurs dossiers ?',
        'answer':
            'Oui, tous vos dossiers apparaissent avec votre numéro de téléphone.',
      },
    ];
  }

  @override
  Widget build(BuildContext context) {
    final theme = context.theme;
    final l10n = context.l10n;
    final language = l10n.locale.languageCode;
    final isArabic = language == 'ar';
    final isEnglish = language == 'en';
    final items = _faqItems(context);
    final title = isArabic
        ? 'المساعدة'
        : isEnglish
        ? 'Help'
        : 'Aide';
    final intro = isArabic
        ? 'كيف يمكننا مساعدتك؟'
        : isEnglish
        ? 'How can we help you?'
        : 'Comment pouvons-nous vous aider ?';
    final introSubtitle = isArabic
        ? 'راجع الأسئلة الشائعة أو تواصل معنا'
        : isEnglish
        ? 'Check the FAQs or contact us'
        : 'Consultez les questions fréquentes ou contactez-nous';
    final faqTitle = isArabic
        ? 'الأسئلة الشائعة'
        : isEnglish
        ? 'Frequently asked questions'
        : 'Questions fréquentes';
    final contactTitle = isArabic
        ? 'لم تجد إجابتك؟'
        : isEnglish
        ? 'Didn’t find your answer?'
        : 'Vous n’avez pas trouvé votre réponse ?';
    final contactSubtitle = isArabic
        ? 'فريقنا جاهز لمساعدتك'
        : isEnglish
        ? 'Our team is here to help'
        : 'Notre équipe est là pour vous aider';
    final contactButton = isArabic
        ? 'تواصل معنا'
        : isEnglish
        ? 'Contact us'
        : 'Nous contacter';

    return Scaffold(
      appBar: AppBar(title: Text(title)),
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
              ),
              borderRadius: BorderRadius.circular(AppSpacing.borderRadiusLarge),
            ),
            child: Column(
              children: [
                Icon(Icons.help_outline, size: 48, color: AppColors.primary),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  intro,
                  style: theme.textTheme.titleLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  introSubtitle,
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
            faqTitle,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          ...items.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            final expanded = _expandedIndex == index;
            return Card(
              margin: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: InkWell(
                onTap: () =>
                    setState(() => _expandedIndex = expanded ? null : index),
                borderRadius: BorderRadius.circular(
                  AppSpacing.borderRadiusMedium,
                ),
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
                            expanded ? Icons.expand_less : Icons.expand_more,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ],
                      ),
                      if (expanded) ...[
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
                    contactTitle,
                    style: theme.textTheme.titleMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    contactSubtitle,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  ElevatedButton(
                    onPressed: () => context.push('/contact'),
                    child: Text(contactButton),
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
