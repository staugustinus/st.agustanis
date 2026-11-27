import React, { useId, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import {
  computeSuggestedDay,
  DEFAULT_COMPETITION_END_DATE,
  DEFAULT_COMPETITION_START_DATE,
  formatNumber,
  getDaysBetweenInclusive,
} from '../data/readingPlan';
import type { HeroIconSize, Language, ThemeMode } from '../types';

interface BethlehemJourneyProps {
  completedDaysCount: number;
  totalDays: number;
  percent: number;
  currentDay: number;
  lentStartDate: string;
  lentEndDate: string;
  userStartDate: string;
  lang: Language;
  theme: ThemeMode;
  christmasTheme?: boolean;
  size: HeroIconSize;
  caption: string;
}

function formatShortMonthDay(dateStr: string, lang: Language): string {
  const dt = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return dateStr;
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    day: 'numeric',
    month: 'short',
  }).format(dt);
}

/**
 * Computes a gentle hillside road point (x, y) for normalized progress t in [0, 1].
 * ViewBox is 560x250 so the full scene fits cleanly on mobile phones without horizontal slicing.
 */
function getRoadPoint(t: number, isRtl: boolean): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(1, t));
  const startX = isRtl ? 490 : 70;
  const endX = isRtl ? 104 : 456;
  const x = startX + (endX - startX) * clamped;
  const y = 198 - Math.sin(clamped * Math.PI * 2.15) * 9 - clamped * 7;
  return { x, y };
}

export const BethlehemJourney: React.FC<BethlehemJourneyProps> = ({
  completedDaysCount,
  totalDays,
  percent,
  currentDay,
  lentStartDate,
  lentEndDate,
  userStartDate,
  lang,
  theme,
  christmasTheme = true,
  size,
  caption,
}) => {
  const uid = useId().replace(/:/g, '');
  const isRtl = lang === 'ar';
  const isDark = theme === 'dark';

  const fastStart = lentStartDate || DEFAULT_COMPETITION_START_DATE;
  const fastEnd = lentEndDate || DEFAULT_COMPETITION_END_DATE;
  const fastTotalDays = Math.max(1, getDaysBetweenInclusive(fastStart, fastEnd));
  const fastTodayDay = computeSuggestedDay(fastStart, fastTotalDays);

  const joinOffsetDays =
    userStartDate > fastStart
      ? Math.min(fastTotalDays - 1, Math.max(0, getDaysBetweenInclusive(fastStart, userStartDate) - 1))
      : 0;

  const userPlanDays = Math.max(1, totalDays);
  const clampedUserDone = Math.max(0, Math.min(userPlanDays, completedDaysCount));
  const hasArrived = clampedUserDone >= userPlanDays || percent >= 100;

  const remainingFastSpan = Math.max(1, fastTotalDays - joinOffsetDays);
  const journeyCompletedDays = hasArrived
    ? fastTotalDays
    : Math.min(
        fastTotalDays,
        Math.round(joinOffsetDays + (clampedUserDone / userPlanDays) * remainingFastSpan)
      );
  const activeFastMarkerDay = Math.min(fastTotalDays, joinOffsetDays + currentDay);

  const progressRatio = hasArrived ? 1 : journeyCompletedDays / fastTotalDays;
  const remainingDays = Math.max(0, fastTotalDays - journeyCompletedDays);

  const { roadPathD, milestones } = useMemo(() => {
    const samples = 60;
    const pts: string[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const p = getRoadPoint(t, isRtl);
      pts.push(`${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
    }

    const stops = Array.from({ length: fastTotalDays }, (_, idx) => {
      const dayNum = idx + 1;
      const t = dayNum / fastTotalDays;
      const p = getRoadPoint(t, isRtl);
      return {
        dayNum,
        x: p.x,
        y: p.y,
        done: dayNum <= journeyCompletedDays,
        isCurrent: dayNum === activeFastMarkerDay || dayNum === fastTodayDay,
      };
    });

    return {
      roadPathD: pts.join(' '),
      milestones: stops,
    };
  }, [isRtl, fastTotalDays, journeyCompletedDays, activeFastMarkerDay, fastTodayDay]);

  const travelerT = hasArrived ? 0.96 : progressRatio * 0.91;
  const travelerPos = getRoadPoint(travelerT, isRtl);
  const bethlehemX = isRtl ? 74 : 486;
  const startX = isRtl ? 494 : 66;
  const moonX = isRtl ? 445 : 115;
  const startDateShort = formatShortMonthDay(fastStart, lang);
  const endDateShort = formatShortMonthDay(fastEnd, lang);

  const containerWidthClass =
    size === 'sm' ? 'max-w-xl' : size === 'lg' ? 'max-w-4xl' : 'max-w-3xl';
  const svgMaxHeightClass =
    size === 'sm'
      ? 'max-h-56 sm:max-h-60'
      : size === 'lg'
      ? 'max-h-64 sm:max-h-80'
      : 'max-h-60 sm:max-h-72';

  // High-contrast, theme-responsive sky & landscape palette
  const skyTop = isDark ? '#0F131F' : '#1E3A5F';
  const skyMid = isDark ? '#1A1B2E' : '#3B6496';
  const skyBottom = isDark ? '#2B1E2A' : '#E7C8A0';
  const hillFarTop = isDark ? '#212236' : '#8A7B8E';
  const hillFarBot = isDark ? '#171726' : '#6A5B6E';
  const hillMidTop = isDark ? '#2D212B' : '#B9926E';
  const hillMidBot = isDark ? '#1F161D' : '#966F4D';
  const groundTop = isDark ? '#251B22' : '#D5B58F';
  const groundBot = isDark ? '#181116' : '#B99166';
  const roadCasing = isDark ? '#0B090C' : '#FFFFFF';
  const roadBed = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(92,58,33,0.22)';
  const caveOuter = isDark ? '#432A32' : '#B89574';
  const caveHighlight = isDark ? '#5C3B45' : '#D2B190';
  const caveInner = isDark ? '#160C10' : '#432B1D';
  const josephCloak = isDark ? '#B45309' : '#92400E';
  const maryRobe = isDark ? '#1D4ED8' : '#1E3A8A';
  const maryMantle = isDark ? '#60A5FA' : '#2563EB';
  const donkeyColor = isDark ? '#9CA3AF' : '#57534E';
  const donkeyHighlight = isDark ? '#D1D5DB' : '#78716C';

  return (
    <div className={`w-full ${containerWidthClass} mx-auto pt-2`}>
      <div className="app-card border border-stone-200 dark:border-white/10 bg-white dark:bg-[#22191C] overflow-hidden shadow-sm">
        {/* Top Journey Status Bar */}
        <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-stone-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 bg-stone-50/80 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white leading-snug">
              {hasArrived
                ? isRtl
                  ? 'وصلت الأسرة إلى بيت لحم — وُلِدَ المخلّص!'
                  : 'Arrived in Bethlehem — The Savior is Born!'
                : isRtl
                ? 'الطريق إلى بيت لحم (مريم ويوسف في الطريق)'
                : 'On the Road to Bethlehem (Mary & Joseph)'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold tabular-nums">
            <span className="text-[var(--accent)]">
              {isRtl
                ? `${formatNumber(journeyCompletedDays, 'ar')} / ${formatNumber(fastTotalDays, 'ar')} يوماً`
                : `${journeyCompletedDays} / ${fastTotalDays} Days`}
            </span>
            <span aria-hidden="true" className="text-stone-400 dark:text-stone-500">·</span>
            <span className="text-stone-700 dark:text-stone-200">
              {formatNumber(Math.round(progressRatio * 100), lang)}%
            </span>
          </div>
        </div>

        {/* Panoramic High-Detail Road to Bethlehem */}
        <div className="relative w-full overflow-hidden" style={{ backgroundColor: groundBot }}>
          <svg
            viewBox="0 0 560 250"
            className={`w-full h-auto ${svgMaxHeightClass} block select-none`}
            preserveAspectRatio="xMidYMid meet"
            shapeRendering="geometricPrecision"
            role="img"
            aria-label={
              isRtl
                ? `رحلة مريم ويوسف إلى بيت لحم: تم اجتياز ${formatNumber(journeyCompletedDays, 'ar')} من ${formatNumber(fastTotalDays, 'ar')} يوماً`
                : `Mary and Joseph journey to Bethlehem: ${journeyCompletedDays} of ${fastTotalDays} days`
            }
          >
            <defs>
              {/* Theme-aware atmospheric sky */}
              <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={skyTop} />
                <stop offset="56%" stopColor={skyMid} />
                <stop offset="100%" stopColor={skyBottom} />
              </linearGradient>

              {/* Active Theme Accent Horizon Glow */}
              <radialGradient id={`accentHorizon-${uid}`} cx="50%" cy="72%" r="60%">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={isDark ? 0.34 : 0.22} />
                <stop offset="65%" stopColor="var(--accent)" stopOpacity={isDark ? 0.1 : 0.06} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </radialGradient>

              <linearGradient id={`hillFar-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={hillFarTop} />
                <stop offset="100%" stopColor={hillFarBot} />
              </linearGradient>

              <linearGradient id={`hillMid-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={hillMidTop} />
                <stop offset="100%" stopColor={hillMidBot} />
              </linearGradient>

              <linearGradient id={`ground-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={groundTop} />
                <stop offset="100%" stopColor={groundBot} />
              </linearGradient>

              <radialGradient id={`starGlow-${uid}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.98" />
                <stop offset="35%" stopColor="#F59E0B" stopOpacity="0.5" />
                <stop offset="70%" stopColor="var(--accent)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>

              <radialGradient id={`lanternGlow-${uid}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>

              <linearGradient id={`starRay-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FEF08A" stopOpacity={hasArrived ? 0.65 : 0.34} />
                <stop offset="65%" stopColor="#FDE68A" stopOpacity={hasArrived ? 0.22 : 0.08} />
                <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
              </linearGradient>

              <filter id={`softGlow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Sky + Theme Accent Ambient Wash */}
            <rect x="0" y="0" width="560" height="250" fill={`url(#sky-${uid})`} />
            <rect x="0" y="0" width="560" height="250" fill={`url(#accentHorizon-${uid})`} />

            {/* Delicate Crescent Moon */}
            <g transform={`translate(${moonX}, 40)`} opacity={isDark ? 0.85 : 0.55}>
              <path
                d="M-4 -11 A 11 11 0 1 0 10 7 A 9 9 0 1 1 -4 -11 Z"
                fill="#FEF3C7"
              />
            </g>

            {/* Twinkling Night/Dawn Starfield */}
            {[
              [105, 32, 1.5, 0.2],
              [165, 56, 1.3, 0.8],
              [220, 26, 1.8, 1.4],
              [282, 48, 1.4, 2.0],
              [340, 28, 1.7, 0.5],
              [395, 58, 1.3, 1.1],
              [445, 34, 1.6, 1.7],
              [510, 50, 1.4, 2.3],
              [195, 82, 1.1, 0.9],
              [365, 78, 1.2, 1.5],
              [260, 22, 1.2, 2.1],
              [315, 68, 1.1, 0.4],
            ].map(([sx, sy, sr, delay], idx) => (
              <circle
                key={idx}
                cx={sx}
                cy={sy}
                r={sr}
                fill="#FEF3C7"
                opacity={isDark ? 0.78 : 0.68}
                className="xmas-light"
                style={{ animationDelay: `${delay}s` }}
              />
            ))}

            {/* Rotating Star of Bethlehem shining directly over Bethlehem */}
            <g transform={`translate(${bethlehemX}, 44)`}>
              {/* Steady Celestial Light Beam down to the Manger Cave */}
              <polygon
                points="0,4 -48,154 48,154"
                fill={`url(#starRay-${uid})`}
              />
              {/* Halo Aura */}
              <circle cx="0" cy="0" r={hasArrived ? 44 : 33} fill={`url(#starGlow-${uid})`} />

              {/* Counter-rotating subtle diagonal starburst rays (perfectly centered at 0,0) */}
              <g className="bethlehem-star-spin-reverse">
                <path
                  d="M-12 -12 L-2 -3.5 L12 -12 L3.5 -2 L12 12 L2 3.5 L-12 12 L-3.5 2 Z"
                  fill="#FDE68A"
                  opacity="0.72"
                />
                <circle cx="0" cy="0" r="14" fill="none" stroke="#FEF3C7" strokeOpacity="0.35" strokeWidth="0.7" strokeDasharray="2 3" />
              </g>

              {/* Main Rotating 8-point Star of Bethlehem (symmetrical around 0,0) */}
              <g className="bethlehem-star-spin" filter={`url(#softGlow-${uid})`}>
                <path
                  d="M0 -20 L3.2 -4.2 L20 0 L3.2 4.2 L0 20 L-3.2 4.2 L-20 0 L-3.2 -4.2 Z"
                  fill="#FBBF24"
                  stroke="#92400E"
                  strokeOpacity={isDark ? 0.45 : 0.65}
                  strokeWidth="0.9"
                />
                <path
                  d="M-10 -10 L-1.8 -2.2 L10 -10 L2.2 -1.8 L10 10 L1.8 2.2 L-10 10 L-2.2 1.8 Z"
                  fill="#FEF3C7"
                  opacity="0.92"
                />
                <circle cx="0" cy="0" r="3" fill="#FFFBEB" />
              </g>
            </g>

            {/* Layered Judean Hills & Foreground Terrain */}
            <path
              d="M0 168 Q 95 126 195 154 T 395 148 T 560 162 L 560 250 L 0 250 Z"
              fill={`url(#hillFar-${uid})`}
            />
            <path
              d="M0 186 Q 130 156 260 176 T 470 168 T 560 182 L 560 250 L 0 250 Z"
              fill={`url(#hillMid-${uid})`}
            />
            <path
              d="M0 205 Q 150 188 300 202 T 560 198 L 560 250 L 0 250 Z"
              fill={`url(#ground-${uid})`}
            />

            {/* Distant Olive / Cypress Silhouettes & Festive Pines */}
            {christmasTheme ? (
              <g opacity={isDark ? 0.9 : 0.88}>
                {[
                  [138, 168, 0.82],
                  [158, 173, 0.62],
                  [255, 174, 0.76],
                  [345, 166, 0.85],
                  [366, 172, 0.62],
                  [432, 172, 0.78],
                ].map(([tx, ty, sc], idx) => (
                  <g key={idx} transform={`translate(${tx}, ${ty}) scale(${sc})`}>
                    <rect x="-2" y="-3" width="4" height="7" fill="#78350F" />
                    <polygon points="0,-32 -12,-14 12,-14" fill={isDark ? '#15803D' : '#16A34A'} />
                    <polygon points="0,-32 -6,-23 6,-23" fill="#F8FAFC" opacity="0.9" />
                    <polygon points="0,-20 -15,-3 15,-3" fill={isDark ? '#166534' : '#15803D'} />
                    <circle
                      cx={idx % 2 === 0 ? -4 : 4}
                      cy="-10"
                      r="1.5"
                      fill={idx % 2 === 0 ? '#FDE047' : 'var(--accent)'}
                      className="xmas-light"
                    />
                  </g>
                ))}
              </g>
            ) : (
              <g opacity={isDark ? 0.45 : 0.55}>
                {[145, 255, 355, 430].map((tx, idx) => (
                  <g key={idx} transform={`translate(${tx}, 172)`}>
                    <rect x="-1.5" y="-6" width="3" height="8" fill="#573B2A" />
                    <ellipse cx="0" cy="-12" rx="6" ry="8" fill={isDark ? '#2E4028' : '#5F774B'} />
                  </g>
                ))}
              </g>
            )}

            {/* Starting Village Marker (Nazareth) */}
            <g transform={`translate(${startX}, 197)`}>
              <ellipse cx="-2" cy="3" rx="22" ry="3.5" fill="rgba(0,0,0,0.22)" />
              <rect x="-18" y="-22" width="15" height="22" rx="1.5" fill={caveOuter} stroke={caveInner} strokeOpacity="0.25" strokeWidth="0.8" />
              <path d="M-18 -22 Q -10.5 -29 -3 -22 Z" fill={caveHighlight} />
              <rect x="-1" y="-16" width="13" height="16" rx="1.5" fill={caveHighlight} stroke={caveInner} strokeOpacity="0.25" strokeWidth="0.8" />
              <rect x="-13" y="-14" width="4" height="5" rx="1" fill="#FBBF24" opacity="0.85" />
              <rect x="4" y="-10" width="3.5" height="4.5" rx="1" fill="#FBBF24" opacity="0.7" />
            </g>

            {/* Bethlehem Village & Nativity Cave at Destination */}
            <g transform={`translate(${bethlehemX}, 195)`}>
              {/* Village domes behind the cave */}
              <rect x="-42" y="-36" width="18" height="34" rx="2" fill={caveOuter} opacity="0.82" />
              <path d="M-42 -36 Q -33 -46 -24 -36 Z" fill={caveHighlight} />
              <rect x="-36" y="-26" width="4" height="5" rx="1" fill="#FDE68A" opacity="0.8" />

              <rect x="24" y="-32" width="16" height="30" rx="2" fill={caveOuter} opacity="0.82" />
              <path d="M24 -32 Q 32 -40 40 -32 Z" fill={caveHighlight} />
              <rect x="30" y="-22" width="4" height="5" rx="1" fill="#FDE68A" opacity="0.75" />

              {/* Ground shadow under Cave */}
              <ellipse cx="0" cy="5" rx="34" ry="4.5" fill="rgba(0,0,0,0.28)" />

              {/* Layered Stone Cave / Stable */}
              <path
                d="M-32 4 C -32 -34, 32 -34, 32 4 Z"
                fill={caveOuter}
                stroke={caveHighlight}
                strokeWidth="1.6"
              />
              <path d="M-23 4 C -23 -23, 23 -23, 23 4 Z" fill={caveInner} />

              {/* Warm lantern radiance inside cave */}
              <ellipse
                cx="0"
                cy="-6"
                rx="19"
                ry="13"
                fill="#F59E0B"
                opacity={hasArrived ? 0.42 : 0.18}
              />

              {/* Wooden Manger Cradle */}
              <g transform="translate(0, -1)">
                <path
                  d="M-9 -4 L9 -4 L7 2 L-7 2 Z"
                  fill="#92400E"
                  stroke="#F59E0B"
                  strokeWidth="0.9"
                />
                <line x1="-6" y1="2" x2="-8" y2="5" stroke="#78350F" strokeWidth="1.6" />
                <line x1="6" y1="2" x2="8" y2="5" stroke="#78350F" strokeWidth="1.6" />
                <path d="M-8 -4 Q 0 -7 8 -4" fill="#FBBF24" opacity="0.85" />

                {hasArrived && (
                  <g>
                    <circle cx="0" cy="-8" r="9.5" fill="#FDE68A" opacity="0.52" />
                    <circle cx="0" cy="-7" r="4.8" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1" />
                    <ellipse cx="0" cy="-6" rx="6.5" ry="2.6" fill="#FFFBEB" />
                    <circle cx="-3.5" cy="-7.2" r="2.2" fill="#FDE68A" />

                    {/* St. Mary kneeling inside Bethlehem */}
                    <g transform="translate(-14, 0)">
                      <circle cx="0" cy="-16" r="4.2" fill="none" stroke="#FBBF24" strokeWidth="1.1" opacity="0.95" />
                      <path d="M-5 4 C -5 -6, -3 -12, 0 -13 C 3 -12, 5 -6, 4 4 Z" fill={maryRobe} />
                      <path d="M-4 -12 Q 0 -16 3 -11 L 1 -4 L -3 -4 Z" fill={maryMantle} />
                      <circle cx="0.5" cy="-15.5" r="2.6" fill="#F3D2B3" />
                    </g>

                    {/* St. Joseph standing watch inside Bethlehem */}
                    <g transform="translate(14, 0)">
                      <circle cx="0" cy="-18" r="4.2" fill="none" stroke="#FBBF24" strokeWidth="1" opacity="0.9" />
                      <path d="M-4 4 L -3 -14 L 3 -14 L 4 4 Z" fill={josephCloak} />
                      <circle cx="0" cy="-17.5" r="2.7" fill="#E6BE9A" />
                      <line x1="6" y1="-20" x2="5" y2="4" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
                    </g>
                  </g>
                )}
              </g>
            </g>

            {/* Road Track with High-Contrast Casing so Accent Color Always Stands Out in Light & Dark Modes */}
            <path
              d={roadPathD}
              fill="none"
              stroke={roadCasing}
              strokeOpacity={isDark ? 0.65 : 0.85}
              strokeWidth="9.5"
              strokeLinecap="round"
            />
            <path
              d={roadPathD}
              fill="none"
              stroke={roadBed}
              strokeWidth="6.2"
              strokeLinecap="round"
              strokeDasharray="6 5"
            />

            {/* Traveled Accent Progress Path */}
            <path
              d={roadPathD}
              pathLength={100}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="5.8"
              strokeLinecap="round"
              strokeDasharray="100"
              strokeDashoffset={100 - progressRatio * 100}
              style={{ transition: 'stroke-dashoffset 650ms cubic-bezier(0.22, 1, 0.36, 1)' }}
            />
            {/* Crisp Center Highlight Sheen */}
            <path
              d={roadPathD}
              pathLength={100}
              fill="none"
              stroke="#FFFFFF"
              strokeOpacity="0.34"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeDasharray="100"
              strokeDashoffset={100 - progressRatio * 100}
              style={{ transition: 'stroke-dashoffset 650ms cubic-bezier(0.22, 1, 0.36, 1)' }}
            />

            {/* Milestone Nodes along the 43-Day Road */}
            {milestones.map((m) => {
              const isWeekStop = m.dayNum % 7 === 0 || m.dayNum === 1 || m.dayNum === fastTotalDays;
              return (
                <g key={m.dayNum}>
                  {m.isCurrent && (
                    <circle
                      cx={m.x}
                      cy={m.y}
                      r={6.8}
                      fill="var(--accent)"
                      opacity="0.26"
                    />
                  )}
                  <circle
                    cx={m.x}
                    cy={m.y}
                    r={m.isCurrent ? 4 : isWeekStop ? 2.8 : 1.6}
                    fill={
                      m.done
                        ? 'var(--accent)'
                        : isDark
                        ? 'rgba(255,255,255,0.34)'
                        : 'rgba(120,80,50,0.4)'
                    }
                    stroke={
                      m.isCurrent
                        ? '#FBBF24'
                        : m.done
                        ? isDark
                          ? '#181214'
                          : '#FFFFFF'
                        : 'none'
                    }
                    strokeWidth={m.isCurrent ? 1.6 : 0.9}
                  />
                </g>
              );
            })}

            {/* St. Mary & St. Joseph Walking toward Bethlehem */}
            {!hasArrived && (
              <g
                style={{
                  transform: `translate(${travelerPos.x.toFixed(1)}px, ${travelerPos.y.toFixed(1)}px)`,
                  transition: 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <g transform={isRtl ? 'scale(-1.24, 1.24)' : 'scale(1.24)'}>
                  {/* Lantern light casting ahead */}
                  <circle cx="25" cy="-19" r="28" fill={`url(#lanternGlow-${uid})`} />

                  {/* Ground shadow */}
                  <ellipse cx="-1" cy="3.5" rx="27" ry="3.8" fill="rgba(0,0,0,0.28)" />

                  {/* Gentle Donkey carrying St. Mary */}
                  <g transform="translate(-8, -2)">
                    <line x1="-11" y1="-8" x2="-12" y2="3" stroke={donkeyColor} strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="-6" y1="-8" x2="-5" y2="3" stroke={donkeyHighlight} strokeWidth="2.2" strokeLinecap="round" />
                    <line x1="6" y1="-8" x2="7" y2="3" stroke={donkeyColor} strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="10" y1="-8" x2="12" y2="3" stroke={donkeyHighlight} strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M-13 -14 Q -18 -10 -17 -5" fill="none" stroke={donkeyColor} strokeWidth="1.6" strokeLinecap="round" />
                    <ellipse cx="-1" cy="-12" rx="13.5" ry="6.8" fill={donkeyColor} />
                    <ellipse cx="0" cy="-14" rx="9" ry="3.5" fill={donkeyHighlight} opacity="0.45" />
                    {/* Accent Saddle Blanket with Golden Border */}
                    <path
                      d="M-8.5 -18.5 Q 0 -19.5 6.5 -17.5 L 5 -9.5 L -7.5 -9.5 Z"
                      fill="var(--accent)"
                      stroke="#FDE68A"
                      strokeWidth="0.7"
                    />
                    <path d="M9 -14 L 16 -23 L 22.5 -20 L 20 -16 L 13 -11 Z" fill={donkeyColor} />
                    <path d="M15 -23 L 14 -30.5 L 17 -24 Z" fill={donkeyColor} />
                    <path d="M17 -22 L 18 -29.5 L 19 -22 Z" fill={donkeyHighlight} />
                    {/* Bridle */}
                    <line x1="18" y1="-19" x2="21.5" y2="-18" stroke="#D97706" strokeWidth="0.9" />
                  </g>

                  {/* St. Mary riding calmly on the donkey */}
                  <g transform="translate(-9, -16)">
                    <circle cx="0" cy="-22" r="6.2" fill="none" stroke="#FBBF24" strokeWidth="1.3" opacity="0.96" />
                    <path d="M-6 2 C -6 -9, -4 -17, 0 -18 C 5 -17, 6 -8, 6 2 Z" fill={maryRobe} />
                    <path d="M-4 -18 Q 1 -22 5 -16 L 3 -3 L -4 -4 Z" fill={maryMantle} />
                    <circle cx="1.2" cy="-21.5" r="3.2" fill="#F3D2B3" />
                    <path d="M2 -13 Q 6 -11 4 -8" fill="none" stroke="#F3D2B3" strokeWidth="1.8" strokeLinecap="round" />
                  </g>

                  {/* St. Joseph walking ahead with staff & glowing lantern */}
                  <g transform="translate(17, 0)">
                    <circle cx="0" cy="-35" r="6" fill="none" stroke="#FBBF24" strokeWidth="1.2" opacity="0.92" />
                    <line x1="-2" y1="-10" x2="-5" y2="2" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="2" y1="-10" x2="5" y2="2" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M-5 -8 L -4 -29 L 4 -29 L 5 -8 Z" fill={josephCloak} />
                    <path d="M-5 -28 Q 0 -31 5 -26 L 3 -14 L -5 -16 Z" fill="#D97706" opacity="0.9" />
                    <circle cx="0.5" cy="-34" r="3.4" fill="#E6BE9A" />
                    <path d="M-1.5 -32 Q 1 -28.5 3.5 -32" fill="#6B4F3A" />
                    <line x1="3" y1="-24" x2="9" y2="-21" stroke="#E6BE9A" strokeWidth="2" strokeLinecap="round" />
                    <line x1="9" y1="-39" x2="7" y2="2" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
                    <line x1="9" y1="-26" x2="9" y2="-21" stroke="#D97706" strokeWidth="1" />
                    <rect x="6.6" y="-21" width="4.8" height="6.2" rx="1.2" fill="#FEF08A" stroke="#B45309" strokeWidth="0.9" />
                  </g>
                </g>
              </g>
            )}
          </svg>
        </div>

        {/* Bottom Route Landmarks & Caption */}
        <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 border-t border-stone-200/80 dark:border-white/10 flex flex-col gap-1.5 bg-stone-50/70 dark:bg-white/[0.02]">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] sm:text-xs font-semibold text-stone-600 dark:text-stone-300">
            <span>
              {isRtl ? `الناصرة · ${startDateShort}` : `Nazareth · ${startDateShort}`}
            </span>
            <span className="text-[var(--accent)] font-bold tabular-nums text-center">
              {hasArrived
                ? isRtl
                  ? 'اكتمل الطريق في بيت لحم!'
                  : 'Reached Bethlehem!'
                : isRtl
                ? `اليوم ${formatNumber(fastTodayDay, 'ar')} من ${formatNumber(fastTotalDays, 'ar')} في الصوم · متبقّي ${formatNumber(remainingDays, 'ar')} يوماً للوصول`
                : `Fast Day ${fastTodayDay} of ${fastTotalDays} · ${remainingDays} days to Bethlehem`}
            </span>
            <span>
              {isRtl ? `بيت لحم · ${endDateShort}` : `Bethlehem · ${endDateShort}`}
            </span>
          </div>

          {caption && (
            <p className="text-center text-xs font-semibold text-stone-600 dark:text-stone-300 pt-0.5">
              {caption}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
