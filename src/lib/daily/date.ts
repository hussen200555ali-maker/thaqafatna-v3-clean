/**
 * مفتاح يوم التحدي — YYYY-MM-DD بتوقيت الرياض.
 * نسخة سيرفرية خالصة (بلا React) تستخدمها جداول الجلسات والجدول اليومي.
 */

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Riyadh",
  calendar: "gregory",
  numberingSystem: "latn",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function riyadhDayKey(date: Date = new Date()): string {
  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) parts[part.type] = part.value;
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** صيغة مقبولة لمدخلات لوحة الإدارة */
export function isDayKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && riyadhDayKey(date) === value;
}
