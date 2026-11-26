import type { AppConfig, CustomCopy } from '../types';
import { DEFAULT_PRACTICES, DEFAULT_QUOTES } from './defaultSpiritualContent';

export const DEFAULT_COPY: CustomCopy = {
  ar: {
    familyName: 'أسرة القديس أغسطينوس للشباب الجامعي والخريجين',
    heroTitle: 'يلا نجهز',
    heroSubtitle: 'الأناجيل الأربعة في رحلة يومية. كل يوم خطوة، وقلوبنا بتستعد.',
    heartProgressCaption: 'تسير السيدة العذراء والقديس يوسف خطوة بخطوة نحو بيت لحم حتى الميلاد',
    pwaTitle: 'ثبّت التطبيق على جهازك',
    pwaDesc: 'يفتح بسرعة ويشتغل أوفلاين بدون إنترنت',
    pwaInstallBtn: 'تثبيت',
    progressTitle: 'تقدّم القراءة',
    streakTitle: 'الاستمرارية والالتزام',
    streakLabel: 'أيام ورا بعض',
    completedDaysLabel: 'يوم خلصته',
    gospelSectionTitle: 'قراءة الأناجيل الأربعة',
    gospelEditionLabel: 'الطبعة البيروتية (ترجمة سميث وفاندايك)',
    markReadBtn: 'تمّت القراءة',
    markReadDoneBtn: 'تمّت قراءة اليوم',
    quoteSectionTitle: 'قول اليوم من أقوال الآباء',
    practicesSectionTitle: 'تداريب الأسبوع',
    encouragementMsg: 'عاش! خطوة جديدة بتقرّب قلبك من كلمة ربنا.',
    authWelcomeTitle: 'أهلاً بك في رحلة الصوم',
    authWelcomeSubtitle: 'سجّل بالاسم ثلاثي وكلمة مرور من ٤ أرقام لحفظ تقدّمك اليومي.',
  },
  en: {
    familyName: 'St. Augustine Fellowship for University Youth & Graduates',
    heroTitle: 'Yalla Negahaz',
    heroSubtitle: 'The Four Gospels in a daily journey. One step each day, preparing our hearts.',
    heartProgressCaption: 'St. Mary and St. Joseph walk step by step toward Bethlehem until Nativity',
    pwaTitle: 'Install the App on Your Device',
    pwaDesc: 'Opens fast and works offline without internet',
    pwaInstallBtn: 'Install',
    progressTitle: 'Reading Progress',
    streakTitle: 'Consistency & Streak',
    streakLabel: 'Day Streak',
    completedDaysLabel: 'Days Completed',
    gospelSectionTitle: 'Four Gospels Reading',
    gospelEditionLabel: 'Holy Gospel · Classic Translation',
    markReadBtn: 'Mark as Read',
    markReadDoneBtn: 'Completed Today',
    quoteSectionTitle: 'Patristic Quote of the Day',
    practicesSectionTitle: 'Weekly Spiritual Practices',
    encouragementMsg: 'Well done! Another faithful step drawing closer to His Word.',
    authWelcomeTitle: 'Welcome to the Lenten Journey',
    authWelcomeSubtitle: 'Sign in with your full triple name and a 4-digit PIN to save your progress.',
  },
};

function getDefaultLentStartDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const DEFAULT_CONFIG: AppConfig = {
  logoDataUrl: null,
  accentColor: '#DC2626',
  lightCanvasColor: '#FAF7F4',
  darkCanvasColor: '#181214',
  radiusPreset: 'soft',
  cardStyle: 'bordered',
  heroIcon: 'heart',
  heroIconSize: 'md',
  progressStyle: 'journey',
  lentStartDate: getDefaultLentStartDate(),
  lentEndDate: '2027-01-06',
  sequentialLock: true,
  adminPinEnabled: true,
  adminPin: '2027',
  copy: DEFAULT_COPY,
  quotes: DEFAULT_QUOTES,
  practices: DEFAULT_PRACTICES,
};
