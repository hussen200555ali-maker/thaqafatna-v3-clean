"use client";

/**
 * مُصيّر «المرحلة المختلطة» (Mixed Boss Stage)
 * ================================================
 * ذروة المعمارية العودية: سؤالٌ واحد في مسار الحاوية، لكنه يحوي
 * محطاتٍ فرعية من أنواع مختلفة — وكل محطة تُصيَّر بنفس مُصيّرات
 * السجل (getQuestionModule) دون أي تخصيص:
 *
 *   ┌─ الحاوية الأم (شريط علوي + مؤقت + عملات — كما هي)
 *   │   └─ هذا المُصيّر (مالك تدفقه الخاص — hideActionBar)
 *   │       ├─ راية البوس + نقاط المحطات
 *   │       ├─ نص المحطة الحالية (clue الخاص بها)
 *   │       ├─ مُصيّر النوع الفعلي (أي نوع من السجل!)
 *   │       └─ شريط تأكيد خاص بالمحطة + تغذية راجعة مصغّرة
 *
 * بعد آخر محطة يُستدعى onSubmit (الإرسال البرمجي) فتدير الحاوية
 * الحكم النهائي عبر طبقة التغذية الراجعة الموحدة — تجربة الحكم
 * الكبرى تبقى موحّدة مع كل أنواع اللعبة.
 *
 * حالة الإجابة: مصفوفة إجابات المحطات (AnswerStateMap.mixed)،
 * والمحطة المتخطاة تُخزَّن بقيمة false (رمز التخطي) فتُحتمل خطأً
 * في الحكم النهائي دون تعطيل اكتمال السؤال.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Swords, XCircle } from "lucide-react";
import type {
  MixedQuestion,
  QuestionStatus,
  QuestionRendererProps,
} from "@/lib/game/types";
import { getQuestionModule } from "../registry";
import { PUZZLE_META } from "../puzzle-meta";

/** نتيجة محطة واحدة — تُستخدم لنقاط التقدم الملونة */
type StageOutcome = "correct" | "wrong" | "skipped" | null;

export function MixedQuestion({
  question,
  answer,
  onAnswerChange,
  status,
  onSpendCoins,
  onSubmit,
}: QuestionRendererProps) {
  const q = question as MixedQuestion;

  /* الحاوية تُقفل بعد الحكم النهائي — لا تفاعل داخل المُصيّر */
  const flowLocked = status !== "answering";

  /* ===== حالة التدفق الداخلي ===== */
  const [stageIndex, setStageIndex] = useState(0);
  const [stageAnswers, setStageAnswers] = useState<unknown[]>(() =>
    q.stages.map(() => null),
  );
  const [stageStatus, setStageStatus] = useState<QuestionStatus>("answering");
  const [stageOutcomes, setStageOutcomes] = useState<StageOutcome[]>(() =>
    q.stages.map(() => null),
  );

  const total = q.stages.length;
  const index = Math.min(stageIndex, total - 1);
  const stage = q.stages[index];
  const stageModule = getQuestionModule(stage.type);
  const stageMeta = PUZZLE_META[stage.type];

  const stageAnswer = stageAnswers[index] ?? null;
  const canConfirmStage =
    !flowLocked &&
    stageStatus === "answering" &&
    stageModule.isComplete(stage, stageAnswer);

  /* ===== مزامنة الإجابة الكلية مع الحاوية (اكتمال السؤال) ===== */
  const updateStageAnswer = (next: unknown) => {
    const copy = [...stageAnswers];
    copy[index] = next;
    setStageAnswers(copy);
    onAnswerChange(copy);
  };

  /* ===== تأكيد المحطة — حكم عبر منطق وحدة النوع نفسها ===== */
  const confirmStage = () => {
    if (!canConfirmStage) return;
    const isCorrect = stageModule.checkAnswer(stage, stageAnswer);
    setStageStatus(isCorrect ? "correct" : "wrong");
    setStageOutcomes((prev) => {
      const copy = [...prev];
      copy[index] = isCorrect ? "correct" : "wrong";
      return copy;
    });
  };

  /* ===== تخطّي محطة (للمُصيّر الاحتياطي) — تُحتمل خطأً ===== */
  const skipStage = () => {
    if (flowLocked || stageStatus !== "answering") return;
    const answersCopy = [...stageAnswers];
    answersCopy[index] = false; /* رمز التخطي — يُحتمل خطأً في الحكم */
    setStageAnswers(answersCopy);
    onAnswerChange(answersCopy);
    setStageOutcomes((prev) => {
      const copy = [...prev];
      copy[index] = "skipped";
      return copy;
    });
    advanceStage();
  };

  /* ===== الانتقال للمحطة التالية أو إنهاء البوس ===== */
  const advanceStage = () => {
    if (index + 1 >= total) {
      onAnswerChange(stageAnswers);
      onSubmit?.(); /* الحكم النهائي عبر طبقة التغذية الموحدة */
    } else {
      setStageIndex(index + 1);
      setStageStatus("answering");
    }
  };

  /* التقدّم التلقائي بعد تغذية المحطة الراجعة */
  useEffect(() => {
    if (stageStatus !== "correct" && stageStatus !== "wrong") return;
    const timer = setTimeout(advanceStage, stageStatus === "correct" ? 1150 : 2000);
    return () => clearTimeout(timer);
  }, [stageStatus, index]);

  /* لون نقطة المحطة في راية البوس */
  const stageDotClass = (dotIndex: number): string => {
    if (dotIndex > index) return "bg-sand-darker";
    const outcome = stageOutcomes[dotIndex];
    if (outcome === "correct") return "bg-emerald-500";
    if (outcome === "wrong" || outcome === "skipped") return "bg-red-400";
    return "bg-heritage-900 ring-2 ring-gold-500/60 ring-offset-1 ring-offset-sand";
  };

  const StageRenderer = stageModule.component;

  return (
    <div className="space-y-4">
      {/* ===== راية البوس ===== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-tl from-flame-600 via-flame-500 to-gold-500 p-4 shadow-card-lg"
        role="group"
        aria-label={`بوابة البوس — المحطة ${(index + 1).toLocaleString("ar-EG")} من ${total.toLocaleString("ar-EG")}`}
      >
        <Swords
          className="pointer-events-none absolute -bottom-4 -start-4 size-20 text-white/15"
          aria-hidden="true"
        />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <p className="font-heading text-sm font-extrabold text-white">
              بوابة البوس
            </p>
            <p className="mt-0.5 text-[10.5px] font-bold text-white/85">
              المحطة {(index + 1).toLocaleString("ar-EG")} من{" "}
              {total.toLocaleString("ar-EG")} — أجب عنها كلها لتهزم الحصن
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {q.stages.map((_, dotIndex) => (
              <span
                key={dotIndex}
                aria-hidden="true"
                className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${stageDotClass(dotIndex)}`}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* ===== نص المحطة الحالية + شارة نوعها ===== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stage.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="space-y-3"
        >
          <div className="rounded-2xl border-2 border-heritage-900/10 bg-white p-4 shadow-card">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold ${stageMeta.chipClass}`}
            >
              <stageMeta.icon className="size-3.5" aria-hidden="true" />
              {stageMeta.label}
            </span>
            <h3 className="mt-2.5 font-heading text-[14.5px] font-extrabold leading-loose text-heritage-950">
              {stage.clue}
            </h3>
          </div>

          {/* مُصيّر النوع الفعلي — من السجل، أي نوع كان */}
          <StageRenderer
            question={stage}
            answer={stageAnswer}
            onAnswerChange={updateStageAnswer}
            status={stageStatus}
            onSkip={skipStage}
            onSpendCoins={onSpendCoins}
          />

          {/* تغذية راجعة مصغّرة للمحطة عند الخطأ */}
          {stageStatus === "wrong" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-2.5"
              role="status"
            >
              <XCircle
                className="mt-0.5 size-4 shrink-0 text-red-500"
                aria-hidden="true"
              />
              <p className="text-[11.5px] font-bold leading-relaxed text-red-700">
                {stageModule.correctAnswerText
                  ? `الإجابة الصحيحة: ${stageModule.correctAnswerText(stage)}`
                  : "إجابة غير صحيحة — تقدّم المحطة التالية"}
              </p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ===== شريط تأكيد المحطة — بنفس هوية شريط القشرة ===== */}
      {!flowLocked && (
        <motion.button
          type="button"
          whileTap={canConfirmStage ? { scale: 0.97 } : undefined}
          onClick={confirmStage}
          disabled={!canConfirmStage}
          className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-heading text-sm font-extrabold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 ${
            canConfirmStage
              ? "bg-heritage-900 text-white shadow-card-lg hover:bg-heritage-800 active:scale-[0.98]"
              : "cursor-not-allowed bg-sand-darker text-muted-foreground"
          }`}
        >
          <Check className="size-4.5" aria-hidden="true" />
          {index + 1 >= total ? "إنهاء التحدي" : "تأكيد المحطة"}
        </motion.button>
      )}
    </div>
  );
}

/** وحدة التسجيل — التحقق العودي عبر وحدات المحطات نفسها */
export const mixedModule = {
  component: MixedQuestion,
  hideActionBar: true,
  isComplete: (q: MixedQuestion, answer: unknown) =>
    Array.isArray(answer) &&
    answer.length === q.stages.length &&
    answer.every((a) => a !== null),
  checkAnswer: (q: MixedQuestion, answer: unknown) => {
    if (!Array.isArray(answer) || answer.length !== q.stages.length)
      return false;
    return q.stages.every((stage, i) => {
      const stageAnswer = answer[i];
      if (stageAnswer === null || stageAnswer === false) return false;
      return getQuestionModule(stage.type).checkAnswer(stage, stageAnswer);
    });
  },
  correctAnswerText: (q: MixedQuestion) =>
    q.stages
      .map((stage) => {
        const stageUnit = getQuestionModule(stage.type);
        return stageUnit.correctAnswerText
          ? stageUnit.correctAnswerText(stage)
          : "";
      })
      .filter(Boolean)
      .join("، "),
};
