import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BOOK_STATUSES, shapeBook } from "@/lib/admin/library";

/**
 * تحرير كتاب وحذفه
 * ====================
 * PATCH  /api/admin/books/:id — تحديث أي من: title, author,
 *                               description, status, categoryId
 * DELETE /api/admin/books/:id — حذف الكتاب وفصوله معاً
 */
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

    if ("title" in patch) {
      const title = String(patch.title ?? "").trim();
      if (!title) {
        return NextResponse.json(
          { ok: false, error: "عنوان الكتاب مطلوب" },
          { status: 400 },
        );
      }
      data.title = title;
    }
    for (const field of ["author", "description"] as const) {
      if (!(field in patch)) continue;
      const value = patch[field];
      if (value !== null && typeof value !== "string") {
        return NextResponse.json(
          { ok: false, error: `قيمة الحقل ${field} غير صالحة` },
          { status: 400 },
        );
      }
      data[field] = value === null ? null : value.trim() || null;
    }
    if ("status" in patch) {
      const value = patch.status;
      if (
        typeof value !== "string" ||
        !BOOK_STATUSES.includes(value as (typeof BOOK_STATUSES)[number])
      ) {
        return NextResponse.json(
          { ok: false, error: "حالة الكتاب يجب أن تكون مسودة أو منشوراً" },
          { status: 400 },
        );
      }
      data.status = value;
    }
    if ("categoryId" in patch) {
      const value = patch.categoryId;
      if (value === null) {
        data.categoryId = null;
      } else if (typeof value === "string" && value) {
        const category = await db.bookCategory.findUnique({
          where: { id: value },
          select: { id: true },
        });
        if (!category) {
          return NextResponse.json(
            { ok: false, error: "التصنيف المحدد غير موجود" },
            { status: 400 },
          );
        }
        data.categoryId = value;
      } else {
        return NextResponse.json(
          { ok: false, error: "قيمة التصنيف غير صالحة" },
          { status: 400 },
        );
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { ok: false, error: "لا حقول لتحديثها في الطلب" },
        { status: 400 },
      );
    }

    const updated = await db.book.update({
      where: { id },
      data,
      include: { category: true, _count: { select: { chapters: true } } },
    });

    return NextResponse.json({
      ok: true,
      book: shapeBook(updated, updated._count.chapters),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Record to update not found")
    ) {
      return NextResponse.json(
        { ok: false, error: "لا يوجد كتاب بهذا المعرّف" },
        { status: 404 },
      );
    }
    console.error("[api/admin/books] تعذّر تحديث الكتاب:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر تحديث الكتاب" },
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
    const book = await db.book.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!book) {
      return NextResponse.json(
        { ok: false, error: "لا يوجد كتاب بهذا المعرّف" },
        { status: 404 },
      );
    }

    /* فصول الكتاب أولاً ثم الكتاب */
    await db.bookChapter.deleteMany({ where: { bookId: id } });
    await db.book.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/books] تعذّر حذف الكتاب:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر حذف الكتاب" },
      { status: 500 },
    );
  }
}
