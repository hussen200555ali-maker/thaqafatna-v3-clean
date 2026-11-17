"use client";

/**
 * صفحة لوحة التحكم الرئيسية — إحصاءات حية من قاعدة الإدارة
 * ==================================================================
 * البطاقات الست + توزيع المراحل على الفصول + أنواع الألغاز +
 * أحدث المراحل بروابط مباشرة لمحرر المراحل — كل الأرقام حقيقية.
 */

import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  Layers,
  LibraryBig,
  Puzzle as PuzzleIcon,
  ShieldCheck,
  Swords,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AdminPageHeader } from "../shared/admin-page-header";
import { StatCard } from "../shared/stat-card";
import { AdminLoading } from "../shared/admin-loading";
import { difficultyLabels, puzzleTypeLabels } from "../admin-data";
import type { AdminNavigate, AdminStats } from "../admin-types";

interface DashboardPageProps {
  navigate: AdminNavigate;
}

export function DashboardPage({ navigate }: DashboardPageProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/admin/stats");
        const data = (await response.json()) as {
          ok: boolean;
          stats?: AdminStats;
        };
        if (!cancelled && data.ok && data.stats) {
          setStats(data.stats);
        } else if (!cancelled) {
          setFailed(true);
        }
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
          تعذّر جلب الإحصاءات
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          تحقق من تشغيل الخادم ثم أعد فتح اللوحة
        </p>
      </div>
    );
  }

  if (!stats) return <AdminLoading />;

  const maxChapterLevels = Math.max(
    ...stats.levelsByChapter.map((c) => c.levels),
    1,
  );
  const maxTypeCount = Math.max(...stats.puzzlesByType.map((t) => t.count), 1);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="لوحة التحكم"
        description="لمحة شاملة عن محتوى المنصة — الفصول والمراحل والألغاز والمكتبة وصحة المحتوى"
      />

      {/* البطاقات الست — أرقام حية */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard
          icon={Swords}
          value={stats.chapters}
          label="فصول اللعبة"
          tone="heritage"
          onClick={() => navigate("game-chapters")}
        />
        <StatCard
          icon={Layers}
          value={stats.levels}
          label="مراحل جاهزة"
          tone="heritage"
          onClick={() => navigate("level-editor")}
        />
        <StatCard
          icon={PuzzleIcon}
          value={stats.puzzles}
          label="ألغاز في القاعدة"
          tone="gold"
        />
        <StatCard
          icon={LibraryBig}
          value={stats.books}
          label="كتب المكتبة"
          tone="heritage"
          onClick={() => navigate("books")}
        />
        <StatCard
          icon={BookOpen}
          value={stats.bookChapters}
          label="فصول الكتب"
          tone="heritage"
          onClick={() => navigate("book-chapters")}
        />
        <StatCard
          icon={ShieldCheck}
          value={stats.quality.total}
          label={
            stats.quality.total === 0
              ? "لا ملاحظات جودة — ممتاز"
              : `ملاحظات جودة (${stats.quality.high} عالية)`
          }
          tone={stats.quality.total === 0 ? "emerald" : "flame"}
          onClick={() => navigate("quality")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* توزيع المراحل على الفصول */}
        <section
          className="rounded-2xl border border-heritage-900/5 bg-white p-5 shadow-card"
          aria-labelledby="dashboard-chapters"
        >
          <h3
            id="dashboard-chapters"
            className="font-heading text-sm font-extrabold text-heritage-900"
          >
            المراحل لكل فصل
          </h3>
          <ul className="mt-4 space-y-3.5">
            {stats.levelsByChapter.map((chapter) => (
              <li key={chapter.id}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate font-medium text-heritage-900">
                    {chapter.title}
                  </span>
                  <span className="shrink-0 font-heading font-bold text-heritage-700">
                    {chapter.levels.toLocaleString("ar-EG")} مراحل
                  </span>
                </div>
                <Progress
                  value={(chapter.levels / maxChapterLevels) * 100}
                  className="mt-1.5 h-2"
                />
              </li>
            ))}
          </ul>
        </section>

        {/* توزيع أنواع الألغاز */}
        <section
          className="rounded-2xl border border-heritage-900/5 bg-white p-5 shadow-card"
          aria-labelledby="dashboard-types"
        >
          <h3
            id="dashboard-types"
            className="font-heading text-sm font-extrabold text-heritage-900"
          >
            توزيع أنواع الألغاز
          </h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {stats.puzzlesByType.map((type) => (
              <li
                key={type.type}
                className="flex items-center gap-2 rounded-full border border-heritage-900/8 bg-sand px-3 py-1.5 text-[11px] font-medium text-heritage-900"
              >
                <span>{puzzleTypeLabels[type.type] ?? type.type}</span>
                <span
                  className="grid min-w-6 place-items-center rounded-full bg-heritage-900 px-1.5 py-0.5 font-heading text-[10px] font-bold text-white"
                  style={{ opacity: 0.4 + (type.count / maxTypeCount) * 0.6 }}
                >
                  {type.count.toLocaleString("ar-EG")}
                </span>
              </li>
            ))}
          </ul>

          {/* أحدث المراحل — وصول سريع للمحرر */}
          <h4 className="mt-6 font-heading text-sm font-extrabold text-heritage-900">
            أحدث المراحل
          </h4>
          <ul className="mt-3 space-y-2">
            {stats.recentLevels.map((level) => (
              <li key={level.id}>
                <button
                  type="button"
                  onClick={() => navigate("level-editor", level.id)}
                  className="flex w-full items-center gap-3 rounded-xl bg-sand px-3.5 py-2.5 text-start transition-colors duration-150 hover:bg-gold-100/60"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-heritage-900 font-heading text-[11px] font-bold text-gold-400">
                    {level.order.toLocaleString("ar-EG")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-heritage-900">
                      {level.title}
                    </span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {level.chapterTitle}
                      {level.difficulty
                        ? ` — ${difficultyLabels[level.difficulty] ?? level.difficulty}`
                        : ""}
                    </span>
                  </span>
                  <ChevronLeft
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
