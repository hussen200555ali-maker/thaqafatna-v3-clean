"use client";

/**
 * حالة «قيد التطوير» — قسم مخطَّط في خارطة الطريق
 * يعرض الميزات المزمع بناءها بثقة ووضوح بدل الفراغ
 */

import { CheckCircle2, Hourglass } from "lucide-react";

interface ComingSoonProps {
  title: string;
  /** الميزات المخططة — تُعرض كقائمة مهام مؤكدة */
  features: string[];
  /** ملاحظة إضافية أسفل القائمة */
  note?: string;
}

export function ComingSoon({ title, features, note }: ComingSoonProps) {
  return (
    <div className="rounded-3xl border border-heritage-900/5 bg-white p-8 text-center shadow-card lg:p-12">
      <div
        className="mx-auto grid size-16 place-items-center rounded-3xl bg-heritage-100"
        aria-hidden="true"
      >
        <Hourglass className="size-7 text-heritage-700" />
      </div>
      <h3 className="mt-5 font-heading text-lg font-extrabold text-heritage-900">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
        هذا القسم مُخطَّط في خارطة طريق المنصة — وهذه ميزاته المقررة
      </p>
      <ul className="mx-auto mt-6 max-w-md space-y-2 text-start">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-2.5 rounded-xl bg-sand px-4 py-2.5 text-xs font-medium text-heritage-900"
          >
            <CheckCircle2
              className="size-4 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
            {feature}
          </li>
        ))}
      </ul>
      {note && (
        <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
          {note}
        </p>
      )}
    </div>
  );
}
