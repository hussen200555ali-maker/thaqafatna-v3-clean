import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * الدعم والتواصل — تطبيق اللاعب
 * ===================================
 * POST /api/support — إرسال رسالة (اقتراح | خطأ | طلب | أخرى)
 * GET  /api/support?deviceId=... — رسائل هذا الجهاز الأحدث أولاً
 * (مع رد الإشراف إن وُجد — لا تُكشف بيانات الأجهزة الأخرى)
 */

/** الأنواع المقبولة لرسائل الدعم */
const SUPPORT_KINDS = ["suggestion", "bug", "request", "other"];

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

    const kind = typeof input.kind === "string" ? input.kind.trim() : "";
    if (!SUPPORT_KINDS.includes(kind)) {
      return NextResponse.json(
        {
          ok: false,
          error: "نوع الرسالة يجب أن يكون suggestion أو bug أو request أو other",
        },
        { status: 400 },
      );
    }

    /* الموضوع والنص — إلزاميان مع القصّ للحدود الآمنة */
    const subject =
      typeof input.subject === "string" ? input.subject.trim().slice(0, 120) : "";
    const messageBody =
      typeof input.body === "string" ? input.body.trim().slice(0, 1000) : "";
    if (!subject || !messageBody) {
      return NextResponse.json(
        { ok: false, error: "الموضوع ونص الرسالة مطلوبان" },
        { status: 400 },
      );
    }

    const senderName =
      typeof input.senderName === "string" && input.senderName.trim()
        ? input.senderName.trim().slice(0, 24)
        : "زائر";
    const deviceId =
      typeof input.deviceId === "string" && input.deviceId.trim()
        ? input.deviceId.trim()
        : null;

    await db.supportMessage.create({
      data: { senderName, kind, subject, body: messageBody, deviceId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/support] تعذّر إرسال رسالة الدعم:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر إرسال الرسالة" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const deviceId =
      new URL(request.url).searchParams.get("deviceId")?.trim() || null;
    if (!deviceId) {
      return NextResponse.json({ ok: true, messages: [] });
    }

    /* رسائل هذا الجهاز فقط — الأحدث أولاً */
    const messages = await db.supportMessage.findMany({
      where: { deviceId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      messages: messages.map((message) => ({
        id: message.id,
        subject: message.subject,
        body: message.body,
        kind: message.kind,
        reply: message.reply,
        status: message.status,
        createdAt: message.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[api/support] تعذّر جلب رسائل الدعم:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جلب رسائل الدعم" },
      { status: 500 },
    );
  }
}
