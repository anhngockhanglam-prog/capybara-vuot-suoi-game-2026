import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { generateWeeklyStageForIndex } from './stages';
import { getCurrentWeekIndex, getWeekId, getWeekLabel } from './tournament';
import {
  CapybaraAppearance,
  Difficulty,
  GlobalLeaderboardEntry,
  WeeklyTournamentBadgeId,
  WeeklyTournamentClaim,
  WeeklyTournamentEntry,
  YuzuGift,
} from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutGoogle(): Promise<void> {
  await signOut(auth);
}

export function subscribeTopLeaderboard(
  onData: (entries: GlobalLeaderboardEntry[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'leaderboard';
  const q = query(
    collection(db, path),
    where('score', '>=', 0),
    orderBy('score', 'desc'),
    limit(10)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: GlobalLeaderboardEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          uid: String(data.uid ?? d.id),
          playerName: String(data.playerName ?? 'Capybara'),
          score: Number(data.score ?? 0),
          difficulty: (data.difficulty as Difficulty) ?? 'normal',
          distanceMeters: Number(data.distanceMeters ?? 0),
          fur: (data.fur as CapybaraAppearance['fur']) ?? 'classic',
          head: (data.head as CapybaraAppearance['head']) ?? 'none',
          neck: (data.neck as CapybaraAppearance['neck']) ?? 'none',
        };
      });
      onData(entries);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function fetchPersonalLeaderboardEntry(
  uid: string
): Promise<GlobalLeaderboardEntry | null> {
  const path = `leaderboard/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'leaderboard', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid: String(data.uid ?? uid),
      playerName: String(data.playerName ?? 'Capybara'),
      score: Number(data.score ?? 0),
      difficulty: (data.difficulty as Difficulty) ?? 'normal',
      distanceMeters: Number(data.distanceMeters ?? 0),
      fur: (data.fur as CapybaraAppearance['fur']) ?? 'classic',
      head: (data.head as CapybaraAppearance['head']) ?? 'none',
      neck: (data.neck as CapybaraAppearance['neck']) ?? 'none',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function submitLeaderboardScore(params: {
  user: User;
  playerName: string;
  score: number;
  difficulty: Difficulty;
  distanceMeters: number;
  appearance: CapybaraAppearance;
}): Promise<{ status: 'created' | 'updated' | 'kept_best'; bestScore: number }> {
  const { user, playerName, score, difficulty, distanceMeters, appearance } = params;
  const safeName = (playerName.trim() || user.displayName?.trim() || 'Capybara').slice(0, 24);
  const safeScore = Math.max(0, Math.min(10000000, Math.floor(score)));
  const safeDistance = Math.max(0, Math.min(1000000, Math.floor(distanceMeters)));

  const docRef = doc(db, 'leaderboard', user.uid);
  const path = `leaderboard/${user.uid}`;

  let existingSnap;
  try {
    existingSnap = await getDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!existingSnap.exists()) {
    try {
      await setDoc(docRef, {
        uid: user.uid,
        playerName: safeName,
        score: safeScore,
        difficulty,
        distanceMeters: safeDistance,
        fur: appearance.fur,
        head: appearance.head,
        neck: appearance.neck,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { status: 'created', bestScore: safeScore };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  const prevScore = Number(existingSnap.data().score ?? 0);
  if (safeScore <= prevScore) {
    return { status: 'kept_best', bestScore: prevScore };
  }

  try {
    await updateDoc(docRef, {
      playerName: safeName,
      score: safeScore,
      difficulty,
      distanceMeters: safeDistance,
      fur: appearance.fur,
      head: appearance.head,
      neck: appearance.neck,
      updatedAt: serverTimestamp(),
    });
    return { status: 'updated', bestScore: safeScore };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export const YUZU_GIFT_AMOUNT = 15;

export function getUtcDayBucket(): number {
  return Math.floor(Date.now() / 86400000);
}

function mapGiftDoc(id: string, data: Record<string, unknown>): YuzuGift {
  const created = data.createdAt;
  const createdAtMs =
    created instanceof Timestamp ? created.toMillis() : undefined;
  return {
    id,
    senderUid: String(data.senderUid ?? ''),
    senderName: String(data.senderName ?? 'Bạn bè'),
    recipientUid: String(data.recipientUid ?? ''),
    recipientName: String(data.recipientName ?? 'Capybara'),
    message: String(data.message ?? ''),
    yuzuAmount: Number(data.yuzuAmount ?? YUZU_GIFT_AMOUNT),
    dayBucket: Number(data.dayBucket ?? 0),
    claimed: Boolean(data.claimed),
    createdAtMs,
  };
}

export async function fetchTodaySentGift(uid: string): Promise<YuzuGift | null> {
  const path = 'yuzu_gifts';
  const dayBucket = getUtcDayBucket();
  try {
    const q = query(
      collection(db, path),
      where('senderUid', '==', uid),
      where('dayBucket', '==', dayBucket),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return mapGiftDoc(d.id, d.data() as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeIncomingGifts(
  uid: string,
  onData: (gifts: YuzuGift[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'yuzu_gifts';
  const q = query(
    collection(db, path),
    where('recipientUid', '==', uid),
    where('claimed', '==', false)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const gifts = snapshot.docs
        .map((d) => mapGiftDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
      onData(gifts);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function sendYuzuGift(params: {
  senderUser: User;
  senderName: string;
  recipientUid: string;
  recipientName: string;
  message: string;
}): Promise<YuzuGift> {
  const { senderUser, senderName, recipientUid, recipientName, message } = params;
  const dayBucket = getUtcDayBucket();
  const giftId = `${senderUser.uid}_${dayBucket}`;
  const path = `yuzu_gifts/${giftId}`;

  const safeSenderName = (
    senderName.trim() ||
    senderUser.displayName?.trim() ||
    'Capybara'
  ).slice(0, 24);
  const safeRecipientName = (recipientName.trim() || 'Capybara').slice(0, 24);
  const safeMessage = message.trim().slice(0, 60);

  try {
    await setDoc(doc(db, 'yuzu_gifts', giftId), {
      senderUid: senderUser.uid,
      senderName: safeSenderName,
      recipientUid,
      recipientName: safeRecipientName,
      message: safeMessage,
      yuzuAmount: YUZU_GIFT_AMOUNT,
      dayBucket,
      claimed: false,
      createdAt: serverTimestamp(),
    });
    return {
      id: giftId,
      senderUid: senderUser.uid,
      senderName: safeSenderName,
      recipientUid,
      recipientName: safeRecipientName,
      message: safeMessage,
      yuzuAmount: YUZU_GIFT_AMOUNT,
      dayBucket,
      claimed: false,
      createdAtMs: Date.now(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function claimYuzuGift(giftId: string): Promise<void> {
  const path = `yuzu_gifts/${giftId}`;
  try {
    await updateDoc(doc(db, 'yuzu_gifts', giftId), {
      claimed: true,
      claimedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

function mapWeeklyEntryDoc(
  uid: string,
  weekId: string,
  weekIndex: number,
  data: Record<string, unknown>
): WeeklyTournamentEntry {
  return {
    uid: String(data.uid ?? uid),
    weekId: String(data.weekId ?? weekId),
    weekIndex: Number(data.weekIndex ?? weekIndex),
    playerName: String(data.playerName ?? 'Capybara'),
    score: Number(data.score ?? 0),
    distanceMeters: Number(data.distanceMeters ?? 0),
    bossesDefeated: Number(data.bossesDefeated ?? 0),
    fur: (data.fur as CapybaraAppearance['fur']) ?? 'classic',
    head: (data.head as CapybaraAppearance['head']) ?? 'none',
    neck: (data.neck as CapybaraAppearance['neck']) ?? 'none',
    runsCount: Number(data.runsCount ?? 1),
  };
}

export function subscribeWeeklyLeaderboard(
  weekIndex: number,
  onData: (entries: WeeklyTournamentEntry[]) => void,
  onError: (err: Error) => void
): () => void {
  const weekId = getWeekId(weekIndex);
  const path = `weekly_tournaments/${weekId}/entries`;
  const q = query(
    collection(db, 'weekly_tournaments', weekId, 'entries'),
    where('score', '>=', 0),
    orderBy('score', 'desc'),
    limit(20)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs.map((d) =>
        mapWeeklyEntryDoc(d.id, weekId, weekIndex, d.data() as Record<string, unknown>)
      );
      onData(entries);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function fetchWeeklyLeaderboardOnce(
  weekIndex: number
): Promise<WeeklyTournamentEntry[]> {
  const weekId = getWeekId(weekIndex);
  const path = `weekly_tournaments/${weekId}/entries`;
  try {
    const q = query(
      collection(db, 'weekly_tournaments', weekId, 'entries'),
      where('score', '>=', 0),
      orderBy('score', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
      mapWeeklyEntryDoc(d.id, weekId, weekIndex, d.data() as Record<string, unknown>)
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchWeeklyEntry(
  weekIndex: number,
  uid: string
): Promise<WeeklyTournamentEntry | null> {
  const weekId = getWeekId(weekIndex);
  const path = `weekly_tournaments/${weekId}/entries/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'weekly_tournaments', weekId, 'entries', uid));
    if (!snap.exists()) return null;
    return mapWeeklyEntryDoc(uid, weekId, weekIndex, snap.data() as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function submitWeeklyTournamentScore(params: {
  user: User;
  playerName: string;
  score: number;
  distanceMeters: number;
  bossesDefeated: number;
  appearance: CapybaraAppearance;
}): Promise<{ status: 'created' | 'updated' | 'kept_best'; bestScore: number; weekIndex: number }> {
  const { user, playerName, score, distanceMeters, bossesDefeated, appearance } = params;
  const weekIndex = getCurrentWeekIndex();
  const weekId = getWeekId(weekIndex);
  const seasonRef = doc(db, 'weekly_tournaments', weekId);
  const seasonPath = `weekly_tournaments/${weekId}`;

  const safeName = (playerName.trim() || user.displayName?.trim() || 'Capybara').slice(0, 24);
  const safeScore = Math.max(0, Math.min(10000000, Math.floor(score)));
  const safeDistance = Math.max(0, Math.min(1000000, Math.floor(distanceMeters)));
  const safeBosses = Math.max(0, Math.min(500, Math.floor(bossesDefeated)));

  try {
    const seasonSnap = await getDoc(seasonRef);
    if (!seasonSnap.exists()) {
      const stage = generateWeeklyStageForIndex(weekIndex);
      try {
        await setDoc(seasonRef, {
          weekId,
          weekIndex,
          weekLabel: getWeekLabel(weekIndex).slice(0, 48),
          biome: stage.biome,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
        });
      } catch (seasonWriteErr) {
        // Another participant may have created the season doc concurrently
        const retrySnap = await getDoc(seasonRef);
        if (!retrySnap.exists()) {
          throw seasonWriteErr;
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, seasonPath);
  }

  const entryRef = doc(db, 'weekly_tournaments', weekId, 'entries', user.uid);
  const entryPath = `weekly_tournaments/${weekId}/entries/${user.uid}`;

  let existingSnap;
  try {
    existingSnap = await getDoc(entryRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, entryPath);
  }

  if (!existingSnap.exists()) {
    try {
      await setDoc(entryRef, {
        uid: user.uid,
        weekId,
        weekIndex,
        playerName: safeName,
        score: safeScore,
        distanceMeters: safeDistance,
        bossesDefeated: safeBosses,
        fur: appearance.fur,
        head: appearance.head,
        neck: appearance.neck,
        runsCount: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { status: 'created', bestScore: safeScore, weekIndex };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, entryPath);
    }
  }

  const prevData = existingSnap.data();
  const prevScore = Number(prevData.score ?? 0);
  const prevDist = Number(prevData.distanceMeters ?? 0);
  const prevBosses = Number(prevData.bossesDefeated ?? 0);
  const prevRuns = Number(prevData.runsCount ?? 1);

  const bestScore = Math.max(prevScore, safeScore);
  const bestDistance = Math.max(prevDist, safeDistance);
  const bestBosses = Math.max(prevBosses, safeBosses);

  try {
    await updateDoc(entryRef, {
      playerName: safeName,
      score: bestScore,
      distanceMeters: bestDistance,
      bossesDefeated: bestBosses,
      fur: appearance.fur,
      head: appearance.head,
      neck: appearance.neck,
      runsCount: Math.min(10000, prevRuns + 1),
      updatedAt: serverTimestamp(),
    });
    return {
      status: safeScore > prevScore ? 'updated' : 'kept_best',
      bestScore,
      weekIndex,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, entryPath);
  }
}

export async function fetchUserWeeklyClaims(uid: string): Promise<WeeklyTournamentClaim[]> {
  const path = 'weekly_tournament_claims';
  try {
    const q = query(collection(db, path), where('uid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      const claimed = data.claimedAt;
      return {
        id: d.id,
        uid: String(data.uid ?? uid),
        weekId: String(data.weekId ?? ''),
        weekIndex: Number(data.weekIndex ?? 0),
        claimType: (data.claimType as 'final_rank' | 'qualifier') ?? 'final_rank',
        rank: Number(data.rank ?? 1),
        rewardYuzu: Number(data.rewardYuzu ?? 50),
        badgeId: (data.badgeId as WeeklyTournamentBadgeId) ?? 'weekly_participant',
        badgeTitle: String(data.badgeTitle ?? 'Huy hiệu Chiến Binh Tuần'),
        claimedAtMs: claimed instanceof Timestamp ? claimed.toMillis() : undefined,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function claimWeeklyTournamentReward(params: {
  user: User;
  weekIndex: number;
  claimType: 'final_rank' | 'qualifier';
  rank: number;
  rewardYuzu: number;
  badgeId: WeeklyTournamentBadgeId;
  badgeTitle: string;
}): Promise<WeeklyTournamentClaim> {
  const { user, weekIndex, claimType, rank, rewardYuzu, badgeId, badgeTitle } = params;
  const weekId = getWeekId(weekIndex);
  const claimId = claimType === 'qualifier' ? `${weekId}_q_${user.uid}` : `${weekId}_${user.uid}`;
  const path = `weekly_tournament_claims/${claimId}`;

  try {
    await setDoc(doc(db, 'weekly_tournament_claims', claimId), {
      uid: user.uid,
      weekId,
      weekIndex,
      claimType,
      rank: Math.max(1, Math.floor(rank)),
      rewardYuzu,
      badgeId,
      badgeTitle: badgeTitle.slice(0, 48),
      claimedAt: serverTimestamp(),
    });
    return {
      id: claimId,
      uid: user.uid,
      weekId,
      weekIndex,
      claimType,
      rank: Math.max(1, Math.floor(rank)),
      rewardYuzu,
      badgeId,
      badgeTitle,
      claimedAtMs: Date.now(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
