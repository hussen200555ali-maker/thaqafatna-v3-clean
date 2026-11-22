import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  checkAdminCredentials,
  createAdminToken,
  isAdminConfigured,
} from "@/lib/admin/auth";

/** تسجيل دخول الإدارة — بيانات الدخول من متغيرات البيئة على الخادم فقط */
export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "admin_not_configured",
        message: "لم يُضبط ADMIN_PASSWORD في إعدادات النشر — لا يمكن تسجيل الدخول للإدارة",
      },
      { status: 503 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "invalid_body" },
      { status: 400 },
    );
  }
  const input = body as Record<string, unknown>;
  const username = typeof input.username === "string" ? input.username : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (!checkAdminCredentials(username, password)) {
    return NextResponse.json(
      { ok: false, error: "invalid_credentials", message: "بيانات الدخول غير صحيحة" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return response;
}
