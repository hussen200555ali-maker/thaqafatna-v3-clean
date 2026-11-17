"use client";

/**
 * صفحة المراجعات — إشراف حقيقي على مراجعات الكتب
 * ==================================================
 * كل مراجعة كتبها القرّاء تصل هنا «معلّقة» — فيعتمدها المشرف
 * فتظهر للجميع في صفحة الكتاب، أو يرفضها أو يحذفها.
 * عدّادات حية بكل حالة + تصفية + إجراءات فورية.
 */

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  Ban,
  CheckCircle2,
  Hourglass,
  MessageSquare,
  Star,
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
import { useToast } from "@/hooks/use-toast";
import { logAdminAction } from "@/lib/admin/audit-store";
import { AdminPageHeader } from "../shared/admin-page-header";
import { StatCard } from "../shared/stat-card";
import { AdminLoading } from "../shared/admin-loading";
import type { AdminReview, AdminReviewCounts } from "../admin-types";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const FILTERS: { id: StatusFilter; title: string }[] = [
  { id: "all", title: "الكل" },
  { id: "pending", title: "معلّقة" },
  { id: "approved", title: "معتمدة" },
  { id: "rejected", title: "مرفوضة" },
];

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-gold-100 text-gold-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-flame-100 text-flame-600",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "معلّقة",
  approved: "معتمدة",
  rejected: "مرفوضة",
};

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

export function ReviewsPage() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<AdminReview[] | null>(null);
  const [counts, setCounts] = useState<AdminReviewCounts | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminReview | null>(null);

  /* قراءة المراجعات من الخادم */
  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/reviews");
      const data = (await response.json()) as {
        ok: boolean;
        reviews?: AdminReview[];
        counts?: AdminReviewCounts;
      };
      if (data.ok && data.reviews && data.counts) {
        setReviews(data.reviews);
        setCounts(data.counts);
      } else {
        setReviews([]);
      }
    } catch {
      setReviews([]);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  /* تغيير حالة مراجعة — اعتماد أو رفض */
  const handleStatus = async (review: AdminReview, status: "approved" | "rejected") => {
    setBusyId(review.id);
    try {
      const response = await fetch(
        `/api/admin/reviews/${encodeURIComponent(review.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        logAdminAction(
          status === "approved" ? "تعديل" : "تعديل",
          "مراجعة",
          `${status === "approved" ? "اعتماد" : "رفض"} مراجعة «${review.author}» على ${review.bookTitle ?? "كتاب"}`,
        );
        toast({
          title:
            status === "approved" ? "اعتُمدت المراجعة" : "رُفضت المراجعة",
          description: review.bookTitle ?? "",
        });
        await fetchReviews();
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

  /* حذف نهائي */
  const handleDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      const response = await fetch(
        `/api/admin/reviews/${encodeURIComponent(deleting.id)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        logAdminAction(
          "حذف",
          "مراجعة",
          `حذف مراجعة «${deleting.author}» على ${deleting.bookTitle ?? "كتاب"}`,
        );
        toast({ title: "حُذفت المراجعة" });
        await fetchReviews();
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

  if (!reviews) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="المراجعات"
          description="مراجعات الكتب وتقييمات الألغاز وإبلاغات المجتمع"
        />
        <AdminLoading />
      </div>
    );
  }

  const visible =
    filter === "all" ? reviews : reviews.filter((item) => item.status === filter);
  const pendingCount = counts?.pending ?? 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="المراجعات"
        description="مراجعات الكتب وتقييمات الألغاز وإبلاغات المجتمع"
      />

      {/* عدّادات الحالات الثلاث */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={Hourglass}
          value={counts?.pending ?? 0}
          label="بانتظار الاعتماد"
          tone="gold"
        />
        <StatCard
          icon={CheckCircle2}
          value={counts?.approved ?? 0}
          label="معتمدة وظاهرة"
          tone="emerald"
        />
        <StatCard
          icon={Ban}
          value={counts?.rejected ?? 0}
          label="مرفوضة"
          tone="flame"
        />
      </div>

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
            {item.id === "pending" && pendingCount > 0 && (
              <span className="ms-1.5 rounded-full bg-flame-500 px-1.5 text-[9px] font-bold leading-4 text-white">
                {pendingCount.toLocaleString("ar-EG")}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* القائمة */}
      {visible.length > 0 ? (
        <ul className="space-y-3">
          {visible.map((review) => (
            <li
              key={review.id}
              className="rounded-2xl border border-heritage-900/5 bg-white p-4 shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 basis-56">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-heritage-900">
                      {review.author}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${STATUS_CLASSES[review.status] ?? "bg-heritage-100 text-heritage-700"}`}
                    >
                      {STATUS_LABELS[review.status] ?? review.status}
                    </span>
                    <span className="flex items-center gap-0.5" aria-label={`${review.rating} من ٥`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`size-3 ${
                            star <= review.rating
                              ? "fill-gold-500 text-gold-500"
                              : "fill-transparent text-heritage-900/25"
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                    على «{review.bookTitle ?? "كتاب"}» — {formatDate(review.createdAt)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-heritage-900/85">
                    {review.comment}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {review.status !== "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === review.id}
                      onClick={() => handleStatus(review, "approved")}
                      className="gap-1.5 border-emerald-600/30 text-emerald-700 hover:bg-emerald-50"
                    >
                      <BadgeCheck className="size-3.5" aria-hidden="true" />
                      اعتماد
                    </Button>
                  )}
                  {review.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === review.id}
                      onClick={() => handleStatus(review, "rejected")}
                      className="gap-1.5 border-flame-500/30 text-flame-600 hover:bg-flame-50"
                    >
                      <Ban className="size-3.5" aria-hidden="true" />
                      رفض
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busyId === review.id}
                    onClick={() => setDeleting(review)}
                    aria-label={`حذف مراجعة ${review.author}`}
                    className="gap-1.5"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
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
            {filter === "pending"
              ? "لا مراجعات معلّقة"
              : filter === "approved"
                ? "لا مراجعات معتمدة بعد"
                : filter === "rejected"
                  ? "لا مراجعات مرفوضة"
                  : "لا مراجعات بعد"}
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
            اكتب مراجعة من صفحة أي كتاب في المكتبة — ستصل هنا فور إرسالها
          </p>
        </div>
      )}

      {/* تأكيد الحذف */}
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المراجعة نهائياً؟</AlertDialogTitle>
            <AlertDialogDescription>
              ستُحذف مراجعة «{deleting?.author}» على «{deleting?.bookTitle}»
              من قاعدة الإدارة — لا يمكن التراجع.
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
