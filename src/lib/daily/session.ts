/**
 * رموز جلسات تحدي اليوم — توقيع HMAC + ربط بقاعدة البيانات.
 * الرمز وحده لا يكفي: الخادم يقارن تجزيئته (SHA-256) بالمحفوظ
 * ويتحقق من انتهاء الصلاحية وحالة الجلسة قبل قبول أي إجابة.
 */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const DAILY_TTL_MS = 12 * 60 * 60 * 1000;

interface TokenPayload {
  /** معرّف الجلسة في قاعدة البيانات */
  sid: string;
  /** مفتاح اليوم بتوقيت الرياض */
  d: string;
  /** معرّف الجهاز */
  dev: string;
  /** معرّف اللغز */
  p: string;
  /** انتهاء الصلاحية بالمللي ثانية */
  exp: number;
  /** عشوائي لضمان اختلاف الرمز عند كل إصدار */
  n: string;
}

function secret(): string {
  const explicit =
    process.env.DAILY_SESSION_SECRET ??
    process.env.ADMIN_SESSION_SECRET ??
    process.env.ADMIN_PASSWORD;
  if (explicit && explicit.length >= 16) return explicit;
  /* قيمة احتياطية للتطوير: الرمز مرتبط بسجل قاعدة البيانات أيضاً */
  return createHash("sha256").update("thaqafatna-daily-local").digest("hex");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** إصدار رمز جديد لجلسة موجودة */
export function issueDailyToken(input: {
  sessionId: string;
  dateKey: string;
  deviceId: string;
  puzzleId: string;
}): { token: string; hash: string; expiresAt: Date } {
  const exp = Date.now() + DAILY_TTL_MS;
  const payload: TokenPayload = {
    sid: input.sessionId,
    d: input.dateKey,
    p: input.puzzleId,
    dev: input.deviceId,
    exp,
    n: createHash("sha256")
      .update(`${input.sessionId}:${Date.now()}:${Math.random()}`)
      .digest("hex")
      .slice(0, 12),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const token = `${encoded}.${sign(encoded)}`;
  return { token, hash: tokenHash(token), expiresAt: new Date(exp) };
}

/** قراءة الرمز والتحقق من توقيعه — لا تثق بمحتواه قبل مطابقته بالقاعدة */
export function readDailyToken(token: string): TokenPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = Buffer.from(sign(encoded));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received))
    return null;
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as TokenPayload;
    if (
      typeof payload.sid !== "string" ||
      typeof payload.d !== "string" ||
      typeof payload.p !== "string" ||
      typeof payload.dev !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp <= Date.now()
    )
      return null;
    return payload;
  } catch {
    return null;
  }
}
