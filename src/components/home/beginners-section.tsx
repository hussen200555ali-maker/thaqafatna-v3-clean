"use client";

/**
 * قسم البدايات (Beginners Section)
 * ===================================
 * خريطة الفصول — البطاقات تُجمَّع حسب فصلها من قاعدة الإدارة،
 * ولكل فصل عنوانه وعدد مراحله.
 *
 * نظام القفل التدريجي: المرحلة المقفلة تُعرض بأسلوب باهت مع قفل
 * مركزي بدل الرقم — وعدّاد النجوم مخفي (لا نجوم قبل الفتح).
 *
 * البيانات: تُمرّر من الصفحة الرئيسية (قائمة حية من /api/levels)،
 * وتبقى القائمة الثابتة في data.ts شبكة أمان عند تعذّر الاتصال.
 */

import { motion } from "framer-motion";
import { Lock, Star, Sun } from "lucide-react";
import type { BeginnerLevel } from "./data";
import { SectionHeader } from "./section-header";

interface BeginnersSectionProps {
  onSelect?: (level: BeginnerLevel) => void;
  /** القائمة الحية من قاعدة الإدارة — الثابتة بديل تلقائي */
  levels?: BeginnerLevel[];
}

/** تجميع المراحل المتتالية تحت عنوان فصلها */
function groupByChapter(levels: BeginnerLevel[]) {
  const groups: Array<{ title: string; levels: BeginnerLevel[] }> = [];
  for (const level of levels) {
    const title = level.chapterTitle?.trim() || "مراحل عامة";
    const last = groups[groups.length - 1];
    if (last && last.title === title) {
      last.levels.push(level);
    } else {
      groups.push({ title, levels: [level] });
    }
  }
  return groups;
}

export function BeginnersSection({ onSelect, levels }: BeginnersSectionProps) {
  const list = levels && levels.length > 0 ? levels : [];
  const chapters = groupByChapter(list);
  let cardIndex = 0; /* عدّاد التتابع الحركي عبر الفصول */

  return (
    <section aria-label="قسم البدايات" className="space-y-5">
      <SectionHeader title="خريطة الفصول" sideText="رحلة التدرّج" />

      {chapters.map((chapter) => (
        <div key={chapter.title} className="space-y-3">
          {/* عنوان الفصل — خط جانبي ذهبي */}
          <div className="flex items-center gap-2.5">
            <span
              className="h-4 w-1 rounded-full bg-gradient-to-b from-gold-500 to-gold-400"
              aria-hidden="true"
            />
            <h3 className="font-heading text-[12.5px] font-extrabold text-heritage-900">
              {chapter.title}
            </h3>
            <span className="rounded-full bg-heritage-900/6 px-2 py-0.5 text-[10px] font-bold text-heritage-700/70">
              {chapter.levels.length.toLocaleString("ar-EG")} مراحل
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {chapter.levels.map((level) => {
              const index = cardIndex++;
              return (
                <motion.button
                  key={level.levelId}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: 0.06 * index,
                    ease: "easeOut",
                  }}
                  onClick={() => onSelect?.(level)}
                  aria-label={
                    level.locked
                      ? `${level.title}: مقفلة — أكمل المرحلة السابقة لفتحها`
                      : `${level.title}: ${level.description}`
                  }
                  className={`group relative flex h-36 flex-col overflow-hidden rounded-2xl p-3 text-right transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 ${
                    level.locked
                      ? "bg-sand-dark/70 shadow-none"
                      : "bg-gradient-to-b from-gold-100 via-gold-100 to-sand-dark shadow-card hover:shadow-card-lg active:scale-[0.97]"
                  }`}
                >
                  {/* زخرفة شمسية خلفية — للمراحل المفتوحة فقط */}
                  {!level.locked && (
                    <Sun
                      className="pointer-events-none absolute -bottom-4 -left-4 size-20 text-gold-500/15 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
                      aria-hidden="true"
                    />
                  )}

                  {/* الشارة: رقم المرحلة، أو قفل للمقفلة */}
                  {level.locked ? (
                    <span
                      className="grid size-7 place-items-center rounded-full bg-heritage-900/25 text-heritage-900/60"
                      aria-hidden="true"
                    >
                      <Lock className="size-3.5" strokeWidth={2.4} />
                    </span>
                  ) : (
                    <span
                      className="grid size-7 place-items-center rounded-full bg-heritage-900 font-heading text-sm font-extrabold text-white shadow-card"
                      aria-hidden="true"
                    >
                      {level.id.toLocaleString("ar-EG")}
                    </span>
                  )}

                  {/* النصوص — الوصف حتى سطرين */}
                  <div className="relative mt-2.5 text-right">
                    <h4
                      className={`font-heading text-sm font-extrabold ${
                        level.locked
                          ? "text-heritage-900/45"
                          : "text-heritage-900"
                      }`}
                    >
                      {level.title}
                    </h4>
                    <p
                      className={`mt-0.5 line-clamp-2 pe-1 text-[11px] font-medium leading-snug ${
                        level.locked
                          ? "text-heritage-900/35"
                          : "text-heritage-700/80"
                      }`}
                    >
                      {level.locked
                        ? "أكمل المرحلة السابقة لتفتح هذه البوابة"
                        : level.description}
                    </p>
                  </div>

                  {/* مؤشر النجوم — للمراحل المفتوحة فقط */}
                  {!level.locked && (
                    <div
                      className="mt-auto flex items-center justify-end gap-0.5 pb-0.5"
                      aria-label={`النجوم: ${level.stars} من ${level.totalStars}`}
                    >
                      {Array.from({ length: level.totalStars }).map(
                        (_, starIndex) => (
                          <Star
                            key={starIndex}
                            className={`size-3.5 ${
                              starIndex < level.stars
                                ? "fill-gold-500 text-gold-500"
                                : "fill-sand-darker/40 text-sand-darker/40"
                            }`}
                            aria-hidden="true"
                          />
                        ),
                      )}
                    </div>
                  )}

                  {/* الشريط السفلي الداكن — ذهبي للمقفلة إيحاءً بالكنز */}
                  <span
                    className={`absolute inset-x-0 bottom-0 h-1.5 ${
                      level.locked
                        ? "bg-heritage-900/20"
                        : "bg-gradient-to-l from-heritage-900 to-heritage-700"
                    }`}
                    aria-hidden="true"
                  />
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
