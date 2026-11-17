"use client";

/**
 * صفحة الأدوار والصلاحيات — مرجع الأدوار + فريق عمل حقيقي
 * ==========================================================
 * بطاقات الأدوار الثلاثة (مدير/محرر/مراقب) تبقى مرجع الصلاحيات،
 * وتحتها فريق العمل من قاعدة الإدارة: إضافة عضو وتغيير دوره
 * وتفعيله وتعطيله وحذفه — كلها عبر /api/admin/team.
 */

import { useCallback, useEffect, useState } from "react";
import { Eye, KeyRound, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { logAdminAction } from "@/lib/admin/audit-store";
import { AdminPageHeader } from "../shared/admin-page-header";
import type { AdminTeamMember } from "../admin-types";

/** دور توضيحي بصلاحياته — مرجع الصلاحيات أعلى الصفحة */
interface RoleCard {
  title: string;
  description: string;
  icon: typeof KeyRound;
  tone: string;
  permissions: string[];
}

const ROLES: RoleCard[] = [
  {
    title: "مدير النظام",
    description: "صلاحيات كاملة على اللوحة والمحتوى والنظام",
    icon: ShieldCheck,
    tone: "bg-gold-100 text-gold-700",
    permissions: [
      "إدارة الأدوار والصلاحيات",
      "سجل التدقيق والتقارير",
      "حذف المحتوى نهائياً",
      "كل صلاحيات المحرر والمراقب",
    ],
  },
  {
    title: "محرر المحتوى",
    description: "بناء المراحل والألغاز وإدارة المكتبة",
    icon: KeyRound,
    tone: "bg-heritage-100 text-heritage-700",
    permissions: [
      "محرر المراحل والألغاز",
      "إضافة وتحرير الكتب والتصنيفات",
      "مدقق الجودة وموازنة الصعوبة",
      "بلا وصول لإعدادات النظام",
    ],
  },
  {
    title: "مراقب",
    description: "قراءة فقط لمتابعة الجودة والتقارير",
    icon: Eye,
    tone: "bg-emerald-100 text-emerald-700",
    permissions: [
      "عرض كل الصفحات للقراءة",
      "مدقق الجودة والتقارير",
      "بلا أي عمليات كتابة",
      "مناسب لفرق المراجعة",
    ],
  },
];

/** أدوار الفريق — التسمية واللون */
const ROLE_META: Record<string, { label: string; classes: string }> = {
  admin: { label: "مدير النظام", classes: "bg-gold-100 text-gold-700" },
  editor: { label: "محرر المحتوى", classes: "bg-heritage-100 text-heritage-700" },
  viewer: { label: "مراقب", classes: "bg-emerald-100 text-emerald-700" },
};

const ROLE_OPTIONS = ["admin", "editor", "viewer"] as const;

/** نموذج عضو جديد */
interface MemberForm {
  name: string;
  email: string;
  role: string;
}

const EMPTY_FORM: MemberForm = { name: "", email: "", role: "editor" };

export function RolesPage() {
  const { toast } = useToast();
  const [members, setMembers] = useState<AdminTeamMember[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<MemberForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string }>(
    {},
  );
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminTeamMember | null>(null);

  /* قراءة فريق العمل من الخادم */
  const fetchTeam = useCallback(async (signal?: AbortSignal) => {
    setLoadError(false);
    try {
      const response = await fetch("/api/admin/team", { signal });
      if (!response.ok) throw new Error("bad status");
      const data = (await response.json()) as {
        ok: boolean;
        members?: AdminTeamMember[];
      };
      if (!data.ok || !data.members) throw new Error("bad payload");
      setMembers(data.members);
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      setLoadError(true);
      setMembers((current) => current ?? []);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchTeam(controller.signal);
    return () => controller.abort();
  }, [fetchTeam]);

  /* فتح حوار الإضافة — نموذج نظيف */
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setCreating(true);
  };

  /* إضافة عضو — مع التحقق من الاسم والبريد */
  const handleCreate = async () => {
    const errors: { name?: string; email?: string } = {};
    if (!form.name.trim()) errors.name = "الاسم مطلوب";
    else if (form.name.trim().length > 40) {
      errors.name = "الاسم طويل — ٤٠ حرفاً كحد أقصى";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "أدخل بريداً إلكترونياً صحيحاً";
    }
    setFormErrors(errors);
    if (errors.name || errors.email) return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
        }),
      });
      /* بريد مكرر — رسالة واضحة بدل الخطأ العام */
      if (response.status === 409) {
        toast({
          title: "البريد مستخدم مسبقاً",
          description: "هذا البريد مضاف لعضو آخر في الفريق",
          variant: "destructive",
        });
        return;
      }
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        logAdminAction(
          "إنشاء",
          "عضو فريق",
          `إضافة «${form.name.trim()}» بدور ${ROLE_META[form.role]?.label ?? form.role}`,
        );
        toast({
          title: "أُضيف العضو",
          description: `${form.name.trim()} — ${ROLE_META[form.role]?.label ?? ""}`,
        });
        setCreating(false);
        await fetchTeam();
      } else {
        toast({
          title: "تعذّر الإضافة",
          description: data.error ?? "خطأ غير متوقع",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "تعذّر الاتصال", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  /* تغيير دور عضو */
  const handleRole = async (member: AdminTeamMember, role: string) => {
    setBusyId(member.id);
    try {
      const response = await fetch(
        `/api/admin/team/${encodeURIComponent(member.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        },
      );
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        logAdminAction(
          "تعديل",
          "عضو فريق",
          `تغيير دور «${member.name}» إلى ${ROLE_META[role]?.label ?? role}`,
        );
        toast({
          title: "حُدِّث الدور",
          description: `${member.name} — ${ROLE_META[role]?.label ?? role}`,
        });
        await fetchTeam();
      } else {
        toast({
          title: "تعذّر التحديث",
          description: data.error ?? "خطأ غير متوقع",
          variant: "destructive",
        });
        await fetchTeam();
      }
    } catch {
      toast({ title: "تعذّر الاتصال", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  /* تفعيل/تعطيل عضو */
  const handleToggleActive = async (member: AdminTeamMember) => {
    setBusyId(member.id);
    try {
      const response = await fetch(
        `/api/admin/team/${encodeURIComponent(member.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !member.active }),
        },
      );
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        logAdminAction(
          "تعديل",
          "عضو فريق",
          `${member.active ? "تعطيل" : "تفعيل"} عضو الفريق «${member.name}»`,
        );
        toast({
          title: member.active ? "عُطِّل العضو" : "فُعِّل العضو",
          description: member.name,
        });
        await fetchTeam();
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

  /* حذف عضو نهائياً */
  const handleDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      const response = await fetch(
        `/api/admin/team/${encodeURIComponent(deleting.id)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        logAdminAction(
          "حذف",
          "عضو فريق",
          `حذف «${deleting.name}» من فريق العمل`,
        );
        toast({ title: "حُذف العضو", description: deleting.name });
        await fetchTeam();
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

  /** تاريخ الانضمام بالعربية */
  const formatJoinDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("ar-EG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(iso));
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="الأدوار والصلاحيات"
        description="مرجع أدوار الفريق وصلاحيات كل دور — وإدارة أعضاء فريق العمل في قاعدة الإدارة"
        actions={
          <Button
            size="sm"
            onClick={openCreate}
            className="gap-1.5"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            إضافة عضو
          </Button>
        }
      />

      {/* بطاقات الأدوار — مرجع الصلاحيات */}
      <div className="grid gap-4 lg:grid-cols-3">
        {ROLES.map((role) => (
          <section
            key={role.title}
            className="rounded-2xl border border-heritage-900/5 bg-white p-5 shadow-card"
            aria-label={`دور ${role.title}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${role.tone}`}
                aria-hidden="true"
              >
                <role.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-heading text-sm font-extrabold text-heritage-900">
                  {role.title}
                </h3>
                <p className="truncate text-[10px] text-muted-foreground">
                  {role.description}
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5">
              {role.permissions.map((permission) => (
                <li
                  key={permission}
                  className="rounded-lg bg-sand px-3 py-2 text-[11px] font-medium text-heritage-900"
                >
                  {permission}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* فريق العمل — من قاعدة الإدارة */}
      <section aria-labelledby="team-section" className="space-y-3">
        <div>
          <h3
            id="team-section"
            className="font-heading text-sm font-extrabold text-heritage-900"
          >
            فريق العمل
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            أعضاء الفريق المسجّلون في قاعدة الإدارة — غيّر الدور أو فعّل العضو
            أو احذفه
          </p>
        </div>

        {members === null ? (
          /* هيكل تحميل الفريق */
          <div
            className="space-y-2.5"
            aria-busy="true"
            aria-label="جارٍ التحميل"
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-heritage-900/5"
              />
            ))}
          </div>
        ) : loadError && members.length === 0 ? (
          /* فشل الجلب — خطأ ظاهر مع إعادة محاولة */
          <div className="rounded-2xl border border-flame-500/20 bg-white p-6 text-center shadow-card">
            <p className="text-xs font-bold text-flame-600">
              تعذّر تحميل فريق العمل
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              تحقّق من تشغيل خدمة الإدارة ثم أعد المحاولة
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchTeam()}
              className="mt-3"
            >
              إعادة المحاولة
            </Button>
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-2xl border border-heritage-900/5 bg-white p-8 text-center shadow-card">
            <ShieldCheck
              className="mx-auto size-7 text-muted-foreground/40"
              aria-hidden="true"
            />
            <p className="mt-3 font-heading text-sm font-bold text-heritage-900">
              لا أعضاء بعد
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              أضف أول عضو بزر «إضافة عضو» — سيظهر هنا فوراً بدوره وحالته
            </p>
          </div>
        ) : (
          <ul className="max-h-96 space-y-2.5 overflow-y-auto pe-1">
            {members.map((member) => {
              const role =
                ROLE_META[member.role] ?? {
                  label: member.role,
                  classes: "bg-heritage-100 text-heritage-700",
                };
              return (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-heritage-900/5 bg-white p-4 shadow-card"
                >
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-gold-400 to-gold-600 font-heading text-xs font-extrabold text-heritage-950">
                      {member.name.trim().charAt(0) || "؟"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 basis-44">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-xs font-bold text-heritage-900">
                        {member.name}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${role.classes}`}
                      >
                        {role.label}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          member.active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-flame-100 text-flame-600"
                        }`}
                      >
                        {member.active ? "نشط" : "معطّل"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[10px] text-muted-foreground">
                      {member.email}
                      <span
                        className="mx-1 text-muted-foreground/40"
                        aria-hidden="true"
                      >
                        •
                      </span>
                      انضم {formatJoinDate(member.createdAt)}
                    </p>
                  </div>

                  {/* تغيير الدور — اختيار مدمج داخل الصف */}
                  <Select
                    value={member.role}
                    onValueChange={(value) => void handleRole(member, value)}
                    disabled={busyId === member.id}
                  >
                    <SelectTrigger
                      className="h-8 w-36 shrink-0 text-[11px]"
                      aria-label={`دور ${member.name}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {ROLE_META[option]?.label ?? option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* تفعيل/تعطيل */}
                  <Switch
                    checked={member.active}
                    disabled={busyId === member.id}
                    onCheckedChange={() => void handleToggleActive(member)}
                    aria-label={
                      member.active
                        ? `تعطيل ${member.name}`
                        : `تفعيل ${member.name}`
                    }
                    className="shrink-0"
                  />

                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={busyId === member.id}
                    onClick={() => setDeleting(member)}
                    aria-label={`حذف ${member.name}`}
                    className="shrink-0"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* حوار إضافة عضو */}
      <Dialog
        open={creating}
        onOpenChange={(open) => !open && setCreating(false)}
      >
        <DialogContent aria-describedby={undefined} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">إضافة عضو فريق</DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="member-name" className="text-[11px]">
                الاسم *
              </Label>
              <Input
                id="member-name"
                value={form.name}
                onChange={(event) => {
                  setForm((f) => ({ ...f, name: event.target.value }));
                  setFormErrors((e) => ({ ...e, name: undefined }));
                }}
                placeholder="مثال: سارة الأدبية"
                className="h-9 text-xs"
              />
              {formErrors.name && (
                <p className="text-[10px] font-medium text-flame-600">
                  {formErrors.name}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-email" className="text-[11px]">
                البريد الإلكتروني *
              </Label>
              <Input
                id="member-email"
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(event) => {
                  setForm((f) => ({ ...f, email: event.target.value }));
                  setFormErrors((e) => ({ ...e, email: undefined }));
                }}
                placeholder="member@thaqafatna.app"
                className="h-9 text-xs"
              />
              {formErrors.email && (
                <p className="text-[10px] font-medium text-flame-600">
                  {formErrors.email}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">الدور</Label>
              <Select
                value={form.role}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, role: value }))
                }
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {ROLE_META[option]?.label ?? option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                صلاحيات كل دور موضّحة في بطاقات الأدوار أعلى الصفحة
              </p>
            </div>
          </div>
          <div className="flex justify-start gap-2 pt-1">
            <Button
              onClick={() => void handleCreate()}
              disabled={saving}
              className="gap-1.5"
            >
              {saving ? "جارٍ الإضافة…" : "إضافة العضو"}
            </Button>
            <Button variant="outline" onClick={() => setCreating(false)}>
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* تأكيد حذف عضو */}
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف «{deleting?.name}» من الفريق؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيُحذف عضو الفريق ({deleting?.email}) من قاعدة الإدارة نهائياً —
              لا يمكن التراجع.
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
