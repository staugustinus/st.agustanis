import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Lock,
  LogIn,
  Moon,
  Settings,
  Sun,
  UserCheck,
  UserPlus,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  formatDateReadable,
  formatNumber,
  getChapterPaceSummary,
  getDaysBetweenInclusive,
  getEffectiveStartDate,
  getTodayDateString,
  TOTAL_GOSPEL_CHAPTERS,
  TOTAL_LENT_DAYS,
} from '../data/readingPlan';
import type { HeroIconKey, Language, ThemeMode, UserAccount } from '../types';
import { isValidTripleName, normalizeDigits, normalizeNameKey } from '../utils/digits';
import { HeroSymbol } from './HeroSymbol';

interface AuthGateProps {
  lang: Language;
  theme: ThemeMode;
  christmasTheme: boolean;
  musicPlaying: boolean;
  familyName: string;
  heroTitle: string;
  authWelcomeTitle: string;
  authWelcomeSubtitle: string;
  logoDataUrl: string | null;
  heroIcon: HeroIconKey;
  lentStartDate: string;
  lentEndDate: string;
  existingUsers: UserAccount[];
  onToggleLang: () => void;
  onToggleTheme: () => void;
  onToggleMusic: () => void;
  onOpenAdmin: () => void;
  onRegister: (fullName: string, pin: string) => Promise<{ ok: boolean; error?: string }>;
  onLogin: (fullName: string, pin: string) => Promise<{ ok: boolean; error?: string }>;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  lang,
  theme,
  christmasTheme,
  musicPlaying,
  familyName,
  heroTitle,
  authWelcomeTitle,
  authWelcomeSubtitle,
  logoDataUrl,
  heroIcon,
  lentStartDate,
  lentEndDate,
  existingUsers,
  onToggleLang,
  onToggleTheme,
  onToggleMusic,
  onOpenAdmin,
  onRegister,
  onLogin,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>(
    existingUsers.length > 0 ? 'login' : 'register'
  );
  const [fullName, setFullName] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePinChange = (val: string) => {
    const normalized = normalizeDigits(val).replace(/\D/g, '').slice(0, 4);
    setPin(normalized);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!isValidTripleName(fullName)) {
      setError(
        lang === 'ar'
          ? 'يرجى إدخال الاسم ثلاثي (٣ أسماء على الأقل، مثال: كيرلس مينا جرجس)'
          : 'Please enter your full triple name (at least 3 words)'
      );
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError(
        lang === 'ar'
          ? 'يرجى إدخال كلمة مرور مكوّنة من ٤ أرقام فقط'
          : 'Please enter a 4-digit numeric PIN'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res =
        mode === 'register'
          ? await onRegister(fullName.trim(), pin)
          : await onLogin(fullName.trim(), pin);
      if (!res.ok && res.error) {
        setError(res.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      {christmasTheme && <div aria-hidden="true" className="h-1 w-full xmas-tricolor-bar" />}
      {/* Compact Top Utilities */}
      <header className="max-w-5xl w-full mx-auto px-4 sm:px-6 pt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 shrink-0 app-control border border-stone-200 dark:border-white/15 bg-white dark:bg-[#22191C] flex items-center justify-center overflow-hidden">
            {logoDataUrl ? (
              <img src={logoDataUrl} alt={familyName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[var(--accent)]">
                <HeroSymbol icon={heroIcon} className="w-4 h-4" filled />
              </span>
            )}
          </div>
          <span className="text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-200 truncate">
            {familyName}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleMusic}
            aria-pressed={musicPlaying}
            aria-label={
              musicPlaying
                ? lang === 'ar'
                  ? 'إيقاف الموسيقى الهادئة'
                  : 'Pause calm music'
                : lang === 'ar'
                ? 'تشغيل الموسيقى الهادئة'
                : 'Play calm music'
            }
            title={
              musicPlaying
                ? lang === 'ar'
                  ? 'إيقاف الموسيقى الهادئة'
                  : 'Pause calm music'
                : lang === 'ar'
                ? 'تشغيل موسيقى هادئة'
                : 'Play calm music'
            }
            className={`min-h-[34px] min-w-[34px] px-2 py-1 app-control border text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
              musicPlaying
                ? 'border-[var(--accent)]/50 bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-stone-200 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200'
            }`}
          >
            {musicPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{lang === 'ar' ? 'موسيقى' : 'Music'}</span>
          </button>
          <button
            type="button"
            onClick={onToggleLang}
            aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
            title={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
            className="min-h-[32px] px-2 py-1 app-control border border-stone-200 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-[11px] font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1 cursor-pointer"
          >
            <Globe className="w-3 h-3 text-[var(--accent)]" />
            <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={lang === 'ar' ? 'تبديل المظهر' : 'Toggle theme'}
            className="min-w-[34px] min-h-[34px] app-control border border-stone-200 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200 flex items-center justify-center cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onOpenAdmin}
            title={lang === 'ar' ? 'إعدادات المطورين' : 'Developer Settings'}
            aria-label={lang === 'ar' ? 'إعدادات المطورين' : 'Developer Settings'}
            className="min-w-[34px] min-h-[34px] app-control border border-stone-200 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200 flex items-center justify-center cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md app-card border border-stone-200 dark:border-white/10 bg-white dark:bg-[#22191C] p-6 sm:p-8 space-y-6">
          {/* Emblem & Title */}
          <div className="text-center space-y-2.5">
            <div className="w-14 h-14 mx-auto app-control bg-[var(--accent-soft)] border border-[var(--accent)]/25 text-[var(--accent)] flex items-center justify-center">
              <HeroSymbol icon={heroIcon} className="w-7 h-7" filled />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white">
              {heroTitle}
            </h1>
            <p className="text-sm font-bold text-[var(--accent)]">{authWelcomeTitle}</p>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {authWelcomeSubtitle}
            </p>
            {(() => {
              const effectiveStart = getEffectiveStartDate(lentStartDate);
              const remDays = getDaysBetweenInclusive(effectiveStart, lentEndDate);
              const pace = getChapterPaceSummary(remDays, lang);
              const endLabel = formatDateReadable(lentEndDate, lang);
              const isLate = getTodayDateString() > lentStartDate || remDays < TOTAL_LENT_DAYS;
              return (
                <div className="mt-2 p-3 app-control border border-[var(--accent)]/25 bg-[var(--accent-soft)]/45 text-xs space-y-1">
                  <p className="font-bold text-stone-800 dark:text-stone-100 tabular-nums">
                    {lang === 'ar'
                      ? `نهاية المسابقة: ${endLabel} · المتبقّي ${formatNumber(remDays, 'ar')} يوماً`
                      : `Ends: ${endLabel} · ${remDays} days remaining`}
                  </p>
                  <p className="font-semibold text-[var(--accent)] tabular-nums">
                    {lang === 'ar'
                      ? `خطة التسجيل اليوم: تقسيم ${formatNumber(TOTAL_GOSPEL_CHAPTERS, 'ar')} أصحاحاً على ${formatNumber(remDays, 'ar')} يوماً (${pace.label})`
                      : `Joining today: ${TOTAL_GOSPEL_CHAPTERS} chapters divided across ${remDays} days (${pace.label})`}
                  </p>
                  {isLate && (
                    <p className="text-[11px] text-stone-600 dark:text-stone-300">
                      {lang === 'ar'
                        ? 'دخلت متأخراً؟ يحسب الموقع الأيام المتبقية تلقائياً لتختم قبل نهاية المسابقة.'
                        : 'Joining late? Your daily plan automatically adapts to finish by the end date.'}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Mode Tabs: Register / Sign In */}
          <div className="grid grid-cols-2 gap-1.5 p-1 app-control bg-stone-100 dark:bg-black/25">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`min-h-[40px] app-control text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-stone-600 dark:text-stone-300'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تسجيل جديد' : 'New Account'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`min-h-[40px] app-control text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-stone-600 dark:text-stone-300'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>{lang === 'ar' ? 'دخول لحسابي' : 'Sign In'}</span>
            </button>
          </div>

          {/* Saved Profiles Quick Picker on this device (when logging in) */}
          {mode === 'login' && existingUsers.length > 0 && (
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-stone-500 dark:text-stone-400">
                {lang === 'ar' ? 'حسابات مسجلة على هذا الجهاز:' : 'Saved accounts on this device:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {existingUsers.map((u) => {
                  const selected = normalizeNameKey(fullName) === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setFullName(u.fullName);
                        setError(null);
                      }}
                      className={`min-h-[34px] px-3 py-1 app-control border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        selected
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                          : 'border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{u.fullName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-200">
                {lang === 'ar' ? 'الاسم ثلاثي' : 'Full Triple Name (3 Words)'}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setError(null);
                }}
                placeholder={
                  lang === 'ar' ? 'مثال: كيرلس مينا جرجس' : 'e.g. Kirolos Mina Girgis'
                }
                className="w-full min-h-[44px] px-3.5 app-control border border-stone-300 dark:border-white/15 bg-stone-50 dark:bg-black/25 text-sm text-stone-900 dark:text-white focus:outline-2 focus:outline-[var(--accent)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>
                  {lang === 'ar' ? 'كلمة المرور (٤ أرقام)' : 'Password (4-Digit PIN)'}
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  placeholder="••••"
                  className="w-full min-h-[44px] px-10 app-control border border-stone-300 dark:border-white/15 bg-stone-50 dark:bg-black/25 text-center tracking-[0.5em] text-lg font-bold text-stone-900 dark:text-white focus:outline-2 focus:outline-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((s) => !s)}
                  aria-label={showPin ? (lang === 'ar' ? 'إخفاء كلمة المرور' : 'Hide PIN') : (lang === 'ar' ? 'إظهار كلمة المرور' : 'Show PIN')}
                  className="absolute inset-y-0 right-1.5 flex items-center justify-center w-9 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] app-control bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-70 text-white text-sm sm:text-base font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>
                {submitting
                  ? lang === 'ar'
                    ? 'جارٍ الاتصال...'
                    : 'Connecting...'
                  : mode === 'register'
                  ? lang === 'ar'
                    ? 'بدء الرحلة وحفظ التقدّم'
                    : 'Register & Start Journey'
                  : lang === 'ar'
                  ? 'دخول واستكمال التقدّم'
                  : 'Sign In & Continue'}
              </span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
