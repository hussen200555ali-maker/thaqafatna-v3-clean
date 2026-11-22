import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isRecordNotFound } from "@/lib/prisma-errors";

/**
 * تفاصيل مرحلة وتحريرها
 * =========================
 * GET  /api/admin/levels/:id — المرحلة كاملة بألغازها (لمحرر المراحل)
 * PATCH /api/admin/levels/:id — تحديث حقول المرحلة التعريفية
 *
 * الحقول القابلة للتحرير: title, difficulty, timeLimit, reward,
 * hintCost, learningGoals, educationalDescription, order
 */

/** الحقول النصية الاختيارية — قيمة نصية أو null للمسح */
const OPTIONAL_STRINGS = [
  "difficulty",
  "learningGoals",
  "educationalDescription",
] as const;

/** الحقول الرقمية الاختيارية — رقم أو null للمسح */
const OPTIONAL_NUMBERS = ["timeLimit", "reward", "hintCost", "order"] as const;

/** جلب المرحلة مع فصلها وألغازها المرتبة — null إن لم توجد */
async function findLevelDetail(id: string) {
  const level = await db.level.findUnique({
    where: { id },
    include: {
      chapter: { select: { title: true } },
      puzzles: { orderBy: { order: "asc" } },
    },
  });
  return level;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const level = await findLevelDetail(id);
    if (!level) {
      return NextResponse.json(
        { ok: false, error: "لا توجد مرحلة بهذا المعرّف" },
        { status: 404 },
      );
    }
    const { chapter, puzzles, ...levelFields } = level;
    return NextResponse.json({
      ok: true,
      level: {
        ...levelFields,
        chapterTitle: chapter?.title ?? null,
        puzzles,
      },
    });
  } catch (error) {
    console.error("[api/admin/levels] تعذّر جلب المرحلة:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جلب تفاصيل المرحلة" },
      { status: 500 },
    );
  }
}

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

    /* العنوان — إن أُرسل فلا يقبل الفارغ */
    if ("title" in patch) {
      const title = String(patch.title ?? "").trim();
      if (!title) {
        return NextResponse.json(
          { ok: false, error: "عنوان المرحلة مطلوب" },
          { status: 400 },
        );
      }
      data.title = title;
    }

    for (const field of OPTIONAL_STRINGS) {
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

    for (const field of OPTIONAL_NUMBERS) {
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

    const level = await db.level.update({
      where: { id },
      data,
      include: { chapter: { select: { title: true } } },
    });

    const { chapter, ...levelFields } = level;
    return NextResponse.json({
      ok: true,
      level: { ...levelFields, chapterTitle: chapter?.title ?? null },
    });
  } catch (error) {
    /* خطأ Prisma P2025 = السجل غير موجود */
    if (isRecordNotFound(error)) {
      return NextResponse.json(
        { ok: false, error: "لا توجد مرحلة بهذا المعرّف" },
        { status: 404 },
      );
    }
    console.error("[api/admin/levels] تعذّر تحديث المرحلة:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر تحديث المرحلة" },
      { status: 500 },
    );
  }
}
