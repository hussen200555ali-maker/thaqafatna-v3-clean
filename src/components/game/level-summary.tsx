"use client";

/**
 * شاشة ملخص المرحلة (Level Summary)
 * ====================================
 * نهاية احتفالية موحّدة: نجوم تُفتح تباعاً بنبضٍ زنبركي،
 * شبكة إحصاءات (نقاط، دقة، عملات)، ومراجعة مصغّرة لكل سؤال
 * بأيقونة نوعه ولون نتيجته.
 *
 * النجوم: ٣ لكمال الإجابات، ٢ لـ ٧٠٪ فأكثر، ١ لـ ٤٠٪ فأكثر.
 */

import { motion } from "framer-motion";
import { CheckCircle2, Home, RotateCcw, Star, XCircle } from "lucide-react";
import type { GameLevel, QuestionResult } from "@/lib/game/types";
import { PUZZLE_META } from "./puzzle-meta";

interface LevelSummaryProps {
  level: GameLevel;
  results: QuestionResult[];
  earnedPoints: number;
  coinsLeft: number;
  /** سبب النهاية: اكتمال الأسئلة أو انتهاء الوقت */
  reason: "completed" | "timeup";
  onReplay: () => void;
  onExit: () => void;
}

/** حساب النجوم من نسبة الإجابات الصحيحة */
function computeStars(correct: number, total: number): number {
  if (total === 0) return 0;
  const ratio = correct / total;
  if (ratio === 1) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.4) return 1;
  return 0;
}

export function LevelSummary({
  level,
  results,
  earnedPoints,
  coinsLeft,
  reason,
  onReplay,
  onExit,
}: LevelSummaryProps) {
  const correct = results.filter((r) => r.result === "correct").length;
  const total = level.questions.length;
  const stars = computeStars(correct, total);
  const accuracy =
    total > 0 ? Math.round((correct / total) * 100) : 0;

  const headline =
    reason === "timeup"
      ? "انتهى الوقت!"
      : stars === 3
        ? "أداء أسطوري!"
        : stars === 2
          ? "أحسنت!"
          : correct > 0
            ? "بداية جيدة"
            : "حاول من جديد";

  return (
    <div className="scrollbar-thin-gold h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-md px-4 pb-[max(env(safe-area-inset-bottom),20px)] pt-8">
        {/* النجوم — تُفتح تباعاً */}
        <div
          className="flex items-center justify-center gap-3"
          aria-label={`حصلت على ${stars.toLocaleString("ar-EG")} من ٣ نجوم`}
        >
          {Array.from({ length: 3 }).map((_, index) => {
            const earned = index < stars;
            return (
              <motion.div
                key={index}
                initial={{ scale: 0, rotate: -40, opacity: 0 }}
                animate={
                  earned
                    ? { scale: 1, rotate: 0, opacity: 1 }
                    : { scale: 1, rotate: 0, opacity: 1 }
                }
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 14,
                  delay: 0.25 + index * 0.22,
                }}
                className={
                  earned ? "drop-shadow-[0_6px_16px_rgba(212,175,55,0.5)]" : ""
                }
              >
                <Star
                  className={`size-14 ${
                    earned
                      ? "fill-gold-500 text-gold-500"
                      : "fill-sand-darker/30 text-sand-darker/40"
                  }`}
                  aria-hidden="true"
                />
              </motion.div>
            );
          })}
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-5 text-center font-heading text-2xl font-extrabold text-heritage-950"
        >
          {headline}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-1.5 text-center text-xs font-medium text-muted-foreground"
        >
          {reason === "timeup"
            ? "انتهى الوقت المخصص للمرحلة — هذه حصيلتك حتى الآن"
            : `أنهيت «${level.title}» بنجاح`}
        </motion.p>

        {/* شبكة الإحصاءات */}
        <motion.dl
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mt-6 grid grid-cols-3 gap-2.5"
        >
          <div className="rounded-2xl bg-white p-3.5 text-center shadow-card">
            <dt className="text-[10px] font-bold text-muted-foreground">
              نقاط مكتسبة
            </dt>
            <dd className="mt-1 font-heading text-lg font-extrabold text-gold-600">
              {earnedPoints.toLocaleString("ar-EG")}
            </dd>
          </div>
          <div className="rounded-2xl bg-white p-3.5 text-center shadow-card">
            <dt className="text-[10px] font-bold text-muted-foreground">
              إجابات صحيحة
            </dt>
            <dd className="mt-1 font-heading text-lg font-extrabold text-heritage-900">
              {correct.toLocaleString("ar-EG")}/
              {total.toLocaleString("ar-EG")}
            </dd>
          </div>
          <div className="rounded-2xl bg-white p-3.5 text-center shadow-card">
            <dt className="text-[10px] font-bold text-muted-foreground">
              الدقة
            </dt>
            <dd className="mt-1 font-heading text-lg font-extrabold text-heritage-900">
              {accuracy.toLocaleString("ar-EG")}٪
            </dd>
          </div>
        </motion.dl>

        {/* مراجعة الأسئلة — أيقونة النوع بلون النتيجة */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.4 }}
          className="mt-4 rounded-2xl bg-white p-4 shadow-card"
          aria-label="مراجعة أسئلة المرحلة"
        >
          <h2 className="font-heading text-xs font-extrabold text-heritage-950">
            مراجعة المرحلة
          </h2>
          <ul className="mt-3 space-y-2">
            {results.map((result, index) => {
              const meta = PUZZLE_META[result.type];
              return (
                <li
                  key={result.questionId}
                  className="flex items-center gap-2.5 rounded-xl bg-sand/70 px-3 py-2"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white shadow-card">
                    <meta.icon className="size-3.5 text-heritage-700" aria-hidden="true" />
                  </span>
                  <span className="flex-1 text-[11.5px] font-bold text-heritage-900/80">
                    سؤال {(index + 1).toLocaleString("ar-EG")} — {meta.label}
                  </span>
                  {result.result === "correct" && (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600">
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                      +{result.earnedPoints.toLocaleString("ar-EG")}
                    </span>
                  )}
                  {result.result === "wrong" && (
                    <XCircle
                      className="size-4 text-red-400"
                      aria-hidden="true"
                    />
                  )}
                  {result.result === "skipped" && (
                    <span className="text-[10px] font-bold text-muted-foreground">
                      تُخطّي
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </motion.section>

        {/* الأزرار */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="mt-6 flex gap-3"
        >
          <button
            type="button"
            onClick={onReplay}
            className="flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-heritage-900/15 bg-white font-heading text-sm font-extrabold text-heritage-900 shadow-card transition-all duration-150 hover:bg-heritage-50 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
          >
            <RotateCcw className="size-4.5" aria-hidden="true" />
            إعادة المحاولة
          </button>
          <button
            type="button"
            onClick={onExit}
            className="flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-heritage-900 font-heading text-sm font-extrabold text-white shadow-card-lg transition-all duration-150 hover:bg-heritage-800 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
          >
            <Home className="size-4.5" aria-hidden="true" />
            الرئيسية
          </button>
        </motion.div>
      </div>
    </div>
  );
}
