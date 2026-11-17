import { NextResponse } from "next/server";

/**
 * نقطة نهاية المراحل (Levels API)
 * ===================================
 * GET /api/levels/:id
 *
 * خط الأنابيب الكامل بعد الربط الحقيقي:
 *
 *   قاعدة بيانات لوحة الإدارة (Prisma)
 *        → level-repo (خريطة الصفوف)      ← المصدر الأول
 *        → normalizeLevel (طبقة التطبيع)
 *        → عقد بيانات اللعبة (GameLevel JSON)
 *        → الواجهة (GameContainer)
 *
 * شبكة الأمان: إن لم توجد المرحلة في القاعدة (قاعدة فارغة قبل
 * البذر مثلاً) يُستعلم ملف الـ fixtures — فلا ينقطع المسار عن
 * اللاعب أبداً، والقاعدة تبقى المصدر الرسمي فور توفرها.
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  /* 1) المصدر الرسمي — استعلام Prisma من قاعدة لوحة الإدارة */
  let adminRow: import("@/lib/game/normalize").AdminLevelRow | null = null;
  let source: "database" | "fixtures" = "database";

  try {
    const { getAdminLevelRow } = await import("@/lib/game/level-repo");
    adminRow = await getAdminLevelRow(id);
  } catch (error) {
    /* قاعدة غير مهيأة أو خطأ اتصال — نسجل ونهبط للبدائل */
    console.error("[api/levels] تعذّر الاستعلام من قاعدة لوحة الإدارة:", error);
  }

  /* 2) شبكة الأمان — الـ fixtures عند غياب المرحلة من القاعدة */
  if (!adminRow) {
    const { getAdminLevelFixture } = await import("@/lib/game/admin-fixtures");
    adminRow = getAdminLevelFixture(id);
    source = "fixtures";
  }

  if (!adminRow) {
    return NextResponse.json(
      { error: "level_not_found", message: "لا توجد مرحلة بهذا المعرّف" },
      { status: 404 },
    );
  }

  try {
    const { normalizeLevel } = await import("@/lib/game/normalize");
    const level = normalizeLevel(adminRow);

    if (level.questions.length === 0) {
      return NextResponse.json(
        {
          error: "level_empty",
          message: "المرحلة لا تحوي أسئلة صالحة بعد إجراء التطبيع",
        },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { ...level, _source: source },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/levels] فشل تطبيع المرحلة:", error);
    return NextResponse.json(
      { error: "normalization_failed", message: "تعذّر تجهيز بيانات المرحلة" },
      { status: 500 },
    );
  }
}
