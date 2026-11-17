import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * شجرة المهارات
 * ================
 * GET /api/admin/skill-tree
 *
 * تجميع كل الألغاز حسب فئتها الثقافية (حقل category) —
 * فكل فئة تُظهر عدد ألغازها وأنواعها والمراحل التي تظهر فيها،
 * فيرى المحرر خريطة المحاور المعرفية للمنصة كاملة.
 */
export async function GET() {
  try {
    const puzzles = await db.puzzle.findMany({
      select: {
        category: true,
        puzzleType: true,
        level: { select: { title: true } },
      },
    });

    const groups = new Map<
      string,
      { total: number; types: Map<string, number>; levels: Set<string> }
    >();

    for (const puzzle of puzzles) {
      const key = puzzle.category?.trim() || "غير مصنّف";
      let group = groups.get(key);
      if (!group) {
        group = { total: 0, types: new Map(), levels: new Set() };
        groups.set(key, group);
      }
      group.total += 1;
      group.types.set(
        puzzle.puzzleType,
        (group.types.get(puzzle.puzzleType) ?? 0) + 1,
      );
      if (puzzle.level?.title) group.levels.add(puzzle.level.title);
    }

    const tree = [...groups.entries()]
      .map(([category, group]) => ({
        category,
        total: group.total,
        types: [...group.types.entries()]
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count),
        levels: [...group.levels],
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({ ok: true, tree });
  } catch (error) {
    console.error("[api/admin/skill-tree] تعذّر جلب الشجرة:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جلب شجرة المهارات" },
      { status: 500 },
    );
  }
}
