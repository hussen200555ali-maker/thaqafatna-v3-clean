"use client";

/**
 * مُصيّر «الحروف المبعثرة» (Scattered Letters)
 * ==============================================
 * نمط أحجية الكلمات الشهير — صار بعد المرحلة الثانية مجرد توزيع
 * للأناقة: كل التفاعل والبصريات تعيش في لوحة الحروف المشتركة
 * (shared/letter-board) التي تخدم هذا النوع وثلاثة إخوة له
 * (الإيموجي، الصورة، الأربع صور) دون أي تكرار كود.
 *
 * bonusWords: كلمات إضافية اختيارية تمنح مكافآت — تصل من حقل
 * bonusWords في لوحة الإدارة وتُعرض هنا كشريط تحفيزي.
 */

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type {
  QuestionRendererProps,
  ScrambledQuestion,
} from "@/lib/game/types";
import { LetterBoard } from "../shared/letter-board";

export function ScatteredLettersQuestion({
  question,
  answer,
  onAnswerChange,
  status,
}: QuestionRendererProps) {
  const q = question as ScrambledQuestion;

  return (
    <div className="space-y-4">
      <LetterBoard
        answerLength={q.answer.length}
        letters={q.letters}
        answer={answer}
        onAnswerChange={onAnswerChange}
        status={status}
      />

      {/* كلمات المكافآت — شريط تحفيزي اختياري من لوحة الإدارة */}
      {q.bonusWords && q.bonusWords.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-gold-100/50 px-3 py-2 text-center"
        >
          <Sparkles className="size-3.5 text-gold-600" aria-hidden="true" />
          <p className="text-[10.5px] font-bold text-gold-700">
            كلمات إضافية تكافئك: {q.bonusWords.join("، ")}
          </p>
        </motion.div>
      )}
    </div>
  );
}

/** وحدة التسجيل — الواجهة + منطق التحقق */
export const scrambledLettersModule = {
  component: ScatteredLettersQuestion,
  isComplete: (q: ScrambledQuestion, answer: unknown) => {
    if (!Array.isArray(answer) || answer.length !== q.answer.length)
      return false;
    return (answer as (string | null)[]).every((s) => s !== null);
  },
  checkAnswer: (q: ScrambledQuestion, answer: unknown) => {
    if (!Array.isArray(answer)) return false;
    return (answer as (string | null)[]).join("") === q.answer;
  },
  correctAnswerText: (q: ScrambledQuestion) => q.answer,
};
