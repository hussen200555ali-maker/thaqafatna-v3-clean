import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isRecordNotFound } from "@/lib/prisma-errors";
import { shapeBookChapter } from "@/lib/admin/library";

/**
 * تحرير فصل كتاب وحذفه
 * =========================
 * PATCH  /api/admin/book-chapters/:id — تحديث title/order
 * DELETE /api/admin/book-chapters/:id
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
          { ok: false, error: "عنوان الفصل مطلوب" },
          { status: 400 },
        );
      }
      data.title = title;
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
    /* محتوى الفصل — نص القراءة (null يمسحه) */
    if ("content" in patch) {
      const value = patch.content;
      data.content =
        value === null || value === "" ? null : String(value).slice(0, 20000);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { ok: false, error: "لا حقول لتحديثها في الطلب" },
        { status: 400 },
      );
    }

    const chapter = await db.bookChapter.update({
      where: { id },
      data,
      include: { book: { select: { title: true } } },
    });

    return NextResponse.json({ ok: true, chapter: shapeBookChapter(chapter) });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return NextResponse.json(
        { ok: false, error: "لا يوجد فصل بهذا المعرّف" },
        { status: 404 },
      );
    }
    console.error("[api/admin/book-chapters] تعذّر تحديث الفصل:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر تحديث فصل الكتاب" },
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
    await db.bookChapter.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return NextResponse.json(
        { ok: false, error: "لا يوجد فصل بهذا المعرّف" },
        { status: 404 },
      );
    }
    console.error("[api/admin/book-chapters] تعذّر حذف الفصل:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر حذف فصل الكتاب" },
      { status: 500 },
    );
  }
}
