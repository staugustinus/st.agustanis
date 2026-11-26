import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Lock,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Share2,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { formatNumber, TOTAL_LENT_DAYS } from '../data/readingPlan';
import type {
  AppConfig,
  CardStylePreset,
  CopyFields,
  HeroIconKey,
  HeroIconSize,
  Language,
  RadiusPreset,
  ThemeMode,
} from '../types';
import { normalizeDigits } from '../utils/digits';
import { HeroSymbol } from './HeroSymbol';

interface AdminPanelProps {
  isOpen: boolean;
  lang: Language;
  theme: ThemeMode;
  config: AppConfig;
  onClose: () => void;
  onSaveConfig: (nextConfig: AppConfig) => void;
  onImportConfig: (incoming: Partial<AppConfig>) => void;
  onResetDefaults: () => void;
  onNotify: (msg: string) => void;
}

type AdminTab = 'identity' | 'texts' | 'theme' | 'content' | 'export';

const ACCENT_PRESETS = [
  { nameAr: 'أحمر ياقوتي', nameEn: 'Ruby Red', hex: '#DC2626' },
  { nameAr: 'قرمزي داكن', nameEn: 'Deep Crimson', hex: '#B91C1C' },
  { nameAr: 'عنّابي ملكي', nameEn: 'Royal Burgundy', hex: '#9F1239' },
  { nameAr: 'ذهبي قبطي', nameEn: 'Coptic Gold', hex: '#B45309' },
  { nameAr: 'أخضر زيتوني', nameEn: 'Olive Green', hex: '#15803D' },
  { nameAr: 'نيلي عميق', nameEn: 'Deep Indigo', hex: '#4338CA' },
];

const HERO_ICONS: { key: HeroIconKey; labelAr: string; labelEn: string }[] = [
  { key: 'heart', labelAr: 'قلب', labelEn: 'Heart' },
  { key: 'cross', labelAr: 'صليب', labelEn: 'Cross' },
  { key: 'star', labelAr: 'نجمة', labelEn: 'Star' },
  { key: 'flame', labelAr: 'شمعة', labelEn: 'Candle' },
  { key: 'book', labelAr: 'إنجيل', labelEn: 'Book' },
  { key: 'sun', labelAr: 'نور', labelEn: 'Light' },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  lang,
  config,
  onClose,
  onSaveConfig,
  onImportConfig,
  onResetDefaults,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('identity');
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Draft state: edits only commit when Developer clicks "حفظ التعديلات"
  const [draft, setDraft] = useState<AppConfig>(config);
  const [hasChanges, setHasChanges] = useState(false);

  const [editLang, setEditLang] = useState<Language>(lang);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [importText, setImportText] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Reset lock and sync draft whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setUnlocked(false);
      setPinInput('');
      setPinError(false);
      setDraft(config);
      setHasChanges(false);
      setEditLang(lang);
    }
  }, [isOpen, config, lang]);

  if (!isOpen) return null;

  const updateDraft = (updater: (prev: AppConfig) => AppConfig) => {
    setDraft((prev) => updater(prev));
    setHasChanges(true);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = normalizeDigits(pinInput).replace(/[\s\u200E\u200F\u202A-\u202E]/g, '');
    const expected = normalizeDigits(config.adminPin || '2027').replace(/[\s\u200E\u200F\u202A-\u202E]/g, '');
    if (entered === expected) {
      setUnlocked(true);
      setPinError(false);
      setPinInput('');
      setShowPin(false);
      setDraft({ ...config, pin2027Migrated: true });
      setHasChanges(false);
    } else {
      setPinError(true);
    }
  };

  const handleSave = () => {
    onSaveConfig(draft);
    setHasChanges(false);
    onNotify(lang === 'ar' ? 'تم حفظ إعدادات المطورين بنجاح' : 'Developer settings saved');
    onClose();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 256;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png', 0.9);
          updateDraft((prev) => ({ ...prev, logoDataUrl: dataUrl }));
        }
      };
      if (typeof reader.result === 'string') img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yalla-negahaz-config.json';
    a.click();
    URL.revokeObjectURL(url);
    onNotify(lang === 'ar' ? 'تم تنزيل ملف الإعدادات' : 'Config JSON downloaded');
  };

  const handleCopyShareLink = async () => {
    try {
      const { logoDataUrl: _omitLogo, ...lightweightConfig } = draft;
      const jsonStr = JSON.stringify(lightweightConfig);
      const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
      const shareUrl = `${window.location.origin}${window.location.pathname}#cfg=${encoded}`;
      await navigator.clipboard.writeText(shareUrl);
      onNotify(
        lang === 'ar'
          ? 'تم نسخ رابط الإعدادات لمشاركته مع الأسرة'
          : 'Shareable settings link copied to clipboard'
      );
    } catch {
      onNotify(lang === 'ar' ? 'تعذّر نسخ الرابط' : 'Could not copy link');
    }
  };

  const handleImportJsonString = (raw: string) => {
    try {
      const parsed = JSON.parse(raw) as Partial<AppConfig>;
      onImportConfig(parsed);
      setImportText('');
      onNotify(lang === 'ar' ? 'تم استيراد الإعدادات بنجاح' : 'Settings imported successfully');
      onClose();
    } catch {
      onNotify(lang === 'ar' ? 'ملف أو نص JSON غير صالح' : 'Invalid JSON format');
    }
  };

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleImportJsonString(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Current quote for selectedDay in draft
  const quoteForDay = draft.quotes.find((q) => q.day === selectedDay) || {
    day: selectedDay,
    textAr: '',
    textEn: '',
    saintAr: '',
    saintEn: '',
  };

  const updateQuoteForDay = (patch: Partial<typeof quoteForDay>) => {
    updateDraft((prev) => {
      const exists = prev.quotes.some((q) => q.day === selectedDay);
      const nextQuotes = exists
        ? prev.quotes.map((q) => (q.day === selectedDay ? { ...q, ...patch } : q))
        : [...prev.quotes, { ...quoteForDay, ...patch }].sort((a, b) => a.day - b.day);
      return { ...prev, quotes: nextQuotes };
    });
  };

  const deleteQuoteForDay = () => {
    updateDraft((prev) => ({
      ...prev,
      quotes: prev.quotes.filter((q) => q.day !== selectedDay),
    }));
  };

  const practicesForWeek = draft.practices.filter((p) => p.week === selectedWeek);

  const addPracticeToWeek = () => {
    const newId = `w${selectedWeek}-${Date.now()}`;
    updateDraft((prev) => ({
      ...prev,
      practices: [
        ...prev.practices,
        {
          id: newId,
          week: selectedWeek,
          textAr: 'تدريب روحي جديد للأسبوع',
          textEn: 'New weekly spiritual practice',
        },
      ],
    }));
  };

  const updatePractice = (id: string, patch: { textAr?: string; textEn?: string }) => {
    updateDraft((prev) => ({
      ...prev,
      practices: prev.practices.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  };

  const deletePractice = (id: string) => {
    updateDraft((prev) => ({
      ...prev,
      practices: prev.practices.filter((p) => p.id !== id),
    }));
  };

  const tabs: { key: AdminTab; labelAr: string; labelEn: string; icon: React.ReactNode }[] = [
    { key: 'identity', labelAr: 'الهوية والأمان', labelEn: 'Identity & Lock', icon: <Shield className="w-4 h-4" /> },
    { key: 'texts', labelAr: 'كل النصوص', labelEn: 'All Texts', icon: <FileText className="w-4 h-4" /> },
    { key: 'theme', labelAr: 'الأشكال والألوان', labelEn: 'Shapes & Theme', icon: <Palette className="w-4 h-4" /> },
    { key: 'content', labelAr: 'الأقوال والتداريب', labelEn: 'Quotes & Tasks', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'export', labelAr: 'تصدير / استيراد', labelEn: 'Export / Import', icon: <Share2 className="w-4 h-4" /> },
  ];

  const textFieldsList: [keyof CopyFields, string][] = [
    ['familyName', lang === 'ar' ? 'اسم الأسرة في الشريط العلوي' : 'Fellowship Name'],
    ['authWelcomeTitle', lang === 'ar' ? 'عنوان شاشة التسجيل' : 'Auth Screen Title'],
    ['authWelcomeSubtitle', lang === 'ar' ? 'وصف شاشة التسجيل' : 'Auth Screen Subtitle'],
    ['heroTitle', lang === 'ar' ? 'العنوان الرئيسي' : 'Hero Title'],
    ['heroSubtitle', lang === 'ar' ? 'الجملة الترحيبية' : 'Welcome Subtitle'],
    ['heartProgressCaption', lang === 'ar' ? 'نص أسفل قلب التقدّم' : 'Progress Heart Caption'],
    ['pwaTitle', lang === 'ar' ? 'عنوان بطاقة تثبيت التطبيق' : 'PWA Banner Title'],
    ['pwaDesc', lang === 'ar' ? 'وصف بطاقة تثبيت التطبيق' : 'PWA Banner Description'],
    ['pwaInstallBtn', lang === 'ar' ? 'نص زر التثبيت' : 'PWA Install Button'],
    ['progressTitle', lang === 'ar' ? 'عنوان بطاقة نسبة التقدّم' : 'Progress Card Title'],
    ['streakTitle', lang === 'ar' ? 'عنوان بطاقة الاستمرارية' : 'Streak Card Title'],
    ['streakLabel', lang === 'ar' ? 'وصف عدّاد الأيام المتتالية' : 'Streak Counter Label'],
    ['completedDaysLabel', lang === 'ar' ? 'وصف عدّاد الأيام المكتملة' : 'Completed Days Label'],
    ['gospelSectionTitle', lang === 'ar' ? 'عنوان قسم الأناجيل الأربعة' : 'Gospels Section Title'],
    ['gospelEditionLabel', lang === 'ar' ? 'اسم ترجمة/طبعة الإنجيل' : 'Gospel Translation Label'],
    ['markReadBtn', lang === 'ar' ? 'نص زر إتمام القراءة' : 'Mark Read Button'],
    ['markReadDoneBtn', lang === 'ar' ? 'نص الزر بعد الإتمام' : 'Completed Button'],
    ['encouragementMsg', lang === 'ar' ? 'رسالة التشجيع بعد القراءة' : 'Encouragement Message'],
    ['quoteSectionTitle', lang === 'ar' ? 'عنوان قسم أقوال الآباء' : 'Quote Section Title'],
    ['practicesSectionTitle', lang === 'ar' ? 'عنوان تداريب الأسبوع' : 'Practices Section Title'],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={lang === 'ar' ? 'إعدادات المطورين' : 'Developer Settings'}
    >
      <div className="w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col app-card rounded-b-none sm:rounded-b-[var(--radius-card)] bg-white dark:bg-[#1E1619] border border-stone-200 dark:border-white/10 shadow-2xl overflow-hidden">
        {/* Panel Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-white">
              {lang === 'ar' ? 'إعدادات المطورين' : 'Developer Settings'}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {unlocked
                ? lang === 'ar'
                  ? 'عدّل ما تشاء ثم اضغط "حفظ التعديلات" لتطبيق التغييرات'
                  : 'Edit any setting then click "Save Changes" to apply'
                : lang === 'ar'
                ? 'هذه المنطقة مخصّصة للمطورين فقط'
                : 'Restricted to developers only'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
            className="min-w-[40px] min-h-[40px] app-control hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 dark:text-stone-300 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!unlocked ? (
          /* Developer Password Gate */
          <form onSubmit={handlePinSubmit} className="p-6 sm:p-10 max-w-sm mx-auto w-full text-center space-y-4">
            <div className="w-12 h-12 mx-auto app-control bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              {lang === 'ar' ? 'دخول المطورين' : 'Developer Access'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {lang === 'ar'
                ? 'أدخل كلمة مرور المطورين لفتح التعديل الكامل على النصوص والأشكال'
                : 'Enter the developer password to edit all texts, shapes, and content'}
            </p>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                dir="ltr"
                inputMode="numeric"
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="••••"
                className="w-full text-center tracking-widest text-lg font-bold min-h-[44px] px-10 app-control border border-stone-300 dark:border-white/15 bg-stone-50 dark:bg-black/30 text-stone-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPin((s) => !s)}
                aria-label={showPin ? (lang === 'ar' ? 'إخفاء كلمة المرور' : 'Hide password') : (lang === 'ar' ? 'إظهار كلمة المرور' : 'Show password')}
                className="absolute inset-y-0 right-1.5 flex items-center justify-center w-9 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pinError && (
              <p className="text-xs font-semibold text-red-500">
                {lang === 'ar' ? 'كلمة المرور غير صحيحة' : 'Incorrect developer password'}
              </p>
            )}
            <button
              type="submit"
              className="w-full min-h-[44px] app-control bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold cursor-pointer"
            >
              {lang === 'ar' ? 'دخول' : 'Unlock'}
            </button>
          </form>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="px-4 py-2.5 border-b border-stone-200 dark:border-white/10 flex items-center gap-1.5 overflow-x-auto shrink-0 bg-stone-50/60 dark:bg-black/20">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`min-h-[38px] px-3 py-1.5 app-control text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    activeTab === tab.key
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-white/10'
                  }`}
                >
                  {tab.icon}
                  <span>{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
                </button>
              ))}
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {activeTab === 'identity' && (
                <div className="space-y-5">
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-stone-800 dark:text-stone-100">
                      {lang === 'ar' ? 'شعار (لوجو) الأسرة' : 'Fellowship Logo'}
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-16 h-16 app-control border border-stone-200 dark:border-white/15 bg-stone-50 dark:bg-black/25 flex items-center justify-center overflow-hidden">
                        {draft.logoDataUrl ? (
                          <img
                            src={draft.logoDataUrl}
                            alt="Logo preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[var(--accent)]">
                            <HeroSymbol icon={draft.heroIcon} className="w-7 h-7" filled />
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="min-h-[40px] px-4 py-2 app-control bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{lang === 'ar' ? 'رفع / تغيير اللوجو' : 'Upload Logo'}</span>
                      </button>
                      {draft.logoDataUrl && (
                        <button
                          type="button"
                          onClick={() => updateDraft((p) => ({ ...p, logoDataUrl: null }))}
                          className="min-h-[40px] px-3 py-2 app-control border border-stone-300 dark:border-white/15 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
                        >
                          {lang === 'ar' ? 'إزالة الصورة' : 'Remove'}
                        </button>
                      )}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Competition Start & End Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-stone-600 dark:text-stone-300">
                        {lang === 'ar' ? 'تاريخ بداية المسابقة (الافتراضي)' : 'Default Start Date'}
                      </label>
                      <input
                        type="date"
                        value={draft.lentStartDate}
                        onChange={(e) =>
                          updateDraft((p) => ({ ...p, lentStartDate: e.target.value }))
                        }
                        className="w-full min-h-[42px] px-3 app-control border border-stone-300 dark:border-white/15 bg-stone-50 dark:bg-black/25 text-sm text-stone-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-stone-600 dark:text-stone-300">
                        {lang === 'ar' ? 'تاريخ آخر يوم في المسابقة' : 'Competition End Date'}
                      </label>
                      <input
                        type="date"
                        value={draft.lentEndDate}
                        onChange={(e) =>
                          updateDraft((p) => ({ ...p, lentEndDate: e.target.value }))
                        }
                        className="w-full min-h-[42px] px-3 app-control border border-stone-300 dark:border-white/15 bg-stone-50 dark:bg-black/25 text-sm text-stone-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Sequential Day Lock Toggle */}
                  <div className="p-4 app-control border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-black/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[var(--accent)]" />
                      <div>
                        <div className="text-sm font-bold text-stone-900 dark:text-white">
                          {lang === 'ar' ? 'قفل الأيام بالتسلسل' : 'Sequential Day Lock'}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400">
                          {lang === 'ar'
                            ? 'يمنع فتح اليوم التالي إلا بعد إتمام مهام اليوم الحالي'
                            : 'Require completing current day before opening the next day'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft((p) => ({ ...p, sequentialLock: !p.sequentialLock }))
                      }
                      className={`min-h-[36px] px-3 app-control text-xs font-bold cursor-pointer transition-colors shrink-0 ${
                        draft.sequentialLock
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {draft.sequentialLock
                        ? lang === 'ar'
                          ? 'مفعّل'
                          : 'On'
                        : lang === 'ar'
                        ? 'مفتوح'
                        : 'Off'}
                    </button>
                  </div>

                  {/* Developer Password Change */}
                  <div className="p-4 app-control border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-black/20 space-y-2">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[var(--accent)]" />
                      <div className="text-sm font-bold text-stone-900 dark:text-white">
                        {lang === 'ar' ? 'كلمة مرور المطورين' : 'Developer Password'}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={draft.adminPin}
                      onChange={(e) =>
                        updateDraft((p) => ({ ...p, adminPin: normalizeDigits(e.target.value) }))
                      }
                      className="w-40 min-h-[38px] px-3 app-control border border-stone-300 dark:border-white/15 bg-white dark:bg-black/30 text-sm font-bold text-stone-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'texts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                      {lang === 'ar' ? 'لغة النصوص الجاري تعديلها:' : 'Editing Language:'}
                    </span>
                    <div className="flex gap-1.5">
                      {(['ar', 'en'] as Language[]).map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setEditLang(l)}
                          className={`px-3 py-1.5 app-control text-xs font-bold cursor-pointer ${
                            editLang === l
                              ? 'bg-[var(--accent)] text-white'
                              : 'bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {l === 'ar' ? 'العربية' : 'English'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {textFieldsList.map(([field, label]) => (
                    <div key={field} className="space-y-1">
                      <label className="block text-xs font-bold text-stone-600 dark:text-stone-300">
                        {label}
                      </label>
                      <input
                        type="text"
                        dir={editLang === 'ar' ? 'rtl' : 'ltr'}
                        value={draft.copy[editLang][field]}
                        onChange={(e) =>
                          updateDraft((p) => ({
                            ...p,
                            copy: {
                              ...p.copy,
                              [editLang]: {
                                ...p.copy[editLang],
                                [field]: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full min-h-[40px] px-3 app-control border border-stone-300 dark:border-white/15 bg-stone-50 dark:bg-black/25 text-sm text-stone-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'theme' && (
                <div className="space-y-6">
                  {/* Accent Color */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-stone-800 dark:text-stone-100">
                      {lang === 'ar' ? 'اللون الرئيسي (Accent Color)' : 'Primary Accent Color'}
                    </label>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {ACCENT_PRESETS.map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() =>
                            updateDraft((p) => ({ ...p, accentColor: preset.hex }))
                          }
                          className={`min-h-[38px] px-3 py-1.5 app-control border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                            draft.accentColor.toLowerCase() === preset.hex.toLowerCase()
                              ? 'border-stone-900 dark:border-white bg-stone-100 dark:bg-white/10 text-stone-900 dark:text-white'
                              : 'border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full shrink-0"
                            style={{ backgroundColor: preset.hex }}
                          />
                          <span>{lang === 'ar' ? preset.nameAr : preset.nameEn}</span>
                        </button>
                      ))}
                      <label className="min-h-[38px] px-3 py-1.5 app-control border border-stone-200 dark:border-white/10 text-xs font-semibold flex items-center gap-2 cursor-pointer">
                        <input
                          type="color"
                          value={draft.accentColor}
                          onChange={(e) =>
                            updateDraft((p) => ({ ...p, accentColor: e.target.value }))
                          }
                          className="w-5 h-5 border-0 bg-transparent cursor-pointer"
                        />
                        <span className="text-stone-700 dark:text-stone-300">
                          {lang === 'ar' ? 'لون مخصص' : 'Custom'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Background Canvas Pickers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-stone-600 dark:text-stone-300">
                        {lang === 'ar' ? 'خلفية الوضع الداكن' : 'Dark Mode Background'}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={draft.darkCanvasColor}
                          onChange={(e) =>
                            updateDraft((p) => ({ ...p, darkCanvasColor: e.target.value }))
                          }
                          className="w-10 h-10 rounded-lg border border-stone-300 dark:border-white/15 bg-transparent cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft((p) => ({ ...p, darkCanvasColor: '#181214' }))
                          }
                          className="text-xs font-semibold text-stone-500 hover:text-[var(--accent)] cursor-pointer"
                        >
                          {lang === 'ar' ? 'عنّابي فحمي افتراضي' : 'Default Burgundy'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-stone-600 dark:text-stone-300">
                        {lang === 'ar' ? 'خلفية الوضع الفاتح' : 'Light Mode Background'}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={draft.lightCanvasColor}
                          onChange={(e) =>
                            updateDraft((p) => ({ ...p, lightCanvasColor: e.target.value }))
                          }
                          className="w-10 h-10 rounded-lg border border-stone-300 dark:border-white/15 bg-transparent cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft((p) => ({ ...p, lightCanvasColor: '#FAF7F4' }))
                          }
                          className="text-xs font-semibold text-stone-500 hover:text-[var(--accent)] cursor-pointer"
                        >
                          {lang === 'ar' ? 'أبيض دافئ افتراضي' : 'Default Warm Ivory'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Border Radius */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-stone-800 dark:text-stone-100">
                      {lang === 'ar' ? 'شكل واستدارة الحواف' : 'Corner Radius Shape'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          ['sharp', lang === 'ar' ? 'حادة' : 'Sharp'],
                          ['soft', lang === 'ar' ? 'ناعمة' : 'Soft'],
                          ['rounded', lang === 'ar' ? 'دائرية' : 'Rounded'],
                        ] as [RadiusPreset, string][]
                      ).map(([preset, label]) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() =>
                            updateDraft((p) => ({ ...p, radiusPreset: preset }))
                          }
                          className={`min-h-[42px] app-control border text-xs font-bold cursor-pointer transition-colors ${
                            draft.radiusPreset === preset
                              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                              : 'border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Surface Style */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-stone-800 dark:text-stone-100">
                      {lang === 'ar' ? 'نمط شكل البطاقات' : 'Card Surface Style'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          ['bordered', lang === 'ar' ? 'بحدود ناعمة' : 'Bordered'],
                          ['elevated', lang === 'ar' ? 'بظل بارز' : 'Elevated Shadow'],
                          ['flat', lang === 'ar' ? 'مسطّح بدون حدود' : 'Flat Minimal'],
                        ] as [CardStylePreset, string][]
                      ).map(([preset, label]) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() =>
                            updateDraft((p) => ({ ...p, cardStyle: preset }))
                          }
                          className={`min-h-[42px] app-control border text-xs font-bold cursor-pointer transition-colors ${
                            draft.cardStyle === preset
                              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                              : 'border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hero Icon Picker */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-stone-800 dark:text-stone-100">
                      {lang === 'ar' ? 'شكل الأيقونة الرئيسية' : 'Primary Hero Shape'}
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {HERO_ICONS.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() =>
                            updateDraft((p) => ({ ...p, heroIcon: item.key }))
                          }
                          className={`min-h-[56px] p-2 app-control border flex flex-col items-center justify-center gap-1 text-xs font-bold cursor-pointer transition-colors ${
                            draft.heroIcon === item.key
                              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                              : 'border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <HeroSymbol icon={item.key} className="w-5 h-5" filled />
                          <span>{lang === 'ar' ? item.labelAr : item.labelEn}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hero Icon Size */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-stone-800 dark:text-stone-100">
                      {lang === 'ar' ? 'حجم قلب التقدّم الرئيسي' : 'Progress Heart Size'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          ['sm', lang === 'ar' ? 'صغير' : 'Small'],
                          ['md', lang === 'ar' ? 'متوسط' : 'Medium'],
                          ['lg', lang === 'ar' ? 'كبير' : 'Large'],
                        ] as [HeroIconSize, string][]
                      ).map(([sz, label]) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() =>
                            updateDraft((p) => ({ ...p, heroIconSize: sz }))
                          }
                          className={`min-h-[40px] app-control border text-xs font-bold cursor-pointer transition-colors ${
                            draft.heroIconSize === sz
                              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                              : 'border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-8">
                  {/* Patristic Quotes Editor */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                        {lang === 'ar' ? 'إدارة أقوال الآباء (٤٣ يوماً)' : 'Manage Patristic Quotes (43 Days)'}
                      </h3>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-stone-500 dark:text-stone-400">
                          {lang === 'ar' ? 'اليوم:' : 'Day:'}
                        </label>
                        <select
                          value={selectedDay}
                          onChange={(e) => setSelectedDay(Number(e.target.value))}
                          className="min-h-[36px] px-2.5 app-control border border-stone-300 dark:border-white/15 bg-stone-50 dark:bg-black/30 text-xs font-bold text-stone-900 dark:text-white"
                        >
                          {Array.from({ length: TOTAL_LENT_DAYS }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d}>
                              {lang === 'ar' ? `اليوم ${formatNumber(d, 'ar')}` : `Day ${d}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="p-4 app-control border border-stone-200 dark:border-white/10 bg-stone-50/70 dark:bg-black/20 space-y-3">
                      <textarea
                        dir="rtl"
                        rows={2}
                        placeholder="نص القول بالعربية..."
                        value={quoteForDay.textAr}
                        onChange={(e) => updateQuoteForDay({ textAr: e.target.value })}
                        className="w-full p-2.5 app-control border border-stone-300 dark:border-white/15 bg-white dark:bg-black/30 text-sm text-stone-900 dark:text-white"
                      />
                      <textarea
                        dir="ltr"
                        rows={2}
                        placeholder="Quote text in English..."
                        value={quoteForDay.textEn}
                        onChange={(e) => updateQuoteForDay({ textEn: e.target.value })}
                        className="w-full p-2.5 app-control border border-stone-300 dark:border-white/15 bg-white dark:bg-black/30 text-sm text-stone-900 dark:text-white"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          dir="rtl"
                          placeholder="اسم القديس (عربي)"
                          value={quoteForDay.saintAr}
                          onChange={(e) => updateQuoteForDay({ saintAr: e.target.value })}
                          className="min-h-[38px] px-3 app-control border border-stone-300 dark:border-white/15 bg-white dark:bg-black/30 text-xs text-stone-900 dark:text-white"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          placeholder="Saint Name (English)"
                          value={quoteForDay.saintEn}
                          onChange={(e) => updateQuoteForDay({ saintEn: e.target.value })}
                          className="min-h-[38px] px-3 app-control border border-stone-300 dark:border-white/15 bg-white dark:bg-black/30 text-xs text-stone-900 dark:text-white"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={deleteQuoteForDay}
                          className="min-h-[34px] px-3 app-control text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'حذف قول هذا اليوم' : 'Delete Quote'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Practices Editor */}
                  <div className="space-y-3 pt-4 border-t border-stone-200 dark:border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                        {lang === 'ar' ? 'إدارة تداريب الأسبوع' : 'Manage Weekly Practices'}
                      </h3>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedWeek}
                          onChange={(e) => setSelectedWeek(Number(e.target.value))}
                          className="min-h-[36px] px-2.5 app-control border border-stone-300 dark:border-white/15 bg-stone-50 dark:bg-black/30 text-xs font-bold text-stone-900 dark:text-white"
                        >
                          {[1, 2, 3, 4, 5, 6, 7].map((w) => (
                            <option key={w} value={w}>
                              {lang === 'ar' ? `الأسبوع ${formatNumber(w, 'ar')}` : `Week ${w}`}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={addPracticeToWeek}
                          className="min-h-[36px] px-3 app-control bg-[var(--accent)] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'إضافة تدريب' : 'Add Practice'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {practicesForWeek.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 app-control border border-stone-200 dark:border-white/10 bg-stone-50/70 dark:bg-black/20 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              dir="rtl"
                              value={p.textAr}
                              onChange={(e) => updatePractice(p.id, { textAr: e.target.value })}
                              className="flex-1 min-h-[36px] px-2.5 app-control border border-stone-300 dark:border-white/15 bg-white dark:bg-black/30 text-xs text-stone-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => deletePractice(p.id)}
                              aria-label="Delete practice"
                              className="min-w-[36px] min-h-[36px] app-control text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <input
                            type="text"
                            dir="ltr"
                            value={p.textEn}
                            onChange={(e) => updatePractice(p.id, { textEn: e.target.value })}
                            className="w-full min-h-[36px] px-2.5 app-control border border-stone-300 dark:border-white/15 bg-white dark:bg-black/30 text-xs text-stone-900 dark:text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'export' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="min-h-[44px] px-4 py-2.5 app-control bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'تصدير ملف الإعدادات (JSON)' : 'Export Settings JSON'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyShareLink}
                      className="min-h-[44px] px-4 py-2.5 app-control border border-stone-300 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/10 text-stone-800 dark:text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Copy className="w-4 h-4 text-[var(--accent)]" />
                      <span>{lang === 'ar' ? 'نسخ رابط مشاركة للأسرة' : 'Copy Shareable Config Link'}</span>
                    </button>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-white/10">
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                      {lang === 'ar' ? 'استيراد إعدادات من ملف أو نص JSON' : 'Import from JSON File or Text'}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => jsonFileInputRef.current?.click()}
                        className="min-h-[38px] px-3.5 py-1.5 app-control border border-stone-300 dark:border-white/15 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/10 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'اختيار ملف JSON' : 'Choose JSON File'}</span>
                      </button>
                      <input
                        ref={jsonFileInputRef}
                        type="file"
                        accept="application/json,.json"
                        onChange={handleJsonFileUpload}
                        className="hidden"
                      />
                    </div>
                    <textarea
                      dir="ltr"
                      rows={4}
                      placeholder='{"accentColor": "#DC2626", ...}'
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      className="w-full p-3 app-control border border-stone-300 dark:border-white/15 bg-stone-50 dark:bg-black/25 text-xs font-mono text-stone-900 dark:text-white"
                    />
                    <button
                      type="button"
                      disabled={!importText.trim()}
                      onClick={() => handleImportJsonString(importText)}
                      className="min-h-[40px] px-4 py-2 app-control bg-stone-900 dark:bg-white text-white dark:text-stone-900 disabled:opacity-40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'تطبيق الإعدادات الملصوقة' : 'Apply Pasted JSON'}</span>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-stone-200 dark:border-white/10 flex justify-between items-center">
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      {lang === 'ar' ? 'استعادة الألوان والنصوص والمحتوى الافتراضي' : 'Restore default colors, texts & content'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onResetDefaults();
                        onNotify(lang === 'ar' ? 'تمت استعادة الإعدادات الافتراضية' : 'Defaults restored');
                        onClose();
                      }}
                      className="min-h-[38px] px-3.5 py-1.5 app-control border border-red-300 dark:border-red-500/30 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'استعادة الافتراضي' : 'Reset Defaults'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Save / Cancel Footer */}
            <div className="px-5 py-3.5 border-t border-stone-200 dark:border-white/10 bg-stone-50/90 dark:bg-black/30 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-stone-500 dark:text-stone-400">
                {hasChanges
                  ? lang === 'ar'
                    ? 'لديك تعديلات غير محفوظة'
                    : 'Unsaved changes'
                  : lang === 'ar'
                  ? 'كل الإعدادات محفوظة'
                  : 'All changes saved'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[42px] px-4 py-2 app-control border border-stone-300 dark:border-white/15 text-xs sm:text-sm font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="min-h-[42px] px-5 py-2 app-control bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
