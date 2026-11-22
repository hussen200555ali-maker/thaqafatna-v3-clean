import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminConfigured, isAdminRequest } from "@/lib/admin/auth";

/** حالة جلسة الإدارة — يقرأها التطبيق لعرض نموذج الدخول أو اللوحة */
export function GET(request: NextRequest) {
  return NextResponse.json(
    {
      ok: isAdminRequest(request),
      configured: isAdminConfigured(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
