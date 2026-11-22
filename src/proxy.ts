import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin/auth";

/**
 * حماية مركزية لكل مسارات لوحة الإدارة.
 * مسارات الدخول/الجلسة/الخروج مستثناة حتى يتمكن الزائر من تسجيل الدخول.
 */

const PUBLIC_PATHS = new Set([
  "/api/admin/login",
  "/api/admin/session",
  "/api/admin/logout",
]);

export function proxy(request: NextRequest) {
  if (PUBLIC_PATHS.has(request.nextUrl.pathname)) return NextResponse.next();

  if (!isAdminRequest(request)) {
    return NextResponse.json(
      { ok: false, error: "admin_auth_required" },
      { status: 401 },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
