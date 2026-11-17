"use client";

/**
 * صفحة الإعدادات — إعدادات المنصة الحية + بيانات اللعب المحلية
 * ================================================================
 * نموذج «إعدادات المنصة» يُقرأ ويُحفظ من قاعدة الإدارة (الاسم
 * والمكافآت والرصيد الافتتاحي وتكلفة التلميح ووضع الصيانة) —
 * مع قسم تصفير بيانات اللعب المحلية ومعلومات النظام كما هي.
 */

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  LogOut,
  RotateCcw,
  Save,
  Settings,
  SlidersHorizontal,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { resetPlayerData } from "@/lib/game/progress-store";
import { logAdminAction } from "@/lib/admin/audit-store";
import { AdminPageHeader } from "../shared/admin-page-header";
import type { AdminPlatformSettings } from "../admin-types";

interface AdminSettingsPageProps {
  onExit: () => void;
}

/** نموذج الإدخال — أرقام كنصوص لتحرير سلس */
interface SettingsForm {
  appName: string;
  dailyChallengeReward: string;
  startingCoins: string;
  defaultHintCost: string;
  maintenanceMode: boolean;
}

/** أسماء الحقول بالعربية — لرسائل السجل والتوست */
const FIELD_LABELS: Record<string, string> = {
  appName: "اسم المنصة",
  dailyChallengeReward: "مكافأة تحدي اليوم",
  startingCoins: "الرصيد الافتتاحي",
  defaultHintCost: "تكلفة التلميح",
  maintenanceMode: "وضع الصيانة",
};

const formFromSettings = (settings: AdminPlatformSettings): SettingsForm => ({
  appName: settings.appName,
  dailyChallengeReward: String(settings.dailyChallengeReward),
  startingCoins: String(settings.startingCoins),
  defaultHintCost: String(settings.defaultHintCost),
  maintenanceMode: settings.maintenanceMode,
});

/** تحقق عربي من صحة الإدخال قبل الحفظ */
function validateForm(form: SettingsForm): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = form.appName.trim();
  if (!name) errors.appName = "اسم المنصة مطلوب";
  else if (name.length > 40) {
    errors.appName = "الاسم طويل — ٤٠ حرفاً كحد أقصى";
  }

  if (!form.dailyChallengeReward.trim()) {
    errors.dailyChallengeReward = "المكافأة مطلوبة";
  } else {
    const reward = Number(form.dailyChallengeReward);
    if (!Number.isInteger(reward) || reward < 1 || reward > 500) {
      errors.dailyChallengeReward = "أدخل رقماً صحيحاً بين ١ و ٥٠٠";
    }
  }

  if (!form.startingCoins.trim()) {
    errors.startingCoins = "الرصيد الافتتاحي مطلوب";
  } else {
    const coins = Number(form.startingCoins);
    if (!Number.isInteger(coins) || coins < 0 || coins > 1000) {
      errors.startingCoins = "أدخل رقماً صحيحاً بين ٠ و ١٠٠٠";
    }
  }

  if (!form.defaultHintCost.trim()) {
    errors.defaultHintCost = "تكلفة التلميح مطلوبة";
  } else {
    const hintCost = Number(form.defaultHintCost);
    if (!Number.isInteger(hintCost) || hintCost < 0 || hintCost > 100) {
      errors.defaultHintCost = "أدخل رقماً صحيحاً بين ٠ و ١٠٠";
    }
  }

  return errors;
}

export function AdminSettingsPage({ onExit }: AdminSettingsPageProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminPlatformSettings | null>(null);
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* قراءة إعدادات المنصة من قاعدة الإدارة */
  const fetchSettings = useCallback(async (signal?: AbortSignal) => {
    setLoadError(false);
    try {
      const response = await fetch("/api/admin/settings", { signal });
      if (!response.ok) throw new Error("bad status");
      const data = (await response.json()) as {
        ok: boolean;
        settings?: AdminPlatformSettings;
      };
      if (!data.ok || !data.settings) throw new Error("bad payload");
      setSettings(data.settings);
      setForm(formFromSettings(data.settings));
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchSettings(controller.signal);
    return () => controller.abort();
  }, [fetchSettings]);

  const handleReset = () => {
    resetPlayerData();
    logAdminAction(
      "حذف",
      "بيانات اللعب",
      "تصفير التقدم والاقتصاد والأوسمة المحلية من الإعدادات",
    );
    toast({
      title: "صُفِّرت بيانات اللاعب",
      description: "التقدم والعملات والأوسمة المحلية عادت للصفر — والرصيد الافتتاحي رجع",
    });
  };

  /* حفظ القيم المتغيّرة فقط — PUT للإعدادات */
  const handleSave = async () => {
    if (!settings || !form) return;
    const validation = validateForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    /* الفرق بين النموذج والمحفوظ — لا نرفع ما لم يتغيّر */
    const changed: Record<string, string | number | boolean> = {};
    if (form.appName.trim() !== settings.appName) {
      changed.appName = form.appName.trim();
    }
    if (Number(form.dailyChallengeReward) !== settings.dailyChallengeReward) {
      changed.dailyChallengeReward = Number(form.dailyChallengeReward);
    }
    if (Number(form.startingCoins) !== settings.startingCoins) {
      changed.startingCoins = Number(form.startingCoins);
    }
    if (Number(form.defaultHintCost) !== settings.defaultHintCost) {
      changed.defaultHintCost = Number(form.defaultHintCost);
    }
    if (form.maintenanceMode !== settings.maintenanceMode) {
      changed.maintenanceMode = form.maintenanceMode;
    }

    if (Object.keys(changed).length === 0) {
      toast({
        title: "لا تغييرات للحفظ",
        description: "لم تُغيّر أي قيمة بعد",
      });
      return;
    }

    const changedLabels = Object.keys(changed)
      .map((key) => FIELD_LABELS[key] ?? key)
      .join("، ");

    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changed),
      });
      const data = (await response.json()) as {
        ok: boolean;
        settings?: AdminPlatformSettings;
        error?: string;
      };
      if (data.ok && data.settings) {
        setSettings(data.settings);
        setForm(formFromSettings(data.settings));
        setErrors({});
        logAdminAction(
          "تعديل",
          "إعدادات المنصة",
          `تحديث: ${changedLabels}`,
        );
        toast({
          title: "حُفظت الإعدادات",
          description: `تم تحديث: ${changedLabels}`,
        });
      } else {
        toast({
          title: "تعذّر الحفظ",
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="الإعدادات"
        description="إعدادات المنصة العامة وبيانات اللعب المحلية ومعلومات النظام"
      />

      {/* إعدادات المنصة — نموذج حي من قاعدة الإدارة */}
      <section
        className="rounded-2xl border border-heritage-900/5 bg-white p-5 shadow-card"
        aria-labelledby="settings-platform"
      >
        <h3
          id="settings-platform"
          className="flex items-center gap-2 font-heading text-sm font-extrabold text-heritage-900"
        >
          <SlidersHorizontal
            className="size-4 text-heritage-600"
            aria-hidden="true"
          />
          إعدادات المنصة
        </h3>
        <p className="mt-2 max-w-xl text-[11px] leading-relaxed text-muted-foreground">
          قيم عامة تُقرأها قاعدة الإدارة وتنعكس على تجربة اللاعبين — تُحفظ
          القيم المتغيّرة فقط عند الضغط على حفظ.
        </p>

        {form === null ? (
          /* فشل الجلب — خطأ ظاهر مع إعادة محاولة دون تصفير النموذج */
          loadError ? (
            <div className="mt-4 rounded-xl border border-flame-500/20 bg-flame-50/50 px-4 py-4 text-center">
              <p className="text-xs font-bold text-flame-600">
                تعذّر تحميل إعدادات المنصة
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                تحقّق من تشغيل خدمة الإدارة ثم أعد المحاولة
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchSettings()}
                className="mt-3"
              >
                إعادة المحاولة
              </Button>
            </div>
          ) : (
            /* هيكل تحميل النموذج */
            <div
              className="mt-4 space-y-3"
              aria-busy="true"
              aria-label="جارٍ التحميل"
            >
              <div className="h-9 animate-pulse rounded-xl bg-heritage-900/5" />
              <div className="grid gap-3 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-9 animate-pulse rounded-xl bg-heritage-900/5"
                  />
                ))}
              </div>
              <div className="h-14 animate-pulse rounded-xl bg-heritage-900/5" />
            </div>
          )
        ) : (
          <div className="mt-4 space-y-3.5">
            {/* اسم المنصة */}
            <div className="space-y-1.5">
              <Label htmlFor="platform-name" className="text-[11px]">
                اسم المنصة *
              </Label>
              <Input
                id="platform-name"
                value={form.appName}
                onChange={(event) => {
                  setForm((f) =>
                    f ? { ...f, appName: event.target.value } : f,
                  );
                  setErrors((e) => ({ ...e, appName: "" }));
                }}
                placeholder="ثقافتنا"
                className="h-9 text-xs"
              />
              {errors.appName ? (
                <p className="text-[10px] font-medium text-flame-600">
                  {errors.appName}
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  من ١ إلى ٤٠ حرفاً — يظهر في عناوين المنصة
                </p>
              )}
            </div>

            {/* الأرقام الثلاثة */}
            <div className="grid gap-3.5 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="daily-reward" className="text-[11px]">
                  مكافأة تحدي اليوم *
                </Label>
                <Input
                  id="daily-reward"
                  type="number"
                  min={1}
                  max={500}
                  value={form.dailyChallengeReward}
                  onChange={(event) => {
                    setForm((f) =>
                      f
                        ? {
                            ...f,
                            dailyChallengeReward: event.target.value,
                          }
                        : f,
                    );
                    setErrors((e) => ({ ...e, dailyChallengeReward: "" }));
                  }}
                  className="h-9 text-xs"
                />
                {errors.dailyChallengeReward && (
                  <p className="text-[10px] font-medium text-flame-600">
                    {errors.dailyChallengeReward}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="starting-coins" className="text-[11px]">
                  الرصيد الافتتاحي للعملات *
                </Label>
                <Input
                  id="starting-coins"
                  type="number"
                  min={0}
                  max={1000}
                  value={form.startingCoins}
                  onChange={(event) => {
                    setForm((f) =>
                      f ? { ...f, startingCoins: event.target.value } : f,
                    );
                    setErrors((e) => ({ ...e, startingCoins: "" }));
                  }}
                  className="h-9 text-xs"
                />
                {errors.startingCoins && (
                  <p className="text-[10px] font-medium text-flame-600">
                    {errors.startingCoins}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hint-cost" className="text-[11px]">
                  تكلفة التلميح الافتراضية *
                </Label>
                <Input
                  id="hint-cost"
                  type="number"
                  min={0}
                  max={100}
                  value={form.defaultHintCost}
                  onChange={(event) => {
                    setForm((f) =>
                      f ? { ...f, defaultHintCost: event.target.value } : f,
                    );
                    setErrors((e) => ({ ...e, defaultHintCost: "" }));
                  }}
                  className="h-9 text-xs"
                />
                {errors.defaultHintCost && (
                  <p className="text-[10px] font-medium text-flame-600">
                    {errors.defaultHintCost}
                  </p>
                )}
              </div>
            </div>

            {/* وضع الصيانة */}
            <div className="flex items-center justify-between gap-3 rounded-xl bg-sand px-4 py-3">
              <div className="min-w-0">
                <Label
                  htmlFor="maintenance-mode"
                  className="text-[11px] font-bold text-heritage-900"
                >
                  وضع الصيانة
                </Label>
                <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                  يُعرض تنبيه صيانة في تطبيق اللاعب عند التفعيل
                </p>
              </div>
              <Switch
                id="maintenance-mode"
                checked={form.maintenanceMode}
                onCheckedChange={(checked) =>
                  setForm((f) =>
                    f ? { ...f, maintenanceMode: checked } : f,
                  )
                }
                className="shrink-0"
              />
            </div>

            <Button
              size="sm"
              disabled={saving}
              onClick={() => void handleSave()}
              className="gap-1.5"
            >
              {saving ? (
                <Loader2
                  className="size-3.5 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Save className="size-3.5" aria-hidden="true" />
              )}
              {saving ? "جارٍ الحفظ…" : "حفظ الإعدادات"}
            </Button>
          </div>
        )}
      </section>

      {/* بيانات اللعب المحلية */}
      <section
        className="rounded-2xl border border-heritage-900/5 bg-white p-5 shadow-card"
        aria-labelledby="settings-data"
      >
        <h3
          id="settings-data"
          className="flex items-center gap-2 font-heading text-sm font-extrabold text-heritage-900"
        >
          <RotateCcw className="size-4 text-heritage-600" aria-hidden="true" />
          بيانات اللعب المحلية
        </h3>
        <p className="mt-2 max-w-xl text-[11px] leading-relaxed text-muted-foreground">
          تصفّر تقدم اللاعب على هذا الجهاز (النجوم والنقاط ورصيد العملات
          والأوسمة) ويعيد الرصيد الافتتاحي — مفيدة لاختبار تجربة لاعب
          جديد من الصفر. لا تمسّ محتوى المراحل في قاعدة الإدارة.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="mt-4 gap-1.5">
              <RotateCcw className="size-3.5" aria-hidden="true" />
              تصفير بيانات اللاعب
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تصفير بيانات اللاعب؟</AlertDialogTitle>
              <AlertDialogDescription>
                ستفقد كل النجوم والنقاط والعملات والأوسمة على هذا الجهاز —
                المحتوى الإداري لن يتأثر إطلاقاً.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReset}
                className="bg-flame-600 hover:bg-flame-700"
              >
                تصفير الآن
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      {/* معلومات النظام */}
      <section
        className="rounded-2xl border border-heritage-900/5 bg-white p-5 shadow-card"
        aria-labelledby="settings-system"
      >
        <h3
          id="settings-system"
          className="flex items-center gap-2 font-heading text-sm font-extrabold text-heritage-900"
        >
          <Settings className="size-4 text-heritage-600" aria-hidden="true" />
          معلومات النظام
        </h3>
        <dl className="mt-4 grid gap-2 text-[11px] sm:grid-cols-2">
          {[
            ["الإصدار", "1.0 — نسخة أولية"],
            ["الإطار", "Next.js 16 — App Router"],
            ["قاعدة البيانات", "Prisma + SQLite (لوحة الإدارة)"],
            ["المصدر", "قاعدة لوحة الإدارة = الحقيقة الوحيدة"],
          ].map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-xl bg-sand px-4 py-2.5"
            >
              <dt className="font-medium text-muted-foreground">{key}</dt>
              <dd className="font-bold text-heritage-900">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* العودة للتطبيق — نسخة بارزة للجوال أيضاً */}
      <Button
        variant="outline"
        onClick={onExit}
        className="w-full gap-2 lg:hidden"
      >
        <LogOut className="size-4" aria-hidden="true" />
        العودة إلى تطبيق اللاعب
      </Button>
    </div>
  );
}
