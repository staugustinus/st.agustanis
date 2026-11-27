import React, { useMemo } from 'react';
import type { ThemeMode } from '../types';

interface ChristmasAtmosphereProps {
  enabled: boolean;
  theme: ThemeMode;
}

interface SnowflakeSpec {
  id: number;
  leftPercent: number;
  sizePx: number;
  durationSec: number;
  delaySec: number;
  driftPx: number;
  opacity: number;
  isCrystal: boolean;
}

export const ChristmasAtmosphere: React.FC<ChristmasAtmosphereProps> = ({
  enabled,
  theme,
}) => {
  const isDark = theme === 'dark';

  const flakes = useMemo<SnowflakeSpec[]>(() => {
    const count = 58;
    return Array.from({ length: count }, (_, i) => {
      const s1 = Math.sin(i * 12.9898 + 1.23) * 43758.5453;
      const r1 = s1 - Math.floor(s1);
      const s2 = Math.sin(i * 78.233 + 4.56) * 19341.1234;
      const r2 = s2 - Math.floor(s2);
      const s3 = Math.sin(i * 39.425 + 7.89) * 28411.7712;
      const r3 = s3 - Math.floor(s3);

      const isCrystal = i % 3 === 0;
      return {
        id: i,
        leftPercent: Math.round(r1 * 98 * 10) / 10,
        sizePx: isCrystal ? 10 + Math.round(r2 * 8) : 3.5 + Math.round(r2 * 4.5),
        durationSec: 10 + Math.round(r3 * 12),
        delaySec: -Math.round(r2 * 20 * 10) / 10,
        driftPx: Math.round((r1 - 0.5) * 62),
        opacity: isDark ? 0.42 + r3 * 0.48 : 0.48 + r3 * 0.38,
        isCrystal,
      };
    });
  }, [isDark]);

  if (!enabled) return null;

  const treeDark = isDark ? '#14532D' : '#166534';
  const treeMid = isDark ? '#166534' : '#15803D';
  const treeLight = isDark ? '#15803D' : '#22C55E';
  const snowCap = isDark ? 'rgba(248, 250, 252, 0.88)' : 'rgba(255, 255, 255, 0.98)';
  const driftFill = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(226, 232, 240, 0.65)';

  return (
    /* Entire Christmas Atmosphere sits at z-0 strictly BEHIND all cards, text, and headers */
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* 1. Falling Snowflakes Layer (Behind Text & Cards) */}
      {flakes.map((f) => (
        <div
          key={f.id}
          className="xmas-flake"
          style={
            {
              left: `${f.leftPercent}%`,
              opacity: f.opacity,
              animationDuration: `${f.durationSec}s`,
              animationDelay: `${f.delaySec}s`,
              '--snow-drift': `${f.driftPx}px`,
            } as React.CSSProperties
          }
        >
          {f.isCrystal ? (
            <svg
              width={f.sizePx}
              height={f.sizePx}
              viewBox="0 0 24 24"
              fill="none"
              stroke={isDark ? '#FFFFFF' : '#94A3B8'}
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="3.3" y1="7" x2="20.7" y2="17" />
              <line x1="20.7" y1="7" x2="3.3" y2="17" />
              <line x1="12" y1="5" x2="9.5" y2="3.2" />
              <line x1="12" y1="5" x2="14.5" y2="3.2" />
            </svg>
          ) : (
            <span
              className="block rounded-full"
              style={{
                width: `${f.sizePx}px`,
                height: `${f.sizePx}px`,
                backgroundColor: isDark ? '#FFFFFF' : '#CBD5E1',
                boxShadow: isDark
                  ? '0 0 6px rgba(255,255,255,0.7)'
                  : '0 0 4px rgba(148,163,184,0.5)',
              }}
            />
          )}
        </div>
      ))}

      {/* 2. Top-Left Evergreen Pine Bough, Holly Berries & Golden Ornaments */}
      <svg
        viewBox="0 0 260 150"
        className="absolute top-14 left-0 w-44 sm:w-64 h-auto opacity-80"
      >
        <path d="M-8 10 Q 58 28 138 6 Q 76 42 -6 46 Z" fill={treeDark} />
        <path d="M-6 26 Q 48 54 106 38 Q 52 72 -4 68 Z" fill={treeMid} />
        <path d="M-6 6 Q 36 16 74 0 Q 34 26 -6 22 Z" fill={treeLight} opacity="0.85" />
        {/* Holly Berries */}
        <circle cx="38" cy="24" r="4" fill="#DC2626" />
        <circle cx="46" cy="28" r="3.5" fill="#EF4444" />
        <circle cx="40" cy="32" r="3.2" fill="#B91C1C" />
        <circle cx="88" cy="24" r="3.5" fill="#DC2626" />
        <circle cx="94" cy="29" r="3" fill="#EF4444" />
        {/* Hanging Gold & Red Baubles */}
        <line x1="62" y1="22" x2="62" y2="44" stroke="#FBBF24" strokeWidth="1.2" />
        <circle cx="62" cy="50" r="7" fill="#D97706" stroke="#FDE047" strokeWidth="1" />
        <line x1="118" y1="14" x2="118" y2="33" stroke="#FBBF24" strokeWidth="1.1" />
        <circle cx="118" cy="39" r="6" fill="#DC2626" stroke="#FCA5A5" strokeWidth="0.9" />
        {/* Twinkling Fairy Lights */}
        <circle cx="22" cy="18" r="2.6" fill="#FDE047" className="xmas-light" />
        <circle cx="74" cy="34" r="2.5" fill="#4ADE80" className="xmas-light" style={{ animationDelay: '0.6s' }} />
        <circle cx="105" cy="18" r="2.5" fill="#F87171" className="xmas-light" style={{ animationDelay: '1.3s' }} />
      </svg>

      {/* 3. Top-Right Evergreen Pine Bough, Holly Berries & Golden Ornaments */}
      <svg
        viewBox="0 0 260 150"
        className="absolute top-14 right-0 w-44 sm:w-64 h-auto opacity-80 -scale-x-100"
      >
        <path d="M-8 10 Q 58 28 138 6 Q 76 42 -6 46 Z" fill={treeDark} />
        <path d="M-6 26 Q 48 54 106 38 Q 52 72 -4 68 Z" fill={treeMid} />
        <path d="M-6 6 Q 36 16 74 0 Q 34 26 -6 22 Z" fill={treeLight} opacity="0.85" />
        <circle cx="38" cy="24" r="4" fill="#DC2626" />
        <circle cx="46" cy="28" r="3.5" fill="#EF4444" />
        <circle cx="40" cy="32" r="3.2" fill="#B91C1C" />
        <line x1="62" y1="22" x2="62" y2="44" stroke="#FBBF24" strokeWidth="1.2" />
        <circle cx="62" cy="50" r="7" fill="#DC2626" stroke="#FDE047" strokeWidth="1" />
        <line x1="118" y1="14" x2="118" y2="33" stroke="#FBBF24" strokeWidth="1.1" />
        <circle cx="118" cy="39" r="6" fill="#D97706" stroke="#FDE047" strokeWidth="0.9" />
        <circle cx="22" cy="18" r="2.6" fill="#FDE047" className="xmas-light" style={{ animationDelay: '0.4s' }} />
        <circle cx="74" cy="34" r="2.5" fill="#4ADE80" className="xmas-light" style={{ animationDelay: '1.1s' }} />
        <circle cx="105" cy="18" r="2.5" fill="#F87171" className="xmas-light" style={{ animationDelay: '1.7s' }} />
      </svg>

      {/* 4. Rich Bottom Evergreen Pine Forest, Gifts & Snowdrifts */}
      <svg
        viewBox="0 0 1440 230"
        preserveAspectRatio="xMidYMax slice"
        className="absolute bottom-0 inset-x-0 w-full h-36 sm:h-48 block"
      >
        <path
          d="M0 190 Q 240 160 520 186 T 1020 178 T 1440 190 L 1440 230 L 0 230 Z"
          fill={driftFill}
        />
        <path
          d="M0 206 Q 360 184 720 202 T 1440 200 L 1440 230 L 0 230 Z"
          fill={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.86)'}
        />

        {/* Far-Left Tall Christmas Tree + Gifts */}
        <g transform="translate(56, 214)" opacity={isDark ? 0.85 : 0.78}>
          <rect x="-5" y="-14" width="10" height="18" rx="1.5" fill="#78350F" />
          <polygon points="0,-148 -38,-84 38,-84" fill={treeLight} />
          <polygon points="0,-148 -16,-120 16,-120" fill={snowCap} />
          <polygon points="0,-110 -48,-46 48,-46" fill={treeMid} />
          <polygon points="0,-110 -19,-84 19,-84" fill={snowCap} opacity="0.88" />
          <polygon points="0,-72 -58,-10 58,-10" fill={treeDark} />
          {/* Golden Garlands */}
          <path d="M-24 -76 Q 0 -64 24 -76" fill="none" stroke="#FBBF24" strokeWidth="1.6" opacity="0.85" />
          <path d="M-38 -36 Q 0 -22 38 -36" fill="none" stroke="#FBBF24" strokeWidth="1.8" opacity="0.85" />
          {/* Star Topper */}
          <path
            d="M0 -162 L3 -154 L11 -154 L4.5 -149 L7 -141 L0 -146 L-7 -141 L-4.5 -149 L-11 -154 L-3 -154 Z"
            fill="#FBBF24"
          />
          {/* Ornaments (Red, Gold, Green) */}
          <circle cx="-13" cy="-92" r="3" fill="#FDE047" className="xmas-light" />
          <circle cx="16" cy="-64" r="3" fill="#EF4444" className="xmas-light" style={{ animationDelay: '0.7s' }} />
          <circle cx="-22" cy="-34" r="3.2" fill="#FBBF24" className="xmas-light" style={{ animationDelay: '1.4s' }} />
          <circle cx="24" cy="-24" r="2.8" fill="#4ADE80" className="xmas-light" style={{ animationDelay: '0.4s' }} />
          {/* Gift Boxes at base */}
          <rect x="-26" y="-8" width="16" height="14" rx="2" fill="#DC2626" />
          <rect x="-20" y="-8" width="4" height="14" fill="#FBBF24" />
          <rect x="14" y="-6" width="14" height="12" rx="2" fill="#15803D" />
          <rect x="19" y="-6" width="4" height="12" fill="#FDE047" />
        </g>

        {/* Left Secondary Pine */}
        <g transform="translate(138, 218) scale(0.76)" opacity={isDark ? 0.72 : 0.65}>
          <rect x="-5" y="-14" width="10" height="18" rx="1.5" fill="#78350F" />
          <polygon points="0,-130 -35,-72 35,-72" fill={treeMid} />
          <polygon points="0,-130 -14,-106 14,-106" fill={snowCap} />
          <polygon points="0,-92 -46,-36 46,-36" fill={treeDark} />
          <polygon points="0,-58 -54,-8 54,-8" fill={treeDark} />
          <path d="M0 -140 L2.5 -134 L8 -134 L3.5 -130 L5 -124 L0 -128 L-5 -124 L-3.5 -130 L-8 -134 L-2.5 -134 Z" fill="#FBBF24" />
          <circle cx="-11" cy="-58" r="2.8" fill="#FDE047" className="xmas-light" style={{ animationDelay: '1s' }} />
          <circle cx="15" cy="-28" r="2.8" fill="#EF4444" className="xmas-light" style={{ animationDelay: '1.8s' }} />
        </g>

        {/* Inner-Left Small Evergreen */}
        <g transform="translate(222, 222) scale(0.54)" opacity={isDark ? 0.56 : 0.52}>
          <rect x="-4" y="-12" width="8" height="14" fill="#78350F" />
          <polygon points="0,-118 -32,-62 32,-62" fill={treeLight} />
          <polygon points="0,-118 -13,-96 13,-96" fill={snowCap} />
          <polygon points="0,-82 -44,-22 44,-22" fill={treeMid} />
          <circle cx="8" cy="-42" r="2.8" fill="#FBBF24" className="xmas-light" style={{ animationDelay: '0.5s' }} />
          <circle cx="-12" cy="-26" r="2.8" fill="#EF4444" className="xmas-light" style={{ animationDelay: '1.2s' }} />
        </g>

        {/* Inner-Right Small Evergreen */}
        <g transform="translate(1218, 222) scale(0.56)" opacity={isDark ? 0.56 : 0.52}>
          <rect x="-4" y="-12" width="8" height="14" fill="#78350F" />
          <polygon points="0,-118 -32,-62 32,-62" fill={treeLight} />
          <polygon points="0,-118 -13,-96 13,-96" fill={snowCap} />
          <polygon points="0,-82 -44,-22 44,-22" fill={treeMid} />
          <circle cx="-8" cy="-44" r="2.8" fill="#FBBF24" className="xmas-light" style={{ animationDelay: '0.9s' }} />
          <circle cx="14" cy="-26" r="2.8" fill="#EF4444" className="xmas-light" style={{ animationDelay: '1.6s' }} />
        </g>

        {/* Right Secondary Pine */}
        <g transform="translate(1300, 218) scale(0.78)" opacity={isDark ? 0.72 : 0.65}>
          <rect x="-5" y="-14" width="10" height="18" rx="1.5" fill="#78350F" />
          <polygon points="0,-130 -35,-72 35,-72" fill={treeMid} />
          <polygon points="0,-130 -14,-106 14,-106" fill={snowCap} />
          <polygon points="0,-92 -46,-36 46,-36" fill={treeDark} />
          <polygon points="0,-58 -54,-8 54,-8" fill={treeDark} />
          <path d="M0 -140 L2.5 -134 L8 -134 L3.5 -130 L5 -124 L0 -128 L-5 -124 L-3.5 -130 L-8 -134 L-2.5 -134 Z" fill="#FBBF24" />
          <circle cx="10" cy="-56" r="2.8" fill="#FDE047" className="xmas-light" style={{ animationDelay: '0.6s' }} />
          <circle cx="-15" cy="-26" r="2.8" fill="#EF4444" className="xmas-light" style={{ animationDelay: '1.5s' }} />
        </g>

        {/* Far-Right Tall Christmas Tree + Gifts */}
        <g transform="translate(1384, 214)" opacity={isDark ? 0.85 : 0.78}>
          <rect x="-5" y="-14" width="10" height="18" rx="1.5" fill="#78350F" />
          <polygon points="0,-150 -38,-85 38,-85" fill={treeLight} />
          <polygon points="0,-150 -16,-122 16,-122" fill={snowCap} />
          <polygon points="0,-112 -48,-47 48,-47" fill={treeMid} />
          <polygon points="0,-112 -19,-85 19,-85" fill={snowCap} opacity="0.88" />
          <polygon points="0,-74 -58,-10 58,-10" fill={treeDark} />
          <path d="M-24 -78 Q 0 -66 24 -78" fill="none" stroke="#FBBF24" strokeWidth="1.6" opacity="0.85" />
          <path d="M-38 -38 Q 0 -24 38 -38" fill="none" stroke="#FBBF24" strokeWidth="1.8" opacity="0.85" />
          <path
            d="M0 -164 L3 -156 L11 -156 L4.5 -151 L7 -143 L0 -148 L-7 -143 L-4.5 -151 L-11 -156 L-3 -156 Z"
            fill="#FBBF24"
          />
          <circle cx="12" cy="-94" r="3" fill="#FDE047" className="xmas-light" style={{ animationDelay: '0.5s' }} />
          <circle cx="-16" cy="-64" r="3" fill="#EF4444" className="xmas-light" style={{ animationDelay: '1.2s' }} />
          <circle cx="22" cy="-34" r="3.2" fill="#FBBF24" className="xmas-light" style={{ animationDelay: '1.7s' }} />
          <circle cx="-24" cy="-24" r="2.8" fill="#4ADE80" className="xmas-light" style={{ animationDelay: '0.9s' }} />
          <rect x="10" y="-8" width="16" height="14" rx="2" fill="#DC2626" />
          <rect x="16" y="-8" width="4" height="14" fill="#FBBF24" />
          <rect x="-26" y="-6" width="14" height="12" rx="2" fill="#15803D" />
          <rect x="-21" y="-6" width="4" height="12" fill="#FDE047" />
        </g>
      </svg>
    </div>
  );
};
