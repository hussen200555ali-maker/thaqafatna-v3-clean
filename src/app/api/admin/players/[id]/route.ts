import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * لاعب واحد — لوحة الإدارة
 * ==============================
 * DELETE /api/admin/players/:id — حذف ملف لاعب نهائياً
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await db.playerProfile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "لا يوجد لاعب بهذا المعرّف" },
        { status: 404 },
      );
    }

    await db.playerProfile.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/players] تعذّر حذف اللاعب:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر حذف اللاعب" },
      { status: 500 },
    );
  }
}
