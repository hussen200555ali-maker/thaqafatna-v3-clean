import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * تفاصيل كتاب عام — للقرّاء
 * ============================
 * GET /api/library/books/:id — الكتاب المنشور بفصوله
 * ومحتواها ومراجعاته المعتمدة (المسودة تُرفض بـ 404).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const book = await db.book.findUnique({
      where: { id },
      include: {
        category: { select: { title: true } },
        chapters: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, order: true, content: true },
        },
        reviews: {
          where: { status: "approved" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            author: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
      },
    });

    if (!book || book.status !== "published") {
      return NextResponse.json(
        { ok: false, error: "الكتاب غير متاح للقراءة" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        categoryTitle: book.category?.title ?? null,
        chapters: book.chapters,
        reviews: book.reviews,
      },
    });
  } catch (error) {
    console.error("[api/library/books] تعذّر جلب الكتاب:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جلب الكتاب" },
      { status: 500 },
    );
  }
}
