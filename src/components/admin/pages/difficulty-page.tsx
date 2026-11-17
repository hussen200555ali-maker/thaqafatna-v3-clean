"use client";

/**
 * صفحة موازنة الصعوبة — منحنى التحدّي عبر المراحل
 * =====================================================
 * توزيع درجات الصعوبة + جدول تحليلي لكل مرحلة (النقاط، متوسط
 * نقاط اللغز، الوقت، المكافأة، تكلفة التلميح) — كله محسوب من
 * فهرس الفصول الحي دون أي بيانات وهمية.
 */

import { useEffect, useState } from "react";
import { Scale } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminPageHeader } from "../shared/admin-page-header";
import { StatCard } from "../shared/stat-card";
import { AdminLoading } from "../shared/admin-loading";
import { difficultyLabels } from "../admin-data";
import type { AdminChapter } from "../admin-types";

/** ألوان درجات الصعوبة */
const DIFFICULTY_CLASSES: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-gold-100 text-gold-700",
  hard: "bg-flame-100 text-flame-600",
};

/** متوسط نقاط اللغز الواحد في مرحلة */
function averagePoints(puzzleCount: number, totalPoints: number): number {
  if (puzzleCount === 0) return 0;
  return Math.round(totalPoints / puzzleCount);
}

export function DifficultyPage() {
  const [chapters, setChapters] = useState<AdminChapter[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/admin/chapters");
        const data = (await response.json()) as {
          ok: boolean;
          chapters?: AdminChapter[];
        };
        if (!cancelled && data.ok && data.chapters) setChapters(data.chapters);
      } catch {
        /* بطاقات التحميل تنتظر حتى تفتح الشبكة */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!chapters) return <AdminLoading />;

  const allLevels = chapters.flatMap((chapter) =>
    chapter.levels.map((level) => ({ ...level, chapterTitle: chapter.title })),
  );
  const distribution = { easy: 0, medium: 0, hard: 0, unknown: 0 };
  for (const level of allLevels) {
    if (level.difficulty && level.difficulty in distribution) {
      distribution[level.difficulty as keyof typeof distribution] += 1;
    } else {
      distribution.unknown += 1;
    }
  }
  const totalLevels = allLevels.length || 1;
  const avgPoints =
    allLevels.reduce((sum, level) => sum + level.totalPoints, 0) / totalLevels;
  const maxReward = Math.max(...allLevels.map((l) => l.reward ?? 0), 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="موازنة الصعوبة"
        description="توزيع الصعوبة والنقاط والوقت عبر المراحل — لضمان منحنى تحدٍّ عادل"
      />

      {/* بطاقات القراءة السريعة */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          icon={Scale}
          value={allLevels.length}
          label="مرحلة تحت المجهر"
        />
        <StatCard
          icon={Scale}
          value={Math.round(avgPoints)}
          label="متوسط نقاط المرحلة"
          tone="gold"
        />
        <StatCard
          icon={Scale}
          value={maxReward}
          label="أعلى مكافأة إكمال"
          tone="gold"
        />
        <StatCard
          icon={Scale}
          value={distribution.unknown}
          label="مراحل بلا صعوبة محددة"
          tone={distribution.unknown > 0 ? "flame" : "emerald"}
        />
      </div>

      {/* توزيع الصعوبة */}
      <section
        className="rounded-2xl border border-heritage-900/5 bg-white p-5 shadow-card"
        aria-labelledby="difficulty-distribution"
      >
        <h3
          id="difficulty-distribution"
          className="font-heading text-sm font-extrabold text-heritage-900"
        >
          توزيع درجات الصعوبة
        </h3>
        <ul className="mt-4 space-y-3.5">
          {(
            [
              ["easy", "سهلة"],
              ["medium", "متوسطة"],
              ["hard", "صعبة"],
            ] as const
          ).map(([key, title]) => (
            <li key={key}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-heritage-900">{title}</span>
                <span className="font-heading font-bold text-heritage-700">
                  {distribution[key].toLocaleString("ar-EG")} من{" "}
                  {allLevels.length.toLocaleString("ar-EG")}
                </span>
              </div>
              <Progress
                value={(distribution[key] / totalLevels) * 100}
                className="mt-1.5 h-2"
              />
            </li>
          ))}
        </ul>
      </section>

      {/* الجدول التحليلي */}
      <section
        className="overflow-hidden rounded-2xl border border-heritage-900/5 bg-white shadow-card"
        aria-labelledby="difficulty-table"
      >
        <h3
          id="difficulty-table"
          className="border-b border-heritage-900/5 bg-sand/60 px-5 py-3.5 font-heading text-sm font-extrabold text-heritage-900"
        >
          التحليل التفصيلي لكل مرحلة
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-[10px]">
                <TableHead className="text-right">المرحلة</TableHead>
                <TableHead className="text-right">الفصل</TableHead>
                <TableHead className="text-right">الصعوبة</TableHead>
                <TableHead className="text-right">الألغاز</TableHead>
                <TableHead className="text-right">النقاط</TableHead>
                <TableHead className="text-right">متوسط اللغز</TableHead>
                <TableHead className="text-right">الوقت</TableHead>
                <TableHead className="text-right">المكافأة</TableHead>
                <TableHead className="text-right">تكلفة التلميح</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allLevels.map((level) => (
                <TableRow key={level.id} className="text-[11px]">
                  <TableCell className="font-bold text-heritage-900">
                    {level.title}
                  </TableCell>
                  <TableCell className="max-w-32 truncate text-muted-foreground">
                    {level.chapterTitle}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        DIFFICULTY_CLASSES[level.difficulty ?? ""] ??
                        "bg-heritage-100 text-heritage-700"
                      }`}
                    >
                      {level.difficulty
                        ? difficultyLabels[level.difficulty]
                        : "غير محددة"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {level.puzzleCount.toLocaleString("ar-EG")}
                  </TableCell>
                  <TableCell className="font-bold">
                    {level.totalPoints.toLocaleString("ar-EG")}
                  </TableCell>
                  <TableCell>
                    {averagePoints(
                      level.puzzleCount,
                      level.totalPoints,
                    ).toLocaleString("ar-EG")}
                  </TableCell>
                  <TableCell>
                    {level.timeLimit && level.timeLimit > 0
                      ? `${Math.round(level.timeLimit / 60).toLocaleString("ar-EG")} د`
                      : "—"}
                  </TableCell>
                  <TableCell className="font-bold text-gold-700">
                    {(level.reward ?? 0).toLocaleString("ar-EG")}
                  </TableCell>
                  <TableCell>
                    {(level.hintCost ?? 0).toLocaleString("ar-EG")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
