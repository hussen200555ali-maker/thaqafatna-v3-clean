import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * المكتبة العامة — الصفحة الرئيسية
 * ==================================
 * GET /api/library — التصنيفات والكتب المنشورة فقط
 * (المسودات لا تظهر للقرّاء — تُدار من لوحة الإدارة)
 */
export async function GET() {
  try {
    const [categories, books] = await Promise.all([
      db.bookCategory.findMany({ orderBy: { order: "asc" } }),
      db.book.findMany({
        where: { status: "published" },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: {
          category: { select: { title: true } },
          _count: {
            select: { chapters: true, reviews: { where: { status: "approved" } } },
          },
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      categories: categories.map((category) => ({
        id: category.id,
        title: category.title,
        icon: category.icon,
        order: category.order,
        bookCount: books.filter((book) => book.categoryId === category.id).length,
      })),
      books: books.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        categoryTitle: book.category?.title ?? null,
        chapterCount: book._count.chapters,
        reviewCount: book._count.reviews,
        order: book.order,
      })),
    });
  } catch (error) {
    console.error("[api/library] تعذّر جلب المكتبة:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جلب المكتبة" },
      { status: 500 },
    );
  }
}
