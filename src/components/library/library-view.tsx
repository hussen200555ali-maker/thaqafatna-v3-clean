"use client";

/**
 * المكتبة العامة — تجربة القراءة الكاملة
 * =========================================
 * ثلاث شاشات متتالية داخل تبويب المكتبة:
 *   1) الشبكة: تصنيفات + كتب منشورة من قاعدة لوحة الإدارة
 *   2) الكتاب: بطاقة تعريف + فصوله + مراجعاته + نموذج مراجعة
 *   3) القارئ: نص الفصل بفقراته المريحة للقراءة الطويلة
 *
 * كل البيانات من /api/library — الكتب المنشورة فقط، والمراجعة
 * الجديدة تذهب «معلّقة» حتى يعتمدها الإشراف من لوحة الإدارة.
 */

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  Feather,
  FileText,
  LibraryBig,
  MessageSquare,
  Send,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type {
  LibraryBook,
  LibraryBookDetail,
  LibraryBookResponse,
  LibraryCategory,
  LibraryHomeResponse,
} from "./library-types";

/** حالة الشاشة النشطة داخل المكتبة */
type Screen =
  | { view: "grid" }
  | { view: "book" }
  | { view: "chapter"; chapterId: string };

/** عرض النجوم — مملوءة أو فارغة حسب التقييم */
function Stars({ value, size = "size-3.5" }: { value: number; size?: string }) {
  return (
    <span
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${value.toLocaleString("ar-EG")} من ٥ نجوم`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= value
              ? "fill-gold-500 text-gold-500"
              : "fill-transparent text-heritage-900/25"
          }`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/** تاريخ مختصر بالعربية */
function formatDate(iso: string): string {
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

export function LibraryView() {
  const { toast } = useToast();
  const [screen, setScreen] = useState<Screen>({ view: "grid" });
  const [categories, setCategories] = useState<LibraryCategory[] | null>(null);
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [book, setBook] = useState<LibraryBookDetail | null>(null);
  const [loadingBook, setLoadingBook] = useState(false);
  const [failed, setFailed] = useState(false);

  /* ===== جلب شبكة المكتبة — التصنيفات والكتب المنشورة ===== */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/library");
        const data = (await response.json()) as LibraryHomeResponse;
        if (cancelled) return;
        if (data.ok) {
          setCategories(data.categories);
          setBooks(data.books);
        } else {
          setFailed(true);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ===== فتح كتاب — تفاصيله وفصوله ومراجعاته ===== */
  const openBook = useCallback(
    async (bookId: string) => {
      setLoadingBook(true);
      setScreen({ view: "book" });
      try {
        const response = await fetch(
          `/api/library/books/${encodeURIComponent(bookId)}`,
        );
        const data = (await response.json()) as LibraryBookResponse;
        if (data.ok && data.book) {
          setBook(data.book);
        } else {
          toast({
            title: "الكتاب غير متاح",
            description: "ربما حُوّل إلى مسودة — اختر غيره",
            variant: "destructive",
          });
          setScreen({ view: "grid" });
        }
      } catch {
        toast({
          title: "تعذّر الاتصال",
          description: "تحقق من الشبكة ثم أعد المحاولة",
          variant: "destructive",
        });
        setScreen({ view: "grid" });
      } finally {
        setLoadingBook(false);
      }
    },
    [toast],
  );

  if (failed) {
    return (
      <main className="px-4 pb-32 pt-8">
        <div className="rounded-2xl border border-flame-500/20 bg-white p-8 text-center shadow-card">
          <p className="font-heading text-sm font-bold text-heritage-900">
            تعذّر جلب المكتبة
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            تحقق من الخادم ثم أعد المحاولة
          </p>
        </div>
      </main>
    );
  }

  if (!categories) {
    return (
      <main className="space-y-3 px-4 pb-32 pt-4" aria-busy="true">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl bg-white/70 shadow-card"
          />
        ))}
      </main>
    );
  }

  /* ===== الشاشة الأولى: شبكة الكتب ===== */
  if (screen.view === "grid") {
    const visibleBooks =
      activeCategory === "all"
        ? books
        : books.filter((item) => item.categoryTitle === activeCategory);

    return (
      <main className="space-y-5 px-4 pb-32 pt-4">
        <header className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-heritage-900 text-gold-400 shadow-card">
            <LibraryBig className="size-5.5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-lg font-extrabold text-heritage-900">
              المكتبة الذكية
            </h2>
            <p className="text-[11px] font-medium text-muted-foreground">
              {books.length.toLocaleString("ar-EG")} كتباً منشورة من قاعدة
              لوحة الإدارة
            </p>
          </div>
        </header>

        {/* رقائق التصنيفات — الكل + كل تصنيف */}
        <div
          className="scrollbar-thin-gold flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="تصفية الكتب بالتصنيف"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors duration-150 ${
              activeCategory === "all"
                ? "bg-heritage-900 text-white shadow-card"
                : "bg-white text-heritage-800 shadow-card hover:bg-sand-dark/40"
            }`}
          >
            الكل ({books.length.toLocaleString("ar-EG")})
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={activeCategory === category.title}
              onClick={() => setActiveCategory(category.title)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors duration-150 ${
                activeCategory === category.title
                  ? "bg-heritage-900 text-white shadow-card"
                  : "bg-white text-heritage-800 shadow-card hover:bg-sand-dark/40"
              }`}
            >
              {category.title} (
              {category.bookCount.toLocaleString("ar-EG")})
            </button>
          ))}
        </div>

        {/* بطاقات الكتب */}
        <div className="space-y-3">
          {visibleBooks.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openBook(item.id)}
              className="flex w-full items-start gap-3.5 rounded-2xl border border-heritage-900/5 bg-white p-4 text-start shadow-card transition-all duration-150 hover:border-gold-500/40 active:scale-[0.99]"
            >
              <span
                className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-heritage-800 to-heritage-600 text-gold-400"
                aria-hidden="true"
              >
                <BookOpen className="size-5.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-heading text-sm font-extrabold text-heritage-900">
                    {item.title}
                  </span>
                  {item.categoryTitle && (
                    <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[9px] font-bold text-gold-700">
                      {item.categoryTitle}
                    </span>
                  )}
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-heritage-700">
                  <Feather className="size-3" aria-hidden="true" />
                  {item.author ?? "مجهول المؤلف"}
                </span>
                {item.description && (
                  <span className="mt-1.5 line-clamp-2 block text-[11px] leading-relaxed text-muted-foreground">
                    {item.description}
                  </span>
                )}
                <span className="mt-2 flex items-center gap-3 text-[10px] font-bold text-heritage-700/80">
                  <span className="flex items-center gap-1">
                    <FileText className="size-3" aria-hidden="true" />
                    {item.chapterCount.toLocaleString("ar-EG")} فصول
                  </span>
                  {item.reviewCount > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3" aria-hidden="true" />
                      {item.reviewCount.toLocaleString("ar-EG")} مراجعات
                    </span>
                  )}
                </span>
              </span>
            </button>
          ))}
          {visibleBooks.length === 0 && (
            <div className="rounded-2xl bg-white/70 p-8 text-center shadow-card">
              <p className="text-xs font-medium text-muted-foreground">
                لا كتب منشورة في هذا التصنيف بعد
              </p>
            </div>
          )}
        </div>
      </main>
    );
  }

  /* ===== الشاشة الثانية: تفاصيل الكتاب ===== */
  if (screen.view === "book") {
    if (loadingBook || !book) {
      return (
        <main className="space-y-3 px-4 pb-32 pt-4" aria-busy="true">
          <div className="h-28 animate-pulse rounded-2xl bg-white/70 shadow-card" />
          <div className="h-16 animate-pulse rounded-2xl bg-white/70 shadow-card" />
          <div className="h-16 animate-pulse rounded-2xl bg-white/70 shadow-card" />
        </main>
      );
    }

    const averageRating =
      book.reviews.length > 0
        ? Math.round(
            (book.reviews.reduce((sum, review) => sum + review.rating, 0) /
              book.reviews.length) *
              10,
          ) / 10
        : null;

    return (
      <main className="space-y-5 px-4 pb-32 pt-4">
        {/* العودة + بطاقة الكتاب */}
        <button
          type="button"
          onClick={() => setScreen({ view: "grid" })}
          className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-heritage-800 shadow-card transition-transform duration-150 active:scale-95"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          كل الكتب
        </button>

        <header className="overflow-hidden rounded-2xl border border-heritage-900/5 bg-white shadow-card">
          <div className="bg-gradient-to-l from-heritage-900 to-heritage-700 px-5 py-4">
            <h2 className="font-heading text-base font-extrabold text-white">
              {book.title}
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-gold-400">
              <Feather className="size-3" aria-hidden="true" />
              {book.author ?? "مجهول المؤلف"}
              {book.categoryTitle && (
                <>
                  <span aria-hidden="true">•</span>
                  {book.categoryTitle}
                </>
              )}
            </p>
          </div>
          <div className="space-y-3 p-5">
            {book.description && (
              <p className="text-xs leading-relaxed text-heritage-900/85">
                {book.description}
              </p>
            )}
            {averageRating !== null && (
              <div className="flex items-center gap-2">
                <Stars value={Math.round(averageRating)} />
                <span className="text-[11px] font-bold text-heritage-800">
                  {averageRating.toLocaleString("ar-EG")} / ٥
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({book.reviews.length.toLocaleString("ar-EG")} مراجعات)
                </span>
              </div>
            )}
          </div>
        </header>

        {/* الفصول */}
        <section aria-label="فصول الكتاب" className="space-y-3">
          <h3 className="flex items-center gap-2 font-heading text-sm font-extrabold text-heritage-900">
            <FileText className="size-4 text-heritage-700" aria-hidden="true" />
            الفصول ({book.chapters.length.toLocaleString("ar-EG")})
          </h3>
          <ul className="space-y-2.5">
            {book.chapters.map((chapter) => (
              <li key={chapter.id}>
                <button
                  type="button"
                  onClick={() =>
                    setScreen({ view: "chapter", chapterId: chapter.id })
                  }
                  className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-start shadow-card transition-all duration-150 hover:bg-sand-dark/30 active:scale-[0.99]"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-heritage-100 font-heading text-xs font-bold text-heritage-800">
                    {chapter.order.toLocaleString("ar-EG")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-heritage-900">
                      {chapter.title}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-medium text-muted-foreground">
                      {chapter.content ? "جاهز للقراءة" : "قيد التجهيز"}
                    </span>
                  </span>
                  <ChevronLeft className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* المراجعات + نموذج جديدة */}
        <ReviewsSection bookId={book.id} reviews={book.reviews} />
      </main>
    );
  }

  /* ===== الشاشة الثالثة: قارئ الفصل ===== */
  const chapter = book?.chapters.find((item) => item.id === screen.chapterId);

  if (!chapter) {
    return (
      <main className="px-4 pb-32 pt-8">
        <div className="rounded-2xl bg-white p-8 text-center shadow-card">
          <p className="text-xs font-medium text-muted-foreground">
            الفصل غير موجود — عد إلى الكتاب
          </p>
        </div>
      </main>
    );
  }

  const paragraphs = (chapter.content ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chapterIndex = book?.chapters.findIndex(
    (item) => item.id === chapter.id,
  );
  const nextChapter =
    chapterIndex != null && book
      ? (book.chapters[chapterIndex + 1] ?? null)
      : null;

  return (
    <main className="space-y-5 px-4 pb-32 pt-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setScreen({ view: "book" })}
          className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-heritage-800 shadow-card transition-transform duration-150 active:scale-95"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          {book?.title ?? "الكتاب"}
        </button>
        {book && (
          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-heritage-700 shadow-card">
            فصل {chapter.order.toLocaleString("ar-EG")} من{" "}
            {book.chapters.length.toLocaleString("ar-EG")}
          </span>
        )}
      </div>

      <article className="rounded-2xl border border-heritage-900/5 bg-white p-6 shadow-card">
        <h2 className="border-b border-heritage-900/8 pb-4 text-center font-heading text-base font-extrabold leading-relaxed text-heritage-900">
          {chapter.title}
        </h2>
        {paragraphs.length > 0 ? (
          <div className="space-y-5 pt-5">
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-justify text-[13px] leading-[2.1] text-heritage-900/90"
              >
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <div className="pt-6 text-center">
            <HourglassIcon />
            <p className="mt-3 text-xs font-medium text-muted-foreground">
              محتوى هذا الفصل قيد التجهيز من فريق التحرير
            </p>
          </div>
        )}
      </article>

      {/* الفصل التالي */}
      {nextChapter && (
        <button
          type="button"
          onClick={() =>
            setScreen({ view: "chapter", chapterId: nextChapter.id })
          }
          className="flex w-full items-center justify-between gap-3 rounded-2xl bg-heritage-900 p-4 text-start shadow-card transition-all duration-150 hover:bg-heritage-800 active:scale-[0.99]"
        >
          <span>
            <span className="block text-[10px] font-bold text-gold-400">
              الفصل التالي
            </span>
            <span className="mt-0.5 block font-heading text-sm font-bold text-white">
              {nextChapter.title}
            </span>
          </span>
          <ArrowRight className="size-5 shrink-0 text-gold-400" aria-hidden="true" />
        </button>
      )}
    </main>
  );
}

/** أيقونة انتظار صغيرة للمحتوى غير الجاهز */
function HourglassIcon() {
  return (
    <span
      className="mx-auto grid size-12 place-items-center rounded-2xl bg-heritage-100 text-heritage-700"
      aria-hidden="true"
    >
      <Feather className="size-5" />
    </span>
  );
}

/* ============================================================
   قسم المراجعات — المعتمدة + نموذج إضافة مراجعة معلّقة
   ============================================================ */

function ReviewsSection({
  bookId,
  reviews,
}: {
  bookId: string;
  reviews: Array<{
    id: string;
    author: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
}) {
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [author, setAuthor] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async () => {
    setSending(true);
    try {
      const response = await fetch("/api/library/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          rating,
          author: author.trim() || "زائر",
          comment: comment.trim(),
        }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        error?: string;
      };
      if (data.ok) {
        toast({
          title: "وصلت مراجعتك",
          description: data.message ?? "ستظهر بعد اعتماد الإشراف",
        });
        setComment("");
        setAuthor("");
        setRating(5);
        setShowForm(false);
      } else {
        toast({
          title: "تعذّر الإرسال",
          description: data.error ?? "خطأ غير متوقع",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "تعذّر الاتصال",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section aria-label="مراجعات الكتاب" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-heading text-sm font-extrabold text-heritage-900">
          <MessageSquare className="size-4 text-heritage-700" aria-hidden="true" />
          المراجعات ({reviews.length.toLocaleString("ar-EG")})
        </h3>
        <Button
          size="sm"
          variant={showForm ? "outline" : "default"}
          onClick={() => setShowForm((open) => !open)}
          className="gap-1.5"
        >
          <Send className="size-3.5" aria-hidden="true" />
          {showForm ? "إخفاء النموذج" : "اكتب مراجعة"}
        </Button>
      </div>

      {/* نموذج مراجعة جديدة — تُعتمد من الإشراف قبل الظهور */}
      {showForm && (
        <div className="space-y-3.5 rounded-2xl border border-gold-500/25 bg-white p-4 shadow-card">
          <div className="space-y-1.5">
            <Label className="text-[11px]">تقييمك</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={`${star.toLocaleString("ar-EG")} نجوم`}
                  aria-pressed={rating === star}
                  className="transition-transform duration-100 active:scale-90"
                >
                  <Star
                    className={`size-6 ${
                      star <= rating
                        ? "fill-gold-500 text-gold-500"
                        : "fill-transparent text-heritage-900/25"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="review-author" className="text-[11px]">
              اسمك — اختياري
            </Label>
            <Input
              id="review-author"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder="زائر"
              maxLength={40}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="review-comment" className="text-[11px]">
              مراجعتك
            </Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              maxLength={500}
              placeholder="ما رأيك في الكتاب واختيار فصوله؟"
              className="text-xs"
            />
          </div>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={sending || comment.trim().length < 5}
            className="gap-1.5"
          >
            <Send className="size-3.5" aria-hidden="true" />
            {sending ? "جارٍ الإرسال…" : "إرسال للإشراف"}
          </Button>
        </div>
      )}

      {/* المراجعات المعتمدة */}
      {reviews.length > 0 ? (
        <ul className="space-y-2.5">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-2xl bg-white p-4 shadow-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 font-heading text-[11px] font-extrabold text-heritage-950"
                    aria-hidden="true"
                  >
                    {review.author.slice(0, 1)}
                  </span>
                  <div className="leading-tight">
                    <p className="text-xs font-bold text-heritage-900">
                      {review.author}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>
                <Stars value={review.rating} />
              </div>
              <p className="mt-2.5 text-[11.5px] leading-relaxed text-heritage-900/85">
                {review.comment}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl bg-white/70 p-6 text-center shadow-card">
          <p className="text-xs font-medium text-muted-foreground">
            لا مراجعات معتمدة بعد — كن أول من يشارك رأيه
          </p>
        </div>
      )}
    </section>
  );
}
