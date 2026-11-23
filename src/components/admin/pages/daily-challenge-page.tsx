"use client";

/**
 * صفحة التحدي اليومي — سؤال واحد يوميًا
 * =======================================
 * تُدار من هنا ثلاثة أشياء فقط:
 *   1) بنك الأسئلة المؤهلة (نصي / اختيار متعدد — بلا إجابة تُرسل للمتصفح)
 *   2) تثبيت سؤال يوم بعينه أو تركه للاختيار الثابت التلقائي
 *   3) آخر جلسات اللاعبين (تدقيق خفيف)
 * كل تغيير يُدوَّن في سجل التدقيق عبر API الإدارة.
 */

import { useCallback, useEffect, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  CirclePause,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { puzzleTypeLabels } from "../admin-data";
import type {
  AdminDailyData,
  AdminDailyPuzzle,
} from "../admin-types";
import { AdminPageHeader } from "../shared/admin-page-header";
import { AdminLoading } from "../shared/admin-loading";

export function DailyChallengePage() {
  const { toast } = useToast();
  const [data, setData] = useState<AdminDailyData | null>(null);
  const [dateKey, setDateKey] = useState("");
  const [puzzleId, setPuzzleId] = useState("");
  const [rewardOverride, setRewardOverride] = useState("");
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [newPuzzleId, setNewPuzzleId] = useState("");
  const [removing, setRemoving] = useState<AdminDailyPuzzle | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/daily", {
        cache: "no-store",
      });
      const payload = (await response.json()) as AdminDailyData & {
        error?: string;
      };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "bad");
      setData(payload);
      setDateKey((current) => current || payload.dateKey);
    } catch {
      toast({
        title: "تعذّر تحميل التحدي اليومي",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  /** مزامنة نموذج اليوم عند تغيير التاريخ أو عودة البيانات */
  useEffect(() => {
    if (!data) return;
    const entry = data.schedule.find((item) => item.dateKey === dateKey);
    setPuzzleId(entry?.puzzleId ?? "");
    setRewardOverride(entry?.rewardOverride ? String(entry.rewardOverride) : "");
    setNote(entry?.note ?? "");
  }, [data, dateKey]);

  const send = async (body: Record<string, unknown>, success: string) => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        toast({
          title: "تعذّر الحفظ",
          description: payload.error ?? "خطأ غير متوقع",
          variant: "destructive",
        });
        return false;
      }
      toast({ title: success });
      await load();
      return true;
    } catch {
      toast({ title: "تعذّر الاتصال", variant: "destructive" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <AdminLoading />;

  const pinned = data.schedule.find((item) => item.dateKey === dateKey);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="تحدي اليوم"
        description="سؤال واحد يوميًا بتوقيت الرياض — بنك أسئلة آمن وجلسة موقّعة وتحقق سيرفري"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            className="gap-1.5"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            تحديث
          </Button>
        }
      />

      {/* ملخص البنك */}
      <div className="grid grid-cols-2 gap-3">
        {[
          ["أسئلة البنك", data.stats.bank],
          ["مفعّلة", data.stats.active],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-heritage-900/5 bg-white p-4 shadow-card"
          >
            <p className="text-[11px] font-medium text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 font-heading text-2xl font-extrabold text-heritage-900">
              {Number(value).toLocaleString("ar-EG")}
            </p>
          </div>
        ))}
      </div>

      {/* تثبيت سؤال اليوم */}
      <section
        className="rounded-2xl border border-heritage-900/5 bg-white p-5 shadow-card"
        aria-labelledby="daily-schedule"
      >
        <h3
          id="daily-schedule"
          className="flex items-center gap-2 font-heading text-sm font-extrabold text-heritage-900"
        >
          <CalendarCheck className="size-4 text-heritage-600" aria-hidden="true" />
          تثبيت سؤال اليوم
        </h3>
        <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
          اترك السؤال فارغًا ليُختار تلقائيًا وبثبات من البنك حسب التاريخ.
          الأسئلة النصية واختيار متعدد فقط — الإجابة الصحيحة لا تُرسل أبدًا إلى المتصفح.
        </p>

        <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="daily-date" className="text-[11px]">
              اليوم (توقيت الرياض)
            </Label>
            <Input
              id="daily-date"
              type="date"
              value={dateKey}
              onChange={(event) => setDateKey(event.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="daily-puzzle" className="text-[11px]">
              السؤال المثبّت
            </Label>
            <select
              id="daily-puzzle"
              value={puzzleId}
              onChange={(event) => setPuzzleId(event.target.value)}
              className="h-9 w-full rounded-xl border border-heritage-900/10 bg-white px-3 text-xs text-heritage-900"
            >
              <option value="">اختيار تلقائي من البنك</option>
              {data.bank.map((item) => (
                <option key={item.puzzleId} value={item.puzzleId}>
                  {item.clue?.slice(0, 70) ?? item.puzzleId}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="daily-reward" className="text-[11px]">
              مكافأة هذا اليوم (اختياري)
            </Label>
            <Input
              id="daily-reward"
              type="number"
              min={1}
              max={500}
              value={rewardOverride}
              onChange={(event) => setRewardOverride(event.target.value)}
              placeholder="من إعدادات المنصة"
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="daily-note" className="text-[11px]">
              ملاحظة داخلية (اختياري)
            </Label>
            <Input
              id="daily-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="مثال: سؤال ختامي للأسبوع الثقافي"
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={busy || !dateKey}
            onClick={() =>
              void send(
                {
                  action: "set-schedule",
                  dateKey,
                  puzzleId: puzzleId || null,
                  rewardOverride: rewardOverride || null,
                  note: note || null,
                },
                "حُفظ جدول اليوم",
              )
            }
            className="gap-1.5"
          >
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            حفظ التثبيت
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || !pinned}
            onClick={() =>
              void send(
                { action: "clear-schedule", dateKey },
                "أُزيل التثبيت — يعود الاختيار التلقائي",
              )
            }
          >
            إزالة التثبيت
          </Button>
        </div>

        {pinned && (
          <p className="mt-3 rounded-xl bg-sand px-3.5 py-2.5 text-[11px] font-medium text-heritage-800">
            مثبّت حاليًا: {pinned.clue ?? pinned.puzzleId ?? "اختيار تلقائي"}
            {pinned.rewardOverride ? ` — ${pinned.rewardOverride} عملة` : ""}
          </p>
        )}
      </section>

      {/* بنك الأسئلة */}
      <section
        className="rounded-2xl border border-heritage-900/5 bg-white p-5 shadow-card"
        aria-labelledby="daily-bank"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3
            id="daily-bank"
            className="font-heading text-sm font-extrabold text-heritage-900"
          >
            بنك الأسئلة
          </h3>
          <Button
            size="sm"
            disabled={data.candidates.length === 0}
            onClick={() => {
              setNewPuzzleId(data.candidates[0]?.puzzleId ?? "");
              setAdding(true);
            }}
            className="gap-1.5"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            إضافة سؤال
          </Button>
        </div>

        {data.bank.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-heritage-900/15 px-4 py-6 text-center text-[11px] leading-relaxed text-muted-foreground">
            البنك فارغ — أضف سؤالًا أعلاه، أو سيُستخدم احتياط مؤهل من مراحل اللعبة حتى تُجهّز البنك.
          </p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {data.bank.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl bg-sand px-3.5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-heritage-900">
                    {item.clue}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                    {item.puzzleType
                      ? (puzzleTypeLabels[item.puzzleType] ?? item.puzzleType)
                      : "—"}
                    {" • "}
                    {item.levelTitle}
                  </p>
                </div>
                {!item.active && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-heritage-900/5 px-2 py-1 text-[9px] font-bold text-muted-foreground">
                    <CirclePause className="size-3" aria-hidden="true" />
                    موقوف
                  </span>
                )}
                <Switch
                  checked={Boolean(item.active)}
                  onCheckedChange={() =>
                    void send(
                      { action: "toggle", bankId: item.id },
                      item.active ? "أُوقف السؤال" : "فُعّل السؤال",
                    )
                  }
                  aria-label={`تبديل حالة ${item.clue}`}
                  className="shrink-0"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRemoving(item)}
                  aria-label={`إزالة ${item.clue}`}
                  className="size-8 shrink-0 text-flame-600 hover:bg-flame-50"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* آخر الجلسات */}
      <section
        className="rounded-2xl border border-heritage-900/5 bg-white p-5 shadow-card"
        aria-labelledby="daily-sessions"
      >
        <h3
          id="daily-sessions"
          className="font-heading text-sm font-extrabold text-heritage-900"
        >
          آخر الجلسات
        </h3>
        {data.sessions.length === 0 ? (
          <p className="mt-3 text-[11px] text-muted-foreground">
            لا توجد جلسات بعد.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-heritage-900/5">
            {data.sessions.map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between gap-3 py-2 text-[11px]"
              >
                <span className="min-w-0 truncate font-medium text-heritage-800">
                  {session.dateKey} — {session.deviceId.slice(0, 18)}
                </span>
                <span className="shrink-0 font-bold text-muted-foreground">
                  {session.status === "correct" ? "مكتمل" : session.status}
                  {" • "}
                  {session.attempts} محاولة
                  {session.reward > 0 ? ` • +${session.reward}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* حوار إضافة سؤال */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent aria-describedby={undefined} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">إضافة سؤال إلى البنك</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="new-daily-puzzle" className="text-[11px]">
              اختر سؤالًا نصيًا أو اختيار متعدد
            </Label>
            <select
              id="new-daily-puzzle"
              value={newPuzzleId}
              onChange={(event) => setNewPuzzleId(event.target.value)}
              className="h-10 w-full rounded-xl border border-heritage-900/10 bg-white px-3 text-xs"
            >
              {data.candidates.map((item) => (
                <option key={item.puzzleId} value={item.puzzleId}>
                  [{item.puzzleType}] {item.clue?.slice(0, 60)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-start gap-2 pt-1">
            <Button
              disabled={busy || !newPuzzleId}
              onClick={async () => {
                const ok = await send(
                  { action: "add", puzzleId: newPuzzleId },
                  "أُضيف السؤال إلى البنك",
                );
                if (ok) setAdding(false);
              }}
              className="gap-1.5"
            >
              إضافة
            </Button>
            <Button variant="outline" onClick={() => setAdding(false)}>
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* تأكيد الإزالة */}
      <AlertDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إزالة السؤال من البنك؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيُوقف السؤال عن الظهور في اختيار تحدي اليوم تلقائيًا. اللغز نفسه
              وبقية بيانات اللعبة لا تتأثر.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-flame-600 hover:bg-flame-700"
              onClick={() => {
                if (removing) {
                  void send(
                    { action: "remove", bankId: removing.id },
                    "أُزيل السؤال من البنك",
                  );
                }
                setRemoving(null);
              }}
            >
              إزالة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
