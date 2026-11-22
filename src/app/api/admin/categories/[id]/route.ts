import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isRecordNotFound } from "@/lib/prisma-errors";

/**
 * تحرير تصنيف وحذفه
 * =====================
 * PATCH  /api/admin/categories/:id — تحديث title/icon/order
 * DELETE /api/admin/categories/:id — ممنوع إن كان به كتب (409)
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
          { ok: false, error: "عنوان التصنيف مطلوب" },
          { status: 400 },
        );
      }
      data.title = title;
    }
    if ("icon" in patch) {
      const value = patch.icon;
      if (value !== null && typeof value !== "string") {
        return NextResponse.json(
          { ok: false, error: "قيمة الأيقونة غير صالحة" },
          { status: 400 },
        );
      }
      data.icon = value === null ? null : value.trim() || null;
    }
    if ("order" in patch) {
      const value = patch.order;
      if (typeof value !== "number") {
        return NextResponse.json(
          { ok: false, error: "قيمة الترتيب يجب أن تكون رقماً" },
          { status: 400 },
        );
      }
      data.order = value;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { ok: false, error: "لا حقول لتحديثها في الطلب" },
        { status: 400 },
      );
    }

    const category = await db.bookCategory.update({
      where: { id },
      data,
      include: { _count: { select: { books: true } } },
    });

    return NextResponse.json({
      ok: true,
      category: {
        id: category.id,
        title: category.title,
        icon: category.icon,
        order: category.order,
        bookCount: category._count.books,
      },
    });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return NextResponse.json(
        { ok: false, error: "لا يوجد تصنيف بهذا المعرّف" },
        { status: 404 },
      );
    }
    console.error("[api/admin/categories] تعذّر تحديث التصنيف:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر تحديث التصنيف" },
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
    const booksCount = await db.book.count({ where: { categoryId: id } });
    if (booksCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "لا يمكن حذف تصنيف تابع له كتب — انقل الكتب أولاً",
        },
        { status: 409 },
      );
    }

    await db.bookCategory.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return NextResponse.json(
        { ok: false, error: "لا يوجد تصنيف بهذا المعرّف" },
        { status: 404 },
      );
    }
    console.error("[api/admin/categories] تعذّر حذف التصنيف:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر حذف التصنيف" },
      { status: 500 },
    );
  }
}
