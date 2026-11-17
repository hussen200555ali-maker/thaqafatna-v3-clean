import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * رسائل الدعم — لوحة الإدارة
 * ================================
 * GET /api/admin/messages — كل الرسائل الأحدث أولاً مع عدّادات
 * الحالات (جديدة | مقروءة | مؤرشفة) لشارات صندوق الوارد.
 */
export async function GET() {
  try {
    const [messages, newCount, readCount, archivedCount] = await Promise.all([
      db.supportMessage.findMany({ orderBy: { createdAt: "desc" } }),
      db.supportMessage.count({ where: { status: "new" } }),
      db.supportMessage.count({ where: { status: "read" } }),
      db.supportMessage.count({ where: { status: "archived" } }),
    ]);

    return NextResponse.json({
      ok: true,
      messages: messages.map((message) => ({
        id: message.id,
        senderName: message.senderName,
        kind: message.kind,
        subject: message.subject,
        body: message.body,
        reply: message.reply,
        status: message.status,
        deviceId: message.deviceId,
        createdAt: message.createdAt.toISOString(),
      })),
      counts: { new: newCount, read: readCount, archived: archivedCount },
    });
  } catch (error) {
    console.error("[api/admin/messages] تعذّر جلب الرسائل:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جلب رسائل الدعم" },
      { status: 500 },
    );
  }
}
