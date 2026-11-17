/**
 * مزامنة اللاعب (Player Sync) — جسر محلي/سحابي مؤقت
 * =====================================================
 * التطبيق «محلي أولاً» (Local-First): التقدم والعملات والأوسمة
 * تعيش في localStorage. هذه الطبقة ترفع نسخة إحصائية خفيفة
 * من اللاعب إلى قاعدة لوحة الإدارة (مرتبطة بمعرّف الجهاز)
 * فتغذي صفحتي «اللاعبون» و«المتصدرون» ببيانات حقيقية —
 * دون تسجيل دخول (يُستبدل بنظام الحسابات لاحقاً دون تغيير
 * أي مكون، لأن كل الواجهات تمرّ من هنا).
 */

"use client";

const DEVICE_KEY = "thaqafatna:device-id";
const NAME_KEY = "thaqafatna:player-name";

/** الاسم الافتراضي للاعب جديد */
export const DEFAULT_PLAYER_NAME = "ضيف ثقافتنا";

/* ============================================================
   مفتاح اليوم — YYYY-MM-DD بتوقيت الرياض (توحيد تحدي اليوم
   بين الخادم وتطبيق اللاعب حيثما فُتح)
   ============================================================ */

export function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
  }).format(new Date());
}

/* ============================================================
   معرّف الجهاز — يولَّد مرة ويبقى ثابتاً على هذا الجهاز
   ============================================================ */

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `dev-${crypto.randomUUID()}`;
    try {
      window.localStorage.setItem(DEVICE_KEY, id);
    } catch {
      /* تخزين معطّل — مزامنة هذا الاستدعاء فقط */
    }
  }
  return id;
}

/* ============================================================
   اسم اللاعب — قابل للتحرير من صفحة «حسابي»
   ============================================================ */

export function getPlayerName(): string {
  if (typeof window === "undefined") return DEFAULT_PLAYER_NAME;
  return (
    window.localStorage.getItem(NAME_KEY)?.trim() || DEFAULT_PLAYER_NAME
  );
}

export function setPlayerName(name: string): void {
  if (typeof window === "undefined") return;
  const clean = name.trim().slice(0, 24);
  if (!clean) return;
  try {
    window.localStorage.setItem(NAME_KEY, clean);
  } catch {
    /* تجاهل — الاسم يبقى في هذه الجلسة */
  }
}

/* ============================================================
   الإحصاءات المرفوعة — نسخة خفيفة من مخزن اللاعب
   ============================================================ */

export interface SyncStats {
  points: number;
  stars: number;
  badgesCount: number;
  coins: number;
  levelsCompleted: number;
}

/**
 * رفع إحصاءات اللاعب إلى القاعدة — Upsert بمعرّف الجهاز.
 *
 * «اطلاق ونسيان» (Fire-and-forget): لا تنتظر ولا ترمي — فشلُ
 * المزامنة لا يعطّل اللعب المحلي أبداً، وتُعاد المحاولة عند
 * أول تغيير قادم (تُستدعى Debounced من الرئيسية).
 */
export function syncPlayerProgress(stats: SyncStats): void {
  if (typeof window === "undefined") return;
  const deviceId = getDeviceId();
  if (!deviceId) return;

  void fetch("/api/players/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceId,
      name: getPlayerName(),
      points: Math.max(0, Math.round(stats.points)),
      stars: Math.max(0, Math.round(stats.stars)),
      badgesCount: Math.max(0, Math.round(stats.badgesCount)),
      coins: Math.max(0, Math.round(stats.coins)),
      levelsCompleted: Math.max(0, Math.round(stats.levelsCompleted)),
    }),
  }).catch(() => {
    /* بلا اتصال — التقدم المحلي لا يتأثر */
  });
}
