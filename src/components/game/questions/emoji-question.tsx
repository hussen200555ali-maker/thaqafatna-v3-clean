"use client";

/**
 * مُصيّر «لغز الإيموجي» (Emoji Riddle)
 * =======================================
 * التوائم الثقافية للعبة «الإيموجي الشهيرة»: رموز تعبيرية كبيرة
 * تظهر بنبضٍ زنبركي متتابع، ولغزها يُحلّ عبر لوحة الحروف المشتركة
 * (shared/letter-board) — نفس عضلات الحروف المبعثرة تماماً.
 *
 * الحروف: تُشتق من الإجابة نفسها عند غياب availableLetters
 * في لوحة الإدارة (سلوك متسق مع بقية الأنواع الحرفية).
 */

import { motion } from "framer-motion";
import { Smile } from "lucide-react";
import type {
  EmojiQuestion,
  QuestionRendererProps,
} from "@/lib/game/types";
import { LetterBoard } from "../shared/letter-board";

export function EmojiQuestion({
  question,
  answer,
  onAnswerChange,
  status,
}: QuestionRendererProps) {
  const q = question as EmojiQuestion;

  /** تفكيك الرموز — يدعم المُركّبة (Surrogate Pairs) ويهمل الفواصل */
  const emojis = Array.from(q.emojis).filter((ch) => !/[\s|،,]/.test(ch));

  return (
    <div className="space-y-5">
      {/* 1) بطاقة الإيموجي — الرموز تدخل بموجة متتابعة */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`relative overflow-hidden rounded-2xl border-2 bg-white p-6 shadow-card transition-colors duration-300 ${
          status === "correct"
            ? "border-emerald-500"
            : status === "wrong"
              ? "border-red-400"
              : "border-heritage-900/10"
        }`}
      >
        {/* زخرفة ركنية خافتة */}
        <Smile
          className="pointer-events-none absolute -bottom-3 -start-3 size-16 text-gold-500/10"
          aria-hidden="true"
        />

        <div
          className="relative flex flex-wrap items-center justify-center gap-3"
          role="img"
          aria-label={`رموز اللغز: ${emojis.join(" ")}`}
        >
          {emojis.map((emoji, index) => (
            <motion.span
              key={`${emoji}-${index}`}
              initial={{ scale: 0, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{
                delay: 0.15 + index * 0.14,
                type: "spring",
                stiffness: 320,
                damping: 18,
              }}
              className="text-5xl leading-none drop-shadow-sm sm:text-6xl"
            >
              {emoji}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* 2) لوحة الحروف المشتركة — نفس واجهة الحروف المبعثرة */}
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
export const emojiModule = {
  component: EmojiQuestion,
  isComplete: (q: EmojiQuestion, answer: unknown) => {
    if (!Array.isArray(answer) || answer.length !== q.answer.length)
      return false;
    return (answer as (string | null)[]).every((s) => s !== null);
  },
  checkAnswer: (q: EmojiQuestion, answer: unknown) => {
    if (!Array.isArray(answer)) return false;
    return (answer as (string | null)[]).join("") === q.answer;
  },
  correctAnswerText: (q: EmojiQuestion) => q.answer,
};
