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
 * In Arabic (RTL), the journey starts on the right (x=705) and moves left toward Bethlehem (x=110).
 * In English (LTR), the journey starts on the left (x=95) and moves right toward Bethlehem (x=690).
 */
function getRoadPoint(t: number, isRtl: boolean): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(1, t));
  const startX = isRtl ? 705 : 95;
  const endX = isRtl ? 128 : 672;
  const x = startX + (endX - startX) * clamped;
  // Gentle rolling desert hill undulation
  const y = 168 - Math.sin(clamped * Math.PI * 2.2) * 8 - clamped * 8;
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

  // Days already elapsed in the 43-day Nativity Fast before this participant started
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

  // Road polyline path sampled smoothly across 48 segments so pathLength="100" aligns with getRoadPoint(t)
  const { roadPathD, milestones } = useMemo(() => {
    const samples = 48;
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

  // Travelers stop just at the entrance of Bethlehem right before full arrival, then enter Bethlehem on arrival
  const travelerT = hasArrived ? 0.96 : progressRatio * 0.93;
  const travelerPos = getRoadPoint(travelerT, isRtl);
  const bethlehemX = isRtl ? 78 : 722;
  const startX = isRtl ? 705 : 95;
  const startDateShort = formatShortMonthDay(fastStart, lang);
  const endDateShort = formatShortMonthDay(fastEnd, lang);

  const containerWidthClass =
    size === 'sm' ? 'max-w-xl' : size === 'lg' ? 'max-w-4xl' : 'max-w-3xl';
  const svgHeightClass =
    size === 'sm' ? 'h-40 sm:h-44' : size === 'lg' ? 'h-52 sm:h-60' : 'h-44 sm:h-52';

  // Palette adapting gracefully to Dark / Light theme
  const skyTop = isDark ? '#1A1014' : '#FDF6EC';
  const skyBottom = isDark ? '#2B1920' : '#F4E5D2';
  const hillBack = isDark ? '#26171D' : '#E9D6BE';
  const hillMid = isDark ? '#321E25' : '#DEC3A4';
  const roadTrack = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(120,80,50,0.22)';
  const caveOuter = isDark ? '#3F272E' : '#C7A98B';
  const caveInner = isDark ? '#1D1115' : '#573B2A';
  const josephCloak = isDark ? '#B45309' : '#92400E';
  const maryRobe = isDark ? '#1D4ED8' : '#1E40AF';
  const maryMantle = isDark ? '#3B82F6' : '#2563EB';
  const donkeyColor = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <div className={`w-full ${containerWidthClass} mx-auto pt-2`}>
      <div className="app-card border border-stone-200 dark:border-white/10 bg-white dark:bg-[#22191C] overflow-hidden shadow-sm">
        {/* Top Journey Status Bar */}
        <div className="px-4 py-3 border-b border-stone-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 bg-stone-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
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
            <span className="px-2.5 py-1 rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
              {isRtl
                ? `${formatNumber(journeyCompletedDays, 'ar')} / ${formatNumber(fastTotalDays, 'ar')} يوماً`
                : `${journeyCompletedDays} / ${fastTotalDays} Days`}
            </span>
            <span className="px-2 py-1 rounded-md bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-200">
              {formatNumber(Math.round(progressRatio * 100), lang)}%
            </span>
          </div>
        </div>

        {/* Panoramic Illustrated Road to Bethlehem */}
        <div className="relative w-full">
          <svg
            viewBox="0 0 800 220"
            className={`w-full ${svgHeightClass} block select-none`}
            preserveAspectRatio="xMidYMid slice"
            role="img"
            aria-label={
              isRtl
                ? `رحلة مريم ويوسف إلى بيت لحم: تم اجتياز ${formatNumber(journeyCompletedDays, 'ar')} من ${formatNumber(fastTotalDays, 'ar')} يوماً`
                : `Mary and Joseph journey to Bethlehem: ${journeyCompletedDays} of ${fastTotalDays} days`
            }
          >
            <defs>
              <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={skyTop} />
                <stop offset="100%" stopColor={skyBottom} />
              </linearGradient>

              <radialGradient id={`starGlow-${uid}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#F59E0B" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>

              <radialGradient id={`lanternGlow-${uid}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>

              <linearGradient id={`starRay-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FDE68A" stopOpacity={hasArrived ? 0.55 : 0.25} />
                <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Sky Background */}
            <rect x="0" y="0" width="800" height="220" fill={`url(#sky-${uid})`} />

            {/* Subtle Night/Dawn Stars */}
            {[
              [145, 30, 1.5],
              [230, 52, 1.2],
              [310, 24, 1.8],
              [395, 44, 1.3],
              [485, 28, 1.6],
              [565, 55, 1.2],
              [645, 34, 1.5],
              [735, 48, 1.4],
              [275, 75, 1.1],
              [520, 72, 1.1],
            ].map(([sx, sy, sr], idx) => (
              <circle
                key={idx}
                cx={sx}
                cy={sy}
                r={sr}
                fill={isDark ? '#FDE68A' : '#D97706'}
                opacity={isDark ? 0.65 : 0.35}
              />
            ))}

            {/* Star of Bethlehem shining directly over Bethlehem */}
            <g transform={`translate(${bethlehemX}, 44)`}>
              {/* Beam down to the Manger Cave */}
              <polygon
                points="0,6 -42,135 42,135"
                fill={`url(#starRay-${uid})`}
              />
              <circle cx="0" cy="0" r={hasArrived ? 42 : 30} fill={`url(#starGlow-${uid})`} />
              {/* 8-point Bethlehem Star */}
              <path
                d="M0 -18 L3 -4 L16 0 L3 4 L0 22 L-3 4 L-16 0 L-3 -4 Z"
                fill="#FBBF24"
                stroke="#FEF3C7"
                strokeWidth="0.8"
              />
              <path
                d="M-9 -9 L-2 -2 L9 -9 L2 0 L9 9 L0 2 L-9 9 L-2 0 Z"
                fill="#FDE68A"
                opacity="0.85"
              />
            </g>

            {/* Distant Judean Hills */}
            <path
              d="M0 158 Q 140 112 280 144 T 560 136 T 800 150 L 800 220 L 0 220 Z"
              fill={hillBack}
            />
            <path
              d="M0 176 Q 170 146 360 168 T 680 156 T 800 170 L 800 220 L 0 220 Z"
              fill={hillMid}
            />

            {/* Snow-dusted Christmas Pine Trees along the Hills */}
            {christmasTheme && (
              <g opacity={isDark ? 0.78 : 0.72}>
                {[
                  [185, 149, 0.75],
                  [205, 152, 0.55],
                  [355, 154, 0.7],
                  [485, 146, 0.8],
                  [505, 150, 0.58],
                  [620, 154, 0.72],
                ].map(([tx, ty, sc], idx) => (
                  <g key={idx} transform={`translate(${tx}, ${ty}) scale(${sc})`}>
                    <rect x="-2" y="-3" width="4" height="7" fill="#78350F" />
                    <polygon points="0,-32 -12,-14 12,-14" fill={isDark ? '#15803D' : '#16A34A'} />
                    <polygon points="0,-32 -6,-23 6,-23" fill="#F8FAFC" opacity="0.88" />
                    <polygon points="0,-20 -15,-3 15,-3" fill={isDark ? '#166534' : '#15803D'} />
                    <circle
                      cx={idx % 2 === 0 ? -4 : 4}
                      cy="-10"
                      r="1.4"
                      fill={idx % 2 === 0 ? '#FDE047' : '#EF4444'}
                      className="xmas-light"
                    />
                  </g>
                ))}
              </g>
            )}

            {/* Starting Town Marker (Nazareth) */}
            <g transform={`translate(${startX}, 168)`} opacity="0.72">
              <rect x="-16" y="-22" width="14" height="20" rx="1.5" fill={caveOuter} />
              <rect x="0" y="-16" width="12" height="14" rx="1.5" fill={caveOuter} />
              <path d="M-16 -22 Q -9 -28 -2 -22" fill={caveOuter} />
              <circle cx="-9" cy="-12" r="2" fill="#FBBF24" opacity="0.65" />
            </g>

            {/* Bethlehem Town & Nativity Cave at Destination */}
            <g transform={`translate(${bethlehemX}, 166)`}>
              {/* Distant Bethlehem rooftops */}
              <rect x="-42" y="-36" width="18" height="32" rx="2" fill={caveOuter} opacity="0.75" />
              <path d="M-42 -36 Q -33 -44 -24 -36" fill={caveOuter} opacity="0.85" />
              <rect x="24" y="-32" width="16" height="28" rx="2" fill={caveOuter} opacity="0.75" />

              {/* Humble Cave / Stable Arch */}
              <path
                d="M-30 4 C -30 -32, 30 -32, 30 4 Z"
                fill={caveOuter}
                stroke={isDark ? 'rgba(255,255,255,0.16)' : 'rgba(120,80,50,0.3)'}
                strokeWidth="1.5"
              />
              <path d="M-21 4 C -21 -21, 21 -21, 21 4 Z" fill={caveInner} />

              {/* Warm light inside cave */}
              <ellipse
                cx="0"
                cy="-5"
                rx="18"
                ry="12"
                fill="#F59E0B"
                opacity={hasArrived ? 0.34 : 0.12}
              />

              {/* Manger / Crib: Empty before Day 43, Newborn Christ inside ONLY upon arrival! */}
              <g transform="translate(0, -1)">
                {/* Wooden Manger Cradle */}
                <path
                  d="M-9 -4 L9 -4 L7 2 L-7 2 Z"
                  fill="#92400E"
                  stroke="#D97706"
                  strokeWidth="0.9"
                />
                <line x1="-6" y1="2" x2="-8" y2="5" stroke="#78350F" strokeWidth="1.5" />
                <line x1="6" y1="2" x2="8" y2="5" stroke="#78350F" strokeWidth="1.5" />
                {/* Golden straw */}
                <path d="M-8 -4 Q 0 -7 8 -4" fill="#FBBF24" opacity="0.75" />

                {hasArrived && (
                  /* Newborn Christ Child in the Manger + Mary & Joseph kneeling inside Bethlehem */
                  <g>
                    {/* Radiant Halo behind Baby Jesus */}
                    <circle cx="0" cy="-8" r="9" fill="#FDE68A" opacity="0.45" />
                    <circle cx="0" cy="-7" r="4.5" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1" />
                    {/* Swaddled Christ Child */}
                    <ellipse cx="0" cy="-6" rx="6.5" ry="2.6" fill="#FFFBEB" />
                    <circle cx="-3.5" cy="-7.2" r="2.2" fill="#FDE68A" />

                    {/* St. Mary kneeling beside manger */}
                    <g transform="translate(-14, 0)">
                      <circle cx="0" cy="-16" r="4.2" fill="none" stroke="#FBBF24" strokeWidth="1" opacity="0.9" />
                      <path d="M-5 4 C -5 -6, -3 -12, 0 -13 C 3 -12, 5 -6, 4 4 Z" fill={maryRobe} />
                      <path d="M-4 -12 Q 0 -16 3 -11 L 1 -4 L -3 -4 Z" fill={maryMantle} />
                      <circle cx="0.5" cy="-15.5" r="2.6" fill="#F3D2B3" />
                    </g>

                    {/* St. Joseph standing/kneeling watch beside manger */}
                    <g transform="translate(14, 0)">
                      <circle cx="0" cy="-18" r="4.2" fill="none" stroke="#FBBF24" strokeWidth="0.9" opacity="0.85" />
                      <path d="M-4 4 L -3 -14 L 3 -14 L 4 4 Z" fill={josephCloak} />
                      <circle cx="0" cy="-17.5" r="2.7" fill="#E6BE9A" />
                      <line x1="6" y1="-20" x2="5" y2="4" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
                    </g>
                  </g>
                )}
              </g>
            </g>

            {/* The Journey Line / Road Path */}
            {/* Remaining dashed track */}
            <path
              d={roadPathD}
              fill="none"
              stroke={roadTrack}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="6 6"
            />

            {/* Traveled glowing solid path */}
            <path
              d={roadPathD}
              pathLength={100}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray="100"
              strokeDashoffset={100 - progressRatio * 100}
              style={{ transition: 'stroke-dashoffset 650ms cubic-bezier(0.22, 1, 0.36, 1)' }}
            />

            {/* Day Milestone Dots along the Road (every day of the 43-day journey) */}
            {milestones.map((m) => {
              const isWeekStop = m.dayNum % 7 === 0 || m.dayNum === 1 || m.dayNum === fastTotalDays;
              return (
                <circle
                  key={m.dayNum}
                  cx={m.x}
                  cy={m.y}
                  r={m.isCurrent ? 3.8 : isWeekStop ? 2.7 : 1.7}
                  fill={
                    m.done
                      ? 'var(--accent)'
                      : isDark
                      ? 'rgba(255,255,255,0.28)'
                      : 'rgba(120,80,50,0.32)'
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
                  strokeWidth={m.isCurrent ? 1.5 : 0.8}
                />
              );
            })}

            {/* St. Mary & St. Joseph Walking on the Road (shown BEFORE arriving in Bethlehem; NO Baby Jesus yet!) */}
            {!hasArrived && (
              <g
                style={{
                  transform: `translate(${travelerPos.x.toFixed(1)}px, ${travelerPos.y.toFixed(1)}px)`,
                  transition: 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                {/* Mirror travelers horizontally so they always face toward Bethlehem */}
                <g transform={isRtl ? 'scale(-1, 1)' : undefined}>
                  {/* Soft warm lantern illumination ahead on the road */}
                  <circle cx="24" cy="-18" r="24" fill={`url(#lanternGlow-${uid})`} />

                  {/* Ground shadow */}
                  <ellipse cx="-2" cy="3" rx="26" ry="3.5" fill="rgba(0,0,0,0.22)" />

                  {/* Gentle Donkey carrying St. Mary */}
                  <g transform="translate(-8, -2)">
                    {/* Donkey legs */}
                    <line x1="-11" y1="-8" x2="-12" y2="3" stroke={donkeyColor} strokeWidth="2.4" strokeLinecap="round" />
                    <line x1="-6" y1="-8" x2="-5" y2="3" stroke={donkeyColor} strokeWidth="2.2" strokeLinecap="round" />
                    <line x1="6" y1="-8" x2="7" y2="3" stroke={donkeyColor} strokeWidth="2.4" strokeLinecap="round" />
                    <line x1="10" y1="-8" x2="12" y2="3" stroke={donkeyColor} strokeWidth="2.2" strokeLinecap="round" />
                    {/* Donkey tail */}
                    <path d="M-13 -14 Q -18 -10 -17 -5" fill="none" stroke={donkeyColor} strokeWidth="1.6" strokeLinecap="round" />
                    {/* Donkey body */}
                    <ellipse cx="-1" cy="-12" rx="13" ry="6.5" fill={donkeyColor} />
                    {/* Saddle blanket in accent color */}
                    <path d="M-8 -18 Q 0 -19 6 -17 L 5 -10 L -7 -10 Z" fill="var(--accent)" opacity="0.85" />
                    {/* Donkey neck & head */}
                    <path d="M9 -14 L 16 -23 L 22 -20 L 20 -16 L 13 -11 Z" fill={donkeyColor} />
                    {/* Donkey ears */}
                    <path d="M15 -23 L 14 -30 L 17 -24 Z" fill={donkeyColor} />
                    <path d="M17 -22 L 18 -29 L 19 -22 Z" fill={donkeyColor} />
                  </g>

                  {/* St. Mary riding calmly on the donkey (NO infant Jesus yet!) */}
                  <g transform="translate(-9, -16)">
                    {/* Soft golden halo */}
                    <circle cx="0" cy="-22" r="6" fill="none" stroke="#FBBF24" strokeWidth="1.1" opacity="0.9" />
                    {/* Robe & draped mantle */}
                    <path d="M-6 2 C -6 -9, -4 -17, 0 -18 C 5 -17, 6 -8, 6 2 Z" fill={maryRobe} />
                    <path d="M-4 -18 Q 1 -22 5 -16 L 3 -3 L -4 -4 Z" fill={maryMantle} />
                    {/* Face */}
                    <circle cx="1.2" cy="-21.5" r="3.2" fill="#F3D2B3" />
                    {/* Hands folded reverently over her heart/womb */}
                    <path d="M2 -13 Q 6 -11 4 -8" fill="none" stroke="#F3D2B3" strokeWidth="1.8" strokeLinecap="round" />
                  </g>

                  {/* St. Joseph walking ahead with staff & lantern */}
                  <g transform="translate(17, 0)">
                    {/* Soft golden halo */}
                    <circle cx="0" cy="-35" r="6" fill="none" stroke="#FBBF24" strokeWidth="1" opacity="0.85" />
                    {/* Walking legs */}
                    <line x1="-2" y1="-10" x2="-5" y2="2" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="2" y1="-10" x2="5" y2="2" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Tunic & traveler cloak */}
                    <path d="M-5 -8 L -4 -29 L 4 -29 L 5 -8 Z" fill={josephCloak} />
                    <path d="M-5 -28 Q 0 -31 5 -26 L 3 -14 L -5 -16 Z" fill="#D97706" opacity="0.85" />
                    {/* Head & beard */}
                    <circle cx="0.5" cy="-34" r="3.4" fill="#E6BE9A" />
                    <path d="M-1.5 -32 Q 1 -28.5 3.5 -32" fill="#6B4F3A" />
                    {/* Arm holding shepherd staff & lantern */}
                    <line x1="3" y1="-24" x2="9" y2="-21" stroke="#E6BE9A" strokeWidth="2" strokeLinecap="round" />
                    {/* Wooden Staff */}
                    <line x1="9" y1="-39" x2="7" y2="2" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
                    {/* Glowing Lantern hanging from staff */}
                    <line x1="9" y1="-26" x2="9" y2="-21" stroke="#D97706" strokeWidth="1" />
                    <rect x="6.8" y="-21" width="4.4" height="6" rx="1" fill="#FDE047" stroke="#B45309" strokeWidth="0.9" />
                  </g>
                </g>
              </g>
            )}
          </svg>
        </div>

        {/* Bottom Route Landmarks & Caption */}
        <div className="px-4 py-3 border-t border-stone-200/80 dark:border-white/10 flex flex-col gap-1.5 bg-stone-50/50 dark:bg-white/[0.015]">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs font-semibold text-stone-500 dark:text-stone-400">
            <span>
              {isRtl ? `الناصرة · ${startDateShort}` : `Nazareth · ${startDateShort}`}
            </span>
            <span className="text-[var(--accent)] font-bold tabular-nums">
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
