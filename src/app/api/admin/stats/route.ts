import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collectQualityIssues, summarizeIssues } from "@/lib/admin/quality";

/**
 * إحصاءات لوحة التحكم الشاملة
 * ==============================
 * GET /api/admin/stats
 *
 * لمحة كاملة لصفحة لوحة التحكم الرئيسية: أعداد المحتوى
 * (فصول/مراحل/ألغاز/كتب/تصنيفات)، ملخص مدقّق الجودة،
 * توزيع المراحل على الفصول، توزيع أنواع الألغاز،
 * وأحدث المراحل للوصول السريع من الواجهة.
 */
export async function GET() {
  try {
    const [chapters, levels, puzzles, books, categories, bookChapters] =
      await Promise.all([
        db.chapter.count(),
        db.level.count(),
        db.puzzle.count(),
        db.book.count(),
        db.bookCategory.count(),
        db.bookChapter.count(),
      ]);

    const [chapterRows, typeRows, recentRows, issues] = await Promise.all([
      db.chapter.findMany({
        orderBy: { order: "asc" },
        include: { _count: { select: { levels: true } } },
      }),
      db.puzzle.groupBy({
        by: ["puzzleType"],
        _count: { puzzleType: true },
        orderBy: { _count: { puzzleType: "desc" } },
      }),
      db.level.findMany({
        orderBy: [{ chapter: { order: "asc" } }, { order: "asc" }],
        take: 5,
        include: { chapter: { select: { title: true } } },
      }),
      collectQualityIssues(),
    ]);

    return NextResponse.json({
      ok: true,
      stats: {
        chapters,
        levels,
        puzzles,
        books,
        categories,
        bookChapters,
        quality: summarizeIssues(issues),
        levelsByChapter: chapterRows.map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          levels: chapter._count.levels,
        })),
        puzzlesByType: typeRows.map((row) => ({
          type: row.puzzleType,
          count: row._count.puzzleType,
        })),
        recentLevels: recentRows.map((level) => ({
          id: level.id,
          title: level.title,
          chapterTitle: level.chapter?.title ?? null,
          order: level.order,
          difficulty: level.difficulty,
        })),
      },
    });
  } catch (error) {
    console.error("[api/admin/stats] تعذّر جمع الإحصاءات:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جمع إحصاءات لوحة التحكم" },
      { status: 500 },
    );
  }
}
