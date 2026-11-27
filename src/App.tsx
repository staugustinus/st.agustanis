/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { AuthGate } from './components/AuthGate';
import { BethlehemJourney } from './components/BethlehemJourney';
import { ChristmasAtmosphere } from './components/ChristmasAtmosphere';
import { GospelReader } from './components/GospelReader';
import { Header } from './components/Header';
import { HeroSymbol } from './components/HeroSymbol';
import { ProgressAndDayNav } from './components/ProgressAndDayNav';
import { ProgressHeart } from './components/ProgressHeart';
import { OfflineIndicator, PWABanner } from './components/PWABanner';
import { QuoteAndPractices } from './components/QuoteAndPractices';
import { formatNumber, getDayPlan, getQuoteDayForPlanDay } from './data/readingPlan';
import { useAppState } from './hooks/useAppState';

export default function App() {
  const {
    state,
    activeUser,
    adminUser,
    isAdminVerified,
    allKnownUsers,
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
    signInDeveloperGoogle,
    signOutDeveloperGoogle,
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
  } = useAppState();

  const [adminOpen, setAdminOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  const handleShareText = async (text: string) => {
    const signature =
      state.lang === 'ar'
        ? `\n— ${state.config.copy.ar.heroTitle} | ${state.config.copy.ar.familyName}`
        : `\n— ${state.config.copy.en.heroTitle} | ${state.config.copy.en.familyName}`;
    const fullText = `${text}${signature}`;

    if (navigator.share) {
      try {
        await navigator.share({ text: fullText });
        return;
      } catch {
        // user cancelled or share failed; fall back to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(fullText);
      showToast(state.lang === 'ar' ? 'تم النسخ للمشاركة' : 'Copied to clipboard');
    } catch {
      showToast(state.lang === 'ar' ? 'تعذّر النسخ' : 'Could not copy');
    }
  };

  const handleLockedDayAttempt = (targetDay: number) => {
    const requiredDay = maxUnlockedDay;
    showToast(
      state.lang === 'ar'
        ? `لا يمكنك فتح اليوم ${formatNumber(targetDay, 'ar')} قبل إنهاء اليوم ${formatNumber(requiredDay, 'ar')} أولاً`
        : `Complete Day ${requiredDay} first before opening Day ${targetDay}`
    );
  };

  const handleLockedChapterAttempt = () => {
    showToast(
      state.lang === 'ar'
        ? 'أجب عن سؤال الأصحاح السابق إجابة صحيحة أولاً لفتح هذا الأصحاح'
        : 'Answer the previous chapter’s question correctly first to unlock this chapter'
    );
  };

  const copy = state.config.copy[state.lang];
  const dayPlan = getDayPlan(currentDay, readingPlan);
  const mappedQuoteDay = getQuoteDayForPlanDay(currentDay, totalDays);
  const currentQuote = state.config.quotes.find((q) => q.day === mappedQuoteDay);
  const weekPractices = state.config.practices.filter((p) => p.week === dayPlan.week);
  const isDayCompleted = completedDays.includes(currentDay);
  const existingUsersList = Object.values(state.users);
  const christmasEnabled = state.config.christmasTheme !== false;

  return (
    <>
      <ChristmasAtmosphere enabled={christmasEnabled} theme={state.theme} />

      {!activeUser ? (
        <AuthGate
          lang={state.lang}
          theme={state.theme}
          christmasTheme={christmasEnabled}
          familyName={copy.familyName}
          heroTitle={copy.heroTitle}
          authWelcomeTitle={copy.authWelcomeTitle}
          authWelcomeSubtitle={copy.authWelcomeSubtitle}
          logoDataUrl={state.config.logoDataUrl}
          heroIcon={state.config.heroIcon}
          lentStartDate={state.config.lentStartDate}
          lentEndDate={lentEndDate}
          existingUsers={existingUsersList}
          onToggleLang={toggleLang}
          onToggleTheme={toggleTheme}
          onOpenAdmin={() => setAdminOpen(true)}
          onRegister={registerUser}
          onLogin={loginUser}
        />
      ) : (
        <div className="min-h-screen flex flex-col relative z-10">
          {/* 1. Header & Branding */}
          <Header
            lang={state.lang}
            theme={state.theme}
            christmasTheme={christmasEnabled}
            familyName={copy.familyName}
            userName={activeUser.fullName}
            logoDataUrl={state.config.logoDataUrl}
            heroIcon={state.config.heroIcon}
            onToggleLang={toggleLang}
            onToggleTheme={toggleTheme}
            onOpenAdmin={() => setAdminOpen(true)}
            onLogout={logoutUser}
          />

          <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
            {/* 2. Hero Welcome Section with Progress-Filling Heart */}
            <section className="text-center space-y-4 py-2 sm:py-4">
              <div className="inline-flex items-center justify-center gap-3">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900 dark:text-white text-balance">
                  {copy.heroTitle}
                </h1>
                <span className="text-[var(--accent)] inline-flex items-center justify-center">
                  <HeroSymbol icon={state.config.heroIcon} className="w-8 h-8 sm:w-10 sm:h-10" filled />
                </span>
              </div>

              <p className="max-w-2xl mx-auto text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed text-balance">
                {copy.heroSubtitle}
              </p>

              {/* Journey to Bethlehem road progress (or classic heart if configured) */}
              {(state.config.progressStyle || 'journey') === 'journey' ? (
                <BethlehemJourney
                  completedDaysCount={stats.completedDaysCount}
                  totalDays={totalDays}
                  percent={stats.percent}
                  currentDay={currentDay}
                  lentStartDate={state.config.lentStartDate}
                  lentEndDate={lentEndDate}
                  userStartDate={userStartDate}
                  lang={state.lang}
                  theme={state.theme}
                  christmasTheme={christmasEnabled}
                  size={state.config.heroIconSize || 'md'}
                  caption={copy.heartProgressCaption}
                />
              ) : (
                <ProgressHeart
                  percent={stats.percent}
                  lang={state.lang}
                  icon={state.config.heroIcon}
                  size={state.config.heroIconSize || 'md'}
                  caption={copy.heartProgressCaption}
                />
              )}
            </section>

            {/* 3. PWA Install Banner */}
            <PWABanner
              lang={state.lang}
              title={copy.pwaTitle}
              description={copy.pwaDesc}
              installLabel={copy.pwaInstallBtn}
              dismissed={state.pwaBannerDismissed}
              onDismiss={dismissPwaBanner}
            />

            {/* 4. Progress & Day Navigator */}
            <ProgressAndDayNav
              lang={state.lang}
              currentDay={currentDay}
              totalDays={totalDays}
              readingPlan={readingPlan}
              completedDays={completedDays}
              planStartDate={userStartDate}
              lentEndDate={lentEndDate}
              stats={stats}
              maxUnlockedDay={maxUnlockedDay}
              sequentialLock={state.config.sequentialLock}
              copy={{
                progressTitle: copy.progressTitle,
                streakTitle: copy.streakTitle,
                streakLabel: copy.streakLabel,
                completedDaysLabel: copy.completedDaysLabel,
              }}
              onSelectDay={setCurrentDay}
              onLockedDayAttempt={handleLockedDayAttempt}
              onJumpToToday={() => {
                const res = jumpToToday();
                if (res.wasCapped) {
                  showToast(
                    state.lang === 'ar'
                      ? `تم الانتقال إلى اليوم ${formatNumber(res.targetDay, 'ar')} — أنهِهِ أولاً لفتح الأيام التالية`
                      : `Moved to Day ${res.targetDay} — complete it first to unlock later days`
                  );
                }
              }}
            />

            {/* 5. Four Gospels Reader (Smith & Van Dyck) */}
            <GospelReader
              lang={state.lang}
              currentDay={currentDay}
              readingPlan={readingPlan}
              maxUnlockedDay={maxUnlockedDay}
              sequentialLock={state.config.sequentialLock}
              isDayCompleted={isDayCompleted}
              passedChapters={passedChapters}
              isChapterUnlocked={isChapterUnlocked}
              fontSize={readerFontSize}
              title={copy.gospelSectionTitle}
              editionLabel={copy.gospelEditionLabel}
              markReadBtn={copy.markReadBtn}
              markReadDoneBtn={copy.markReadDoneBtn}
              encouragementMsg={copy.encouragementMsg}
              onFontSizeChange={setReaderFontSize}
              onPassChapter={(book, ch) => {
                markChapterPassed(book, ch);
                showToast(
                  state.lang === 'ar'
                    ? 'إجابة صحيحة! تم فتح الأصحاح التالي'
                    : 'Correct! Next chapter is unlocked'
                );
              }}
              onToggleDayCompleted={() => {
                const res = toggleDayCompleted(currentDay);
                if (!res.ok && res.missingQuizzes) {
                  showToast(
                    state.lang === 'ar'
                      ? 'أجب عن أسئلة جميع أصحاحات اليوم أولاً لإتمام القراءة'
                      : 'Answer all of today’s chapter questions first to complete the day'
                  );
                  return;
                }
                if (!isDayCompleted) {
                  showToast(copy.encouragementMsg);
                }
              }}
              onLockedDayAttempt={handleLockedDayAttempt}
              onLockedChapterAttempt={() => handleLockedChapterAttempt()}
              onShareText={handleShareText}
            />

            {/* 6 & 7. Quote of the Day + Weekly Practices */}
            <QuoteAndPractices
              lang={state.lang}
              currentDay={currentDay}
              currentWeek={dayPlan.week}
              quoteSectionTitle={copy.quoteSectionTitle}
              practicesSectionTitle={copy.practicesSectionTitle}
              quote={currentQuote}
              weekPractices={weekPractices}
              checkedPractices={checkedPractices}
              onTogglePractice={togglePractice}
              onShareText={handleShareText}
            />
          </main>

          {/* Quiet Editorial Footer */}
          <footer className="border-t border-stone-200/80 dark:border-white/10 py-6 mt-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
              <span>{copy.familyName}</span>
              <button
                type="button"
                onClick={() => setAdminOpen(true)}
                className="hover:text-[var(--accent)] transition-colors cursor-pointer"
              >
                {state.lang === 'ar' ? 'إعدادات المطورين' : 'Developer Settings'}
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* 8. Developer Settings Panel (Password 2027) */}
      <AdminPanel
        isOpen={adminOpen}
        lang={state.lang}
        theme={state.theme}
        config={state.config}
        users={allKnownUsers}
        activeUserId={state.activeUserId}
        adminEmail={adminUser?.email || null}
        isAdminVerified={isAdminVerified}
        onGoogleSignIn={signInDeveloperGoogle}
        onGoogleSignOut={signOutDeveloperGoogle}
        onClose={() => setAdminOpen(false)}
        onSaveConfig={saveConfig}
        onImportConfig={importConfig}
        onResetDefaults={resetConfigToDefaults}
        onNotify={showToast}
      />

      {/* Offline Indicator */}
      <OfflineIndicator lang={state.lang} />

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 app-control bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs sm:text-sm font-semibold shadow-xl text-center max-w-[90vw]"
        >
          {toastMsg}
        </div>
      )}
    </>
  );
}
