import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * سجل التدقيق — لوحة الإدارة
 * ================================
 * GET  /api/admin/audit — آخر 100 قيد تنازلياً (الأحدث أولاً)
 * POST /api/admin/audit — تدوين عملية إدارة (يُستدعى fire-and-forget
 *                         من الواجهات بعد كل إنشاء/تعديل/حذف)
 */

/** أنواع العمليات المقبولة في السجل */
const AUDIT_ACTIONS = ["إنشاء", "تعديل", "حذف"];

export async function GET() {
  try {
    const entries = await db.auditEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      ok: true,
      entries: entries.map((entry) => ({
        id: entry.id,
        action: entry.action,
        entity: entry.entity,
        detail: entry.detail,
        createdAt: entry.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[api/admin/audit] تعذّر جلب سجل التدقيق:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جلب سجل التدقيق" },
      { status: 500 },
    );
  }
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

    const action = typeof input.action === "string" ? input.action.trim() : "";
    if (!AUDIT_ACTIONS.includes(action)) {
      return NextResponse.json(
        { ok: false, error: "العملية يجب أن تكون إنشاء أو تعديل أو حذف" },
        { status: 400 },
      );
    }

    const entity = typeof input.entity === "string" ? input.entity.trim().slice(0, 80) : "";
    const detail = typeof input.detail === "string" ? input.detail.trim().slice(0, 500) : "";
    if (!entity || !detail) {
      return NextResponse.json(
        { ok: false, error: "الكيان والتفاصيل مطلوبان" },
        { status: 400 },
      );
    }

    await db.auditEntry.create({ data: { action, entity, detail } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/audit] تعذّر تدوين العملية:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر تدوين العملية في السجل" },
      { status: 500 },
    );
  }
}
