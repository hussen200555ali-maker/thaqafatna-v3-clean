import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * المتصدرون العام — ترتيب حي من ملفات اللاعبين المُزامَنة
 * ============================================================
 * GET /api/leaderboard?deviceId=...
 *
 * ترتيب تنازلي بالنقاط (ثانوياً بالنجوم) — أعلى 10 يظهرون في
 * المنصة، ومركز الجهاز المطلوب يُحسب دائماً حتى لو كان خارجها.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId")?.trim() || null;

    const players = await db.playerProfile.findMany({
      orderBy: [{ points: "desc" }, { stars: "desc" }],
    });

    /* مركز الجهاز — عدد من نقاطه أعلى + 1 */
    let myRank: number | null = null;
    let myPoints = 0;
    if (deviceId) {
      const me = players.find((player) => player.deviceId === deviceId);
      if (me) {
        myPoints = me.points;
        myRank = players.filter((player) => player.points > me.points).length + 1;
      }
    }

    const leaders = players.slice(0, 10).map((player) => ({
      name: player.name,
      points: player.points,
      stars: player.stars,
      levelsCompleted: player.levelsCompleted,
      isMe: deviceId !== null && player.deviceId === deviceId,
    }));

    return NextResponse.json(
      {
        ok: true,
        leaders,
        myRank,
        myPoints,
        totalPlayers: players.length,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/leaderboard] تعذّر جلب المتصدرين:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جلب المتصدرين" },
      { status: 500 },
    );
  }
}
