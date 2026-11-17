import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * تصنيفات الكتب — فهرس وإنشاء
 * ================================
 * GET  /api/admin/categories — كل التصنيفات مع عدد كتبها
 * POST /api/admin/categories — تصنيف جديد (title إلزامي)
 */
export async function GET() {
  try {
    const categories = await db.bookCategory.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { books: true } } },
    });

    return NextResponse.json({
      ok: true,
      categories: categories.map((category) => ({
        id: category.id,
        title: category.title,
        icon: category.icon,
        order: category.order,
        bookCount: category._count.books,
      })),
    });
  } catch (error) {
    console.error("[api/admin/categories] تعذّر جلب التصنيفات:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جلب تصنيفات الكتب" },
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
        { ok: false, error: "عنوان التصنيف مطلوب" },
        { status: 400 },
      );
    }

    const last = await db.bookCategory.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const category = await db.bookCategory.create({
      data: {
        title,
        icon: typeof input.icon === "string" ? input.icon.trim() || null : null,
        order:
          typeof input.order === "number"
            ? input.order
            : (last?.order ?? 0) + 1,
      },
    });

    return NextResponse.json({
      ok: true,
      category: {
        id: category.id,
        title: category.title,
        icon: category.icon,
        order: category.order,
        bookCount: 0,
      },
    });
  } catch (error) {
    console.error("[api/admin/categories] تعذّر إنشاء التصنيف:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر إنشاء التصنيف" },
      { status: 500 },
    );
  }
}
