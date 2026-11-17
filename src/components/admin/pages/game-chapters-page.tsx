"use client";

/**
 * صفحة فصول اللعبة — خريطة المحتوى التعليمي
 * ==============================================
 * كل فصل ببطاقة تحمل مراحله: الصعوبة وعدد الألغاز والنقاط
 * والوقت والمكافأة — وزر تحرير ينقل مباشرة لمحرر المراحل.
 */

import { useEffect, useState } from "react";
import { Coins, Puzzle as PuzzleIcon, Timer, Pencil } from "lucide-react";
import { AdminPageHeader } from "../shared/admin-page-header";
import { AdminLoading } from "../shared/admin-loading";
import { difficultyLabels } from "../admin-data";
import type { AdminChapter, AdminNavigate } from "../admin-types";

/** ألوان شارة الصعوبة */
const DIFFICULTY_CLASSES: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-gold-100 text-gold-700",
  hard: "bg-flame-100 text-flame-600",
};

/** تنسيق الوقت بالدقائق العربية */
function formatTime(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "بلا وقت";
  const minutes = Math.round(seconds / 60);
  return `${minutes.toLocaleString("ar-EG")} دقائق`;
}

interface GameChaptersPageProps {
  navigate: AdminNavigate;
}

export function GameChaptersPage({ navigate }: GameChaptersPageProps) {
  const [chapters, setChapters] = useState<AdminChapter[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/admin/chapters");
        const data = (await response.json()) as {
          ok: boolean;
          chapters?: AdminChapter[];
        };
        if (cancelled) return;
        if (data.ok && data.chapters) setChapters(data.chapters);
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
          تعذّر جلب الفصول
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          تحقق من الخادم ثم أعد المحاولة
        </p>
      </div>
    );
  }

  if (!chapters) return <AdminLoading />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="فصول اللعبة"
        description="خريطة المحتوى التعليمي — الفصول ومراحلها وإحصاءات كل مرحلة"
      />

      <div className="space-y-5">
        {chapters.map((chapter) => (
          <section
            key={chapter.id}
            className="overflow-hidden rounded-2xl border border-heritage-900/5 bg-white shadow-card"
            aria-labelledby={`chapter-${chapter.id}`}
          >
            {/* ترويسة الفصل */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-heritage-900/5 bg-sand/60 px-5 py-3.5">
              <h3
                id={`chapter-${chapter.id}`}
                className="font-heading text-sm font-extrabold text-heritage-900"
              >
                {chapter.title}
              </h3>
              <span className="rounded-full bg-heritage-100 px-2.5 py-1 text-[10px] font-bold text-heritage-700">
                {chapter.levels.length.toLocaleString("ar-EG")} مراحل
              </span>
            </div>

            {/* المراحل */}
            <ul className="divide-y divide-heritage-900/5">
              {chapter.levels.map((level) => (
                <li
                  key={level.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-sand/50"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-heritage-900 font-heading text-xs font-bold text-gold-400">
                    {level.order.toLocaleString("ar-EG")}
                  </span>
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate text-xs font-bold text-heritage-900">
                      {level.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {level.id}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      DIFFICULTY_CLASSES[level.difficulty ?? ""] ??
                      "bg-heritage-100 text-heritage-700"
                    }`}
                  >
                    {level.difficulty
                      ? (difficultyLabels[level.difficulty] ?? level.difficulty)
                      : "غير محددة"}
                  </span>

                  <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                    <PuzzleIcon className="size-3.5" aria-hidden="true" />
                    {level.puzzleCount.toLocaleString("ar-EG")} ألغاز
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {level.totalPoints.toLocaleString("ar-EG")} نقطة
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                    <Timer className="size-3.5" aria-hidden="true" />
                    {formatTime(level.timeLimit)}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-gold-700">
                    <Coins className="size-3.5" aria-hidden="true" />
                    {(level.reward ?? 0).toLocaleString("ar-EG")}
                  </span>

                  <button
                    type="button"
                    onClick={() => navigate("level-editor", level.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-heritage-900 px-3 py-1.5 text-[10px] font-bold text-white transition-all duration-150 hover:bg-heritage-800 active:scale-95"
                  >
                    <Pencil className="size-3" aria-hidden="true" />
                    تحرير
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
