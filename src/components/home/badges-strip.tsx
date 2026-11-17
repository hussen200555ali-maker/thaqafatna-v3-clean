"use client";

/**
 * شريط الأوسمة (Badges Strip)
 * ==============================
 * ثمانية أوسمة حقيقية — المفتوحة بألوانها الكاملة وتاريخ فوزها،
 * والمقفلة بصورة رمادية وقفل صغير. شريط أفقي قابل للتمرير على
 * الجوال (max-h غير لازم — الاتساع الأفقي فقط) مع إخفاء أنيق
 * لأشرطة التمرير.
 *
 * القراءة: useBadges من مخزن اللاعب — يتحدّث لحظة أي فوز جديد.
 */

import { Lock } from "lucide-react";
import { BADGES } from "@/lib/game/badges";
import { useBadges } from "@/lib/game/progress-store";
import { SectionHeader } from "./section-header";

/** تنسيق تاريخ الفوز بالعربية — مختصر */
function formatUnlockDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "long",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function BadgesStrip() {
  const badges = useBadges();
  const unlockedCount = Object.keys(badges).length;

  return (
    <section aria-label="الأوسمة" className="space-y-3">
      <SectionHeader
        title="خزانة الأوسمة"
        sideText={`${unlockedCount.toLocaleString("ar-EG")} من ${BADGES.length.toLocaleString("ar-EG")}`}
      />

      <div className="scrollbar-thin-gold flex gap-3 overflow-x-auto pb-2">
        {BADGES.map((badge) => {
          const unlockedAt = badges[badge.id];
          const Icon = badge.icon;

          return (
            <div
              key={badge.id}
              className={`flex w-24 shrink-0 flex-col items-center gap-2 rounded-2xl p-3 text-center shadow-card ${
                unlockedAt ? "bg-white" : "bg-white/55"
              }`}
              aria-label={
                unlockedAt
                  ? `وسام ${badge.title} — ${badge.description} — فُتح في ${formatUnlockDate(unlockedAt)}`
                  : `وسام ${badge.title} مقفل — ${badge.description}`
              }
            >
              <span
                className={`relative grid size-12 place-items-center rounded-2xl ${
                  unlockedAt
                    ? badge.accentClass
                    : "bg-sand-darker/30 text-heritage-900/30"
                }`}
              >
                <Icon className="size-6" strokeWidth={2.2} aria-hidden="true" />
                {!unlockedAt && (
                  <span className="absolute -bottom-1 -end-1 grid size-4.5 place-items-center rounded-full bg-heritage-900/70 text-white">
                    <Lock className="size-2.5" aria-hidden="true" />
                  </span>
                )}
              </span>
              <div className="min-w-0">
                <p
                  className={`font-heading text-[11px] font-extrabold leading-tight ${
                    unlockedAt ? "text-heritage-900" : "text-heritage-900/40"
                  }`}
                >
                  {badge.title}
                </p>
                <p className="mt-0.5 text-[9.5px] font-medium leading-tight text-muted-foreground/80">
                  {unlockedAt ? formatUnlockDate(unlockedAt) : badge.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
