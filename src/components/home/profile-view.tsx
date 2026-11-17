"use client";

/**
 * تبويب حسابي — ملف اللاعب الحقيقي
 * ====================================
 * كل الأرقام من مخزن اللاعب المحلي (التقدم والاقتصاد والأوسمة):
 * بطاقة اللاعب (باسم قابل للتحرير ومزامن) + إحصاءات سريعة +
 * خزانة الأوسمة كاملة + تواصل معنا (نموذج إلى /api/support) +
 * ردود الفريق على رسائل هذا الجهاز + سجل المراحل المكتملة +
 * إجراءات (لوحة الإدارة وتصفير التقدم).
 */

import { useCallback, useEffect, useState } from "react";
import {
  Coins,
  Flame,
  Headphones,
  MessageCircleHeart,
  Pencil,
  Send,
  Settings,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  UserRound,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BADGES } from "@/lib/game/badges";
import {
  resetPlayerData,
  useBadges,
  useCoins,
  useProgress,
} from "@/lib/game/progress-store";
import {
  DEFAULT_PLAYER_NAME,
  getDeviceId,
  getPlayerName,
  setPlayerName,
  syncPlayerProgress,
} from "@/lib/game/player-sync";

/** حدود نموذج التواصل */
const NAME_MAX = 24;
const SUBJECT_MAX = 120;
const BODY_MAX = 1000;

/** أنواع رسائل التواصل — مطابقة لعقد /api/support */
const SUPPORT_KINDS = [
  { value: "suggestion", label: "اقتراح" },
  { value: "bug", label: "إبلاغ عن مشكلة" },
  { value: "request", label: "طلب" },
  { value: "other", label: "أخرى" },
] as const;

type SupportKind = (typeof SUPPORT_KINDS)[number]["value"];

const KIND_LABELS: Record<string, string> = {
  suggestion: "اقتراح",
  bug: "إبلاغ عن مشكلة",
  request: "طلب",
  other: "أخرى",
};

/** رسالة تواصل كما ترد من GET /api/support */
interface SupportMessage {
  id: string;
  subject: string;
  body: string;
  kind: string;
  reply: string | null;
  status: string;
  createdAt: string;
}

/** تنسيق تاريخ مختصر */
function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "long",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** تنسيق تاريخ كامل بالعربية — لرسائل التواصل */
function formatFullDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function ProfileView({ onOpenAdmin }: { onOpenAdmin: () => void }) {
  const { toast } = useToast();
  const progress = useProgress();
  const coins = useCoins();
  const badges = useBadges();
  const [resetOpen, setResetOpen] = useState(false);

  /* ===== اسم اللاعب — أمان الإرواء: ثابت أولاً ثم مزامنة ===== */
  const [playerName, setPlayerNameState] = useState(DEFAULT_PLAYER_NAME);
  const [nameOpen, setNameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  /* ===== نموذج التواصل وردود الفريق ===== */
  const [supportOpen, setSupportOpen] = useState(false);
  const [kind, setKind] = useState<SupportKind>("suggestion");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[] | null>(null);

  const entries = Object.entries(progress);
  const completed = entries.filter(([, entry]) => entry.stars > 0);
  const totalStars = completed.reduce(
    (sum, [, entry]) => sum + entry.stars,
    0,
  );
  const totalPoints = completed.reduce(
    (sum, [, entry]) => sum + entry.bestPoints,
    0,
  );

  /* ===== جلب رسائل هذا الجهاز وردودها — عند التحميل وبعد كل إرسال ===== */
  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/support?deviceId=${encodeURIComponent(getDeviceId())}`,
      );
      const data = (await response.json()) as {
        ok: boolean;
        messages?: SupportMessage[];
      };
      if (data.ok && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch {
      /* بلا اتصال — قسم الردود يظهر فقط عند توفر البيانات */
    }
  }, []);

  useEffect(() => {
    setPlayerNameState(getPlayerName());
    void loadMessages();
  }, [loadMessages]);

  /* الرسائل المُجابة — أساس قسم «ردود الفريق» */
  const repliedMessages = (messages ?? []).filter(
    (item) => typeof item.reply === "string" && item.reply.trim().length > 0,
  );
  const pendingCount =
    (messages ?? []).length - repliedMessages.length;

  const handleReset = () => {
    resetPlayerData();
    setResetOpen(false);
    toast({
      title: "صُفّرت بيانات اللعب",
      description: "بداية جديدة — الرصيد الافتتاحي ١٢٠ عملة",
    });
  };

  /** حفظ الاسم — محلياً ثم مزامنة الإحصاءات كاملة باسمك الجديد */
  const handleSaveName = () => {
    const clean = nameDraft.trim().slice(0, NAME_MAX);
    if (!clean) return;
    setPlayerName(clean);
    setPlayerNameState(clean);
    syncPlayerProgress({
      points: totalPoints,
      stars: totalStars,
      badgesCount: Object.keys(badges).length,
      coins,
      levelsCompleted: completed.length,
    });
    setNameOpen(false);
    toast({
      title: "حُفظ اسمك",
      description: "سيظهر اسمك في لوحة المتصدّرين بعد أول مزامنة",
    });
  };

  /** إرسال رسالة تواصل — POST /api/support بمعرّف الجهاز واسم المرسل */
  const handleSendSupport = async () => {
    const cleanSubject = subject.trim();
    const cleanBody = message.trim();
    if (!cleanSubject || !cleanBody) return;
    setSending(true);
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: getDeviceId(),
          senderName: getPlayerName(),
          kind,
          subject: cleanSubject,
          body: cleanBody,
        }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
      };
      if (data.ok) {
        toast({
          title: "وصلت رسالتك",
          description: "سيرد الفريق قريباً — تابع قسم «ردود الفريق»",
        });
        setSupportOpen(false);
        setSubject("");
        setMessage("");
        setKind("suggestion");
        void loadMessages();
      } else {
        toast({
          title: "تعذّر الإرسال",
          description: data.error ?? "حدث خطأ غير متوقع — حاول مرة أخرى",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "تعذّر الاتصال",
        description: "تحقق من الشبكة ثم أعد المحاولة",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="space-y-5 px-4 pb-32 pt-4">
      {/* بطاقة اللاعب — اسم قابل للتحرير */}
      <header className="overflow-hidden rounded-2xl bg-heritage-900 shadow-card">
        <div className="flex items-center gap-4 p-5">
          <span
            className="grid size-16 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-gold-400 to-gold-600 text-heritage-950 shadow-card"
            aria-hidden="true"
          >
            <UserRound className="size-8" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-heading text-lg font-extrabold text-white">
                {playerName}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setNameDraft(playerName);
                  setNameOpen(true);
                }}
                aria-label="تحرير الاسم"
                className="grid size-6.5 shrink-0 place-items-center rounded-lg bg-white/10 text-gold-400 transition-colors duration-150 hover:bg-white/20"
              >
                <Pencil className="size-3" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-0.5 text-[11px] font-medium text-heritage-100/60">
              حساب محلي على هذا الجهاز — يرتبط بحساب دائم مع نظام العضوية
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 rounded-full bg-gold-500/15 px-2.5 py-1 text-[10px] font-bold text-gold-400">
                <Sparkles className="size-3" aria-hidden="true" />
                {totalPoints.toLocaleString("ar-EG")} نقطة
              </span>
              <span className="flex items-center gap-1 rounded-full bg-gold-500/15 px-2.5 py-1 text-[10px] font-bold text-gold-400">
                <Star className="size-3" aria-hidden="true" />
                {totalStars.toLocaleString("ar-EG")} نجمة
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* الإحصاءات الأربع */}
      <section
        aria-label="إحصاءات اللعب"
        className="grid grid-cols-2 gap-2.5"
      >
        {[
          {
            icon: Trophy,
            value: completed.length,
            label: "مراحل مكتملة",
            classes: "bg-heritage-100 text-heritage-700",
          },
          {
            icon: Star,
            value: totalStars,
            label: "مجموع النجوم",
            classes: "bg-gold-100 text-gold-700",
          },
          {
            icon: Coins,
            value: coins,
            label: "رصيد العملات",
            classes: "bg-flame-100 text-flame-600",
          },
          {
            icon: Sparkles,
            value: Object.keys(badges).length,
            label: "أوسمة مفتوحة",
            classes: "bg-emerald-100 text-emerald-700",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card"
          >
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-xl ${stat.classes}`}
              aria-hidden="true"
            >
              <stat.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-lg font-extrabold leading-none text-heritage-900">
                {stat.value.toLocaleString("ar-EG")}
              </p>
              <p className="mt-1 truncate text-[10px] font-medium text-muted-foreground">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* خزانة الأوسمة — كاملة مع المقفلة */}
      <section aria-label="خزانة الأوسمة" className="space-y-3">
        <h3 className="flex items-center justify-between font-heading text-sm font-extrabold text-heritage-900">
          خزانة الأوسمة
          <span className="text-[10px] font-bold text-muted-foreground">
            {Object.keys(badges).length.toLocaleString("ar-EG")} من{" "}
            {BADGES.length.toLocaleString("ar-EG")}
          </span>
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {BADGES.map((badge) => {
            const unlockedAt = badges[badge.id];
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className={`flex items-center gap-3 rounded-2xl p-3 shadow-card ${
                  unlockedAt ? "bg-white" : "bg-white/55"
                }`}
                aria-label={
                  unlockedAt
                    ? `وسام ${badge.title} — فُتح ${formatDate(unlockedAt)}`
                    : `وسام ${badge.title} مقفل`
                }
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                    unlockedAt
                      ? badge.accentClass
                      : "bg-sand-darker/30 text-heritage-900/30"
                  }`}
                  aria-hidden="true"
                >
                  <Icon className="size-5" strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <p
                    className={`truncate font-heading text-[11px] font-extrabold ${
                      unlockedAt ? "text-heritage-900" : "text-heritage-900/40"
                    }`}
                  >
                    {badge.title}
                  </p>
                  <p className="mt-0.5 truncate text-[9.5px] font-medium text-muted-foreground/80">
                    {unlockedAt ? formatDate(unlockedAt) : badge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* تواصل معنا — قناة مباشرة إلى فريق التحرير */}
      <section aria-label="تواصل معنا" className="space-y-3">
        <h3 className="flex items-center justify-between font-heading text-sm font-extrabold text-heritage-900">
          تواصل معنا
          {pendingCount > 0 && (
            <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[9px] font-bold text-gold-700">
              {pendingCount.toLocaleString("ar-EG")} قيد المراجعة
            </span>
          )}
        </h3>
        <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-flame-100 text-flame-600"
            aria-hidden="true"
          >
            <MessageCircleHeart className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-heritage-900">
              اقتراح؟ مشكلة؟ طلب كتاب؟
            </p>
            <p className="mt-0.5 text-[10px] font-medium leading-relaxed text-muted-foreground">
              فريقنا يقرأ كل رسالة ويرد عليك هنا
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setSupportOpen(true)}
            className="shrink-0 gap-1.5"
          >
            <Send className="size-3.5" aria-hidden="true" />
            أرسل رسالة
          </Button>
        </div>
      </section>

      {/* ردود الفريق — تظهر فقط عند وجود رسائل مُجابة */}
      {repliedMessages.length > 0 && (
        <section aria-label="ردود الفريق" className="space-y-3">
          <h3 className="flex items-center justify-between font-heading text-sm font-extrabold text-heritage-900">
            ردود الفريق
            <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
              <Headphones className="size-3.5" aria-hidden="true" />
              {repliedMessages.length.toLocaleString("ar-EG")} ردود
            </span>
          </h3>
          <ul className="space-y-2.5">
            {repliedMessages.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl bg-white p-4 shadow-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-xs font-bold text-heritage-900">
                    {item.subject}
                  </p>
                  <span className="shrink-0 rounded-full bg-sand px-2 py-0.5 text-[9px] font-bold text-heritage-700">
                    {KIND_LABELS[item.kind] ?? "رسالة"}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                  {formatFullDate(item.createdAt)}
                </p>
                {/* فقاعة رد الفريق — ذهبية مميزة */}
                <div className="mt-2.5 rounded-xl border border-gold-500/30 bg-gold-100/40 p-3">
                  <p className="text-[9px] font-extrabold text-gold-700">
                    رد الفريق
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-heritage-900/85">
                    {item.reply}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* سجل المراحل المكتملة */}
      <section aria-label="سجل المراحل" className="space-y-3">
        <h3 className="flex items-center justify-between font-heading text-sm font-extrabold text-heritage-900">
          سجل المراحل
          <span className="text-[10px] font-bold text-muted-foreground">
            {completed.length.toLocaleString("ar-EG")} مكتملة
          </span>
        </h3>
        {completed.length > 0 ? (
          <ul className="space-y-2.5">
            {completed
              .sort(
                (a, b) =>
                  new Date(b[1].completedAt).getTime() -
                  new Date(a[1].completedAt).getTime(),
              )
              .map(([levelId, entry]) => (
                <li
                  key={levelId}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card"
                >
                  <span
                    className="flex shrink-0 gap-0.5"
                    role="img"
                    aria-label={`${entry.stars.toLocaleString("ar-EG")} من ٣ نجوم`}
                  >
                    {[1, 2, 3].map((star) => (
                      <Star
                        key={star}
                        className={`size-3.5 ${
                          star <= entry.stars
                            ? "fill-gold-500 text-gold-500"
                            : "fill-transparent text-heritage-900/20"
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-heritage-900">
                      {entry.chapterTitle ?? levelId}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                      {entry.bestPoints.toLocaleString("ar-EG")} نقطة —{" "}
                      {formatDate(entry.completedAt)}
                    </p>
                  </div>
                  {entry.difficulty === "hard" && (
                    <Flame
                      className="size-4 shrink-0 text-flame-500"
                      aria-label="مرحلة صعبة"
                    />
                  )}
                </li>
              ))}
          </ul>
        ) : (
          <div className="rounded-2xl bg-white/70 p-6 text-center shadow-card">
            <p className="text-xs font-medium leading-relaxed text-muted-foreground">
              لم تكمل أي مرحلة بعد — عد إلى الرئيسية وابدأ رحلتك من «بذور
              المعرفة»
            </p>
          </div>
        )}
      </section>

      {/* إجراءات الحساب */}
      <section aria-label="إجراءات" className="space-y-2.5">
        <button
          type="button"
          onClick={onOpenAdmin}
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-start shadow-card transition-all duration-150 hover:bg-sand-dark/30 active:scale-[0.99]"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-heritage-100 text-heritage-700">
            <Settings className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-heritage-900">
              لوحة التحكم الشاملة
            </span>
            <span className="mt-0.5 block text-[10px] font-medium text-muted-foreground">
              إدارة المحتوى والمكتبة والمجتمع — لفريق التحرير
            </span>
          </span>
        </button>

        <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-start shadow-card transition-all duration-150 hover:border-flame-500/30 active:scale-[0.99]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-flame-100 text-flame-600">
                <Trash2 className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-heritage-900">
                  تصفير بيانات اللعب
                </span>
                <span className="mt-0.5 block text-[10px] font-medium text-muted-foreground">
                  حذف التقدم والعملات والأوسمة من هذا الجهاز
                </span>
              </span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تصفير بيانات اللعب نهائياً؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيفقد هذا الجهاز كل التقدم ({completed.length.toLocaleString("ar-EG")}{" "}
                مراحل مكتملة) والرصيد ({coins.toLocaleString("ar-EG")} عملة)
                وكل الأوسمة — لا يمكن التراجع.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReset}
                className="bg-flame-600 hover:bg-flame-700"
              >
                تصفير نهائي
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      {/* نافذة تحرير الاسم — حتى ٢٤ حرفاً */}
      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader className="text-start">
            <DialogTitle className="font-heading text-heritage-900">
              تحرير اسمك
            </DialogTitle>
            <DialogDescription className="text-[11px]">
              يظهر اسمك في لوحة المتصدّرين — حتى{" "}
              {NAME_MAX.toLocaleString("ar-EG")} حرفاً
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="player-name" className="text-[11px]">
              الاسم
            </Label>
            <Input
              id="player-name"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              maxLength={NAME_MAX}
              placeholder="اسمك في المنصة"
              className="h-9 text-xs"
              autoComplete="off"
            />
            <p className="text-end text-[9px] font-medium text-muted-foreground">
              {nameDraft.length.toLocaleString("ar-EG")} /{" "}
              {NAME_MAX.toLocaleString("ar-EG")}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNameOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleSaveName}
              disabled={!nameDraft.trim()}
              className="gap-1.5"
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة رسالة إلى الفريق — نوع وموضوع ونص مع عدّاد */}
      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader className="text-start">
            <DialogTitle className="font-heading text-heritage-900">
              رسالة إلى الفريق
            </DialogTitle>
            <DialogDescription className="text-[11px]">
              اقتراح؟ مشكلة؟ طلب كتاب؟ فريقنا يقرأ كل رسالة
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5">
            {/* نوع الرسالة */}
            <div className="space-y-1.5">
              <Label className="text-[11px]">نوع الرسالة</Label>
              <Select
                value={kind}
                onValueChange={(value) => setKind(value as SupportKind)}
              >
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORT_KINDS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* الموضوع */}
            <div className="space-y-1.5">
              <Label htmlFor="support-subject" className="text-[11px]">
                الموضوع
              </Label>
              <Input
                id="support-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={SUBJECT_MAX}
                placeholder="خلاصة رسالتك في سطر واحد"
                className="h-9 text-xs"
              />
            </div>

            {/* نص الرسالة مع عدّاد الأحرف */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="support-body" className="text-[11px]">
                  الرسالة
                </Label>
                <span className="text-[9px] font-medium text-muted-foreground">
                  {message.length.toLocaleString("ar-EG")} /{" "}
                  {BODY_MAX.toLocaleString("ar-EG")}
                </span>
              </div>
              <Textarea
                id="support-body"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={BODY_MAX}
                rows={4}
                placeholder="اكتب رسالتك بتفصيل — كل التفاصيل تساعد الفريق"
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSupportOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleSendSupport}
              disabled={sending || !subject.trim() || !message.trim()}
              className="gap-1.5"
            >
              <Send className="size-3.5" aria-hidden="true" />
              {sending ? "جارٍ الإرسال…" : "إرسال"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
