"use client";

/**
 * صفحة إدارة المكتبة — مركز قيادة المحتوى المكتبي
 * =====================================================
 * إحصاءات المكتبة الحية + بطاقات وصول سريع للأقسام الثلاثة +
 * أحدث الكتب المضافة — كلها من قاعدة لوحة الإدارة مباشرة.
 */

import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  FileText,
  Layers,
  LibraryBig,
  MessageSquare,
  Tags,
} from "lucide-react";
import { AdminPageHeader } from "../shared/admin-page-header";
import { StatCard } from "../shared/stat-card";
import { AdminLoading } from "../shared/admin-loading";
import type { AdminBook, AdminNavigate, AdminStats } from "../admin-types";

interface LibraryManagementPageProps {
  navigate: AdminNavigate;
}

/** بطاقة وصول سريع لقسم داخل المكتبة */
function QuickCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3.5 rounded-2xl border border-heritage-900/5 bg-white p-4 text-start shadow-card transition-all duration-150 hover:border-gold-500/40 hover:shadow-card-lg active:scale-[0.98]"
    >
      <div
        className="grid size-11 shrink-0 place-items-center rounded-xl bg-heritage-100 text-heritage-700"
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-sm font-extrabold text-heritage-900">
          {title}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {description}
        </p>
      </div>
      <ChevronLeft className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}

export function LibraryManagementPage({ navigate }: LibraryManagementPageProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [books, setBooks] = useState<AdminBook[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [statsResponse, booksResponse] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/books"),
        ]);
        const statsData = (await statsResponse.json()) as {
          ok: boolean;
          stats?: AdminStats;
        };
        const booksData = (await booksResponse.json()) as {
          ok: boolean;
          books?: AdminBook[];
        };
        if (cancelled) return;
        if (statsData.ok && statsData.stats) setStats(statsData.stats);
        if (booksData.ok && booksData.books) setBooks(booksData.books);
      } catch {
        /* تبقى الحالة فارغة — بطاقات التحميل تكشف المشكلة بلطف */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats || !books) return <AdminLoading />;

  const published = books.filter((book) => book.status === "published").length;
  const drafts = books.length - published;
  const latest = [...books]
    .sort((a, b) => b.order - a.order)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="إدارة المكتبة"
        description="مركز قيادة المكتبة — الكتب والتصنيفات والفصول في مكان واحد"
      />

      {/* إحصاءات المكتبة */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          icon={BookOpen}
          value={published}
          label="كتاباً منشوراً"
          tone="emerald"
        />
        <StatCard
          icon={Layers}
          value={drafts}
          label="مسودات بانتظار النشر"
          tone="gold"
        />
        <StatCard
          icon={Tags}
          value={stats.categories}
          label="تصنيفات"
          onClick={() => navigate("book-categories")}
        />
        <StatCard
          icon={FileText}
          value={stats.bookChapters}
          label="فصول الكتب"
          onClick={() => navigate("book-chapters")}
        />
      </div>

      {/* الوصول السريع */}
      <div className="grid gap-3 lg:grid-cols-4 lg:gap-4">
        <QuickCard
          icon={BookOpen}
          title="الكتب"
          description="إضافة وتحرير الكتب وحالات النشر"
          onClick={() => navigate("books")}
        />
        <QuickCard
          icon={Tags}
          title="التصنيفات"
          description="تنظيم المكتبة في محاور معرفية"
          onClick={() => navigate("book-categories")}
        />
        <QuickCard
          icon={FileText}
          title="الفصول"
          description="بنية الكتب ومحتوى القراءة"
          onClick={() => navigate("book-chapters")}
        />
        <QuickCard
          icon={MessageSquare}
          title="المراجعات"
          description="اعتماد مراجعات القرّاء أو رفضها"
          onClick={() => navigate("reviews")}
        />
      </div>

      {/* أحدث الكتب */}
      <section
        className="rounded-2xl border border-heritage-900/5 bg-white p-5 shadow-card"
        aria-labelledby="library-latest"
      >
        <div className="flex items-center justify-between gap-3">
          <h3
            id="library-latest"
            className="flex items-center gap-2 font-heading text-sm font-extrabold text-heritage-900"
          >
            <LibraryBig className="size-4 text-heritage-600" aria-hidden="true" />
            أحدث إضافات المكتبة
          </h3>
          <button
            type="button"
            onClick={() => navigate("books")}
            className="text-[11px] font-bold text-heritage-600 transition-colors hover:text-heritage-800"
          >
            عرض الكل
          </button>
        </div>
        <ul className="mt-4 grid gap-3 lg:grid-cols-3">
          {latest.map((book) => (
            <li
              key={book.id}
              className="rounded-xl border border-heritage-900/5 bg-sand p-3.5"
            >
              <p className="truncate font-heading text-xs font-extrabold text-heritage-900">
                {book.title}
              </p>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">
                {book.author ?? "مؤلف غير محدد"}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-heritage-100 px-2 py-0.5 text-[10px] font-medium text-heritage-700">
                  {book.categoryTitle ?? "غير مصنّف"}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    book.status === "published"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gold-100 text-gold-700"
                  }`}
                >
                  {book.status === "published" ? "منشور" : "مسودة"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
