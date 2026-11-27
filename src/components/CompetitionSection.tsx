import React from 'react';
import { Award, CheckCircle2, HelpCircle, Trophy, XCircle } from 'lucide-react';
import { formatNumber } from '../data/readingPlan';
import type { CompetitionConfig, Language } from '../types';

interface CompetitionSectionProps {
  lang: Language;
  competition?: CompetitionConfig;
  answers: Record<string, number>;
  onAnswerQuestion: (questionId: string, optionIndex: number) => void;
}

export const CompetitionSection: React.FC<CompetitionSectionProps> = ({
  lang,
  competition,
  answers,
  onAnswerQuestion,
}) => {
  if (!competition || !competition.enabled) return null;

  const title =
    (lang === 'ar' ? competition.titleAr : competition.titleEn) ||
    competition.titleAr ||
    competition.titleEn;
  const description =
    (lang === 'ar' ? competition.descriptionAr : competition.descriptionEn) ||
    competition.descriptionAr ||
    competition.descriptionEn;
  const reward =
    (lang === 'ar' ? competition.rewardAr : competition.rewardEn) ||
    competition.rewardAr ||
    competition.rewardEn ||
    '';

  const questions = (competition.questions || []).filter(
    (q) => (q.questionAr && q.questionAr.trim()) || (q.questionEn && q.questionEn.trim())
  );

  let answeredCount = 0;
  let correctCount = 0;
  for (const q of questions) {
    const selected = answers[q.id];
    if (typeof selected === 'number') {
      answeredCount++;
      if (selected === q.correctIndex) {
        correctCount++;
      }
    }
  }

  return (
    <section
      aria-label={lang === 'ar' ? 'مسابقة الأسرة' : 'Fellowship Competition'}
      className="app-card bg-white dark:bg-[#23191D] p-5 sm:p-6 space-y-5 border border-[var(--accent)]/25"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 shrink-0 app-control bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-white">
                {title || (lang === 'ar' ? 'مسابقة صوم الميلاد' : 'Nativity Fast Competition')}
              </h2>
              {reward && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold">
                  <Award className="w-3.5 h-3.5" />
                  <span>{reward}</span>
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {questions.length > 0 && (
          <div className="px-3 py-1.5 app-control bg-stone-100 dark:bg-black/25 border border-stone-200 dark:border-white/10 text-xs font-bold tabular-nums shrink-0">
            <span className="text-stone-500 dark:text-stone-400">
              {lang === 'ar' ? 'نتيجتك: ' : 'Score: '}
            </span>
            <span className="text-[var(--accent)]">
              {formatNumber(correctCount, lang)} / {formatNumber(questions.length, lang)}
            </span>
            <span className="text-stone-400 dark:text-stone-500 ms-1.5">
              ({lang === 'ar'
                ? `تمت إجابة ${formatNumber(answeredCount, 'ar')}`
                : `${answeredCount} answered`})
            </span>
          </div>
        )}
      </div>

      {/* Questions */}
      {questions.length === 0 ? (
        <div className="p-4 app-control bg-stone-50 dark:bg-black/20 border border-stone-200/70 dark:border-white/10 text-xs sm:text-sm text-stone-500 dark:text-stone-400 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <span>
            {lang === 'ar'
              ? 'تم إعلان المسابقة — سيضيف الخدام الأسئلة قريباً.'
              : 'Competition announced — servants will add questions soon.'}
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, qIdx) => {
            const qText =
              (lang === 'ar' ? q.questionAr : q.questionEn) || q.questionAr || q.questionEn;
            const rawOptions = lang === 'ar' ? q.optionsAr : q.optionsEn;
            const fallbackOptions = lang === 'ar' ? q.optionsEn : q.optionsAr;
            const optionCount = Math.max(
              q.optionsAr?.length || 0,
              q.optionsEn?.length || 0
            );
            const resolvedOptions = Array.from({ length: optionCount }, (_, i) => {
              const primary = rawOptions?.[i]?.trim();
              const fb = fallbackOptions?.[i]?.trim();
              return primary || fb || '';
            }).filter((opt) => opt.length > 0);

            const selectedIdx = answers[q.id];
            const isAnswered = typeof selectedIdx === 'number';
            const isCorrect = isAnswered && selectedIdx === q.correctIndex;

            return (
              <div
                key={q.id}
                className="p-4 app-control border border-stone-200 dark:border-white/10 bg-stone-50/80 dark:bg-black/20 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm sm:text-base font-bold text-stone-900 dark:text-white leading-relaxed">
                    <span className="text-[var(--accent)] me-1.5 tabular-nums">
                      {formatNumber(qIdx + 1, lang)}.
                    </span>
                    {qText}
                  </p>
                  {isAnswered && (
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 text-xs font-bold ${
                        isCorrect
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'صحيحة' : 'Correct'}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'غير صحيحة' : 'Incorrect'}</span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {resolvedOptions.map((optText, optIdx) => {
                    const isThisSelected = selectedIdx === optIdx;
                    const isThisCorrect = optIdx === q.correctIndex;

                    let btnStyle =
                      'border-stone-200 dark:border-white/15 bg-white dark:bg-white/5 hover:border-[var(--accent)]/60 hover:bg-[var(--accent-soft)]/30 text-stone-800 dark:text-stone-100';

                    if (isAnswered) {
                      if (isThisCorrect) {
                        btnStyle =
                          'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-bold';
                      } else if (isThisSelected && !isThisCorrect) {
                        btnStyle =
                          'border-rose-500 bg-rose-500/15 text-rose-800 dark:text-rose-200 font-bold';
                      } else {
                        btnStyle =
                          'border-stone-200/70 dark:border-white/10 bg-white/50 dark:bg-white/5 text-stone-500 dark:text-stone-400 opacity-75';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={isAnswered}
                        onClick={() => onAnswerQuestion(q.id, optIdx)}
                        className={`min-h-[42px] px-3.5 py-2 app-control border text-start text-xs sm:text-sm transition-colors flex items-center justify-between gap-2 ${btnStyle} ${
                          isAnswered ? 'cursor-default' : 'cursor-pointer'
                        }`}
                      >
                        <span>{optText}</span>
                        {isAnswered && isThisCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                        {isAnswered && isThisSelected && !isThisCorrect && (
                          <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
