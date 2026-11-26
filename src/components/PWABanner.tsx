import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';
import type { Language } from '../types';

interface PWABannerProps {
  lang: Language;
  title: string;
  description: string;
  installLabel: string;
  dismissed: boolean;
  onDismiss: () => void;
}

export const PWABanner: React.FC<PWABannerProps> = ({
  lang,
  title,
  description,
  installLabel,
  dismissed,
  onDismiss,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (dismissed || isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'unavailable') {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <div className="app-card border border-stone-200 dark:border-white/10 bg-white dark:bg-[#22191C] px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 shrink-0 app-control bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white leading-snug">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-0.5">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={handleInstallClick}
            className="min-h-[40px] px-4 py-2 app-control bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <Download className="w-4 h-4" />
            <span>{installLabel}</span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            aria-label={lang === 'ar' ? 'إغلاق بطاقة التثبيت' : 'Dismiss install banner'}
            className="min-w-[40px] min-h-[40px] app-control text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md app-card bg-white dark:bg-[#22191C] border border-stone-200 dark:border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                {lang === 'ar' ? 'تثبيت التطبيق على جهازك' : 'Install on Your Device'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="min-w-[36px] min-h-[36px] app-control flex items-center justify-center text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2.5 text-sm text-stone-700 dark:text-stone-300 leading-relaxed list-decimal list-inside">
                <li>
                  {lang === 'ar'
                    ? 'اضغط على أيقونة المشاركة (Share) في شريط Safari بالأسفل.'
                    : 'Tap the Share icon in the bottom Safari toolbar.'}
                </li>
                <li>
                  {lang === 'ar'
                    ? 'اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).'
                    : 'Scroll down and tap "Add to Home Screen".'}
                </li>
                <li>
                  {lang === 'ar'
                    ? 'اضغط "إضافة" لتشغيل التطبيق أوفلاين في أي وقت.'
                    : 'Tap "Add" to use the app offline anytime.'}
                </li>
              </ol>
            ) : (
              <div className="space-y-2.5 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                <p>
                  {lang === 'ar'
                    ? 'لتثبيت التطبيق مباشرة على الهاتف أو الكمبيوتر:'
                    : 'To install this app on your phone or computer:'}
                </p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>
                    {lang === 'ar'
                      ? 'على Chrome / Edge: اضغط على قائمة المتصفح (⋮) ثم اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".'
                      : 'On Chrome / Edge: open browser menu (⋮) and choose "Install app" or "Add to Home Screen".'}
                  </li>
                  <li>
                    {lang === 'ar'
                      ? 'تم تخزين نصوص الأناجيل الأربعة محلياً لتعمل بدون إنترنت بعد أول زيارة.'
                      : 'All Four Gospels are cached locally for full offline reading after your first visit.'}
                  </li>
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full min-h-[44px] app-control bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {lang === 'ar' ? 'فهمت' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC<{ lang: Language }> = ({ lang }) => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 start-4 z-40 app-control bg-stone-900 dark:bg-stone-800 text-stone-100 border border-white/15 px-3.5 py-2 text-xs font-medium shadow-lg flex items-center gap-2">
      <WifiOff className="w-3.5 h-3.5 text-[var(--accent)]" />
      <span>
        {lang === 'ar'
          ? 'تعمل الآن بدون إنترنت — الأناجيل محفوظة محلياً'
          : 'Offline mode — Gospels cached locally'}
      </span>
    </div>
  );
};
