"use client";

/**
 * بطاقة إحصائية — أيقونة وقيمة وعنوان بنبرة لونية
 */

import type { LucideIcon } from "lucide-react";

type StatTone = "heritage" | "gold" | "flame" | "emerald";

const TONE_CLASSES: Record<StatTone, string> = {
  heritage: "bg-heritage-100 text-heritage-700",
  gold: "bg-gold-100 text-gold-700",
  flame: "bg-flame-100 text-flame-600",
  emerald: "bg-emerald-100 text-emerald-700",
};

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  tone?: StatTone;
  /** عند توفيرها تصبح البطاقة زراً قابلاً للنقر */
  onClick?: () => void;
}

export function StatCard({
  icon: Icon,
  value,
  label,
  tone = "heritage",
  onClick,
}: StatCardProps) {
  const content = (
    <>
      <div
        className={`grid size-11 shrink-0 place-items-center rounded-xl ${TONE_CLASSES[tone]}`}
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="font-heading text-xl font-extrabold leading-none text-heritage-900">
          {typeof value === "number" ? value.toLocaleString("ar-EG") : value}
        </p>
        <p className="mt-1.5 truncate text-[11px] font-medium text-muted-foreground">
          {label}
        </p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3.5 rounded-2xl border border-heritage-900/5 bg-white p-4 text-start shadow-card transition-all duration-150 hover:border-gold-500/40 hover:shadow-card-lg active:scale-[0.98]"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-heritage-900/5 bg-white p-4 shadow-card">
      {content}
    </div>
  );
}
