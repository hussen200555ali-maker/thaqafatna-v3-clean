"use client";

/**
 * صفحة مدقّق الجودة — الفحص الآلي الحي للمحتوى
 * ===================================================
 * ملخص بالخطورة الثلاث + تصفية + قائمة الملاحظات مع قفز
 * مباشر لتحرير اللغز المعني — كل رقم من الفحص الفعلي.
 */

import { useCallback, useEffect, useState } from "react";
import { CircleAlert, Pencil, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "../shared/admin-page-header";
import { StatCard } from "../shared/stat-card";
import { AdminLoading } from "../shared/admin-loading";
import { puzzleTypeLabels, severityLabels } from "../admin-data";
import type { AdminNavigate, AdminQualityIssue } from "../admin-types";

type Severity = AdminQualityIssue["severity"];

const SEVERITY_CARD_CLASSES: Record<Severity, string> = {
  high: "bg-flame-100 text-flame-600",
  medium: "bg-gold-100 text-gold-700",
  low: "bg-heritage-100 text-heritage-700",
};

const FILTERS: { id: "all" | Severity; title: string }[] = [
  { id: "all", title: "الكل" },
  { id: "high", title: "عالية" },
  { id: "medium", title: "متوسطة" },
  { id: "low", title: "منخفضة" },
];

interface QualityPageProps {
  navigate: AdminNavigate;
  refreshQuality: () => void;
}

export function QualityPage({ navigate, refreshQuality }: QualityPageProps) {
  const [issues, setIssues] = useState<AdminQualityIssue[] | null>(null);
  const [filter, setFilter] = useState<"all" | Severity>("all");

  /* قراءة الفحص من الخادم — تُستخدم للتحميل الأولي والإعادة */
  const fetchIssues = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/quality");
      const data = (await response.json()) as {
        ok: boolean;
        issues?: AdminQualityIssue[];
      };
      if (data.ok && data.issues) setIssues(data.issues);
      else setIssues([]);
    } catch {
      setIssues([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/admin/quality");
        const data = (await response.json()) as {
          ok: boolean;
          issues?: AdminQualityIssue[];
        };
        if (!cancelled) {
          if (data.ok && data.issues) setIssues(data.issues);
          else setIssues([]);
        }
      } catch {
        if (!cancelled) setIssues([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!issues) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="مدقّق الجودة"
          description="فحص آلي لكل لغز ومرحلة — البيانات الجوهرية المفقودة والنواقص التعليمية واقتصاد التلميحات"
        />
        <AdminLoading />
      </div>
    );
  }

  const counts = {
    high: issues.filter((i) => i.severity === "high").length,
    medium: issues.filter((i) => i.severity === "medium").length,
    low: issues.filter((i) => i.severity === "low").length,
  };
  const visible =
    filter === "all" ? issues : issues.filter((i) => i.severity === filter);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="مدقّق الجودة"
        description="فحص آلي لكل لغز ومرحلة — البيانات الجوهرية المفقودة والنواقص التعليمية واقتصاد التلميحات"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setIssues(null);
              await fetchIssues();
              refreshQuality();
            }}
            className="gap-1.5"
          >
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            إعادة الفحص
          </Button>
        }
      />

      {issues.length === 0 ? (
        <div className="rounded-3xl border border-emerald-500/20 bg-white p-10 text-center shadow-card">
          <div
            className="mx-auto grid size-16 place-items-center rounded-3xl bg-emerald-100"
            aria-hidden="true"
          >
            <ShieldCheck className="size-7 text-emerald-600" />
          </div>
          <h3 className="mt-4 font-heading text-lg font-extrabold text-heritage-900">
            المحتوى سليم تماماً
          </h3>
          <p className="mt-1.5 text-xs text-muted-foreground">
            لا ملاحظات على أي لغز أو مرحلة — كل شيء مكتمل
          </p>
        </div>
      ) : (
        <>
          {/* ملخص الخطورة */}
          <div className="grid grid-cols-3 gap-3 lg:gap-4">
            <StatCard
              icon={CircleAlert}
              value={counts.high}
              label="خطورة عالية — تمنع العمل"
              tone="flame"
            />
            <StatCard
              icon={CircleAlert}
              value={counts.medium}
              label="خطورة متوسطة — نقص تعليمي"
              tone="gold"
            />
            <StatCard
              icon={CircleAlert}
              value={counts.low}
              label="خطورة منخفضة — تحسينات"
              tone="heritage"
            />
          </div>

          {/* التصفيــة */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => {
              const count =
                item.id === "all"
                  ? issues.length
                  : counts[item.id as Severity];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  aria-pressed={filter === item.id}
                  className={`rounded-full px-4 py-1.5 text-[11px] font-bold transition-colors duration-150 ${
                    filter === item.id
                      ? "bg-heritage-900 text-white"
                      : "bg-white text-heritage-800 shadow-card hover:bg-sand"
                  }`}
                >
                  {item.title} ({count.toLocaleString("ar-EG")})
                </button>
              );
            })}
          </div>

          {/* القائمة */}
          <ul className="space-y-2.5">
            {visible.map((issue) => (
              <li
                key={issue.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-heritage-900/5 bg-white p-4 shadow-card"
              >
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${SEVERITY_CARD_CLASSES[issue.severity]}`}
                >
                  {severityLabels[issue.severity]}
                </span>
                <div className="min-w-0 flex-1 basis-48">
                  <p className="text-xs font-bold text-heritage-900">
                    {issue.message}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    مرحلة «{issue.levelTitle}»
                    {issue.puzzleType
                      ? ` — لغز ${puzzleTypeLabels[issue.puzzleType] ?? issue.puzzleType}`
                      : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("level-editor", issue.levelId)}
                  className="gap-1.5"
                >
                  <Pencil className="size-3" aria-hidden="true" />
                  فتح المحرر
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
