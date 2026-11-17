"use client";

/**
 * صفحة شجرة المهارات — المحاور المعرفية للألغاز
 * ===================================================
 * كل فئة ثقافية بعقدة تجمع عدد ألغازها وأنواعها ومراحلها —
 * خريطة تُظهر اتساع المحتوى وأين يحتاج التعميق.
 */

import { useEffect, useState } from "react";
import { Network } from "lucide-react";
import { AdminPageHeader } from "../shared/admin-page-header";
import { AdminLoading } from "../shared/admin-loading";
import { puzzleTypeLabels } from "../admin-data";
import type { AdminSkillNode } from "../admin-types";

export function SkillTreePage() {
  const [tree, setTree] = useState<AdminSkillNode[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/admin/skill-tree");
        const data = (await response.json()) as {
          ok: boolean;
          tree?: AdminSkillNode[];
        };
        if (cancelled) return;
        if (data.ok && data.tree) setTree(data.tree);
        else setFailed(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <div className="rounded-2xl border border-flame-500/20 bg-white p-8 text-center shadow-card">
        <p className="font-heading text-sm font-bold text-heritage-900">
          تعذّر جلب الشجرة
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          تحقق من الخادم ثم أعد المحاولة
        </p>
      </div>
    );
  }

  if (!tree) return <AdminLoading />;

  const maxTotal = Math.max(...tree.map((node) => node.total), 1);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="شجرة المهارات"
        description="المحاور المعرفية التي تغطيها الألغاز — فئاتها وأنواعها ومراحلها"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {tree.map((node) => (
          <section
            key={node.category}
            className="rounded-2xl border border-heritage-900/5 bg-white p-5 shadow-card"
            aria-label={`محور ${node.category}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex min-w-0 items-center gap-2.5 font-heading text-sm font-extrabold text-heritage-900">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-xl bg-heritage-100"
                  style={{
                    opacity: 0.55 + (node.total / maxTotal) * 0.45,
                  }}
                  aria-hidden="true"
                >
                  <Network className="size-4 text-heritage-700" />
                </span>
                <span className="truncate">{node.category}</span>
              </h3>
              <span className="shrink-0 rounded-full bg-heritage-900 px-3 py-1 font-heading text-xs font-bold text-gold-400">
                {node.total.toLocaleString("ar-EG")} لغزاً
              </span>
            </div>

            {/* أنواع الألغاز في هذا المحور */}
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {node.types.map((type) => (
                <li
                  key={type.type}
                  className="rounded-full bg-sand px-2.5 py-1 text-[10px] font-medium text-heritage-900"
                >
                  {puzzleTypeLabels[type.type] ?? type.type}
                  <span className="mx-1 font-bold" aria-hidden="true">
                    ×
                  </span>
                  {type.count.toLocaleString("ar-EG")}
                </li>
              ))}
            </ul>

            {/* المراحل التي يظهر فيها المحور */}
            <p className="mt-4 text-[10px] font-medium text-muted-foreground">
              يظهر في: {node.levels.join("، ")}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
