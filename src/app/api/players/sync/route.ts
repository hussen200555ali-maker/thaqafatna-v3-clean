import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * مزامنة ملف اللاعب — تطبيق اللاعب
 * =====================================
 * POST /api/players/sync — Upsert بمعرّف الجهاز (deviceId):
 * يُنشئ الملف عند أول مزامنة، ويحدّث الاسم والإحصاءات وآخر
 * نشاط في كل مزامنة بعدها.
 */

/** قصّ قيمة رقمية واردة إلى عدد صحيح ≥ 0 — أو null إن لم تكن رقماً */
function clampInt(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.round(parsed));
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

    const deviceId =
      typeof input.deviceId === "string" ? input.deviceId.trim() : "";
    const name =
      typeof input.name === "string" ? input.name.trim().slice(0, 40) : "";
    if (!deviceId || !name) {
      return NextResponse.json(
        { ok: false, error: "معرّف الجهاز والاسم مطلوبان" },
        { status: 400 },
      );
    }

    /* الإحصاءات — أعداد صحيحة تُقطع إلى ≥ 0 */
    const points = clampInt(input.points);
    const stars = clampInt(input.stars);
    const badgesCount = clampInt(input.badgesCount);
    const coins = clampInt(input.coins);
    const levelsCompleted = clampInt(input.levelsCompleted);
    if (
      points === null ||
      stars === null ||
      badgesCount === null ||
      coins === null ||
      levelsCompleted === null
    ) {
      return NextResponse.json(
        { ok: false, error: "جميع الإحصاءات يجب أن تكون أعداداً صحيحة" },
        { status: 400 },
      );
    }

    const player = await db.playerProfile.upsert({
      where: { deviceId },
      update: {
        name,
        points,
        stars,
        badgesCount,
        coins,
        levelsCompleted,
        lastActiveAt: new Date(),
      },
      create: { deviceId, name, points, stars, badgesCount, coins, levelsCompleted },
    });

    return NextResponse.json({ ok: true, player });
  } catch (error) {
    console.error("[api/players/sync] تعذّرت مزامنة ملف اللاعب:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّرت مزامنة ملف اللاعب" },
      { status: 500 },
    );
  }
}
