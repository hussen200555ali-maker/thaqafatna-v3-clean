"use client";

/**
 * لوحة الحروف المشتركة (Shared Letter Board)
 * =============================================
 * القلب التفاعلي لكل ألغاز «رتّب الحروف»: خانات إجابة أعلى + صينية
 * حروف مبعثرة أسفل — مستخرجة من مُصيّر الحروف المبعثرة لتخدم
 * أربعة أنواع دون تكرار سطر واحد:
 *
 *   scrambled (حروف مبعثرة)   | emoji   (لغز الإيموجي)
 *   image    (لغز مصوّر)      | images4 (أربع صور)
 *
 * الضغط على حرف يملأ الخانة التالية، والضغط على خانة ممتلئة
 * يعيد الحرف إلى الصينية. إدارة الحروف المكررة عبر «الكميات
 * المستهلكة» (Multiset) من خانات الإجابة نفسها — لا حالة موازية.
 *
 * الهوية البصرية: لوحة تراثية داكنة (Teal) بحروف بيضاء —
 * نفس هوية الشبكة المتقاطعة في المرحلة الأولى.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Delete, RotateCcw, Shuffle } from "lucide-react";
import type { QuestionStatus } from "@/lib/game/types";

/** خلط فيشر-ييتس — عادل وبدون تحيّز */
export function shuffleLetters<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/** بنك مشتّتات آمن — حروف شائعة لا تكسر اللغز، تُصفّى إن تكررت */
const DISTRACTOR_POOL = ["م", "س", "و", "ن", "ر", "ب", "ي", "ك", "ت", "د"];

/**
 * اشتقاق صينية الحروف من الإجابة — مع مشتّتات اختيارية.
 *
 * حتمي (Deterministic) عمداً: نفس الإجابة تولّد نفس الصينية في كل
 * رندر، لأن الخلط العشوائي مسؤولية اللوحة نفسها (عند التركيب).
 * يُستخدم من الأنواع التي لا يصلها availableLetters من الإدارة.
 */
export function deriveLetterTray(answer: string, distractorCount = 0): string[] {
  const letters = Array.from(answer.replace(/\s/g, ""));
  if (distractorCount <= 0) return letters;
  const existing = new Set(letters);
  const distractors = DISTRACTOR_POOL.filter((ch) => !existing.has(ch)).slice(
    0,
    distractorCount,
  );
  return [...letters, ...distractors];
}

export interface LetterBoardProps {
  /** طول الإجابة — يحدد عدد الخانات */
  answerLength: number;
  /** الحروف المتاحة للاعب (تُخلط عند التركيب حمايةً من البيانات المرتبة) */
  letters: string[];
  /** حالة الإجابة من الحاوية — مصفوفة (حرف | فراغ) */
  answer: unknown;
  onAnswerChange: (slots: (string | null)[]) => void;
  status: QuestionStatus;
}

export function LetterBoard({
  answerLength,
  letters,
  answer,
  onAnswerChange,
  status,
}: LetterBoardProps) {
  /** ترتيب صينية الحروف — يُخلط مرة واحدة عند التركيب ثم بزر التبديل
   *  (حماية معمارية: لو وصلت الحروف مرتبة كالإجابة من أي مصدر بيانات) */
  const [tray, setTray] = useState<string[]>(() =>
    shuffleLetters(
      letters.length > 0
        ? letters
        : Array.from({ length: answerLength }, () => "؟"),
    ),
  );

  /** خانات الإجابة — تطبيع الحالة القادمة من الحاوية */
  const slots: (string | null)[] = Array.isArray(answer)
    ? (answer as (string | null)[])
    : Array.from({ length: answerLength }, () => null);

  const locked = status !== "answering";

  /** كمّية كل حرف مستخدمة في الخانات حالياً */
  const usedCounts: Record<string, number> = {};
  for (const s of slots) {
    if (s) usedCounts[s] = (usedCounts[s] ?? 0) + 1;
  }

  /** هل استُهلكت بلاطة الحرف رقم j؟ (Multiset matching) */
  const isTileUsed = (index: number): boolean => {
    const letter = tray[index];
    let seen = 0;
    for (let k = 0; k <= index; k++) {
      if (tray[k] === letter) seen++;
    }
    return seen <= (usedCounts[letter] ?? 0);
  };

  const placeLetter = (index: number) => {
    if (locked || isTileUsed(index)) return;
    const target = slots.findIndex((s) => s === null);
    if (target === -1) return;
    const next = [...slots];
    next[target] = tray[index];
    onAnswerChange(next);
  };

  const removeSlot = (index: number) => {
    if (locked || slots[index] === null) return;
    const next = [...slots];
    next[index] = null;
    onAnswerChange(next);
  };

  const clearAll = () => {
    if (locked) return;
    onAnswerChange(Array.from({ length: answerLength }, () => null));
  };

  /* أصناف حالة الخانات أثناء التصحيح */
  const resultSlotClass =
    status === "correct"
      ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-card"
      : status === "wrong"
        ? "border-red-400 bg-red-50 text-red-600"
        : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={
        status === "wrong"
          ? { opacity: 1, y: 0, x: [0, -7, 7, -5, 5, 0] }
          : { opacity: 1, y: 0 }
      }
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-5"
    >
      {/* 1) خانات الإجابة */}
      <div
        className="flex flex-wrap items-center justify-center gap-2 py-1"
        role="group"
        aria-label="خانات الإجابة"
      >
        {slots.map((slot, index) => (
          <motion.button
            key={index}
            type="button"
            whileTap={locked || slot === null ? undefined : { scale: 0.9 }}
            onClick={() => removeSlot(index)}
            aria-label={
              slot
                ? `الخانة ${index + 1}: الحرف ${slot} — اضغط للحذف`
                : `الخانة ${index + 1}: فارغة`
            }
            className={
              slot
                ? `grid size-11 place-items-center rounded-xl border-2 border-heritage-900/15 bg-white font-heading text-xl font-extrabold text-heritage-950 shadow-card transition-colors duration-150 ${resultSlotClass}`
                : "grid size-11 place-items-center rounded-xl border-2 border-dashed border-gold-500/60 bg-gold-100/30"
            }
          >
            {slot}
          </motion.button>
        ))}
      </div>

      {/* 2) أدوات مساعدة — خلط ومسح */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setTray((t) => shuffleLetters(t))}
          disabled={locked}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[11px] font-bold text-heritage-700 shadow-card transition-all duration-150 hover:bg-heritage-50 active:scale-95 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
        >
          <Shuffle className="size-3.5" aria-hidden="true" />
          تبديل الحروف
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={locked}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[11px] font-bold text-heritage-700 shadow-card transition-all duration-150 hover:bg-heritage-50 active:scale-95 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          مسح الكل
        </button>
      </div>

      {/* 3) صينية الحروف — لوحة تراثية داكنة */}
      <div className="rounded-2xl bg-gradient-to-tl from-heritage-950 via-heritage-900 to-heritage-800 p-3.5 shadow-card-lg">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {tray.map((letter, index) => {
            const used = isTileUsed(index);
            return (
              <motion.button
                key={`${letter}-${index}`}
                type="button"
                whileTap={used || locked ? undefined : { scale: 0.88 }}
                onClick={() => placeLetter(index)}
                disabled={used || locked}
                aria-label={`الحرف ${letter}${used ? " — مستخدم" : ""}`}
                className={`grid h-11 min-w-10 place-items-center rounded-xl border px-2 font-heading text-xl font-extrabold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold-400 ${
                  used
                    ? "border-white/5 bg-white/5 text-white/20"
                    : "border-white/15 bg-white/10 text-white hover:bg-white/20 active:scale-90"
                }`}
              >
                {letter}
              </motion.button>
            );
          })}

          {/* زر الحذف — يعيد آخر حرف مُضاف */}
          <button
            type="button"
            onClick={() => {
              const lastFilled = [...slots]
                .map((s, i) => ({ s, i }))
                .reverse()
                .find(({ s }) => s !== null);
              if (lastFilled) removeSlot(lastFilled.i);
            }}
            disabled={locked}
            aria-label="حذف آخر حرف"
            className="grid h-11 min-w-10 place-items-center rounded-xl border border-flame-500/40 bg-flame-500/15 text-flame-400 transition-all duration-150 hover:bg-flame-500/25 active:scale-90 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold-400"
          >
            <Delete className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
