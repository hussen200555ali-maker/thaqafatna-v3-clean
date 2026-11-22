import { Prisma } from "@prisma/client";

/**
 * كشف خطأ Prisma «السجل غير موجود» — P2025
 * ==========================================
 * Prisma 6 يرمي P2025 عند update/delete لسجل غائب برسالة جديدة
 * (No record was found...)، بينما الإصدارات الأقدم استخدمت
 * «Record to update/delete not found» في نص الرسالة.
 *
 * الفحص عبر error.code هو الطريقة الرسمية الراسخة — نصوص
 * الرسائل قد تتغير بين الإصدارات (وهذا ما حدث فعلاً وأفسد
 * كشف الـ 404 في مسارات الإدارة كلها).
 */
export function isRecordNotFound(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2025";
  }
  return (
    error instanceof Error &&
    /Record to (update|delete) not found|No record was found/i.test(
      error.message,
    )
  );
}
