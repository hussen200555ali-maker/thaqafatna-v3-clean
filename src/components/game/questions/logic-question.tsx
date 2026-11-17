"use client";

/**
 * مُصيّر «اللغز الذهني» (Logic Riddle)
 * =======================================
 * النوع الأكثر حرية في لوحة الإدارة (logicData = JSON حرّ) — لذا
 * يبدأ بمحلّل دفاعي يكشف «شكل اللغز» المدعوم ثم يرسمه:
 *
 *   sequence (متتالية): عناصر متتابعة بأسهم اتجاهها من اليمين
 *     لليسار (RTL)، آخرها خانة «؟» ذهبية — والاختيار من بطاقات
 *     الخيارات المشتركة (نفس بطاقات الاختيار من متعدد — DRY).
 *
 *   oddOne (الشاذ): بلاطات معروض في شبكة عمودين — ثلاثة يجمعها
 *     قاسم مشترك ورابع شاذ؛ اللاعب يلتقط الشاذ بنقرة.
 *
 *   أي شكل آخر غير مفهوم: بطاقة اعتذار أنيقة + زر تخطٍّ — الفشل
 *   المنعزل لا يُسقط المرحلة (نفس فلسفة طبقة التطبيع).
 *
 * حالة الإجابة: فهرس الخيار المختار (رقم) — مطابق للاختيار من متعدد.
 */

import { motion } from "framer-motion";
import { Brain, ChevronLeft, CircleHelp, ScanSearch } from "lucide-react";
import type {
  LogicQuestion,
  QuestionRendererProps,
} from "@/lib/game/types";
import { OptionCards } from "../shared/option-cards";

/** الشكل المفهوم بعد التحليل — موحّد للنوعين */
interface LogicShape {
  kind: "sequence" | "oddOne";
  /** عناصر العرض: المتتالية أو بلاطات الشاذ */
  items: string[];
  /** خيارات الاختيار — في الشاذ تساوي البلاطات نفسها */
  options: string[];
  correctIndex: number;
}

/** تحويل قيمة JSON خامّة إلى نص عرض آمن */
function coerceText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value))
    return value.toLocaleString("ar-EG");
  return null;
}

/** قراءة مصفوفة نصية من JSON بتحويل مرن للأرقام */
function coerceList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(coerceText)
    .filter((v): v is string => v !== null);
}

/**
 * المحلّل الدفاعي — يفهم kind بأشكاله (إنجليزية أو عربية)
 * ويقبل correctIndex نصاً أو رقماً (عادة نماذج الإدخال).
 */
export function parseLogicShape(
  data: Record<string, unknown>,
): LogicShape | null {
  const rawKind = typeof data.kind === "string" ? data.kind.trim().toLowerCase() : "";
  const kind: LogicShape["kind"] =
    rawKind === "oddone" || rawKind === "odd" || rawKind.includes("شاذ")
      ? "oddOne"
      : "sequence";

  const items = coerceList(data.items);
  if (items.length < 2) return null;

  const options = coerceList(data.options);
  const finalOptions = options.length >= 2 ? options : items;

  const correctRaw = data.correctIndex ?? data.correct;
  const correctIndex =
    typeof correctRaw === "number" && Number.isFinite(correctRaw)
      ? correctRaw
      : typeof correctRaw === "string" && correctRaw.trim() !== "" &&
          !Number.isNaN(Number(correctRaw))
        ? Number(correctRaw)
        : null;

  if (correctIndex === null || correctIndex < 0 || correctIndex >= finalOptions.length)
    return null;

  return { kind, items, options: finalOptions, correctIndex };
}

export function LogicQuestion({
  question,
  answer,
  onAnswerChange,
  status,
  onSkip,
}: QuestionRendererProps) {
  const q = question as LogicQuestion;
  const selected = typeof answer === "number" ? answer : null;
  const locked = status !== "answering";

  const shape = parseLogicShape(q.logicData);

  /* ===== شكل غير مفهوم — اعتذار أنيق بلا تعطيل ===== */
  if (!shape) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-heritage-900/20 bg-sand/60 p-6 text-center">
        <Brain
          className="mx-auto size-10 text-heritage-900/30"
          aria-hidden="true"
        />
        <p className="mt-3 text-[12px] font-bold leading-relaxed text-heritage-900/60">
          بيانات هذا اللغز الذهني بصيغةٍ لم تُفهم بعد — سجّل ملاحظتك
          للإدارة وسنستكمل دعمها
        </p>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="mt-4 h-11 rounded-2xl bg-heritage-900 px-6 font-heading text-xs font-extrabold text-white shadow-card transition-all duration-150 hover:bg-heritage-800 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
          >
            تخطي السؤال
          </button>
        )}
      </div>
    );
  }

  const handleSelect = (index: number) => {
    if (locked) return;
    onAnswerChange(index);
  };

  /* ===== بلاطة عنصر الشاذ — حالة مستقلة عن بطاقات الخيارات ===== */
  const oddTileClass = (index: number): string => {
    const isSelected = selected === index;
    const isCorrect = index === shape.correctIndex;

    if (locked) {
      if (isCorrect)
        return "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-card";
      if (isSelected) return "border-red-400 bg-red-50 text-red-700";
      return "border-heritage-900/12 bg-white text-heritage-900/50";
    }
    if (isSelected)
      return "border-gold-500 bg-gold-100/60 text-heritage-950 shadow-card ring-2 ring-gold-500/40";
    return "border-heritage-900/12 bg-white text-heritage-900 hover:border-gold-500/50 hover:bg-gold-100/30";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={
        status === "wrong"
          ? { opacity: 1, y: 0, x: [0, -7, 7, -5, 5, 0] }
          : { opacity: 1, y: 0 }
      }
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-4"
    >
      {/* ===== الشكل الأول: المتتالية ===== */}
      {shape.kind === "sequence" && (
        <div
          className="rounded-2xl border-2 border-heritage-900/10 bg-white p-4 shadow-card"
          role="group"
          aria-label="متتالية اللغز الذهني"
        >
          <p className="mb-3 flex items-center justify-center gap-1.5 text-center text-[11px] font-bold text-muted-foreground">
            <ScanSearch className="size-3.5 shrink-0" aria-hidden="true" />
            تتبّع النمط في المتتالية — ما العنصر الغائب؟
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1">
            {shape.items.map((item, index) => (
              <motion.div
                key={`${item}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="flex items-center gap-1"
              >
                <span className="rounded-xl border-2 border-heritage-900/12 bg-sand/70 px-3 py-2 font-heading text-[13px] font-extrabold text-heritage-950">
                  {item}
                </span>
                <ChevronLeft
                  className="size-4 text-gold-600/70"
                  aria-hidden="true"
                />
              </motion.div>
            ))}

            {/* خانة الغائب — «؟» الذهبية */}
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: shape.items.length * 0.1, type: "spring", stiffness: 300, damping: 18 }}
              className={`grid min-w-11 place-items-center rounded-xl border-2 px-3 py-2 font-heading text-lg font-extrabold ${
                status === "correct"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-dashed border-gold-500/70 bg-gold-100/40 text-gold-700"
              }`}
              aria-label="العنصر الغائب — عليك اختياره"
            >
              {status === "correct" ? shape.options[shape.correctIndex] : "؟"}
            </motion.span>
          </div>
        </div>
      )}

      {/* ===== الشكل الثاني: الشاذ — شبكة البلاطات ===== */}
      {shape.kind === "oddOne" && (
        <div
          className="grid grid-cols-2 gap-2.5"
          role="radiogroup"
          aria-label="اختر العنصر الشاذ"
        >
          {shape.items.map((item, index) => (
            <motion.button
              key={`${item}-${index}`}
              type="button"
              role="radio"
              aria-checked={selected === index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              whileTap={locked ? undefined : { scale: 0.97 }}
              onClick={() => handleSelect(index)}
              aria-label={`البلاطة: ${item}`}
              className={`flex min-h-16 items-center justify-center rounded-2xl border-2 p-3 text-center font-heading text-[13px] font-extrabold leading-relaxed transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 ${oddTileClass(index)}`}
            >
              {item}
            </motion.button>
          ))}
        </div>
      )}

      {/* ===== بطاقات الاختيار — للمتتالية فقط
             (الشاذ يُجاب بالنقر على البلاطات مباشرة) ===== */}
      {shape.kind === "sequence" && (
        <OptionCards
          options={shape.options}
          selected={selected}
          correctIndex={shape.correctIndex}
          revealResult={locked}
          onSelect={handleSelect}
          ariaLabel="خيارات العنصر الغائب"
        />
      )}

      {/* إرشاد مصغّر للشاذ */}
      {shape.kind === "oddOne" && (
        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] font-medium leading-relaxed text-heritage-900/60">
          <CircleHelp className="size-3.5 shrink-0" aria-hidden="true" />
          ثلاثة من البلاطات يجمعها قاسم مشترك — التقط الرابع الشاذ
        </p>
      )}
    </motion.div>
  );
}

/** وحدة التسجيل — التحليل الدفاعي نفسه يغذّي منطق التحقق */
export const logicModule = {
  component: LogicQuestion,
  isComplete: (q: LogicQuestion, answer: unknown) => {
    const shape = parseLogicShape(q.logicData);
    if (!shape) return false;
    return (
      typeof answer === "number" && answer >= 0 && answer < shape.options.length
    );
  },
  checkAnswer: (q: LogicQuestion, answer: unknown) => {
    const shape = parseLogicShape(q.logicData);
    if (!shape) return false;
    return answer === shape.correctIndex;
  },
  correctAnswerText: (q: LogicQuestion) => {
    const shape = parseLogicShape(q.logicData);
    return shape ? shape.options[shape.correctIndex] : "";
  },
};
