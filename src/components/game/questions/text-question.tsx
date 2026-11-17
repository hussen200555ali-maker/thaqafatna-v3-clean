"use client";

/**
 * مُصيّر «السؤال النصي» (Text Input)
 * =====================================
 * الإجابة كتابةً حرة — النمط الأصيل لأسئلة الثقافة العامة.
 *
 * تصميم مساعد ذكي مضاد للإحباط:
 *   • حقل كبير بخط تراثي عريض وخط سفلي ذهبي (روح إكمال الفراغات)
 *   • عدّاد أحرف حيّ يقارن بعدد أحرف الإجابة المتوقع (بلا مسافات)
 *   • التحقق عبر التطبيع العربي (answer-utils) — «احمد» تطابق «أَحْمَد»
 *
 * حقل واحد فقط بلا تشتيت: السؤال الطويل في الأعلى (القشرة)،
 * والتركيز كله هنا على الكتابة.
 */

import { motion } from "framer-motion";
import { Keyboard, Type } from "lucide-react";
import type {
  QuestionRendererProps,
  TextQuestion,
} from "@/lib/game/types";
import { arabicAnswersMatch, countArabicLetters } from "@/lib/game/answer-utils";

export function TextQuestion({
  question,
  answer,
  onAnswerChange,
  status,
}: QuestionRendererProps) {
  const q = question as TextQuestion;
  const value = typeof answer === "string" ? answer : "";
  const locked = status !== "answering";

  /** الهدف — من لوحة الإدارة أو مشتق من الإجابة نفسها */
  const targetLength =
    q.answerLength && q.answerLength > 0
      ? q.answerLength
      : countArabicLetters(q.answer);
  const currentLength = countArabicLetters(value);

  /* أصناف الحالة أثناء التصحيح */
  const stateClass =
    status === "correct"
      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
      : status === "wrong"
        ? "border-red-400 bg-red-50 text-red-700"
        : value.length > 0
          ? "border-gold-500 bg-gold-100/30 text-heritage-950"
          : "border-heritage-900/15 bg-white text-heritage-950";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={
        status === "wrong"
          ? { opacity: 1, y: 0, x: [0, -7, 7, -5, 5, 0] }
          : { opacity: 1, y: 0 }
      }
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-4"
    >
      {/* 1) بطاقة الكتابة */}
      <div
        className={`rounded-2xl border-2 p-5 shadow-card transition-colors duration-300 ${stateClass}`}
      >
        <label
          htmlFor={`text-answer-${q.id}`}
          className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-muted-foreground"
        >
          <Keyboard className="size-3.5" aria-hidden="true" />
          اكتب إجابتك بالعربية
        </label>

        <input
          id={`text-answer-${q.id}`}
          type="text"
          dir="rtl"
          lang="ar"
          inputMode="text"
          value={value}
          disabled={locked}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="الإجابة هنا..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="حقل الإجابة النصية"
          className="mt-3 w-full border-b-4 border-gold-500/70 bg-transparent pb-2 text-center font-heading text-2xl font-extrabold text-heritage-950 placeholder:font-normal placeholder:text-lg placeholder:text-heritage-900/25 focus:border-gold-500 focus:outline-none disabled:opacity-70"
        />

        {/* عدّاد الأحرف الحيّ — بلا مسافات ولا تشكيل */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <div
            className="h-1.5 w-28 overflow-hidden rounded-full bg-sand-darker"
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full bg-gold-500 transition-all duration-300"
              style={{
                width: `${targetLength > 0 ? Math.min(100, (currentLength / targetLength) * 100) : 0}%`,
              }}
            />
          </div>
          <p className="text-[10.5px] font-bold text-muted-foreground">
            {currentLength.toLocaleString("ar-EG")} /{" "}
            {targetLength.toLocaleString("ar-EG")} حرفاً
          </p>
        </div>
      </div>

      {/* 2) مساعد الطول — تلميح لطيف بلا كشف للإجابة */}
      <div className="flex items-center justify-center gap-1.5 text-center">
        <Type className="size-3.5 text-heritage-700/60" aria-hidden="true" />
        <p className="text-[11px] font-medium leading-relaxed text-heritage-900/60">
          الإجابة تتكوّن من {targetLength.toLocaleString("ar-EG")} أحرف تقريباً —
          تُحتسب الأحرف فقط دون المسافات، ولا يُهمّ الشكل أو التشكيل
        </p>
      </div>
    </motion.div>
  );
}

/** وحدة التسجيل — الواجهة + منطق التحقق (بتطبيع عربي عادل) */
export const textModule = {
  component: TextQuestion,
  isComplete: (_q: TextQuestion, answer: unknown) =>
    typeof answer === "string" && answer.trim().length > 0,
  checkAnswer: (q: TextQuestion, answer: unknown) =>
    typeof answer === "string" && arabicAnswersMatch(answer, q.answer),
  correctAnswerText: (q: TextQuestion) => q.answer,
};
