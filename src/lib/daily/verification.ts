/**
 * التحقق السيرفي من إجابة تحدي اليوم.
 * مصدر الحكم هنا هو الخادم وحده — لا يُعتمد على حكم مكوّن اللعبة.
 *
 * بنك اليوم يقتصر على النوعين اللذين يمكن حملهما بأمان إلى المتصفح
 * دون إرسال الإجابة: multiple و text.
 */

import { arabicAnswersMatch, countArabicLetters } from "@/lib/game/answer-utils";
import type { MultipleChoiceQuestion, Question, TextQuestion } from "@/lib/game/types";

export const DAILY_TYPES = ["text", "multiple"] as const;
export type DailyType = (typeof DAILY_TYPES)[number];

export function isDailyType(type: string): type is DailyType {
  return (DAILY_TYPES as readonly string[]).includes(type);
}

export function verifyDailyAnswer(question: Question, answer: unknown): boolean {
  if (question.type === "multiple") {
    const q = question as MultipleChoiceQuestion;
    return (
      typeof answer === "number" &&
      Number.isInteger(answer) &&
      answer >= 0 &&
      answer < q.options.length &&
      answer === q.correctIndex
    );
  }

  if (question.type === "text") {
    const q = question as TextQuestion;
    return typeof answer === "string" && arabicAnswersMatch(answer, q.answer);
  }

  return false;
}

/** النص الذي يُكشف للاعب بعد الإجابة الخاطئة (يُرسل من الخادم فقط) */
export function dailyCorrectAnswer(question: Question): string {
  if (question.type === "multiple") {
    const q = question as MultipleChoiceQuestion;
    return q.options[q.correctIndex] ?? "";
  }
  if (question.type === "text") return (question as TextQuestion).answer;
  return "";
}

/**
 * نسخة عامة من السؤال: بلا إجابة ولا فهرس إجابة ولا شرح — فالشرح في بنك الأسئلة
 * يذكر الإجابة صراحةً في الغالب، وإرساله للمتصفح قبل الحكم يبطل إخفاءها.
 * الشرح يُرسل من الخادم داخل رد `/api/daily-challenge/answer` بعد المحاولة فقط،
 * ومع طول الإجابة محسوبًا مسبقًا كي يعمل مُصيّر النص.
 */
export function publicDailyQuestion(question: Question): Question {
  const base = { ...question, explanation: undefined };
  if (question.type === "multiple") {
    /* correctIndex = -1 يجعل أي حكم محلي مستحيلًا — الخادم هو الحَكَم */
    return { ...base, correctIndex: -1 } as Question;
  }
  if (question.type === "text") {
    const q = question as TextQuestion;
    return {
      ...base,
      answer: "",
      answerLength: q.answerLength && q.answerLength > 0 ? q.answerLength : countArabicLetters(q.answer),
    } as Question;
  }
  return base;
}
