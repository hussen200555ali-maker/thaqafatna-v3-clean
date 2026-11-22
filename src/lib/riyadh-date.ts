"use client";

/**
 * تاريخ الرياض الآمن للإرواء (Hydration-Safe)
 * =============================================
 * المشكلة: أي تاريخ يُحسب أثناء الرسم يختلف بين خادم Vercel (UTC)
 * ومتصفح الزائر (الرياض +3) في أول ثلاث ساعات من اليوم → React error #418.
 *
 * الحل: لقطة خادم ثابتة فارغة دائمًا، والعميل يحسب التاريخ بعد التركيب،
 * مع اشتراك واحد يتجدد تلقائيًا عند منتصف الليل التالي بتوقيت الرياض.
 *
 * قواعد مهمة:
 *  • getSnapshot يجب أن يعيد نفس المرجع/النص بين التغييرات — لذلك توجد ذاكرة.
 *  • المنسّقات على مستوى الوحدة (لا تُنشأ داخل الرسم).
 *  • calendar/numberingSystem مثبتان لتفادي اختلاف Node عن المتصفح.
 */

import { useSyncExternalStore } from "react";

/** منسّق أجزاء التاريخ — موثوق به لبناء المفتاح YYYY-MM-DD */
const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Riyadh",
  calendar: "gregory",
  numberingSystem: "latn",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** منسّق التاريخ الكامل بالعربية للعرض */
const fullDateFormatter = new Intl.DateTimeFormat("ar-EG", {
  timeZone: "Asia/Riyadh",
  calendar: "gregory",
  numberingSystem: "arab",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

interface RiyadhParts {
  year: number;
  month: number;
  day: number;
}

function readParts(date: Date): RiyadhParts {
  const values: Record<string, string> = {};
  for (const part of partsFormatter.formatToParts(date)) {
    values[part.type] = part.value;
  }
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

/** مفتاح اليوم بتوقيت الرياض — صالح للاستخدام في مفاتيح التخزين */
export function getRiyadhDayKey(): string {
  const { year, month, day } = readParts(new Date());
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** ذاكرة اللقطة — شرط استقرار getSnapshot في useSyncExternalStore */
let cachedKey = "";
let cachedLabel = "";

/** النص العربي الكامل لليوم الحالي بتوقيت الرياض */
export function getRiyadhDateLabel(): string {
  const now = new Date();
  const { year, month, day } = readParts(now);
  const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  if (key === cachedKey) return cachedLabel;
  cachedKey = key;
  cachedLabel = fullDateFormatter.format(now);
  return cachedLabel;
}

/** نص تاريخ يوم محدد بمفتاحه (يُستخدم في شاشة التحديات) */
export function formatFullArabicDate(key: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return "";
  try {
    return fullDateFormatter.format(new Date(`${key}T00:00:00Z`));
  } catch {
    return "";
  }
}

/* ============================================================
   الاشتراك — مؤقت واحد مشترك لكل المستمعين، يتجدد عند منتصف الليل
   ============================================================ */

const listeners = new Set<() => void>();
let midnightTimer: ReturnType<typeof setTimeout> | null = null;

/** الرياض UTC+3 ثابت (لا توقيت صيفي) — منتصف الليل = 21:00 UTC في اليوم السابق */
function scheduleNextMidnight(): void {
  if (midnightTimer || listeners.size === 0) return;
  const now = new Date();
  const { year, month, day } = readParts(now);
  const nextMidnight = Date.UTC(year, month - 1, day + 1, -3, 0, 0, 80);
  const delay = Math.max(1000, nextMidnight - now.getTime());
  midnightTimer = setTimeout(() => {
    midnightTimer = null;
    /* حدّث الذاكرة قبل إشعار React حتى تكون اللقطة الجديدة جاهزة */
    getRiyadhDateLabel();
    for (const listener of listeners) listener();
    scheduleNextMidnight();
  }, delay);
}

export function subscribeRiyadhDate(listener: () => void): () => void {
  listeners.add(listener);
  scheduleNextMidnight();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && midnightTimer) {
      clearTimeout(midnightTimer);
      midnightTimer = null;
    }
  };
}

/** لقطة الخادم — فارغة دائمًا: لا نص يُقارن فلا يمكن أن يحدث #418 */
export function getServerDateSnapshot(): "" {
  return "";
}

/** نص التاريخ للبطاقة الترحيبية */
export function useRiyadhDateLabel(): string {
  return useSyncExternalStore(
    subscribeRiyadhDate,
    getRiyadhDateLabel,
    getServerDateSnapshot,
  );
}

/** مفتاح اليوم للشاشات التي تحتاج YYYY-MM-DD بتوقيت الرياض */
export function useRiyadhDayKey(): string {
  return useSyncExternalStore(
    subscribeRiyadhDate,
    getRiyadhDayKey,
    getServerDateSnapshot,
  );
}
