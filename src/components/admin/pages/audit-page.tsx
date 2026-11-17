"use client";

/**
 * صفحة سجل التدقيق — دائم من قاعدة الإدارة + فوري محلياً
 * =======================================================
 * كل إنشاء وتعديل وحذف من صفحات اللوحة يُرفع للقاعدة ويُقرأ
 * هنا — وعند أي عملية جديدة يُعاد الجلب بعد لحظة فيظهر القيد
 * الدائم فوراً، مع عدّادات تجميعية لكل نوع عملية.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Plus, ScrollText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "../shared/admin-page-header";
import { StatCard } from "../shared/stat-card";
import type { AdminAuditEntry } from "../admin-types";

/** ألوان شارة نوع العملية */
const ACTION_CLASSES: Record<string, string> = {
  إنشاء: "bg-emerald-100 text-emerald-700",
  تعديل: "bg-gold-100 text-gold-700",
  حذف: "bg-flame-100 text-flame-600",
};

export function AuditPage() {
  const [entries, setEntries] = useState<AdminAuditEntry[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  /** مؤقّت إعادة الجلب بعد الأحداث — يُمسح في التنظيف */
  const refetchTimer = useRef<number | null>(null);

  /* قراءة السجل الدائم من قاعدة الإدارة */
  const fetchAudit = useCallback(async (signal?: AbortSignal) => {
    setLoadError(false);
    try {
      const response = await fetch("/api/admin/audit", { signal });
      if (!response.ok) throw new Error("bad status");
      const data = (await response.json()) as {
        ok: boolean;
        entries?: AdminAuditEntry[];
      };
      if (!data.ok || !data.entries) throw new Error("bad payload");
      setEntries(data.entries);
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      setLoadError(true);
      setEntries((current) => current ?? []);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchAudit(controller.signal);
    return () => controller.abort();
  }, [fetchAudit]);

  /* أي عملية جديدة في اللوحة — إعادة جلب بعد ٦٠٠مللي ليلحق POST القاعدة */
  useEffect(() => {
    const refetch = () => {
      if (refetchTimer.current != null) {
        window.clearTimeout(refetchTimer.current);
      }
      refetchTimer.current = window.setTimeout(() => {
        refetchTimer.current = null;
        void fetchAudit();
      }, 600);
    };
    window.addEventListener("thaqafatna:admin-audit", refetch);
    return () => {
      window.removeEventListener("thaqafatna:admin-audit", refetch);
      if (refetchTimer.current != null) {
        window.clearTimeout(refetchTimer.current);
      }
    };
  }, [fetchAudit]);

  /* عدّادات تجميعية من القيود المعروضة */
  const createCount =
    entries?.filter((entry) => entry.action === "إنشاء").length ?? 0;
  const updateCount =
    entries?.filter((entry) => entry.action === "تعديل").length ?? 0;
  const deleteCount =
    entries?.filter((entry) => entry.action === "حذف").length ?? 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="سجل التدقيق"
        description="كل عمليات الإنشاء والتعديل والحذف في اللوحة — سجل دائم محفوظ في قاعدة الإدارة"
      />

      {entries === null ? (
        /* هيكل تحميل السجل */
        <div
          className="space-y-4"
          aria-busy="true"
          aria-label="جارٍ التحميل"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[74px] animate-pulse rounded-2xl bg-heritage-900/5"
              />
            ))}
          </div>
          <div className="h-40 animate-pulse rounded-2xl bg-heritage-900/5" />
        </div>
      ) : loadError && entries.length === 0 ? (
        /* فشل الجلب — خطأ ظاهر مع إعادة محاولة */
        <div className="rounded-2xl border border-flame-500/20 bg-white p-6 text-center shadow-card">
          <p className="text-xs font-bold text-flame-600">
            تعذّر تحميل سجل التدقيق
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            تحقّق من تشغيل خدمة الإدارة ثم أعد المحاولة
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchAudit()}
            className="mt-3"
          >
            إعادة المحاولة
          </Button>
        </div>
      ) : (
        <>
          {/* عدّادات تجميعية لكل نوع عملية */}
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              icon={Plus}
              value={createCount}
              label="عمليات إنشاء"
              tone="emerald"
            />
            <StatCard
              icon={Pencil}
              value={updateCount}
              label="عمليات تعديل"
              tone="gold"
            />
            <StatCard
              icon={Trash2}
              value={deleteCount}
              label="عمليات حذف"
              tone="flame"
            />
          </div>

          {entries.length === 0 ? (
            <div className="rounded-3xl border border-heritage-900/5 bg-white p-10 text-center shadow-card">
              <div
                className="mx-auto grid size-16 place-items-center rounded-3xl bg-heritage-100"
                aria-hidden="true"
              >
                <ScrollText className="size-7 text-heritage-700" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-extrabold text-heritage-900">
                لا أنشطة بعد
              </h3>
              <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
                جرّب تحرير مرحلة من محرر المراحل أو إضافة كتاب — ستظهر
                العملية هنا فور حفظها وتبقى في السجل الدائم
              </p>
            </div>
          ) : (
            <ol className="max-h-96 space-y-2.5 overflow-y-auto pe-1">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-heritage-900/5 bg-white p-4 shadow-card"
                >
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      ACTION_CLASSES[entry.action] ??
                      "bg-heritage-100 text-heritage-700"
                    }`}
                  >
                    {entry.action}
                  </span>
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="text-xs font-bold text-heritage-900">
                      {entry.entity}
                      <span className="mx-1.5 text-muted-foreground/50">
                        —
                      </span>
                      <span className="font-medium text-heritage-900/80">
                        {entry.detail}
                      </span>
                    </p>
                  </div>
                  <time className="shrink-0 text-[10px] font-medium text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString("ar-EG", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
