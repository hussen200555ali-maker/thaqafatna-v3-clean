import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * مراجعة واحدة — لوحة الإدارة
 * ==============================
 * PATCH  /api/admin/reviews/:id — اعتماد أو رفض
 * DELETE /api/admin/reviews/:id — حذف نهائي
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "جسم الطلب غير صالح" },
        { status: 400 },
      );
    }
    const status = (body as Record<string, unknown>).status;
    if (status !== "approved" && status !== "rejected" && status !== "pending") {
      return NextResponse.json(
        { ok: false, error: "الحالة يجب أن تكون approved أو rejected أو pending" },
        { status: 400 },
      );
    }

    const existing = await db.bookReview.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "لا توجد مراجعة بهذا المعرّف" },
        { status: 404 },
      );
    }

    const review = await db.bookReview.update({
      where: { id },
      data: { status },
      include: { book: { select: { title: true } } },
    });

    return NextResponse.json({
      ok: true,
      review: {
        id: review.id,
        bookTitle: review.book?.title ?? null,
        status: review.status,
      },
    });
  } catch (error) {
    console.error("[api/admin/reviews] تعذّر تحديث المراجعة:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر تحديث المراجعة" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await db.bookReview.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "لا توجد مراجعة بهذا المعرّف" },
        { status: 404 },
      );
    }

    await db.bookReview.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/reviews] تعذّر حذف المراجعة:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر حذف المراجعة" },
      { status: 500 },
    );
  }
}
