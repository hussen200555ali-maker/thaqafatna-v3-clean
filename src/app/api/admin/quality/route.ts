import { NextResponse } from "next/server";
import { collectQualityIssues, summarizeIssues } from "@/lib/admin/quality";

/**
 * مدقّق جودة المحتوى
 * =====================
 * GET /api/admin/quality
 *
 * كل ملاحظات الجودة على الألغاز والمراحل — مرتبة بالخطورة
 * (العالية فالمتوسطة فالمنخفضة) مع ملخّص عددي يغذّي بطاقات
 * الصفحة وشارة مدقّق الجودة في الشريط الجانبي.
 */
export async function GET() {
  try {
    const issues = await collectQualityIssues();
    return NextResponse.json({
      ok: true,
      issues,
      summary: summarizeIssues(issues),
    });
  } catch (error) {
    console.error("[api/admin/quality] تعذّر فحص الجودة:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر فحص جودة المحتوى" },
      { status: 500 },
    );
  }
}
