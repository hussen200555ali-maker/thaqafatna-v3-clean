"use client";

/**
 * صفحة اللاعبين والقرّاء — اللاعب المحلي + شبكة حية من القاعدة
 * =================================================================
 * بطاقة اللاعب الحالي من مخزن التقدم المحلي كما هي، وتحتها إحصاءات
 * شبكة اللاعبين وقائمتهم من قاعدة الإدارة (مرتّبة نقاطاً تنازلياً)
 * مع بحث بالاسم وحذف بتأكيد — كل شيء عبر /api/admin/players.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Coins,
  Crown,
  Feather,
  Search,
  Star,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { logAdminAction } from "@/lib/admin/audit-store";
import { getDeviceId } from "@/lib/game/player-sync";
import {
  useBadges,
  useCoins,
  useProgress,
} from "@/lib/game/progress-store";
import { AdminPageHeader } from "../shared/admin-page-header";
import { StatCard } from "../shared/stat-card";
import type { AdminPlayer } from "../admin-types";

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

export function PlayersPage() {
  const { toast } = useToast();
  const progress = useProgress();
  const coins = useCoins();
  const badges = useBadges();

  const [players, setPlayers] = useState<AdminPlayer[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  /** معرّف هذا الجهاز — لتمييز صف اللاعب الحالي (يُجلب بعد التحميل) */
  const [deviceId, setDeviceId] = useState("");
  const [deleting, setDeleting] = useState<AdminPlayer | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  /* معرّف الجهاز من التخزين المحلي — بعد الترطيب لتفادي اختلاف الخادم */
  useEffect(() => {
    setDeviceId(getDeviceId());
  }, []);

  /* قراءة شبكة اللاعبين من قاعدة الإدارة */
  const fetchPlayers = useCallback(async (signal?: AbortSignal) => {
    setLoadError(false);
    try {
      const response = await fetch("/api/admin/players", { signal });
      if (!response.ok) throw new Error("bad status");
      const data = (await response.json()) as {
        ok: boolean;
        players?: AdminPlayer[];
      };
      if (!data.ok || !data.players) throw new Error("bad payload");
      setPlayers(data.players);
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      setLoadError(true);
      setPlayers((current) => current ?? []);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchPlayers(controller.signal);
    return () => controller.abort();
  }, [fetchPlayers]);

  /* حذف لاعب من الشبكة — بتأكيد */
  const handleDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      const response = await fetch(
        `/api/admin/players/${encodeURIComponent(deleting.id)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        logAdminAction(
          "حذف",
          "لاعب",
          `حذف اللاعب «${deleting.name}» من شبكة اللاعبين`,
        );
        toast({ title: "حُذف اللاعب", description: deleting.name });
        await fetchPlayers();
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

  /* إحصاءات اللاعب المحلي — من مخزن التقدم */
  const completed = useMemo(
    () =>
      Object.entries(progress).filter(([, entry]) => entry.stars > 0),
    [progress],
  );
  const totalPoints = useMemo(
    () =>
      Object.values(progress).reduce(
        (sum, entry) => sum + entry.bestPoints,
        0,
      ),
    [progress],
  );
  const totalStars = useMemo(
    () =>
      Object.values(progress).reduce((sum, entry) => sum + entry.stars, 0),
    [progress],
  );

  /* إحصاءات الشبكة — من قائمة اللاعبين (مرتّبة نقاطاً تنازلياً) */
  const networkCount = players?.length ?? 0;
  const networkPoints =
    players?.reduce((sum, player) => sum + player.points, 0) ?? 0;
  const topPlayer = players?.[0];
  const averageStars =
    networkCount > 0
      ? (
          players?.reduce((sum, player) => sum + player.stars, 0) ?? 0
        ) / networkCount
      : 0;

  /* البحث المحلي بالاسم */
  const trimmedQuery = query.trim();
  const visible = useMemo(() => {
    if (!players) return [];
    if (!trimmedQuery) return players;
    return players.filter((player) => player.name.includes(trimmedQuery));
  }, [players, trimmedQuery]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="اللاعبون والقرّاء"
        description="نشاط اللاعبين والقرّاء — بيانات هذا الجهاز محلياً، وشبكة اللاعبين مباشرة من قاعدة الإدارة"
      />

      {/* اللاعب المحلي — بيانات حقيقية من مخزن التقدم */}
      <section
        className="rounded-2xl border border-heritage-900/5 bg-white p-5 shadow-card"
        aria-labelledby="local-player"
      >
        <div className="flex items-center gap-3">
          <div
            className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600"
            aria-hidden="true"
          >
            <Feather className="size-5 text-heritage-950" />
          </div>
          <div>
            <h3
              id="local-player"
              className="font-heading text-sm font-extrabold text-heritage-900"
            >
              اللاعب الحالي — هذا الجهاز
            </h3>
            <p className="text-[11px] text-muted-foreground">
              بيانات حية من مخزن التقدم المحلي
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={Trophy}
            value={totalPoints}
            label="مجموع النقاط"
            tone="gold"
          />
          <StatCard icon={Coins} value={coins} label="رصيد العملات" tone="gold" />
          <StatCard
            icon={Star}
            value={totalStars}
            label="نجوم مجموعها"
            tone="heritage"
          />
          <StatCard
            icon={Feather}
            value={Object.keys(badges).length}
            label="وساماً مفتوحاً"
            tone="heritage"
          />
        </div>

        {completed.length > 0 && (
          <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {completed.map(([levelId, entry]) => (
              <li
                key={levelId}
                className="flex items-center justify-between gap-3 rounded-xl bg-sand px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-heritage-900">
                    {entry.chapterTitle ?? levelId}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    أفضل نقاط: {entry.bestPoints.toLocaleString("ar-EG")} —
                    تلميحات: {entry.hintsUsed.toLocaleString("ar-EG")}
                  </p>
                </div>
                <span
                  className="shrink-0 font-heading text-xs font-bold text-gold-600"
                  aria-label={`${entry.stars} من 3 نجوم`}
                >
                  {"★".repeat(entry.stars)}
                  <span className="text-heritage-900/20">
                    {"★".repeat(3 - entry.stars)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* شبكة اللاعبين — من قاعدة الإدارة */}
      <section aria-labelledby="network-players" className="space-y-3">
        <div>
          <h3
            id="network-players"
            className="font-heading text-sm font-extrabold text-heritage-900"
          >
            شبكة اللاعبين
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            اللاعبون الذين زامنوا تقدمهم إلى قاعدة الإدارة — مرتّبون بالنقاط
            تنازلياً
          </p>
        </div>

        {players === null ? (
          /* هيكل تحميل الشبكة */
          <div className="space-y-3" aria-busy="true" aria-label="جارٍ التحميل">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[74px] animate-pulse rounded-2xl bg-heritage-900/5"
                />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-heritage-900/5" />
          </div>
        ) : loadError && networkCount === 0 ? (
          /* فشل الجلب — خطأ ظاهر مع إعادة محاولة */
          <div className="rounded-2xl border border-flame-500/20 bg-white p-6 text-center shadow-card">
            <p className="text-xs font-bold text-flame-600">
              تعذّر تحميل شبكة اللاعبين
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              تحقّق من تشغيل خدمة الإدارة ثم أعد المحاولة
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchPlayers()}
              className="mt-3"
            >
              إعادة المحاولة
            </Button>
          </div>
        ) : (
          <>
            {/* إحصاءات الشبكة */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Users}
                value={networkCount}
                label="إجمالي اللاعبين"
                tone="heritage"
              />
              <StatCard
                icon={Trophy}
                value={networkPoints}
                label="مجموع النقاط"
                tone="gold"
              />
              <StatCard
                icon={Crown}
                value={topPlayer?.name ?? "—"}
                label="أعلى لاعب"
                tone="gold"
              />
              <StatCard
                icon={Star}
                value={averageStars.toLocaleString("ar-EG", {
                  maximumFractionDigits: 1,
                })}
                label="متوسط النجوم"
                tone="heritage"
              />
            </div>

            {/* بحث محلي بالاسم */}
            <div className="relative max-w-sm">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحث باسم اللاعب..."
                className="h-9 pl-8 text-xs"
              />
              <Search
                className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
            </div>

            {/* قائمة اللاعبين — قائمة طويلة قابلة للتمرير */}
            {networkCount === 0 ? (
              <div className="rounded-2xl border border-heritage-900/5 bg-white p-8 text-center shadow-card">
                <Users
                  className="mx-auto size-7 text-muted-foreground/40"
                  aria-hidden="true"
                />
                <p className="mt-3 font-heading text-sm font-bold text-heritage-900">
                  لا لاعبين في الشبكة بعد
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  بمجرد لعب أي جهاز ومزامنة تقدمه سيظهر هنا فوراً
                </p>
              </div>
            ) : visible.length === 0 ? (
              <div className="rounded-2xl border border-heritage-900/5 bg-white p-8 text-center shadow-card">
                <Search
                  className="mx-auto size-7 text-muted-foreground/40"
                  aria-hidden="true"
                />
                <p className="mt-3 font-heading text-sm font-bold text-heritage-900">
                  لا نتائج مطابقة
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  جرّب تعديل البحث بالاسم
                </p>
              </div>
            ) : (
              <ul className="max-h-96 space-y-2.5 overflow-y-auto pe-1">
                {visible.map((player) => (
                  <li
                    key={player.id}
                    className="flex items-center gap-3 rounded-2xl border border-heritage-900/5 bg-white p-3.5 shadow-card"
                  >
                    <Avatar className="size-10 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-heritage-800 to-heritage-600 font-heading text-xs font-extrabold text-gold-400">
                        {player.name.trim().charAt(0) || "؟"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-xs font-bold text-heritage-900">
                          {player.name}
                        </span>
                        {player.deviceId &&
                          player.deviceId === deviceId && (
                            <span className="shrink-0 rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold text-gold-700">
                              جهازك
                            </span>
                          )}
                      </div>
                      <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                        {player.points.toLocaleString("ar-EG")} نقطة
                        <span
                          className="mx-1 text-muted-foreground/40"
                          aria-hidden="true"
                        >
                          •
                        </span>
                        {player.stars.toLocaleString("ar-EG")} نجمة
                        <span
                          className="mx-1 text-muted-foreground/40"
                          aria-hidden="true"
                        >
                          •
                        </span>
                        {player.levelsCompleted.toLocaleString("ar-EG")} مراحل
                        <span
                          className="mx-1 text-muted-foreground/40"
                          aria-hidden="true"
                        >
                          •
                        </span>
                        {player.badgesCount.toLocaleString("ar-EG")} أوسمة
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                        آخر نشاط: {relativeTime(player.lastActiveAt)}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={busyId === player.id}
                      onClick={() => setDeleting(player)}
                      aria-label={`حذف اللاعب ${player.name}`}
                      className="shrink-0"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {/* تأكيد حذف لاعب */}
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف «{deleting?.name}» من الشبكة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيُحذف اللاعب وإحصاءاته ({(deleting?.points ?? 0).toLocaleString("ar-EG")} نقطة) من
              قاعدة الإدارة نهائياً — بيانات هذا الجهاز المحلية لن تتأثر.
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
