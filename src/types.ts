export type Language = 'ar' | 'en';
export type ThemeMode = 'dark' | 'light';
export type GospelKey = 'matthew' | 'mark' | 'luke' | 'john';
export type HeroIconKey = 'heart' | 'cross' | 'star' | 'flame' | 'book' | 'sun';
export type RadiusPreset = 'sharp' | 'soft' | 'rounded';
export type CardStylePreset = 'bordered' | 'elevated' | 'flat';
export type HeroIconSize = 'sm' | 'md' | 'lg';
export type ProgressStyle = 'journey' | 'heart';
export type FontPreset = 'cairo' | 'tajawal' | 'almarai' | 'amiri' | 'rubik';

export interface GospelBook {
  nameAr: string;
  shortAr: string;
  nameEn: string;
  chapters: string[][];
}

export type GospelsDataset = Record<GospelKey, GospelBook>;

export interface ChapterRef {
  book: GospelKey;
  chapter: number; // 1-indexed
}

export interface ChapterQuestion {
  questionAr: string;
  optionsAr: string[];
  questionEn: string;
  optionsEn: string[];
  correctIndex: number;
}

export interface DayPlan {
  day: number; // 1..43
  week: number; // 1..7
  readings: ChapterRef[];
}

export interface FatherQuote {
  day: number; // 1..43
  textAr: string;
  textEn: string;
  saintAr: string;
  saintEn: string;
}

export interface WeeklyPractice {
  id: string;
  week: number; // 1..7
  textAr: string;
  textEn: string;
}

export interface CopyFields {
  familyName: string;
  heroTitle: string;
  heroSubtitle: string;
  heartProgressCaption: string;
  pwaTitle: string;
  pwaDesc: string;
  pwaInstallBtn: string;
  progressTitle: string;
  streakTitle: string;
  streakLabel: string;
  completedDaysLabel: string;
  gospelSectionTitle: string;
  gospelEditionLabel: string;
  markReadBtn: string;
  markReadDoneBtn: string;
  quoteSectionTitle: string;
  practicesSectionTitle: string;
  encouragementMsg: string;
  authWelcomeTitle: string;
  authWelcomeSubtitle: string;
}

export interface CustomCopy {
  ar: CopyFields;
  en: CopyFields;
}

export type ParticipantRole = 'member' | 'servant';

export interface CompetitionQuestion {
  id: string;
  questionAr: string;
  questionEn: string;
  optionsAr: string[];
  optionsEn: string[];
  correctIndex: number;
}

export interface CompetitionConfig {
  enabled: boolean;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  rewardAr?: string;
  rewardEn?: string;
  questions: CompetitionQuestion[];
}

export interface AppConfig {
  logoDataUrl: string | null;
  accentColor: string;
  lightCanvasColor: string;
  darkCanvasColor: string;
  lightTextColor?: string;
  darkTextColor?: string;
  fontPreset?: FontPreset;
  radiusPreset: RadiusPreset;
  cardStyle: CardStylePreset;
  heroIcon: HeroIconKey;
  heroIconSize: HeroIconSize;
  progressStyle?: ProgressStyle;
  journeyMigrated?: boolean;
  updatedAt?: number;
  lentStartDate: string; // YYYY-MM-DD (default 2026-11-25)
  lentEndDate: string; // YYYY-MM-DD (default 2027-01-06)
  startNov25Migrated?: boolean;
  sequentialLock: boolean;
  christmasTheme?: boolean;
  adminPinEnabled: boolean;
  adminPin: string;
  pin2027Migrated?: boolean;
  copy: CustomCopy;
  quotes: FatherQuote[];
  practices: WeeklyPractice[];
  competition?: CompetitionConfig;
}

export interface UserAccount {
  id: string;
  cloudId?: string;
  fullName: string;
  pin: string; // 4-digit ASCII string (local session convenience)
  pinHash?: string; // SHA-256 hex hash stored in Firestore
  role?: ParticipantRole;
  currentDay: number;
  completedDays: number[];
  passedChapters?: Record<string, boolean>;
  checkedPractices: Record<string, boolean>;
  competitionAnswers?: Record<string, number>;
  readerFontSize: number;
  planStartDate?: string; // YYYY-MM-DD when user joined
  createdAt: string;
  updatedAt?: number;
}

export interface AppState {
  lang: Language;
  theme: ThemeMode;
  activeUserId: string | null;
  users: Record<string, UserAccount>;
  pwaBannerDismissed: boolean;
  config: AppConfig;
}
