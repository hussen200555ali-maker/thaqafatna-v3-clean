/**
 * سجل مُصيّرات الأسئلة (Question Renderer Registry)
 * ====================================================
 * قلب المعمارية القابلة للتوسّع — كل نوع سؤال «وحدة» واحدة
 * تجمع: مكوّن الواجهة + منطق الاكتمال + منطق التحقق + نص
 * الإجابة الصحيحة (لعرضه عند الخطأ).
 *
 * كيف تُضاف واجهة نوع جديد؟
 *   1. أنشئ ملفاً في questions/ يصدّر مكوناً + وحدة تسجيل
 *      بواجهة QuestionModuleDefinition<نوع السؤال>.
 *   2. أضف سطراً واحداً في MODULES أدناه.
 * لا تتغير الحاوية، ولا القشرة، ولا أي نوع آخر — إطلاقاً.
 *
 * الأمان المعماري: أي نوع غير موجود في السجل يسقط تلقائياً
 * في المُصيّر الاحتياطي (FallbackQuestion) — فلا يتعطّل مسار
 * اللاعب مهما وصل من بيانات جديدة أو غير متوقعة.
 */

import type { ComponentType } from "react";
import type {
  PuzzleType,
  Question,
  QuestionRendererProps,
} from "@/lib/game/types";
import { audioModule } from "./questions/audio-question";
import { crosswordModule } from "./questions/crossword-question";
import { emojiModule } from "./questions/emoji-question";
import { fillBlankModule } from "./questions/fill-blank-question";
import { imageModule } from "./questions/image-question";
import { images4Module } from "./questions/images4-question";
import { logicModule } from "./questions/logic-question";
import { matchingModule } from "./questions/matching-question";
import { mixedModule } from "./questions/mixed-question";
import { multipleChoiceModule } from "./questions/multiple-choice-question";
import { progressiveModule } from "./questions/progressive-question";
import { scrambledLettersModule } from "./questions/scattered-letters-question";
import { textModule } from "./questions/text-question";
import { FallbackQuestion } from "./questions/fallback-question";

/** تعريف وحدة نوع السؤال — الواجهة والمنطق جنباً إلى جنب */
export interface QuestionModuleDefinition<Q extends Question = Question> {
  /** مكون الواجهة الموحّد العقد */
  component: ComponentType<QuestionRendererProps>;
  /** هل اكتملت الإجابة بما يكفي لتفعيل زر التأكيد؟ */
  isComplete: (question: Q, answer: unknown) => boolean;
  /** التحقق النهائي عند التأكيد */
  checkAnswer: (question: Q, answer: unknown) => boolean;
  /** نص الإجابة الصحيحة — يظهر في طبقة الخطأ */
  correctAnswerText?: (question: Q) => string;
  /** الواجهة تدير أزرارها بنفسها (المُصيّر الاحتياطي مثلاً) */
  hideActionBar?: boolean;
}

/**
 * خريطة الأنواع المُفعّلة — المراحل الثلاث مكتملة (١٣ من ١٣).
 * التحويل (as) عند نقطة الحدود هذه آمن ومقصود: التمييز بالنوع
 * (Discriminated Union) يضمن أن الوحدة لن تُستدعى إلا ببيانات
 * النوع الصحيح، لأن الحاوية تجلب الوحدة من نفس قيمة type.
 *
 * النظام كامل التغطية الآن — المُصيّر الاحتياطي يظل شبكة أمان
 * لأي نوع مستقبلي يُضاف في لوحة الإدارة قبل بناء واجهته.
 */
const MODULES: Partial<Record<PuzzleType, QuestionModuleDefinition<Question>>> =
  {
    /* المرحلة الأولى */
    multiple: multipleChoiceModule as QuestionModuleDefinition<Question>,
    scrambled: scrambledLettersModule as QuestionModuleDefinition<Question>,
    fillblank: fillBlankModule as QuestionModuleDefinition<Question>,
    crossword: crosswordModule as QuestionModuleDefinition<Question>,
    /* المرحلة الثانية */
    text: textModule as QuestionModuleDefinition<Question>,
    emoji: emojiModule as QuestionModuleDefinition<Question>,
    image: imageModule as QuestionModuleDefinition<Question>,
    images4: images4Module as QuestionModuleDefinition<Question>,
    matching: matchingModule as QuestionModuleDefinition<Question>,
    /* المرحلة الثالثة */
    audio: audioModule as QuestionModuleDefinition<Question>,
    logic: logicModule as QuestionModuleDefinition<Question>,
    progressive: progressiveModule as QuestionModuleDefinition<Question>,
    mixed: mixedModule as QuestionModuleDefinition<Question>,
  };

/** الوحدة الاحتياطية — شبكة أمان الأنواع غير المُفعّلة بعد */
const FALLBACK: QuestionModuleDefinition<Question> = {
  component: FallbackQuestion,
  isComplete: () => false,
  checkAnswer: () => false,
  hideActionBar: true,
};

/** جلب وحدة نوع السؤال — يعيد دائماً شيئاً قابلاً للعرض */
export function getQuestionModule(
  type: PuzzleType,
): QuestionModuleDefinition<Question> {
  return MODULES[type] ?? FALLBACK;
}

/** هل بُنيت واجهة هذا النوع فعلاً؟ — تُستخدم في شاشة المقدمة */
export function isPuzzleTypeImplemented(type: PuzzleType): boolean {
  return type in MODULES;
}

/** قائمة الأنواع المُفعّلة — لأدوات التقارير والتشخيص */
export const implementedPuzzleTypes: PuzzleType[] =
  Object.keys(MODULES) as PuzzleType[];
