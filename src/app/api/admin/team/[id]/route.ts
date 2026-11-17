import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * عضو فريق واحد — لوحة الإدارة
 * ==================================
 * PATCH  /api/admin/team/:id — تحديث الاسم و/أو الدور و/أو التفعيل
 * DELETE /api/admin/team/:id — إزالة العضو نهائياً
 */

/** أدوار الفريق المقبولة */
const TEAM_ROLES = ["admin", "editor", "viewer"];

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

    const data: { name?: string; role?: string; active?: boolean } = {};

    if ("name" in input) {
      const name =
        typeof input.name === "string" ? input.name.trim().slice(0, 40) : "";
      if (!name) {
        return NextResponse.json(
          { ok: false, error: "اسم العضو يجب أن يكون نصاً غير فارغ" },
          { status: 400 },
        );
      }
      data.name = name;
    }

    if ("role" in input) {
      const role = typeof input.role === "string" ? input.role.trim() : "";
      if (!TEAM_ROLES.includes(role)) {
        return NextResponse.json(
          { ok: false, error: "الدور يجب أن يكون admin أو editor أو viewer" },
          { status: 400 },
        );
      }
      data.role = role;
    }

    if ("active" in input) {
      if (typeof input.active !== "boolean") {
        return NextResponse.json(
          { ok: false, error: "حالة التفعيل يجب أن تكون منطقية" },
          { status: 400 },
        );
      }
      data.active = input.active;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { ok: false, error: "لا حقول للتحديث — أرسل name أو role أو active" },
        { status: 400 },
      );
    }

    const existing = await db.teamMember.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "لا يوجد عضو بهذا المعرّف" },
        { status: 404 },
      );
    }

    const member = await db.teamMember.update({ where: { id }, data });
    return NextResponse.json({
      ok: true,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        active: member.active,
        createdAt: member.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[api/admin/team] تعذّر تحديث عضو الفريق:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر تحديث عضو الفريق" },
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

    const existing = await db.teamMember.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "لا يوجد عضو بهذا المعرّف" },
        { status: 404 },
      );
    }

    await db.teamMember.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/team] تعذّر حذف عضو الفريق:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر حذف عضو الفريق" },
      { status: 500 },
    );
  }
}
