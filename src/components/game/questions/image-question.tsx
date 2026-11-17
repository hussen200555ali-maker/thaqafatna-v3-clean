"use client";

/**
 * مُصيّر «اللغز المصوّر» (Image Riddle)
 * ========================================
 * صورة واحدة كبيرة (من حقل imageUrl في لوحة الإدارة) والإجابة
 * تُركَّب من لوحة الحروف المشتركة — نمط «الصورة والكلمة» الكلاسيكي.
 *
 * الصورة عبر SmartImage: هيكل تحميل نابض + حالة فشل مهذبة —
 * لا صورة مكسورة ولا شاشة بيضاء مهما حدث في الشبكة.
 */

import type {
  ImageQuestion,
  QuestionRendererProps,
} from "@/lib/game/types";
import { LetterBoard } from "../shared/letter-board";
import { ImageFrame } from "../shared/smart-image";

export function ImageQuestion({
  question,
  answer,
  onAnswerChange,
  status,
}: QuestionRendererProps) {
  const q = question as ImageQuestion;

  return (
    <div className="space-y-4">
      {/* 1) الصورة الكبيرة — تتوهّج عند الحكم (أخضر/أحمر) */}
      <ImageFrame
        src={q.imageUrl}
        alt="صورة اللغز — ما الكلمة التي تصفها؟"
        correct={status === "answering" ? null : status === "correct"}
      />

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
export const imageModule = {
  component: ImageQuestion,
  isComplete: (q: ImageQuestion, answer: unknown) => {
    if (!Array.isArray(answer) || answer.length !== q.answer.length)
      return false;
    return (answer as (string | null)[]).every((s) => s !== null);
  },
  checkAnswer: (q: ImageQuestion, answer: unknown) => {
    if (!Array.isArray(answer)) return false;
    return (answer as (string | null)[]).join("") === q.answer;
  },
  correctAnswerText: (q: ImageQuestion) => q.answer,
};
