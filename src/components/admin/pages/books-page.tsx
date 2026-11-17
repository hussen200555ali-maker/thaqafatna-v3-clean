"use client";

/**
 * صفحة الكتب — فهرس المكتبة الكامل بإدارة حقيقية
 * ====================================================
 * بحث وتصفية بالتصنيف والحالة + إضافة وتحرير وحذف — كلها
 * على قاعدة لوحة الإدارة مباشرة، وكل عملية تُسجَّل في التدقيق.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, FileText, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { logAdminAction } from "@/lib/admin/audit-store";
import { AdminPageHeader } from "../shared/admin-page-header";
import { AdminLoading } from "../shared/admin-loading";
import type { AdminBook, AdminCategory } from "../admin-types";

interface BookFormData {
  title: string;
  author: string;
  description: string;
  categoryId: string;
  status: string;
}

const EMPTY_FORM: BookFormData = {
  title: "",
  author: "",
  description: "",
  categoryId: "",
  status: "published",
};

export function BooksPage() {
  const { toast } = useToast();
  const [books, setBooks] = useState<AdminBook[] | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<AdminBook | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AdminBook | null>(null);
  const [form, setForm] = useState<BookFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  /* جلب الكتب والتصنيفات معاً */
  const load = useCallback(async () => {
    try {
      const [booksResponse, categoriesResponse] = await Promise.all([
        fetch("/api/admin/books"),
        fetch("/api/admin/categories"),
      ]);
      const booksData = (await booksResponse.json()) as {
        ok: boolean;
        books?: AdminBook[];
      };
      const categoriesData = (await categoriesResponse.json()) as {
        ok: boolean;
        categories?: AdminCategory[];
      };
      if (booksData.ok && booksData.books) setBooks(booksData.books);
      if (categoriesData.ok && categoriesData.categories) {
        setCategories(categoriesData.categories);
      }
    } catch {
      /* تبقى بطاقات التحميل */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* التصفية المزدوجة — بحث + تصنيف + حالة */
  const visible = useMemo(() => {
    if (!books) return [];
    const q = query.trim();
    return books.filter((book) => {
      if (q && !book.title.includes(q) && !(book.author ?? "").includes(q)) {
        return false;
      }
      if (categoryFilter !== "all" && book.categoryId !== categoryFilter) {
        return false;
      }
      if (statusFilter !== "all" && book.status !== statusFilter) return false;
      return true;
    });
  }, [books, query, categoryFilter, statusFilter]);

  /* فتح حوار الإضافة */
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCreating(true);
  };

  /* فتح حوار التحرير — يملأ النموذج من الكتاب */
  const openEdit = (book: AdminBook) => {
    setForm({
      title: book.title,
      author: book.author ?? "",
      description: book.description ?? "",
      categoryId: book.categoryId ?? "",
      status: book.status,
    });
    setEditing(book);
  };

  /* حفظ — إنشاء أو تحرير حسب الحوار المفتوح */
  const handleSave = async () => {
    setSaving(true);
    const isEdit = Boolean(editing);
    try {
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        author: form.author.trim() || null,
        description: form.description.trim() || null,
        status: form.status,
      };
      if (form.categoryId) body.categoryId = form.categoryId;
      else if (isEdit) body.categoryId = null;

      const response = await fetch(
        isEdit
          ? `/api/admin/books/${encodeURIComponent(editing!.id)}`
          : "/api/admin/books",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        logAdminAction(
          isEdit ? "تعديل" : "إنشاء",
          "كتاب",
          `${isEdit ? "تحرير" : "إضافة"} كتاب «${form.title.trim()}»`,
        );
        toast({
          title: isEdit ? "حُفظ الكتاب" : "أُضيف الكتاب",
          description: form.title,
        });
        setCreating(false);
        setEditing(null);
        await load();
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

  /* حذف كتاب مع فصوله */
  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const response = await fetch(
        `/api/admin/books/${encodeURIComponent(deleting.id)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        logAdminAction("حذف", "كتاب", `حذف «${deleting.title}» وفصوله`);
        toast({ title: "حُذف الكتاب", description: deleting.title });
        await load();
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
      setDeleting(null);
    }
  };

  if (!books) return <AdminLoading />;

  const dialogOpen = creating || Boolean(editing);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="الكتب"
        description="فهرس كتب المكتبة كاملاً — إضافة وتحرير وحذف وحالات النشر"
        actions={
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="size-3.5" aria-hidden="true" />
            كتاب جديد
          </Button>
        }
      />

      {/* شريط الأدوات — بحث وتصفية */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-44 flex-1">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث بعنوان الكتاب أو مؤلفه..."
            className="h-9 pl-8 text-xs"
          />
          <Search
            className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل التصنيفات</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="published">منشور</SelectItem>
            <SelectItem value="draft">مسودة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* قائمة الكتب */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-heritage-900/5 bg-white p-10 text-center shadow-card">
          <BookOpen
            className="mx-auto size-8 text-muted-foreground/40"
            aria-hidden="true"
          />
          <p className="mt-3 font-heading text-sm font-bold text-heritage-900">
            لا نتائج مطابقة
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            جرّب تعديل البحث أو التصفية — أو أضف كتاباً جديداً
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {visible.map((book) => (
            <li
              key={book.id}
              className="flex items-start gap-4 rounded-2xl border border-heritage-900/5 bg-white p-4 shadow-card"
            >
              {/* غلاف رمزي — الحرف الأول بعنوان الكتاب */}
              <div
                className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-heritage-800 to-heritage-600 font-heading text-lg font-extrabold text-gold-400"
                aria-hidden="true"
              >
                {book.title.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="truncate font-heading text-sm font-extrabold text-heritage-900">
                    {book.title}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      book.status === "published"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gold-100 text-gold-700"
                    }`}
                  >
                    {book.status === "published" ? "منشور" : "مسودة"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {book.author ?? "مؤلف غير محدد"}
                </p>
                <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-heritage-900/70">
                  {book.description ?? "بلا وصف"}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-heritage-100 px-2.5 py-0.5 text-[10px] font-medium text-heritage-700">
                    {book.categoryTitle ?? "غير مصنّف"}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                    <FileText className="size-3" aria-hidden="true" />
                    {book.chapterCount.toLocaleString("ar-EG")} فصول
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(book)}
                  className="gap-1.5"
                >
                  <Pencil className="size-3" aria-hidden="true" />
                  تحرير
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleting(book)}
                  aria-label={`حذف ${book.title}`}
                  className="gap-1.5"
                >
                  <Trash2 className="size-3" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* حوار الإضافة والتحرير — نموذج واحد لدورين */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCreating(false);
          setEditing(null);
        }
      }}>
        <DialogContent aria-describedby={undefined} className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editing ? `تحرير «${editing.title}»` : "كتاب جديد"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="book-title" className="text-[11px]">
                العنوان *
              </Label>
              <Input
                id="book-title"
                value={form.title}
                onChange={(event) =>
                  setForm((f) => ({ ...f, title: event.target.value }))
                }
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="book-author" className="text-[11px]">
                المؤلف
              </Label>
              <Input
                id="book-author"
                value={form.author}
                onChange={(event) =>
                  setForm((f) => ({ ...f, author: event.target.value }))
                }
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="book-desc" className="text-[11px]">
                الوصف
              </Label>
              <Textarea
                id="book-desc"
                value={form.description}
                onChange={(event) =>
                  setForm((f) => ({ ...f, description: event.target.value }))
                }
                rows={3}
                className="text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px]">التصنيف</Label>
                <Select
                  value={form.categoryId || "none"}
                  onValueChange={(value) =>
                    setForm((f) => ({
                      ...f,
                      categoryId: value === "none" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="غير مصنّف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">غير مصنّف</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">الحالة</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, status: value }))
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">منشور</SelectItem>
                    <SelectItem value="draft">مسودة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-start gap-2 pt-1">
            <Button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="gap-1.5"
            >
              {saving ? "جارٍ الحفظ…" : editing ? "حفظ التعديلات" : "إضافة الكتاب"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* تأكيد الحذف */}
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف «{deleting?.title}»؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيُحذف الكتاب مع فصوله ({deleting?.chapterCount ?? 0}) من قاعدة
              الإدارة نهائياً — لا يمكن التراجع.
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
