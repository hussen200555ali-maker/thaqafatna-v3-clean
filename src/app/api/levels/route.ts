import { NextResponse } from "next/server";

/**
 * نقطة نهاية فهرس المراحل (Levels List API)
 * ==============================================
 * GET /api/levels
 *
 * قائمة رؤوس المراحل من قاعدة لوحة الإدارة — كل ما تحتاجه
 * بطاقات «البدايات» في الصفحة الرئيسية: العنوان والوصف والصعوبة
 * وعدد الألغاز — دون تحميل محتوى الألغاز نفسها (استعلام خفيف).
 *
 * الاستقرار: خطأ القاعدة لا يُفقد الصفحة شيئاً — يُعاد فهرس
 * فارغ مع رمز الحالة 200 وحقّ ok=false، فتعرض الواجهة حالتها
 * الفارغة الأنيقة بدل انهيار كامل.
 */

export async function GET() {
  try {
    const { listLevelHeaders } = await import("@/lib/game/level-repo");
    const levels = await listLevelHeaders();

    return NextResponse.json(
      { ok: true, levels },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/levels] تعذّر جلب فهرس المراحل:", error);
    return NextResponse.json(
      { ok: false, levels: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
