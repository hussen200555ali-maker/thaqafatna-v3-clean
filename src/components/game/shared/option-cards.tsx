"use client";

/**
 * بطاقات الخيارات المشتركة (Shared Option Cards)
 * ================================================
 * قائمة الخيارات العمودية المميّزة بحروف الترتيب (أ ب ج د) —
 * مستخرجة من مُصيّر الاختيار من متعدد لتخدم كل الأنواع الخيارية:
 *
 *   multiple (اختيار من متعدد)  |  logic (اللغز الذهني — المتتاليات)
 *
 * نفس الهوية في كل مكان: حرف ترتيب، نص يلتف طبيعياً، توهّج ذهبي
 * عند التحديد، وتلوين التصحيح (أخضر للصحيح / أحمر للخطأ) عند القفل.
 */

import { motion } from "framer-motion";
import { Check, CheckCircle2, XCircle } from "lucide-react";

/** حروف الترتيب — بديل عربي أصيل لـ A/B/C/D */
const ORDER_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و"];

export interface OptionCardsProps {
  /** نصوص الخيارات بترتيب لوحة الإدارة */
  options: string[];
  /** فهرس الخيار المحدد حالياً — null يعني بلا تحديد */
  selected: number | null;
  /** فهرس الخيار الصحيح — يُستخدم للتلوين عند كشف النتيجة فقط */
  correctIndex: number | null;
  /** قفل التفاعل وكشف نتائج التصحيح (حالتي صحيح/خطأ) */
  revealResult: boolean;
  onSelect: (index: number) => void;
  /** وصف المجموعة لقارئ الشاشة */
  ariaLabel?: string;
}

export function OptionCards({
  options,
  selected,
  correctIndex,
  revealResult,
  onSelect,
  ariaLabel = "خيارات الإجابة",
}: OptionCardsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-2.5"
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((option, index) => {
        const isSelected = selected === index;
        const isCorrect = index === correctIndex;

        /* أصناف الحالة — المحايدة / المحددة / نتيجة التصحيح */
        let stateClass =
          "border-heritage-900/12 bg-white text-heritage-900 hover:border-gold-500/50 hover:bg-gold-100/30";
        let badgeClass = "bg-sand-dark text-heritage-800";

        if (isSelected && !revealResult) {
          stateClass =
            "border-gold-500 bg-gold-100/60 text-heritage-950 shadow-card";
          badgeClass = "bg-heritage-900 text-white";
        }
        if (revealResult && isCorrect) {
          stateClass =
            "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-card";
          badgeClass = "bg-emerald-600 text-white";
        }
        if (revealResult && isSelected && !isCorrect) {
          stateClass = "border-red-400 bg-red-50 text-red-700";
          badgeClass = "bg-red-500 text-white";
        }

        return (
          <motion.button
            key={index}
            type="button"
            role="radio"
            aria-checked={isSelected}
            whileTap={revealResult ? undefined : { scale: 0.97 }}
            onClick={() => onSelect(index)}
            className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-right transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 ${stateClass}`}
          >
            {/* حرف الترتيب */}
            <span
              aria-hidden="true"
              className={`grid size-9 shrink-0 place-items-center rounded-xl font-heading text-sm font-extrabold transition-colors duration-150 ${badgeClass}`}
            >
              {ORDER_LETTERS[index] ?? (index + 1).toLocaleString("ar-EG")}
            </span>

            {/* نص الخيار — يلتفّ طبيعياً مهما طال */}
            <span className="min-w-0 flex-1 text-[13px] font-medium leading-relaxed">
              {option}
            </span>

            {/* علامات الحالة */}
            {isSelected && !revealResult && (
              <Check className="size-5 shrink-0 text-gold-600" aria-hidden="true" />
            )}
            {revealResult && isCorrect && (
              <CheckCircle2
                className="size-5 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
            )}
            {revealResult && isSelected && !isCorrect && (
              <XCircle className="size-5 shrink-0 text-red-500" aria-hidden="true" />
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
