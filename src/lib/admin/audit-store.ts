"use client";

/**
 * سجل تدقيق الإدارة (Admin Audit Store)
 * ========================================
 * سجل حيّ لعمليات هذه الجلسة: كل إنشاء وتعديل وحذف يمرّ من
 * هنا فتظهر فوراً في صفحة «سجل التدقيق» — بنفس نمط مخزن
 * اللاعب (حدث مخصص + نوّاب React بلا مكتبات خارجية).
 *
 * كل عملية تُرفع أيضاً إلى سجل قاعدة الإدارة الدائم
 * (POST /api/admin/audit — إطلاق ونسيان) فتبقى بعد إغلاق
 * الجلسة، وتقرؤها الصفحة من GET نفسه مع دمج الفوري المحلي.
 */

import { useEffect, useState } from "react";

/** حدث التحديث — يُبثّ عند كل عملية جديدة */
const AUDIT_EVENT = "thaqafatna:admin-audit";

/** نوع العملية */
export type AuditAction = "إنشاء" | "تعديل" | "حذف";

/** قيد سجل واحد */
export interface AuditEntry {
  id: number;
  /** وقت العملية بصيغة ISO */
  time: string;
  action: AuditAction;
  /** الكيان المتأثر: كتاب / تصنيف / مرحلة / لغز / فصل كتاب */
  entity: string;
  /** وصف قصير يظهر في السجل */
  detail: string;
}

/** السجل في الذاكرة — الأحدث أولاً (حد 100 قيد) */
let entries: AuditEntry[] = [];
let nextId = 1;

/** تسجيل عملية جديدة في السجل المحلي + رفعها للسجل الدائم */
export function logAdminAction(
  action: AuditAction,
  entity: string,
  detail: string,
) {
  entries = [
    {
      id: nextId,
      time: new Date().toISOString(),
      action,
      entity,
      detail,
    },
    ...entries,
  ].slice(0, 100);
  nextId += 1;
  window.dispatchEvent(new Event(AUDIT_EVENT));

  /* السجل الدائم — إطلاق ونسيان: فشل الرفع لا يعطّل العملية */
  void fetch("/api/admin/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, entity, detail }),
  }).catch(() => {
    /* بلا اتصال — النسخة المحلية تكفي لهذه الجلسة */
  });
}

/** نائب يتابع السجل ويتحدّث مع كل عملية جديدة */
export function useAuditLog(): AuditEntry[] {
  const [state, setState] = useState<AuditEntry[]>(entries);
  useEffect(() => {
    const update = () => setState([...entries]);
    window.addEventListener(AUDIT_EVENT, update);
    return () => window.removeEventListener(AUDIT_EVENT, update);
  }, []);
  return state;
}
