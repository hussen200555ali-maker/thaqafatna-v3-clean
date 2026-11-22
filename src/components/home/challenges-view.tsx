"use client";

/**
 * شاشة «تحدياتي» — تحدي اليوم والسلسلة والمهام الأسبوعية
 * =======================================================
 * شاشة كاملة داخل إطار التطبيق (تُركّبها الصفحة الرئيسية):
 *   1) بطاقة تحدي اليوم — مكافأتها من /api/settings (افتراضي ٥٠)
 *      وحالتها من مخزن التقدم بمفتاح daily-YYYY-MM-DD
 *   2) سلسلة الأيام (Streak) — تُحسب من مفاتيح التحديات
 *      المكتملة: أطول سلسلة متتالية منتهية باليوم أو أمس
 *   3) المهام الأسبوعية الخمس — تقدم حقيقي من مخزن اللاعب
 *   4) توصية ذكية — زر ثانوي يفتح خمسة ألغاز حسب التقدم
 */

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Coins,
  Flame,
  Sparkles,
  Star,
  Swords,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProgress, type ProgressMap } from "@/lib/game/progress-store";
import {
  formatFullArabicDate,
  useRiyadhDayKey,
} from "@/lib/riyadh-date";

/** واجهة خصائص الشاشة — الأب يجلب المرحلة ويركّبها */
interface ChallengesViewProps {
  onBack: () => void;
  /** يشغّل تحدي اليوم — الأب يجلب المرحلة ويركّبها */
  onPlayDaily: () => void;
  /** يشغّل التوصية الذكية */
  onPlaySmart: () => void;
}

/** مكافأة تحدي اليوم الافتراضية عند تعذّر بلوغ الإعدادات */
const DEFAULT_DAILY_REWARD = 50;

/** بادئة مفاتيح تحديات الأيام في مخزن التقدم */
const DAILY_PREFIX = "daily-";

/* ============================================================
   حسابات نقية — التواريخ والسلسلة
   ============================================================ */

/** مفاتيح تحديات الأيام المكتملة (نجمة فأكثر) — YYYY-MM-DD فقط */
function completedDayKeys(progress: ProgressMap): string[] {
  return Object.entries(progress)
    .filter(
      ([key, entry]) =>
        key.startsWith(DAILY_PREFIX) && entry.stars > 0,
    )
    .map(([key]) => key.slice(DAILY_PREFIX.length))
    .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key));
}

/**
 * أطول سلسلة أيام متتالية منتهية باليوم أو أمس:
 * كل تاريخ يُحوَّل إلى Date UTC بمفتاحه ثم تُقارن الفروق بالأيام
 * (فروق UTC تتجاوز مشاكل التوقيت الصيفي والمناطق الزمنية).
 */
function computeStreak(dayKeys: string[], today: string): number {
  const DAY_MS = 86_400_000;
  const toUtc = (key: string) => {
    const date = new Date(key + "T00:00:00Z").getTime();
    return Number.isNaN(date) ? null : date;
  };

  const days = new Set<number>();
  for (const key of dayKeys) {
    const time = toUtc(key);
    if (time !== null) days.add(time);
  }

  const todayTime = toUtc(today);
  if (todayTime === null) return 0;

  /* السلسلة تبدأ من اليوم، أو من أمس إن لم يُكمل تحدي اليوم بعد */
  let cursor = todayTime;
  if (!days.has(cursor)) {
    cursor = todayTime - DAY_MS;
    if (!days.has(cursor)) return 0;
  }

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= DAY_MS;
  }
  return streak;
}

/** شكل مهمة أسبوعية — قيمة حقيقية تُقارن بهدفها */
interface WeeklyMission {
  id: string;
  title: string;
  icon: typeof Target;
  value: number;
  target: number;
  /** وحدة العرض الاختيارية بجانب العدّاد */
  unit?: string;
}

export function ChallengesView({
  onBack,
  onPlayDaily,
  onPlaySmart,
}: ChallengesViewProps) {
  const progress = useProgress();
  const [dailyReward, setDailyReward] = useState(DEFAULT_DAILY_REWARD);

  /* ===== مكافأة تحدي اليوم من إعدادات القاعدة — fallback صامت ===== */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/settings");
        const data = (await response.json()) as {
          ok: boolean;
          settings?: { dailyChallengeReward?: number };
        };
        if (cancelled || !data.ok) return;
        const reward = Number(data.settings?.dailyChallengeReward);
        if (Number.isFinite(reward) && reward > 0) {
          setDailyReward(reward);
        }
      } catch {
        /* بلا اتصال — المكافأة الافتراضية (٥٠) تكفي */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ===== حالة تحدي اليوم وسلسلة الأيام — من التقدم المحلي ===== */
  const today = useRiyadhDayKey();
  const dailyEntry = progress[DAILY_PREFIX + today];
  const dailyDone = (dailyEntry?.stars ?? 0) > 0;
  const dailyStars = dailyEntry?.stars ?? 0;

  const streak = useMemo(
    () => computeStreak(completedDayKeys(progress), today),
    [progress, today],
  );

  /* ===== المهام الأسبوعية — كلها من مخزن اللاعب الحقيقي ===== */
  const missions = useMemo<WeeklyMission[]>(() => {
    const entries = Object.entries(progress);
    const completed = entries.filter(([, entry]) => entry.stars > 0);
    const totalStars = completed.reduce(
      (sum, [, entry]) => sum + entry.stars,
      0,
    );
    const totalPoints = completed.reduce(
      (sum, [, entry]) => sum + entry.bestPoints,
      0,
    );
    /* المراحل المكتملة — بلا تحديات الأيام */
    const levelsDone = entries.filter(
      ([key, entry]) => !key.startsWith(DAILY_PREFIX) && entry.stars > 0,
    ).length;
    /* إكمال بلا تلميحات — أفضل جلسة بلا أي تلميح */
    const noHintsDone = entries.some(
      ([key, entry]) =>
        !key.startsWith(DAILY_PREFIX) &&
        entry.stars > 0 &&
        entry.hintsUsed === 0,
    );

    return [
      {
        id: "daily",
        title: "أكمل تحدي اليوم",
        icon: Flame,
        value: dailyDone ? 1 : 0,
        target: 1,
      },
      {
        id: "stars",
        title: "اجمع ١٥ نجمة",
        icon: Star,
        value: totalStars,
        target: 15,
        unit: "نجمة",
      },
      {
        id: "levels",
        title: "أكمل ٣ مراحل مختلفة",
        icon: Swords,
        value: levelsDone,
        target: 3,
        unit: "مراحل",
      },
      {
        id: "no-hints",
        title: "أنهِ مرحلة بلا تلميحات",
        icon: Zap,
        value: noHintsDone ? 1 : 0,
        target: 1,
      },
      {
        id: "points",
        title: "اكسب ٥٠٠ نقطة",
        icon: Trophy,
        value: totalPoints,
        target: 500,
        unit: "نقطة",
      },
    ];
  }, [progress, dailyDone]);

  const missionsDone = missions.filter(
    (mission) => mission.value >= mission.target,
  ).length;

  return (
    <main className="space-y-5 px-4 pb-32 pt-4">
      {/* الترويسة — عودة + بطاقة أيقونة اللهب + العنوان */}
      <header className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="رجوع"
          className="-me-1 text-heritage-700 hover:bg-sand-dark/50 hover:text-heritage-900"
        >
          <ArrowRight className="size-5" aria-hidden="true" />
        </Button>
        <span
          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-flame-400 via-flame-500 to-flame-600 text-white shadow-card"
          aria-hidden="true"
        >
          <Swords className="size-5.5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-extrabold text-heritage-900">
            تحدياتي
          </h2>
          <p className="text-[11px] font-medium text-muted-foreground">
            تحدٍّ يومي ومهام أسبوعية وسلسلة التزام متّصلة
          </p>
        </div>
      </header>

      {/* بطاقة تحدي اليوم — مكافأة من الإعدادات وحالة من التقدم */}
      <section
        aria-label="تحدي اليوم"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-flame-400 via-flame-500 to-flame-600 p-5 text-white shadow-card"
      >
        {/* توهج زخرفي */}
        <span
          className="pointer-events-none absolute -bottom-10 -end-10 size-36 rounded-full bg-white/10 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="grid size-9 place-items-center rounded-xl bg-white/20 backdrop-blur-sm"
              aria-hidden="true"
            >
              <Flame className="size-4.5" />
            </span>
            <div className="leading-tight">
              <h3 className="font-heading text-sm font-extrabold">
                تحدي اليوم
              </h3>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-white/80">
                <CalendarDays className="size-3" aria-hidden="true" />
                {formatFullArabicDate(today)}
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm">
            <Coins className="size-3 text-gold-300" aria-hidden="true" />
            {dailyReward.toLocaleString("ar-EG")} عملة
          </span>
        </div>

        {dailyDone ? (
          /* مكتمل — شارة إتمام ذهبية ونجوم اليوم */
          <div className="relative mt-4 space-y-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-gold-500 px-3 py-1 text-[10px] font-extrabold text-heritage-950">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                أكملت تحدي اليوم
              </span>
              <span
                className="flex shrink-0 gap-0.5"
                role="img"
                aria-label={`${dailyStars.toLocaleString("ar-EG")} من ٣ نجوم`}
              >
                {[1, 2, 3].map((star) => (
                  <Star
                    key={star}
                    className={`size-4 ${
                      star <= dailyStars
                        ? "fill-gold-400 text-gold-400"
                        : "fill-transparent text-white/40"
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </span>
            </div>
            <p className="text-[11px] font-medium leading-relaxed text-white/85">
              عد غداً لتحدٍّ جديد — السلسلة المتّصلة تحفظ إنجازك
              ولا تسمح للتوقف الطويل
            </p>
          </div>
        ) : (
          /* متاح — زر كبير لتشغيل التحدي */
          <div className="relative mt-4">
            <p className="text-[11px] font-medium leading-relaxed text-white/85">
              خمسة ألغاز تتغيّر كل يوم — أكملها قبل منتصف الليل
              واحصد المكافأة كاملة
            </p>
            <Button
              size="lg"
              onClick={onPlayDaily}
              className="mt-3.5 w-full gap-2 rounded-2xl bg-white font-heading text-sm font-extrabold text-flame-600 shadow-card hover:bg-gold-100"
            >
              <Flame className="size-4.5" aria-hidden="true" />
              العب تحدي اليوم
            </Button>
          </div>
        )}
      </section>

      {/* سلسلة الأيام — عدد كبير وأيقونة لهب وشرح لطيف */}
      <section
        aria-label="سلسلة الأيام المتتالية"
        className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card"
      >
        <span
          className="grid size-14 shrink-0 place-items-center rounded-2xl bg-flame-100 text-flame-600"
          aria-hidden="true"
        >
          <Flame className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="font-heading text-3xl font-extrabold leading-none text-heritage-900">
              {streak.toLocaleString("ar-EG")}
            </p>
            <p className="text-xs font-bold text-heritage-700">
              أيام متتالية
            </p>
          </div>
          <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-muted-foreground">
            {streak > 0
              ? "التزام رائع! أكمل تحدي كل يوم لتطيل سلسلتك — يوماً واحداً من التوقف يعيدها إلى الصفر"
              : "ابدأ سلسلتك اليوم — يوم واحد من التحديات المتتالية يفتح العداد"}
          </p>
        </div>
      </section>

      {/* المهام الأسبوعية — تقدم حقيقي بشريط وشارة إتمام */}
      <section aria-label="المهام الأسبوعية" className="space-y-3">
        <h3 className="flex items-center justify-between font-heading text-sm font-extrabold text-heritage-900">
          المهام الأسبوعية
          <span className="text-[10px] font-bold text-muted-foreground">
            {missionsDone.toLocaleString("ar-EG")} من{" "}
            {missions.length.toLocaleString("ar-EG")} مكتملة
          </span>
        </h3>

        <ul className="space-y-2.5">
          {missions.map((mission) => {
            const done = mission.value >= mission.target;
            const percent = Math.min(
              100,
              Math.round((mission.value / mission.target) * 100),
            );
            const Icon = mission.icon;
            return (
              <li
                key={mission.id}
                className={`flex items-center gap-3.5 rounded-2xl p-3.5 shadow-card ${
                  done ? "bg-gold-100/60" : "bg-white"
                }`}
                aria-label={`مهمة ${mission.title}${
                  done ? " — مكتملة" : ""
                }`}
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                    done
                      ? "bg-gold-500 text-heritage-950"
                      : "bg-heritage-100 text-heritage-700"
                  }`}
                  aria-hidden="true"
                >
                  <Icon className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-xs font-bold ${
                        done ? "text-heritage-900" : "text-heritage-900/85"
                      }`}
                    >
                      {mission.title}
                    </p>
                    {done ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-gold-500 px-2 py-0.5 text-[9px] font-extrabold text-heritage-950">
                        <CheckCircle2 className="size-3" aria-hidden="true" />
                        أُنجزت
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] font-bold text-muted-foreground">
                        {Math.min(mission.value, mission.target).toLocaleString(
                          "ar-EG",
                        )}
                        {" / "}
                        {mission.target.toLocaleString("ar-EG")}
                        {mission.unit ? ` ${mission.unit}` : ""}
                      </span>
                    )}
                  </div>
                  <Progress
                    value={percent}
                    className="mt-2 h-1.5 bg-heritage-900/10"
                    aria-label={`تقدم المهمة ${percent.toLocaleString("ar-EG")}%`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* التوصية الذكية — زر ثانوي بوصف لطيف */}
      <button
        type="button"
        onClick={onPlaySmart}
        className="flex w-full items-center gap-3.5 rounded-2xl border border-gold-500/30 bg-gold-100/50 p-4 text-start shadow-card transition-all duration-150 hover:bg-gold-100 active:scale-[0.99]"
        aria-label="توصية ذكية لك"
      >
        <span
          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-heritage-900 text-gold-400"
          aria-hidden="true"
        >
          <Sparkles className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-sm font-extrabold text-heritage-900">
            توصية ذكية لك
          </span>
          <span className="mt-0.5 block text-[10px] font-medium leading-relaxed text-heritage-700/75">
            خمسة ألغاز تُختار حسب تقدمك ومستواك
          </span>
        </span>
      </button>
    </main>
  );
}
