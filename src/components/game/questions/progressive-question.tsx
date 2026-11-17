"use client";

/**
 * مُصيّر «التلميحات المتدرجة» (Progressive Hints)
 * ==================================================
 * سُلّم استنتاج من درجات: كل درجة تلميح أصرح من سابقتها، والكشف
 * يبدأ مجاناً (الدرجة الأولى جوهر النوع) ثم تكلّف الدرجات التالية
 * عملاتٍ عبر onSpendCoins — أول استخدام للاقتصاد المفتوح.
 *
 * القرار الهندسي: عدد الدرجات المكشوفة حالة واجهة داخلية (تُصفَّر
 * مع إعادة تركيب السؤال)، بينما الإجابة نفسها (خانات الحروف) تبقى
 * في الحاوية كالمعتاد — فصلُ «ما كشفته» عن «ما أجبت به».
 *
 * الإجابة عبر لوحة الحروف المشتركة — من availableLetters أو مشتقة
 * مع مشتّتات آمنة، بنفس سلوك الصوتي والإيموجي.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Lightbulb, Lock, Sparkles } from "lucide-react";
import type {
  ProgressiveQuestion,
  QuestionRendererProps,
} from "@/lib/game/types";
import { deriveLetterTray, LetterBoard } from "../shared/letter-board";

/** الدرجات التي تُكشف مجاناً قبل بدء الخصم */
const FREE_RUNGS = 1;

export function ProgressiveQuestion({
  question,
  answer,
  onAnswerChange,
  status,
  onSpendCoins,
}: QuestionRendererProps) {
  const q = question as ProgressiveQuestion;
  const locked = status !== "answering";

  /** عدد الدرجات المكشوفة — تبدأ بالدرجة الأولى مجاناً */
  const [revealed, setRevealed] = useState(
    q.hints.length > 0 ? FREE_RUNGS : 0,
  );

  /** تكلفة الدرجة القادمة — الدرجة المجانية صفر ثم تكلفة السؤال */
  const nextRungCost = (rungIndex: number): number =>
    rungIndex < FREE_RUNGS ? 0 : q.hintCost;

  const revealNext = () => {
    if (locked || revealed >= q.hints.length) return;
    const cost = nextRungCost(revealed);
    if (cost > 0) {
      /* الاقتصاد المفتوح: الحاوية تخصم وتُعلم — أو ترفض بلطف */
      const paid = onSpendCoins ? onSpendCoins(cost) : true;
      if (!paid) return;
    }
    setRevealed((r) => r + 1);
  };

  const allRevealed = revealed >= q.hints.length;

  return (
    <div className="space-y-5">
      {/* 1) سُلّم التلميحات */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={
          status === "wrong"
            ? { opacity: 1, y: 0, x: [0, -7, 7, -5, 5, 0] }
            : { opacity: 1, y: 0 }
        }
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`overflow-hidden rounded-2xl border-2 bg-white shadow-card transition-colors duration-300 ${
          status === "correct"
            ? "border-emerald-500"
            : status === "wrong"
              ? "border-red-400"
              : "border-heritage-900/10"
        }`}
        role="group"
        aria-label="سُلّم التلميحات المتدرجة"
      >
        {/* رأس السلّم */}
        <div className="flex items-center justify-between border-b border-heritage-900/8 bg-sand/70 px-4 py-2.5">
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-heritage-900">
            <Sparkles className="size-3.5 text-gold-600" aria-hidden="true" />
            سُلّم الاستنتاج
          </p>
          <p className="font-heading text-[10.5px] font-bold text-heritage-900/60">
            {revealed.toLocaleString("ar-EG")} من{" "}
            {q.hints.length.toLocaleString("ar-EG")} درجات
          </p>
        </div>

        {/* الدرجات — المكشوفة نصاً والمقفلة أقفالاً */}
        <div className="divide-y divide-heritage-900/6">
          {q.hints.map((hint, index) => {
            const isRevealed = index < revealed;
            const isNext = index === revealed;
            return (
              <div key={index} className="px-4 py-3">
                {isRevealed ? (
                  <motion.div
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex items-start gap-2.5"
                  >
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-gold-100 font-heading text-[11px] font-extrabold text-gold-700">
                      {(index + 1).toLocaleString("ar-EG")}
                    </span>
                    <p className="text-[12.5px] font-medium leading-relaxed text-heritage-950">
                      {hint}
                    </p>
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-2.5 opacity-70">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-sand-dark text-heritage-700/60">
                      <Lock className="size-3" aria-hidden="true" />
                    </span>
                    <p className="font-heading text-[11.5px] font-bold text-heritage-900/50">
                      درجة التلميح {(index + 1).toLocaleString("ar-EG")}
                      {isNext && (
                        <span className="ms-1.5 text-gold-700">
                          (التالية —{" "}
                          {nextRungCost(index) === 0
                            ? "مجاناً"
                            : `${nextRungCost(index).toLocaleString("ar-EG")} عملة`}
                          )
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* زر كشف الدرجة التالية */}
        {!allRevealed && (
          <div className="border-t border-heritage-900/8 px-4 py-3">
            <motion.button
              type="button"
              whileTap={locked ? undefined : { scale: 0.97 }}
              onClick={revealNext}
              disabled={locked}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-gold-500/50 bg-gold-100/60 font-heading text-xs font-extrabold text-gold-700 transition-all duration-150 hover:bg-gold-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {nextRungCost(revealed) === 0 ? (
                <Lightbulb className="size-4" aria-hidden="true" />
              ) : (
                <Coins className="size-4" aria-hidden="true" />
              )}
              {nextRungCost(revealed) === 0
                ? "اكشف التلميح الأول مجاناً"
                : `اكشف التلميح التالي — ${nextRungCost(revealed).toLocaleString("ar-EG")} عملة`}
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* 2) لوحة الحروف المشتركة — الإجابة بعد الاستنتاج */}
      <LetterBoard
        answerLength={q.answer.length}
        letters={q.letters ?? deriveLetterTray(q.answer, 3)}
        answer={answer}
        onAnswerChange={onAnswerChange}
        status={status}
      />
    </div>
  );
}

/** وحدة التسجيل — الواجهة + منطق التحقق */
export const progressiveModule = {
  component: ProgressiveQuestion,
  isComplete: (q: ProgressiveQuestion, answer: unknown) => {
    if (!Array.isArray(answer) || answer.length !== q.answer.length)
      return false;
    return (answer as (string | null)[]).every((s) => s !== null);
  },
  checkAnswer: (q: ProgressiveQuestion, answer: unknown) => {
    if (!Array.isArray(answer)) return false;
    return (answer as (string | null)[]).join("") === q.answer;
  },
  correctAnswerText: (q: ProgressiveQuestion) => q.answer,
};
