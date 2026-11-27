import React from 'react';
import { Check, CheckSquare, Quote, Share2 } from 'lucide-react';
import { formatNumber } from '../data/readingPlan';
import type { CardsArrangement, FatherQuote, Language, WeeklyPractice } from '../types';

interface QuoteAndPracticesProps {
  lang: Language;
  currentDay: number;
  currentWeek: number;
  cardsArrangement?: CardsArrangement;
  quoteSectionTitle: string;
  practicesSectionTitle: string;
  quote: FatherQuote | undefined;
  weekPractices: WeeklyPractice[];
  checkedPractices: Record<string, boolean>;
  onTogglePractice: (id: string) => void;
  onShareText: (text: string) => void;
}

export const QuoteAndPractices: React.FC<QuoteAndPracticesProps> = ({
  lang,
  currentDay,
  currentWeek,
  cardsArrangement = 'two-column',
  quoteSectionTitle,
  practicesSectionTitle,
  quote,
  weekPractices,
  checkedPractices,
  onTogglePractice,
  onShareText,
}) => {
  const completedCount = weekPractices.filter((p) => checkedPractices[p.id]).length;
  const totalCount = weekPractices.length;
  const weekPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const quoteText = quote ? (lang === 'ar' ? quote.textAr : quote.textEn) : '';
  const saintName = quote ? (lang === 'ar' ? quote.saintAr : quote.saintEn) : '';

  const gridClass =
    cardsArrangement === 'stacked'
      ? 'grid grid-cols-1 gap-6 items-stretch'
      : cardsArrangement === 'compact'
      ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch'
      : 'grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch';
  const cardPadClass = cardsArrangement === 'compact' ? 'p-4 sm:p-5' : 'p-6 sm:p-7';

  return (
    <section className={gridClass}>
      {/* 6. Quote of the Day from the Church Fathers */}
      <div
        data-el="quote"
        className={`app-card border border-stone-200 dark:border-white/10 bg-white dark:bg-[#22191C] ${cardPadClass} flex flex-col justify-between gap-6`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Quote className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
                {quoteSectionTitle}
              </h2>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
              {lang === 'ar' ? `اليوم ${formatNumber(currentDay, 'ar')}` : `Day ${currentDay}`}
            </span>
          </div>

          <div className="py-3 border-y border-stone-100 dark:border-white/10">
            {quote ? (
              <blockquote
                data-el="quote-text"
                className="font-scripture text-xl sm:text-2xl leading-[1.9] text-stone-900 dark:text-stone-100"
              >
                «{quoteText}»
              </blockquote>
            ) : (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {lang === 'ar'
                  ? 'لا يوجد قول مضاف لهذا اليوم بعد.'
                  : 'No quote added for this day yet.'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <cite className="not-italic text-sm font-bold text-[var(--accent)]">
            — {saintName}
          </cite>

          {quote && (
            <button
              type="button"
              onClick={() => onShareText(`«${quoteText}»\n— ${saintName}`)}
              className="min-h-[40px] px-3.5 py-2 app-control border border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/10 text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{lang === 'ar' ? 'مشاركة القول' : 'Share Quote'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 7. Interactive Weekly Practices */}
      <div
        data-el="practices"
        className={`app-card border border-stone-200 dark:border-white/10 bg-white dark:bg-[#22191C] ${cardPadClass} flex flex-col justify-between gap-5`}
      >
        <div data-el="practices-text" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
                {practicesSectionTitle}
              </h2>
            </div>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 tabular-nums">
              {lang === 'ar'
                ? `الأسبوع ${formatNumber(currentWeek, 'ar')}`
                : `Week ${currentWeek}`}
            </span>
          </div>

          {/* Weekly Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 tabular-nums">
              <span>
                {lang === 'ar'
                  ? `تم إنجاز ${formatNumber(completedCount, 'ar')} من ${formatNumber(totalCount, 'ar')}`
                  : `${completedCount} of ${totalCount} completed`}
              </span>
              <span className="font-bold text-stone-800 dark:text-stone-200">
                {formatNumber(weekPercent, lang)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: `${weekPercent}%` }}
              />
            </div>
          </div>

          {/* Practices Checklist */}
          <ul className="divide-y divide-stone-100 dark:divide-white/10">
            {weekPractices.length === 0 ? (
              <li className="py-4 text-sm text-stone-500 dark:text-stone-400">
                {lang === 'ar'
                  ? 'لا توجد تداريب مضافة لهذا الأسبوع. يمكنك إضافتها من لوحة التحكم.'
                  : 'No practices added for this week yet. You can add them from Settings.'}
              </li>
            ) : (
              weekPractices.map((practice) => {
                const isChecked = !!checkedPractices[practice.id];
                const label = lang === 'ar' ? practice.textAr : practice.textEn;
                return (
                  <li key={practice.id}>
                    <label className="min-h-[48px] py-3 flex items-start gap-3 cursor-pointer group select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onTogglePractice(practice.id)}
                        className="sr-only"
                      />
                      <span
                        className={`mt-0.5 w-5 h-5 shrink-0 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                            : 'border-stone-300 dark:border-white/25 bg-transparent group-hover:border-[var(--accent)]'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                      </span>
                      <span
                        className={`text-sm leading-relaxed transition-colors ${
                          isChecked
                            ? 'line-through text-stone-400 dark:text-stone-500'
                            : 'text-stone-800 dark:text-stone-200'
                        }`}
                      >
                        {label}
                      </span>
                    </label>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </section>
  );
};
