"use client";

/**
 * هيكل تحميل موحّد لصفحات الإدارة — نبضات هادئة بأسلوب البطاقات
 */

export function AdminLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="h-8 w-56 animate-pulse rounded-xl bg-heritage-900/5" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl bg-heritage-900/5"
          />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-2xl bg-heritage-900/5" />
    </div>
  );
}
