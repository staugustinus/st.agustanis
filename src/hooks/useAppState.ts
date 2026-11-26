import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_CONFIG } from '../data/defaultConfig';
import {
  buildReadingPlan,
  computeMaxUnlockedDay,
  computeSuggestedDay,
  DEFAULT_COMPETITION_END_DATE,
  getChapterDay,
  getChapterKey,
  getDayPlan,
  getDaysBetweenInclusive,
  getPreviousChapter,
  getTodayDateString,
  TOTAL_GOSPEL_CHAPTERS,
} from '../data/readingPlan';
import type { AppConfig, AppState, GospelKey, Language, ThemeMode, UserAccount } from '../types';
import { isValidTripleName, normalizeDigits, normalizeNameKey } from '../utils/digits';

const STORAGE_KEY = 'yalla_negahaz_state_v2';
const LEGACY_STORAGE_KEY = 'yalla_negahaz_state_v1';

function mergeConfig(
  base: AppConfig,
  incoming?: Partial<AppConfig> | null
): AppConfig {
  if (!incoming) return { ...base, pin2027Migrated: true, journeyMigrated: true };
  const rawPin = incoming.adminPin ? normalizeDigits(incoming.adminPin).replace(/\s+/g, '') : '';
  const needs2027Upgrade = !incoming.pin2027Migrated && (!rawPin || rawPin === '1234');
  const oldArCaption = 'يمتلئ القلب تدريجياً حتى يكتمل في نهاية الصوم';
  const oldEnCaption = 'The heart fills day by day until Lent is complete';
  const nextArCopy = { ...base.copy.ar, ...(incoming.copy?.ar || {}) };
  const nextEnCopy = { ...base.copy.en, ...(incoming.copy?.en || {}) };
  if (!incoming.journeyMigrated) {
    if (nextArCopy.heartProgressCaption === oldArCaption) {
      nextArCopy.heartProgressCaption = base.copy.ar.heartProgressCaption;
    }
    if (nextEnCopy.heartProgressCaption === oldEnCaption) {
      nextEnCopy.heartProgressCaption = base.copy.en.heartProgressCaption;
    }
  }
  return {
    ...base,
    ...incoming,
    progressStyle: !incoming.journeyMigrated ? 'journey' : incoming.progressStyle || 'journey',
    journeyMigrated: true,
    adminPinEnabled: true,
    adminPin: needs2027Upgrade ? '2027' : rawPin || base.adminPin,
    pin2027Migrated: true,
    copy: {
      ar: nextArCopy,
      en: nextEnCopy,
    },
    quotes:
      Array.isArray(incoming.quotes) && incoming.quotes.length > 0
        ? incoming.quotes
        : base.quotes,
    practices:
      Array.isArray(incoming.practices) && incoming.practices.length > 0
        ? incoming.practices
        : base.practices,
  };
}

function createInitialState(): AppState {
  const defaultState: AppState = {
    lang: 'ar',
    theme: 'dark',
    activeUserId: null,
    users: {},
    pwaBannerDismissed: false,
    config: DEFAULT_CONFIG,
  };

  if (typeof window === 'undefined') return defaultState;

  let importedConfig: Partial<AppConfig> | null = null;
  try {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#cfg=')) {
      const encoded = hash.slice(5);
      const jsonStr = decodeURIComponent(escape(atob(encoded)));
      importedConfig = JSON.parse(jsonStr);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  } catch {
    importedConfig = null;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AppState>;
      let mergedCfg = mergeConfig(DEFAULT_CONFIG, parsed.config);
      mergedCfg = mergeConfig(mergedCfg, importedConfig);
      return {
        ...defaultState,
        ...parsed,
        users: parsed.users || {},
        activeUserId: parsed.activeUserId && parsed.users?.[parsed.activeUserId] ? parsed.activeUserId : null,
        config: mergedCfg,
      };
    }

    // Check legacy v1 config to carry over developer config if any
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy) as { lang?: Language; theme?: ThemeMode; config?: Partial<AppConfig> };
      let mergedCfg = mergeConfig(DEFAULT_CONFIG, parsedLegacy.config);
      mergedCfg = mergeConfig(mergedCfg, importedConfig);
      return {
        ...defaultState,
        lang: parsedLegacy.lang || 'ar',
        theme: parsedLegacy.theme || 'dark',
        config: mergedCfg,
      };
    }
  } catch {
    // ignore storage errors
  }

  if (importedConfig) {
    return {
      ...defaultState,
      config: mergeConfig(DEFAULT_CONFIG, importedConfig),
    };
  }

  return defaultState;
}

function darkenHex(hex: string, amount = 0.16): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#B91C1C';
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(220, 38, 38, ${alpha})`;
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useAppState() {
  const [state, setState] = useState<AppState>(createInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = state.lang;
    root.dir = state.lang === 'ar' ? 'rtl' : 'ltr';

    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const { accentColor, lightCanvasColor, darkCanvasColor, radiusPreset, cardStyle } = state.config;
    root.style.setProperty('--accent', accentColor);
    root.style.setProperty('--accent-hover', darkenHex(accentColor, 0.16));
    root.style.setProperty('--accent-soft', hexToRgba(accentColor, 0.14));
    root.style.setProperty('--accent-glow', hexToRgba(accentColor, 0.28));
    root.style.setProperty('--canvas-light', lightCanvasColor);
    root.style.setProperty('--canvas-dark', darkCanvasColor);

    const cardRadius =
      radiusPreset === 'sharp' ? '0.375rem' : radiusPreset === 'rounded' ? '1.75rem' : '1.125rem';
    const controlRadius =
      radiusPreset === 'sharp' ? '0.25rem' : radiusPreset === 'rounded' ? '1rem' : '0.75rem';
    root.style.setProperty('--radius-card', cardRadius);
    root.style.setProperty('--radius-control', controlRadius);
    root.setAttribute('data-card-style', cardStyle || 'bordered');

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', state.theme === 'dark' ? darkCanvasColor : lightCanvasColor);
    }
  }, [state.lang, state.theme, state.config]);

  const activeUser: UserAccount | null = useMemo(() => {
    if (!state.activeUserId) return null;
    return state.users[state.activeUserId] || null;
  }, [state.activeUserId, state.users]);

  const registerUser = useCallback(
    (rawName: string, rawPin: string): { ok: boolean; error?: string } => {
      if (!isValidTripleName(rawName)) {
        return {
          ok: false,
          error:
            state.lang === 'ar'
              ? 'يرجى كتابة الاسم ثلاثي (٣ كلمات على الأقل)'
              : 'Please enter a full triple name (at least 3 words)',
        };
      }
      const cleanPin = normalizeDigits(rawPin).replace(/\D/g, '');
      if (!/^\d{4}$/.test(cleanPin)) {
        return {
          ok: false,
          error:
            state.lang === 'ar'
              ? 'كلمة المرور يجب أن تكون ٤ أرقام'
              : 'Password must be exactly 4 digits',
        };
      }

      const id = normalizeNameKey(rawName);
      if (state.users[id]) {
        return {
          ok: false,
          error:
            state.lang === 'ar'
              ? 'هذا الاسم مسجّل بالفعل، اختر "دخول لحسابي" وأدخل كلمة المرور'
              : 'This name is already registered. Switch to Sign In and enter your PIN.',
        };
      }

      const newUser: UserAccount = {
        id,
        fullName: rawName.trim().replace(/\s+/g, ' '),
        pin: cleanPin,
        currentDay: 1,
        completedDays: [],
        passedChapters: {},
        checkedPractices: {},
        readerFontSize: 21,
        planStartDate: getTodayDateString(),
        createdAt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        activeUserId: id,
        users: {
          ...prev.users,
          [id]: newUser,
        },
      }));
      return { ok: true };
    },
    [state.lang, state.users]
  );

  const loginUser = useCallback(
    (rawName: string, rawPin: string): { ok: boolean; error?: string } => {
      const id = normalizeNameKey(rawName);
      const cleanPin = normalizeDigits(rawPin).replace(/\D/g, '');
      const existing = state.users[id];

      if (!existing) {
        return {
          ok: false,
          error:
            state.lang === 'ar'
              ? 'لا يوجد حساب بهذا الاسم الثلاثي، تأكد من الاسم أو أنشئ حساباً جديداً'
              : 'No account found with this name. Check spelling or create a new account.',
        };
      }
      if (existing.pin !== cleanPin) {
        return {
          ok: false,
          error:
            state.lang === 'ar'
              ? 'كلمة المرور (٤ أرقام) غير صحيحة'
              : 'Incorrect 4-digit PIN',
        };
      }

      setState((prev) => ({ ...prev, activeUserId: id }));
      return { ok: true };
    },
    [state.lang, state.users]
  );

  const logoutUser = useCallback(() => {
    setState((prev) => ({ ...prev, activeUserId: null }));
  }, []);

  const toggleLang = useCallback(() => {
    setState((prev) => ({ ...prev, lang: prev.lang === 'ar' ? 'en' : 'ar' }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  const completedDays = activeUser?.completedDays || [];
  const passedChapters = activeUser?.passedChapters || {};
  const checkedPractices = activeUser?.checkedPractices || {};
  const readerFontSize = activeUser?.readerFontSize || 21;

  const userStartDate = activeUser?.planStartDate || state.config.lentStartDate || getTodayDateString();
  const lentEndDate = state.config.lentEndDate || DEFAULT_COMPETITION_END_DATE;

  const totalDays = useMemo(
    () => getDaysBetweenInclusive(userStartDate, lentEndDate),
    [userStartDate, lentEndDate]
  );

  const readingPlan = useMemo(() => buildReadingPlan(totalDays), [totalDays]);

  const maxUnlockedDay = useMemo(() => {
    if (!state.config.sequentialLock) return totalDays;
    return computeMaxUnlockedDay(completedDays, totalDays);
  }, [completedDays, state.config.sequentialLock, totalDays]);

  const currentDay = useMemo(() => {
    const raw = activeUser?.currentDay || 1;
    const clampedTotal = Math.min(raw, totalDays);
    return state.config.sequentialLock ? Math.min(clampedTotal, maxUnlockedDay) : clampedTotal;
  }, [activeUser?.currentDay, state.config.sequentialLock, maxUnlockedDay, totalDays]);

  const updateActiveUser = useCallback(
    (updater: (u: UserAccount) => UserAccount) => {
      setState((prev) => {
        if (!prev.activeUserId || !prev.users[prev.activeUserId]) return prev;
        const updated = updater(prev.users[prev.activeUserId]);
        return {
          ...prev,
          users: {
            ...prev.users,
            [prev.activeUserId]: updated,
          },
        };
      });
    },
    []
  );

  const setCurrentDay = useCallback(
    (day: number): boolean => {
      const clamped = Math.max(1, Math.min(totalDays, day));
      if (state.config.sequentialLock && clamped > maxUnlockedDay) {
        return false;
      }
      updateActiveUser((u) => ({ ...u, currentDay: clamped }));
      return true;
    },
    [state.config.sequentialLock, maxUnlockedDay, totalDays, updateActiveUser]
  );

  const markChapterPassed = useCallback(
    (book: GospelKey, chapter: number) => {
      const key = getChapterKey(book, chapter);
      updateActiveUser((u) => ({
        ...u,
        passedChapters: {
          ...(u.passedChapters || {}),
          [key]: true,
        },
      }));
    },
    [updateActiveUser]
  );

  const isChapterUnlocked = useCallback(
    (book: GospelKey, chapter: number): boolean => {
      if (!state.config.sequentialLock) return true;
      const chDay = getChapterDay(book, chapter, readingPlan);
      if (chDay > maxUnlockedDay) return false;
      const prev = getPreviousChapter(book, chapter);
      if (!prev) return true;
      const prevKey = getChapterKey(prev.book, prev.chapter);
      const prevDay = getChapterDay(prev.book, prev.chapter, readingPlan);
      return Boolean(passedChapters[prevKey] || completedDays.includes(prevDay));
    },
    [state.config.sequentialLock, readingPlan, maxUnlockedDay, passedChapters, completedDays]
  );

  const toggleDayCompleted = useCallback(
    (day: number): { ok: boolean; missingQuizzes?: boolean } => {
      const alreadyDone = completedDays.includes(day);
      if (!alreadyDone && state.config.sequentialLock) {
        const dayReadings = getDayPlan(day, readingPlan).readings;
        const missing = dayReadings.some(
          (r) => !passedChapters[getChapterKey(r.book, r.chapter)]
        );
        if (missing) {
          return { ok: false, missingQuizzes: true };
        }
      }

      updateActiveUser((u) => {
        const exists = u.completedDays.includes(day);
        const nextDays = exists
          ? u.completedDays.filter((d) => d !== day)
          : [...u.completedDays, day].sort((a, b) => a - b);
        const nextMax = state.config.sequentialLock
          ? computeMaxUnlockedDay(nextDays, totalDays)
          : totalDays;
        return {
          ...u,
          completedDays: nextDays,
          currentDay: Math.min(u.currentDay, nextMax),
        };
      });
      return { ok: true };
    },
    [completedDays, passedChapters, readingPlan, state.config.sequentialLock, totalDays, updateActiveUser]
  );

  const togglePractice = useCallback(
    (practiceId: string) => {
      updateActiveUser((u) => ({
        ...u,
        checkedPractices: {
          ...u.checkedPractices,
          [practiceId]: !u.checkedPractices[practiceId],
        },
      }));
    },
    [updateActiveUser]
  );

  const setReaderFontSize = useCallback(
    (size: number) => {
      const clamped = Math.max(16, Math.min(30, size));
      updateActiveUser((u) => ({ ...u, readerFontSize: clamped }));
    },
    [updateActiveUser]
  );

  const jumpToToday = useCallback(() => {
    const todayDay = computeSuggestedDay(userStartDate, totalDays);
    const targetDay = state.config.sequentialLock
      ? Math.min(todayDay, maxUnlockedDay)
      : todayDay;
    updateActiveUser((u) => ({ ...u, currentDay: targetDay }));
    return { targetDay, wasCapped: state.config.sequentialLock && todayDay > maxUnlockedDay };
  }, [userStartDate, totalDays, state.config.sequentialLock, maxUnlockedDay, updateActiveUser]);

  const dismissPwaBanner = useCallback(() => {
    setState((prev) => ({ ...prev, pwaBannerDismissed: true }));
  }, []);

  const saveConfig = useCallback((nextConfig: AppConfig) => {
    setState((prev) => ({ ...prev, config: nextConfig }));
  }, []);

  const importConfig = useCallback((incoming: Partial<AppConfig>) => {
    setState((prev) => ({
      ...prev,
      config: mergeConfig(prev.config, incoming),
    }));
  }, []);

  const resetConfigToDefaults = useCallback(() => {
    setState((prev) => ({ ...prev, config: DEFAULT_CONFIG }));
  }, []);

  const stats = useMemo(() => {
    const completedSet = new Set(completedDays.filter((d) => d >= 1 && d <= totalDays));
    let completedChapters = 0;
    for (const d of completedSet) {
      completedChapters += getDayPlan(d, readingPlan).readings.length;
    }
    const percent = Math.round((completedChapters / TOTAL_GOSPEL_CHAPTERS) * 100);

    const sorted = [...completedSet].sort((a, b) => a - b);
    let currentStreak = 0;
    if (sorted.length > 0) {
      let anchor = sorted[sorted.length - 1];
      if (completedSet.has(currentDay)) {
        anchor = currentDay;
      }
      let cursor = anchor;
      while (cursor >= 1 && completedSet.has(cursor)) {
        currentStreak++;
        cursor--;
      }
    }

    return {
      completedDaysCount: completedSet.size,
      completedChapters,
      totalChapters: TOTAL_GOSPEL_CHAPTERS,
      percent,
      streak: currentStreak,
    };
  }, [completedDays, currentDay, totalDays, readingPlan]);

  return {
    state,
    activeUser,
    userStartDate,
    lentEndDate,
    totalDays,
    readingPlan,
    currentDay,
    completedDays,
    passedChapters,
    checkedPractices,
    readerFontSize,
    maxUnlockedDay,
    stats,
    registerUser,
    loginUser,
    logoutUser,
    toggleLang,
    toggleTheme,
    setCurrentDay,
    markChapterPassed,
    isChapterUnlocked,
    toggleDayCompleted,
    togglePractice,
    setReaderFontSize,
    dismissPwaBanner,
    saveConfig,
    importConfig,
    resetConfigToDefaults,
    jumpToToday,
  };
}
