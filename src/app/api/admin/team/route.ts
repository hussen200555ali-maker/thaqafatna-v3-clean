import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * فريق الإدارة — لوحة الإدارة
 * =================================
 * GET  /api/admin/team — كل الأعضاء الأحدث أولاً
 * POST /api/admin/team — إضافة عضو (name و email إلزاميان،
 *                        role ضمن admin|editor|viewer وافتراضياً editor)
 */

/** أدوار الفريق المقبولة */
const TEAM_ROLES = ["admin", "editor", "viewer"];

export async function GET() {
  try {
    const members = await db.teamMember.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      members: members.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        active: member.active,
        createdAt: member.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[api/admin/team] تعذّر جلب أعضاء الفريق:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جلب أعضاء الفريق" },
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

    const name = typeof input.name === "string" ? input.name.trim().slice(0, 40) : "";
    if (!name) {
      return NextResponse.json(
        { ok: false, error: "اسم العضو مطلوب" },
        { status: 400 },
      );
    }

    const email =
      typeof input.email === "string"
        ? input.email.trim().toLowerCase().slice(0, 120)
        : "";
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "البريد الإلكتروني غير صالح" },
        { status: 400 },
      );
    }

    let role = "editor";
    if (typeof input.role === "string" && input.role.trim()) {
      const candidate = input.role.trim();
      if (!TEAM_ROLES.includes(candidate)) {
        return NextResponse.json(
          { ok: false, error: "الدور يجب أن يكون admin أو editor أو viewer" },
          { status: 400 },
        );
      }
      role = candidate;
    }

    /* بريد مكرر — قيد الفريدة على مستوى القاعدة */
    const duplicate = await db.teamMember.findUnique({ where: { email } });
    if (duplicate) {
      return NextResponse.json(
        { ok: false, error: "البريد الإلكتروني مستخدم مسبقاً" },
        { status: 409 },
      );
    }

    const member = await db.teamMember.create({ data: { name, email, role } });
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
    console.error("[api/admin/team] تعذّر إضافة عضو الفريق:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر إضافة عضو الفريق" },
      { status: 500 },
    );
  }
}
