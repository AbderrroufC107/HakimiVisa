# HakimiVisa Client — Play Store listing

Everything below describes only what the app actually does. Nothing is
promised that the build does not deliver.

---

## App name (max 30 characters)

    HakimiVisa — Suivi de visa        (29)

Arabic store variant:

    HakimiVisa — متابعة الفيزا        (26)

---

## Short description (max 80 characters)

**FR**

    Suivez votre dossier de visa en temps réel : statut, rendez-vous, documents.
    (76)

**AR**

    تابع ملف تأشيرتك مباشرة: الحالة، الموعد، الوثائق والإشعارات.
    (59)

---

## Full description (max 4000 characters)

### Français

    Suivez votre demande de visa sans vous déplacer

    HakimiVisa vous permet de consulter l'état de votre dossier de visa à tout
    moment, depuis votre téléphone. Plus besoin d'appeler l'agence pour savoir
    où en est votre demande.

    RECHERCHE SIMPLE
    Saisissez votre numéro de téléphone ou votre numéro de passeport. Votre
    dossier apparaît immédiatement — aucun compte à créer, aucun mot de passe
    à retenir.

    SUIVI ÉTAPE PAR ÉTAPE
    Visualisez le parcours complet de votre demande : dossier reçu, en cours
    de traitement, rendez-vous fixé, dossier livré. Chaque changement est daté,
    vous savez exactement où vous en êtes.

    VOS RENDEZ-VOUS
    Consultez la date, l'heure et le centre de votre rendez-vous, ainsi que le
    type de dépôt prévu.

    VOS DOCUMENTS
    Retrouvez la liste des documents liés à votre dossier.

    NOTIFICATIONS
    Recevez une alerte dès que l'état de votre dossier évolue.

    TROIS LANGUES
    L'application est disponible en français, en arabe et en anglais. Changez
    de langue à tout moment depuis les paramètres.

    AIDE ET CONTACT
    Une foire aux questions répond aux demandes les plus fréquentes, et les
    coordonnées de l'agence sont accessibles en un geste.

    Cette application est destinée aux clients de l'agence HakimiVisa.

### العربية

    تابع طلب تأشيرتك دون أن تتنقّل

    يتيح لك تطبيق HakimiVisa الاطّلاع على حالة ملفك في أي وقت من هاتفك، دون
    الحاجة إلى الاتصال بالوكالة للسؤال عن مستجدّات طلبك.

    بحث بسيط
    أدخل رقم هاتفك أو رقم جواز سفرك، فيظهر ملفك مباشرة — دون إنشاء حساب ودون
    كلمة مرور تحفظها.

    متابعة خطوة بخطوة
    اطّلع على مسار طلبك كاملًا: استلام الملف، قيد المعالجة، تحديد الموعد،
    تسليم الملف. كل تغيير مؤرّخ، فتعرف تمامًا أين وصل طلبك.

    مواعيدك
    اطّلع على تاريخ موعدك وساعته ومركز الإيداع ونوع الإيداع المقرّر.

    وثائقك
    تصفّح قائمة الوثائق المرتبطة بملفك.

    الإشعارات
    يصلك تنبيه فور تغيّر حالة ملفك.

    ثلاث لغات
    التطبيق متوفّر بالعربية والفرنسية والإنجليزية، ويمكنك تغيير اللغة متى شئت
    من الإعدادات.

    المساعدة والتواصل
    قسم للأسئلة الشائعة يجيب عن أكثر الاستفسارات تكرارًا، وبيانات الوكالة
    متاحة بضغطة واحدة.

    هذا التطبيق مخصّص لزبائن وكالة HakimiVisa.

---

## Category and tags

- Category: **Travel & Local** (alternative: Business)
- Tags: visa, travel, tracking, appointment

## Contact details required by Play

- Support email: the agency's real address (see the open point below)
- Website: the agency's real site
- Privacy policy: a public URL — **mandatory**, see privacy-policy.md

---

## Data safety declaration

Declare the following as **collected and transmitted**, tied to the user's identity:

| Data type | Collected | Shared | Why |
|---|---|---|---|
| Name | Yes | No | Identifies the visa file |
| Phone number | Yes | No | Used to look the file up |
| Email address | Yes | No | Notifications about the file |
| Passport number ("Other info") | Yes | No | Used to look the file up |
| App activity / notifications token | Yes | No | Push notifications |

- Data is encrypted in transit: **Yes** (the app talks to the server over HTTPS).
- Users can request deletion: answer according to the agency's actual policy.
- No data is sold or shared with third parties.

Note: the app itself asks only for a phone or passport number. Everything else
shown belongs to a file the agency created, so declare it — it does reach the
device.

## Permissions used, and why

| Permission | Reason |
|---|---|
| INTERNET | Fetch the file from the agency's server |
| ACCESS_NETWORK_STATE | Detect that the phone is offline |
| POST_NOTIFICATIONS | Alert the client when the file's status changes |
| VIBRATE | Notification vibration |

None of these needs a special declaration form.
