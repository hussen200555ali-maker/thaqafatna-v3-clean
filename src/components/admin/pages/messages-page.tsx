"use client";

/**
 * صفحة الرسائل — صندوق وارد حقيقي من قاعدة الإدارة
 * ====================================================
 * رسائل اللاعبين (اقتراحات/إبلاغات/طلبات) تصل هنا مباشرة —
 * عدّادات بكل حالة وتصفية، وفتح أي رسالة يعرض تفاصيلها مع
 * ردّ الإشراف وإدارة الحالة والحذف — عبر /api/admin/messages.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  BadgeCheck,
  BookOpen,
  Bug,
  CheckCheck,
  Lightbulb,
  Mail,
  MailOpen,
  MessageSquare,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { logAdminAction } from "@/lib/admin/audit-store";
import { AdminPageHeader } from "../shared/admin-page-header";
import { StatCard } from "../shared/stat-card";
import { AdminLoading } from "../shared/admin-loading";
import type {
  AdminMessage,
  AdminMessageCounts,
} from "../admin-types";

type StatusFilter = "all" | "new" | "read" | "archived";
type MessageStatus = "new" | "read" | "archived";

const FILTERS: { id: StatusFilter; title: string }[] = [
  { id: "all", title: "الكل" },
  { id: "new", title: "جديد" },
  { id: "read", title: "مقروء" },
  { id: "archived", title: "مؤرشف" },
];

/** نوع الرسالة — التسمية واللون والأيقونة */
const KIND_META: Record<
  string,
  { label: string; classes: string; icon: typeof Lightbulb }
> = {
  suggestion: {
    label: "اقتراح",
    classes: "bg-heritage-100 text-heritage-700",
    icon: Lightbulb,
  },
  bug: {
    label: "إبلاغ عن مشكلة",
    classes: "bg-flame-100 text-flame-600",
    icon: Bug,
  },
  request: {
    label: "طلب",
    classes: "bg-gold-100 text-gold-700",
    icon: BookOpen,
  },
  other: {
    label: "أخرى",
    classes: "bg-heritage-100 text-heritage-600",
    icon: MessageSquare,
  },
};

/** حالة الرسالة — التسمية واللون */
const STATUS_META: Record<string, { label: string; classes: string }> = {
  new: { label: "جديد", classes: "bg-gold-100 text-gold-700" },
  read: { label: "مقروء", classes: "bg-heritage-100 text-heritage-700" },
  archived: {
    label: "مؤرشف",
    classes: "bg-emerald-100 text-emerald-700",
  },
};

/** مسافة زمنية عربية — قبل قليل / منذ ساعة / منذ ٣ ساعات / منذ يوم / تاريخ */
function relativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 60) return "قبل قليل";
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "منذ ساعة";
  if (hours === 2) return "منذ ساعتين";
  if (hours < 24) return `منذ ${hours.toLocaleString("ar-EG")} ساعات`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "منذ يوم";
  if (days === 2) return "منذ يومين";
  if (days < 30) return `منذ ${days.toLocaleString("ar-EG")} يوماً`;
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

export function MessagesPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<AdminMessage[] | null>(null);
  const [counts, setCounts] = useState<AdminMessageCounts | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");
  /** الرسالة المفتوحة في حوار التفاصيل — معرّفها فقط */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminMessage | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  /* قراءة صندوق الوارد من الخادم */
  const fetchMessages = useCallback(async (signal?: AbortSignal) => {
    setLoadError(false);
    try {
      const response = await fetch("/api/admin/messages", { signal });
      if (!response.ok) throw new Error("bad status");
      const data = (await response.json()) as {
        ok: boolean;
        messages?: AdminMessage[];
        counts?: AdminMessageCounts;
      };
      if (!data.ok || !data.messages || !data.counts) {
        throw new Error("bad payload");
      }
      setMessages(data.messages);
      setCounts(data.counts);
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      setLoadError(true);
      setMessages((current) => current ?? []);
      setCounts(
        (current) => current ?? { new: 0, read: 0, archived: 0 },
      );
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchMessages(controller.signal);
    return () => controller.abort();
  }, [fetchMessages]);

  /* الرسالة المفتوحة — تُشتق من القائمة فتبقى محدّثة بعد كل عملية */
  const selected = useMemo(
    () => messages?.find((message) => message.id === selectedId) ?? null,
    [messages, selectedId],
  );

  /* فتح رسالة — يملأ مسوّدة الرد بما سبق إن وُجد */
  const openMessage = (message: AdminMessage) => {
    setSelectedId(message.id);
    setReplyDraft(message.reply ?? "");
  };

  /* إرسال رد الإشراف — يجعل الرسالة مقروءة تلقائياً */
  const handleReply = async () => {
    if (!selected || !replyDraft.trim()) return;
    setBusyId(selected.id);
    try {
      const response = await fetch(
        `/api/admin/messages/${encodeURIComponent(selected.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reply: replyDraft.trim() }),
        },
      );
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        logAdminAction(
          "تعديل",
          "رسالة",
          `الرد على رسالة «${selected.subject}» من ${selected.senderName}`,
        );
        toast({ title: "أُرسل الرد", description: selected.subject });
        await fetchMessages();
      } else {
        toast({
          title: "تعذّر إرسال الرد",
          description: data.error ?? "خطأ غير متوقع",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "تعذّر الاتصال", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  /* تغيير حالة رسالة — مقروء/جديد/مؤرشف */
  const handleStatus = async (
    message: AdminMessage,
    status: MessageStatus,
  ) => {
    setBusyId(message.id);
    try {
      const response = await fetch(
        `/api/admin/messages/${encodeURIComponent(message.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        logAdminAction(
          "تعديل",
          "رسالة",
          `تغيير حالة «${message.subject}» إلى ${STATUS_META[status]?.label ?? status}`,
        );
        toast({
          title: "حُدِّثت حالة الرسالة",
          description: `أصبحت: ${STATUS_META[status]?.label ?? status}`,
        });
        await fetchMessages();
      } else {
        toast({
          title: "تعذّر التحديث",
          description: data.error ?? "خطأ غير متوقع",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "تعذّر الاتصال", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  /* حذف رسالة نهائياً */
  const handleDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      const response = await fetch(
        `/api/admin/messages/${encodeURIComponent(deleting.id)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        logAdminAction(
          "حذف",
          "رسالة",
          `حذف رسالة «${deleting.subject}» من ${deleting.senderName}`,
        );
        toast({ title: "حُذفت الرسالة", description: deleting.subject });
        setSelectedId(null);
        await fetchMessages();
      } else {
        toast({
          title: "تعذّر الحذف",
          description: data.error ?? "خطأ غير متوقع",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "تعذّر الاتصال", variant: "destructive" });
    } finally {
      setBusyId(null);
      setDeleting(null);
    }
  };

  /* تعليم كل الرسائل الجديدة كمقروءة — تتابعاً */
  const handleMarkAllRead = async () => {
    if (!messages) return;
    const newOnes = messages.filter((message) => message.status === "new");
    if (newOnes.length === 0) return;
    setMarkingAll(true);
    try {
      for (const message of newOnes) {
        await fetch(
          `/api/admin/messages/${encodeURIComponent(message.id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "read" }),
          },
        );
      }
      logAdminAction(
        "تعديل",
        "رسالة",
        `تعليم ${newOnes.length.toLocaleString("ar-EG")} رسالة جديدة كمقروءة`,
      );
      toast({
        title: "عُلِّمت الرسائل كمقروءة",
        description: `${newOnes.length.toLocaleString("ar-EG")} رسالة جديدة`,
      });
      await fetchMessages();
    } catch {
      toast({ title: "تعذّر تعليم الرسائل", variant: "destructive" });
    } finally {
      setMarkingAll(false);
    }
  };

  if (!messages) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="الرسائل"
          description="رسائل المستخدمين — اقتراحات وطلبات وإبلاغات عن أخطاء"
        />
        <AdminLoading />
      </div>
    );
  }

  const visible =
    filter === "all"
      ? messages
      : messages.filter((message) => message.status === filter);
  const newCount = counts?.new ?? 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="الرسائل"
        description="رسائل المستخدمين — اقتراحات وطلبات وإبلاغات عن أخطاء"
        actions={
          newCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              disabled={markingAll}
              onClick={() => void handleMarkAllRead()}
              className="gap-1.5"
            >
              <CheckCheck className="size-3.5" aria-hidden="true" />
              {markingAll ? "جارٍ التعليم…" : "تعليم الكل كمقروء"}
            </Button>
          ) : undefined
        }
      />

      {/* عدّادات الحالات الثلاث */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={Mail}
          value={counts?.new ?? 0}
          label="جديدة"
          tone="gold"
        />
        <StatCard
          icon={MailOpen}
          value={counts?.read ?? 0}
          label="مقروءة"
          tone="heritage"
        />
        <StatCard
          icon={Archive}
          value={counts?.archived ?? 0}
          label="مؤرشفة"
          tone="emerald"
        />
      </div>

      {/* فشل الجلب بلا بيانات — خطأ ظاهر مع إعادة محاولة */}
      {loadError && messages.length === 0 ? (
        <div className="rounded-2xl border border-flame-500/20 bg-white p-6 text-center shadow-card">
          <p className="text-xs font-bold text-flame-600">
            تعذّر تحميل صندوق الوارد
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            تحقّق من تشغيل خدمة الإدارة ثم أعد المحاولة
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchMessages()}
            className="mt-3"
          >
            إعادة المحاولة
          </Button>
        </div>
      ) : (
        <>
          {/* التصفية */}
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                aria-pressed={filter === item.id}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors duration-150 ${
                  filter === item.id
                    ? "bg-heritage-900 text-white shadow-card"
                    : "bg-white text-heritage-800 shadow-card hover:bg-sand-dark/40"
                }`}
              >
                {item.title}
                {item.id === "new" && newCount > 0 && (
                  <span className="ms-1.5 rounded-full bg-flame-500 px-1.5 text-[9px] font-bold leading-4 text-white">
                    {newCount.toLocaleString("ar-EG")}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* القائمة */}
          {visible.length > 0 ? (
            <ul className="max-h-96 space-y-3 overflow-y-auto pe-1">
              {visible.map((message) => {
                const kind = KIND_META[message.kind] ?? KIND_META.other;
                const KindIcon = kind.icon;
                const status =
                  STATUS_META[message.status] ??
                  ({ label: message.status, classes: "bg-heritage-100 text-heritage-700" } as const);
                const isUnread = message.status === "new";
                return (
                  <li key={message.id}>
                    <button
                      type="button"
                      onClick={() => openMessage(message)}
                      aria-haspopup="dialog"
                      className={`w-full rounded-2xl border p-4 text-start shadow-card transition-colors duration-150 ${
                        isUnread
                          ? "border-gold-500/30 bg-gold-100/30 hover:bg-gold-100/50"
                          : "border-heritage-900/5 bg-white hover:bg-sand/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                            isUnread
                              ? "bg-gold-100 text-gold-700"
                              : "bg-heritage-100 text-heritage-600"
                          }`}
                          aria-hidden="true"
                        >
                          <KindIcon className="size-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="truncate font-heading text-xs font-extrabold text-heritage-900">
                              {message.subject}
                            </h3>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${kind.classes}`}
                            >
                              {kind.label}
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${status.classes}`}
                            >
                              {status.label}
                            </span>
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-heritage-900/75">
                            {message.body}
                          </p>
                          <p className="mt-2 text-[10px] text-muted-foreground">
                            {message.senderName} • {relativeTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-3xl border border-heritage-900/5 bg-white p-10 text-center shadow-card">
              <div
                className="mx-auto grid size-16 place-items-center rounded-3xl bg-heritage-100"
                aria-hidden="true"
              >
                <MessageSquare className="size-7 text-heritage-700" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-extrabold text-heritage-900">
                {filter === "new"
                  ? "لا رسائل جديدة"
                  : filter === "read"
                    ? "لا رسائل مقروءة"
                    : filter === "archived"
                      ? "لا رسائل مؤرشفة"
                      : "لا رسائل بعد"}
              </h3>
              <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
                رسائل اللاعبين من صفحة «تواصل معنا» في التطبيق تصل هنا فور
                إرسالها
              </p>
            </div>
          )}
        </>
      )}

      {/* حوار تفاصيل الرسالة — قراءة ورد وحالة */}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <DialogContent aria-describedby={undefined} className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {selected?.subject}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-3.5">
              {/* المرسل والتاريخ والشارات */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(() => {
                  const kind = KIND_META[selected.kind] ?? KIND_META.other;
                  const status = STATUS_META[selected.status] ?? {
                    label: selected.status,
                    classes: "bg-heritage-100 text-heritage-700",
                  };
                  return (
                    <>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${kind.classes}`}
                      >
                        {kind.label}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${status.classes}`}
                      >
                        {status.label}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {selected.senderName} •{" "}
                        {new Date(selected.createdAt).toLocaleString(
                          "ar-EG",
                          {
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </>
                  );
                })()}
              </div>

              {/* نص الرسالة كاملاً */}
              <p className="whitespace-pre-wrap rounded-xl bg-sand px-4 py-3 text-xs leading-relaxed text-heritage-900/85">
                {selected.body}
              </p>

              {/* رد الإشراف السابق — إن وُجد */}
              {selected.reply && (
                <div className="rounded-2xl border border-emerald-600/20 bg-emerald-50 p-3.5">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
                    <BadgeCheck
                      className="size-3.5"
                      aria-hidden="true"
                    />
                    رد الإشراف
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-heritage-900/85">
                    {selected.reply}
                  </p>
                </div>
              )}

              {/* كتابة رد / تعديله */}
              <div className="space-y-1.5">
                <Label htmlFor="message-reply" className="text-[11px]">
                  اكتب رداً يظهر للمرسل في تطبيقه
                </Label>
                <Textarea
                  id="message-reply"
                  value={replyDraft}
                  onChange={(event) => setReplyDraft(event.target.value)}
                  rows={3}
                  placeholder="ردّك على المرسل..."
                  className="text-xs"
                />
              </div>

              {/* الإجراءات — الرد ثم الحالة ثم الحذف */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  disabled={busyId === selected.id || !replyDraft.trim()}
                  onClick={() => void handleReply()}
                  className="gap-1.5"
                >
                  <Send className="size-3.5" aria-hidden="true" />
                  إرسال الرد
                </Button>
                {selected.status === "new" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === selected.id}
                    onClick={() => void handleStatus(selected, "read")}
                  >
                    تعليم كمقروء
                  </Button>
                )}
                {selected.status !== "new" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === selected.id}
                    onClick={() => void handleStatus(selected, "new")}
                  >
                    إعادة كجديد
                  </Button>
                )}
                {selected.status !== "archived" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === selected.id}
                    onClick={() => void handleStatus(selected, "archived")}
                    className="gap-1.5"
                  >
                    <Archive className="size-3.5" aria-hidden="true" />
                    أرشفة
                  </Button>
                )}
                {selected.status === "archived" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === selected.id}
                    onClick={() => void handleStatus(selected, "read")}
                    className="gap-1.5"
                  >
                    <MailOpen className="size-3.5" aria-hidden="true" />
                    إلغاء الأرشفة
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={busyId === selected.id}
                  onClick={() => setDeleting(selected)}
                  aria-label={`حذف رسالة ${selected.subject}`}
                  className="gap-1.5"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* تأكيد حذف رسالة */}
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الرسالة نهائياً؟</AlertDialogTitle>
            <AlertDialogDescription>
              ستُحذف رسالة «{deleting?.subject}» من {deleting?.senderName} مع
              ردّها من قاعدة الإدارة — لا يمكن التراجع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-flame-600 hover:bg-flame-700"
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
