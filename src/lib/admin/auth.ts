/**
 * مصادقة لوحة الإدارة — جلسة موقّعة بختم HMAC
 * ==============================================
 * لا قاعدة بيانات إضافية ولا NextAuth: بيانات الدخول من متغيرات البيئة،
 * والجلسة كوكي httpOnly موقّع تنتهي بعد ٨ ساعات.
 *
 * المتغيرات المطلوبة في Vercel:
 *   ADMIN_PASSWORD        (إلزامي — إن لم يُضف تُرفض كل طلبات الإدارة)
 *   ADMIN_USERNAME        (اختياري — الافتراضي admin)
 *   ADMIN_SESSION_SECRET  (اختياري — يُشتق من كلمة المرور إن لم يُحدد)
 */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "thaqafatna_admin";
const SESSION_MS = 8 * 60 * 60 * 1000;
const DEFAULT_USERNAME = "admin";

/** فشل مغلق: بدون كلمة مرور لا توجد صلاحيات إدارة إطلاقًا */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 6);
}

function configuredUsername(): string {
  return process.env.ADMIN_USERNAME?.trim() || DEFAULT_USERNAME;
}

function secret(): string {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit && explicit.length >= 16) return explicit;
  const password = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update(password).digest("hex");
}

/** مقارنة ثابتة الزمن لتفادي تخمين كلمة المرور بتوقيت الاستجابة */
function safeEqualText(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkAdminCredentials(username: string, password: string): boolean {
  if (!isAdminConfigured()) return false;
  return (
    safeEqualText(username.trim(), configuredUsername()) &&
    safeEqualText(password, process.env.ADMIN_PASSWORD ?? "")
  );
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** إنشاء كوكي موقّع — يُستخدم في مسار تسجيل الدخول فقط */
export function createAdminToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ u: configuredUsername(), exp: Date.now() + SESSION_MS }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** التحقق من الكوكي — صالح فقط إن كان التوقيت والاسم والتوقيع صحيحين */
export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token || !isAdminConfigured()) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length) return false;
  if (!timingSafeEqual(expected, received)) return false;

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { u?: unknown; exp?: unknown };
    return (
      data.u === configuredUsername() &&
      typeof data.exp === "number" &&
      data.exp > Date.now()
    );
  } catch {
    return false;
  }
}

/** قراءة الكوكي من أي NextRequest */
export function isAdminRequest(request: {
  cookies: { get(name: string): { value: string } | undefined };
}): boolean {
  return verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);
}
