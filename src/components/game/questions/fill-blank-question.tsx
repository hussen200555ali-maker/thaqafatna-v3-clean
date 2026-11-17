"use client";

/**
 * مُصيّر «إكمال الفراغات» (Fill in the Blanks)
 * ===============================================
 * الجملة تُبنى من مقاطع نصية وفراغات مدمجة (Inline Chips) —
 * الفراغ الفارغ خطٌّ ذهبي متقطع، والمملوء رقاقة داكنة تراثية.
 *
 * التفاعل: اختيار فراغ ← نقرة كلمة من البنك، أو نقرة رقاقة
 * مملوءة لإعادتها إلى البنك. تقدّم نظامي تلقائي للفراغ التالي.
 *
 * الكلمات المستهلكة تُحسب من قيم الفراغات نفسها — فلا حالة
 * موازية للبنك، ولا مجال للتضارب.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import type {
  FillBlankQuestion,
  QuestionRendererProps,
} from "@/lib/game/types";

export function FillBlankQuestion({
  question,
  answer,
  onAnswerChange,
  status,
}: QuestionRendererProps) {
  const q = question as FillBlankQuestion;

  /** الفراغات مرتبة بترتيب ظهورها في الجملة */
  const blanks = q.segments.filter(
    (s): s is Extract<typeof s, { kind: "blank" }> => s.kind === "blank",
  );

  /** قيم الفراغات — تطبيع الحالة القادمة من الحاوية */
  const values: (string | null)[] = Array.isArray(answer)
    ? (answer as (string | null)[])
    : blanks.map(() => null);

  /** الفراغ المحدد حالياً — يستقبل الكلمة القادمة من البنك */
  const [selectedBlank, setSelectedBlank] = useState<number>(0);

  const locked = status !== "answering";

  /** كلمة من البنك مستهلكة إن وُجدت ضمن قيم الفراغات */
  const isWordUsed = (word: string) => values.includes(word);

  const firstEmptyIndex = () => values.findIndex((v) => v === null);

  const fillWord = (word: string) => {
    if (locked) return;
    let target = selectedBlank;
    if (values[target] !== null) {
      const empty = firstEmptyIndex();
      if (empty === -1) return;
      target = empty;
    }
    const next = [...values];
    next[target] = word;
    onAnswerChange(next);

    /* تقدّم تلقائي للفراغ الفارغ التالي بعد الملء */
    const nextEmpty = next.findIndex((v) => v === null);
    if (nextEmpty !== -1) setSelectedBlank(nextEmpty);
  };

  const clearBlank = (index: number) => {
    if (locked || values[index] === null) return;
    const next = [...values];
    next[index] = null;
    onAnswerChange(next);
    setSelectedBlank(index);
  };

  const blankResultClass = (index: number): string => {
    if (status === "correct")
      return "border-emerald-500 bg-emerald-50 text-emerald-700";
    if (status === "wrong" && values[index] !== blanks[index].answer)
      return "border-red-400 bg-red-50 text-red-600 line-through decoration-red-400/60";
    return "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* 1) الجملة مع الفراغات المدمجة */}
      <div className="rounded-2xl border-2 border-heritage-900/10 bg-white p-5 shadow-card">
        <p className="text-center font-heading text-[17px] font-bold leading-loose text-heritage-950">
          {q.segments.map((segment, index) => {
            if (segment.kind === "text") {
              return (
                <span key={index} className="whitespace-pre-wrap">
                  {segment.text}
                </span>
              );
            }

            const value = values[segment.id] ?? null;
            const isSelected = selectedBlank === segment.id && !locked;
            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  if (locked) return;
                  if (value !== null) clearBlank(segment.id);
                  else setSelectedBlank(segment.id);
                }}
                aria-label={
                  value
                    ? `الفراغ ${segment.id + 1}: ${value} — اضغط للإزالة`
                    : `الفراغ ${segment.id + 1}: فارغ — اضغط للتحديد`
                }
                className={`mx-1 inline-flex min-w-[5ch] items-center justify-center gap-1 rounded-lg border-b-4 px-2.5 py-0.5 align-middle font-heading text-[15px] font-extrabold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 ${
                  value
                    ? `border-heritage-900 bg-heritage-50 text-heritage-950 ${blankResultClass(segment.id)}`
                    : isSelected
                      ? "border-gold-500 bg-gold-100/70 text-gold-700/50 ring-2 ring-gold-500/40"
                      : "border-dashed border-gold-500/70 bg-gold-100/25 text-gold-700/40"
                }`}
              >
                {value ?? "؟"}
                {value && !locked && (
                  <X className="size-3 text-heritage-900/35" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </p>
      </div>

      {/* 2) بنك الكلمات */}
      <div>
        <p className="mb-2.5 text-center text-[11px] font-bold text-muted-foreground">
          اختر الكلمة المناسبة لكل فراغ من البنك
        </p>
        <div
          className="flex flex-wrap items-center justify-center gap-2"
          role="group"
          aria-label="بنك الكلمات"
        >
          {q.bank.map((word, index) => {
            const used = isWordUsed(word);
            return (
              <motion.button
                key={`${word}-${index}`}
                type="button"
                whileTap={used || locked ? undefined : { scale: 0.94 }}
                onClick={() => fillWord(word)}
                disabled={used || locked}
                aria-label={`كلمة ${word}${used ? " — مستخدمة" : ""}`}
                className={`inline-flex h-11 items-center gap-1.5 rounded-xl border-2 px-4 font-heading text-sm font-extrabold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 ${
                  used
                    ? "border-heritage-900/8 bg-sand-dark/60 text-heritage-900/30"
                    : "border-heritage-900/12 bg-white text-heritage-900 shadow-card hover:border-gold-500/60 hover:bg-gold-100/40 active:scale-95"
                }`}
              >
                {word}
                {used && <Check className="size-3.5" aria-hidden="true" />}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/** وحدة التسجيل — الواجهة + منطق التحقق */
export const fillBlankModule = {
  component: FillBlankQuestion,
  isComplete: (q: FillBlankQuestion, answer: unknown) => {
    if (!Array.isArray(answer)) return false;
    const blanks = q.segments.filter((s) => s.kind === "blank");
    if (answer.length !== blanks.length) return false;
    return (answer as (string | null)[]).every((v) => v !== null);
  },
  checkAnswer: (q: FillBlankQuestion, answer: unknown) => {
    if (!Array.isArray(answer)) return false;
    return q.segments.every((segment) => {
      if (segment.kind !== "blank") return true;
      return answer[segment.id] === segment.answer;
    });
  },
  correctAnswerText: (q: FillBlankQuestion) =>
    q.segments
      .filter((s): s is Extract<typeof s, { kind: "blank" }> => s.kind === "blank")
      .map((s) => s.answer)
      .join(" — "),
};
