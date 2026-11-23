"use client";

/**
 * الحاوية الرئيسية للعبة (Game Container)
 * =========================================
 * «العقل» المنظّم — آلة حالة كاملة لإدارة مسار المرحلة:
 *
 *   مقدمة (intro) → سؤال (question) × N → ملخص (summary)
 *
 * مسؤولياتها — ولا تعرف شيئاً عن تفاصيل أي نوع سؤال:
 *   • جلب وحدة النوع من السجل: مكون + اكتمال + تحقق
 *   • إدارة حالة الإجابة (محايدة unknown) والتقدم والرجوع
 *   • النقاط والعملات والتلميحات والمؤقت الزمني
 *   • استدعاء طبقة التغذية الراجعة الموحدة عند الحكم
 *
 * استبدال مصدر البيانات لاحقاً: يكفي تغيير خاصية level لتقادمها
 * من نداء API بدلاً من ملف البيانات التجريبية — كل ما داخلها
 * لا يتغير، لأنه يتعامل مع عقد الأنواع (types.ts) فقط.
 */

import { useEffect, useState } from "react";
import type {
  GameLevel,
  QuestionResult,
  QuestionStatus,
} from "@/lib/game/types";
import {
  recordLevelResult,
  setCoins as writeStoredCoins,
} from "@/lib/game/progress-store";
import { BADGE_MAP } from "@/lib/game/badges";
import { useToast } from "@/hooks/use-toast";
import { FeedbackLayer } from "./feedback-layer";
import { LevelIntro } from "./level-intro";
import { LevelSummary } from "./level-summary";
import { getQuestionModule } from "./registry";
import { QuestionShell } from "./question-shell";

type Phase = "intro" | "question" | "summary";

/** استجابة التحقق السيرفي لتحدي اليوم */
interface DailyAnswerResponse {
  ok: boolean;
  correct?: boolean;
  correctAnswer?: string | null;
  explanation?: string | null;
  reward?: number;
  coins?: number | null;
  attemptsLeft?: number;
  completed?: boolean;
  error?: string;
}

interface GameContainerProps {
  level: GameLevel;
  /** رصيد العملات الافتتاحي للاعب */
  initialCoins: number;
  /** طلب الخروج للخارج من شاشة اللعب (العودة للرئيسية) */
  onExit: () => void;
  /** إيقاف مؤقت — عند تنقّل اللاعب لتبويب آخر (المؤقت يتوقف، اللعبة تبقى حية) */
  paused?: boolean;
  /** رمز جلسة تحدي اليوم — وجوده يعني أن الحكم يجب أن يأتي من الخادم */
  dailyToken?: string;
}

export function GameContainer({
  level,
  initialCoins,
  onExit,
  paused = false,
  dailyToken,
}: GameContainerProps) {
  const isDaily = dailyToken !== undefined;
  const [serverAnswer, setServerAnswer] = useState<string | null>(null);
  const [serverExplanation, setServerExplanation] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  /* ===== آلة الحالة ===== */
  const [phase, setPhase] = useState<Phase>("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answer, setAnswer] = useState<unknown>(null);
  const [status, setStatus] = useState<QuestionStatus>("answering");
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [coins, setCoins] = useState(initialCoins);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(level.timeLimit);
  /* تلميحات هذه الجلسة — زر التلميح ودرجات السُلّم معاً (للأوسمة) */
  const [hintsUsed, setHintsUsed] = useState(0);
  const [endReason, setEndReason] = useState<"completed" | "timeup">(
    "completed",
  );

  const question = level.questions[Math.min(qIndex, level.questions.length - 1)];
  const questionModule = getQuestionModule(question.type);
  const canConfirm =
    questionModule.isComplete(question, answer) &&
    status === "answering" &&
    !submitting;

  /* ===== المؤقت التنازلي — يعمل أثناء الأسئلة فقط، ويتوقف
     أثناء طبقة التغذية الراجعة حفاظاً على عدالة اللعب،
     وأيضاً عند مغادرة تبويب اللعبة (التوقيف المهذّب) ===== */
  useEffect(() => {
    if (
      paused ||
      phase !== "question" ||
      level.timeLimit <= 0 ||
      timeLeft <= 0 ||
      status !== "answering"
    )
      return;
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [paused, phase, level.timeLimit, timeLeft, status]);

  /* انتهاء الوقت — حالة مشتقة بدل تأثير جانبي */
  const timeIsUp = level.timeLimit > 0 && timeLeft === 0;
  const activePhase: Phase =
    phase === "question" && timeIsUp ? "summary" : phase;
  const summaryReason: "completed" | "timeup" =
    phase === "question" && timeIsUp ? "timeup" : endReason;

  /* ===== إعادة تهيئة حالة السؤال عند الانتقال ===== */
  const resetQuestionState = () => {
    setAnswer(null);
    setStatus("answering");
    setHintRevealed(false);
  };

  const startLevel = () => {
    setPhase("question");
    resetQuestionState();
  };

  /* ===== الانتقال للسؤال التالي أو الملخص ===== */
  const advance = (result: Exclude<QuestionStatus, "answering">) => {
    /* حارس انتهاء الوقت — لا تقدّم بعد إغلاق المرحلة */
    if (timeIsUp) return;

    const earned = result === "correct" ? question.points : 0;
    setResults((r) => [
      ...r,
      {
        questionId: question.id,
        type: question.type,
        result,
        earnedPoints: earned,
      },
    ]);
    if (earned > 0) setEarnedPoints((p) => p + earned);

    if (qIndex + 1 >= level.questions.length) {
      setEndReason("completed");
      setPhase("summary");
    } else {
      setQIndex((i) => i + 1);
      resetQuestionState();
    }
  };

  /* ===== زر التأكيد — في التحدي اليومي الخادم هو الحَكَم الوحيد.
     نسخة السؤال القادمة من /api/daily-challenge بلا إجابة صحيحة،
     فلا يمكن للمتصفح أن يحكم أو يمنح المكافأة بمفرده. ===== */
  const handleConfirm = () => {
    if (
      status !== "answering" ||
      !questionModule.isComplete(question, answer) ||
      submitting
    )
      return;

    if (!isDaily) {
      const isCorrect = questionModule.checkAnswer(question, answer);
      setStatus(isCorrect ? "correct" : "wrong");
      return;
    }

    if (!dailyToken) return;

    setSubmitting(true);
    void (async () => {
      try {
        const response = await fetch("/api/daily-challenge/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: dailyToken, answer }),
        });
        const data = (await response.json()) as DailyAnswerResponse;

        if (response.status === 429) {
          setAttemptsLeft(0);
          setServerAnswer(
            data.correctAnswer ??
              (questionModule.correctAnswerText
                ? questionModule.correctAnswerText(question)
                : null),
          );
          setStatus("wrong");
          toast({
            title: "انتهت المحاولات",
            description: "يمكنك محاولة تحدي الغد — المكافأة لم تُمنح",
            variant: "destructive",
          });
          return;
        }

        if (!data.ok || typeof data.correct !== "boolean") {
          toast({
            title: "تعذّر التحقق من الإجابة",
            description: data.error === "already_completed"
              ? "أكملت هذا التحدي من قبل"
              : "أعد المحاولة بعد لحظات",
            variant: "destructive",
          });
          return;
        }

        if (typeof data.attemptsLeft === "number") {
          setAttemptsLeft(data.attemptsLeft);
        }

        setServerExplanation(data.explanation ?? null);

        if (data.correct) {
          setServerAnswer(null);
          /* الرصيد القادم من الخادم هو الحقيقة — نُحدّث المخزن المحلي
             كي لا تُعيد مزامنة اللاعب كتابة قيمة قديمة فوق المكافأة */
          if (typeof data.coins === "number") {
            setCoins(data.coins);
            writeStoredCoins(data.coins);
          }
          setStatus("correct");
        } else {
          setServerAnswer(data.correctAnswer ?? null);
          setStatus("wrong");
        }
      } catch {
        toast({
          title: "تعذّر الاتصال",
          description: "تحقق من الشبكة ثم أعد إرسال الإجابة",
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    })();
  };

  /* ===== متابعة بعد إجابة خاطئة في التحدي اليومي: إعادة المحاولة
     على نفس السؤال ما دامت المحاولات متبقية — لا تُحتسب نتيجة خاطئة
     في التقدم، والمكافأة تُمنح مرة واحدة عند أول إجابة صحيحة ===== */
  const handleDailyContinue = () => {
    if (attemptsLeft === 0) {
      setEndReason("completed");
      setPhase("summary");
      return;
    }
    setServerAnswer(null);
    setServerExplanation(null);
    resetQuestionState();
  };

  /* ===== التقدّم التلقائي بعد الإجابة الصحيحة ===== */
  useEffect(() => {
    if (status !== "correct") return;
    const timer = setTimeout(() => advance("correct"), 1700);
    return () => clearTimeout(timer);
  }, [status]);

  /* ===== التلميح — يخصم من رصيد العملات ===== */
  const handleHint = () => {
    if (hintRevealed || !question.hint) return;
    const cost = question.hintCost ?? level.hintCost;
    if (coins < cost) {
      toast({
        title: "عملات غير كافية",
        description: `تحتاج ${cost.toLocaleString("ar-EG")} عملة لشراء تلميح — حلّ أسئلة أخرى لتكسب المزيد`,
        variant: "destructive",
      });
      return;
    }
    setCoins((c) => c - cost);
    setHintsUsed((h) => h + 1);
    setHintRevealed(true);
  };

  /* ===== الاقتصاد المفتوح — مصروف عملات من داخل المُصيّرات
     (سلّم التلميحات المتدرجة أول المستفيدين) ===== */
  const handleSpendCoins = (amount: number): boolean => {
    if (status !== "answering" || amount <= 0) return false;
    if (coins < amount) {
      toast({
        title: "عملات غير كافية",
        description: `تحتاج ${amount.toLocaleString("ar-EG")} عملة لكشف هذه الدرجة — أجب عن أسئلة صحيحة لتكسب المزيد`,
        variant: "destructive",
      });
      return false;
    }
    setCoins((c) => c - amount);
    setHintsUsed((h) => h + 1);
    return true;
  };

  /* ===== تخطّي الأنواع غير المُفعّلة — بلا نقاط ===== */
  const handleSkip = () => {
    toast({
      title: "تم تخطي السؤال",
      description: "واجهة هذا النوع ستُبنى في مرحلة قادمة من خطة التنفيذ",
    });
    advance("skipped");
  };

  /* ===== إعادة اللعب من البداية — الرصيد الافتتاحي من آخر
     قيمة للخاصية (تحُدّثها الصفحة بعد حفظ اقتصاد الجلسة) ===== */
  const handleReplay = () => {
    setPhase("question");
    setQIndex(0);
    setResults([]);
    setEarnedPoints(0);
    setCoins(initialCoins);
    setHintsUsed(0);
    setTimeLeft(level.timeLimit);
    setEndReason("completed");
    resetQuestionState();
  };

  /* ===== حفظ نتيجة الجلسة — القلب النابض لنظام اللاعب:
     التقدم (الأفضل دائماً) + الاقتصاد (المتبقي + المكافأة)
     + الأوسمة (وكل فوز جديد يُحتفى به فوراً) ===== */
  useEffect(() => {
    if (activePhase !== "summary") return;
    const correct = results.filter((r) => r.result === "correct").length;
    const total = level.questions.length;
    const ratio = total > 0 ? correct / total : 0;
    const stars =
      summaryReason === "timeup"
        ? 0
        : ratio === 1
          ? 3
          : ratio >= 0.7
            ? 2
            : ratio >= 0.4
              ? 1
              : 0;

    const freshBadges = recordLevelResult(level.id, stars, earnedPoints, {
      hintsUsed,
      timeTaken:
        level.timeLimit > 0 ? level.timeLimit - timeLeft : null,
      timeLimit: level.timeLimit,
      coinsLeft: coins,
      /* المكافأة اليومية تُمنح في الخادم (RewardLedger) — لا تُمنح محلياً مرتين */
      levelReward: isDaily ? 0 : level.reward,
      difficulty: level.difficulty,
      chapterTitle: level.chapterTitle ?? null,
    });

    /* الاحتفال بالأوسمة الجديدة — وسام بعد وسام بأناقة */
    for (const badgeId of freshBadges) {
      const badge = BADGE_MAP[badgeId];
      if (!badge) continue;
      toast({
        title: `وسام جديد: ${badge.title}`,
        description: badge.description,
      });
    }
  }, [activePhase]);

  /* ===== العرض حسب المرحلة ===== */
  if (activePhase === "intro") {
    return <LevelIntro level={level} onStart={startLevel} />;
  }

  if (activePhase === "summary") {
    return (
      <LevelSummary
        level={level}
        results={results}
        earnedPoints={earnedPoints}
        coinsLeft={coins}
        reason={summaryReason}
        onReplay={handleReplay}
        onExit={onExit}
      />
    );
  }

  const Renderer = questionModule.component;
  const feedbackStatus =
    status === "correct" || status === "wrong" ? status : null;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-sand">
      <QuestionShell
        question={question}
        index={qIndex}
        total={level.questions.length}
        results={results}
        coins={coins}
        hintCost={question.hintCost ?? level.hintCost}
        hintRevealed={hintRevealed}
        revealedHintText={question.hint ?? null}
        timeLeft={level.timeLimit > 0 ? timeLeft : null}
        status={status}
        canConfirm={canConfirm}
        hideActionBar={Boolean(questionModule.hideActionBar)}
        onHint={handleHint}
        onConfirm={handleConfirm}
        onExit={onExit}
      >
        <Renderer
          question={question}
          answer={answer}
          onAnswerChange={setAnswer}
          status={status}
          onSkip={handleSkip}
          onSpendCoins={handleSpendCoins}
          onSubmit={handleConfirm}
        />
      </QuestionShell>

      <FeedbackLayer
        status={feedbackStatus}
        question={question}
        correctAnswerText={
          isDaily
            ? serverAnswer
            : questionModule.correctAnswerText
              ? questionModule.correctAnswerText(question)
              : null
        }
        explanationText={isDaily ? serverExplanation : undefined}
        onContinue={() =>
          isDaily ? handleDailyContinue() : advance("wrong")
        }
      />
    </div>
  );
}
