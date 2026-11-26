import React from 'react';
import { BookOpen, Flame, Heart, Star, Sun } from 'lucide-react';
import type { HeroIconKey } from '../types';

interface HeroSymbolProps {
  icon: HeroIconKey;
  className?: string;
  filled?: boolean;
}

export const HeroSymbol: React.FC<HeroSymbolProps> = ({ icon, className = 'w-6 h-6', filled = false }) => {
  switch (icon) {
    case 'heart':
      return (
        <Heart
          className={className}
          fill={filled ? 'currentColor' : 'none'}
          strokeWidth={filled ? 1.5 : 2}
        />
      );
    case 'cross':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M12 3v18" />
          <path d="M6 9h12" />
        </svg>
      );
    case 'star':
      return (
        <Star
          className={className}
          fill={filled ? 'currentColor' : 'none'}
          strokeWidth={filled ? 1.5 : 2}
        />
      );
    case 'flame':
      return (
        <Flame
          className={className}
          fill={filled ? 'currentColor' : 'none'}
          strokeWidth={filled ? 1.5 : 2}
        />
      );
    case 'book':
      return <BookOpen className={className} strokeWidth={2} />;
    case 'sun':
      return <Sun className={className} strokeWidth={2} />;
    default:
      return <Heart className={className} fill={filled ? 'currentColor' : 'none'} />;
  }
};
