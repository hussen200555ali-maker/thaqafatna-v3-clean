import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * اللاعبون — لوحة الإدارة
 * =============================
 * GET /api/admin/players — كل ملفات اللاعبين بكامل حقولها،
 * مرتبة بالنقاط تنازلياً (ثانوياً بالنجوم) مع العدد الكلي.
 */
export async function GET() {
  try {
    const players = await db.playerProfile.findMany({
      orderBy: [{ points: "desc" }, { stars: "desc" }],
    });

    return NextResponse.json({ ok: true, players, total: players.length });
  } catch (error) {
    console.error("[api/admin/players] تعذّر جلب اللاعبين:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جلب اللاعبين" },
      { status: 500 },
    );
  }
}
