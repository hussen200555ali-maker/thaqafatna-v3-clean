import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * مراجعات الكتب — لوحة الإدارة
 * ==============================
 * GET /api/admin/reviews — كل المراجعات بكل حالاتها
 * (مع فلترة اختيارية ?status=pending|approved|rejected)
 */
export async function GET(request: Request) {
  try {
    const status = new URL(request.url).searchParams.get("status");
    const allowed = ["pending", "approved", "rejected"];
    const where = status && allowed.includes(status) ? { status } : undefined;

    const reviews = await db.bookReview.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { book: { select: { title: true } } },
    });

    return NextResponse.json({
      ok: true,
      reviews: reviews.map((review) => ({
        id: review.id,
        bookId: review.bookId,
        bookTitle: review.book?.title ?? null,
        author: review.author,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        createdAt: review.createdAt.toISOString(),
      })),
      counts: {
        pending: await db.bookReview.count({ where: { status: "pending" } }),
        approved: await db.bookReview.count({ where: { status: "approved" } }),
        rejected: await db.bookReview.count({ where: { status: "rejected" } }),
      },
    });
  } catch (error) {
    console.error("[api/admin/reviews] تعذّر جلب المراجعات:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جلب المراجعات" },
      { status: 500 },
    );
  }
}
