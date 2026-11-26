import type { ChapterRef, DayPlan, GospelKey } from '../types';

export const TOTAL_LENT_DAYS = 43;
export const TOTAL_GOSPEL_CHAPTERS = 89;
export const DEFAULT_COMPETITION_END_DATE = '2027-01-06';

export const GOSPEL_ORDER: {
  key: GospelKey;
  chaptersCount: number;
  nameAr: string;
  shortAr: string;
  nameEn: string;
}[] = [
  { key: 'matthew', chaptersCount: 28, nameAr: 'إنجيل متى', shortAr: 'متى', nameEn: 'Matthew' },
  { key: 'mark', chaptersCount: 16, nameAr: 'إنجيل مرقس', shortAr: 'مرقس', nameEn: 'Mark' },
  { key: 'luke', chaptersCount: 24, nameAr: 'إنجيل لوقا', shortAr: 'لوقا', nameEn: 'Luke' },
  { key: 'john', chaptersCount: 21, nameAr: 'إنجيل يوحنا', shortAr: 'يوحنا', nameEn: 'John' },
];

// Build flat sequential list of all 89 chapters across Matthew (28), Mark (16), Luke (24), John (21)
export const ALL_CHAPTERS: ChapterRef[] = GOSPEL_ORDER.flatMap((g) =>
  Array.from({ length: g.chaptersCount }, (_, idx) => ({
    book: g.key,
    chapter: idx + 1,
  }))
);

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDaysBetweenInclusive(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return TOTAL_LENT_DAYS;
  }
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
}

/**
 * Dynamically divides all 89 chapters of the Four Gospels across `totalDays`.
 * Ensures every day stays sequential through Matthew -> Mark -> Luke -> John.
 */
export function buildReadingPlan(totalDays: number): DayPlan[] {
  const safeDays = Math.max(1, totalDays);
  const plan: DayPlan[] = [];

  if (safeDays <= TOTAL_GOSPEL_CHAPTERS) {
    const base = Math.floor(TOTAL_GOSPEL_CHAPTERS / safeDays);
    const remainder = TOTAL_GOSPEL_CHAPTERS % safeDays;
    let cursor = 0;

    for (let day = 1; day <= safeDays; day++) {
      const count = day > safeDays - remainder ? base + 1 : base;
      const readings = ALL_CHAPTERS.slice(cursor, cursor + count);
      cursor += count;
      const week =
        safeDays === 43
          ? Math.min(7, Math.ceil(day / 7))
          : Math.min(7, Math.ceil((day / safeDays) * 7));
      plan.push({ day, week, readings });
    }
  } else {
    // If more days than 89 chapters, spread sequentially across the timeline
    for (let day = 1; day <= safeDays; day++) {
      const startIdx = Math.floor(((day - 1) * TOTAL_GOSPEL_CHAPTERS) / safeDays);
      const endIdx = Math.floor((day * TOTAL_GOSPEL_CHAPTERS) / safeDays);
      const readings = ALL_CHAPTERS.slice(startIdx, endIdx);
      const week = Math.min(7, Math.ceil((day / safeDays) * 7));
      plan.push({ day, week, readings });
    }
  }

  return plan;
}

export const READING_PLAN: DayPlan[] = buildReadingPlan(TOTAL_LENT_DAYS);

export function getDayPlan(day: number, plan: DayPlan[] = READING_PLAN): DayPlan {
  const total = plan.length || 1;
  const clamped = Math.max(1, Math.min(total, day));
  return plan[clamped - 1];
}

export function getQuoteDayForPlanDay(day: number, totalDays: number): number {
  if (totalDays === 43) return Math.max(1, Math.min(43, day));
  if (totalDays <= 1) return 43;
  const ratio = (day - 1) / (totalDays - 1);
  return Math.max(1, Math.min(43, Math.round(ratio * 42) + 1));
}

export function formatReadingRange(
  readings: ChapterRef[],
  lang: 'ar' | 'en'
): string {
  if (readings.length === 0) {
    return lang === 'ar' ? 'يوم تأمل ومراجعة' : 'Reflection & Review';
  }
  const groups: { book: GospelKey; chapters: number[] }[] = [];
  for (const r of readings) {
    const last = groups[groups.length - 1];
    if (last && last.book === r.book) {
      last.chapters.push(r.chapter);
    } else {
      groups.push({ book: r.book, chapters: [r.chapter] });
    }
  }

  return groups
    .map((g) => {
      const meta = GOSPEL_ORDER.find((m) => m.key === g.book)!;
      const bookLabel = lang === 'ar' ? meta.shortAr : meta.nameEn;
      const first = g.chapters[0];
      const last = g.chapters[g.chapters.length - 1];
      const rangeStr =
        first === last
          ? formatNumber(first, lang)
          : `${formatNumber(first, lang)}–${formatNumber(last, lang)}`;
      return `${bookLabel} ${rangeStr}`;
    })
    .join(lang === 'ar' ? ' و ' : ' & ');
}

export function formatNumber(n: number, lang: 'ar' | 'en'): string {
  if (lang === 'en') return String(n);
  return new Intl.NumberFormat('ar-EG').format(n);
}

export function formatDateReadable(dateStr: string, lang: 'ar' | 'en'): string {
  const dt = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return dateStr;
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dt);
}

export function getDayDateString(
  planStartDate: string,
  day: number,
  lang: 'ar' | 'en'
): string {
  const base = new Date(`${planStartDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) {
    return lang === 'ar' ? `اليوم ${formatNumber(day, 'ar')}` : `Day ${day}`;
  }
  const target = new Date(base);
  target.setDate(base.getDate() + (day - 1));
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(target);
}

export function computeSuggestedDay(
  planStartDate: string,
  totalDays: number = TOTAL_LENT_DAYS
): number {
  const base = new Date(`${planStartDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return 1;
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays =
    Math.floor((todayMidnight.getTime() - base.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(totalDays, diffDays));
}

export function computeMaxUnlockedDay(
  completedDays: number[],
  totalDays: number = TOTAL_LENT_DAYS
): number {
  const completedSet = new Set(completedDays);
  let day = 1;
  while (day < totalDays && completedSet.has(day)) {
    day++;
  }
  return day;
}

export function getChapterDay(
  book: GospelKey,
  chapter: number,
  plan: DayPlan[] = READING_PLAN
): number {
  for (const dayEntry of plan) {
    if (dayEntry.readings.some((r) => r.book === book && r.chapter === chapter)) {
      return dayEntry.day;
    }
  }
  return 1;
}

export function getChapterKey(book: GospelKey, chapter: number): string {
  return `${book}-${chapter}`;
}

export function getPreviousChapter(book: GospelKey, chapter: number): ChapterRef | null {
  const idx = ALL_CHAPTERS.findIndex((c) => c.book === book && c.chapter === chapter);
  if (idx <= 0) return null;
  return ALL_CHAPTERS[idx - 1];
}

export function getNextChapter(book: GospelKey, chapter: number): ChapterRef | null {
  const idx = ALL_CHAPTERS.findIndex((c) => c.book === book && c.chapter === chapter);
  if (idx < 0 || idx >= ALL_CHAPTERS.length - 1) return null;
  return ALL_CHAPTERS[idx + 1];
}
