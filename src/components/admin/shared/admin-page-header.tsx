"use client";

/**
 * ترويسة صفحة إدارية — العنوان والوصف ومساحة الإجراءات
 */

import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  /** أزرار الإجراءات — تظهر في نهاية السطر (يسار RTL) */
  actions?: ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-heading text-xl font-extrabold text-heritage-900 lg:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground lg:text-sm">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
