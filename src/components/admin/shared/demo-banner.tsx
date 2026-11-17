"use client";

/**
 * شارة «بيانات تجريبية» — تُظهر فوق المحتوى التوضيحي
 * حتى يعرف المشرف أن ما يراه عرضٌ للمخطط النهائي لا بيانات حية
 */

import { Info } from "lucide-react";
import type { ReactNode } from "react";

export function DemoBanner({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl border border-gold-500/30 bg-gold-100/50 px-4 py-2.5 text-[11px] font-medium leading-relaxed text-gold-700"
      role="note"
    >
      <Info className="size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
