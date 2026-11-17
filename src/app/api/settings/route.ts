import { NextResponse } from "next/server";
import { readPlatformSettings } from "@/lib/admin/platform-settings";

/**
 * إعدادات المنصة العامة — تطبيق اللاعب
 * =========================================
 * GET /api/settings — القيم العامة التي تهم اللاعب: اسم التطبيق،
 * مكافأة التحدي اليومي، العملات الابتدائية، تكلفة التلميح،
 * ووضع الصيانة (مع fallback للعقد الافتراضي عند أي نقص).
 */
export async function GET() {
  try {
    const settings = await readPlatformSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    console.error("[api/settings] تعذّر جلب إعدادات المنصة:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جلب إعدادات المنصة" },
      { status: 500 },
    );
  }
}
