"use client";

/**
 * مُصيّر «الاختيار من متعدد» (Multiple Choice)
 * ==============================================
 * بطل المرحلة الأولى: أبسط تفاعل ممكن (نقرة واحدة) وأوسع استخداماً —
 * يغطي كذلك أسئلة «صح أو خطأ» (خياران فقط).
 *
 * بعد استخراج بطاقات الخيارات المشتركة (shared/option-cards) أصبح
 * هذا المُصيّر غلافاً رقيقاً فوقها — ونفس البطاقات تخدم اللغز الذهني
 * وكل نوع خيالي قادم دون تكرار سطر واحد.
 */

import type {
  MultipleChoiceQuestion,
  QuestionRendererProps,
} from "@/lib/game/types";
import { OptionCards } from "../shared/option-cards";

export function MultipleChoiceQuestion({
  question,
  answer,
  onAnswerChange,
  status,
}: QuestionRendererProps) {
  const q = question as MultipleChoiceQuestion;
  const selected = typeof answer === "number" ? answer : null;
  const locked = status !== "answering";

  const handleSelect = (index: number) => {
    if (locked) return;
    onAnswerChange(index);
  };

  return (
    <OptionCards
      options={q.options}
      selected={selected}
      correctIndex={q.correctIndex}
      revealResult={locked}
      onSelect={handleSelect}
      ariaLabel="خيارات الإجابة"
    />
  );
}

/** وحدة التسجيل — الواجهة + منطق التحقق في مكان واحد */
export const multipleChoiceModule = {
  component: MultipleChoiceQuestion,
  isComplete: (q: MultipleChoiceQuestion, answer: unknown) =>
    typeof answer === "number" &&
    answer >= 0 &&
    answer < q.options.length,
  checkAnswer: (q: MultipleChoiceQuestion, answer: unknown) =>
    answer === q.correctIndex,
  correctAnswerText: (q: MultipleChoiceQuestion) =>
    q.options[q.correctIndex] ?? "",
};
