import { onAuthStateChanged, User } from 'firebase/auth';
import { Camera, Check, CloudRain, Download, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CapybaraWorldHub } from './components/CapybaraWorldHub';
import { DailyQuestsPanel } from './components/DailyQuestsPanel';
import { GameCanvas } from './components/GameCanvas';
import { GameHud } from './components/GameHud';
import { GameOverOverlay } from './components/GameOverOverlay';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { MultiplayerView } from './components/MultiplayerView';
import { PauseOverlay } from './components/PauseOverlay';
import { TitleOverlay } from './components/TitleOverlay';
import { WeeklyTournamentPanel } from './components/WeeklyTournamentPanel';
import {
  auth,
  claimWeeklyTournamentReward,
  claimYuzuGift,
  fetchPersonalLeaderboardEntry,
  fetchTodaySentGift,
  fetchUserWeeklyClaims,
  fetchWeeklyEntry,
  fetchWeeklyLeaderboardOnce,
  sendYuzuGift,
  signInWithGoogle,
  signOutGoogle,
  submitLeaderboardScore,
  submitWeeklyTournamentScore,
  subscribeIncomingGifts,
  subscribeTopLeaderboard,
  subscribeWeeklyLeaderboard,
  YUZU_GIFT_AMOUNT,
} from './game/firebase';
import {
  ACHIEVEMENTS,
  applyRunToAchievementStats,
  isAchievementUnlocked,
} from './game/achievements';
import { musicEngine } from './game/music';
import { PET_OPTIONS } from './game/pets';
import { applyRunToQuests, ensureCurrentDailyQuests } from './game/quests';
import { BOSS_SKILLS } from './game/skills';
import {
  FUR_OPTIONS,
  HEAD_ACCESSORIES,
  MOUNT_OPTIONS,
  NECK_ACCESSORIES,
  OUTFIT_OPTIONS,
} from './game/skins';
import { soundEngine } from './game/sound';
import { generateNewStage, generateWeeklyStageForIndex } from './game/stages';
import { loadProgress, saveProgress } from './game/storage';
import {
  createTournamentBadgeRecord,
  getCurrentWeekIndex,
  getRewardForWeeklyRank,
  getTimeUntilWeeklyReset,
  getWeekId,
  WEEKLY_QUALIFIER_REWARD_YUZU,
} from './game/tournament';
import {
  CapybaraActivityId,
  CitizenId,
  CraftedItemId,
  CustomMap,
  Difficulty,
  EnvironmentalActionId,
  FestivalId,
  FoodId,
  FurColorId,
  GameState,
  GlobalLeaderboardEntry,
  HeadAccessoryId,
  HomeItemId,
  HudSnapshot,
  IngredientId,
  MountId,
  NeckAccessoryId,
  OutfitId,
  PetId,
  PhotoPose,
  PlayMode,
  RunSummary,
  SavedProgress,
  SideQuestId,
  SkillId,
  StageConfig,
  WeatherMode,
  WeeklyTournamentClaim,
  WeeklyTournamentEntry,
  YuzuGift,
} from './game/types';
import {
  getWeatherLabel,
  resolveActiveWeather,
  rollForecastWeather,
  WEATHER_CHARM_COST,
  WEATHER_OPTIONS,
} from './game/weather';
import {
  CAPYBARA_ACTIVITIES,
  CASTLE_TIERS,
  clampStat,
  CRAFTING_RECIPES,
  createDefaultSideQuests,
  ENVIRONMENTAL_INTERACTIONS,
  FOOD_ITEMS,
  HOME_ITEMS,
  hasWellFedBuff,
  INGREDIENTS_META,
  KINGDOM_CITIZENS,
  KINGDOM_FESTIVALS,
} from './game/world';

export default function App() {
  const [initialRoomCode] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return (params.get('room') ?? '').trim().toUpperCase();
  });
  const [progress, setProgress] = useState<SavedProgress>(() => loadProgress());
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [playMode, setPlayMode] = useState<PlayMode>(() =>
    initialRoomCode ? 'multiplayer' : 'endless'
  );
  const [bossActive, setBossActive] = useState<boolean>(false);
  const [stageConfig, setStageConfig] = useState<StageConfig>(() => generateNewStage());
  const [runKey, setRunKey] = useState<number>(0);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);

  // Photo Mode state
  const [photoMode, setPhotoMode] = useState<boolean>(false);
  const [photoPose, setPhotoPose] = useState<PhotoPose>('happy');
  const [photoWithSignature, setPhotoWithSignature] = useState<boolean>(true);
  const [photoFlash, setPhotoFlash] = useState<boolean>(false);
  const [photoSavedNotice, setPhotoSavedNotice] = useState<boolean>(false);
  const resumeAfterPhotoRef = useRef<boolean>(false);
  const captureApiRef = useRef<((withSignature: boolean) => boolean) | null>(null);

  // Firebase Auth & Global Leaderboard state
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authBusy, setAuthBusy] = useState<boolean>(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState<GlobalLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [personalCloudEntry, setPersonalCloudEntry] = useState<GlobalLeaderboardEntry | null>(null);
  const [todaySentGift, setTodaySentGift] = useState<YuzuGift | null>(null);
  const [incomingGifts, setIncomingGifts] = useState<YuzuGift[]>([]);
  const [cloudStatus, setCloudStatus] = useState<
    'idle' | 'saving' | 'saved' | 'kept_best' | 'error'
  >('idle');

  // Weekly Tournament state
  const [weekIndex, setWeekIndex] = useState<number>(() => getCurrentWeekIndex());
  const [weeklyResetText, setWeeklyResetText] = useState<string>(
    () => getTimeUntilWeeklyReset().formatted
  );
  const [weeklyEntries, setWeeklyEntries] = useState<WeeklyTournamentEntry[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState<boolean>(true);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);
  const [personalWeeklyEntry, setPersonalWeeklyEntry] = useState<WeeklyTournamentEntry | null>(
    null
  );
  const [previousWeeklyEntries, setPreviousWeeklyEntries] = useState<WeeklyTournamentEntry[]>([]);
  const [userWeeklyClaims, setUserWeeklyClaims] = useState<WeeklyTournamentClaim[]>([]);
  const [weeklySubmitting, setWeeklySubmitting] = useState<boolean>(false);
  const [weeklyClaiming, setWeeklyClaiming] = useState<boolean>(false);

  const currentHighScore = progress.highScores[progress.selectedDifficulty] ?? 0;
  const overallLocalBest = Math.max(
    progress.highScores.relaxed ?? 0,
    progress.highScores.normal ?? 0,
    progress.highScores.turbo ?? 0
  );

  const [hud, setHud] = useState<HudSnapshot>({
    score: 0,
    highScore: currentHighScore,
    yuzuRun: 0,
    yuzuBank: progress.yuzuBank,
    combo: 0,
    multiplier: 1,
    hearts: 3,
    maxHearts: 3,
    hasShield: false,
    magnetTimer: 0,
    magnetMaxDuration: 7,
    feverMeter: 0,
    feverActive: false,
    feverTimer: 0,
    feverMaxDuration: 6,
    distanceMeters: 0,
    speedFactor: 1,
    activeWeather: resolveActiveWeather(progress.weatherMode, 0, progress.forecastWeather),
    isNight: false,
    cycleRemainingSeconds: 300,
    bossActive: false,
    bossName: null,
    bossHp: 0,
    bossMaxHp: 1,
    bossesDefeated: 0,
    skillCooldowns: {
      yuzu_shot: 0,
      onsen_wave: 0,
      lotus_shield: 0,
      yuzu_meteor: 0,
      bamboo_storm: 0,
      thunder_yuzu: 0,
      cherry_heal: 0,
    },
    stageName: stageConfig.name,
  });

  // Unlock Tone.js AudioContext on first user interaction
  useEffect(() => {
    const unlock = () => {
      setAudioUnlocked(true);
      void musicEngine.ensureReady();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Persist progress and sync Mute state to both SFX and Tone.js BGM
  useEffect(() => {
    soundEngine.setMuted(progress.muted);
    musicEngine.setMuted(progress.muted);
    saveProgress(progress);
  }, [progress]);

  // Switch BGM tracks smoothly based on gameState, playMode, and bossActive
  useEffect(() => {
    if (!audioUnlocked) return;
    if (playMode === 'multiplayer') {
      void musicEngine.setTrack('playing');
      return;
    }
    if (gameState === 'PAUSED') {
      void musicEngine.setTrack('stopped');
    } else if (gameState === 'PLAYING') {
      void musicEngine.setTrack(bossActive ? 'boss' : 'playing');
    } else {
      void musicEngine.setTrack('menu');
    }
  }, [audioUnlocked, bossActive, gameState, playMode]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextWeek = getCurrentWeekIndex();
      setWeekIndex((prev) => (prev !== nextWeek ? nextWeek : prev));
      setWeeklyResetText(getTimeUntilWeeklyReset().formatted);
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        fetchPersonalLeaderboardEntry(user.uid)
          .then((entry) => setPersonalCloudEntry(entry))
          .catch(() => {});
        fetchTodaySentGift(user.uid)
          .then((gift) => setTodaySentGift(gift))
          .catch(() => {});
        fetchWeeklyEntry(weekIndex, user.uid)
          .then((entry) => setPersonalWeeklyEntry(entry))
          .catch(() => {});
        fetchUserWeeklyClaims(user.uid)
          .then((claims) => setUserWeeklyClaims(claims))
          .catch(() => {});
      } else {
        setPersonalCloudEntry(null);
        setTodaySentGift(null);
        setIncomingGifts([]);
        setPersonalWeeklyEntry(null);
        setUserWeeklyClaims([]);
      }
    });
    return () => unsub();
  }, [weekIndex]);

  useEffect(() => {
    if (!firebaseUser) {
      setIncomingGifts([]);
      return;
    }
    const unsub = subscribeIncomingGifts(
      firebaseUser.uid,
      (gifts) => setIncomingGifts(gifts),
      () => {}
    );
    return () => unsub();
  }, [firebaseUser]);

  useEffect(() => {
    setLeaderboardLoading(true);
    const unsub = subscribeTopLeaderboard(
      (entries) => {
        setLeaderboardEntries(entries);
        setLeaderboardLoading(false);
        setLeaderboardError(null);
      },
      (err) => {
        setLeaderboardLoading(false);
        setLeaderboardError(
          err.message.includes('Quota')
            ? 'Hệ thống Firebase đã vượt hạn mức truy cập hôm nay. Vui lòng thử lại vào ngày mai.'
            : 'Không thể tải bảng xếp hạng toàn cầu lúc này.'
        );
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    setWeeklyLoading(true);
    const unsub = subscribeWeeklyLeaderboard(
      weekIndex,
      (entries) => {
        setWeeklyEntries(entries);
        setWeeklyLoading(false);
        setWeeklyError(null);
      },
      () => {
        setWeeklyLoading(false);
        setWeeklyError('Không thể tải bảng xếp hạng Thách đấu tuần lúc này.');
      }
    );
    fetchWeeklyLeaderboardOnce(weekIndex - 1)
      .then((prev) => setPreviousWeeklyEntries(prev))
      .catch(() => {});
    return () => unsub();
  }, [weekIndex]);

  const syncScoreToCloud = useCallback(
    async (
      user: User,
      score: number,
      difficulty: Difficulty,
      distanceMeters: number
    ) => {
      setCloudStatus('saving');
      try {
        const res = await submitLeaderboardScore({
          user,
          playerName: progress.appearance.name || user.displayName || 'Capybara',
          score,
          difficulty,
          distanceMeters,
          appearance: progress.appearance,
        });
        setCloudStatus(res.status === 'kept_best' ? 'kept_best' : 'saved');
        const updated = await fetchPersonalLeaderboardEntry(user.uid);
        if (updated) {
          setPersonalCloudEntry(updated);
        }
      } catch {
        setCloudStatus('error');
      }
    },
    [progress.appearance]
  );

  const syncWeeklyScoreToCloud = useCallback(
    async (
      user: User,
      score: number,
      distanceMeters: number,
      bossesDefeated: number
    ) => {
      setCloudStatus('saving');
      setWeeklySubmitting(true);
      try {
        const res = await submitWeeklyTournamentScore({
          user,
          playerName: progress.appearance.name || user.displayName || 'Capybara',
          score,
          distanceMeters,
          bossesDefeated,
          appearance: progress.appearance,
        });
        setCloudStatus(res.status === 'kept_best' ? 'kept_best' : 'saved');
        const updated = await fetchWeeklyEntry(res.weekIndex, user.uid);
        if (updated) {
          setPersonalWeeklyEntry(updated);
        }
      } catch {
        setCloudStatus('error');
      } finally {
        setWeeklySubmitting(false);
      }
    },
    [progress.appearance]
  );

  const handleToggleMute = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      muted: !prev.muted,
    }));
  }, []);

  const handleSelectDifficulty = useCallback((difficulty: Difficulty) => {
    setProgress((prev) => {
      setHud((prevHud) => ({
        ...prevHud,
        highScore: prev.highScores[difficulty] ?? 0,
      }));
      return {
        ...prev,
        selectedDifficulty: difficulty,
      };
    });
  }, []);

  const handleSelectWeather = useCallback(
    (weatherMode: WeatherMode) => {
      setProgress((prev) => ({
        ...prev,
        weatherMode,
      }));
      setHud((prevHud) => ({
        ...prevHud,
        activeWeather: resolveActiveWeather(
          weatherMode,
          prevHud.distanceMeters * 28,
          progress.forecastWeather
        ),
      }));
    },
    [progress.forecastWeather]
  );

  const handleCycleWeather = useCallback(() => {
    setProgress((prev) => {
      const idx = WEATHER_OPTIONS.findIndex((w) => w.id === prev.weatherMode);
      const nextMode = WEATHER_OPTIONS[(idx + 1) % WEATHER_OPTIONS.length].id;
      setHud((prevHud) => ({
        ...prevHud,
        activeWeather: resolveActiveWeather(
          nextMode,
          prevHud.distanceMeters * 28,
          prev.forecastWeather
        ),
      }));
      return {
        ...prev,
        weatherMode: nextMode,
      };
    });
  }, []);

  const handleBuyWeatherCharm = useCallback(() => {
    setProgress((prev) => {
      if (prev.yuzuBank < WEATHER_CHARM_COST) return prev;
      soundEngine.playUnlock();
      return {
        ...prev,
        yuzuBank: prev.yuzuBank - WEATHER_CHARM_COST,
        weatherCharms: prev.weatherCharms + 1,
      };
    });
  }, []);

  const handleCastWeatherCharm = useCallback(() => {
    setProgress((prev) => {
      if (prev.weatherCharms <= 0) return prev;
      const nextForecast = rollForecastWeather(prev.forecastWeather);
      soundEngine.playPowerUp();
      setHud((prevHud) => ({
        ...prevHud,
        activeWeather: resolveActiveWeather(prev.weatherMode, 0, nextForecast),
      }));
      return {
        ...prev,
        weatherCharms: prev.weatherCharms - 1,
        forecastWeather: nextForecast,
        weatherLockedByCharm: true,
      };
    });
  }, []);

  const handleStartEndless = useCallback(() => {
    setPhotoMode(false);
    setRunSummary(null);
    setCloudStatus('idle');
    setBossActive(false);
    setPlayMode('endless');
    setStageConfig((prev) => generateNewStage(prev.biome));
    setRunKey((k) => k + 1);
    setGameState('PLAYING');
  }, []);

  const handleStartBossRush = useCallback(() => {
    setPhotoMode(false);
    setRunSummary(null);
    setCloudStatus('idle');
    setBossActive(true);
    setPlayMode('boss_rush');
    setStageConfig((prev) => generateNewStage(prev.biome));
    setRunKey((k) => k + 1);
    setGameState('PLAYING');
  }, []);

  const handleStartWeeklyTournament = useCallback(() => {
    setPhotoMode(false);
    setRunSummary(null);
    setCloudStatus('idle');
    setBossActive(false);
    setPlayMode('weekly_tournament');
    setStageConfig(generateWeeklyStageForIndex(weekIndex));
    setRunKey((k) => k + 1);
    setGameState('PLAYING');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [weekIndex]);

  const handleOpenMultiplayer = useCallback(() => {
    setPhotoMode(false);
    setBossActive(false);
    setPlayMode('multiplayer');
  }, []);

  const handleExitMultiplayer = useCallback(() => {
    setPlayMode('endless');
    setGameState('TITLE_MENU');
  }, []);

  const handleTogglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'PLAYING') return 'PAUSED';
      if (prev === 'PAUSED') return 'PLAYING';
      return prev;
    });
  }, []);

  const handleBackToMenu = useCallback(() => {
    setPhotoMode(false);
    setRunSummary(null);
    setCloudStatus('idle');
    setBossActive(false);
    setStageConfig((prev) => generateNewStage(prev.biome));
    setRunKey((k) => k + 1);
    setGameState('TITLE_MENU');
  }, []);

  const handleOpenPhotoMode = useCallback(() => {
    setPhotoSavedNotice(false);
    if (gameState === 'PLAYING') {
      resumeAfterPhotoRef.current = true;
      setGameState('PAUSED');
    } else {
      resumeAfterPhotoRef.current = false;
    }
    setPhotoMode(true);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [gameState]);

  const handleExitPhotoMode = useCallback(() => {
    setPhotoMode(false);
    setPhotoSavedNotice(false);
    if (resumeAfterPhotoRef.current) {
      resumeAfterPhotoRef.current = false;
      setGameState('PLAYING');
    }
  }, []);

  const handleCapturePhoto = useCallback(() => {
    const ok = captureApiRef.current?.(photoWithSignature);
    if (ok) {
      soundEngine.playPowerUp();
      setPhotoFlash(true);
      setPhotoSavedNotice(true);
      window.setTimeout(() => setPhotoFlash(false), 220);
      window.setTimeout(() => setPhotoSavedNotice(false), 2800);
    }
  }, [photoWithSignature]);

  useEffect(() => {
    if (!photoMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        handleExitPhotoMode();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleExitPhotoMode, photoMode]);

  const handleGameOver = useCallback(
    (summary: RunSummary) => {
      const isWeekly = playMode === 'weekly_tournament';
      const weeklyBestAfter = isWeekly
        ? Math.max(personalWeeklyEntry?.score ?? 0, summary.score)
        : summary.highScore;

      setRunSummary(
        isWeekly
          ? {
              ...summary,
              highScore: weeklyBestAfter,
              isNewRecord: summary.score > (personalWeeklyEntry?.score ?? 0),
            }
          : summary
      );
      setBossActive(false);
      setGameState('GAME_OVER');
      setProgress((prev) => {
        const prevBest = prev.highScores[prev.selectedDifficulty] ?? 0;
        const nextBest = isWeekly ? prevBest : Math.max(prevBest, summary.score);
        const nextForecast = prev.weatherLockedByCharm
          ? prev.forecastWeather
          : rollForecastWeather(prev.forecastWeather);
        return {
          ...prev,
          highScores: {
            ...prev.highScores,
            [prev.selectedDifficulty]: nextBest,
          },
          yuzuBank: prev.yuzuBank + summary.yuzuCollected,
          dailyQuests: applyRunToQuests(prev.dailyQuests, summary),
          achievementStats: applyRunToAchievementStats(prev.achievementStats, summary),
          forecastWeather: nextForecast,
          weatherLockedByCharm: false,
          needs: {
            hunger: clampStat(prev.needs.hunger - 8),
            energy: clampStat(prev.needs.energy - 10),
            happiness: clampStat(prev.needs.happiness + (summary.bossesDefeated > 0 ? 8 : 2)),
            updatedAt: Date.now(),
          },
        };
      });

      if (firebaseUser) {
        if (isWeekly) {
          void syncWeeklyScoreToCloud(
            firebaseUser,
            summary.score,
            summary.distanceMeters,
            summary.bossesDefeated
          );
        } else {
          void syncScoreToCloud(
            firebaseUser,
            summary.score,
            progress.selectedDifficulty,
            summary.distanceMeters
          );
        }
      }
    },
    [
      firebaseUser,
      personalWeeklyEntry?.score,
      playMode,
      progress.selectedDifficulty,
      syncScoreToCloud,
      syncWeeklyScoreToCloud,
    ]
  );

  const handleSignIn = useCallback(
    async (scoreToSubmit?: { score: number; distanceMeters: number; bossesDefeated?: number }) => {
      setAuthBusy(true);
      try {
        const user = await signInWithGoogle();
        const existing = await fetchPersonalLeaderboardEntry(user.uid);
        setPersonalCloudEntry(existing);
        if (scoreToSubmit) {
          if (playMode === 'weekly_tournament') {
            await syncWeeklyScoreToCloud(
              user,
              scoreToSubmit.score,
              scoreToSubmit.distanceMeters,
              scoreToSubmit.bossesDefeated ?? 0
            );
          } else if (scoreToSubmit.score > (existing?.score ?? -1)) {
            await syncScoreToCloud(
              user,
              scoreToSubmit.score,
              progress.selectedDifficulty,
              scoreToSubmit.distanceMeters
            );
          }
        }
      } catch {
        // User cancelled popup
      } finally {
        setAuthBusy(false);
      }
    },
    [playMode, progress.selectedDifficulty, syncScoreToCloud, syncWeeklyScoreToCloud]
  );

  const handleSignOut = useCallback(async () => {
    await signOutGoogle();
    setPersonalCloudEntry(null);
    setCloudStatus('idle');
  }, []);

  const handleSyncLocalBest = useCallback(() => {
    if (!firebaseUser || overallLocalBest <= 0) return;
    void syncScoreToCloud(
      firebaseUser,
      overallLocalBest,
      progress.selectedDifficulty,
      runSummary?.distanceMeters ?? 0
    );
  }, [firebaseUser, overallLocalBest, progress.selectedDifficulty, runSummary?.distanceMeters, syncScoreToCloud]);

  const handleSendYuzuGift = useCallback(
    async (
      recipient: GlobalLeaderboardEntry,
      message: string
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!firebaseUser) {
        return { ok: false, error: 'Hãy đăng nhập Google trước khi gửi quà.' };
      }
      if (recipient.uid === firebaseUser.uid) {
        return { ok: false, error: 'Bạn không thể tự gửi quà cho chính mình.' };
      }
      if (todaySentGift) {
        return {
          ok: false,
          error: `Hôm nay bạn đã gửi quà cho ${todaySentGift.recipientName} rồi.`,
        };
      }
      try {
        const sent = await sendYuzuGift({
          senderUser: firebaseUser,
          senderName: progress.appearance.name || firebaseUser.displayName || 'Capybara',
          recipientUid: recipient.uid,
          recipientName: recipient.playerName,
          message,
        });
        setTodaySentGift(sent);
        soundEngine.playGoldenYuzu();
        return { ok: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
          return {
            ok: false,
            error: 'Bạn đã sử dụng lượt gửi Gói quà quýt hôm nay hoặc người nhận không hợp lệ.',
          };
        }
        return { ok: false, error: 'Không thể gửi gói quà lúc này. Vui lòng thử lại.' };
      }
    },
    [firebaseUser, progress.appearance.name, todaySentGift]
  );

  const handleClaimYuzuGift = useCallback(async (gift: YuzuGift) => {
    await claimYuzuGift(gift.id);
    soundEngine.playGoldenYuzu();
    setProgress((prev) => ({
      ...prev,
      yuzuBank: prev.yuzuBank + (gift.yuzuAmount || YUZU_GIFT_AMOUNT),
    }));
  }, []);

  const handleChangeName = useCallback((name: string) => {
    setProgress((prev) => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        name,
      },
    }));
  }, []);

  const handleChangeAvatar = useCallback((avatar: string) => {
    setProgress((prev) => ({
      ...prev,
      avatar,
    }));
  }, []);

  const handleSelectOrUnlockFur = useCallback((furId: FurColorId) => {
    setProgress((prev) => {
      if (prev.unlockedFur.includes(furId)) {
        return {
          ...prev,
          appearance: { ...prev.appearance, fur: furId },
        };
      }
      const item = FUR_OPTIONS.find((f) => f.id === furId);
      if (!item || prev.yuzuBank < item.cost) return prev;
      soundEngine.playUnlock();
      return {
        ...prev,
        yuzuBank: prev.yuzuBank - item.cost,
        unlockedFur: [...prev.unlockedFur, furId],
        appearance: { ...prev.appearance, fur: furId },
      };
    });
  }, []);

  const handleSelectOrUnlockHead = useCallback((headId: HeadAccessoryId) => {
    setProgress((prev) => {
      if (prev.unlockedHead.includes(headId)) {
        return {
          ...prev,
          appearance: { ...prev.appearance, head: headId },
        };
      }
      const item = HEAD_ACCESSORIES.find((h) => h.id === headId);
      if (!item || prev.yuzuBank < item.cost) return prev;
      soundEngine.playUnlock();
      return {
        ...prev,
        yuzuBank: prev.yuzuBank - item.cost,
        unlockedHead: [...prev.unlockedHead, headId],
        appearance: { ...prev.appearance, head: headId },
      };
    });
  }, []);

  const handleSelectOrUnlockNeck = useCallback((neckId: NeckAccessoryId) => {
    setProgress((prev) => {
      if (prev.unlockedNeck.includes(neckId)) {
        return {
          ...prev,
          appearance: { ...prev.appearance, neck: neckId },
        };
      }
      const item = NECK_ACCESSORIES.find((n) => n.id === neckId);
      if (!item || prev.yuzuBank < item.cost) return prev;
      soundEngine.playUnlock();
      return {
        ...prev,
        yuzuBank: prev.yuzuBank - item.cost,
        unlockedNeck: [...prev.unlockedNeck, neckId],
        appearance: { ...prev.appearance, neck: neckId },
      };
    });
  }, []);

  const handleSelectOrUnlockOutfit = useCallback((outfitId: OutfitId) => {
    setProgress((prev) => {
      if (prev.unlockedOutfits.includes(outfitId)) {
        return {
          ...prev,
          appearance: { ...prev.appearance, outfit: outfitId },
        };
      }
      const item = OUTFIT_OPTIONS.find((o) => o.id === outfitId);
      if (!item || prev.yuzuBank < item.cost) return prev;
      soundEngine.playUnlock();
      return {
        ...prev,
        yuzuBank: prev.yuzuBank - item.cost,
        unlockedOutfits: [...prev.unlockedOutfits, outfitId],
        appearance: { ...prev.appearance, outfit: outfitId },
      };
    });
  }, []);

  const handleSelectOrUnlockMount = useCallback((mountId: MountId) => {
    setProgress((prev) => {
      if (prev.unlockedMounts.includes(mountId)) {
        soundEngine.playYuzu(2);
        return {
          ...prev,
          appearance: { ...prev.appearance, mount: mountId },
        };
      }
      const item = MOUNT_OPTIONS.find((m) => m.id === mountId);
      if (!item || prev.yuzuBank < item.cost) return prev;
      soundEngine.playUnlock();
      return {
        ...prev,
        yuzuBank: prev.yuzuBank - item.cost,
        unlockedMounts: [...prev.unlockedMounts, mountId],
        appearance: { ...prev.appearance, mount: mountId },
      };
    });
  }, []);

  const handleUnlockSkill = useCallback((skillId: SkillId) => {
    setProgress((prev) => {
      if (prev.unlockedSkills.includes(skillId)) return prev;
      const skill = BOSS_SKILLS.find((s) => s.id === skillId);
      if (!skill || prev.yuzuBank < skill.cost) return prev;
      soundEngine.playUnlock();
      return {
        ...prev,
        yuzuBank: prev.yuzuBank - skill.cost,
        unlockedSkills: [...prev.unlockedSkills, skillId],
      };
    });
  }, []);

  const handleSaveCustomMap = useCallback((map: CustomMap) => {
    setProgress((prev) => ({
      ...prev,
      customMaps: [map, ...prev.customMaps.filter((m) => m.id !== map.id)],
    }));
  }, []);

  const handleDeleteCustomMap = useCallback((mapId: string) => {
    setProgress((prev) => ({
      ...prev,
      customMaps: prev.customMaps.filter((m) => m.id !== mapId),
    }));
  }, []);

  const handleAddYuzu = useCallback((amount: number) => {
    setProgress((prev) => ({
      ...prev,
      yuzuBank: prev.yuzuBank + amount,
    }));
  }, []);

  const handleRandomizeOutfit = useCallback(() => {
    setProgress((prev) => {
      const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
      soundEngine.playYuzu(3);
      return {
        ...prev,
        appearance: {
          ...prev.appearance,
          fur: pick(prev.unlockedFur),
          head: pick(prev.unlockedHead),
          neck: pick(prev.unlockedNeck),
          outfit: pick(prev.unlockedOutfits),
          mount: pick(prev.unlockedMounts),
        },
      };
    });
  }, []);

  const handleBuyFood = useCallback((foodId: FoodId) => {
    setProgress((prev) => {
      const food = FOOD_ITEMS.find((f) => f.id === foodId);
      if (!food || prev.yuzuBank < food.cost) return prev;
      soundEngine.playUnlock();
      return {
        ...prev,
        yuzuBank: prev.yuzuBank - food.cost,
        foodInventory: {
          ...prev.foodInventory,
          [foodId]: (prev.foodInventory[foodId] ?? 0) + 1,
        },
      };
    });
  }, []);

  const handleFeedCapybara = useCallback((foodId: FoodId) => {
    setProgress((prev) => {
      const count = prev.foodInventory[foodId] ?? 0;
      const food = FOOD_ITEMS.find((f) => f.id === foodId);
      if (!food || count <= 0) return prev;
      soundEngine.playPowerUp();
      return {
        ...prev,
        foodInventory: {
          ...prev.foodInventory,
          [foodId]: count - 1,
        },
        needs: {
          hunger: clampStat(prev.needs.hunger + food.hungerGain),
          energy: clampStat(prev.needs.energy + food.energyGain),
          happiness: clampStat(prev.needs.happiness + food.happinessGain),
          updatedAt: Date.now(),
        },
      };
    });
  }, []);

  const handleUnlockOrToggleHomeItem = useCallback((itemId: HomeItemId) => {
    setProgress((prev) => {
      if (prev.unlockedHomeItems.includes(itemId)) {
        const isPlaced = prev.activeHomeItems.includes(itemId);
        soundEngine.playYuzu(1);
        return {
          ...prev,
          activeHomeItems: isPlaced
            ? prev.activeHomeItems.filter((i) => i !== itemId)
            : [...prev.activeHomeItems, itemId],
        };
      }
      const item = HOME_ITEMS.find((h) => h.id === itemId);
      if (!item || prev.yuzuBank < item.cost) return prev;
      soundEngine.playUnlock();
      return {
        ...prev,
        yuzuBank: prev.yuzuBank - item.cost,
        unlockedHomeItems: [...prev.unlockedHomeItems, itemId],
        activeHomeItems: [...prev.activeHomeItems, itemId],
      };
    });
  }, []);

  const handleSelectOrUnlockPet = useCallback((petId: PetId) => {
    setProgress((prev) => {
      if (prev.unlockedPets.includes(petId)) {
        soundEngine.playYuzu(2);
        return {
          ...prev,
          selectedPet: petId,
        };
      }
      const pet = PET_OPTIONS.find((p) => p.id === petId);
      if (!pet || prev.yuzuBank < pet.cost) return prev;
      soundEngine.playUnlock();
      return {
        ...prev,
        yuzuBank: prev.yuzuBank - pet.cost,
        unlockedPets: [...prev.unlockedPets, petId],
        selectedPet: petId,
      };
    });
  }, []);

  const handleCarePet = useCallback(
    (petId: Exclude<PetId, 'none'>, action: 'pet' | 'treat'): { message: string; ok: boolean } => {
      if (action === 'treat' && progress.yuzuBank < 3) {
        return { ok: false, message: 'Cần 3 quýt để cho thú cưng ăn vặt.' };
      }
      const pet = PET_OPTIONS.find((p) => p.id === petId);
      const petName = pet?.name ?? 'Thú cưng';

      if (action === 'pet') {
        soundEngine.playYuzu(3);
        setProgress((prev) => ({
          ...prev,
          petBond: {
            ...prev.petBond,
            [petId]: clampStat((prev.petBond[petId] ?? 30) + 8),
          },
        }));
        return { ok: true, message: `Đã vuốt ve ${petName} (+8% Thân thiết)` };
      }

      soundEngine.playPowerUp();
      setProgress((prev) => ({
        ...prev,
        yuzuBank: Math.max(0, prev.yuzuBank - 3),
        petBond: {
          ...prev.petBond,
          [petId]: clampStat((prev.petBond[petId] ?? 30) + 18),
        },
      }));
      return { ok: true, message: `${petName} rất thích món ăn vặt (+18% Thân thiết)` };
    },
    [progress.yuzuBank]
  );

  const handleWorldActivity = useCallback(
    (
      kind:
        | 'rest'
        | 'swim'
        | 'toss_yuzu'
        | 'forage'
        | 'meditate'
        | 'bounce'
        | 'pet'
        | 'playground_hit'
        | 'capy_activity',
      payload?: { golden?: boolean; activityId?: CapybaraActivityId }
    ): { message: string; ok: boolean } => {
      if (kind === 'forage' && progress.needs.energy < 15) {
        return {
          ok: false,
          message: 'Capybara đang mệt! Hãy về Nhà riêng ngủ trưa hoặc ăn thêm thức ăn.',
        };
      }

      let resultMessage = '';

      if (kind === 'capy_activity' && payload?.activityId) {
        const meta = CAPYBARA_ACTIVITIES.find((a) => a.id === payload.activityId);
        if (!meta) return { ok: false, message: 'Không tìm thấy hoạt động.' };
        if (payload.activityId === 'selfie') {
          soundEngine.playCameraShutter();
        } else if (payload.activityId === 'bubble_bath' || payload.activityId === 'dive_swim') {
          soundEngine.playSplash();
        } else if (payload.activityId === 'nap_snore' || payload.activityId === 'sleep_teddy') {
          soundEngine.playSnore();
        } else if (payload.activityId === 'eat_watermelon') {
          soundEngine.playChew();
        } else if (payload.activityId === 'arcade_game') {
          soundEngine.playArcadeBeep();
        } else {
          soundEngine.playPowerUp();
        }
        const reward = meta.yuzuReward ?? 0;
        resultMessage =
          reward > 0
            ? `${meta.label} (+${meta.happinessDelta}% Vui, +${reward} Quýt)`
            : `${meta.label} (+${meta.happinessDelta}% Vui)`;
        setProgress((prev) => ({
          ...prev,
          yuzuBank: prev.yuzuBank + reward,
          needs: {
            hunger: clampStat(prev.needs.hunger + meta.hungerDelta),
            energy: clampStat(prev.needs.energy + meta.energyDelta),
            happiness: clampStat(prev.needs.happiness + meta.happinessDelta),
            updatedAt: Date.now(),
          },
        }));
        return { ok: true, message: resultMessage };
      }

      if (kind === 'rest') {
        const hasPlushBed = progress.activeHomeItems.includes('plush_bed');
        const gain = hasPlushBed ? 45 : 35;
        soundEngine.playSnore();
        resultMessage = `Ngủ trưa ngon giấc (+${gain}% Năng lượng)`;
        setProgress((prev) => ({
          ...prev,
          needs: {
            ...prev.needs,
            energy: clampStat(prev.needs.energy + gain),
            happiness: clampStat(prev.needs.happiness + 8),
            updatedAt: Date.now(),
          },
        }));
      } else if (kind === 'swim') {
        soundEngine.playSplash();
        resultMessage = 'Bơi suối mát lạnh (+22% Vui, +10% Năng lượng)';
        setProgress((prev) => ({
          ...prev,
          needs: {
            ...prev.needs,
            energy: clampStat(prev.needs.energy + 10),
            happiness: clampStat(prev.needs.happiness + 22),
            hunger: clampStat(prev.needs.hunger - 4),
            updatedAt: Date.now(),
          },
        }));
      } else if (kind === 'toss_yuzu') {
        const bonus = Math.random() < 0.55 ? 2 : 0;
        soundEngine.playYuzu(3);
        resultMessage =
          bonus > 0
            ? `Capybara vớt được +${bonus} Quýt từ hồ bơi! (+16% Vui)`
            : 'Capybara vờn quýt dưới nước rất thích thú (+16% Vui)';
        setProgress((prev) => ({
          ...prev,
          yuzuBank: prev.yuzuBank + bonus,
          needs: {
            ...prev.needs,
            happiness: clampStat(prev.needs.happiness + 16),
            updatedAt: Date.now(),
          },
        }));
      } else if (kind === 'forage') {
        const yuzuFound = 4 + Math.floor(Math.random() * 6);
        const foodPool: FoodId[] = ['carrot', 'yuzu_sweet', 'bamboo_salad'];
        const foundFood = Math.random() < 0.65 ? foodPool[Math.floor(Math.random() * foodPool.length)] : null;
        const foodName = foundFood
          ? FOOD_ITEMS.find((f) => f.id === foundFood)?.name
          : null;
        soundEngine.playGoldenYuzu();
        resultMessage = foodName
          ? `Hái được +${yuzuFound} Quýt & 1 ${foodName}!`
          : `Hái được +${yuzuFound} Quýt trong rừng tre!`;
        setProgress((prev) => ({
          ...prev,
          yuzuBank: prev.yuzuBank + yuzuFound,
          foodInventory: foundFood
            ? {
                ...prev.foodInventory,
                [foundFood]: (prev.foodInventory[foundFood] ?? 0) + 1,
              }
            : prev.foodInventory,
          needs: {
            ...prev.needs,
            energy: clampStat(prev.needs.energy - 15),
            hunger: clampStat(prev.needs.hunger - 6),
            happiness: clampStat(prev.needs.happiness + 10),
            updatedAt: Date.now(),
          },
        }));
      } else if (kind === 'meditate') {
        soundEngine.playPowerUp();
        resultMessage = 'Thiền dưới tán tre (+18% Năng lượng, +12% Vui)';
        setProgress((prev) => ({
          ...prev,
          needs: {
            ...prev.needs,
            energy: clampStat(prev.needs.energy + 18),
            happiness: clampStat(prev.needs.happiness + 12),
            updatedAt: Date.now(),
          },
        }));
      } else if (kind === 'bounce') {
        soundEngine.playJump(true);
        resultMessage = 'Nhảy bạt nhún cực đã (+20% Niềm vui)';
        setProgress((prev) => ({
          ...prev,
          needs: {
            ...prev.needs,
            energy: clampStat(prev.needs.energy - 5),
            happiness: clampStat(prev.needs.happiness + 20),
            updatedAt: Date.now(),
          },
        }));
      } else if (kind === 'pet') {
        resultMessage = 'Capybara thích thú khi được vuốt ve (+6% Niềm vui)';
        setProgress((prev) => ({
          ...prev,
          needs: {
            ...prev.needs,
            happiness: clampStat(prev.needs.happiness + 6),
            updatedAt: Date.now(),
          },
        }));
      } else if (kind === 'playground_hit') {
        const gain = payload?.golden ? 3 : 1;
        resultMessage = `Bắt trúng quýt (+${gain} Quýt, +3% Vui)`;
        setProgress((prev) => ({
          ...prev,
          yuzuBank: prev.yuzuBank + gain,
          needs: {
            ...prev.needs,
            happiness: clampStat(prev.needs.happiness + 3),
            updatedAt: Date.now(),
          },
        }));
      }

      return { ok: true, message: resultMessage };
    },
    [progress.activeHomeItems, progress.needs.energy]
  );

  const handleClaimQuest = useCallback((questId: string) => {
    setProgress((prev) => {
      const currentQuests = ensureCurrentDailyQuests(prev.dailyQuests);
      const targetQuest = currentQuests.quests.find((q) => q.id === questId);
      if (!targetQuest || targetQuest.claimed || targetQuest.progress < targetQuest.target) {
        return prev;
      }
      soundEngine.playPowerUp();
      return {
        ...prev,
        yuzuBank: prev.yuzuBank + targetQuest.rewardYuzu,
        dailyQuests: {
          ...currentQuests,
          quests: currentQuests.quests.map((q) =>
            q.id === questId ? { ...q, claimed: true } : q
          ),
        },
      };
    });
  }, []);

  const handleClaimAchievement = useCallback((achievementId: string) => {
    setProgress((prev) => {
      if (prev.claimedAchievements.includes(achievementId)) return prev;
      const def = ACHIEVEMENTS.find((a) => a.id === achievementId);
      if (!def || !isAchievementUnlocked(def, prev.achievementStats, prev.unlockedPets)) {
        return prev;
      }
      soundEngine.playGoldenYuzu();
      return {
        ...prev,
        yuzuBank: prev.yuzuBank + def.rewardYuzu,
        claimedAchievements: [...prev.claimedAchievements, achievementId],
      };
    });
  }, []);

  const handleClaimWeeklyQualifier = useCallback(async () => {
    if (!firebaseUser || !personalWeeklyEntry || weeklyClaiming) return;
    const weekId = getWeekId(weekIndex);
    if (userWeeklyClaims.some((c) => c.weekId === weekId && c.claimType === 'qualifier')) return;
    setWeeklyClaiming(true);
    try {
      const claim = await claimWeeklyTournamentReward({
        user: firebaseUser,
        weekIndex,
        claimType: 'qualifier',
        rank: 1,
        rewardYuzu: WEEKLY_QUALIFIER_REWARD_YUZU,
        badgeId: 'weekly_participant',
        badgeTitle: 'Huy hiệu Chiến Binh Tuần',
      });
      setUserWeeklyClaims((prev) => [...prev, claim]);
      soundEngine.playGoldenYuzu();
      setProgress((prev) => ({
        ...prev,
        yuzuBank: prev.yuzuBank + WEEKLY_QUALIFIER_REWARD_YUZU,
      }));
    } catch {
      // ignore transient claim error
    } finally {
      setWeeklyClaiming(false);
    }
  }, [firebaseUser, personalWeeklyEntry, userWeeklyClaims, weekIndex, weeklyClaiming]);

  const handleClaimPreviousWeeklyRank = useCallback(
    async (rank: number) => {
      if (!firebaseUser || weeklyClaiming) return;
      const prevWeek = weekIndex - 1;
      const prevWeekId = getWeekId(prevWeek);
      if (userWeeklyClaims.some((c) => c.weekId === prevWeekId && c.claimType === 'final_rank')) {
        return;
      }
      const tier = getRewardForWeeklyRank(rank);
      setWeeklyClaiming(true);
      try {
        const claim = await claimWeeklyTournamentReward({
          user: firebaseUser,
          weekIndex: prevWeek,
          claimType: 'final_rank',
          rank,
          rewardYuzu: tier.rewardYuzu,
          badgeId: tier.id,
          badgeTitle: tier.title,
        });
        setUserWeeklyClaims((prev) => [...prev, claim]);
        soundEngine.playGoldenYuzu();
        const badgeRecord = createTournamentBadgeRecord({
          weekIndex: prevWeek,
          rank,
          rewardYuzu: tier.rewardYuzu,
          tier,
        });
        setProgress((prev) => ({
          ...prev,
          yuzuBank: prev.yuzuBank + tier.rewardYuzu,
          tournamentBadges: [
            badgeRecord,
            ...prev.tournamentBadges.filter((b) => b.weekId !== badgeRecord.weekId),
          ],
        }));
      } catch {
        // ignore transient claim error
      } finally {
        setWeeklyClaiming(false);
      }
    },
    [firebaseUser, userWeeklyClaims, weekIndex, weeklyClaiming]
  );

  const handleSideQuestProgress = useCallback((questId: SideQuestId) => {
    setProgress((prev) => ({
      ...prev,
      sideQuests: prev.sideQuests.map((q) =>
        q.id === questId && !q.claimed
          ? { ...q, progress: Math.min(q.target, q.progress + 1) }
          : q
      ),
    }));
  }, []);

  const handleClaimSideQuest = useCallback((questId: SideQuestId) => {
    setProgress((prev) => {
      const target = prev.sideQuests.find((q) => q.id === questId);
      if (!target || target.claimed || target.progress < target.target) return prev;
      soundEngine.playGoldenYuzu();
      const nextFood = target.rewardFood
        ? {
            ...prev.foodInventory,
            [target.rewardFood]: (prev.foodInventory[target.rewardFood] ?? 0) + 1,
          }
        : prev.foodInventory;
      return {
        ...prev,
        yuzuBank: prev.yuzuBank + target.rewardYuzu,
        foodInventory: nextFood,
        sideQuests: prev.sideQuests.map((q) =>
          q.id === questId ? { ...q, claimed: true } : q
        ),
      };
    });
  }, []);

  const handleResetSideQuests = useCallback(() => {
    soundEngine.playPowerUp();
    setProgress((prev) => ({
      ...prev,
      sideQuests: createDefaultSideQuests(),
    }));
  }, []);

  const handleFishingCatch = useCallback((rewardYuzu: number) => {
    setProgress((prev) => ({
      ...prev,
      yuzuBank: prev.yuzuBank + rewardYuzu,
      sideQuests: prev.sideQuests.map((q) =>
        q.id === 'catch_fish' && !q.claimed
          ? { ...q, progress: Math.min(q.target, q.progress + 1) }
          : q
      ),
      needs: {
        ...prev.needs,
        happiness: clampStat(prev.needs.happiness + 8),
        updatedAt: Date.now(),
      },
    }));
  }, []);

  const handleEnvInteraction = useCallback(
    (envId: EnvironmentalActionId): { message: string; ok: boolean } => {
      const meta = ENVIRONMENTAL_INTERACTIONS.find((e) => e.id === envId);
      if (!meta) return { ok: false, message: 'Không tìm thấy tương tác.' };
      if (envId === 'swim_water') soundEngine.playSplash();
      else if (envId === 'chew_grass') soundEngine.playChew();
      else soundEngine.playSnore();
      setProgress((prev) => ({
        ...prev,
        needs: {
          hunger: clampStat(prev.needs.hunger + meta.hungerDelta),
          energy: clampStat(prev.needs.energy + meta.energyDelta),
          happiness: clampStat(prev.needs.happiness + meta.happinessDelta),
          updatedAt: Date.now(),
        },
      }));
      return { ok: true, message: `${meta.title}: ${meta.summary}` };
    },
    []
  );

  const handleCollectIngredient = useCallback((id: IngredientId, amount: number) => {
    soundEngine.playYuzu(3);
    setProgress((prev) => ({
      ...prev,
      ingredients: {
        ...prev.ingredients,
        [id]: (prev.ingredients[id] ?? 0) + amount,
      },
    }));
  }, []);

  const handleBuyIngredient = useCallback(
    (id: IngredientId): { message: string; ok: boolean } => {
      const meta = INGREDIENTS_META.find((m) => m.id === id);
      if (!meta) return { ok: false, message: 'Không tìm thấy nguyên liệu.' };
      if (progress.yuzuBank < meta.costYuzu) {
        return { ok: false, message: `Cần ${meta.costYuzu} quýt để mua ${meta.name}.` };
      }
      soundEngine.playYuzu(2);
      setProgress((prev) => {
        if (prev.yuzuBank < meta.costYuzu) return prev;
        return {
          ...prev,
          yuzuBank: prev.yuzuBank - meta.costYuzu,
          ingredients: {
            ...prev.ingredients,
            [id]: (prev.ingredients[id] ?? 0) + 1,
          },
        };
      });
      return { ok: true, message: `Đã mua +1 ${meta.name}!` };
    },
    [progress.yuzuBank]
  );

  const handleCraftItem = useCallback(
    (id: CraftedItemId): { message: string; ok: boolean } => {
      const recipe = CRAFTING_RECIPES.find((r) => r.id === id);
      if (!recipe) return { ok: false, message: 'Không tìm thấy công thức.' };
      const reqEntries = Object.entries(recipe.ingredients) as [IngredientId, number][];
      const enough = reqEntries.every(
        ([ingId, reqAmt]) => (progress.ingredients[ingId] ?? 0) >= reqAmt
      );
      if (!enough) {
        return { ok: false, message: `Chưa đủ nguyên liệu để chế tạo ${recipe.name}.` };
      }
      soundEngine.playCraft();
      setProgress((prev) => {
        const stillEnough = reqEntries.every(
          ([ingId, reqAmt]) => (prev.ingredients[ingId] ?? 0) >= reqAmt
        );
        if (!stillEnough) return prev;
        const nextIngredients = { ...prev.ingredients };
        for (const [ingId, reqAmt] of reqEntries) {
          nextIngredients[ingId] = Math.max(0, (nextIngredients[ingId] ?? 0) - reqAmt);
        }
        return {
          ...prev,
          ingredients: nextIngredients,
          craftedItems: {
            ...prev.craftedItems,
            [id]: (prev.craftedItems[id] ?? 0) + 1,
          },
        };
      });
      return { ok: true, message: `Đã chế tạo thành công 1 ${recipe.name}!` };
    },
    [progress.ingredients]
  );

  const handleUseCraftedItem = useCallback(
    (id: CraftedItemId): { message: string; ok: boolean } => {
      if (id === 'floating_balloons') {
        if (progress.balloonsActive) {
          setProgress((prev) => ({ ...prev, balloonsActive: false }));
          return { ok: true, message: 'Đã tháo chùm Bong bóng bay.' };
        }
        if ((progress.craftedItems.floating_balloons ?? 0) <= 0) {
          return { ok: false, message: 'Bạn chưa có Bong bóng bay trong kho.' };
        }
        soundEngine.playPowerUp();
        setProgress((prev) => ({
          ...prev,
          balloonsActive: true,
          craftedItems: {
            ...prev.craftedItems,
            floating_balloons: Math.max(0, (prev.craftedItems.floating_balloons ?? 1) - 1),
          },
        }));
        return { ok: true, message: 'Đã đeo chùm Bong bóng bay bảy sắc!' };
      }

      if (id === 'fur_potion') {
        if ((progress.craftedItems.fur_potion ?? 0) <= 0) {
          return { ok: false, message: 'Bạn chưa có Thuốc đổi màu lông trong kho.' };
        }
        const hue = Math.floor(Math.random() * 360);
        soundEngine.playPowerUp();
        setProgress((prev) => ({
          ...prev,
          potionHue: hue,
          craftedItems: {
            ...prev.craftedItems,
            fur_potion: Math.max(0, (prev.craftedItems.fur_potion ?? 1) - 1),
          },
        }));
        return { ok: true, message: `Đã uống Thuốc Đổi Màu Lông! Lông chuyển sắc độ ${hue}°!` };
      }

      if ((progress.craftedItems.glowing_food ?? 0) <= 0) {
        return { ok: false, message: 'Bạn chưa có Thức ăn phát sáng trong kho.' };
      }
      soundEngine.playChew();
      setProgress((prev) => ({
        ...prev,
        glowingFoodUntil: Date.now() + 180_000,
        craftedItems: {
          ...prev.craftedItems,
          glowing_food: Math.max(0, (prev.craftedItems.glowing_food ?? 1) - 1),
        },
        needs: {
          hunger: clampStat(prev.needs.hunger + 35),
          energy: clampStat(prev.needs.energy + 25),
          happiness: clampStat(prev.needs.happiness + 30),
          updatedAt: Date.now(),
        },
      }));
      return {
        ok: true,
        message: 'Đã ăn Thức Ăn Phát Sáng! (+35% No, +25% NL, +30% Vui & phát sáng 3 phút)',
      };
    },
    [progress.balloonsActive, progress.craftedItems]
  );

  const handleClearPotionHue = useCallback(() => {
    setProgress((prev) => ({ ...prev, potionHue: null }));
  }, []);

  const handleUpgradeCastle = useCallback((): { message: string; ok: boolean } => {
    const nextLevel = progress.kingdom.castleLevel + 1;
    const nextTier = CASTLE_TIERS[nextLevel];
    if (!nextTier) {
      return { ok: false, message: 'Lâu đài đã đạt cấp tối đa!' };
    }
    if (progress.yuzuBank < nextTier.costYuzu || progress.meteorStones < nextTier.costMeteor) {
      return {
        ok: false,
        message: `Cần ${nextTier.costYuzu} quýt và ${nextTier.costMeteor} Đá Thiên Thạch để xây ${nextTier.name}.`,
      };
    }
    soundEngine.playFestival();
    setProgress((prev) => ({
      ...prev,
      yuzuBank: prev.yuzuBank - nextTier.costYuzu,
      meteorStones: prev.meteorStones - nextTier.costMeteor,
      kingdom: {
        ...prev.kingdom,
        castleLevel: nextLevel,
      },
    }));
    return { ok: true, message: `Chúc mừng! Đã xây dựng thành công ${nextTier.name}!` };
  }, [progress.kingdom.castleLevel, progress.meteorStones, progress.yuzuBank]);

  const handleRecruitCitizen = useCallback(
    (id: CitizenId): { message: string; ok: boolean } => {
      const meta = KINGDOM_CITIZENS.find((c) => c.id === id);
      if (!meta) return { ok: false, message: 'Không tìm thấy cư dân.' };
      if (progress.kingdom.citizens.includes(id)) {
        return { ok: false, message: `${meta.name} đã là cư dân của Vương quốc!` };
      }
      if (progress.yuzuBank < meta.costYuzu) {
        return { ok: false, message: `Cần ${meta.costYuzu} quýt để tuyển ${meta.name}.` };
      }
      soundEngine.playPowerUp();
      setProgress((prev) => ({
        ...prev,
        yuzuBank: prev.yuzuBank - meta.costYuzu,
        kingdom: {
          ...prev.kingdom,
          citizens: [...prev.kingdom.citizens, id],
        },
      }));
      return { ok: true, message: `Đã tuyển ${meta.name} (${meta.role}) vào Vương quốc!` };
    },
    [progress.kingdom.citizens, progress.yuzuBank]
  );

  const handleHostFestival = useCallback(
    (id: FestivalId): { message: string; ok: boolean } => {
      const fest = KINGDOM_FESTIVALS.find((f) => f.id === id);
      if (!fest) return { ok: false, message: 'Không tìm thấy lễ hội.' };
      if (progress.yuzuBank < fest.costYuzu) {
        return { ok: false, message: `Cần ${fest.costYuzu} quýt để tổ chức ${fest.name}.` };
      }
      soundEngine.playFestival();
      const bonusPool: IngredientId[] = ['glow_mushroom', 'ice_crystal', 'sea_pearl', 'candy_sugar'];
      const bonusIng = bonusPool[Math.floor(Math.random() * bonusPool.length)];
      setProgress((prev) => ({
        ...prev,
        yuzuBank: prev.yuzuBank - fest.costYuzu + fest.rewardYuzu,
        ingredients:
          id === 'starlight_carnival'
            ? { ...prev.ingredients, [bonusIng]: (prev.ingredients[bonusIng] ?? 0) + 1 }
            : prev.ingredients,
        needs: {
          ...prev.needs,
          happiness: clampStat(prev.needs.happiness + 18),
          updatedAt: Date.now(),
        },
        kingdom: {
          ...prev.kingdom,
          festivalsHeld: prev.kingdom.festivalsHeld + 1,
          activeFestivalId: id,
          activeFestivalUntil: Date.now() + 25_000,
        },
      }));
      return {
        ok: true,
        message: `${fest.name} rực rỡ! Cư dân hân hoan (+${fest.rewardYuzu} Quýt lộc lễ hội)!`,
      };
    },
    [progress.yuzuBank]
  );

  const handleGreetRoyals = useCallback((): { message: string; ok: boolean } => {
    soundEngine.playGoldenYuzu();
    setProgress((prev) => ({
      ...prev,
      yuzuBank: prev.yuzuBank + 2,
      needs: {
        ...prev.needs,
        happiness: clampStat(prev.needs.happiness + 8),
        updatedAt: Date.now(),
      },
    }));
    return {
      ok: true,
      message: 'Vua & Hoàng hậu Capybara ban phước lành (+2 Quýt, +8% Niềm vui)!',
    };
  }, []);

  const handleCollectMeteorStone = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      yuzuBank: prev.yuzuBank + 2,
      meteorStones: prev.meteorStones + 1,
      ingredients: {
        ...prev.ingredients,
        meteor_stone: (prev.ingredients.meteor_stone ?? 0) + 1,
      },
    }));
  }, []);

  const handleMeetAlien = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      yuzuBank: prev.yuzuBank + 5,
      alienMetCount: prev.alienMetCount + 1,
      ingredients: {
        ...prev.ingredients,
        candy_sugar: (prev.ingredients.candy_sugar ?? 0) + 1,
      },
    }));
  }, []);

  const handleClaimMidnightChest = useCallback(() => {
    const todayKey = new Date().toLocaleDateString('en-CA');
    setProgress((prev) => {
      if (prev.midnightChestDayKey === todayKey) return prev;
      return {
        ...prev,
        yuzuBank: prev.yuzuBank + 20,
        midnightChestDayKey: todayKey,
        ingredients: {
          ...prev.ingredients,
          meteor_stone: (prev.ingredients.meteor_stone ?? 0) + 1,
          sea_pearl: (prev.ingredients.sea_pearl ?? 0) + 1,
        },
      };
    });
  }, []);

  const handleDiscoverCreature = useCallback(
    (creatureId: string, _name: string, rewardYuzu: number) => {
      setProgress((prev) => {
        if (prev.discoveredCreatures.includes(creatureId)) return prev;
        return {
          ...prev,
          yuzuBank: prev.yuzuBank + rewardYuzu,
          discoveredCreatures: [...prev.discoveredCreatures, creatureId],
        };
      });
    },
    []
  );

  const currentDailyQuests = ensureCurrentDailyQuests(progress.dailyQuests);
  const wellFedBuff = hasWellFedBuff(progress.needs);
  const glowingFoodActive = progress.glowingFoodUntil > Date.now();
  const todayDateKey = new Date().toLocaleDateString('en-CA');
  const midnightChestClaimed = progress.midnightChestDayKey === todayDateKey;
  const activePetBond =
    progress.selectedPet !== 'none' ? progress.petBond[progress.selectedPet] ?? 30 : 0;

  return (
    <div className="min-h-screen bg-[#111A16] text-[#F3F6F4]">
      <main className="mx-auto max-w-[1160px] px-4 py-6 sm:px-8 sm:py-8">
        {playMode === 'multiplayer' ? (
          <MultiplayerView
            appearance={progress.appearance}
            weatherMode={progress.weatherMode}
            customMaps={progress.customMaps}
            initialRoomCode={initialRoomCode}
            onSaveCustomMap={handleSaveCustomMap}
            onDeleteCustomMap={handleDeleteCustomMap}
            onAddYuzu={handleAddYuzu}
            onExitMultiplayer={handleExitMultiplayer}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#16231D] shadow-2xl">
            {!photoMode && (
              <GameHud
                gameState={gameState}
                hud={{
                  ...hud,
                  highScore: Math.max(currentHighScore, hud.highScore),
                  yuzuBank: progress.yuzuBank,
                  stageName: stageConfig.name,
                }}
                capybaraName={progress.appearance.name}
                avatarUrl={progress.avatar}
                petId={progress.selectedPet}
                weatherMode={progress.weatherMode}
                muted={progress.muted}
                onCycleWeather={handleCycleWeather}
                onToggleMute={handleToggleMute}
                onTogglePause={handleTogglePause}
                onOpenPhotoMode={handleOpenPhotoMode}
              />
            )}

            <div className="relative">
              <GameCanvas
                gameState={gameState}
                playMode={playMode}
                difficulty={progress.selectedDifficulty}
                appearance={progress.appearance}
                weatherMode={progress.weatherMode}
                forecastWeather={progress.forecastWeather}
                unlockedSkills={progress.unlockedSkills}
                wellFedBuff={wellFedBuff}
                petId={progress.selectedPet}
                petBond={activePetBond}
                stageConfig={stageConfig}
                photoMode={photoMode}
                photoPose={photoPose}
                captureApiRef={captureApiRef}
                highScore={
                  playMode === 'weekly_tournament'
                    ? personalWeeklyEntry?.score ?? 0
                    : currentHighScore
                }
                yuzuBank={progress.yuzuBank}
                runKey={runKey}
                potionHue={progress.potionHue}
                glowingFoodActive={glowingFoodActive}
                balloonsActive={progress.balloonsActive}
                onHudUpdate={setHud}
                onBossActiveChange={setBossActive}
                onGameOver={handleGameOver}
                onTogglePause={handleTogglePause}
              />

              {photoFlash && (
                <div
                  className="pointer-events-none absolute inset-0 bg-white/70 transition-opacity duration-200"
                  aria-hidden="true"
                />
              )}

              {!photoMode && gameState === 'TITLE_MENU' && (
                <TitleOverlay
                  difficulty={progress.selectedDifficulty}
                  weatherMode={progress.weatherMode}
                  highScore={currentHighScore}
                  forecastWeather={progress.forecastWeather}
                  weatherCharms={progress.weatherCharms}
                  weatherLockedByCharm={progress.weatherLockedByCharm}
                  yuzuBank={progress.yuzuBank}
                  weeklyResetText={weeklyResetText}
                  weeklyScore={personalWeeklyEntry?.score ?? null}
                  onSelectDifficulty={handleSelectDifficulty}
                  onSelectWeather={handleSelectWeather}
                  onCastWeatherCharm={handleCastWeatherCharm}
                  onBuyWeatherCharm={handleBuyWeatherCharm}
                  onStartEndless={handleStartEndless}
                  onStartBossRush={handleStartBossRush}
                  onStartWeeklyTournament={handleStartWeeklyTournament}
                  onOpenMultiplayer={handleOpenMultiplayer}
                />
              )}

              {!photoMode && gameState === 'PAUSED' && (
                <PauseOverlay
                  onResume={handleTogglePause}
                  onRestart={
                    playMode === 'weekly_tournament'
                      ? handleStartWeeklyTournament
                      : playMode === 'boss_rush'
                      ? handleStartBossRush
                      : handleStartEndless
                  }
                  onOpenPhotoMode={handleOpenPhotoMode}
                  onBackToMenu={handleBackToMenu}
                />
              )}

              {!photoMode && gameState === 'GAME_OVER' && runSummary && (
                <GameOverOverlay
                  summary={runSummary}
                  playMode={playMode}
                  user={firebaseUser}
                  cloudStatus={cloudStatus}
                  cloudBestScore={
                    playMode === 'weekly_tournament'
                      ? personalWeeklyEntry?.score ?? null
                      : personalCloudEntry?.score ?? null
                  }
                  authBusy={authBusy}
                  onSignInAndSave={() =>
                    void handleSignIn({
                      score: runSummary.score,
                      distanceMeters: runSummary.distanceMeters,
                      bossesDefeated: runSummary.bossesDefeated,
                    })
                  }
                  onPlayAgain={
                    playMode === 'weekly_tournament'
                      ? handleStartWeeklyTournament
                      : playMode === 'boss_rush'
                      ? handleStartBossRush
                      : handleStartEndless
                  }
                  onBackToMenu={handleBackToMenu}
                />
              )}
            </div>

            {photoMode ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-amber-400/25 bg-[#14201A] px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    <span>Photo Mode (Đã ẩn HUD)</span>
                  </span>
                  <span className="text-white/20" aria-hidden="true">·</span>
                  <div className="flex flex-wrap items-center gap-1">
                    {(
                      [
                        { id: 'happy', label: 'Vui vẻ' },
                        { id: 'normal', label: 'Tự nhiên' },
                        { id: 'zen', label: 'Ngâm suối' },
                        { id: 'cool', label: 'Ngầu' },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPhotoPose(p.id)}
                        className={`h-8 whitespace-nowrap rounded-md px-2.5 text-xs font-semibold transition-colors ${
                          photoPose === p.id
                            ? 'bg-amber-500 text-[#1A1308]'
                            : 'border border-white/10 bg-[#1D2E26] text-emerald-100 hover:bg-[#273E33]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleCycleWeather}
                    className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border border-white/12 bg-[#1D2E26] px-2.5 text-xs font-medium text-emerald-100 hover:bg-[#273E33]"
                  >
                    <CloudRain className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
                    <span>{getWeatherLabel(hud.activeWeather)}</span>
                  </button>

                  <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 px-1.5 text-xs text-emerald-100/85">
                    <input
                      type="checkbox"
                      checked={photoWithSignature}
                      onChange={(e) => setPhotoWithSignature(e.target.checked)}
                      className="h-3.5 w-3.5 accent-amber-400"
                    />
                    <span>Ghi tên & màn</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  {photoSavedNotice && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Đã tải ảnh PNG!</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-500 px-4 text-xs font-bold text-[#1A1308] hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    <span>Chụp & Tải ảnh</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExitPhotoMode}
                    className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 bg-[#21332A] px-3.5 text-xs font-semibold text-white hover:bg-[#2B4337] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    <span>Thoát (Esc)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#14201A] px-5 py-2.5 text-xs text-emerald-200/75">
                <div>
                  <span>Điều khiển: </span>
                  <span className="font-medium text-emerald-100">Space / W / L / ↑</span>
                  <span> nhảy đôi</span>
                  <span className="mx-2 text-white/25" aria-hidden="true">·</span>
                  <span className="font-medium text-emerald-100">A / D / ← / →</span>
                  <span> di chuyển khi đấu Boss</span>
                  <span className="mx-2 text-white/25" aria-hidden="true">·</span>
                  <span className="font-medium text-emerald-100">J / K / I / U / O / Y / B</span>
                  <span> dùng kỹ năng</span>
                </div>
                <div className="font-mono-num text-emerald-200/80">
                  Màn: {stageConfig.name} · Chu kỳ Ngày/Đêm: 5 phút
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Leaderboard Top 10 */}
        <LeaderboardPanel
          entries={leaderboardEntries}
          loading={leaderboardLoading}
          errorMessage={leaderboardError}
          user={firebaseUser}
          personalEntry={personalCloudEntry}
          localBestScore={overallLocalBest}
          submitting={cloudStatus === 'saving'}
          authBusy={authBusy}
          todaySentGift={todaySentGift}
          incomingGifts={incomingGifts}
          onSignIn={() =>
            void handleSignIn(
              overallLocalBest > 0
                ? { score: overallLocalBest, distanceMeters: runSummary?.distanceMeters ?? 0 }
                : undefined
            )
          }
          onSignOut={() => void handleSignOut()}
          onSyncLocalBest={handleSyncLocalBest}
          onSendYuzuGift={handleSendYuzuGift}
          onClaimYuzuGift={handleClaimYuzuGift}
        />

        {/* Weekly Tournament Mode & Season Leaderboard */}
        <WeeklyTournamentPanel
          weekIndex={weekIndex}
          entries={weeklyEntries}
          loading={weeklyLoading}
          errorMessage={weeklyError}
          user={firebaseUser}
          personalEntry={personalWeeklyEntry}
          previousWeekIndex={weekIndex - 1}
          previousEntries={previousWeeklyEntries}
          userClaims={userWeeklyClaims}
          claimedBadges={progress.tournamentBadges}
          authBusy={authBusy}
          submitting={weeklySubmitting}
          claiming={weeklyClaiming}
          onSignIn={() => void handleSignIn()}
          onPlayWeeklyTournament={handleStartWeeklyTournament}
          onClaimQualifierReward={() => void handleClaimWeeklyQualifier()}
          onClaimPreviousWeekReward={(rank) => void handleClaimPreviousWeeklyRank(rank)}
        />

        {/* Below: Capybara World Hub (Home, Pool, Forest, Shop, Playground, Wardrobe, Food, Pets) + Daily Quests */}
        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <CapybaraWorldHub
              yuzuBank={progress.yuzuBank}
              avatar={progress.avatar}
              appearance={progress.appearance}
              needs={progress.needs}
              foodInventory={progress.foodInventory}
              unlockedFur={progress.unlockedFur}
              unlockedHead={progress.unlockedHead}
              unlockedNeck={progress.unlockedNeck}
              unlockedOutfits={progress.unlockedOutfits}
              unlockedMounts={progress.unlockedMounts}
              unlockedSkills={progress.unlockedSkills}
              unlockedHomeItems={progress.unlockedHomeItems}
              activeHomeItems={progress.activeHomeItems}
              unlockedPets={progress.unlockedPets}
              selectedPet={progress.selectedPet}
              petBond={progress.petBond}
              achievementStats={progress.achievementStats}
              claimedAchievements={progress.claimedAchievements}
              activeWeather={hud.activeWeather}
              sideQuests={progress.sideQuests}
              weatherCharms={progress.weatherCharms}
              tournamentBadges={progress.tournamentBadges}
              ingredients={progress.ingredients}
              craftedItems={progress.craftedItems}
              potionHue={progress.potionHue}
              balloonsActive={progress.balloonsActive}
              glowingFoodActive={glowingFoodActive}
              kingdom={progress.kingdom}
              meteorStones={progress.meteorStones}
              alienMetCount={progress.alienMetCount}
              midnightChestClaimed={midnightChestClaimed}
              discoveredCreatures={progress.discoveredCreatures}
              onChangeName={handleChangeName}
              onChangeAvatar={handleChangeAvatar}
              onSelectOrUnlockFur={handleSelectOrUnlockFur}
              onSelectOrUnlockHead={handleSelectOrUnlockHead}
              onSelectOrUnlockNeck={handleSelectOrUnlockNeck}
              onSelectOrUnlockOutfit={handleSelectOrUnlockOutfit}
              onSelectOrUnlockMount={handleSelectOrUnlockMount}
              onRandomizeOutfit={handleRandomizeOutfit}
              onUnlockSkill={handleUnlockSkill}
              onBuyFood={handleBuyFood}
              onFeedCapybara={handleFeedCapybara}
              onUnlockOrToggleHomeItem={handleUnlockOrToggleHomeItem}
              onSelectOrUnlockPet={handleSelectOrUnlockPet}
              onCarePet={handleCarePet}
              onClaimAchievement={handleClaimAchievement}
              onOpenPhotoMode={handleOpenPhotoMode}
              onBuyWeatherCharm={handleBuyWeatherCharm}
              onSideQuestProgress={handleSideQuestProgress}
              onClaimSideQuest={handleClaimSideQuest}
              onResetSideQuests={handleResetSideQuests}
              onFishingCatch={handleFishingCatch}
              onEnvInteraction={handleEnvInteraction}
              onCollectIngredient={handleCollectIngredient}
              onBuyIngredient={handleBuyIngredient}
              onCraftItem={handleCraftItem}
              onUseCraftedItem={handleUseCraftedItem}
              onClearPotionHue={handleClearPotionHue}
              onUpgradeCastle={handleUpgradeCastle}
              onRecruitCitizen={handleRecruitCitizen}
              onHostFestival={handleHostFestival}
              onGreetRoyals={handleGreetRoyals}
              onCollectMeteorStone={handleCollectMeteorStone}
              onMeetAlien={handleMeetAlien}
              onClaimMidnightChest={handleClaimMidnightChest}
              onDiscoverCreature={handleDiscoverCreature}
              onWorldActivity={handleWorldActivity}
            />
          </div>

          <div className="lg:col-span-4">
            <DailyQuestsPanel
              questState={currentDailyQuests}
              onClaimQuest={handleClaimQuest}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
