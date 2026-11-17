"use client";

/**
 * القشرة الموحدة للسؤال (Question Shell)
 * =========================================
 * «الجسد المشترك» لكل أنواع الأسئلة — يضمن أن اللاعب يرى
 * الهوية نفسها ويتعلم النمط نفسه أياً كان نوع السؤال:
 *
 *   شريط علوي ثابت : خروج + مؤشر التقدم (نقاط ملونة بالنتيجة)
 *                    + مؤقت + رصيد العملات
 *   رأس السؤال     : شارة النوع + شارة النقاط + نص السؤال
 *   منطقة التمرير  : المُصيّر المتنوع (المكان الوحيد المختلف)
 *   شريط الإجراءات : زر التلميح (بتكلفة) + زر التأكيد الموحد
 *
 * معايرة المسافات: شريط الإجراءات يحترم المنطقة الآمنة
 * لنظام iOS (safe-area) ومنطقة التمرير تتضمن حشوة سفلية
 * كافية حتى لا يختفي آخر عنصر تحت الشريط أبداً.
 */

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Coins, Lightbulb, Timer, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  Question,
  QuestionResult,
  QuestionStatus,
} from "@/lib/game/types";
import { PUZZLE_META } from "./puzzle-meta";

/** تنسيق الثواني بدقائق عربية (م:ثث) */
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toLocaleString("ar-EG").padStart(2, "٠");
  return `${pad(minutes)}:${pad(seconds)}`;
}

interface QuestionShellProps {
  question: Question;
  /** فهرس السؤال الحالي (من صفر) */
  index: number;
  total: number;
  /** نتائج الأسئلة السابقة — لتلوين نقاط التقدم */
  results: QuestionResult[];
  coins: number;
  hintCost: number;
  hintRevealed: boolean;
  /** نص التلميح المكتشف — يظهر في شريط ذهبي فوق الأزرار */
  revealedHintText: string | null;
  /** الثواني المتبقية — null يعني بلا مؤقت */
  timeLeft: number | null;
  status: QuestionStatus;
  canConfirm: boolean;
  hideActionBar: boolean;
  onHint: () => void;
  onConfirm: () => void;
  onExit: () => void;
  /** مُصيّر السؤال — الجزء الوحيد المتغيّر */
  children: ReactNode;
}

export function QuestionShell({
  question,
  index,
  total,
  results,
  coins,
  hintCost,
  hintRevealed,
  revealedHintText,
  timeLeft,
  status,
  canConfirm,
  hideActionBar,
  onHint,
  onConfirm,
  onExit,
  children,
}: QuestionShellProps) {
  const [confirmExit, setConfirmExit] = useState(false);
  const meta = PUZZLE_META[question.type];
  const answering = status === "answering";
  const timeCritical = timeLeft !== null && timeLeft <= 30;

  /* لون نقطة التقدم حسب نتيجة السؤال السابق */
  const dotClass = (dotIndex: number): string => {
    if (dotIndex > index) return "bg-sand-darker";
    if (dotIndex < index) {
      const result = results[dotIndex];
      if (result?.result === "correct") return "bg-gold-500";
      if (result?.result === "wrong") return "bg-red-400";
      return "bg-heritage-300";
    }
    return "bg-heritage-900 ring-2 ring-gold-500/60 ring-offset-1 ring-offset-sand";
  };

  return (
    <div className="relative flex h-full flex-col bg-sand">
      {/* ============ الشريط العلوي ============ */}
      <header className="glass-header z-10 flex items-center gap-2 border-b border-heritage-900/8 px-3 py-2.5">
        {/* زر الخروج — مع حوار تأكيد حتى لا يفقد اللاعب تقدمه سهواً */}
        <button
          type="button"
          onClick={() => setConfirmExit(true)}
          aria-label="الخروج من المرحلة"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-white/80 text-heritage-900 shadow-card transition-all duration-150 hover:bg-white active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
        >
          <X className="size-4.5" aria-hidden="true" />
        </button>

        {/* مؤشر التقدم — نقاط ملونة + عدّاد رقمي */}
        <div
          className="flex min-w-0 flex-1 flex-col items-center gap-1"
          aria-label={`السؤال ${(index + 1).toLocaleString("ar-EG")} من ${total.toLocaleString("ar-EG")}`}
        >
          <div className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, dotIndex) => (
              <span
                key={dotIndex}
                aria-hidden="true"
                className={`h-2 w-2 rounded-full transition-colors duration-300 ${dotClass(dotIndex)}`}
              />
            ))}
          </div>
          <p className="font-heading text-[10px] font-bold text-heritage-700/70">
            السؤال {(index + 1).toLocaleString("ar-EG")} من{" "}
            {total.toLocaleString("ar-EG")}
          </p>
        </div>

        {/* المؤقت — يتحول برتقالياً نابضاً عند آخر ٣٠ ثانية */}
        {timeLeft !== null && (
          <span
            className={`flex shrink-0 items-center gap-1 rounded-full bg-white/80 px-2.5 py-1.5 font-heading text-[11px] font-bold shadow-card ${
              timeCritical ? "animate-pulse text-flame-600" : "text-heritage-900"
            }`}
            aria-label={`الوقت المتبقي ${formatTime(timeLeft)}`}
          >
            <Timer className="size-3.5" aria-hidden="true" />
            {formatTime(timeLeft)}
          </span>
        )}

        {/* رصيد العملات */}
        <span
          className="flex shrink-0 items-center gap-1 rounded-full bg-white/80 px-2.5 py-1.5 font-heading text-[11px] font-bold text-gold-700 shadow-card"
          aria-label={`رصيد العملات ${coins.toLocaleString("ar-EG")}`}
        >
          <Coins className="size-3.5" aria-hidden="true" />
          {coins.toLocaleString("ar-EG")}
        </span>
      </header>

      {/* ============ منطقة المحتوى القابلة للتمرير ============ */}
      <div className="scrollbar-thin-gold flex-1 overflow-y-auto">
        {/* رأس السؤال — شارة النوع + النقاط + نص السؤال */}
        <div className="px-4 pb-2 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold ${meta.chipClass}`}
            >
              <meta.icon className="size-3.5" aria-hidden="true" />
              {meta.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-3 py-1 text-[10px] font-extrabold text-gold-700">
              +{question.points.toLocaleString("ar-EG")} نقطة
            </span>
            {question.category && (
              <span className="ms-auto text-[10px] font-medium text-muted-foreground">
                {question.category}
              </span>
            )}
          </div>

          <h2 className="mt-3 font-heading text-[17px] font-extrabold leading-loose text-heritage-950">
            {question.clue}
          </h2>
        </div>

        {/* المُصيّر المتنوع — الجزء الوحيد المختلف بين الأنواع */}
        <div className="px-4 pb-8 pt-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 14 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ============ شريط الإجراءات السفلي ============ */}
      {!hideActionBar && (
        <div className="z-10 border-t border-heritage-900/8 bg-white/90 backdrop-blur-md">
          {/* شريط التلميح المكتشف */}
          <AnimatePresence>
            {hintRevealed && revealedHintText && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-gold-500/40 bg-gold-100/70 px-3.5 py-2.5">
                  <Lightbulb
                    className="mt-0.5 size-4 shrink-0 text-gold-700"
                    aria-hidden="true"
                  />
                  <p className="text-[11.5px] font-medium leading-relaxed text-gold-700">
                    {revealedHintText}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3 px-4 pb-[max(env(safe-area-inset-bottom),14px)] pt-3">
            {/* زر التلميح — يخصم من رصيد العملات */}
            <button
              type="button"
              onClick={onHint}
              disabled={hintRevealed || !answering || !question.hint}
              aria-label={
                hintRevealed
                  ? "التلميح مستخدم"
                  : `شراء تلميح بتكلفة ${hintCost.toLocaleString("ar-EG")} عملة`
              }
              className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-2xl border-2 border-gold-500/50 bg-gold-100/60 px-4 font-heading text-xs font-extrabold text-gold-700 transition-all duration-150 hover:bg-gold-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
            >
              <Lightbulb className="size-4" aria-hidden="true" />
              {hintRevealed ? "تلميح" : `تلميح ${hintCost.toLocaleString("ar-EG")}`}
            </button>

            {/* زر التأكيد الموحد — نفس المكان في كل الأنواع */}
            <motion.button
              type="button"
              whileTap={canConfirm && answering ? { scale: 0.97 } : undefined}
              onClick={onConfirm}
              disabled={!canConfirm || !answering}
              className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl font-heading text-sm font-extrabold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 ${
                canConfirm && answering
                  ? "bg-heritage-900 text-white shadow-card-lg hover:bg-heritage-800 active:scale-[0.98]"
                  : "cursor-not-allowed bg-sand-darker text-muted-foreground"
              }`}
            >
              <Check className="size-4.5" aria-hidden="true" />
              تأكيد الإجابة
            </motion.button>
          </div>
        </div>
      )}

      {/* ============ حوار تأكيد الخروج ============ */}
      <AlertDialog open={confirmExit} onOpenChange={setConfirmExit}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle className="font-heading">
              الخروج من المرحلة؟
            </AlertDialogTitle>
            <AlertDialogDescription>
              سيُفقد تقدمك في هذه المرحلة ولن تحصل على نقاطها. هل أنت متأكد؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="font-heading font-bold">
              متابعة اللعب
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onExit}
              className="bg-red-500 font-heading font-bold text-white hover:bg-red-600"
            >
              خروج
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
