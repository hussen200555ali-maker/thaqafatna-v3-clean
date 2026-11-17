"use client";

/**
 * صفحة فصول الكتب — بنية الكتب الداخلية
 * ==========================================
 * اختيار كتاب من القائمة ثم إدارة فصوله: عرض مرتب وإضافة
 * وتحرير وحذف — كل شيء على القاعدة مباشرة.
 */

import { useCallback, useEffect, useState } from "react";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { AdminLoading } from "../shared/admin-loading";
import type { AdminBook, AdminBookChapter } from "../admin-types";

export function BookChaptersPage() {
  const { toast } = useToast();
  const [books, setBooks] = useState<AdminBook[] | null>(null);
  const [bookId, setBookId] = useState<string>("");
  const [chapters, setChapters] = useState<AdminBookChapter[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBookChapter | null>(null);
  const [deleting, setDeleting] = useState<AdminBookChapter | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  /* جلب الكتب — لاختيار الكتاب المستهدف */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/admin/books");
        const data = (await response.json()) as {
          ok: boolean;
          books?: AdminBook[];
        };
        if (!cancelled && data.ok && data.books) {
          setBooks(data.books);
          if (data.books.length > 0) setBookId(data.books[0].id);
        }
      } catch {
        /* بطاقات التحميل تبقى */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* جلب فصول الكتاب المختار عند تغيّره */
  const loadChapters = useCallback(async (id: string) => {
    setChapters(null);
    try {
      const response = await fetch(
        `/api/admin/book-chapters?bookId=${encodeURIComponent(id)}`,
      );
      const data = (await response.json()) as {
        ok: boolean;
        chapters?: AdminBookChapter[];
      };
      if (data.ok && data.chapters) setChapters(data.chapters);
      else setChapters([]);
    } catch {
      setChapters([]);
    }
  }, []);

  useEffect(() => {
    if (bookId) void loadChapters(bookId);
  }, [bookId, loadChapters]);

  const selectedBook = books?.find((book) => book.id === bookId) ?? null;

  const handleSave = async () => {
    if (!bookId) return;
    setSaving(true);
    const isEdit = Boolean(editing);
    try {
      const response = await fetch(
        isEdit
          ? `/api/admin/book-chapters/${encodeURIComponent(editing!.id)}`
          : "/api/admin/book-chapters",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEdit
              ? { title: title.trim(), content: content.trim() || null }
              : {
                  bookId,
                  title: title.trim(),
                  content: content.trim() || null,
                },
          ),
        },
      );
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        logAdminAction(
          isEdit ? "تعديل" : "إنشاء",
          "فصل كتاب",
          `${isEdit ? "تحرير" : "إضافة"} فصل «${title.trim()}»${selectedBook ? ` في «${selectedBook.title}»` : ""}`,
        );
        toast({
          title: isEdit ? "حُفظ الفصل" : "أُضيف الفصل",
          description: title,
        });
        setDialogOpen(false);
        setEditing(null);
        await loadChapters(bookId);
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

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const response = await fetch(
        `/api/admin/book-chapters/${encodeURIComponent(deleting.id)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        logAdminAction("حذف", "فصل كتاب", `حذف «${deleting.title}»`);
        toast({ title: "حُذف الفصل", description: deleting.title });
        if (bookId) await loadChapters(bookId);
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

  if (books.length === 0) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="فصول الكتب"
          description="بنية الكتب الداخلية — فصول كل كتاب بترتيبها"
        />
        <div className="rounded-2xl border border-heritage-900/5 bg-white p-10 text-center shadow-card">
          <FileText
            className="mx-auto size-8 text-muted-foreground/40"
            aria-hidden="true"
          />
          <p className="mt-3 font-heading text-sm font-bold text-heritage-900">
            لا كتب بعد
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            أضف كتاباً أولاً من صفحة الكتب ثم عد لإدارة فصوله
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="فصول الكتب"
        description="بنية الكتب الداخلية — فصول كل كتاب بترتيبها"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setTitle("");
              setContent("");
              setEditing(null);
              setDialogOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            فصل جديد
          </Button>
        }
      />

      {/* اختيار الكتاب */}
      <div className="max-w-sm space-y-1.5">
        <Label className="text-[11px]">الكتاب</Label>
        <Select value={bookId} onValueChange={setBookId}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="اختر كتاباً" />
          </SelectTrigger>
          <SelectContent>
            {books.map((book) => (
              <SelectItem key={book.id} value={book.id}>
                {book.title} ({book.chapterCount.toLocaleString("ar-EG")} فصول)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* فصول الكتاب */}
      {!chapters ? (
        <AdminLoading />
      ) : chapters.length === 0 ? (
        <div className="rounded-2xl border border-heritage-900/5 bg-white p-10 text-center shadow-card">
          <p className="font-heading text-sm font-bold text-heritage-900">
            «{selectedBook?.title}» بلا فصول بعد
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            أضف الفصل الأول ليبدأ بناء الكتاب
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {chapters.map((chapter) => (
            <li
              key={chapter.id}
              className="flex items-center gap-3 rounded-2xl border border-heritage-900/5 bg-white p-4 shadow-card"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-heritage-900 font-heading text-xs font-bold text-gold-400">
                {chapter.order.toLocaleString("ar-EG")}
              </span>
              <p className="min-w-0 flex-1 truncate text-xs font-bold text-heritage-900">
                {chapter.title}
              </p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  chapter.content
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gold-100 text-gold-700"
                }`}
              >
                {chapter.content ? "جاهز للقراءة" : "بلا محتوى"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTitle(chapter.title);
                  setContent(chapter.content ?? "");
                  setEditing(chapter);
                  setDialogOpen(true);
                }}
                className="gap-1.5"
              >
                <Pencil className="size-3" aria-hidden="true" />
                تحرير
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleting(chapter)}
                aria-label={`حذف ${chapter.title}`}
                className="gap-1.5"
              >
                <Trash2 className="size-3" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* حوار الإضافة والتحرير */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent aria-describedby={undefined} className="max-h-[85dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editing ? "تحرير الفصل" : `فصل جديد في «${selectedBook?.title}»`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="chapter-title" className="text-[11px]">
              عنوان الفصل *
            </Label>
            <Input
              id="chapter-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-9 text-xs"
              placeholder="مثال: باب الأسد والثور"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="chapter-content" className="text-[11px]">
              محتوى الفصل — يفصل بين الفقرات بسطر فارغ
            </Label>
            <Textarea
              id="chapter-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={10}
              maxLength={20000}
              placeholder={"الفقرة الأولى من نص الفصل…\n\nالفقرة الثانية…"}
              className="text-xs leading-relaxed"
            />
            <p className="text-[10px] text-muted-foreground">
              {(content.length / 1000).toLocaleString("ar-EG", {
                maximumFractionDigits: 1,
              })}{' '}ألف حرف تقريباً — يظهر مباشرة في قارئ المكتبة العامة
            </p>
          </div>
          <div className="flex justify-start gap-2 pt-1">
            <Button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="gap-1.5"
            >
              {saving ? "جارٍ الحفظ…" : editing ? "حفظ" : "إضافة"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
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
              سيُحذف الفصل من قاعدة الإدارة — لا يمكن التراجع.
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
