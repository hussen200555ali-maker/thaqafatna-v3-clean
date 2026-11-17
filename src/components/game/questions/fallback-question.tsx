"use client";

/**
 * المُصيّر الاحتياطي (Fallback Renderer)
 * =======================================
 * شبكة الأمان المعمارية: أي نوع سؤال من لوحة الإدارة لم تُبنَ
 * واجهته بعد (مثل: audio / logic / mixed...) يظهر عبر هذه
 * البطاقة الأنيقة بدلاً من تعطّل المرحلة أو ظهور خطأ.
 *
 * يعرض السؤال الفعلي (إثباتاً لسلامة تدفق البيانات) مع زر
 * «متابعة» يتخطى السؤال بلا نقاط — فلا يتوقف مسار اللاعب أبداً.
 */

import { motion } from "framer-motion";
import { Hammer, MoveLeft } from "lucide-react";
import type { QuestionRendererProps } from "@/lib/game/types";
import { PUZZLE_META } from "../puzzle-meta";

export function FallbackQuestion({
  question,
  onSkip,
}: QuestionRendererProps) {
  const meta = PUZZLE_META[question.type];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      aria-label={`سؤال من نوع ${meta.label} — واجهته قيد التطوير`}
      className="rounded-2xl border-2 border-dashed border-heritage-900/20 bg-heritage-50/70 p-6 text-center shadow-card"
    >
      {/* أيقونة النوع داخل دائرة بيضاء */}
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-white shadow-card">
        <meta.icon className="size-7 text-heritage-700" aria-hidden="true" />
      </div>

      <h3 className="mt-4 font-heading text-base font-extrabold text-heritage-900">
        نوع «{meta.label}»
      </h3>
      <p className="mt-1 text-[11px] font-bold text-gold-700">
        واجهة هذا النوع قيد التصميم — المرحلة القادمة من خطة التنفيذ
      </p>

      {/* السؤال الفعلي — البيانات تصل سليمة من لوحة الإدارة */}
      <div className="mt-4 rounded-xl bg-white/80 p-4 text-right">
        <p className="text-[13px] font-medium leading-relaxed text-heritage-900/85">
          {question.clue}
        </p>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <Hammer className="size-3.5" aria-hidden="true" />
        ستُبنى واجهة هذا النوع على نفس القشرة الموحدة فور اعتمادها
      </p>

      <button
        type="button"
        onClick={() => onSkip?.()}
        className="mt-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-heritage-900 px-8 font-heading text-sm font-extrabold text-white shadow-card transition-all duration-150 hover:bg-heritage-800 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
      >
        <MoveLeft className="size-4" aria-hidden="true" />
        متابعة — بلا نقاط
      </button>
    </motion.section>
  );
}
