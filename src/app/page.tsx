"use client";

/**
 * الصفحة الرئيسية — بيانات حية من قاعدة الإدارة
 * =============================================
 * لوحة تحكم (Dashboard) بأسلوب تطبيق جوال — Mobile-First
 * العمود الرئيسي بعرض max-w-md ليبدو كتطبيق حتى على شاشات الكمبيوتر
 *
 * الأقسام: الشريط العلوي ← البطاقة الترحيبية ← البطاقات المزدوجة ←
 *          الروابط السريعة ← المحاور الثقافية ← قسم البدايات ← شريط التنقل السفلي
 *
 * البيانات (بعد الربط الحقيقي):
 *   • قائمة المراحل — GET /api/levels (فهرس Prisma خفيف)
 *   • إحصاءات البطاقة الترحيبية — من مخزن التقدم المحلي
 *   • إطلاق أي مرحلة — GET /api/levels/:id عبر طبقة التطبيع
 *   شبكات الأمان: القائمة الثابتة في data.ts عند تعذّر الاتصال
 */

import { ComponentProps, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/home/app-header";
import { HeroCard } from "@/components/home/hero-card";
import { DualCards } from "@/components/home/dual-cards";
import { QuickLinks } from "@/components/home/quick-links";
import { CulturalChips } from "@/components/home/cultural-chips";
import { BeginnersSection } from "@/components/home/beginners-section";
import { BadgesStrip } from "@/components/home/badges-strip";
import { BottomTabBar } from "@/components/home/bottom-tab-bar";
import { LeaderboardView } from "@/components/home/leaderboard-view";
import { ProfileView } from "@/components/home/profile-view";
import { LibraryView } from "@/components/library/library-view";
import { ChallengesView } from "@/components/home/challenges-view";
import { KnowledgeMapView } from "@/components/home/knowledge-map-view";
import { AxisPanel } from "@/components/home/axis-panel";
import { GameContainer } from "@/components/game/game-container";
import { LevelLoading } from "@/components/game/level-loading";
import { AdminPanel } from "@/components/admin/admin-panel";
import { AdminLogin } from "@/components/admin/admin-login";
import {
  useBadges,
  useCoins,
  useProgress,
} from "@/lib/game/progress-store";
import { syncPlayerProgress } from "@/lib/game/player-sync";
import type { GameLevel } from "@/lib/game/types";
import {
  beginnerLevels,
  culturalAxes,
  type BeginnerLevel,
  type CulturalAxis,
  type DualCardItem,
  type QuickLink,
} from "@/components/home/data";

/** شكل استجابة فهرس المراحل — GET /api/levels */
interface LevelsListResponse {
  ok: boolean;
  levels: Array<{
    id: string;
    number: number;
    title: string;
    description: string;
    difficulty: string | null;
    chapterTitle: string | null;
    puzzleCount: number;
    order: number;
  }>;
}

export default function Home() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("home");
  const [activeAxis, setActiveAxis] = useState(culturalAxes[0].id);

  /* ===== الإدارة: idle | checking | login | ok =====
     لا تُعرض اللوحة إلا بعد تحقق الخادم من جلسة الإدارة */
  const [adminState, setAdminState] = useState<
    "idle" | "checking" | "login" | "ok"
  >("idle");

  /* ===== شاشات ملء الإطار — تحدياتي وخريطة المعرفة =====
     تُفتحان من البطاقات المزدوجة وتُغلقان بمغادرة الرئيسية */
  const [overlayView, setOverlayView] = useState<
    "challenges" | "knowledge-map" | null
  >(null);

  /* ===== بطاقة جلسة اللعب — تُ増اد عند كل إطلاق صريح لجلسة
     جديدة (مرحلة أخرى/توصية جديدة) فتُعاد تهيئة الحاوية،
     وتبقى ثابتة عند التنقل بين التبويبات (استئناف الجلسة) ===== */
  const [sessionNonce, setSessionNonce] = useState(0);

  /* ===== القائمة الحية — فهرس المراحل من قاعدة الإدارة ===== */
  const [levelCards, setLevelCards] = useState<BeginnerLevel[]>(
    beginnerLevels.map((card) => ({ ...card })),
  );

  /* ===== التقدم المحلي — نجوم ونجوم البطاقة الترحيبية ===== */
  const progress = useProgress();

  /* ===== الاقتصاد والأوسمة — رصيد دائم يتراكم بين الجلسات ===== */
  const coinsBalance = useCoins();
  const unlockedBadges = useBadges();

  /* ===== المرحلة المُحمّلة للعب — تُجلب كلها عبر API حصراً ===== */
  const [activeLevel, setActiveLevel] = useState<GameLevel | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [levelLoading, setLevelLoading] = useState(false);

  /* جلب الفهرس مرة واحدة عند التحميل — القائمة الثابتة بديل تلقائي.
     القفل هنا منطق أولي (الأولى مفتوحة والبقية مقفلة)؛ الحساب
     الحقيقي بالتقدم يجري لحظياً في cardsWithStars أدناه */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/levels");
        const data = (await response.json()) as LevelsListResponse;
        if (cancelled || !data.ok || !Array.isArray(data.levels)) return;
        if (data.levels.length === 0) return;
        setLevelCards(
          data.levels.map((header, index) => ({
            id: header.number,
            levelId: header.id,
            title: header.title,
            description: header.description,
            stars: 0,
            totalStars: 3,
            locked: index > 0,
            chapterTitle: header.chapterTitle,
          })),
        );
      } catch {
        /* بلا اتصال — القائمة الثابتة تكفي لعرض الواجهة */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ===== مزامنة ملف اللاعب مع قاعدة الإدارة — Debounced:
     نسخة إحصائية تُرفع بعد أول تحميل وكل إنجاز جديد (تغيّر
     التقدم/الاقتصاد/الأوسمة) فتتغذى صفحتا اللاعبين والمتصدّرين ===== */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const entries = Object.values(progress);
      syncPlayerProgress({
        points: entries.reduce((sum, entry) => sum + entry.bestPoints, 0),
        stars: entries.reduce((sum, entry) => sum + entry.stars, 0),
        badgesCount: Object.keys(unlockedBadges).length,
        coins: coinsBalance,
        levelsCompleted: entries.filter((entry) => entry.stars > 0).length,
      });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [progress, coinsBalance, unlockedBadges]);

  /* الإحصاءات الحية للبطاقة الترحيبية — من التقدم المحلي والأوسمة */
  const liveStats = (() => {
    const completed = levelCards.filter(
      (card) => (progress[card.levelId]?.stars ?? 0) > 0,
    ).length;
    const points = Object.values(progress).reduce(
      (sum, entry) => sum + entry.bestPoints,
      0,
    );
    const total = levelCards.length;
    return {
      completedLevels: completed,
      totalLevels: total,
      points,
      badges: Object.keys(unlockedBadges).length,
      progressPercent:
        total > 0 ? Math.round((completed / total) * 100) : 0,
      levelNumber: Math.min(completed + 1, Math.max(total, 1)),
    };
  })();

  /* البطاقات مع النجوم المكتسبة وحالة القفل — تُحدّث فور انتهاء أي مرحلة.
     قاعدتا التدرّج: مرحلة تُفتح بإكمال سابقتها (نجمة تكفي)،
     وما اكتمل يوماً لا يُقفل أبداً (احترام للتقدم القديم) */
  const cardsWithStars = levelCards.map((card, index) => {
    const prev = index > 0 ? levelCards[index - 1] : null;
    const ownStars = progress[card.levelId]?.stars ?? 0;
    const prevDone = prev ? (progress[prev.levelId]?.stars ?? 0) > 0 : true;
    return {
      ...card,
      stars: ownStars,
      locked: index > 0 && ownStars === 0 && !prevDone,
    };
  });

  /** فتح لوحة التحكم الشاملة — يتحقق الخادم من الجلسة أولاً */
  const openAdminPanel = async () => {
    document.querySelectorAll("audio").forEach((audio) => audio.pause());
    setAdminState("checking");
    try {
      const response = await fetch("/api/admin/session", { cache: "no-store" });
      const data = (await response.json()) as { ok?: boolean };
      setAdminState(data.ok ? "ok" : "login");
    } catch {
      setAdminState("login");
    }
  };

  /** اختيار محور ثقافي — تبديل فوري وبطاقة كتب المحور تحت الشبكة */
  const handleAxisChange = (axis: CulturalAxis) => {
    setActiveAxis(axis.id);
    toast({
      title: `محور ${axis.title}`,
      description: "كتب المحور تظهر تحت الشبكة — من مكتبة الإدارة",
    });
  };

  /** تحميل مرحلة عبر API — المسار الموحّد لكل البطاقات وتبويب اللعبة.
      بطاقة الجلسة تزداد عند التحول لمرحلة مختلفة — فيُعاد تركيب
      الحاوية بجلسة نظيفة، وتبقى ثابتة عند العودة لنفس المرحلة */
  const launchLevelById = async (levelId: string, badgeNumber: number) => {
    setLevelLoading(true);
    setActiveTab("game");
    try {
      const response = await fetch(
        `/api/levels/${encodeURIComponent(levelId)}`,
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const normalized = (await response.json()) as GameLevel;
      if (levelId !== selectedLevelId) setSessionNonce((n) => n + 1);
      setActiveLevel(normalized);
      setSelectedLevelId(levelId);
      toast({
        title: normalized.title,
        description: "وصلت مباشرة من قاعدة بيانات لوحة الإدارة",
      });
    } catch {
      setActiveTab("home");
      toast({
        title: "تعذّر تحميل المرحلة",
        description: "تحقق من الاتصال ثم أعد المحاولة",
        variant: "destructive",
      });
    } finally {
      setLevelLoading(false);
    }
  };

  /** تشغيل تحدي اليوم — جلسة حتمية تتبدل كل يوم، مفتاحها
      daily-YYYY-MM-DD فتُمنح المكافأة كاملة أول مرة كل يوم */
  const launchDailyChallenge = async () => {
    setLevelLoading(true);
    setActiveTab("game");
    try {
      const response = await fetch("/api/daily-challenge");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const level = (await response.json()) as GameLevel;
      if (level.id !== selectedLevelId) setSessionNonce((n) => n + 1);
      setActiveLevel(level);
      setSelectedLevelId(level.id);
      toast({
        title: level.title,
        description: "خمسة ألغاز تتبدل كل يوم — بالتوفيق!",
      });
    } catch {
      setActiveTab("home");
      toast({
        title: "تعذّر تحميل تحدي اليوم",
        description: "تحقق من الاتصال ثم أعد المحاولة",
        variant: "destructive",
      });
    } finally {
      setLevelLoading(false);
    }
  };

  /** توصية ذكية — خمسة ألغاز تُختار من قاعدة الإدارة حسب
      نقاط ضعف تقدمك (المراحل الأقل إنجازاً) — جلسة جديدة دائماً */
  const launchSmartRecommendation = async () => {
    setLevelLoading(true);
    setActiveTab("game");
    try {
      const starsMap = JSON.stringify(
        Object.fromEntries(
          Object.entries(progress).map(([id, entry]) => [id, entry.stars]),
        ),
      );
      const response = await fetch(
        `/api/recommendation?progress=${encodeURIComponent(starsMap)}`,
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const level = (await response.json()) as GameLevel;
      setSessionNonce((n) => n + 1);
      setActiveLevel(level);
      setSelectedLevelId(level.id);
      toast({
        title: level.title,
        description: "اخترناها لك حسب تقدمك — بالتوفيق!",
      });
    } catch {
      setActiveTab("home");
      toast({
        title: "تعذّر تجهيز التوصية",
        description: "تحقق من الاتصال ثم أعد المحاولة",
        variant: "destructive",
      });
    } finally {
      setLevelLoading(false);
    }
  };

  /** اختيار مرحلة من قسم البدايات — المرحلة المقفلة تُرشد بلطف */
  const handleLevelSelect = (level: BeginnerLevel) => {
    if (level.locked) {
      toast({
        title: "هذه المرحلة مقفلة بعد",
        description: `أكمل المرحلة السابقة «${levelCards.find((c) => c.id === level.id - 1)?.title ?? "السابقة"}» لفتحها`,
        variant: "destructive",
      });
      return;
    }
    launchLevelById(level.levelId, level.id);
  };

  /** اختيار بطاقة مزدوجة — تحدياتي وخريطة المعرفة شاشتان حقيقيتان */
  const handleDualCardSelect = (card: DualCardItem) => {
    if (card.id === "challenges") {
      setOverlayView("challenges");
      return;
    }
    if (card.id === "knowledge-map") {
      setOverlayView("knowledge-map");
    }
  };

  /** اختيار رابط سريع — كل الروابط أقسام حقيقية الآن:
      المكتبة والمتصدرون تبويبات، والتحدي والتوصية جلسات لعب */
  const handleQuickLinkSelect = (link: QuickLink) => {
    if (link.id === "library" || link.id === "leaderboard") {
      setActiveTab(link.id);
      return;
    }
    if (link.id === "daily-challenge") {
      launchDailyChallenge();
      return;
    }
    if (link.id === "smart-recommendation") {
      launchSmartRecommendation();
    }
  };

  /** تبديل تبويبات شريط التنقل — تبويب اللعبة يفتح أول مرحلة
     مفتوحة غير مكتملة إن لم يختر اللاعب مرحلة بعد.
     مغادرة اللعبة: إسكات أي مقطع صوتي (الجلسة تبقى حية).
     مغادرة الرئيسية تُغلق شاشات التحدّي والخريطة */
  const handleTabChange = (tabId: string) => {
    if (activeTab === "game" && tabId !== "game") {
      document.querySelectorAll("audio").forEach((audio) => audio.pause());
    }
    if (tabId !== "home" && overlayView) setOverlayView(null);
    if (tabId === "game") {
      if (!selectedLevelId) {
        const next =
          cardsWithStars.find((card) => !card.locked && card.stars === 0) ??
          cardsWithStars.find((card) => !card.locked) ??
          cardsWithStars[0];
        launchLevelById(next.levelId, next.id);
        return;
      }
      setActiveTab("game");
      return;
    }
    setActiveTab(tabId);
  };

  return (
    <div
      className={`flex flex-col bg-sand-dark ${
        activeTab === "game"
          ? "h-dvh overflow-hidden pb-[calc(68px+env(safe-area-inset-bottom))]"
          : "min-h-screen"
      }`}
    >
      {/* إطار التطبيق — عمود بعرض جوال يتوسّط الشاشة.
          في وضع اللعب: ارتفاع محسوب (إطار الشاشة ناقص شريط التنقل) */}
      <div className="app-frame relative mx-auto min-h-0 w-full max-w-md flex-1 bg-sand">
        {/* محتوى الرئيسية (وتبويباتها) — يُخفى أثناء اللعب،
            وفتح شاشة تحدياتي/الخريطة يستبدل المحتوى كاملاً */}
        {activeTab !== "game" && !overlayView && (
          <>
            <AppHeader
              coins={coinsBalance}
              onSettingsClick={openAdminPanel}
              onProfileClick={() => setActiveTab("profile")}
            />

        {/* الرئيسية — لوحة اللاعب اليومية */}
        {activeTab === "home" && (
        <main className="space-y-6 px-4 pb-32 pt-4">
          {/* 1) البطاقة الترحيبية — إحصاءات حية من التقدم المحلي */}
          <HeroCard stats={liveStats} />

          {/* 2) البطاقات المزدوجة */}
          <DualCards onSelect={handleDualCardSelect} />

          {/* 3) الروابط السريعة */}
          <QuickLinks onSelect={handleQuickLinkSelect} />

          {/* 4) المحاور الثقافية + بطاقة كتب المحور المختار */}
          <CulturalChips activeId={activeAxis} onChange={handleAxisChange} />
          <AxisPanel
            key={activeAxis}
            axisId={
              activeAxis as ComponentProps<typeof AxisPanel>["axisId"]
            }
            onOpenLibrary={() => setActiveTab("library")}
            onSuggest={() => {
              setActiveTab("profile");
              toast({
                title: "اقترح كتاباً",
                description:
                  "اكتب اقتراحك في «تواصل معنا» — فريقنا يقرأ كل رسالة",
              });
            }}
          />

          {/* 5) خريطة الفصول — قائمة حية من قاعدة الإدارة */}
          <BeginnersSection
            onSelect={handleLevelSelect}
            levels={cardsWithStars}
          />

          {/* ٥.٥) خزانة الأوسمة — إنجازات حقيقية تتحدّث لحظياً */}
          <BadgesStrip />

          {/* 6) تذييل مصغّر */}
          <footer className="pt-2 text-center">
            <p className="text-[10px] font-medium leading-relaxed text-heritage-900/45">
              ثقافتنا — منصة الثقافة العربية
              <span className="mx-1.5" aria-hidden="true">
                •
              </span>
              نسخة أولية 1.0
            </p>
          </footer>
        </main>
        )}

        {/* المكتبة — كتب منشورة من قاعدة لوحة الإدارة بتجربة قراءة كاملة */}
        {activeTab === "library" && <LibraryView />}

        {/* المتصدرون — صدارة حية من ملفات اللاعبين في قاعدة الإدارة */}
        {activeTab === "leaderboard" && <LeaderboardView />}

        {/* حسابي — ملف اللاعب الحقيقي من مخزن التقدم المحلي */}
        {activeTab === "profile" && (
          <ProfileView onOpenAdmin={openAdminPanel} />
        )}
          </>
        )}

        {/* شاشة تحدياتي — تحدي اليوم والسلسلة والمهام الأسبوعية */}
        {activeTab === "home" && overlayView === "challenges" && (
          <ChallengesView
            onBack={() => setOverlayView(null)}
            onPlayDaily={launchDailyChallenge}
            onPlaySmart={launchSmartRecommendation}
          />
        )}

        {/* شاشة خريطة المعرفة — مسار الفصول والمراحل بالنقر للتشغيل */}
        {activeTab === "home" && overlayView === "knowledge-map" && (
          <KnowledgeMapView
            onBack={() => setOverlayView(null)}
            onLaunchLevel={(levelId) => launchLevelById(levelId, 1)}
          />
        )}

        {/* شاشة تحميل المرحلة — أثناء الجلب فقط */}
        {activeTab === "game" && levelLoading && <LevelLoading />}

        {/* تجربة اللعب — تُركّب مرة وتبقى حية بين التبويبات:
            التنقّل لتبويب آخر يخفيها دون تفكيكها، فيستأنف اللاعب
            من حيث توقّف (المؤقت موقوف والصوت صامت) */}
        {activeLevel && (
          <div
            className={
              activeTab === "game" && !levelLoading
                ? "absolute inset-0"
                : "hidden"
            }
          >
            {/* المفتاح: بطاقة الجلسة — تزيد عند إطلاق جلسة جديدة
                فتُعاد تهيئة الحاوية بجلسة نظيفة، وتبقى ثابتة بين
                التبويبات داخل الجلسة نفسها (استئناف من حيث توقف) */}
            <GameContainer
              key={`${activeLevel.id}#${sessionNonce}`}
              level={activeLevel}
              initialCoins={coinsBalance}
              paused={activeTab !== "game"}
              onExit={() => setActiveTab("home")}
            />
          </div>
        )}
      </div>

      {/* 7) شريط التنقل السفلي — ثابت وظاهر دائماً، حتى أثناء اللعب
          (طلب صريح: تسهيل التنقل والمتابعة دون كسر الجلسة) */}
      <BottomTabBar activeId={activeTab} onChange={handleTabChange} />

      {/* 8) لوحة التحكم الشاملة — نافذة كاملة فوق التطبيق:
          تُدار منها المكتبة واللعبة والمجتمع والنظام، وتعود
          للتطبيق بجلسة اللعب حية كما تُركت */}
      {adminState === "login" && (
        <AdminLogin
          onSuccess={() => setAdminState("ok")}
          onCancel={() => setAdminState("idle")}
        />
      )}
      {adminState === "ok" && (
        <AdminPanel onExit={() => setAdminState("idle")} />
      )}
    </div>
  );
}
