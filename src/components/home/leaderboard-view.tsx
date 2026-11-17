"use client";

/**
 * لوحة المتصدّرين — صدارة حيّة من قاعدة اللاعبين
 * ==============================================
 * عند التحميل تُجلب أعلى ١٠ من GET /api/leaderboard بمعرّف الجهاز:
 * منصة تتويج الثلاثة + بقية الترتيب + بطاقة «مركزك» بمركزك الحقيقي
 * من الخادم ونقاطك من التقدم المحلي — وإن كنت ضمن العشرة أبرز
 * صفك بشارة «أنت».
 *
 * تعذّر الجلب (مسار غير جاهز أو بلا اتصال): وضع عرض كامل
 * ببيانات تجريبية مع شارة صادقة «وضع العرض»، والمركز يُحسب
 * محلياً من تقدمك الفعلي — وعند النجاح تُستبدل بشارة «صدارة حية».
 */

import { useEffect, useState } from "react";
import { Crown, Medal, Star, Trophy } from "lucide-react";
import {
  DEFAULT_PLAYER_NAME,
  getDeviceId,
  getPlayerName,
} from "@/lib/game/player-sync";
import { useBadges, useCoins, useProgress } from "@/lib/game/progress-store";

/** متصدر كما يرد من GET /api/leaderboard */
interface LeaderRow {
  name: string;
  points: number;
  stars: number;
  levelsCompleted: number;
  isMe: boolean;
}

/** استجابة GET /api/leaderboard?deviceId=… */
interface LeaderboardResponse {
  ok: boolean;
  leaders?: LeaderRow[];
  myRank?: number | null;
  totalPlayers?: number;
}

/** صف موحّد للعرض — حي أو تجريبي */
interface BoardEntry {
  name: string;
  points: number;
  stars: number;
  levels: number;
  isMe: boolean;
}

/** لوحة حيّة جاهزة للعرض — null يعني وضع العرض التجريبي */
interface LiveBoard {
  board: BoardEntry[];
  myRank: number | null;
  totalPlayers: number;
}

/** منافسون تجريبيون — من أروقة التراث العربي (شبكة أمان العرض) */
const DEMO_COMPETITORS: BoardEntry[] = [
  { name: "صقر الجزيرة", points: 2140, stars: 24, levels: 9, isMe: false },
  { name: "ابن بطوطة", points: 1865, stars: 21, levels: 8, isMe: false },
  { name: "شهرزاد", points: 1590, stars: 19, levels: 8, isMe: false },
  { name: "زرياب الأندلس", points: 1235, stars: 16, levels: 7, isMe: false },
  { name: "الجاحظ", points: 975, stars: 13, levels: 6, isMe: false },
  { name: "عنترة", points: 640, stars: 9, levels: 4, isMe: false },
  { name: "الخنساء", points: 385, stars: 6, levels: 3, isMe: false },
  { name: "طرفة بن العبد", points: 160, stars: 3, levels: 2, isMe: false },
];

/** ألوان مراكز الثلاثة الأولين على المنصة */
const PODIUM_CLASSES = [
  { badge: "bg-gradient-to-br from-gold-400 to-gold-600 text-heritage-950", label: "الأول" },
  { badge: "bg-gradient-to-br from-heritage-300 to-heritage-500 text-white", label: "الثاني" },
  { badge: "bg-gradient-to-br from-flame-400 to-flame-600 text-white", label: "الثالث" },
];

/** دائرة الاسم بأول حرف */
function Avatar({ name, className }: { name: string; className: string }) {
  return (
    <span
      className={`grid size-10 shrink-0 place-items-center rounded-full font-heading text-sm font-extrabold ${className}`}
      aria-hidden="true"
    >
      {name.trim().slice(0, 1)}
    </span>
  );
}

export function LeaderboardView() {
  const progress = useProgress();
  const coins = useCoins();
  const badges = useBadges();

  /* اللوحة الحية — null حتى ينجح الجلب أو يفشل نهائياً */
  const [liveBoard, setLiveBoard] = useState<LiveBoard | null>(null);

  /* اسم اللاعب — أمان الإرواء: ثابت أولاً ثم مزامنة بعد التركيب */
  const [playerName, setPlayerName] = useState(DEFAULT_PLAYER_NAME);

  /* ===== الجلب الأولي — الصدارة الحية واسم اللاعب معاً =====
     فشل صامت إلى وضع العرض التجريبي */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const deviceId = getDeviceId();
        const response = await fetch(
          `/api/leaderboard?deviceId=${encodeURIComponent(deviceId)}`,
        );
        const data = (await response.json()) as LeaderboardResponse;
        if (cancelled) return;
        setPlayerName(getPlayerName());
        if (!data.ok || !Array.isArray(data.leaders)) return;
        setLiveBoard({
          board: data.leaders.map((leader) => ({
            name: leader.name,
            points: leader.points,
            stars: leader.stars,
            levels: leader.levelsCompleted,
            isMe: Boolean(leader.isMe),
          })),
          myRank:
            typeof data.myRank === "number" && data.myRank > 0
              ? data.myRank
              : null,
          totalPlayers:
            typeof data.totalPlayers === "number" && data.totalPlayers > 0
              ? data.totalPlayers
              : data.leaders.length,
        });
      } catch {
        /* بلا اتصال — وضع العرض التجريبي يكفي، والاسم يُزامن أيضاً */
        if (!cancelled) setPlayerName(getPlayerName());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* تقدمك الحقيقي — من مخزن اللاعب المحلي */
  const completed = Object.values(progress).filter(
    (entry) => entry.stars > 0,
  ).length;
  const myPoints = Object.values(progress).reduce(
    (sum, entry) => sum + entry.bestPoints,
    0,
  );
  const myStars = Object.values(progress).reduce(
    (sum, entry) => sum + entry.stars,
    0,
  );

  /* وضع العرض: دمجك مع المنافسين وترتيب الجميع تنازلياً */
  const demoBoard = [
    ...DEMO_COMPETITORS,
    { name: "أنت", points: myPoints, stars: myStars, levels: completed, isMe: true },
  ].sort((a, b) => b.points - a.points);
  const demoRank = demoBoard.findIndex((entry) => entry.isMe) + 1;

  /* الصفحة النهائية: حية عند النجاح، تجريبية عند التعذّر */
  const live = liveBoard !== null;
  const board = live ? liveBoard.board : demoBoard;
  const myRank = live ? liveBoard.myRank : demoRank;
  const totalPlayers = live ? liveBoard.totalPlayers : board.length;

  return (
    <main className="space-y-5 px-4 pb-32 pt-4">
      {/* الترويسة — مع شارة مصدر الصدارة */}
      <header className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-heritage-950 shadow-card">
          <Trophy className="size-5.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-extrabold text-heritage-900">
            المتصدّرون
          </h2>
          <p className="text-[11px] font-medium text-muted-foreground">
            صدارة هذا الأسبوع — {totalPlayers.toLocaleString("ar-EG")} لاعباً
          </p>
        </div>
        {live ? (
          <span
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[9px] font-bold text-emerald-700"
            aria-label="بيانات حية من قاعدة اللاعبين"
          >
            <span
              className="size-1.5 animate-pulse rounded-full bg-emerald-500"
              aria-hidden="true"
            />
            صدارة حية
          </span>
        ) : (
          <span
            className="shrink-0 rounded-full bg-gold-100 px-2.5 py-1 text-[9px] font-bold text-gold-700"
            aria-label="بيانات تجريبية للعرض"
          >
            وضع العرض — بيانات تجريبية
          </span>
        )}
      </header>

      {/* بطاقتك — مركزك الحقيقي ونقاطك المحلية */}
      <section
        aria-label="مركزك الحالي"
        className="overflow-hidden rounded-2xl bg-heritage-900 shadow-card"
      >
        <div className="flex items-center gap-3.5 p-5">
          <span className="relative grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 font-heading text-lg font-extrabold text-heritage-950">
            {myRank !== null ? myRank.toLocaleString("ar-EG") : "—"}
            <span className="absolute -bottom-2 -end-2 grid size-7 place-items-center rounded-full bg-heritage-950 text-gold-400 ring-2 ring-gold-500/40">
              <Crown className="size-3.5" aria-hidden="true" />
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-sm font-extrabold text-white">
              أنت — {playerName}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-heritage-100/70">
              <span>
                {myPoints.toLocaleString("ar-EG")} نقطة حقيقية
              </span>
              <span>
                {myStars.toLocaleString("ar-EG")} نجمة
              </span>
              <span>
                {completed.toLocaleString("ar-EG")} مراحل مكتملة
              </span>
              <span>{coins.toLocaleString("ar-EG")} عملة</span>
              <span>
                {Object.keys(badges).length.toLocaleString("ar-EG")} أوسمة
              </span>
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 bg-white/5 px-5 py-2.5">
          <p className="text-[10px] font-medium leading-relaxed text-heritage-100/60">
            {live
              ? "لوحة حيّة من قاعدة اللاعبين — تُحدَّث فور مزامنة تقدمك بعد كل مرحلة"
              : "مركزك محسوب من تقدمك الفعلي في اللعبة — المنافسون بيانات تجريبية لحظة إطلاق المنصة، وتتحول اللوحة إلى صدارة حيّة فور توفر الاتصال"}
          </p>
        </div>
      </section>

      {/* منصة التتويج — الثلاثة الأوائل */}
      {board.length > 0 && (
        <section aria-label="منصة التتويج" className="grid grid-cols-3 gap-2.5">
          {[1, 0, 2].map((boardIndex) => {
            const entry = board[boardIndex];
            if (!entry) return null;
            const podium = PODIUM_CLASSES[boardIndex];
            return (
              <div
                key={`${entry.name}-${boardIndex}`}
                className={`flex flex-col items-center gap-2 rounded-2xl p-4 text-center shadow-card ${
                  entry.isMe ? "bg-heritage-900" : "bg-white"
                }`}
              >
                <Avatar
                  name={entry.name}
                  className={podium.badge}
                />
                <div className="min-w-0">
                  <p
                    className={`truncate font-heading text-xs font-extrabold ${
                      entry.isMe ? "text-white" : "text-heritage-900"
                    }`}
                  >
                    {entry.name}
                    {entry.isMe && (
                      <span className="mx-1 rounded-full bg-gold-500/20 px-1.5 py-0.5 text-[8px] font-bold text-gold-400">
                        أنت
                      </span>
                    )}
                  </p>
                  <p
                    className={`mt-0.5 text-[10px] font-bold ${
                      entry.isMe ? "text-gold-400" : "text-muted-foreground"
                    }`}
                  >
                    {entry.points.toLocaleString("ar-EG")} نقطة
                  </p>
                  <p
                    className={`mt-0.5 flex items-center justify-center gap-1 text-[9px] font-bold ${
                      entry.isMe
                        ? "text-heritage-100/70"
                        : "text-heritage-700/70"
                    }`}
                  >
                    <Star
                      className={`size-2.5 ${entry.isMe ? "fill-gold-400 text-gold-400" : "fill-gold-500 text-gold-500"}`}
                      aria-hidden="true"
                    />
                    {entry.stars.toLocaleString("ar-EG")} نجمة
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                    entry.isMe
                      ? "bg-gold-500 text-heritage-950"
                      : "bg-sand text-heritage-700"
                  }`}
                >
                  {podium.label}
                </span>
              </div>
            );
          })}
        </section>
      )}

      {/* بقية الترتيب — من الرابع فما دون */}
      {board.length > 3 && (
        <section aria-label="بقية الترتيب" className="space-y-2.5">
          <ul className="space-y-2.5">
            {board.slice(3).map((entry, index) => {
              const rank = index + 4;
              return (
                <li
                  key={`${entry.name}-${rank}`}
                  className={`flex items-center gap-3 rounded-2xl p-3.5 shadow-card ${
                    entry.isMe
                      ? "bg-heritage-900 ring-2 ring-gold-500/50"
                      : "bg-white"
                  }`}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg font-heading text-xs font-bold ${
                      entry.isMe
                        ? "bg-gold-500 text-heritage-950"
                        : "bg-sand text-heritage-800"
                    }`}
                  >
                    {rank.toLocaleString("ar-EG")}
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate text-xs font-bold ${
                      entry.isMe ? "text-white" : "text-heritage-900"
                    }`}
                  >
                    {entry.name}
                    {entry.isMe && (
                      <span className="mx-1.5 rounded-full bg-gold-500/20 px-2 py-0.5 text-[9px] font-bold text-gold-400">
                        أنت
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-[10px] font-medium ${
                      entry.isMe ? "text-heritage-100/70" : "text-muted-foreground"
                    }`}
                  >
                    {entry.levels.toLocaleString("ar-EG")} مراحل
                  </span>
                  <span
                    className={`flex shrink-0 items-center gap-1 text-[10px] font-bold ${
                      entry.isMe ? "text-gold-400" : "text-heritage-700/70"
                    }`}
                    aria-label={`${entry.stars.toLocaleString("ar-EG")} نجمة`}
                  >
                    <Star
                      className={`size-3 ${entry.isMe ? "fill-gold-400 text-gold-400" : "fill-gold-500 text-gold-500"}`}
                      aria-hidden="true"
                    />
                    {entry.stars.toLocaleString("ar-EG")}
                  </span>
                  <span
                    className={`shrink-0 font-heading text-xs font-extrabold ${
                      entry.isMe ? "text-gold-400" : "text-heritage-900"
                    }`}
                  >
                    {entry.points.toLocaleString("ar-EG")}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* لوحة حيّة بلا لاعبين بعد — دعوة صادقة للتصدّر */}
      {live && board.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-card">
          <p className="text-xs font-medium leading-relaxed text-muted-foreground">
            لا متصدّرين بعد — أكمل أول مرحلة وكن أول الأسماء في اللوحة
          </p>
        </div>
      )}

      {/* تذييل توضيحي */}
      <footer className="flex items-center gap-2.5 rounded-xl border border-gold-500/30 bg-gold-100/50 px-4 py-2.5">
        <Medal className="size-4 shrink-0 text-gold-700" aria-hidden="true" />
        <p className="text-[10px] font-medium leading-relaxed text-gold-700">
          تُحدَّث اللوحة فور إكمال أي مرحلة — اجمع النجوم الثلاث في كل مرحلة
          لتتصدر
        </p>
      </footer>
    </main>
  );
}
