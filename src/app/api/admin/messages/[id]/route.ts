import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * رسالة دعم واحدة — لوحة الإدارة
 * ====================================
 * PATCH  /api/admin/messages/:id — تحديث الحالة (new|read|archived)
 *          و/أو كتابة ردّ — والردّ يجعل الرسالة «مقروءة» تلقائياً
 *          ما لم تُحدَّد حالة صريحة.
 * DELETE /api/admin/messages/:id — حذف نهائي
 */

/** حالات رسائل الدعم المقبولة */
const MESSAGE_STATUSES = ["new", "read", "archived"];

/** تشكيل رسالة للرد — كل الحقول مع تاريخ ISO */
function shapeMessage(message: {
  id: string;
  senderName: string;
  kind: string;
  subject: string;
  body: string;
  reply: string | null;
  status: string;
  deviceId: string | null;
  createdAt: Date;
}) {
  return {
    id: message.id,
    senderName: message.senderName,
    kind: message.kind,
    subject: message.subject,
    body: message.body,
    reply: message.reply,
    status: message.status,
    deviceId: message.deviceId,
    createdAt: message.createdAt.toISOString(),
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "جسم الطلب غير صالح" },
        { status: 400 },
      );
    }
    const input = body as Record<string, unknown>;

    const hasStatus = "status" in input;
    const hasReply = "reply" in input;
    if (!hasStatus && !hasReply) {
      return NextResponse.json(
        { ok: false, error: "لا حقول للتحديث — أرسل status أو reply" },
        { status: 400 },
      );
    }

    const data: { status?: string; reply?: string } = {};

    if (hasStatus) {
      const status = typeof input.status === "string" ? input.status.trim() : "";
      if (!MESSAGE_STATUSES.includes(status)) {
        return NextResponse.json(
          { ok: false, error: "الحالة يجب أن تكون new أو read أو archived" },
          { status: 400 },
        );
      }
      data.status = status;
    }

    if (hasReply) {
      if (typeof input.reply !== "string") {
        return NextResponse.json(
          { ok: false, error: "الرد يجب أن يكون نصاً" },
          { status: 400 },
        );
      }
      data.reply = input.reply.trim().slice(0, 1000);
      /* كتابة الردّ تعني أن الإشراف اطّلع على الرسالة */
      if (!data.status) data.status = "read";
    }

    const existing = await db.supportMessage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "لا توجد رسالة بهذا المعرّف" },
        { status: 404 },
      );
    }

    const message = await db.supportMessage.update({ where: { id }, data });
    return NextResponse.json({ ok: true, message: shapeMessage(message) });
  } catch (error) {
    console.error("[api/admin/messages] تعذّر تحديث الرسالة:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر تحديث الرسالة" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await db.supportMessage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "لا توجد رسالة بهذا المعرّف" },
        { status: 404 },
      );
    }

    await db.supportMessage.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/messages] تعذّر حذف الرسالة:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر حذف الرسالة" },
      { status: 500 },
    );
  }
}
