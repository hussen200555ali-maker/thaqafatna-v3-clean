import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shapeBookChapter } from "@/lib/admin/library";

/**
 * فصول الكتب — فهرس وإنشاء
 * =============================
 * GET  /api/admin/book-chapters        — كل الفصول (أو ?bookId= للتصفية)
 * POST /api/admin/book-chapters        — فصل جديد داخل كتاب
 */
export async function GET(request: Request) {
  try {
    const bookId = new URL(request.url).searchParams.get("bookId");

    const chapters = await db.bookChapter.findMany({
      where: bookId ? { bookId } : undefined,
      orderBy: [{ bookId: "asc" }, { order: "asc" }],
      include: { book: { select: { title: true } } },
    });

    return NextResponse.json({
      ok: true,
      chapters: chapters.map(shapeBookChapter),
    });
  } catch (error) {
    console.error("[api/admin/book-chapters] تعذّر جلب الفصول:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جلب فصول الكتب" },
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

    const bookId = typeof input.bookId === "string" ? input.bookId : "";
    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (!bookId) {
      return NextResponse.json(
        { ok: false, error: "معرّف الكتاب مطلوب" },
        { status: 400 },
      );
    }
    if (!title) {
      return NextResponse.json(
        { ok: false, error: "عنوان الفصل مطلوب" },
        { status: 400 },
      );
    }

    const book = await db.book.findUnique({
      where: { id: bookId },
      select: { id: true, title: true },
    });
    if (!book) {
      return NextResponse.json(
        { ok: false, error: "لا يوجد كتاب بهذا المعرّف" },
        { status: 404 },
      );
    }

    const last = await db.bookChapter.findFirst({
      where: { bookId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const chapter = await db.bookChapter.create({
      data: {
        bookId,
        title,
        order:
          typeof input.order === "number"
            ? input.order
            : (last?.order ?? 0) + 1,
        /* محتوى الفصل — نص القراءة (اختياري عند الإنشاء) */
        content:
          typeof input.content === "string" && input.content.trim()
            ? input.content.trim().slice(0, 20000)
            : null,
      },
      include: { book: { select: { title: true } } },
    });

    return NextResponse.json({ ok: true, chapter: shapeBookChapter(chapter) });
  } catch (error) {
    console.error("[api/admin/book-chapters] تعذّر إنشاء الفصل:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر إنشاء فصل الكتاب" },
      { status: 500 },
    );
  }
}
