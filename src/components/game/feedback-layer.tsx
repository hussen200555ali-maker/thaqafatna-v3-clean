"use client";

/**
 * طبقة التغذية الراجعة الموحدة (Feedback Layer)
 * =================================================
 * لحظة الحكم المشتركة بين كل أنواع الأسئلة — نفس التصميم
 * ونفس الحركة أياً كان نوع السؤال:
 *
 *   صحيح  : طيف ذهبي + دائرة صح نابضة + نقاط مكسب متطايرة
 *           ثم تقدّم تلقائي بعد لحظة.
 *   خطأ   : اهتزاز أحمر + كشف الإجابة الصحيحة + الشرح التعليمي
 *           + زر متابعة (يعطي اللاعب وقت القراءة).
 *
 * كلا الحالتين تعرضان explanation من لوحة الإدارة إن وُجد —
 * الجانب التعليمي جزء من هوية المنصة.
 */

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import type { Question } from "@/lib/game/types";

interface FeedbackLayerProps {
  /** حالة الحكم — null يعني لا طبقة */
  status: "correct" | "wrong" | null;
  question: Question;
  /** نص الإجابة الصحيحة (من وحدة السجل) — يُعرض عند الخطأ */
  correctAnswerText: string | null;
  onContinue: () => void;
}

export function FeedbackLayer({
  status,
  question,
  correctAnswerText,
  onContinue,
}: FeedbackLayerProps) {
  const isCorrect = status === "correct";

  return (
    <AnimatePresence>
      {status && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-heritage-950/45 p-6 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <motion.div
            initial={{ scale: 0.8, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-card-lg"
          >
            {/* أيقونة الحكم */}
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 16,
                delay: 0.08,
              }}
              className={`mx-auto grid size-20 place-items-center rounded-full ${
                isCorrect
                  ? "bg-gradient-to-tl from-gold-500 to-gold-400 shadow-glow-gold"
                  : "bg-red-50"
              }`}
            >
              {isCorrect ? (
                <CheckCircle2
                  className="size-11 text-white"
                  aria-hidden="true"
                  strokeWidth={2.2}
                />
              ) : (
                <XCircle
                  className="size-11 text-red-500"
                  aria-hidden="true"
                  strokeWidth={2.2}
                />
              )}
            </motion.div>

            {/* العنوان */}
            <h3
              className={`mt-4 font-heading text-lg font-extrabold ${
                isCorrect ? "text-heritage-950" : "text-red-600"
              }`}
            >
              {isCorrect ? "إجابة صحيحة!" : "إجابة غير صحيحة"}
            </h3>

            {/* نقاط المكسب — تطفو للأعلى */}
            {isCorrect && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.35 }}
                className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-gold-100 px-4 py-1.5 font-heading text-sm font-extrabold text-gold-700"
              >
                +{question.points.toLocaleString("ar-EG")} نقطة
              </motion.p>
            )}

            {/* كشف الإجابة الصحيحة عند الخطأ */}
            {!isCorrect && correctAnswerText && (
              <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3">
                <p className="text-[10px] font-bold text-emerald-700/70">
                  الإجابة الصحيحة
                </p>
                <p className="mt-0.5 font-heading text-sm font-extrabold text-emerald-800">
                  {correctAnswerText}
                </p>
              </div>
            )}

            {/* الشرح التعليمي المشترك */}
            {question.explanation && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-sand px-3.5 py-3 text-right">
                <Lightbulb
                  className="mt-0.5 size-4 shrink-0 text-gold-600"
                  aria-hidden="true"
                />
                <p className="text-[11.5px] font-medium leading-relaxed text-heritage-900/80">
                  {question.explanation}
                </p>
              </div>
            )}

            {/* زر المتابعة — عند الخطأ فقط؛ الصحيح يتقدّم تلقائياً */}
            {!isCorrect && (
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={onContinue}
                className="mt-5 h-12 w-full rounded-2xl bg-heritage-900 font-heading text-sm font-extrabold text-white shadow-card transition-all duration-150 hover:bg-heritage-800 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
              >
                متابعة المرحلة
              </motion.button>
            )}

            {isCorrect && (
              <p className="mt-4 text-[10px] font-medium text-muted-foreground">
                جارٍ الانتقال للسؤال التالي...
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
