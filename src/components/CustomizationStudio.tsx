import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  Layers,
  LayoutGrid,
  Paintbrush,
  RotateCcw,
} from 'lucide-react';
import {
  DEFAULT_LAYOUT_SETTINGS,
  DEFAULT_SECTION_ORDER,
} from '../data/defaultConfig';
import { formatNumber } from '../data/readingPlan';
import type {
  AppConfig,
  CardsArrangement,
  ElementColorsConfig,
  HeroArrangement,
  HeroIconSize,
  HeroLogoPosition,
  Language,
  LayoutSettings,
  LogoShape,
  PageSectionId,
} from '../types';

interface CustomizationStudioProps {
  lang: Language;
  draft: AppConfig;
  updateDraft: (updater: (prev: AppConfig) => AppConfig) => void;
}

const SECTION_LABELS: Record<PageSectionId, { ar: string; en: string }> = {
  hero: {
    ar: 'الترحيب بالاسم واللوجو + الطريق إلى بيت لحم',
    en: 'Personalized Welcome, Logo & Bethlehem Journey',
  },
  progress: {
    ar: 'بطاقات التقدّم والاستمرارية ومؤشّر الأيام',
    en: 'Progress Cards, Streak & Day Navigator',
  },
  gospels: {
    ar: 'قارئ الأناجيل الأربعة وأسئلة الأصحاحات',
    en: 'Four Gospels Reader & Chapter Quizzes',
  },
  quotePractices: {
    ar: 'قول اليوم من أقوال الآباء + التداريب الأسبوعية',
    en: 'Daily Patristic Quote & Weekly Practices',
  },
  competition: {
    ar: 'قسم مسابقة الأسرة',
    en: 'Fellowship Competition Section',
  },
};

function resolveOrder(order?: PageSectionId[]): PageSectionId[] {
  const out: PageSectionId[] = [];
  for (const id of order || []) {
    if (DEFAULT_SECTION_ORDER.includes(id) && !out.includes(id)) {
      out.push(id);
    }
  }
  for (const id of DEFAULT_SECTION_ORDER) {
    if (!out.includes(id)) {
      out.push(id);
    }
  }
  return out;
}

interface ColorSlot {
  key: keyof ElementColorsConfig;
  labelAr: string;
  labelEn: string;
  defaultPreview: string;
}

interface ElementGroup {
  id: string;
  titleAr: string;
  titleEn: string;
  slots: ColorSlot[];
}

const ELEMENT_GROUPS: ElementGroup[] = [
  {
    id: 'header',
    titleAr: 'الشريط العلوي (Header)',
    titleEn: 'Top Header Bar',
    slots: [
      { key: 'headerBg', labelAr: 'خلفية', labelEn: 'Bg', defaultPreview: '#FAF7F4' },
      { key: 'headerText', labelAr: 'النص', labelEn: 'Text', defaultPreview: '#1C1718' },
    ],
  },
  {
    id: 'hero',
    titleAr: 'قسم الترحيب والاسم',
    titleEn: 'Hero Welcome & Name',
    slots: [
      { key: 'heroBg', labelAr: 'خلفية', labelEn: 'Bg', defaultPreview: '#22191C' },
      { key: 'heroNameColor', labelAr: 'لون الاسم', labelEn: 'Name', defaultPreview: '#FFFFFF' },
      { key: 'heroSubtitleColor', labelAr: 'النص الفرعي', labelEn: 'Subtitle', defaultPreview: '#E7E5E4' },
    ],
  },
  {
    id: 'progress',
    titleAr: 'بطاقات التقدّم ومؤشّر الأيام',
    titleEn: 'Progress Cards & Bar',
    slots: [
      { key: 'progressBg', labelAr: 'خلفية', labelEn: 'Bg', defaultPreview: '#22191C' },
      { key: 'progressText', labelAr: 'النص', labelEn: 'Text', defaultPreview: '#FFFFFF' },
      { key: 'progressBarColor', labelAr: 'شريط التقدم', labelEn: 'Bar', defaultPreview: '#DC2626' },
    ],
  },
  {
    id: 'reader',
    titleAr: 'قارئ الأناجيل الأربعة',
    titleEn: 'Four Gospels Reader',
    slots: [
      { key: 'readerBg', labelAr: 'خلفية', labelEn: 'Bg', defaultPreview: '#22191C' },
      { key: 'readerText', labelAr: 'الآيات/النص', labelEn: 'Text', defaultPreview: '#F5F5F4' },
    ],
  },
  {
    id: 'quote',
    titleAr: 'بطاقة قول اليوم',
    titleEn: 'Daily Quote Card',
    slots: [
      { key: 'quoteBg', labelAr: 'خلفية', labelEn: 'Bg', defaultPreview: '#22191C' },
      { key: 'quoteText', labelAr: 'النص', labelEn: 'Text', defaultPreview: '#F5F5F4' },
    ],
  },
  {
    id: 'practices',
    titleAr: 'بطاقة تداريب الأسبوع',
    titleEn: 'Weekly Practices Card',
    slots: [
      { key: 'practicesBg', labelAr: 'خلفية', labelEn: 'Bg', defaultPreview: '#22191C' },
      { key: 'practicesText', labelAr: 'النص', labelEn: 'Text', defaultPreview: '#F5F5F4' },
    ],
  },
  {
    id: 'competition',
    titleAr: 'بطاقة المسابقة',
    titleEn: 'Competition Card',
    slots: [
      { key: 'competitionBg', labelAr: 'خلفية', labelEn: 'Bg', defaultPreview: '#23191D' },
      { key: 'competitionText', labelAr: 'النص', labelEn: 'Text', defaultPreview: '#FFFFFF' },
    ],
  },
  {
    id: 'footer',
    titleAr: 'تذييل الصفحة (Footer)',
    titleEn: 'Page Footer',
    slots: [
      { key: 'footerBg', labelAr: 'خلفية', labelEn: 'Bg', defaultPreview: '#181214' },
      { key: 'footerText', labelAr: 'النص', labelEn: 'Text', defaultPreview: '#A8A29E' },
    ],
  },
];

export const CustomizationStudio: React.FC<CustomizationStudioProps> = ({
  lang,
  draft,
  updateDraft,
}) => {
  const order = resolveOrder(draft.sectionOrder);
  const layout: LayoutSettings = {
    ...DEFAULT_LAYOUT_SETTINGS,
    ...(draft.layoutSettings || {}),
  };
  const colors: ElementColorsConfig = draft.elementColors || {};

  const moveSection = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    updateDraft((prev) => ({ ...prev, sectionOrder: next }));
  };

  const resetSectionOrder = () => {
    updateDraft((prev) => ({ ...prev, sectionOrder: [...DEFAULT_SECTION_ORDER] }));
  };

  const updateLayout = (patch: Partial<LayoutSettings>) => {
    updateDraft((prev) => ({
      ...prev,
      layoutSettings: {
        ...DEFAULT_LAYOUT_SETTINGS,
        ...(prev.layoutSettings || {}),
        ...patch,
      },
    }));
  };

  const updateElementColor = (key: keyof ElementColorsConfig, val: string) => {
    updateDraft((prev) => {
      const next = { ...(prev.elementColors || {}) };
      if (!val.trim()) {
        delete next[key];
      } else {
        next[key] = val.trim();
      }
      return { ...prev, elementColors: next };
    });
  };

  const applyBgToAllElements = (hex: string) => {
    updateDraft((prev) => ({
      ...prev,
      elementColors: {
        ...(prev.elementColors || {}),
        headerBg: hex,
        heroBg: hex,
        progressBg: hex,
        readerBg: hex,
        quoteBg: hex,
        practicesBg: hex,
        competitionBg: hex,
        footerBg: hex,
      },
    }));
  };

  const applyTextToAllElements = (hex: string) => {
    updateDraft((prev) => ({
      ...prev,
      elementColors: {
        ...(prev.elementColors || {}),
        headerText: hex,
        heroNameColor: hex,
        heroSubtitleColor: hex,
        progressText: hex,
        readerText: hex,
        quoteText: hex,
        practicesText: hex,
        competitionText: hex,
        footerText: hex,
      },
    }));
  };

  const resetAllElementColors = () => {
    updateDraft((prev) => ({
      ...prev,
      elementColors: {},
    }));
  };

  const hasCustomElementColors = Object.values(colors).some((v) => Boolean(v && v.trim()));

  return (
    <div className="space-y-6 pt-4 border-t border-stone-200 dark:border-white/10">
      {/* 1. Section Reordering */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">
              {lang === 'ar'
                ? 'إعادة ترتيب أماكن أقسام الصفحة'
                : 'Reorder Page Sections'}
            </h3>
          </div>
          <button
            type="button"
            onClick={resetSectionOrder}
            className="min-h-[30px] px-2.5 app-control border border-stone-200 dark:border-white/15 text-[11px] font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{lang === 'ar' ? 'الترتيب الافتراضي' : 'Reset Order'}</span>
          </button>
        </div>

        <div className="space-y-2">
          {order.map((secId, idx) => {
            const label = SECTION_LABELS[secId];
            return (
              <div
                key={secId}
                className="p-2.5 px-3 app-control border border-stone-200 dark:border-white/10 bg-stone-50/70 dark:bg-black/20 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-extrabold flex items-center justify-center shrink-0 tabular-nums">
                    {formatNumber(idx + 1, lang)}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-100 truncate">
                    {lang === 'ar' ? label.ar : label.en}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveSection(idx, -1)}
                    aria-label={lang === 'ar' ? 'تحريك لأعلى' : 'Move up'}
                    className="min-w-[34px] min-h-[34px] app-control border border-stone-200 dark:border-white/15 bg-white dark:bg-black/30 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === order.length - 1}
                    onClick={() => moveSection(idx, 1)}
                    aria-label={lang === 'ar' ? 'تحريك لأسفل' : 'Move down'}
                    className="min-w-[34px] min-h-[34px] app-control border border-stone-200 dark:border-white/15 bg-white dark:bg-black/30 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Thumbnails & Cards Arrangement */}
      <div className="p-4 app-control border border-stone-200 dark:border-white/10 bg-stone-50/70 dark:bg-black/20 space-y-4">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">
            {lang === 'ar'
              ? 'ترتيب المصغّرات (اللوجو) والبطاقات'
              : 'Thumbnails & Cards Arrangement'}
          </h3>
        </div>

        {/* Hero Logo Position */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-stone-600 dark:text-stone-300">
            {lang === 'ar' ? 'مكان اللوجو مع اسم الشخص' : 'Logo Thumbnail Position'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['side', lang === 'ar' ? 'بجانب الاسم' : 'Side by Side'],
                ['top', lang === 'ar' ? 'أعلى بالمنتصف' : 'Centered Top'],
                ['banner', lang === 'ar' ? 'شريط عريض' : 'Wide Banner'],
              ] as [HeroLogoPosition, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => updateLayout({ heroLogoPosition: val })}
                className={`min-h-[38px] px-2 app-control border text-xs font-bold cursor-pointer transition-colors ${
                  layout.heroLogoPosition === val
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'border-stone-200 dark:border-white/15 bg-white dark:bg-black/30 text-stone-700 dark:text-stone-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Hero Sub-Order: Welcome first vs Journey first */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-stone-600 dark:text-stone-300">
            {lang === 'ar' ? 'ترتيب قسم الترحيب والطريق' : 'Hero Internal Arrangement'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['welcome-first', lang === 'ar' ? 'الاسم والترحيب أولاً' : 'Welcome & Name First'],
                ['journey-first', lang === 'ar' ? 'الطريق إلى بيت لحم أولاً' : 'Journey / Heart First'],
              ] as [HeroArrangement, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => updateLayout({ heroArrangement: val })}
                className={`min-h-[38px] px-2 app-control border text-xs font-bold cursor-pointer transition-colors ${
                  layout.heroArrangement === val
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'border-stone-200 dark:border-white/15 bg-white dark:bg-black/30 text-stone-700 dark:text-stone-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Thumbnail Shape & Size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-600 dark:text-stone-300">
              {lang === 'ar' ? 'شكل مصغّر اللوجو' : 'Thumbnail Shape'}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  ['rounded', lang === 'ar' ? 'ناعم' : 'Rounded'],
                  ['circle', lang === 'ar' ? 'دائري' : 'Circle'],
                  ['square', lang === 'ar' ? 'مربّع' : 'Square'],
                ] as [LogoShape, string][]
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => updateLayout({ logoShape: val })}
                  className={`min-h-[36px] px-2 app-control border text-xs font-bold cursor-pointer transition-colors ${
                    layout.logoShape === val
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'border-stone-200 dark:border-white/15 bg-white dark:bg-black/30 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-600 dark:text-stone-300">
              {lang === 'ar' ? 'حجم مصغّر اللوجو' : 'Thumbnail Size'}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  ['sm', lang === 'ar' ? 'صغير' : 'Small'],
                  ['md', lang === 'ar' ? 'متوسط' : 'Medium'],
                  ['lg', lang === 'ar' ? 'كبير' : 'Large'],
                ] as [HeroIconSize, string][]
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => updateLayout({ logoSize: val })}
                  className={`min-h-[36px] px-2 app-control border text-xs font-bold cursor-pointer transition-colors ${
                    layout.logoSize === val
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'border-stone-200 dark:border-white/15 bg-white dark:bg-black/30 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cards Grid Arrangement */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-stone-600 dark:text-stone-300">
            {lang === 'ar' ? 'ترتيب شبكة البطاقات (التقدّم والأقوال والتداريب)' : 'Cards & Grid Arrangement'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['two-column', lang === 'ar' ? 'عمودان' : 'Two Columns'],
                ['stacked', lang === 'ar' ? 'فوق بعض (عمود)' : 'Stacked'],
                ['compact', lang === 'ar' ? 'متقارب (مضغوط)' : 'Compact'],
              ] as [CardsArrangement, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => updateLayout({ cardsArrangement: val })}
                className={`min-h-[38px] px-2 app-control border text-xs font-bold cursor-pointer transition-colors ${
                  layout.cardsArrangement === val
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'border-stone-200 dark:border-white/15 bg-white dark:bg-black/30 text-stone-700 dark:text-stone-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. All-Elements & Per-Element Color Controls */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Paintbrush className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">
              {lang === 'ar'
                ? 'تعديل ألوان كل عنصر على حدة أو الكل معاً'
                : 'All & Individual Element Color Adjustments'}
            </h3>
          </div>
          {hasCustomElementColors && (
            <button
              type="button"
              onClick={resetAllElementColors}
              className="min-h-[30px] px-2.5 app-control border border-red-300 dark:border-red-500/40 text-[11px] font-bold text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{lang === 'ar' ? 'إعادة ضبط ألوان كل العناصر' : 'Reset All Elements'}</span>
            </button>
          )}
        </div>

        {/* Master "Apply to All Elements" Bar */}
        <div className="p-3.5 app-control border border-[var(--accent)]/30 bg-[var(--accent-soft)]/30 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-stone-800 dark:text-stone-100">
            {lang === 'ar' ? 'تطبيق موحّد على كل البطاقات والعناصر:' : 'Apply Uniform Color to All Elements:'}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <label className="min-h-[34px] px-2.5 py-1 app-control border border-stone-300 dark:border-white/15 bg-white dark:bg-black/30 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer">
              <input
                type="color"
                value={colors.readerBg || '#22191C'}
                onChange={(e) => applyBgToAllElements(e.target.value)}
                className="w-4 h-4 border-0 bg-transparent cursor-pointer"
              />
              <span>{lang === 'ar' ? 'خلفية الكل' : 'All Backgrounds'}</span>
            </label>
            <label className="min-h-[34px] px-2.5 py-1 app-control border border-stone-300 dark:border-white/15 bg-white dark:bg-black/30 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer">
              <input
                type="color"
                value={colors.readerText || '#F8F4F4'}
                onChange={(e) => applyTextToAllElements(e.target.value)}
                className="w-4 h-4 border-0 bg-transparent cursor-pointer"
              />
              <span>{lang === 'ar' ? 'نصوص الكل' : 'All Texts'}</span>
            </label>
          </div>
        </div>

        {/* Individual Element Rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ELEMENT_GROUPS.map((group) => (
            <div
              key={group.id}
              className="p-3 app-control border border-stone-200 dark:border-white/10 bg-stone-50/70 dark:bg-black/20 space-y-2"
            >
              <div className="text-xs font-extrabold text-stone-800 dark:text-stone-100">
                {lang === 'ar' ? group.titleAr : group.titleEn}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {group.slots.map((slot) => {
                  const val = colors[slot.key] || '';
                  return (
                    <div
                      key={slot.key}
                      className="flex items-center gap-1 px-2 py-1 app-control border border-stone-200 dark:border-white/15 bg-white dark:bg-black/30"
                    >
                      <input
                        type="color"
                        aria-label={`${lang === 'ar' ? group.titleAr : group.titleEn} - ${lang === 'ar' ? slot.labelAr : slot.labelEn}`}
                        value={val || slot.defaultPreview}
                        onChange={(e) => updateElementColor(slot.key, e.target.value)}
                        className="w-4 h-4 border-0 bg-transparent cursor-pointer"
                      />
                      <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-200">
                        {lang === 'ar' ? slot.labelAr : slot.labelEn}
                      </span>
                      {val && (
                        <button
                          type="button"
                          onClick={() => updateElementColor(slot.key, '')}
                          title={lang === 'ar' ? 'إزالة اللون' : 'Reset'}
                          aria-label={lang === 'ar' ? 'إزالة اللون' : 'Reset'}
                          className="text-stone-400 hover:text-red-500 ms-0.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
