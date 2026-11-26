import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, CheckCircle2, Lock, Minus, Plus, Share2 } from 'lucide-react';
import {
  formatNumber,
  formatReadingRange,
  getChapterDay,
  getDayPlan,
  GOSPEL_ORDER,
} from '../data/readingPlan';
import type { DayPlan, GospelKey, GospelsDataset, Language } from '../types';

interface GospelReaderProps {
  lang: Language;
  currentDay: number;
  readingPlan: DayPlan[];
  maxUnlockedDay: number;
  sequentialLock: boolean;
  isDayCompleted: boolean;
  fontSize: number;
  title: string;
  editionLabel: string;
  markReadBtn: string;
  markReadDoneBtn: string;
  encouragementMsg: string;
  onFontSizeChange: (size: number) => void;
  onToggleDayCompleted: () => void;
  onLockedDayAttempt: (day: number) => void;
  onShareText: (text: string) => void;
}

type ReaderTab = 'today' | GospelKey;

export const GospelReader: React.FC<GospelReaderProps> = ({
  lang,
  currentDay,
  readingPlan,
  maxUnlockedDay,
  sequentialLock,
  isDayCompleted,
  fontSize,
  title,
  editionLabel,
  markReadBtn,
  markReadDoneBtn,
  encouragementMsg,
  onFontSizeChange,
  onToggleDayCompleted,
  onLockedDayAttempt,
  onShareText,
}) => {
  const [datasets, setDatasets] = useState<{ ar?: GospelsDataset; en?: GospelsDataset }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [activeTab, setActiveTab] = useState<ReaderTab>('today');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);

  const loadDataset = async (targetLang: Language) => {
    if (datasets[targetLang]) {
      setLoading(false);
      setError(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/gospels-${targetLang}.json`);
      if (!res.ok) throw new Error('Failed to load');
      const json = (await res.json()) as GospelsDataset;
      setDatasets((prev) => ({ ...prev, [targetLang]: json }));
      setLoading(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataset(lang);
  }, [lang]);

  // Reset selected verse when switching day/tab/chapter
  useEffect(() => {
    setSelectedVerseKey(null);
  }, [currentDay, activeTab, selectedChapter]);

  // If sequential lock tightens (e.g. unmarking an earlier day), ensure no locked chapter stays open
  useEffect(() => {
    if (sequentialLock && activeTab !== 'today') {
      const chDay = getChapterDay(activeTab, selectedChapter, readingPlan);
      if (chDay > maxUnlockedDay) {
        setActiveTab('today');
      }
    }
  }, [sequentialLock, maxUnlockedDay, activeTab, selectedChapter, readingPlan]);

  // When clicking a gospel tab, default to chapter 1 (or the first chapter of that gospel in today's plan if applicable)
  const handleTabChange = (tab: ReaderTab) => {
    if (tab !== 'today') {
      const firstChapterDay = getChapterDay(tab, 1, readingPlan);
      if (sequentialLock && firstChapterDay > maxUnlockedDay) {
        onLockedDayAttempt(firstChapterDay);
        return;
      }
      setActiveTab(tab);
      const plan = getDayPlan(currentDay, readingPlan);
      const match = plan.readings.find((r) => r.book === tab);
      const candidate = match ? match.chapter : 1;
      setSelectedChapter(
        !sequentialLock || getChapterDay(tab, candidate, readingPlan) <= maxUnlockedDay ? candidate : 1
      );
      return;
    }
    setActiveTab(tab);
  };

  const dayPlan = useMemo(() => getDayPlan(currentDay, readingPlan), [currentDay, readingPlan]);
  const activeDataset = datasets[lang];

  // Build chapters to render
  const chaptersToRender = useMemo(() => {
    if (!activeDataset) return [];
    if (activeTab === 'today') {
      return dayPlan.readings.map((ref) => {
        const book = activeDataset[ref.book];
        const verses = book?.chapters[ref.chapter - 1] || [];
        return {
          bookKey: ref.book,
          bookName: lang === 'ar' ? book?.nameAr : book?.nameEn,
          shortName: lang === 'ar' ? book?.shortAr : book?.nameEn,
          chapter: ref.chapter,
          verses,
        };
      });
    } else {
      const book = activeDataset[activeTab];
      const maxCh = book?.chapters.length || 1;
      const safeCh = Math.max(1, Math.min(maxCh, selectedChapter));
      return [
        {
          bookKey: activeTab,
          bookName: lang === 'ar' ? book?.nameAr : book?.nameEn,
          shortName: lang === 'ar' ? book?.shortAr : book?.nameEn,
          chapter: safeCh,
          verses: book?.chapters[safeCh - 1] || [],
        },
      ];
    }
  }, [activeDataset, activeTab, dayPlan, lang, selectedChapter]);

  const handleShareCurrentReading = () => {
    if (chaptersToRender.length === 0) return;
    const refLabel =
      activeTab === 'today'
        ? formatReadingRange(dayPlan.readings, lang)
        : `${chaptersToRender[0].bookName} ${formatNumber(chaptersToRender[0].chapter, lang)}`;
    const firstVerse = chaptersToRender[0].verses[0] || '';
    const msg =
      lang === 'ar'
        ? `قراءة اليوم (${refLabel} — ترجمة فاندايك):\n"${firstVerse}"`
        : `Today's Gospel Reading (${refLabel}):\n"${firstVerse}"`;
    onShareText(msg);
  };

  const selectedBookMeta =
    activeTab !== 'today' ? GOSPEL_ORDER.find((g) => g.key === activeTab) : null;

  return (
    <section
      className="app-card border border-stone-200 dark:border-white/10 bg-white dark:bg-[#22191C] overflow-hidden"
      aria-labelledby="gospel-reader-heading"
    >
      {/* Top Reader Header */}
      <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-white/10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{editionLabel}</span>
            </div>
            <h2
              id="gospel-reader-heading"
              className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white"
            >
              {title}
            </h2>
          </div>

          {/* Font size & Share controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-stone-200 dark:border-white/10 app-control bg-stone-50 dark:bg-white/5 overflow-hidden">
              <button
                type="button"
                onClick={() => onFontSizeChange(fontSize - 2)}
                disabled={fontSize <= 16}
                aria-label={lang === 'ar' ? 'تصغير الخط' : 'Decrease font size'}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-stone-200/70 dark:hover:bg-white/10 disabled:opacity-35 transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-bold text-stone-600 dark:text-stone-300 tabular-nums select-none">
                {lang === 'ar' ? 'حجم الخط' : 'Text'}
              </span>
              <button
                type="button"
                onClick={() => onFontSizeChange(fontSize + 2)}
                disabled={fontSize >= 30}
                aria-label={lang === 'ar' ? 'تكبير الخط' : 'Increase font size'}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-stone-200/70 dark:hover:bg-white/10 disabled:opacity-35 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleShareCurrentReading}
              className="min-h-[40px] px-3 app-control border border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/10 text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{lang === 'ar' ? 'مشاركة' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Gospel Quick Tabs: Today's Plan + 4 Gospels */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1"
          role="tablist"
          aria-label={lang === 'ar' ? 'تبويبات الأناجيل' : 'Gospel tabs'}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'today'}
            onClick={() => handleTabChange('today')}
            className={`min-h-[40px] px-4 py-2 app-control text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeTab === 'today'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/10'
            }`}
          >
            {lang === 'ar'
              ? `ورد اليوم (${formatReadingRange(dayPlan.readings, 'ar')})`
              : `Today (${formatReadingRange(dayPlan.readings, 'en')})`}
          </button>

          {GOSPEL_ORDER.map((g) => {
            const bookFirstDay = getChapterDay(g.key, 1, readingPlan);
            const isBookLocked = sequentialLock && bookFirstDay > maxUnlockedDay;
            return (
              <button
                key={g.key}
                type="button"
                role="tab"
                aria-selected={activeTab === g.key}
                onClick={() => handleTabChange(g.key)}
                className={`min-h-[40px] px-4 py-2 app-control text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === g.key
                    ? 'bg-[var(--accent)] text-white'
                    : isBookLocked
                    ? 'bg-stone-100/60 dark:bg-white/[0.03] text-stone-400 dark:text-stone-500'
                    : 'bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/10'
                }`}
              >
                {isBookLocked && <Lock className="w-3 h-3 shrink-0" />}
                <span>{lang === 'ar' ? g.shortAr : g.nameEn}</span>
              </button>
            );
          })}
        </div>

        {/* Chapter Selector when browsing an individual Gospel */}
        {activeTab !== 'today' && selectedBookMeta && (
          <div className="pt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 me-1">
              {lang === 'ar' ? 'الأصحاح:' : 'Chapter:'}
            </span>
            {Array.from({ length: selectedBookMeta.chaptersCount }, (_, i) => i + 1).map((ch) => {
              const chDay = getChapterDay(activeTab, ch, readingPlan);
              const isChLocked = sequentialLock && chDay > maxUnlockedDay;
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => {
                    if (isChLocked) {
                      onLockedDayAttempt(chDay);
                      return;
                    }
                    setSelectedChapter(ch);
                  }}
                  className={`min-w-[36px] min-h-[36px] px-2 app-control text-xs font-bold tabular-nums transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                    selectedChapter === ch
                      ? 'bg-[var(--accent)] text-white'
                      : isChLocked
                      ? 'bg-stone-100/60 dark:bg-white/[0.03] text-stone-400 dark:text-stone-600'
                      : 'bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/10'
                  }`}
                >
                  {isChLocked && <Lock className="w-2.5 h-2.5 shrink-0" />}
                  <span>{formatNumber(ch, lang)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Scripture Reading Body */}
      <div className="p-5 sm:p-8">
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {lang === 'ar' ? 'جاري تحميل نص الإنجيل...' : 'Loading Gospel text...'}
            </p>
          </div>
        ) : error ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-sm text-stone-600 dark:text-stone-300">
              {lang === 'ar'
                ? 'تعذّر تحميل نص الإنجيل الآن.'
                : 'Unable to load Gospel text right now.'}
            </p>
            <button
              type="button"
              onClick={() => loadDataset(lang)}
              className="min-h-[40px] px-4 py-2 app-control bg-[var(--accent)] text-white text-xs font-semibold cursor-pointer"
            >
              {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-10">
            {chaptersToRender.map((chBlock) => (
              <article key={`${chBlock.bookKey}-${chBlock.chapter}`} className="space-y-5">
                <header className="pb-3 border-b border-stone-200 dark:border-white/10 flex items-baseline justify-between gap-3">
                  <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white">
                    {chBlock.bookName} —{' '}
                    <span className="text-[var(--accent)]">
                      {lang === 'ar'
                        ? `الأصحاح ${formatNumber(chBlock.chapter, 'ar')}`
                        : `Chapter ${chBlock.chapter}`}
                    </span>
                  </h3>
                  <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                    {lang === 'ar'
                      ? `${formatNumber(chBlock.verses.length, 'ar')} آية`
                      : `${chBlock.verses.length} verses`}
                  </span>
                </header>

                <div
                  className="font-scripture text-stone-900 dark:text-stone-100 leading-[2.15] space-y-2.5 select-text"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {chBlock.verses.map((verseText, vIdx) => {
                    const verseNum = vIdx + 1;
                    const vKey = `${chBlock.bookKey}-${chBlock.chapter}-${verseNum}`;
                    const isSelected = selectedVerseKey === vKey;
                    return (
                      <div
                        key={vKey}
                        onClick={() => setSelectedVerseKey(isSelected ? null : vKey)}
                        className={`rounded-lg px-2.5 py-1.5 -mx-2.5 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--accent-soft)]'
                            : 'hover:bg-stone-100/80 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="inline-block font-ui text-xs font-bold text-[var(--accent)] me-2 tabular-nums align-middle">
                          ﴿{formatNumber(verseNum, lang)}﴾
                        </span>
                        <span>{verseText}</span>
                        {isSelected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const ref = `${chBlock.shortName} ${formatNumber(
                                chBlock.chapter,
                                lang
                              )}: ${formatNumber(verseNum, lang)}`;
                              onShareText(`«${verseText}»\n(${ref})`);
                            }}
                            className="ms-3 inline-flex items-center gap-1 font-ui text-xs font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-2.5 py-1 rounded-md align-middle transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>{lang === 'ar' ? 'مشاركة الآية' : 'Share Verse'}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}

            {/* Hint for verse tap */}
            <p className="text-xs text-center text-stone-400 dark:text-stone-500 pt-2">
              {lang === 'ar'
                ? 'اضغط على أي آية لتحديدها ومشاركتها بسهولة'
                : 'Tap any verse to highlight and share it'}
            </p>
          </div>
        )}
      </div>

      {/* Completion Action Footer */}
      <div className="px-5 py-5 sm:px-8 border-t border-stone-200 dark:border-white/10 bg-stone-50/70 dark:bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-start">
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
            {isDayCompleted
              ? encouragementMsg
              : lang === 'ar'
              ? `أنهيت قراءة اليوم ${formatNumber(currentDay, 'ar')} (${formatReadingRange(
                  dayPlan.readings,
                  'ar'
                )})؟`
              : `Finished Day ${currentDay} (${formatReadingRange(dayPlan.readings, 'en')})?`}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {lang === 'ar'
              ? 'يتم حفظ تقدمك تلقائياً على جهازك'
              : 'Your progress is saved automatically on this device'}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleDayCompleted}
          className={`w-full sm:w-auto min-h-[48px] px-6 py-3 app-control text-sm sm:text-base font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer ${
            isDayCompleted
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-lg shadow-[var(--accent-glow)]'
          }`}
        >
          {isDayCompleted ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>{markReadDoneBtn}</span>
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>{markReadBtn}</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};
