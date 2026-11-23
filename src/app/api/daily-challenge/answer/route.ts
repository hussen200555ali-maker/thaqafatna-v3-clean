import { NextResponse } from "next/server";
import { submitDailyAnswer } from "@/lib/daily/service";

/**
 * POST /api/daily-challenge/answer
 * الحكم السيرفي الوحيد على إجابة تحدي اليوم؛ لا يُثق بحكم المتصفح.
 */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  if (typeof input.token !== "string" || !input.token) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
  }

  try {
    const outcome = await submitDailyAnswer(input.token, input.answer ?? null);
    return NextResponse.json(
      outcome.result ?? { ok: false, error: outcome.error },
      { status: outcome.status, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/daily-challenge/answer] تعذّر التحقق:", error);
    return NextResponse.json(
      { ok: false, error: "verification_failed" },
      { status: 500 },
    );
  }
}
