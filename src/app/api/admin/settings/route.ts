import { NextResponse } from "next/server";
import {
  readPlatformSettings,
  writePlatformSettings,
  type PlatformSettings,
} from "@/lib/admin/platform-settings";

/**
 * إعدادات المنصة — لوحة الإدارة
 * ===================================
 * GET /api/admin/settings — قراءة الإعدادات الحالية
 * PUT /api/admin/settings — تحديث جزئي: ما وُجد في الجسم فقط
 *     (appName 1-40 حرفاً، dailyChallengeReward 1-500،
 *      startingCoins 0-1000، defaultHintCost 0-100،
 *      maintenanceMode منطقي)
 */

/** فحص عدد صحيح ضمن مجال — يعيد القيمة أو رسالة خطأ عربية */
function intInRange(
  value: unknown,
  label: string,
  min: number,
  max: number,
): { ok: true; value: number } | { ok: false; error: string } {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    return {
      ok: false,
      error: `${label} يجب أن يكون عدداً صحيحاً بين ${min} و ${max}`,
    };
  }
  return { ok: true, value };
}

export async function GET() {
  try {
    const settings = await readPlatformSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    console.error("[api/admin/settings] تعذّر جلب الإعدادات:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جلب الإعدادات" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "جسم الطلب غير صالح" },
        { status: 400 },
      );
    }
    const input = body as Record<string, unknown>;

    /* التحديث الجزئي — لا يُمسّ إلا ما وُجد في الجسم */
    const patch: Partial<PlatformSettings> = {};

    if ("appName" in input) {
      const appName = typeof input.appName === "string" ? input.appName.trim() : "";
      if (appName.length < 1 || appName.length > 40) {
        return NextResponse.json(
          { ok: false, error: "اسم التطبيق يجب أن يكون نصاً من 1 إلى 40 حرفاً" },
          { status: 400 },
        );
      }
      patch.appName = appName;
    }

    if ("dailyChallengeReward" in input) {
      const result = intInRange(
        input.dailyChallengeReward,
        "مكافأة التحدي اليومي",
        1,
        500,
      );
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }
      patch.dailyChallengeReward = result.value;
    }

    if ("startingCoins" in input) {
      const result = intInRange(input.startingCoins, "العملات الابتدائية", 0, 1000);
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }
      patch.startingCoins = result.value;
    }

    if ("defaultHintCost" in input) {
      const result = intInRange(input.defaultHintCost, "تكلفة التلميح", 0, 100);
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }
      patch.defaultHintCost = result.value;
    }

    if ("maintenanceMode" in input) {
      if (typeof input.maintenanceMode !== "boolean") {
        return NextResponse.json(
          { ok: false, error: "وضع الصيانة يجب أن يكون قيمة منطقية" },
          { status: 400 },
        );
      }
      patch.maintenanceMode = input.maintenanceMode;
    }

    await writePlatformSettings(patch);
    const settings = await readPlatformSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    console.error("[api/admin/settings] تعذّر تحديث الإعدادات:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر تحديث الإعدادات" },
      { status: 500 },
    );
  }
}
