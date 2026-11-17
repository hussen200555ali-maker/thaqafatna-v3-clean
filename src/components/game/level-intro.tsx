"use client";

/**
 * شاشة مقدمة المرحلة (Level Intro)
 * ====================================
 * تحوّل الحقلين التربويين في لوحة الإدارة إلى لحظة قيمة قبل
 * اللعب: الأهداف التعليمية (learningGoals) والوصف التربوي
 * (educationalDescription) — فتعرف ماذا ستتعلم قبل أن تلعب.
 *
 * تعرض كذلك رقائق أنواع الأسئلة القادمة (المُفعّلة منها بنقطة
 * زمردية، وغير المُفعّلة بشارة «قيد التطوير») — شفافية كاملة
 * مع اللاعب أثناء البناء التدريجي للواجهات.
 */

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Coins,
  GraduationCap,
  Hammer,
  Play,
  Sparkles,
} from "lucide-react";
import type { GameLevel } from "@/lib/game/types";
import { implementedPuzzleTypes, isPuzzleTypeImplemented } from "./registry";
import { PUZZLE_META } from "./puzzle-meta";

interface LevelIntroProps {
  level: GameLevel;
  onStart: () => void;
}

const DIFFICULTY_LABELS: Record<GameLevel["difficulty"], string> = {
  easy: "سهلة",
  medium: "متوسطة",
  hard: "صعبة",
};

const DIFFICULTY_CLASS: Record<GameLevel["difficulty"], string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-gold-100 text-gold-700",
  hard: "bg-flame-100 text-flame-600",
};

export function LevelIntro({ level, onStart }: LevelIntroProps) {
  /** الأنواع الفريدة في المرحلة — بلا تكرار وبترتيب الظهور */
  const questionTypes = [...new Set(level.questions.map((q) => q.type))];

  return (
    <div className="scrollbar-thin-gold h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-md px-4 pb-[max(env(safe-area-inset-bottom),20px)] pt-6">
        {/* البطاقة الترحيبية بالمرحلة — نفس روح البطاقة الرئيسية */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-tl from-heritage-900 via-heritage-800 to-heritage-700 p-5 text-white shadow-card-lg"
        >
          <div
            className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.13)_1px,transparent_0)] [background-size:18px_18px]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-12 -start-12 size-44 rounded-full bg-gold-500/15 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10px] font-bold backdrop-blur-sm">
                {level.chapterTitle}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${DIFFICULTY_CLASS[level.difficulty]}`}
              >
                {DIFFICULTY_LABELS[level.difficulty]}
              </span>
            </div>

            <h1 className="mt-4 font-heading text-2xl font-extrabold">
              {level.title}
            </h1>
            {level.educationalDescription && (
              <p className="mt-2 max-w-[34ch] text-[12.5px] leading-relaxed text-white/80">
                {level.educationalDescription}
              </p>
            )}

            {/* شريط معلومات المرحلة */}
            <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-white/15 bg-white/10 px-2 py-2.5 backdrop-blur-sm">
                <dt className="text-[10px] text-white/70">الأسئلة</dt>
                <dd className="font-heading text-sm font-bold">
                  {level.questions.length.toLocaleString("ar-EG")}
                </dd>
              </div>
              <div className="flex items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm">
                <dt className="sr-only">الوقت المتاح</dt>
                <dd className="flex items-center gap-1.5 py-2.5 font-heading text-sm font-bold">
                  <Clock className="size-4 text-gold-400" aria-hidden="true" />
                  {level.timeLimit > 0
                    ? `${Math.round(level.timeLimit / 60).toLocaleString("ar-EG")} دقائق`
                    : "بلا وقت"}
                </dd>
              </div>
              <div className="flex items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm">
                <dt className="sr-only">أقصى مكافأة</dt>
                <dd className="flex items-center gap-1.5 py-2.5 font-heading text-sm font-bold">
                  <Coins className="size-4 text-gold-400" aria-hidden="true" />
                  {level.questions
                    .reduce((sum, q) => sum + q.points, 0)
                    .toLocaleString("ar-EG")}
                </dd>
              </div>
            </dl>
          </div>
        </motion.section>

        {/* الأهداف التعليمية */}
        {level.learningGoals.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
            className="mt-4 rounded-2xl bg-white p-5 shadow-card"
            aria-label="الأهداف التعليمية"
          >
            <h2 className="flex items-center gap-2 font-heading text-sm font-extrabold text-heritage-950">
              <GraduationCap className="size-4.5 text-gold-600" aria-hidden="true" />
              ماذا ستتعلم في هذه المرحلة؟
            </h2>
            <ul className="mt-3 space-y-2.5">
              {level.learningGoals.map((goal, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.08, duration: 0.3 }}
                  className="flex items-start gap-2.5"
                >
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  <span className="text-[12.5px] font-medium leading-relaxed text-heritage-900/85">
                    {goal}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* رقائق أنواع الأسئلة القادمة */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2, ease: "easeOut" }}
          className="mt-4 rounded-2xl bg-white p-5 shadow-card"
          aria-label="أنواع الأسئلة في هذه المرحلة"
        >
          <h2 className="flex items-center gap-2 font-heading text-sm font-extrabold text-heritage-950">
            <Sparkles className="size-4.5 text-flame-500" aria-hidden="true" />
            تحديات تنتظرك
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {questionTypes.map((type) => {
              const meta = PUZZLE_META[type];
              const implemented = isPuzzleTypeImplemented(type);
              return (
                <span
                  key={type}
                  className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-[10.5px] font-extrabold ${
                    implemented
                      ? "border-heritage-900/10 bg-white text-heritage-900"
                      : "border-dashed border-heritage-900/20 bg-sand/60 text-heritage-900/50"
                  }`}
                >
                  <meta.icon className="size-3.5" aria-hidden="true" />
                  {meta.label}
                  {implemented ? (
                    <CheckCircle2
                      className="size-3 text-emerald-600"
                      aria-hidden="true"
                    />
                  ) : (
                    <Hammer className="size-3 text-gold-600" aria-hidden="true" />
                  )}
                </span>
              );
            })}
          </div>
        </motion.section>

        {/* زر البدء */}
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3, ease: "easeOut" }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="mt-6 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-l from-gold-500 to-gold-400 font-heading text-base font-extrabold text-heritage-950 shadow-glow-gold transition-all duration-200 hover:brightness-105 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
        >
          <Play className="size-5 fill-heritage-950" aria-hidden="true" />
          ابدأ المرحلة
        </motion.button>

        <p className="mt-3 pb-2 text-center text-[10px] font-medium leading-relaxed text-muted-foreground">
          {implementedPuzzleTypes.length.toLocaleString("ar-EG")} نوع تحدٍّ
          مُفعّل بالكامل — كل ما تدعمه لوحة الإدارة جاهز للعب
        </p>
      </div>
    </div>
  );
}
