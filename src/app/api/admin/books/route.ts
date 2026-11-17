import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BOOK_STATUSES, shapeBook } from "@/lib/admin/library";

/**
 * فهرس كتب المكتبة وإنشاء كتاب جديد
 * =====================================
 * GET  /api/admin/books — كل الكتب بفئاتها وعدد فصولها
 * POST /api/admin/books — إضافة كتاب (title إلزامي، status ضمن
 *                         draft/published، categoryId إن أُرسل يجب أن يوجد)
 */
export async function GET() {
  try {
    const books = await db.book.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        category: true,
        _count: { select: { chapters: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      books: books.map((book) => shapeBook(book, book._count.chapters)),
    });
  } catch (error) {
    console.error("[api/admin/books] تعذّر جلب الكتب:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جلب قائمة الكتب" },
      { status: 500 },
    );
  }
}

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

    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (!title) {
      return NextResponse.json(
        { ok: false, error: "عنوان الكتاب مطلوب" },
        { status: 400 },
      );
    }

    let status = "published";
    if (typeof input.status === "string") {
      if (!BOOK_STATUSES.includes(input.status as (typeof BOOK_STATUSES)[number])) {
        return NextResponse.json(
          { ok: false, error: "حالة الكتاب يجب أن تكون مسودة أو منشوراً" },
          { status: 400 },
        );
      }
      status = input.status;
    }

    let categoryId: string | null = null;
    if (typeof input.categoryId === "string" && input.categoryId) {
      const category = await db.bookCategory.findUnique({
        where: { id: input.categoryId },
        select: { id: true },
      });
      if (!category) {
        return NextResponse.json(
          { ok: false, error: "التصنيف المحدد غير موجود" },
          { status: 400 },
        );
      }
      categoryId = input.categoryId;
    }

    const last = await db.book.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const created = await db.book.create({
      data: {
        title,
        author: typeof input.author === "string" ? input.author.trim() || null : null,
        description:
          typeof input.description === "string"
            ? input.description.trim() || null
            : null,
        status,
        categoryId,
        order: (last?.order ?? 0) + 1,
      },
      include: { category: true },
    });

    return NextResponse.json({ ok: true, book: shapeBook(created, 0) });
  } catch (error) {
    console.error("[api/admin/books] تعذّر إنشاء الكتاب:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر إنشاء الكتاب" },
      { status: 500 },
    );
  }
}
