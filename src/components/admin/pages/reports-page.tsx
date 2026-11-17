"use client";

/**
 * صفحة التقارير — جاهزية المحتوى بأرقام حقيقية
 * ==================================================
 * تقرير فوري من الإحصاءات والجودة (كلاهما حي) مع أزرار تصدير
 * تظهر لاحقاً — لمحة يطمئن بها المشرف على صحة المنصة.
 */

import { useEffect, useState } from "react";
import { BarChart3, FileDown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { AdminPageHeader } from "../shared/admin-page-header";
import { StatCard } from "../shared/stat-card";
import { AdminLoading } from "../shared/admin-loading";
import type { AdminStats } from "../admin-types";

export function ReportsPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/admin/stats");
        const data = (await response.json()) as {
          ok: boolean;
          stats?: AdminStats;
        };
        if (!cancelled && data.ok && data.stats) setStats(data.stats);
      } catch {
        /* بطاقات التحميل تبقى */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return <AdminLoading />;

  /** جاهزية المحتوى — نسبة الألغاز السليمة من ملاحظات الجودة */
  const healthRatio =
    stats.puzzles > 0
      ? Math.max(
          0,
          Math.round(
            (1 - stats.quality.total / Math.max(stats.puzzles, 1)) * 100,
          ),
        )
      : 100;

  const notifyExport = (format: string) =>
    toast({
      title: `تصدير ${format} — قريباً`,
      description: "يتوفر مع تقارير الجلسات الممتدة بعد إطلاق الحسابات",
    });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="التقارير"
        description="تقارير جاهزية المحتوى وصحة المنصة — قابلة للتصدير لاحقاً"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => notifyExport("PDF")}
              className="gap-1.5"
            >
              <FileDown className="size-3.5" aria-hidden="true" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => notifyExport("CSV")}
              className="gap-1.5"
            >
              <FileDown className="size-3.5" aria-hidden="true" />
              CSV
            </Button>
          </>
        }
      />

      {/* بطاقات التقرير */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          icon={BarChart3}
          value={stats.levels}
          label="مرحلة منشورة"
        />
        <StatCard
          icon={BarChart3}
          value={stats.puzzles}
          label="لغزاً في القاعدة"
          tone="gold"
        />
        <StatCard
          icon={BarChart3}
          value={stats.books}
          label="كتاباً في المكتبة"
        />
        <StatCard
          icon={ShieldCheck}
          value={stats.quality.total}
          label="ملاحظة جودة مفتوحة"
          tone={stats.quality.total === 0 ? "emerald" : "flame"}
        />
      </div>

      {/* مؤشر جاهزية المحتوى */}
      <section
        className="rounded-2xl border border-heritage-900/5 bg-white p-5 shadow-card"
        aria-labelledby="report-health"
      >
        <div className="flex items-center justify-between gap-3">
          <h3
            id="report-health"
            className="font-heading text-sm font-extrabold text-heritage-900"
          >
            مؤشر جاهزية المحتوى
          </h3>
          <span
            className={`font-heading text-lg font-extrabold ${
              healthRatio >= 90
                ? "text-emerald-600"
                : healthRatio >= 70
                  ? "text-gold-600"
                  : "text-flame-600"
            }`}
          >
            {healthRatio.toLocaleString("ar-EG")}٪
          </span>
        </div>
        <Progress value={healthRatio} className="mt-3 h-2.5" />
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          محسوب من {stats.puzzles.toLocaleString("ar-EG")} لغزاً و
          {" "}
          {stats.quality.total.toLocaleString("ar-EG")} ملاحظة جودة (
          {stats.quality.high} عالية، {stats.quality.medium} متوسطة،{" "}
          {stats.quality.low} منخفضة) — صحة المحتوى تتحدث لحظياً مع كل
          تعديل من المحرر
        </p>
      </section>

      {/* توزيع المراحل */}
      <section
        className="rounded-2xl border border-heritage-900/5 bg-white p-5 shadow-card"
        aria-labelledby="report-chapters"
      >
        <h3
          id="report-chapters"
          className="font-heading text-sm font-extrabold text-heritage-900"
        >
          المراحل لكل فصل
        </h3>
        <ul className="mt-4 space-y-2">
          {stats.levelsByChapter.map((chapter) => (
            <li
              key={chapter.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-sand px-4 py-2.5 text-xs"
            >
              <span className="min-w-0 truncate font-medium text-heritage-900">
                {chapter.title}
              </span>
              <span className="shrink-0 font-heading font-bold text-heritage-700">
                {chapter.levels.toLocaleString("ar-EG")} مراحل
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
