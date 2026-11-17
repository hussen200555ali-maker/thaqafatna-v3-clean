"use client";

/**
 * محرر المراحل — التحرير المباشر لقاعدة لوحة الإدارة
 * =======================================================
 * ثلاث طبقات: اختيار المرحلة (إن لم تُحدد) ← بطاقة بيانات المرحلة
 * (عنوان/صعوبة/وقت/مكافأة/تكلفة تلميح) ← قائمة الألغاز مع تحرير
 * كامل لحقولها وحذفها وإضافة ألغاز جديدة من الأنواع البسيطة.
 *
 * كل عملية تمر بـ API ثم تُعاد القراءة من القاعدة (المصدر الوحيد
 * للحقيقة) وتُسجَّل في سجل التدقيق وتُحدِّث شارة مدقق الجودة.
 */

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  Coins,
  Lightbulb,
  Pencil,
  Plus,
  Timer,
  Trash2,
} from "lucide-react";
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
import { difficultyLabels, puzzleTypeLabels } from "../admin-data";
import type {
  AdminChapter,
  AdminLevelDetail,
  AdminPuzzle,
} from "../admin-types";

interface LevelEditorPageProps {
  /** المرحلة المفتوحة — null يعني شاشة الاختيار */
  levelId: string | null;
  /** اختيار مرحلة من داخل الصفحة */
  onPickLevel: (levelId: string) => void;
  /** طلب تحديث شارة الجودة بعد التعديلات */
  refreshQuality: () => void;
}

/** أنواع الألغاز القابلة للإنشاء في هذا الجيل */
const CREATABLE_TYPES = ["text", "multiple", "emoji"] as const;

export function LevelEditorPage({
  levelId,
  onPickLevel,
  refreshQuality,
}: LevelEditorPageProps) {
  const { toast } = useToast();
  const [chapters, setChapters] = useState<AdminChapter[] | null>(null);
  const [level, setLevel] = useState<AdminLevelDetail | null>(null);
  const [loadingLevel, setLoadingLevel] = useState(false);

  /* ===== جلب فهرس الفصول — لشاشة الاختيار ودليل التنقل ===== */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/admin/chapters");
        const data = (await response.json()) as {
          ok: boolean;
          chapters?: AdminChapter[];
        };
        if (!cancelled && data.ok && data.chapters) setChapters(data.chapters);
      } catch {
        /* الفهرس اختياري عند فتح مرحلة مباشرة */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ===== جلب تفاصيل المرحلة المفتوحة ===== */
  const loadLevel = useCallback(
    async (id: string) => {
      setLoadingLevel(true);
      try {
        const response = await fetch(
          `/api/admin/levels/${encodeURIComponent(id)}`,
        );
        const data = (await response.json()) as {
          ok: boolean;
          level?: AdminLevelDetail;
        };
        if (data.ok && data.level) {
          setLevel(data.level);
        } else {
          toast({
            title: "تعذّر فتح المرحلة",
            description: "ربما حُذفت من القاعدة — اختر غيرها",
            variant: "destructive",
          });
          setLevel(null);
        }
      } catch {
        toast({
          title: "تعذّر الاتصال",
          description: "تحقق من الخادم ثم أعد المحاولة",
          variant: "destructive",
        });
      } finally {
        setLoadingLevel(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    if (levelId) {
      loadLevel(levelId);
    } else {
      setLevel(null);
    }
  }, [levelId, loadLevel]);

  /* ===== شاشة الاختيار — لم تُحدد مرحلة بعد ===== */
  if (!levelId || (!level && !loadingLevel && chapters)) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="محرر المراحل"
          description="اختر مرحلة لتحرير بياناتها وألغازها — كل شيء من قاعدة لوحة الإدارة مباشرة"
        />
        {chapters ? (
          <div className="space-y-5">
            {chapters.map((chapter) => (
              <section
                key={chapter.id}
                className="overflow-hidden rounded-2xl border border-heritage-900/5 bg-white shadow-card"
              >
                <div className="border-b border-heritage-900/5 bg-sand/60 px-5 py-3">
                  <h3 className="font-heading text-sm font-extrabold text-heritage-900">
                    {chapter.title}
                  </h3>
                </div>
                <ul className="divide-y divide-heritage-900/5">
                  {chapter.levels.map((level) => (
                    <li key={level.id}>
                      <button
                        type="button"
                        onClick={() => onPickLevel(level.id)}
                        className="flex w-full items-center gap-3 px-5 py-3 text-start transition-colors duration-150 hover:bg-sand/60"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-heritage-900 font-heading text-xs font-bold text-gold-400">
                          {level.order.toLocaleString("ar-EG")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold text-heritage-900">
                            {level.title}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            {level.puzzleCount.toLocaleString("ar-EG")} ألغاز —{" "}
                            {level.totalPoints.toLocaleString("ar-EG")} نقطة
                          </span>
                        </span>
                        <Pencil
                          className="size-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <AdminLoading />
        )}
      </div>
    );
  }

  if (loadingLevel || !level) return <AdminLoading />;

  /* ===== شاشة التحرير ===== */
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={level.title}
        description={`${level.chapterTitle ?? "بلا فصل"} — المرحلة رقم ${level.order.toLocaleString("ar-EG")} — ${level.puzzles.length.toLocaleString("ar-EG")} ألغاز`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPickLevel("")}
            className="gap-1.5"
          >
            <ArrowRight className="size-3.5" aria-hidden="true" />
            كل المراحل
          </Button>
        }
      />

      <LevelMetaCard
        level={level}
        onSaved={(updated) => {
          setLevel((current) =>
            current ? { ...current, ...updated } : current,
          );
          refreshQuality();
        }}
      />

      <PuzzlesSection
        level={level}
        onChanged={(puzzles) =>
          setLevel((current) => (current ? { ...current, puzzles } : current))
        }
        refreshQuality={refreshQuality}
      />
    </div>
  );
}

/* ============================================================
   بطاقة بيانات المرحلة — تحرير العنوان والاقتصاد والصعوبة
   ============================================================ */

function LevelMetaCard({
  level,
  onSaved,
}: {
  level: AdminLevelDetail;
  onSaved: (updated: Partial<AdminLevelDetail>) => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(level.title);
  const [difficulty, setDifficulty] = useState(level.difficulty ?? "");
  const [timeLimit, setTimeLimit] = useState(String(level.timeLimit ?? ""));
  const [reward, setReward] = useState(String(level.reward ?? ""));
  const [hintCost, setHintCost] = useState(String(level.hintCost ?? ""));
  const [saving, setSaving] = useState(false);

  const dirty =
    title !== level.title ||
    difficulty !== (level.difficulty ?? "") ||
    timeLimit !== String(level.timeLimit ?? "") ||
    reward !== String(level.reward ?? "") ||
    hintCost !== String(level.hintCost ?? "");

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/levels/${encodeURIComponent(level.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            difficulty: difficulty || null,
            timeLimit: timeLimit ? Number(timeLimit) : null,
            reward: reward ? Number(reward) : null,
            hintCost: hintCost ? Number(hintCost) : null,
          }),
        },
      );
      const data = (await response.json()) as {
        ok: boolean;
        level?: Partial<AdminLevelDetail>;
        error?: string;
      };
      if (data.ok && data.level) {
        onSaved(data.level);
        logAdminAction(
          "تعديل",
          "مرحلة",
          `تحديث بيانات «${title.trim()}» (${level.id})`,
        );
        toast({ title: "حُفظت بيانات المرحلة", description: level.title });
      } else {
        toast({
          title: "تعذّر الحفظ",
          description: data.error ?? "خطأ غير متوقع",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "تعذّر الاتصال",
        description: "تحقق من الخادم ثم أعد المحاولة",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="rounded-2xl border border-heritage-900/5 bg-white p-5 shadow-card"
      aria-label="بيانات المرحلة"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading text-sm font-extrabold text-heritage-900">
          بيانات المرحلة
        </h3>
        {dirty && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="gap-1.5"
          >
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            {saving ? "جارٍ الحفظ…" : "حفظ التعديلات"}
          </Button>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="meta-title" className="text-[11px]">
            العنوان
          </Label>
          <Input
            id="meta-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-9 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px]">الصعوبة</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="غير محددة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">{difficultyLabels.easy}</SelectItem>
              <SelectItem value="medium">{difficultyLabels.medium}</SelectItem>
              <SelectItem value="hard">{difficultyLabels.hard}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="meta-time" className="flex items-center gap-1 text-[11px]">
            <Timer className="size-3" aria-hidden="true" />
            الوقت (ثانية)
          </Label>
          <Input
            id="meta-time"
            type="number"
            min={0}
            value={timeLimit}
            onChange={(event) => setTimeLimit(event.target.value)}
            className="h-9 text-xs"
            placeholder="بلا وقت"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="meta-reward" className="flex items-center gap-1 text-[11px]">
            <Coins className="size-3" aria-hidden="true" />
            مكافأة الإكمال
          </Label>
          <Input
            id="meta-reward"
            type="number"
            min={0}
            value={reward}
            onChange={(event) => setReward(event.target.value)}
            className="h-9 text-xs"
            placeholder="بلا مكافأة"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="meta-hintcost" className="flex items-center gap-1 text-[11px]">
            <Lightbulb className="size-3" aria-hidden="true" />
            تكلفة التلميح الافتراضية
          </Label>
          <Input
            id="meta-hintcost"
            type="number"
            min={0}
            value={hintCost}
            onChange={(event) => setHintCost(event.target.value)}
            className="h-9 text-xs"
            placeholder="بلا تكلفة"
          />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   قائمة الألغاز — عرض وتحرير وحذف وإضافة
   ============================================================ */

function PuzzlesSection({
  level,
  onChanged,
  refreshQuality,
}: {
  level: AdminLevelDetail;
  onChanged: (puzzles: AdminPuzzle[]) => void;
  refreshQuality: () => void;
}) {
  const [editing, setEditing] = useState<AdminPuzzle | null>(null);
  const [deleting, setDeleting] = useState<AdminPuzzle | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toast } = useToast();

  /* حذف لغز — تأكيد ثم تنظيف العلاقات في الخلفية */
  const handleDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      const response = await fetch(
        `/api/admin/puzzles/${encodeURIComponent(deleting.id)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        onChanged(level.puzzles.filter((p) => p.id !== deleting.id));
        logAdminAction(
          "حذف",
          "لغز",
          `حذف لغز ${puzzleTypeLabels[deleting.puzzleType] ?? deleting.puzzleType} من «${level.title}»`,
        );
        refreshQuality();
        toast({ title: "حُذف اللغز", description: deleting.clue ?? "" });
      } else {
        toast({
          title: "تعذّر الحذف",
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
      setBusyId(null);
      setDeleting(null);
    }
  };

  /* إعادة القراءة من القاعدة بعد أي تعديل/إضافة */
  const reloadPuzzles = async () => {
    try {
      const response = await fetch(
        `/api/admin/levels/${encodeURIComponent(level.id)}`,
      );
      const data = (await response.json()) as {
        ok: boolean;
        level?: AdminLevelDetail;
      };
      if (data.ok && data.level) onChanged(data.level.puzzles);
    } catch {
      /* نُبقي القائمة الحالية — التعديل نفسه نجح */
    }
  };

  return (
    <section aria-label="ألغاز المرحلة">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-sm font-extrabold text-heritage-900">
          الألغاز ({level.puzzles.length.toLocaleString("ar-EG")})
        </h3>
        <Button
          size="sm"
          onClick={() => setCreating(true)}
          className="gap-1.5"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          لغز جديد
        </Button>
      </div>

      <ul className="mt-4 space-y-3">
        {level.puzzles.map((puzzle) => (
          <li
            key={puzzle.id}
            className="rounded-2xl border border-heritage-900/5 bg-white p-4 shadow-card"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-heritage-900 font-heading text-xs font-bold text-gold-400">
                  {(puzzle.order ?? 0).toLocaleString("ar-EG")}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-heritage-100 px-2.5 py-0.5 text-[10px] font-bold text-heritage-700">
                      {puzzleTypeLabels[puzzle.puzzleType] ?? puzzle.puzzleType}
                    </span>
                    {puzzle.category && (
                      <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-[10px] font-medium text-gold-700">
                        {puzzle.category}
                      </span>
                    )}
                    {puzzle.points != null && (
                      <span className="text-[10px] font-bold text-heritage-700">
                        {puzzle.points.toLocaleString("ar-EG")} نقطة
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-heritage-900">
                    {puzzle.clue ?? "بلا نص سؤال"}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">
                    الإجابة: {puzzle.text ?? puzzle.options ?? "—"}
                  </p>
                  {/* مؤشرا الاكتمال — تلميح وشرح */}
                  <div className="mt-2 flex items-center gap-3 text-[10px]">
                    <span
                      className={`flex items-center gap-1 ${
                        puzzle.hint ? "text-emerald-600" : "text-flame-500"
                      }`}
                    >
                      {puzzle.hint ? (
                        <BadgeCheck className="size-3" aria-hidden="true" />
                      ) : (
                        <CircleAlert className="size-3" aria-hidden="true" />
                      )}
                      تلميح
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        puzzle.explanation
                          ? "text-emerald-600"
                          : "text-flame-500"
                      }`}
                    >
                      {puzzle.explanation ? (
                        <BadgeCheck className="size-3" aria-hidden="true" />
                      ) : (
                        <CircleAlert className="size-3" aria-hidden="true" />
                      )}
                      شرح
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(puzzle)}
                  className="gap-1.5"
                >
                  <Pencil className="size-3" aria-hidden="true" />
                  تحرير
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleting(puzzle)}
                  disabled={busyId === puzzle.id}
                  className="gap-1.5"
                  aria-label={`حذف اللغز ${puzzle.order ?? ""}`}
                >
                  <Trash2 className="size-3" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* حوار تحرير اللغز */}
      {editing && (
        <PuzzleEditDialog
          puzzle={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reloadPuzzles();
            refreshQuality();
          }}
        />
      )}

      {/* حوار اللغز الجديد */}
      {creating && (
        <PuzzleCreateDialog
          levelId={level.id}
          onClose={() => setCreating(false)}
          onCreated={async () => {
            setCreating(false);
            await reloadPuzzles();
            refreshQuality();
          }}
        />
      )}

      {/* تأكيد الحذف */}
      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف اللغز نهائياً؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيُحذف «{deleting?.clue?.slice(0, 60) ?? "اللغز"}…» مع كل
              بياناته من قاعدة الإدارة — لا يمكن التراجع.
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
    </section>
  );
}

/* ============================================================
   حوار تحرير لغز — الحقول المشتركة + حقول النوع
   ============================================================ */

interface PuzzleFormState {
  clue: string;
  text: string;
  points: string;
  hintCost: string;
  hint: string;
  explanation: string;
  category: string;
  options: string;
  correctOption: string;
  emojis: string;
  imageUrl: string;
  audioUrl: string;
}

function puzzleToForm(puzzle: AdminPuzzle): PuzzleFormState {
  return {
    clue: puzzle.clue ?? "",
    text: puzzle.text ?? "",
    points: String(puzzle.points ?? ""),
    hintCost: String(puzzle.hintCost ?? ""),
    hint: puzzle.hint ?? "",
    explanation: puzzle.explanation ?? "",
    category: puzzle.category ?? "",
    options: puzzle.options ?? "",
    correctOption:
      puzzle.correctOption != null ? String(puzzle.correctOption) : "",
    emojis: puzzle.emojis ?? "",
    imageUrl: puzzle.imageUrl ?? "",
    audioUrl: puzzle.audioUrl ?? "",
  };
}

function PuzzleEditDialog({
  puzzle,
  onClose,
  onSaved,
}: {
  puzzle: AdminPuzzle;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<PuzzleFormState>(() =>
    puzzleToForm(puzzle),
  );
  const [saving, setSaving] = useState(false);

  const set = (key: keyof PuzzleFormState) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        clue: form.clue.trim() || null,
        text: form.text.trim() || null,
        points: form.points ? Number(form.points) : null,
        hintCost: form.hintCost ? Number(form.hintCost) : null,
        hint: form.hint.trim() || null,
        explanation: form.explanation.trim() || null,
        category: form.category.trim() || null,
      };
      if (puzzle.puzzleType === "multiple") {
        body.options = form.options.trim() || null;
        body.correctOption =
          form.correctOption !== "" ? Number(form.correctOption) : null;
      }
      if (puzzle.puzzleType === "emoji") {
        body.emojis = form.emojis.trim() || null;
      }
      if (form.imageUrl.trim()) body.imageUrl = form.imageUrl.trim();
      if (form.audioUrl.trim()) body.audioUrl = form.audioUrl.trim();

      const response = await fetch(
        `/api/admin/puzzles/${encodeURIComponent(puzzle.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        logAdminAction(
          "تعديل",
          "لغز",
          `تحرير لغز ${puzzleTypeLabels[puzzle.puzzleType] ?? puzzle.puzzleType} (${puzzle.id})`,
        );
        toast({ title: "حُفظ اللغز", description: form.clue.slice(0, 50) });
        onSaved();
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined} className="max-h-[85dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            تحرير اللغز — {puzzleTypeLabels[puzzle.puzzleType] ?? puzzle.puzzleType}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5">
          <Field label="نص السؤال">
            <Textarea
              value={form.clue}
              onChange={(event) => set("clue")(event.target.value)}
              rows={2}
              className="text-xs"
            />
          </Field>
          <Field label="الإجابة النصية">
            <Input
              value={form.text}
              onChange={(event) => set("text")(event.target.value)}
              className="h-9 text-xs"
            />
          </Field>
          {puzzle.puzzleType === "multiple" && (
            <>
              <Field label="الخيارات — مفصولة بـ |">
                <Input
                  value={form.options}
                  onChange={(event) => set("options")(event.target.value)}
                  className="h-9 text-xs"
                  placeholder="الخيار الأول|الخيار الثاني|الخيار الثالث"
                />
              </Field>
              <Field label="فهرس الإجابة الصحيحة — من صفر">
                <Input
                  type="number"
                  min={0}
                  value={form.correctOption}
                  onChange={(event) => set("correctOption")(event.target.value)}
                  className="h-9 text-xs"
                />
              </Field>
            </>
          )}
          {puzzle.puzzleType === "emoji" && (
            <Field label="رموز الإيموجي">
              <Input
                value={form.emojis}
                onChange={(event) => set("emojis")(event.target.value)}
                className="h-9 text-xs"
              />
            </Field>
          )}
          {puzzle.imageUrl !== null && (
            <Field label="رابط الصورة">
              <Input
                value={form.imageUrl}
                onChange={(event) => set("imageUrl")(event.target.value)}
                className="h-9 text-xs"
                dir="ltr"
              />
            </Field>
          )}
          {puzzle.audioUrl !== null && (
            <Field label="رابط الصوت">
              <Input
                value={form.audioUrl}
                onChange={(event) => set("audioUrl")(event.target.value)}
                className="h-9 text-xs"
                dir="ltr"
              />
            </Field>
          )}
          <div className="grid grid-cols-3 gap-3">
            <Field label="النقاط">
              <Input
                type="number"
                min={0}
                value={form.points}
                onChange={(event) => set("points")(event.target.value)}
                className="h-9 text-xs"
              />
            </Field>
            <Field label="تكلفة التلميح">
              <Input
                type="number"
                min={0}
                value={form.hintCost}
                onChange={(event) => set("hintCost")(event.target.value)}
                className="h-9 text-xs"
              />
            </Field>
            <Field label="الفئة">
              <Input
                value={form.category}
                onChange={(event) => set("category")(event.target.value)}
                className="h-9 text-xs"
              />
            </Field>
          </div>
          <Field label="التلميح">
            <Textarea
              value={form.hint}
              onChange={(event) => set("hint")(event.target.value)}
              rows={2}
              className="text-xs"
            />
          </Field>
          <Field label="الشرح التعليمي">
            <Textarea
              value={form.explanation}
              onChange={(event) => set("explanation")(event.target.value)}
              rows={2}
              className="text-xs"
            />
          </Field>
        </div>

        <div className="flex justify-start gap-2 pt-1">
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            {saving ? "جارٍ الحفظ…" : "حفظ اللغز"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   حوار اللغز الجديد — الأنواع البسيطة الثلاثة
   ============================================================ */

function PuzzleCreateDialog({
  levelId,
  onClose,
  onCreated,
}: {
  levelId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [type, setType] = useState<(typeof CREATABLE_TYPES)[number]>("text");
  const [clue, setClue] = useState("");
  const [text, setText] = useState("");
  const [options, setOptions] = useState("");
  const [correctOption, setCorrectOption] = useState("0");
  const [points, setPoints] = useState("40");
  const [hint, setHint] = useState("");
  const [explanation, setExplanation] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        levelId,
        puzzleType: type,
        clue: clue.trim(),
        points: points ? Number(points) : undefined,
        hint: hint.trim() || undefined,
        explanation: explanation.trim() || undefined,
        category: category.trim() || undefined,
      };
      if (type === "multiple") {
        body.options = options.trim();
        body.correctOption = Number(correctOption);
      } else {
        body.text = text.trim();
      }

      const response = await fetch("/api/admin/puzzles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        logAdminAction(
          "إنشاء",
          "لغز",
          `إضافة لغز ${puzzleTypeLabels[type]} إلى المرحلة (${levelId})`,
        );
        toast({ title: "أُضيف اللغز الجديد", description: clue.slice(0, 50) });
        onCreated();
      } else {
        toast({
          title: "تعذّر الإنشاء",
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

  const valid =
    clue.trim() &&
    (type === "multiple" ? options.trim() : text.trim());

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined} className="max-h-[85dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">لغز جديد</DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5">
          <Field label="النوع — الجيل الأول يدعم الأنواع البسيطة">
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CREATABLE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {puzzleTypeLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="نص السؤال">
            <Textarea
              value={clue}
              onChange={(event) => setClue(event.target.value)}
              rows={2}
              className="text-xs"
            />
          </Field>
          {type === "multiple" ? (
            <>
              <Field label="الخيارات — مفصولة بـ |">
                <Input
                  value={options}
                  onChange={(event) => setOptions(event.target.value)}
                  className="h-9 text-xs"
                  placeholder="الخيار الأول|الخيار الثاني|الخيار الثالث"
                />
              </Field>
              <Field label="فهرس الإجابة الصحيحة — من صفر">
                <Input
                  type="number"
                  min={0}
                  value={correctOption}
                  onChange={(event) => setCorrectOption(event.target.value)}
                  className="h-9 text-xs"
                />
              </Field>
            </>
          ) : (
            <Field label="الإجابة">
              <Input
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="h-9 text-xs"
              />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="النقاط">
              <Input
                type="number"
                min={0}
                value={points}
                onChange={(event) => setPoints(event.target.value)}
                className="h-9 text-xs"
              />
            </Field>
            <Field label="الفئة">
              <Input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-9 text-xs"
              />
            </Field>
          </div>
          <Field label="التلميح — اختياري">
            <Textarea
              value={hint}
              onChange={(event) => setHint(event.target.value)}
              rows={2}
              className="text-xs"
            />
          </Field>
          <Field label="الشرح التعليمي — اختياري">
            <Textarea
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              rows={2}
              className="text-xs"
            />
          </Field>
        </div>

        <div className="flex justify-start gap-2 pt-1">
          <Button onClick={handleCreate} disabled={saving || !valid} className="gap-1.5">
            <Plus className="size-3.5" aria-hidden="true" />
            {saving ? "جارٍ الإضافة…" : "إضافة إلى المرحلة"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   حقل نموذج موحّد — تسمية + عنصر تحكم
   ============================================================ */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-heritage-800">
        {label}
      </Label>
      {children}
    </div>
  );
}
