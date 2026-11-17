import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * تحرير لغز وحذفه
 * ===================
 * PATCH  /api/admin/puzzles/:id — تحديث الحقول المسطّحة القابلة للتحرير
 * DELETE /api/admin/puzzles/:id — حذف اللغز مع كل علاقاته
 *                                (خلايا الشبكة، كلماتها، روابط البوس)
 */

/** الحقول النصية المسطّحة — نص أو null للمسح */
const EDITABLE_STRINGS = [
  "clue",
  "text",
  "options",
  "availableLetters",
  "emojis",
  "imageUrl",
  "image2Url",
  "image3Url",
  "image4Url",
  "audioUrl",
  "matchPairs",
  "fillBlanks",
  "bonusWords",
  "blankAnswers",
  "hints",
  "hint",
  "explanation",
  "category",
] as const;

/** الحقول الرقمية — رقم أو null للمسح */
const EDITABLE_NUMBERS = ["correctOption", "points", "hintCost"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "جسم الطلب غير صالح" },
        { status: 400 },
      );
    }
    const patch = body as Record<string, unknown>;

    const data: Record<string, unknown> = {};
    for (const field of EDITABLE_STRINGS) {
      if (!(field in patch)) continue;
      const value = patch[field];
      if (value !== null && typeof value !== "string") {
        return NextResponse.json(
          { ok: false, error: `قيمة الحقل ${field} غير صالحة` },
          { status: 400 },
        );
      }
      data[field] = value;
    }
    for (const field of EDITABLE_NUMBERS) {
      if (!(field in patch)) continue;
      const value = patch[field];
      if (value !== null && typeof value !== "number") {
        return NextResponse.json(
          { ok: false, error: `قيمة الحقل ${field} يجب أن تكون رقماً` },
          { status: 400 },
        );
      }
      data[field] = value;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { ok: false, error: "لا حقول لتحديثها في الطلب" },
        { status: 400 },
      );
    }

    const puzzle = await db.puzzle.update({ where: { id }, data });
    return NextResponse.json({ ok: true, puzzle });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Record to update not found")
    ) {
      return NextResponse.json(
        { ok: false, error: "لا يوجد لغز بهذا المعرّف" },
        { status: 404 },
      );
    }
    console.error("[api/admin/puzzles] تعذّر تحديث اللغز:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر تحديث اللغز" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const puzzle = await db.puzzle.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!puzzle) {
      return NextResponse.json(
        { ok: false, error: "لا يوجد لغز بهذا المعرّف" },
        { status: 404 },
      );
    }

    /* تنظيف العلاقات أولاً — خلايا الشبكة وكلماتها وروابط البوس */
    await db.cell.deleteMany({ where: { puzzleId: id } });
    await db.word.deleteMany({ where: { puzzleId: id } });
    await db.mixedStage.deleteMany({
      where: { OR: [{ parentPuzzleId: id }, { stagePuzzleId: id }] },
    });
    await db.puzzle.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/puzzles] تعذّر حذف اللغز:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر حذف اللغز" },
      { status: 500 },
    );
  }
}
