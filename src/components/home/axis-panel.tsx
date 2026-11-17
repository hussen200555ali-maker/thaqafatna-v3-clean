"use client";

/**
 * بطاقة المحور الثقافي (Axis Panel)
 * =================================
 * قسم يظهر تحت شبكة المحاور في الرئيسية: كتب المحور المختار
 * من قاعدة المكتبة (GET /api/library) مفلترة حسب التصنيف المطابق:
 *   الآداب ← «الأدب الكلاسيكي» | التاريخ ← «التاريخ والحضارات»
 *   العلوم ← «الفكر والفلسفة»  | الطبيعة ← لا تصنيف مطابق بعد
 *
 * النقر على كتاب يفتح Dialog بتفاصيله، والمحور الفارغ (الطبيعة)
 * يظهر بحالة صادقة أنيقة مع زر اقتراح كتاب. زر X يخفي البطاقة
 * (وتعود تلقائياً عند تبديل المحور — الأب يتحكم بالعرض كله).
 */

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  Feather,
  FileText,
  LibraryBig,
  MessageSquare,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LibraryBook } from "@/components/library/library-types";
import { culturalAxes } from "./data";

/** واجهة البطاقة — الأب يمرر المحور النشط ووجهتي الانتقال */
interface AxisPanelProps {
  axisId: "literature" | "nature" | "science" | "history";
  /** يفتح تبويب المكتبة */
  onOpenLibrary: () => void;
  /** يقترح كتاباً — ينقل لحسابي (تواصل معنا) */
  onSuggest: () => void;
}

/** التصنيفات المطابقة لكل محور — محورٌ واحد قد يجمع تصنيفين:
 *  العلوم تجمع «الفكر والفلسفة» و«علوم اللغة» — والطبيعة بلا تصنيف بعد */
const CATEGORY_BY_AXIS: Record<AxisPanelProps["axisId"], string[]> = {
  literature: ["الأدب الكلاسيكي"],
  history: ["التاريخ والحضارات"],
  science: ["الفكر والفلسفة", "علوم اللغة"],
  nature: [],
};

export function AxisPanel({ axisId, onOpenLibrary, onSuggest }: AxisPanelProps) {
  /* null = جارٍ الجلب — بعدها قائمة الكتب (أو فارغة عند التعذّر) */
  const [books, setBooks] = useState<LibraryBook[] | null>(null);
  /* إخفاء البطاقة بزر X — يعود عرضها عند تبديل المحور */
  const [hidden, setHidden] = useState(false);
  /* الكتاب المفتوح في Dialog التفاصيل */
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);

  /* ===== جلب المكتبة مرة واحدة — فشل صامت إلى حالة فارغة ===== */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/library");
        const data = (await response.json()) as {
          ok: boolean;
          books?: LibraryBook[];
        };
        if (cancelled) return;
        setBooks(data.ok && Array.isArray(data.books) ? data.books : []);
      } catch {
        if (!cancelled) setBooks([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* تبديل المحور أثناء العرض — يعيد إظهار البطاقة ويغلق التفاصيل
     (نمط «ضبط الحالة عند تغيّر prop» الرسمي — بلا تأثيرات) */
  const [lastAxisId, setLastAxisId] = useState(axisId);
  if (lastAxisId !== axisId) {
    setLastAxisId(axisId);
    setHidden(false);
    setSelectedBook(null);
  }

  /* بيانات المحور من المصدر الموحد (عنوان/وصف/أيقونة/لون) */
  const axis =
    culturalAxes.find((item) => item.id === axisId) ?? culturalAxes[0];
  const AxisIcon = axis.icon;
  const categoryTitles = CATEGORY_BY_AXIS[axisId];

  /* كتب المحور — مفلترة بتصنيفاتها المطابقة (محورٌ قد يجمع تصنيفين) */
  const axisBooks = useMemo(
    () =>
      (books ?? []).filter(
        (book) =>
          book.categoryTitle !== null &&
          categoryTitles.includes(book.categoryTitle),
      ),
    [books, categoryTitles],
  );

  /* الإخفاء بزر X — العرض الكلي بيد الأب */
  if (hidden) return null;

  return (
    <section aria-label={`كتب محور ${axis.title}`} className="space-y-3">
      {/* ترويسة البطاقة — أيقونة المحور ووصفه وزر الإخفاء */}
      <div className="flex items-center gap-2.5 rounded-2xl bg-white p-3.5 shadow-card">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl ${axis.accentClass} text-white`}
          aria-hidden="true"
        >
          <AxisIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-[13px] font-extrabold text-heritage-900">
            محور {axis.title}
          </h3>
          <p className="mt-0.5 truncate text-[10px] font-medium text-muted-foreground">
            {axis.subtitle} — قراءات مختارة من المكتبة
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setHidden(true)}
          aria-label="إخفاء بطاقة المحور"
          className="-me-1 size-8 text-muted-foreground hover:bg-sand-dark/50 hover:text-heritage-900"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {/* حالة التحميل — هياكل نابضة قبل وصول الكتب */}
      {books === null && (
        <div className="flex gap-3 overflow-hidden" aria-busy="true">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-32 w-52 shrink-0 animate-pulse rounded-2xl bg-white/70 shadow-card"
            />
          ))}
        </div>
      )}

      {/* كتب المحور — شريط أفقي قابل للتمرير */}
      {books !== null && axisBooks.length > 0 && (
        <div
          className="scrollbar-thin-gold flex gap-3 overflow-x-auto pb-1"
          role="list"
          aria-label={`كتب محور ${axis.title}`}
        >
          {axisBooks.map((book) => (
            <button
              key={book.id}
              type="button"
              role="listitem"
              onClick={() => setSelectedBook(book)}
              className="flex w-52 shrink-0 flex-col rounded-2xl border border-heritage-900/5 bg-white p-3.5 text-start shadow-card transition-all duration-150 hover:border-gold-500/40 active:scale-[0.98]"
              aria-label={`كتاب ${book.title} — اضغط للتفاصيل`}
            >
              <span
                className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-heritage-800 to-heritage-600 text-gold-400"
                aria-hidden="true"
              >
                <BookOpen className="size-4.5" />
              </span>
              <span className="mt-2.5 truncate font-heading text-xs font-extrabold text-heritage-900">
                {book.title}
              </span>
              <span className="mt-1 flex items-center gap-1 truncate text-[10px] font-medium text-heritage-700">
                <Feather className="size-3 shrink-0" aria-hidden="true" />
                {book.author ?? "مجهول المؤلف"}
              </span>
              <span className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-heritage-700/80">
                <FileText className="size-3" aria-hidden="true" />
                {book.chapterCount.toLocaleString("ar-EG")} فصول
              </span>
            </button>
          ))}
        </div>
      )}

      {/* الحالة الفارغة الصادقة — محور الطبيعة حالياً */}
      {books !== null && axisBooks.length === 0 && (
        <div className="rounded-2xl bg-white p-6 text-center shadow-card">
          <span
            className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-600"
            aria-hidden="true"
          >
            <AxisIcon className="size-5" />
          </span>
          <p className="mt-3 font-heading text-xs font-extrabold text-heritage-900">
            لا كتب في هذا المحور بعد
          </p>
          <p className="mt-1 text-[10px] font-medium leading-relaxed text-muted-foreground">
            المكتبة تتوسع باستمرار — اقترح علينا كتاباً ونضعه في
            قائمة التجهيز
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={onSuggest}
            className="mt-3.5 gap-1.5 border-gold-500/40 text-gold-700 hover:bg-gold-100 hover:text-gold-700"
          >
            <Feather className="size-3.5" aria-hidden="true" />
            اقترح كتاباً
          </Button>
        </div>
      )}

      {/* كل كتب المحور — بوابة إلى تبويب المكتبة */}
      {books !== null && (
        <button
          type="button"
          onClick={onOpenLibrary}
          className="flex w-full items-center gap-3 rounded-2xl bg-heritage-900 p-3.5 text-start shadow-card transition-all duration-150 hover:bg-heritage-800 active:scale-[0.99]"
          aria-label="فتح كل كتب المحور في المكتبة"
        >
          <span
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-gold-400"
            aria-hidden="true"
          >
            <LibraryBig className="size-4.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-white">
              كل كتب المحور في المكتبة
            </span>
            <span className="mt-0.5 block truncate text-[10px] font-medium text-heritage-100/70">
              {axisBooks.length > 0
                ? `${
                    axisBooks.length === 1
                      ? "كتابٌ واحدٌ في"
                      : `${axisBooks.length.toLocaleString("ar-EG")} كتباً في`
                  } ${
                    categoryTitles.length > 1
                      ? `تصنيفَي «${categoryTitles.join("» و«")}»`
                      : `تصنيف «${categoryTitles[0]}»`
                  }`
                : "استكشف كل التصنيفات في مكتبتنا المتنامية"}
            </span>
          </span>
          <ChevronLeft
            className="size-4 shrink-0 text-gold-400"
            aria-hidden="true"
          />
        </button>
      )}

      {/* تفاصيل الكتاب — Dialog كامل ببياناته من القاعدة */}
      <Dialog
        open={selectedBook !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedBook(null);
        }}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader className="text-start">
            <DialogTitle className="font-heading text-base text-heritage-900">
              {selectedBook?.title}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
              <Feather className="size-3" aria-hidden="true" />
              {selectedBook?.author ?? "مجهول المؤلف"}
              {selectedBook?.categoryTitle && (
                <>
                  <span aria-hidden="true">•</span>
                  {selectedBook.categoryTitle}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs leading-relaxed text-heritage-900/85">
            {selectedBook?.description?.trim() ||
              "لا وصف متاح لهذا الكتاب بعد — فريق التحرير يجهّزه قريباً"}
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-[10px] font-bold text-heritage-700">
              <FileText className="size-3" aria-hidden="true" />
              {selectedBook?.chapterCount.toLocaleString("ar-EG") ??
                "٠"}{" "}
              فصول
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-[10px] font-bold text-heritage-700">
              <MessageSquare className="size-3" aria-hidden="true" />
              {selectedBook?.reviewCount.toLocaleString("ar-EG") ?? "٠"}{" "}
              مراجعات
            </span>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedBook(null)}
            >
              إغلاق
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSelectedBook(null);
                onOpenLibrary();
              }}
              className="gap-1.5"
            >
              <LibraryBig className="size-3.5" aria-hidden="true" />
              تصفح المكتبة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
