import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  buildReadingPlan,
  DEFAULT_COMPETITION_END_DATE,
  getChapterKey,
  getDayPlan,
  getDaysBetweenInclusive,
  getTodayDateString,
  TOTAL_GOSPEL_CHAPTERS,
} from './data/readingPlan';
import type { AppConfig, CompetitionConfig, ParticipantRole, UserAccount } from './types';
import { normalizeNameKey } from './utils/digits';

export const ADMIN_EMAIL = 'thomasgawdat3@gmail.com';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Connection health test required on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration (client offline).');
    }
  }
}
void testConnection();

export function isVerifiedAdminUser(user: FirebaseUser | null): boolean {
  if (!user) return false;
  return Boolean(
    user.emailVerified && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const bytes = Array.from(new Uint8Array(hashBuffer));
    return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback deterministic 64-char hex digest if subtle crypto unavailable
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < data.length; i++) {
    h1 ^= data[i];
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= data[i] + i;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const part = ((h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0')).repeat(4);
  return part.slice(0, 64);
}

export async function getParticipantDocId(nameKey: string): Promise<string> {
  const hash = await sha256Hex(`yalla_negahaz_user:${nameKey}`);
  return `p_${hash.slice(0, 32)}`;
}

export async function hashParticipantPin(nameKey: string, cleanPin: string): Promise<string> {
  return sha256Hex(`yalla_negahaz_pin:${nameKey}:${cleanPin}`);
}

export function subscribeAdminAuth(cb: (user: FirebaseUser | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, cb);
}

export async function signInDeveloperWithGoogle(): Promise<{
  ok: boolean;
  user?: FirebaseUser;
  errorCode?: string;
  errorMessage?: string;
}> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return { ok: true, user: cred.user };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || 'unknown';
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, errorCode: code, errorMessage: message };
  }
}

export async function signOutDeveloperGoogle(): Promise<void> {
  await signOut(auth);
}

export function subscribeAppConfig(
  onUpdate: (remote: Partial<AppConfig>) => void
): Unsubscribe {
  const ref = doc(db, 'app_config', 'main');
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as Record<string, unknown>;
      const remote: Partial<AppConfig> = {
        ...(data as Partial<AppConfig>),
        logoDataUrl:
          typeof data.logoDataUrl === 'string' && data.logoDataUrl.length > 0
            ? data.logoDataUrl
            : null,
      };
      onUpdate(remote);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'app_config/main');
    }
  );
}

function sanitizeCompetition(comp?: CompetitionConfig): CompetitionConfig {
  return {
    enabled: Boolean(comp?.enabled),
    titleAr: String(comp?.titleAr || 'مسابقة صوم الميلاد').slice(0, 160),
    titleEn: String(comp?.titleEn || 'Nativity Fast Competition').slice(0, 160),
    descriptionAr: String(
      comp?.descriptionAr || 'أجب عن أسئلة المسابقة التي يضعها خدام الأسرة.'
    ).slice(0, 600),
    descriptionEn: String(
      comp?.descriptionEn || 'Answer the fellowship competition questions prepared by the servants.'
    ).slice(0, 600),
    rewardAr: String(comp?.rewardAr || '').slice(0, 200),
    rewardEn: String(comp?.rewardEn || '').slice(0, 200),
    questions: (comp?.questions || []).slice(0, 60).map((q, idx) => ({
      id: String(q.id || `q_${idx + 1}`).slice(0, 64),
      questionAr: String(q.questionAr || '').slice(0, 300),
      questionEn: String(q.questionEn || '').slice(0, 300),
      optionsAr: (q.optionsAr || []).slice(0, 5).map((o) => String(o || '').slice(0, 160)),
      optionsEn: (q.optionsEn || []).slice(0, 5).map((o) => String(o || '').slice(0, 160)),
      correctIndex: Math.max(0, Math.min(4, Number(q.correctIndex) || 0)),
    })),
  };
}

export async function publishAppConfigToCloud(
  config: AppConfig
): Promise<{ ok: boolean; updatedAt?: number; error?: string }> {
  const currentUser = auth.currentUser;
  if (!isVerifiedAdminUser(currentUser)) {
    return { ok: false, error: 'not-admin-auth' };
  }

  const now = Date.now();
  const logoStr = typeof config.logoDataUrl === 'string' ? config.logoDataUrl : '';
  if (logoStr.length > 220000) {
    return { ok: false, error: 'logo-too-large' };
  }

  const payload = {
    logoDataUrl: logoStr,
    accentColor: config.accentColor || '#DC2626',
    lightCanvasColor: config.lightCanvasColor || '#FAF7F4',
    darkCanvasColor: config.darkCanvasColor || '#181214',
    radiusPreset: config.radiusPreset || 'soft',
    cardStyle: config.cardStyle || 'bordered',
    heroIcon: config.heroIcon || 'heart',
    heroIconSize: config.heroIconSize || 'md',
    progressStyle: config.progressStyle || 'journey',
    journeyMigrated: true,
    pin2027Migrated: true,
    lentStartDate: config.lentStartDate || getTodayDateString(),
    lentEndDate: config.lentEndDate || DEFAULT_COMPETITION_END_DATE,
    sequentialLock: Boolean(config.sequentialLock),
    christmasTheme: config.christmasTheme !== false,
    copy: config.copy,
    quotes: (config.quotes || []).slice(0, 60),
    practices: (config.practices || []).slice(0, 100),
    competition: sanitizeCompetition(config.competition),
    updatedAt: now,
    updatedBy: currentUser!.uid,
  };

  try {
    await setDoc(doc(db, 'app_config', 'main'), payload);
    return { ok: true, updatedAt: now };
  } catch (err) {
    const info = handleFirestoreError(err, OperationType.WRITE, 'app_config/main');
    return { ok: false, error: info.error };
  }
}

export async function publishServantContentToCloud(
  servantDocId: string,
  config: AppConfig
): Promise<{ ok: boolean; updatedAt?: number; error?: string }> {
  if (!servantDocId) {
    return { ok: false, error: 'missing-servant-id' };
  }
  const now = Date.now();
  const ref = doc(db, 'app_config', 'main');
  const patch = {
    quotes: (config.quotes || []).slice(0, 60),
    practices: (config.practices || []).slice(0, 100),
    competition: sanitizeCompetition(config.competition),
    lentStartDate: (config.lentStartDate || getTodayDateString()).slice(0, 20),
    lentEndDate: (config.lentEndDate || DEFAULT_COMPETITION_END_DATE).slice(0, 20),
    updatedAt: now,
    updatedBy: servantDocId.slice(0, 128),
  };

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return { ok: false, error: 'config-not-initialized' };
    }
    await updateDoc(ref, patch);
    return { ok: true, updatedAt: now };
  } catch (err) {
    const info = handleFirestoreError(err, OperationType.UPDATE, 'app_config/main');
    return { ok: false, error: info.error };
  }
}

function computeParticipantProgressFields(
  user: UserAccount,
  config: AppConfig
): { completedChapters: number; percent: number; streak: number } {
  const startDate = user.planStartDate || config.lentStartDate || getTodayDateString();
  const endDate = config.lentEndDate || DEFAULT_COMPETITION_END_DATE;
  const totalDays = getDaysBetweenInclusive(startDate, endDate);
  const plan = buildReadingPlan(totalDays);
  const completedSet = new Set(
    (user.completedDays || []).filter((d) => d >= 1 && d <= totalDays)
  );
  const completedChapterKeys = new Set<string>();
  for (const d of completedSet) {
    for (const ref of getDayPlan(d, plan).readings) {
      completedChapterKeys.add(getChapterKey(ref.book, ref.chapter));
    }
  }
  for (const [k, passed] of Object.entries(user.passedChapters || {})) {
    if (passed) completedChapterKeys.add(k);
  }
  const completedChaptersClamped = Math.min(
    TOTAL_GOSPEL_CHAPTERS,
    Math.max(0, completedChapterKeys.size)
  );
  const percent = Math.min(
    100,
    Math.max(0, Math.round((completedChaptersClamped / TOTAL_GOSPEL_CHAPTERS) * 100))
  );

  const sorted = [...completedSet].sort((a, b) => a - b);
  let streak = 0;
  if (sorted.length > 0) {
    let anchor = sorted[sorted.length - 1];
    if (completedSet.has(user.currentDay)) {
      anchor = user.currentDay;
    }
    let cursor = anchor;
    while (cursor >= 1 && completedSet.has(cursor)) {
      streak++;
      cursor--;
    }
  }

  return {
    completedChapters: completedChaptersClamped,
    percent,
    streak,
  };
}

export async function lookupParticipantInCloud(
  nameKey: string
): Promise<{
  exists: boolean;
  offlineOrError?: boolean;
  docId: string;
  data?: {
    id: string;
    fullName: string;
    pinHash: string;
    role?: ParticipantRole;
    currentDay: number;
    completedDays: number[];
    passedChapters: Record<string, boolean>;
    checkedPractices: Record<string, boolean>;
    competitionAnswers?: Record<string, number>;
    readerFontSize: number;
    planStartDate: string;
    createdAt: string;
    updatedAt: number;
  };
}> {
  const docId = await getParticipantDocId(nameKey);
  try {
    const snap = await getDoc(doc(db, 'participants', docId));
    if (!snap.exists()) {
      return { exists: false, docId };
    }
    return {
      exists: true,
      docId,
      data: snap.data() as {
        id: string;
        fullName: string;
        pinHash: string;
        role?: ParticipantRole;
        currentDay: number;
        completedDays: number[];
        passedChapters: Record<string, boolean>;
        checkedPractices: Record<string, boolean>;
        competitionAnswers?: Record<string, number>;
        readerFontSize: number;
        planStartDate: string;
        createdAt: string;
        updatedAt: number;
      },
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `participants/${docId}`);
    return { exists: false, offlineOrError: true, docId };
  }
}

function buildSummaryEntry(user: UserAccount, docId: string, config: AppConfig) {
  const metrics = computeParticipantProgressFields(user, config);
  return {
    id: docId,
    fullName: user.fullName.slice(0, 120),
    role: user.role === 'servant' ? 'servant' : 'member',
    currentDay: Math.max(1, Math.min(200, user.currentDay || 1)),
    completedDays: (user.completedDays || [])
      .filter((d) => typeof d === 'number' && Number.isFinite(d))
      .slice(0, 200),
    passedChapters: user.passedChapters || {},
    checkedPractices: user.checkedPractices || {},
    competitionAnswers: user.competitionAnswers || {},
    planStartDate: (user.planStartDate || getTodayDateString()).slice(0, 20),
    completedChapters: metrics.completedChapters,
    percent: metrics.percent,
    streak: metrics.streak,
    createdAt: (user.createdAt || new Date().toISOString()).slice(0, 40),
    updatedAt: user.updatedAt || Date.now(),
  };
}

export async function upsertParticipantSummaryInCloud(
  user: UserAccount,
  config: AppConfig
): Promise<void> {
  const nameKey = normalizeNameKey(user.fullName);
  const docId = user.cloudId || (await getParticipantDocId(nameKey));
  const summaryRef = doc(db, 'participants_summary', 'main');
  const entry = buildSummaryEntry(user, docId, config);
  const now = Date.now();
  try {
    const snap = await getDoc(summaryRef);
    if (!snap.exists()) {
      await setDoc(summaryRef, {
        entries: { [docId]: entry },
        updatedAt: now,
      });
    } else {
      await updateDoc(summaryRef, {
        [`entries.${docId}`]: entry,
        updatedAt: now,
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'participants_summary/main');
  }
}

export async function backfillParticipantsSummaryInCloud(
  users: UserAccount[],
  config: AppConfig
): Promise<void> {
  if (users.length === 0) return;
  const summaryRef = doc(db, 'participants_summary', 'main');
  try {
    const snap = await getDoc(summaryRef);
    const existingEntries = snap.exists()
      ? ((snap.data()?.entries as Record<string, Record<string, unknown>>) || {})
      : {};
    let changed = false;
    const nextEntries: Record<string, Record<string, unknown>> = { ...existingEntries };

    for (const u of users) {
      const nameKey = normalizeNameKey(u.fullName);
      const docId = u.cloudId || (await getParticipantDocId(nameKey));
      const prev = existingEntries[docId];
      const prevTs = typeof prev?.updatedAt === 'number' ? prev.updatedAt : 0;
      const curTs = u.updatedAt || 0;
      if (!prev || curTs > prevTs || prev.role !== (u.role || 'member')) {
        nextEntries[docId] = buildSummaryEntry(u, docId, config);
        changed = true;
      }
    }

    if (changed || !snap.exists()) {
      await setDoc(summaryRef, {
        entries: nextEntries,
        updatedAt: Date.now(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'participants_summary/main');
  }
}

export async function createParticipantInCloud(
  user: UserAccount,
  pinHash: string,
  config: AppConfig
): Promise<boolean> {
  const nameKey = normalizeNameKey(user.fullName);
  const docId = user.cloudId || (await getParticipantDocId(nameKey));
  const metrics = computeParticipantProgressFields(user, config);
  const now = Date.now();
  const payload = {
    id: docId,
    fullName: user.fullName.slice(0, 120),
    pinHash,
    role: 'member' as const,
    currentDay: Math.max(1, Math.min(200, user.currentDay || 1)),
    completedDays: (user.completedDays || [])
      .filter((d) => typeof d === 'number' && Number.isFinite(d))
      .slice(0, 200),
    passedChapters: user.passedChapters || {},
    checkedPractices: user.checkedPractices || {},
    competitionAnswers: user.competitionAnswers || {},
    readerFontSize: Math.max(12, Math.min(40, user.readerFontSize || 21)),
    planStartDate: (user.planStartDate || getTodayDateString()).slice(0, 20),
    completedChapters: metrics.completedChapters,
    percent: metrics.percent,
    streak: metrics.streak,
    createdAt: (user.createdAt || new Date().toISOString()).slice(0, 40),
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'participants', docId), payload);
    void upsertParticipantSummaryInCloud({ ...user, cloudId: docId, role: 'member', updatedAt: now }, config);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `participants/${docId}`);
    return false;
  }
}

export async function syncParticipantProgressToCloud(
  user: UserAccount,
  config: AppConfig
): Promise<void> {
  const nameKey = normalizeNameKey(user.fullName);
  const docId = user.cloudId || (await getParticipantDocId(nameKey));
  const ref = doc(db, 'participants', docId);
  const metrics = computeParticipantProgressFields(user, config);
  const now = Date.now();

  try {
    const existingSnap = await getDoc(ref);
    if (!existingSnap.exists()) {
      const pinHash =
        user.pinHash || (user.pin ? await hashParticipantPin(nameKey, user.pin) : '');
      if (!pinHash) return;
      await createParticipantInCloud(user, pinHash, config);
      return;
    }

    const existingData = existingSnap.data() as {
      completedDays?: unknown[];
      planStartDate?: string;
    };
    const existingCompletedCount = Array.isArray(existingData?.completedDays)
      ? existingData.completedDays.length
      : 0;

    const updatePayload: Record<string, unknown> = {
      currentDay: Math.max(1, Math.min(200, user.currentDay || 1)),
      completedDays: (user.completedDays || [])
        .filter((d) => typeof d === 'number' && Number.isFinite(d))
        .slice(0, 200),
      passedChapters: user.passedChapters || {},
      checkedPractices: user.checkedPractices || {},
      competitionAnswers: user.competitionAnswers || {},
      readerFontSize: Math.max(12, Math.min(40, user.readerFontSize || 21)),
      completedChapters: metrics.completedChapters,
      percent: metrics.percent,
      streak: metrics.streak,
      updatedAt: now,
    };

    if (
      existingCompletedCount === 0 &&
      (user.completedDays || []).length === 0 &&
      user.planStartDate &&
      existingData?.planStartDate !== user.planStartDate
    ) {
      updatePayload.planStartDate = user.planStartDate.slice(0, 20);
    }

    await updateDoc(ref, updatePayload);
    void upsertParticipantSummaryInCloud({ ...user, cloudId: docId, updatedAt: now }, config);
  } catch (err: unknown) {
    handleFirestoreError(err, OperationType.UPDATE, `participants/${docId}`);
  }
}

export async function promoteParticipantRoleInCloud(
  user: UserAccount,
  nextRole: ParticipantRole,
  config: AppConfig
): Promise<{ ok: boolean; error?: string }> {
  const currentUser = auth.currentUser;
  if (!isVerifiedAdminUser(currentUser)) {
    return { ok: false, error: 'not-admin-auth' };
  }
  const nameKey = normalizeNameKey(user.fullName);
  const docId = user.cloudId || (await getParticipantDocId(nameKey));
  const ref = doc(db, 'participants', docId);
  const now = Date.now();

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const pinHash =
        user.pinHash || (user.pin ? await hashParticipantPin(nameKey, user.pin) : '');
      if (!pinHash) return { ok: false, error: 'missing-pin-hash' };
      const metrics = computeParticipantProgressFields(user, config);
      await setDoc(ref, {
        id: docId,
        fullName: user.fullName.slice(0, 120),
        pinHash,
        role: nextRole,
        currentDay: Math.max(1, Math.min(200, user.currentDay || 1)),
        completedDays: (user.completedDays || []).slice(0, 200),
        passedChapters: user.passedChapters || {},
        checkedPractices: user.checkedPractices || {},
        competitionAnswers: user.competitionAnswers || {},
        readerFontSize: Math.max(12, Math.min(40, user.readerFontSize || 21)),
        planStartDate: (user.planStartDate || getTodayDateString()).slice(0, 20),
        completedChapters: metrics.completedChapters,
        percent: metrics.percent,
        streak: metrics.streak,
        createdAt: (user.createdAt || new Date().toISOString()).slice(0, 40),
        updatedAt: now,
      });
    } else {
      await updateDoc(ref, {
        role: nextRole,
        updatedAt: now,
      });
    }
    await upsertParticipantSummaryInCloud(
      { ...user, cloudId: docId, role: nextRole, updatedAt: now },
      config
    );
    return { ok: true };
  } catch (err) {
    const info = handleFirestoreError(err, OperationType.UPDATE, `participants/${docId}`);
    return { ok: false, error: info.error };
  }
}

export function subscribeParticipantSelf(
  docId: string,
  onUpdate: (patch: { role: ParticipantRole }) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'participants', docId),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as Record<string, unknown>;
      const role: ParticipantRole = data.role === 'servant' ? 'servant' : 'member';
      onUpdate({ role });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `participants/${docId}`);
    }
  );
}

function mapParticipantDoc(id: string, data: Record<string, unknown>): UserAccount {
  const fullName = String(data.fullName || '');
  return {
    id: normalizeNameKey(fullName) || id,
    cloudId: id,
    fullName,
    pin: '',
    pinHash: typeof data.pinHash === 'string' ? data.pinHash : undefined,
    role: data.role === 'servant' ? 'servant' : 'member',
    currentDay: typeof data.currentDay === 'number' ? data.currentDay : 1,
    completedDays: Array.isArray(data.completedDays)
      ? (data.completedDays as number[])
      : [],
    passedChapters:
      data.passedChapters && typeof data.passedChapters === 'object'
        ? (data.passedChapters as Record<string, boolean>)
        : {},
    checkedPractices:
      data.checkedPractices && typeof data.checkedPractices === 'object'
        ? (data.checkedPractices as Record<string, boolean>)
        : {},
    competitionAnswers:
      data.competitionAnswers && typeof data.competitionAnswers === 'object'
        ? (data.competitionAnswers as Record<string, number>)
        : {},
    readerFontSize:
      typeof data.readerFontSize === 'number' ? data.readerFontSize : 21,
    planStartDate:
      typeof data.planStartDate === 'string' ? data.planStartDate : undefined,
    createdAt:
      typeof data.createdAt === 'string'
        ? data.createdAt
        : new Date().toISOString(),
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : undefined,
  };
}

export function subscribeAllParticipants(
  onUsers: (users: UserAccount[]) => void
): Unsubscribe {
  const colRef = collection(db, 'participants');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: UserAccount[] = snapshot.docs.map((d) =>
        mapParticipantDoc(d.id, d.data() as Record<string, unknown>)
      );
      onUsers(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'participants');
    }
  );
}

export async function fetchAllParticipantsOnce(): Promise<{
  ok: boolean;
  users: UserAccount[];
}> {
  try {
    const snapshot = await getDocs(collection(db, 'participants'));
    const list: UserAccount[] = snapshot.docs.map((d) =>
      mapParticipantDoc(d.id, d.data() as Record<string, unknown>)
    );
    return { ok: true, users: list };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'participants');
    return { ok: false, users: [] };
  }
}

export function subscribeParticipantsSummary(
  onUsers: (users: UserAccount[]) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'participants_summary', 'main'),
    (snap) => {
      if (!snap.exists()) {
        onUsers([]);
        return;
      }
      const entries = (snap.data()?.entries as Record<string, Record<string, unknown>>) || {};
      const list = Object.entries(entries).map(([docId, entry]) =>
        mapParticipantDoc(docId, entry)
      );
      onUsers(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'participants_summary/main');
    }
  );
}

export async function fetchParticipantsSummaryOnce(): Promise<{
  ok: boolean;
  users: UserAccount[];
}> {
  try {
    const snap = await getDoc(doc(db, 'participants_summary', 'main'));
    if (!snap.exists()) return { ok: true, users: [] };
    const entries = (snap.data()?.entries as Record<string, Record<string, unknown>>) || {};
    const list = Object.entries(entries).map(([docId, entry]) =>
      mapParticipantDoc(docId, entry)
    );
    return { ok: true, users: list };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'participants_summary/main');
    return { ok: false, users: [] };
  }
}
