import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * مراجعات المكتبة العامة — إضافة مراجعة
 * =======================================
 * POST /api/library/reviews — يضيف مراجعة بحالة «معلّقة»
 * فلا تظهر للقرّاء حتى يعتمدها المشرف من لوحة الإدارة.
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "جسم الطلب غير صالح" },
        { status: 400 },
      );
    }
    const input = body as Record<string, unknown>;

    const bookId = typeof input.bookId === "string" ? input.bookId : "";
    const comment = typeof input.comment === "string" ? input.comment.trim() : "";
    const rating = typeof input.rating === "number" ? Math.round(input.rating) : 0;
    const author =
      typeof input.author === "string" && input.author.trim()
        ? input.author.trim().slice(0, 40)
        : "زائر";

    if (!bookId) {
      return NextResponse.json(
        { ok: false, error: "معرّف الكتاب مطلوب" },
        { status: 400 },
      );
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { ok: false, error: "التقييم يجب أن يكون من نجمة إلى خمس" },
        { status: 400 },
      );
    }
    if (comment.length < 5) {
      return NextResponse.json(
        { ok: false, error: "اكتب مراجعة من خمسة أحرف على الأقل" },
        { status: 400 },
      );
    }

    const book = await db.book.findUnique({
      where: { id: bookId },
      select: { id: true, status: true, title: true },
    });
    if (!book || book.status !== "published") {
      return NextResponse.json(
        { ok: false, error: "الكتاب غير متاح للمراجعة" },
        { status: 404 },
      );
    }

    await db.bookReview.create({
      data: { bookId, author, rating, comment: comment.slice(0, 500), status: "pending" },
    });

    return NextResponse.json({
      ok: true,
      message: "وصلت مراجعتك — ستظهر بعد اعتماد الإشراف",
    });
  } catch (error) {
    console.error("[api/library/reviews] تعذّر إضافة المراجعة:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر إضافة المراجعة" },
      { status: 500 },
    );
  }
}
