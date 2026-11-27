import React, { useState } from 'react';
import { Calendar, Check, ChevronLeft, ChevronRight, Flame, Lock } from 'lucide-react';
import {
  formatDateReadable,
  formatNumber,
  formatReadingRange,
  getChapterPaceSummary,
  getDayDateString,
  getDayPlan,
  TOTAL_LENT_DAYS,
} from '../data/readingPlan';
import type { DayPlan, Language } from '../types';

interface ProgressAndDayNavProps {
  lang: Language;
  currentDay: number;
  totalDays: number;
  readingPlan: DayPlan[];
  completedDays: number[];
  planStartDate: string;
  lentEndDate: string;
  stats: {
    completedDaysCount: number;
    completedChapters: number;
    totalChapters: number;
    percent: number;
    streak: number;
  };
  maxUnlockedDay: number;
  sequentialLock: boolean;
  copy: {
    progressTitle: string;
    streakTitle: string;
    streakLabel: string;
    completedDaysLabel: string;
  };
  onSelectDay: (day: number) => void;
  onLockedDayAttempt: (targetDay: number) => void;
  onJumpToToday: () => void;
}

export const ProgressAndDayNav: React.FC<ProgressAndDayNavProps> = ({
  lang,
  currentDay,
  totalDays,
  readingPlan,
  completedDays,
  planStartDate,
  lentEndDate,
  stats,
  maxUnlockedDay,
  sequentialLock,
  copy,
  onSelectDay,
  onLockedDayAttempt,
  onJumpToToday,
}) => {
  const [showDayPicker, setShowDayPicker] = useState(false);
  const completedSet = new Set(completedDays);
  const isNextLocked = sequentialLock && currentDay >= maxUnlockedDay && currentDay < totalDays;
  const dayPlan = getDayPlan(currentDay, readingPlan);
  const dateLabel = getDayDateString(planStartDate, currentDay, lang);
  const readingSummary = formatReadingRange(dayPlan.readings, lang);
  const pace = getChapterPaceSummary(totalDays, lang);
  const endLabel = formatDateReadable(lentEndDate, lang);

  // Direction-aware prev/next icons
  const PrevIcon = lang === 'ar' ? ChevronRight : ChevronLeft;
  const NextIcon = lang === 'ar' ? ChevronLeft : ChevronRight;

  return (
    <section className="space-y-4" aria-label={copy.progressTitle}>
      {/* Two Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Gospel Reading Completion % */}
        <div className="app-card border border-stone-200 dark:border-white/10 bg-white dark:bg-[#22191C] p-5 flex flex-col justify-between gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-stone-600 dark:text-stone-300">
              {copy.progressTitle}
            </h2>
            <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
              {lang === 'ar'
                ? `${formatNumber(stats.completedChapters, 'ar')} من ${formatNumber(stats.totalChapters, 'ar')} أصحاح`
                : `${stats.completedChapters} of ${stats.totalChapters} chapters`}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-white tabular-nums">
              {formatNumber(stats.percent, lang)}%
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {lang === 'ar' ? 'من الأناجيل الأربعة' : 'of the Four Gospels'}
            </span>
          </div>

          <div
            className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-white/10 overflow-hidden"
            role="progressbar"
            aria-valuenow={stats.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${stats.percent}%` }}
            />
          </div>

          <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 tabular-nums">
            {totalDays < TOTAL_LENT_DAYS
              ? lang === 'ar'
                ? `خطتك المخصّصة: ${formatNumber(stats.totalChapters, 'ar')} أصحاحاً ÷ ${formatNumber(totalDays, 'ar')} يوماً (${pace.label}) حتى ${endLabel}`
                : `Your adjusted plan: ${stats.totalChapters} chapters ÷ ${totalDays} days (${pace.label}) until ${endLabel}`
              : lang === 'ar'
              ? `خطتك: ${formatNumber(totalDays, 'ar')} يوماً (${pace.label}) · حتى ${endLabel}`
              : `Your plan: ${totalDays} days (${pace.label}) · Until ${endLabel}`}
          </p>
        </div>

        {/* Card 2: Streak & Total Completed Days */}
        <div className="app-card border border-stone-200 dark:border-white/10 bg-white dark:bg-[#22191C] p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-stone-600 dark:text-stone-300">
              {copy.streakTitle}
            </h2>
            <Flame className="w-4 h-4 text-[var(--accent)]" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tabular-nums">
                {formatNumber(stats.streak, lang)}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {copy.streakLabel}
              </div>
            </div>

            <div className="border-s border-stone-200 dark:border-white/10 ps-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tabular-nums">
                {formatNumber(stats.completedDaysCount, lang)}
                <span className="text-sm font-medium text-stone-400 dark:text-stone-500">
                  {' '}
                  / {formatNumber(totalDays, lang)}
                </span>
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {copy.completedDaysLabel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Day Navigator Bar */}
      <div className="app-card border border-stone-200 dark:border-white/10 bg-white dark:bg-[#22191C] p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSelectDay(currentDay - 1)}
            disabled={currentDay <= 1}
            aria-label={lang === 'ar' ? 'اليوم السابق' : 'Previous day'}
            className="min-w-[44px] min-h-[44px] app-control border border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/10 disabled:opacity-35 disabled:pointer-events-none text-stone-700 dark:text-stone-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <PrevIcon className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setShowDayPicker((v) => !v)}
            className="flex-1 min-h-[44px] px-3 py-1.5 app-control hover:bg-stone-50 dark:hover:bg-white/5 flex flex-col items-center justify-center text-center transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-stone-900 dark:text-white tabular-nums">
              <span>
                {lang === 'ar'
                  ? `اليوم ${formatNumber(currentDay, 'ar')} من ${formatNumber(totalDays, 'ar')}`
                  : `Day ${currentDay} of ${totalDays}`}
              </span>
              {completedSet.has(currentDay) && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent)] text-white">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              <span>{dateLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[var(--accent)]">{readingSummary}</span>
              <span aria-hidden="true">·</span>
              <span>
                {lang === 'ar'
                  ? `الأسبوع ${formatNumber(dayPlan.week, 'ar')}`
                  : `Week ${dayPlan.week}`}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isNextLocked) {
                onLockedDayAttempt(currentDay + 1);
              } else {
                onSelectDay(currentDay + 1);
              }
            }}
            disabled={currentDay >= totalDays}
            aria-label={
              isNextLocked
                ? lang === 'ar'
                  ? 'اليوم التالي مقفول حتى إتمام اليوم الحالي'
                  : 'Next day locked until current day is completed'
                : lang === 'ar'
                ? 'اليوم التالي'
                : 'Next day'
            }
            title={
              isNextLocked
                ? lang === 'ar'
                  ? `أنهِ اليوم ${formatNumber(currentDay, 'ar')} أولاً`
                  : `Finish Day ${currentDay} first`
                : undefined
            }
            className={`min-w-[44px] min-h-[44px] app-control border border-stone-200 dark:border-white/10 disabled:opacity-35 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer ${
              isNextLocked
                ? 'bg-stone-100/70 dark:bg-white/5 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-white/10'
                : 'hover:bg-stone-100 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200'
            }`}
          >
            {isNextLocked ? <Lock className="w-4 h-4" /> : <NextIcon className="w-5 h-5" />}
          </button>
        </div>

        {/* Expandable 43-Day Calendar Grid */}
        {showDayPicker && (
          <div className="mt-4 pt-4 border-t border-stone-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
                {lang === 'ar'
                  ? `اختر يوماً من خطتك (${formatNumber(totalDays, 'ar')} يوماً)`
                  : `Jump to any day (${totalDays}-day plan)`}
              </span>
              <button
                type="button"
                onClick={() => {
                  onJumpToToday();
                  setShowDayPicker(false);
                }}
                className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
              >
                {lang === 'ar' ? 'الانتقال لليوم الحالي' : 'Go to Today'}
              </button>
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-11 gap-1.5">
              {Array.from({ length: totalDays }, (_, idx) => idx + 1).map((d) => {
                const isActive = d === currentDay;
                const isDone = completedSet.has(d);
                const isLocked = sequentialLock && d > maxUnlockedDay;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      if (isLocked) {
                        onLockedDayAttempt(d);
                        return;
                      }
                      onSelectDay(d);
                      setShowDayPicker(false);
                    }}
                    className={`min-h-[38px] app-control text-xs font-bold tabular-nums transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                      isActive
                        ? 'bg-[var(--accent)] text-white'
                        : isDone
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30'
                        : isLocked
                        ? 'bg-stone-100/60 dark:bg-white/[0.03] text-stone-400 dark:text-stone-600'
                        : 'bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {isLocked && <Lock className="w-2.5 h-2.5 shrink-0" />}
                    <span>{formatNumber(d, lang)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
