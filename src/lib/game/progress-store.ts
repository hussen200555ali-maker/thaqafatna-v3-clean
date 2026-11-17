/**
 * مخزن اللاعب (Player Store) — التقدم والاقتصاد والأوسمة
 * ==========================================================
 * أساس نظام التقدّم — تخزين محلي أولاً (Local-First) بثلاثة أقسام:
 *
 *   1) التقدم (progress): نجوم كل مرحلة وأفضل نقاط وسياق الجلسة
 *      (تلميحات/زمن/صعوبة/فصل) — لدعم الأوسمة والقفل التدريجي.
 *   2) الاقتصاد (economy): رصيد عملات دائم يتراكم بين الجلسات.
 *   3) الأوسمة (badges): معرّف ← تاريخ الفوز — تُقيَّم شروطها عند
 *      كل نتيجة، وما يتحقق جديداً يُعاد للواجهة لتحتفل به.
 *
 * قراءة متزامنة من localStorage + إشعار المشتركين عند التغيير
 * (نفس نوّاب React — بلا مكتبات خارجية).
 *
 * جاهز للترقية لاحقاً: نفس الواجهة تُدار من الخادم عند إضافة
 * الحسابات (المرحلة 7) — المكونات لن تتغير.
 */

"use client";

import { useEffect, useState } from "react";

/* ============================================================
   المفاتيح والأحداث
   ============================================================ */

const PROGRESS_KEY = "thaqafatna:progress:v1";
const ECONOMY_KEY = "thaqafatna:economy:v1";
const BADGES_KEY = "thaqafatna:badges:v1";
/** حدث موحّد — أي كتابة في أي قسم تُبثّ لكل النوّاب */
const PLAYER_EVENT = "thaqafatna:player";

/** الرصيد الافتتاحي للعملة عند أول تشغيل */
export const STARTING_COINS = 120;

/* ============================================================
   الأشكال (Types)
   ============================================================ */

/** نتيجة مرحلة واحدة محفوظة */
export interface LevelProgress {
  stars: number;
  bestPoints: number;
  completedAt: string;
  /** أفضل عدد تلميحات استُخدم في إكمال ناجح (الأقل) */
  hintsUsed: number;
  /** أفضل زمن إكمال بالثواني (الأقل) — null لمراحل بلا وقت */
  timeTaken: number | null;
  difficulty: string | null;
  chapterTitle: string | null;
}

/** خريطة معرّف المرحلة ← نتيجتها */
export type ProgressMap = Record<string, LevelProgress>;

/** رصيد الاقتصاد */
interface Economy {
  coins: number;
}

/** خريطة الأوسمة المفتوحة — معرّف ← تاريخ الفوز */
export type BadgeMap = Record<string, string>;

/** سياق نهاية جلسة لعب — كل ما تحتاجه الأوسمة والمكافآت */
export interface LevelResultContext {
  /** تلميحات هذه الجلسة (شراء زر التلميح + درجات السُلّم) */
  hintsUsed: number;
  /** زمن الجلسة بالثواني — null إن كانت بلا مؤقت */
  timeTaken: number | null;
  /** حد وقت المرحلة بالثواني — صفر = بلا وقت */
  timeLimit: number;
  /** ما تبقى من عملات في نهاية الجلسة */
  coinsLeft: number;
  /** مكافأة الإكمال الأولى (من قاعدة الإدارة) */
  levelReward: number;
  difficulty: string | null;
  chapterTitle: string | null;
}

/* ============================================================
   طبقة القراءة/الكتابة النقية
   ============================================================ */

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(PLAYER_EVENT));
  } catch {
    /* التخزين ممتلئ أو معطّل — التقدم في هذه الجلسة فقط */
  }
}

function readProgress(): ProgressMap {
  return readJson<ProgressMap>(PROGRESS_KEY, {});
}

function readEconomy(): Economy {
  return readJson<Economy>(ECONOMY_KEY, { coins: STARTING_COINS });
}

function readBadges(): BadgeMap {
  return readJson<BadgeMap>(BADGES_KEY, {});
}

/* ============================================================
   الأوسمة — تقييم الشروط (منطق نقي قابل للاختبار)
   ============================================================ */

/** شروط الأوسمة الثمانية — تُقيَّم بعد تحديث التقدم مباشرة */
function computeUnlockedBadges(
  map: ProgressMap,
  ctx: LevelResultContext | null,
): string[] {
  const completed = Object.values(map).filter((e) => e.stars > 0);
  const totalStars = completed.reduce((sum, e) => sum + e.stars, 0);
  const perfectCount = completed.filter((e) => e.stars === 3).length;
  const distinctChapters = new Set(
    completed
      .map((e) => e.chapterTitle?.trim())
      .filter((title): title is string => Boolean(title)),
  ).size;
  const hasHard = completed.some((e) => e.difficulty === "hard");

  const conditions: Record<string, boolean> = {
    "first-steps": completed.length >= 1,
    "golden-trio": perfectCount >= 1,
    "clear-mind":
      ctx !== null && ctx.hintsUsed === 0 && completed.length >= 1,
    "quick-mind":
      ctx !== null &&
      ctx.timeLimit > 0 &&
      ctx.timeTaken !== null &&
      ctx.timeTaken <= ctx.timeLimit / 2 &&
      completed.length >= 1,
    "chapter-knight": distinctChapters >= 3,
    "fortress-hero": hasHard,
    "star-collector": totalStars >= 9,
    perfectionist: perfectCount >= 3,
  };

  return Object.entries(conditions)
    .filter(([, met]) => met)
    .map(([id]) => id);
}

/* ============================================================
   الواجهة العامة — الكتابة
   ============================================================ */

/**
 * تسجيل نتيجة جلسة لعب — القلب النابض للنظام:
 *
 *   • يحتفظ بالأفضل دائماً (نجوم/نقاط/زمن/تلميحات).
 *   • يمنح مكافأة الإكمال الأولى كاملة، وخُمسها عند الإعادة.
 *   • يحفظ رصيد العملات المتبقي + المكافأة.
 *   • يقيّم شروط الأوسمة ويعيد المفتوحة حديثاً (للاحتفال بها).
 */
export function recordLevelResult(
  levelId: string,
  stars: number,
  points: number,
  ctx: LevelResultContext,
): string[] {
  const map = readProgress();
  const prev = map[levelId];
  const firstCompletion = stars > 0 && !prev;

  /* 1) التقدم — إكمال ناجح فقط (نجمة فأكثر) */
  if (stars > 0) {
    map[levelId] = {
      stars: Math.max(stars, prev?.stars ?? 0),
      bestPoints: Math.max(points, prev?.bestPoints ?? 0),
      completedAt: new Date().toISOString(),
      hintsUsed: Math.min(ctx.hintsUsed, prev?.hintsUsed ?? Infinity),
      timeTaken:
        ctx.timeTaken === null
          ? (prev?.timeTaken ?? null)
          : prev?.timeTaken == null
            ? ctx.timeTaken
            : Math.min(ctx.timeTaken, prev.timeTaken),
      difficulty: ctx.difficulty,
      chapterTitle: ctx.chapterTitle,
    };
  }
  writeJson(PROGRESS_KEY, map);

  /* 2) الاقتصاد — المتبقي + مكافأة الإكمال (كاملة أول مرة، خُمسها إعادة) */
  const bonus = firstCompletion
    ? ctx.levelReward
    : stars > 0
      ? Math.max(5, Math.round(ctx.levelReward * 0.2))
      : 0;
  const economy = readEconomy();
  economy.coins = Math.max(0, ctx.coinsLeft + bonus);
  writeJson(ECONOMY_KEY, economy);

  /* 3) الأوسمة — ما تحقق ولم يكن مفتوحاً من قبل */
  const badges = readBadges();
  const unlocked = computeUnlockedBadges(map, stars > 0 ? ctx : null);
  const fresh = unlocked.filter((id) => !(id in badges));
  const now = new Date().toISOString();
  for (const id of fresh) badges[id] = now;
  if (fresh.length > 0) writeJson(BADGES_KEY, badges);

  return fresh;
}

/* ============================================================
   الواجهة العامة — القراءة
   ============================================================ */

/** رصيد العملات الدائم */
export function getCoins(): number {
  return readEconomy().coins;
}

/** ضبط رصيد العملات مباشرة (استخدامات مستقبلية: مكافآت يومية) */
export function setCoins(value: number): void {
  writeJson(ECONOMY_KEY, { coins: Math.max(0, Math.round(value)) });
}

/** نجوم مرحلة معيّنة — صفر إن لم تُلعب بعد */
export function getLevelStars(levelId: string): number {
  return readProgress()[levelId]?.stars ?? 0;
}

/** الأوسمة المفتوحة — خريطة كاملة */
export function getUnlockedBadges(): BadgeMap {
  return readBadges();
}

/**
 * تصفير بيانات اللاعب المحلية كاملة — التقدم والاقتصاد والأوسمة.
 * تُستخدم من إعدادات لوحة الإدارة (وضع الاختبار) — وبعدها يبدأ
 * اللاعب من الرصيد الافتتاحي كأول تشغيل.
 */
export function resetPlayerData(): void {
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(ECONOMY_KEY);
  localStorage.removeItem(BADGES_KEY);
  window.dispatchEvent(new Event(PLAYER_EVENT));
}

/* ============================================================
   النوّاب (Hooks) — تتحدّث تلقائياً عند أي كتابة
   ============================================================ */

/**
 * نوب مشترك في أحداث اللاعب — أساس كل النوّاب المتخصصة.
 *
 * أمان الإرواء (SSR): القيمة الابتدائية ثابتة لا تقرأ التخزين،
 * فتتطابق مع ما صيّره الخادم حرفياً، ثم تتم المزامنة الأولى بعد
 * التركيب (useEffect) — فلا انفصام إرواء أبداً.
 */
function usePlayerStore<T>(read: () => T, initial: T): T {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    const sync = () => setValue(read());
    sync();
    window.addEventListener(PLAYER_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PLAYER_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return value;
}

/** نوب التقدم الكامل */
export function useProgress(): ProgressMap {
  return usePlayerStore(readProgress, {});
}

/** نوب رصيد العملات الدائم */
export function useCoins(): number {
  return usePlayerStore(() => readEconomy().coins, STARTING_COINS);
}

/** نوب الأوسمة المفتوحة */
export function useBadges(): BadgeMap {
  return usePlayerStore(readBadges, {});
}
