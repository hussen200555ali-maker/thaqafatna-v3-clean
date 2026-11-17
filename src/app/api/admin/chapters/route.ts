import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * فصول اللعبة مع مراحلها
 * =========================
 * GET /api/admin/chapters
 *
 * فهرس هرمي كامل: الفصول بترتيبها، وكل فصل مراحله بترتيبها
 * مع عدد الألغاز ومجموع النقاط — يغذّي صفحة «فصول اللعبة»
 * و«موازنة الصعوبة» وقائمة اختيار المرحلة في المحرر.
 */
export async function GET() {
  try {
    const chapters = await db.chapter.findMany({
      orderBy: { order: "asc" },
      include: {
        levels: {
          orderBy: { order: "asc" },
          include: {
            _count: { select: { puzzles: true } },
            puzzles: { select: { points: true } },
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      chapters: chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        order: chapter.order,
        levels: chapter.levels.map((level) => ({
          id: level.id,
          title: level.title,
          difficulty: level.difficulty,
          timeLimit: level.timeLimit,
          reward: level.reward,
          hintCost: level.hintCost,
          order: level.order,
          puzzleCount: level._count.puzzles,
          totalPoints: level.puzzles.reduce(
            (sum, puzzle) => sum + (puzzle.points ?? 0),
            0,
          ),
        })),
      })),
    });
  } catch (error) {
    console.error("[api/admin/chapters] تعذّر جلب الفصول:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جلب فصول اللعبة" },
      { status: 500 },
    );
  }
}
