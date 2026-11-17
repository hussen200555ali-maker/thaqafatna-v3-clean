"use client";

/**
 * مُصيّر «أربع صور» (4 Pictures, 1 Word)
 * ==========================================
 * أربع صور من حقول image2Url..image4Url (مع imageUrl الأول) —
 * واللاعب يكتشف الكلمة الجامعة بينها ويركّبها من لوحة الحروف
 * المشتركة. أشهر أنماط ألعاب الكلمات عالمياً بصبغة تراثية.
 *
 * الترتيب البصري: شبكة ٢×٢ بفواصل ذهبية رفيعة، والصور تظهر
 * تباعاً بموجة ناعمة — لحظة «أوه، فهمت!» جزء من التصميم.
 */

import { motion } from "framer-motion";
import type {
  Images4Question,
  QuestionRendererProps,
} from "@/lib/game/types";
import { LetterBoard } from "../shared/letter-board";
import { SmartImage } from "../shared/smart-image";

export function Images4Question({
  question,
  answer,
  onAnswerChange,
  status,
}: QuestionRendererProps) {
  const q = question as Images4Question;

  return (
    <div className="space-y-4">
      {/* 1) شبكة الصور ٢×٢ — ظهور موجي متتابع */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`grid grid-cols-2 gap-2.5 rounded-2xl border-2 bg-white p-2.5 shadow-card transition-colors duration-300 ${
          status === "correct"
            ? "border-emerald-500"
            : status === "wrong"
              ? "border-red-400"
              : "border-heritage-900/10"
        }`}
      >
        {q.images.map((src, index) => (
          <motion.div
            key={`${src}-${index}`}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.09, duration: 0.3 }}
          >
            <SmartImage
              src={src}
              alt={`صورة ${(
                index + 1
              ).toLocaleString("ar-EG")} من صور اللغز`}
              rounded="rounded-xl"
              className="aspect-[4/3] w-full"
            />
          </motion.div>
        ))}
      </motion.div>

      {/* تلميح القاعدة — كلمة واحدة تجمع الصور الأربع */}
      <p className="text-center text-[11px] font-medium leading-relaxed text-heritage-900/60">
        كلمة واحدة جامعة تجمع الصور الأربع — رتّب حروفها في الخانات
      </p>

      {/* 2) لوحة الحروف المشتركة */}
      <LetterBoard
        answerLength={q.answer.length}
        letters={Array.from(q.answer)}
        answer={answer}
        onAnswerChange={onAnswerChange}
        status={status}
      />
    </div>
  );
}

/** وحدة التسجيل — الواجهة + منطق التحقق */
export const images4Module = {
  component: Images4Question,
  isComplete: (q: Images4Question, answer: unknown) => {
    if (!Array.isArray(answer) || answer.length !== q.answer.length)
      return false;
    return (answer as (string | null)[]).every((s) => s !== null);
  },
  checkAnswer: (q: Images4Question, answer: unknown) => {
    if (!Array.isArray(answer)) return false;
    return (answer as (string | null)[]).join("") === q.answer;
  },
  correctAnswerText: (q: Images4Question) => q.answer,
};
