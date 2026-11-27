import React from 'react';
import { Globe, LogOut, Moon, Settings, Sun, Volume2, VolumeX } from 'lucide-react';
import type { HeroIconKey, Language, ThemeMode } from '../types';
import { HeroSymbol } from './HeroSymbol';

interface HeaderProps {
  lang: Language;
  theme: ThemeMode;
  christmasTheme: boolean;
  musicPlaying: boolean;
  familyName: string;
  userName?: string | null;
  logoDataUrl: string | null;
  heroIcon: HeroIconKey;
  onToggleLang: () => void;
  onToggleTheme: () => void;
  onToggleMusic: () => void;
  onOpenAdmin: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  theme,
  christmasTheme,
  musicPlaying,
  familyName,
  userName,
  logoDataUrl,
  heroIcon,
  onToggleLang,
  onToggleTheme,
  onToggleMusic,
  onOpenAdmin,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 dark:border-white/10 bg-[#FAF7F4]/95 dark:bg-[#181214]/95 backdrop-blur-md">
      {christmasTheme && <div aria-hidden="true" className="h-1 w-full xmas-tricolor-bar" />}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Zone 1: Family Logo + Name (Read-only for members; editable in Developer Settings) */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 app-control overflow-hidden border border-stone-200 dark:border-white/15 bg-white dark:bg-[#261C20] flex items-center justify-center">
            {logoDataUrl ? (
              <img
                src={logoDataUrl}
                alt={familyName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[var(--accent)] flex items-center justify-center">
                <HeroSymbol icon={heroIcon} className="w-5 h-5" filled />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-100 truncate">
              {familyName}
            </p>
            {userName && (
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                {lang === 'ar' ? `مرحباً، ${userName}` : `Welcome, ${userName}`}
              </p>
            )}
          </div>
        </div>

        {/* Zone 2: Quick Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Calm Background Music Toggle */}
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
            className={`min-h-[34px] min-w-[34px] sm:min-h-[38px] px-2 sm:px-2.5 py-1 app-control border text-[11px] font-bold flex items-center justify-center gap-1 transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
              musicPlaying
                ? 'border-[var(--accent)]/50 bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-stone-200 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200'
            }`}
          >
            {musicPlaying ? (
              <Volume2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="hidden sm:inline">
              {lang === 'ar' ? 'موسيقى' : 'Music'}
            </span>
          </button>

          {/* Compact Language Toggle */}
          <button
            type="button"
            onClick={onToggleLang}
            aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
            title={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
            className="min-h-[32px] sm:min-h-[34px] px-2 py-1 app-control border border-stone-200 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-[11px] font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <Globe className="w-3 h-3 text-[var(--accent)]" />
            <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              theme === 'dark'
                ? lang === 'ar'
                  ? 'التبديل للوضع الفاتح'
                  : 'Switch to light mode'
                : lang === 'ar'
                ? 'التبديل للوضع الداكن'
                : 'Switch to dark mode'
            }
            className="min-w-[34px] min-h-[34px] sm:min-w-[38px] sm:min-h-[38px] app-control border border-stone-200 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onOpenAdmin}
            aria-label={lang === 'ar' ? 'إعدادات المطورين' : 'Developer Settings'}
            title={lang === 'ar' ? 'إعدادات المطورين' : 'Developer Settings'}
            className="min-w-[34px] min-h-[34px] sm:min-w-[38px] sm:min-h-[38px] app-control border border-stone-200 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <Settings className="w-4 h-4" />
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              aria-label={lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
              title={lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
              className="min-w-[34px] min-h-[34px] sm:min-w-[38px] sm:min-h-[38px] app-control border border-stone-200 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Festive Tri-Color Garland Lights Strand (Red, Green & Gold) */}
      {christmasTheme && (
        <div
          aria-hidden="true"
          className="pointer-events-none max-w-5xl mx-auto px-4 flex items-center justify-between h-2 overflow-hidden"
        >
          {Array.from({ length: 24 }, (_, i) => {
            const colors = ['#DC2626', '#16A34A', '#FBBF24', '#EF4444', '#22C55E', '#FDE047'];
            const c = colors[i % colors.length];
            return (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full xmas-light"
                style={{
                  backgroundColor: c,
                  boxShadow: `0 0 7px ${c}`,
                  animationDelay: `${(i % 6) * 0.4}s`,
                }}
              />
            );
          })}
        </div>
      )}
    </header>
  );
};
