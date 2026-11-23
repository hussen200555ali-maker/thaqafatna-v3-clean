import { NextResponse } from "next/server";
import { startDailyChallenge } from "@/lib/daily/service";

/**
 * تحدي اليوم — سؤال واحد يوميًا بتوقيت الرياض.
 * GET /api/daily-challenge?deviceId=...
 *
 * يُعيد مرحلة بسؤال واحد بلا إجابة، مع رمز جلسة موقّع.
 * الإجابة الصحيحة لا تُرسل إلى المتصفح — `/api/daily-challenge/answer`
 * هي التي تحكم وتُمنح المكافأة.
 */
export async function GET(request: Request) {
  try {
    const deviceId = new URL(request.url).searchParams.get("deviceId")?.trim();
    if (!deviceId || deviceId.length > 120) {
      return NextResponse.json(
        { error: "invalid_device", message: "معرّف الجهاز مطلوب" },
        { status: 400 },
      );
    }

    const challenge = await startDailyChallenge(deviceId);
    if (!challenge) {
      return NextResponse.json(
        {
          error: "daily_unavailable",
          message: "لا يوجد سؤال متاح لتحدي اليوم — أضف سؤالًا إلى بنك التحدي من لوحة الإدارة",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        ...challenge.level,
        date: challenge.date,
        dailyToken: challenge.token,
        dailyStatus: challenge.status,
        dailyReward: challenge.reward,
        coins: challenge.coins,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/daily-challenge] تعذّر تجهيز تحدي اليوم:", error);
    return NextResponse.json(
      { error: "daily_failed", message: "تعذّر تجهيز تحدي اليوم" },
      { status: 500 },
    );
  }
}
