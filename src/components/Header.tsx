import React from 'react';
import { Globe, LogOut, Moon, Settings, Sun } from 'lucide-react';
import type { HeroIconKey, Language, ThemeMode } from '../types';
import { HeroSymbol } from './HeroSymbol';

interface HeaderProps {
  lang: Language;
  theme: ThemeMode;
  familyName: string;
  userName?: string | null;
  logoDataUrl: string | null;
  heroIcon: HeroIconKey;
  onToggleLang: () => void;
  onToggleTheme: () => void;
  onOpenAdmin: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  theme,
  familyName,
  userName,
  logoDataUrl,
  heroIcon,
  onToggleLang,
  onToggleTheme,
  onOpenAdmin,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 dark:border-white/10 bg-[#FAF7F4]/90 dark:bg-[#181214]/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Zone 1: Family Logo + Name (Read-only for members; editable in Developer Settings) */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 app-control overflow-hidden border border-stone-200 dark:border-white/15 bg-white dark:bg-[#261C20] flex items-center justify-center">
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
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleLang}
            className="min-h-[40px] px-3 py-1.5 app-control border border-stone-200 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <Globe className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
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
            className="min-w-[40px] min-h-[40px] app-control border border-stone-200 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onOpenAdmin}
            aria-label={lang === 'ar' ? 'إعدادات المطورين' : 'Developer Settings'}
            title={lang === 'ar' ? 'إعدادات المطورين' : 'Developer Settings'}
            className="min-w-[40px] min-h-[40px] app-control border border-stone-200 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <Settings className="w-4 h-4" />
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              aria-label={lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
              title={lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
              className="min-w-[40px] min-h-[40px] app-control border border-stone-200 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
