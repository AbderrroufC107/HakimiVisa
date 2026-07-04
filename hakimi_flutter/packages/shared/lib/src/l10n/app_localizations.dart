import 'package:flutter/material.dart';

class AppLocalizations {
  final Locale locale;

  const AppLocalizations(this.locale);

  static const List<Locale> supportedLocales = [
    Locale('fr'),
    Locale('en'),
    Locale('ar'),
  ];

  static const Locale defaultLocale = Locale('fr');

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations) ??
        const AppLocalizations(defaultLocale);
  }

  static const Map<String, Map<String, String>> _translations = {
    'fr': {
      'appName': 'Hakimi Visa',
      'appTagline': 'Suivez l\'évolution de votre demande de visa',
      'searchMyCase': 'Rechercher mon dossier',
      'phoneNumberRequired': 'Veuillez entrer votre numéro de téléphone',
      'caseNumberOptional': 'Numéro de dossier (optionnel)',
      'agencyInfo': 'Informations agence',
      'contact': 'Contact',
      'account': 'Compte',
      'editProfile': 'Modifier mon nom',
      'createManager': 'Ajouter un manager',
      'newManager': 'Nouveau manager',
      'firstName': 'Prénom',
      'lastName': 'Nom',
      'password': 'Mot de passe',
      'profileUpdated': 'Nom mis à jour',
      'managerCreated': 'Manager créé avec succès',
      'statusEnAttente': 'En attente',
      'statusEnTraitement': 'En traitement',
      'statusRdvOk': 'RDV OK',
      'statusVisaOk': 'Visa OK',
      'statusVisaRefusee': 'Visa refusée',
      'enableNotifications': 'Activer les notifications',
      'notificationsOn': 'Notifications activées',
      'notificationsOff': 'Notifications désactivées',
      'darkModeEnabled': 'Activé',
      'darkModeDisabled': 'Désactivé',
      'clearCache': 'Vider le cache',
      'freeSpace': 'Libérer de l\'espace',
      'sessionExpired': 'Session expirée. Veuillez rechercher à nouveau.',
      'cacheCleared': 'Cache vidé avec succès',
      'shareApp': 'Partager l\'application',
      'sharing': 'Partage...',
      'customerSupport': 'Support client',
      'aboutSubtitle': 'Hakimi Visa - Suivi de demandes',
      'appearance': 'Apparence',
      'information': 'Informations',
      'cache': 'Cache',
      'clear': 'Vider',
      'logoutConfirm': 'Voulez-vous vraiment vous déconnecter ?',
      'user': 'Utilisateur',
      'recentClients': 'Derniers clients',
      'upcomingAppointments': 'Prochains rendez-vous',
      'cases': 'Dossiers',
      'pending': 'En attente',
      'refused': 'Refusés',
      'noClient': 'Aucun client',
      'addFirstClient': 'Ajoutez votre premier client',
      'searchClient': 'Rechercher un client...',
      'recent': 'Récents',
      'withVisas': 'Avec visas',
      'searchCase': 'Rechercher un dossier...',
      'noCase': 'Aucun dossier',
      'noCaseToTrack': 'Aucun dossier à suivre pour le moment',
      'noCard': 'Aucune carte',
      'noUpcomingAppointment': 'Aucun rendez-vous à venir',
      'login': 'Connexion',
      'logout': 'Déconnexion',
      'dashboard': 'Tableau de bord',
      'clients': 'Clients',
      'client': 'Client',
      'visaCases': 'Dossiers visa',
      'visaCase': 'Dossier visa',
      'appointments': 'Rendez-vous',
      'appointment': 'Rendez-vous',
      'notifications': 'Notifications',
      'settings': 'Paramètres',
      'search': 'Rechercher',
      'cancel': 'Annuler',
      'save': 'Enregistrer',
      'delete': 'Supprimer',
      'confirm': 'Confirmer',
      'yes': 'Oui',
      'no': 'Non',
      'loading': 'Chargement...',
      'error': 'Erreur',
      'empty': 'Aucune donnée',
      'noResults': 'Aucun résultat',
      'tryAgain': 'Réessayer',
      'offline': 'Mode hors ligne',
      'online': 'En ligne',
      'welcome': 'Bienvenue',
      'profile': 'Profil',
      'edit': 'Modifier',
      'create': 'Créer',
      'update': 'Mettre à jour',
      'archive': 'Archiver',
      'unarchive': 'Désarchiver',
      'export': 'Exporter',
      'import': 'Importer',
      'filter': 'Filtrer',
      'sort': 'Trier',
      'refresh': 'Actualiser',
      'next': 'Suivant',
      'previous': 'Précédent',
      'done': 'Terminé',
      'close': 'Fermer',
      'info': 'Information',
      'success': 'Succès',
      'warning': 'Avertissement',
      'required': 'Ce champ est obligatoire',
      'invalidEmail': 'Email invalide',
      'invalidPhone': 'Numéro de téléphone invalide',
      'passwordMin': 'Le mot de passe doit contenir au moins 8 caractères',
      'home': 'Accueil',
      'analytics': 'Analytiques',
      'kanban': 'Suivi dossier',
      'tracking': 'Suivi',
      'documents': 'Documents',
      'users': 'Utilisateurs',
      'admin': 'Administration',
      'help': 'Aide',
      'about': 'À propos',
      'version': 'Version',
      'language': 'Langue',
      'theme': 'Thème',
      'darkMode': 'Mode sombre',
      'lightMode': 'Mode clair',
      'systemTheme': 'Thème système',
      'notificationsEnabled': 'Notifications activées',
      'emailNotifications': 'Notifications par email',
      'pushNotifications': 'Notifications push',
      'smsNotifications': 'Notifications SMS',
      'selectCountry': 'Sélectionner un pays',
      'selectStatus': 'Sélectionner un statut',
      'selectType': 'Sélectionner un type',
      'all': 'Tout',
      'today': 'Aujourd\'hui',
      'thisWeek': 'Cette semaine',
      'thisMonth': 'Ce mois',
      'custom': 'Personnalisé',
      'from': 'Du',
      'to': 'Au',
      'apply': 'Appliquer',
      'reset': 'Réinitialiser',
      'noData': 'Aucune donnée disponible',
      'loadingData': 'Chargement des données...',
      'errorOccurred': 'Une erreur est survenue',
      'retryMessage': 'Veuillez réessayer',
      'connectionLost': 'Connexion perdue',
      'connectionRestored': 'Connexion rétablie',
      'dataSaved': 'Données enregistrées',
      'dataDeleted': 'Données supprimées',
      'confirmDelete': 'Êtes-vous sûr de vouloir supprimer ?',
      'confirmArchive': 'Êtes-vous sûr de vouloir archiver ?',
      'operationSuccessful': 'Opération réussie',
      'operationFailed': 'Opération échouée',
      'passportNumber': 'Numéro de passeport',
      'nationality': 'Nationalité',
      'phoneNumber': 'Numéro de téléphone',
      'whatsappNumber': 'Numéro WhatsApp',
      'fullName': 'Nom complet',
      'email': 'Adresse email',
      'notes': 'Notes',
      'caseNumber': 'Numéro de dossier',
      'visaCountry': 'Pays de visa',
      'visaType': 'Type de visa',
      'currentStatus': 'Statut actuel',
      'openingDate': 'Date d\'ouverture',
      'createdAt': 'Créé le',
      'updatedAt': 'Mis à jour le',
      'archived': 'Archivé',
      'active': 'Actif',
      'inactive': 'Inactif',
    },
    'en': {
      'appName': 'Hakimi Visa',
      'appTagline': 'Track the progress of your visa application',
      'searchMyCase': 'Search my case',
      'phoneNumberRequired': 'Please enter your phone number',
      'caseNumberOptional': 'Case number (optional)',
      'agencyInfo': 'Agency information',
      'contact': 'Contact',
      'account': 'Account',
      'editProfile': 'Edit my name',
      'createManager': 'Add manager',
      'newManager': 'New manager',
      'firstName': 'First name',
      'lastName': 'Last name',
      'password': 'Password',
      'profileUpdated': 'Name updated',
      'managerCreated': 'Manager created successfully',
      'statusEnAttente': 'Pending',
      'statusEnTraitement': 'In process',
      'statusRdvOk': 'Appointment OK',
      'statusVisaOk': 'Visa OK',
      'statusVisaRefusee': 'Visa refused',
      'enableNotifications': 'Enable notifications',
      'notificationsOn': 'Notifications enabled',
      'notificationsOff': 'Notifications disabled',
      'darkModeEnabled': 'Enabled',
      'darkModeDisabled': 'Disabled',
      'clearCache': 'Clear cache',
      'freeSpace': 'Free up space',
      'sessionExpired': 'Session expired. Please search again.',
      'cacheCleared': 'Cache cleared successfully',
      'shareApp': 'Share app',
      'sharing': 'Sharing...',
      'customerSupport': 'Customer support',
      'aboutSubtitle': 'Hakimi Visa - Application tracking',
      'appearance': 'Appearance',
      'information': 'Information',
      'cache': 'Cache',
      'clear': 'Clear',
      'logoutConfirm': 'Do you really want to log out?',
      'user': 'User',
      'recentClients': 'Recent clients',
      'upcomingAppointments': 'Upcoming appointments',
      'cases': 'Cases',
      'pending': 'Pending',
      'refused': 'Refused',
      'noClient': 'No client',
      'addFirstClient': 'Add your first client',
      'searchClient': 'Search a client...',
      'recent': 'Recent',
      'withVisas': 'With visas',
      'searchCase': 'Search a case...',
      'noCase': 'No case',
      'noCaseToTrack': 'No case to track right now',
      'noCard': 'No card',
      'noUpcomingAppointment': 'No upcoming appointment',
      'login': 'Login',
      'logout': 'Logout',
      'dashboard': 'Dashboard',
      'clients': 'Clients',
      'client': 'Client',
      'visaCases': 'Visa Cases',
      'visaCase': 'Visa Case',
      'appointments': 'Appointments',
      'appointment': 'Appointment',
      'notifications': 'Notifications',
      'settings': 'Settings',
      'search': 'Search',
      'cancel': 'Cancel',
      'save': 'Save',
      'delete': 'Delete',
      'confirm': 'Confirm',
      'yes': 'Yes',
      'no': 'No',
      'loading': 'Loading...',
      'error': 'Error',
      'empty': 'No data',
      'noResults': 'No results',
      'tryAgain': 'Try again',
      'offline': 'Offline mode',
      'online': 'Online',
      'welcome': 'Welcome',
      'profile': 'Profile',
      'edit': 'Edit',
      'create': 'Create',
      'update': 'Update',
      'archive': 'Archive',
      'unarchive': 'Unarchive',
      'export': 'Export',
      'import': 'Import',
      'filter': 'Filter',
      'sort': 'Sort',
      'refresh': 'Refresh',
      'next': 'Next',
      'previous': 'Previous',
      'done': 'Done',
      'close': 'Close',
      'info': 'Information',
      'success': 'Success',
      'warning': 'Warning',
      'required': 'This field is required',
      'invalidEmail': 'Invalid email',
      'invalidPhone': 'Invalid phone number',
      'passwordMin': 'Password must be at least 8 characters',
      'home': 'Home',
      'analytics': 'Analytics',
      'kanban': 'Case tracking',
      'tracking': 'Tracking',
      'documents': 'Documents',
      'users': 'Users',
      'admin': 'Administration',
      'help': 'Help',
      'about': 'About',
      'version': 'Version',
      'language': 'Language',
      'theme': 'Theme',
      'darkMode': 'Dark mode',
      'lightMode': 'Light mode',
      'systemTheme': 'System theme',
      'notificationsEnabled': 'Notifications enabled',
      'emailNotifications': 'Email notifications',
      'pushNotifications': 'Push notifications',
      'smsNotifications': 'SMS notifications',
      'selectCountry': 'Select country',
      'selectStatus': 'Select status',
      'selectType': 'Select type',
      'all': 'All',
      'today': 'Today',
      'thisWeek': 'This week',
      'thisMonth': 'This month',
      'custom': 'Custom',
      'from': 'From',
      'to': 'To',
      'apply': 'Apply',
      'reset': 'Reset',
      'noData': 'No data available',
      'loadingData': 'Loading data...',
      'errorOccurred': 'An error occurred',
      'retryMessage': 'Please try again',
      'connectionLost': 'Connection lost',
      'connectionRestored': 'Connection restored',
      'dataSaved': 'Data saved',
      'dataDeleted': 'Data deleted',
      'confirmDelete': 'Are you sure you want to delete?',
      'confirmArchive': 'Are you sure you want to archive?',
      'operationSuccessful': 'Operation successful',
      'operationFailed': 'Operation failed',
      'passportNumber': 'Passport number',
      'nationality': 'Nationality',
      'phoneNumber': 'Phone number',
      'whatsappNumber': 'WhatsApp number',
      'fullName': 'Full name',
      'email': 'Email',
      'notes': 'Notes',
      'caseNumber': 'Case number',
      'visaCountry': 'Visa country',
      'visaType': 'Visa type',
      'currentStatus': 'Current status',
      'openingDate': 'Opening date',
      'createdAt': 'Created at',
      'updatedAt': 'Updated at',
      'archived': 'Archived',
      'active': 'Active',
      'inactive': 'Inactive',
    },
    'ar': {
      'appName': 'حكيمي فيزا',
      'appTagline': 'تابع تطور طلب التأشيرة',
      'searchMyCase': 'البحث عن ملفي',
      'phoneNumberRequired': 'يرجى إدخال رقم الهاتف',
      'caseNumberOptional': 'رقم الملف (اختياري)',
      'agencyInfo': 'معلومات الوكالة',
      'contact': 'اتصل بنا',
      'account': 'الحساب',
      'editProfile': 'تعديل اسمي',
      'createManager': 'إضافة مدير',
      'newManager': 'مدير جديد',
      'firstName': 'الاسم',
      'lastName': 'اللقب',
      'password': 'كلمة المرور',
      'profileUpdated': 'تم تحديث الاسم',
      'managerCreated': 'تم إنشاء المدير بنجاح',
      'statusEnAttente': 'قيد الانتظار',
      'statusEnTraitement': 'قيد المعالجة',
      'statusRdvOk': 'الموعد مؤكد',
      'statusVisaOk': 'التأشيرة مقبولة',
      'statusVisaRefusee': 'التأشيرة مرفوضة',
      'enableNotifications': 'تفعيل الإشعارات',
      'notificationsOn': 'تم تفعيل الإشعارات',
      'notificationsOff': 'تم إيقاف الإشعارات',
      'darkModeEnabled': 'مفعل',
      'darkModeDisabled': 'معطل',
      'clearCache': 'مسح التخزين المؤقت',
      'freeSpace': 'تحرير مساحة',
      'sessionExpired': 'انتهت الجلسة. الرجاء البحث مرة أخرى.',
      'cacheCleared': 'تم مسح التخزين المؤقت',
      'shareApp': 'مشاركة التطبيق',
      'sharing': 'جاري المشاركة...',
      'customerSupport': 'دعم العملاء',
      'aboutSubtitle': 'حكيمي فيزا - متابعة الطلبات',
      'appearance': 'المظهر',
      'information': 'معلومات',
      'cache': 'التخزين المؤقت',
      'clear': 'مسح',
      'logoutConfirm': 'هل تريد تسجيل الخروج؟',
      'user': 'مستخدم',
      'recentClients': 'آخر العملاء',
      'upcomingAppointments': 'المواعيد القادمة',
      'cases': 'الملفات',
      'pending': 'قيد الانتظار',
      'refused': 'مرفوضة',
      'noClient': 'لا يوجد عملاء',
      'addFirstClient': 'أضف أول عميل',
      'searchClient': 'البحث عن عميل...',
      'recent': 'الأحدث',
      'withVisas': 'لديهم تأشيرات',
      'searchCase': 'البحث عن ملف...',
      'noCase': 'لا يوجد ملف',
      'noCaseToTrack': 'لا يوجد ملف للمتابعة حالياً',
      'noCard': 'لا توجد بطاقة',
      'noUpcomingAppointment': 'لا توجد مواعيد قادمة',
      'login': 'تسجيل الدخول',
      'logout': 'تسجيل الخروج',
      'dashboard': 'لوحة القيادة',
      'clients': 'العملاء',
      'client': 'عميل',
      'visaCases': 'ملفات التأشيرة',
      'visaCase': 'ملف تأشيرة',
      'appointments': 'المواعيد',
      'appointment': 'موعد',
      'notifications': 'الإشعارات',
      'settings': 'الإعدادات',
      'search': 'بحث',
      'cancel': 'إلغاء',
      'save': 'حفظ',
      'delete': 'حذف',
      'confirm': 'تأكيد',
      'yes': 'نعم',
      'no': 'لا',
      'loading': 'جار التحميل...',
      'error': 'خطأ',
      'empty': 'لا توجد بيانات',
      'noResults': 'لا توجد نتائج',
      'tryAgain': 'حاول مرة أخرى',
      'offline': 'وضع عدم الاتصال',
      'online': 'متصل',
      'welcome': 'مرحباً',
      'profile': 'الملف الشخصي',
      'edit': 'تعديل',
      'create': 'إنشاء',
      'update': 'تحديث',
      'archive': 'أرشفة',
      'unarchive': 'إلغاء الأرشفة',
      'export': 'تصدير',
      'import': 'استيراد',
      'filter': 'تصفية',
      'sort': 'ترتيب',
      'refresh': 'تحديث',
      'next': 'التالي',
      'previous': 'السابق',
      'done': 'تم',
      'close': 'إغلاق',
      'info': 'معلومات',
      'success': 'نجاح',
      'warning': 'تحذير',
      'required': 'هذا الحقل مطلوب',
      'invalidEmail': 'بريد إلكتروني غير صالح',
      'invalidPhone': 'رقم هاتف غير صالح',
      'passwordMin': 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل',
      'home': 'الرئيسية',
      'analytics': 'التحليلات',
      'kanban': 'متابعة الملفات',
      'tracking': 'تتبع',
      'documents': 'المستندات',
      'users': 'المستخدمين',
      'admin': 'الإدارة',
      'help': 'مساعدة',
      'about': 'حول',
      'version': 'الإصدار',
      'language': 'اللغة',
      'theme': 'المظهر',
      'darkMode': 'الوضع الداكن',
      'lightMode': 'الوضع الفاتح',
      'systemTheme': 'مظهر النظام',
      'notificationsEnabled': 'الإشعارات مفعلة',
      'emailNotifications': 'إشعارات البريد الإلكتروني',
      'pushNotifications': 'إشعارات الدفع',
      'smsNotifications': 'إشعارات الرسائل القصيرة',
      'selectCountry': 'اختر الدولة',
      'selectStatus': 'اختر الحالة',
      'selectType': 'اختر النوع',
      'all': 'الكل',
      'today': 'اليوم',
      'thisWeek': 'هذا الأسبوع',
      'thisMonth': 'هذا الشهر',
      'custom': 'مخصص',
      'from': 'من',
      'to': 'إلى',
      'apply': 'تطبيق',
      'reset': 'إعادة تعيين',
      'noData': 'لا توجد بيانات متاحة',
      'loadingData': 'جار تحميل البيانات...',
      'errorOccurred': 'حدث خطأ',
      'retryMessage': 'يرجى المحاولة مرة أخرى',
      'connectionLost': 'انقطع الاتصال',
      'connectionRestored': 'تم استعادة الاتصال',
      'dataSaved': 'تم حفظ البيانات',
      'dataDeleted': 'تم حذف البيانات',
      'confirmDelete': 'هل أنت متأكد من الحذف؟',
      'confirmArchive': 'هل أنت متأكد من الأرشفة؟',
      'operationSuccessful': 'العملية ناجحة',
      'operationFailed': 'العملية فشلت',
      'passportNumber': 'رقم جواز السفر',
      'nationality': 'الجنسية',
      'phoneNumber': 'رقم الهاتف',
      'whatsappNumber': 'رقم واتساب',
      'fullName': 'الاسم الكامل',
      'email': 'البريد الإلكتروني',
      'notes': 'ملاحظات',
      'caseNumber': 'رقم الملف',
      'visaCountry': 'دولة التأشيرة',
      'visaType': 'نوع التأشيرة',
      'currentStatus': 'الحالة الحالية',
      'openingDate': 'تاريخ الفتح',
      'createdAt': 'تاريخ الإنشاء',
      'updatedAt': 'تاريخ التحديث',
      'archived': 'مؤرشف',
      'active': 'نشط',
      'inactive': 'غير نشط',
    },
  };

  String translate(String key) {
    return _translations[locale.languageCode]?[key] ??
        _translations['fr']?[key] ??
        key;
  }

  String get appName => translate('appName');
  String get login => translate('login');
  String get logout => translate('logout');
  String get dashboard => translate('dashboard');
  String get clients => translate('clients');
  String get client => translate('client');
  String get visaCases => translate('visaCases');
  String get visaCase => translate('visaCase');
  String get appointments => translate('appointments');
  String get appointment => translate('appointment');
  String get notifications => translate('notifications');
  String get settings => translate('settings');
  String get search => translate('search');
  String get cancel => translate('cancel');
  String get save => translate('save');
  String get delete => translate('delete');
  String get confirm => translate('confirm');
  String get yes => translate('yes');
  String get no => translate('no');
  String get loading => translate('loading');
  String get error => translate('error');
  String get empty => translate('empty');
  String get noResults => translate('noResults');
  String get tryAgain => translate('tryAgain');
  String get offline => translate('offline');
  String get online => translate('online');
  String get welcome => translate('welcome');
  String get profile => translate('profile');
  String get edit => translate('edit');
  String get create => translate('create');
  String get update => translate('update');
  String get archive => translate('archive');
  String get unarchive => translate('unarchive');
  String get export => translate('export');
  String get import => translate('import');
  String get filter => translate('filter');
  String get sort => translate('sort');
  String get refresh => translate('refresh');
  String get next => translate('next');
  String get previous => translate('previous');
  String get done => translate('done');
  String get close => translate('close');
  String get info => translate('info');
  String get success => translate('success');
  String get warning => translate('warning');
  String get required => translate('required');
  String get invalidEmail => translate('invalidEmail');
  String get invalidPhone => translate('invalidPhone');
  String get passwordMin => translate('passwordMin');
  String get home => translate('home');
  String get analytics => translate('analytics');
  String get kanban => translate('kanban');
  String get tracking => translate('tracking');
  String get documents => translate('documents');
  String get users => translate('users');
  String get admin => translate('admin');
  String get help => translate('help');
  String get about => translate('about');
  String get version => translate('version');
  String get language => translate('language');
  String get theme => translate('theme');
  String get darkMode => translate('darkMode');
  String get lightMode => translate('lightMode');
  String get systemTheme => translate('systemTheme');
  String get notificationsEnabled => translate('notificationsEnabled');
  String get emailNotifications => translate('emailNotifications');
  String get pushNotifications => translate('pushNotifications');
  String get smsNotifications => translate('smsNotifications');
  String get selectCountry => translate('selectCountry');
  String get selectStatus => translate('selectStatus');
  String get selectType => translate('selectType');
  String get all => translate('all');
  String get today => translate('today');
  String get thisWeek => translate('thisWeek');
  String get thisMonth => translate('thisMonth');
  String get custom => translate('custom');
  String get from => translate('from');
  String get to => translate('to');
  String get apply => translate('apply');
  String get reset => translate('reset');
  String get noData => translate('noData');
  String get loadingData => translate('loadingData');
  String get errorOccurred => translate('errorOccurred');
  String get retryMessage => translate('retryMessage');
  String get connectionLost => translate('connectionLost');
  String get connectionRestored => translate('connectionRestored');
  String get dataSaved => translate('dataSaved');
  String get dataDeleted => translate('dataDeleted');
  String get confirmDelete => translate('confirmDelete');
  String get confirmArchive => translate('confirmArchive');
  String get operationSuccessful => translate('operationSuccessful');
  String get operationFailed => translate('operationFailed');
  String get passportNumber => translate('passportNumber');
  String get nationality => translate('nationality');
  String get phoneNumber => translate('phoneNumber');
  String get whatsappNumber => translate('whatsappNumber');
  String get fullName => translate('fullName');
  String get email => translate('email');
  String get notes => translate('notes');
  String get caseNumber => translate('caseNumber');
  String get visaCountry => translate('visaCountry');
  String get visaType => translate('visaType');
  String get currentStatus => translate('currentStatus');
  String get openingDate => translate('openingDate');
  String get createdAt => translate('createdAt');
  String get updatedAt => translate('updatedAt');
  String get archived => translate('archived');
  String get active => translate('active');
  String get inactive => translate('inactive');
}

class AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => AppLocalizations.supportedLocales.any(
    (supportedLocale) => supportedLocale.languageCode == locale.languageCode,
  );

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(AppLocalizationsDelegate old) => false;
}
