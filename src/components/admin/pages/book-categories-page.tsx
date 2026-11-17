"use client";

/**
 * صفحة تصنيفات الكتب — المحاور المعرفية للمكتبة
 * ===================================================
 * شبكة بطاقات: عنوان التصنيف وعدد كتبه، مع إضافة وتحرير
 * وحذف (محجوب إن كان به كتب) — إدارة حقيقية كاملة.
 */

import { useCallback, useEffect, useState } from "react";
import { BookOpen, Pencil, Plus, Tags, Trash2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { logAdminAction } from "@/lib/admin/audit-store";
import { AdminPageHeader } from "../shared/admin-page-header";
import { AdminLoading } from "../shared/admin-loading";
import type { AdminCategory } from "../admin-types";

export function BookCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/categories");
      const data = (await response.json()) as {
        ok: boolean;
        categories?: AdminCategory[];
      };
      if (data.ok && data.categories) setCategories(data.categories);
    } catch {
      /* بطاقات التحميل تبقى */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    const isEdit = Boolean(editing);
    try {
      const response = await fetch(
        isEdit
          ? `/api/admin/categories/${encodeURIComponent(editing!.id)}`
          : "/api/admin/categories",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim() }),
        },
      );
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        logAdminAction(
          isEdit ? "تعديل" : "إنشاء",
          "تصنيف",
          `${isEdit ? "تحرير" : "إضافة"} تصنيف «${title.trim()}»`,
        );
        toast({
          title: isEdit ? "حُفظ التصنيف" : "أُضيف التصنيف",
          description: title,
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

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const response = await fetch(
        `/api/admin/categories/${encodeURIComponent(deleting.id)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        logAdminAction("حذف", "تصنيف", `حذف تصنيف «${deleting.title}»`);
        toast({ title: "حُذف التصنيف", description: deleting.title });
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

  if (!categories) return <AdminLoading />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="تصنيفات الكتب"
        description="المحاور التي تُنظَّم عليها المكتبة — إدارة التصنيفات وترتيبها"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setTitle("");
              setCreating(true);
            }}
            className="gap-1.5"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            تصنيف جديد
          </Button>
        }
      />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        {categories.map((category) => (
          <li
            key={category.id}
            className="group rounded-2xl border border-heritage-900/5 bg-white p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-heritage-100 text-heritage-700"
                aria-hidden="true"
              >
                <Tags className="size-4.5" />
              </div>
              <div className="flex gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTitle(category.title);
                    setEditing(category);
                  }}
                  aria-label={`تحرير ${category.title}`}
                  className="size-8 gap-0 p-0"
                >
                  <Pencil className="size-3" aria-hidden="true" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleting(category)}
                  aria-label={`حذف ${category.title}`}
                  className="size-8 gap-0 p-0"
                >
                  <Trash2 className="size-3" aria-hidden="true" />
                </Button>
              </div>
            </div>
            <p className="mt-3 truncate font-heading text-sm font-extrabold text-heritage-900">
              {category.title}
            </p>
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <BookOpen className="size-3" aria-hidden="true" />
              {category.bookCount.toLocaleString("ar-EG")} كتب
            </p>
          </li>
        ))}
      </ul>

      {/* حوار الإضافة والتحرير */}
      <Dialog
        open={creating || Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent aria-describedby={undefined} className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editing ? "تحرير التصنيف" : "تصنيف جديد"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="category-title" className="text-[11px]">
              العنوان *
            </Label>
            <Input
              id="category-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-9 text-xs"
              placeholder="مثال: الأدب الكلاسيكي"
            />
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
              {deleting && deleting.bookCount > 0
                ? `لا يمكن حذف تصنيف تابع له ${deleting.bookCount} كتب — انقل الكتب إلى تصنيف آخر أولاً.`
                : "سيُحذف التصنيف من قاعدة الإدارة — لا يمكن التراجع."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            {deleting && deleting.bookCount > 0 ? null : (
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-flame-600 hover:bg-flame-700"
              >
                حذف نهائي
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
