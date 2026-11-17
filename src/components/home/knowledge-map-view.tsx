"use client";

/**
 * شاشة «خريطة المعرفة» — مسار المحطات عبر الفصول
 * =================================================
 * شاشة كاملة داخل إطار التطبيق: فصول المراحل من GET /api/levels
 * تُجمَّع بترتيبها الوارد، وداخل كل فصل مسار محطات عمودي —
 * كل مرحلة عقدة دائرية: مكتملة بذهبي ونجومها تحتها، والحالية
 * بحدود لهب نابضة، والمقفلة رمادية بقفل.
 *
 * منطق القفل التدريجي: المرحلة i مفتوحة إذا كانت الأولى، أو
 * نجوم سابقتها > 0 (من مخزن اللاعب) — وما اكتمل لا يُقفل أبداً.
 * شبكة الأمان: القائمة الثابتة من data.ts عند تعذّر الاتصال.
 */

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  Flame,
  Lock,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useProgress } from "@/lib/game/progress-store";
import { beginnerLevels } from "./data";

/** واجهة خصائص الشاشة — الأب يشغّل المرحلة المختارة */
interface KnowledgeMapViewProps {
  onBack: () => void;
  /** يشغّل المرحلة من الأب بمعرّفها الحقيقي */
  onLaunchLevel: (levelId: string) => void;
}

/** مرحلة كما ترد من GET /api/levels — فهرس خفيف بلا ألغاز */
interface LevelHeader {
  id: string;
  number: number;
  title: string;
  description: string;
  difficulty: string | null;
  chapterTitle: string | null;
  puzzleCount: number;
  order: number;
}

/** شكل استجابة فهرس المراحل */
interface LevelsListResponse {
  ok: boolean;
  levels?: LevelHeader[];
}

/** شبكة أمان عند تعذّر الاتصال — القائمة الثابتة من data.ts */
const FALLBACK_LEVELS: LevelHeader[] = beginnerLevels.map(
  (level, index) => ({
    id: level.levelId,
    number: level.id,
    title: level.title,
    description: level.description,
    difficulty: null,
    chapterTitle: level.chapterTitle,
    puzzleCount: 5,
    order: index + 1,
  }),
);

export function KnowledgeMapView({
  onBack,
  onLaunchLevel,
}: KnowledgeMapViewProps) {
  const { toast } = useToast();
  const progress = useProgress();

  /* null = جارٍ الجلب — بعدها قائمة حية أو شبكة الأمان */
  const [levels, setLevels] = useState<LevelHeader[] | null>(null);

  /* ===== جلب فهرس المراحل — fallback صامت للقائمة الثابتة ===== */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/levels");
        const data = (await response.json()) as LevelsListResponse;
        if (cancelled) return;
        if (data.ok && Array.isArray(data.levels) && data.levels.length > 0) {
          setLevels(data.levels);
        } else {
          setLevels(FALLBACK_LEVELS);
        }
      } catch {
        if (!cancelled) setLevels(FALLBACK_LEVELS);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ===== تجميع المراحل تحت فصولها بترتيب الوارد ===== */
  const chapters = useMemo(() => {
    const groups: Array<{
      title: string;
      items: Array<{ header: LevelHeader; index: number }>;
    }> = [];
    (levels ?? []).forEach((header, index) => {
      const title = header.chapterTitle?.trim() || "مراحل عامة";
      const last = groups[groups.length - 1];
      if (last && last.title === title) {
        last.items.push({ header, index });
      } else {
        groups.push({ title, items: [{ header, index }] });
      }
    });
    return groups;
  }, [levels]);

  /* ===== حصيلة النجوم على خريطة المعرفة ===== */
  const totalEarned = useMemo(
    () =>
      (levels ?? []).reduce(
        (sum, header) => sum + (progress[header.id]?.stars ?? 0),
        0,
      ),
    [levels, progress],
  );
  const totalPossible = (levels?.length ?? 0) * 3;
  const starsPercent =
    totalPossible > 0
      ? Math.min(100, Math.round((totalEarned / totalPossible) * 100))
      : 0;

  /** نقر محطة — المفتوحة تُشغَّل، والمقفلة تُرشد بلطف */
  const handleNodeClick = (
    header: LevelHeader,
    locked: boolean,
    previousTitle: string | null,
  ) => {
    if (locked) {
      toast({
        title: "هذه المحطة مقفلة بعد",
        description: `أكمل المحطة السابقة «${previousTitle ?? "السابقة"}» أولاً`,
        variant: "destructive",
      });
      return;
    }
    onLaunchLevel(header.id);
  };

  return (
    <main className="space-y-5 px-4 pb-32 pt-4">
      {/* الترويسة — عودة + أيقونة تراثية + العنوان */}
      <header className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="رجوع"
          className="-me-1 text-heritage-700 hover:bg-sand-dark/50 hover:text-heritage-900"
        >
          <ArrowRight className="size-5" aria-hidden="true" />
        </Button>
        <span
          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-heritage-900 text-gold-400 shadow-card"
          aria-hidden="true"
        >
          <BookOpenText className="size-5.5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-extrabold text-heritage-900">
            خريطة المعرفة
          </h2>
          <p className="text-[11px] font-medium text-muted-foreground">
            رحلتك عبر الفصول والمراحل
          </p>
        </div>
      </header>

      {/* حالة التحميل — هياكل نابضة قبل وصول الفهرس */}
      {levels === null && (
        <div className="space-y-4" aria-busy="true">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-2xl bg-white/70 shadow-card"
            />
          ))}
        </div>
      )}

      {/* فصول الرحلة — بطاقة لكل فصل بمسار محطاته */}
      {levels !== null && (
        <div className="space-y-4">
          {chapters.map((chapter, chapterIndex) => (
            <section
              key={chapter.title}
              aria-label={chapter.title}
              className="overflow-hidden rounded-2xl bg-white shadow-card"
            >
              {/* ترويسة الفصل — شارة الرقم والعنوان وعدد المحطات */}
              <div className="flex items-center gap-2.5 border-b border-heritage-900/8 px-4 py-3.5">
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-xl bg-heritage-900 font-heading text-xs font-extrabold text-gold-400"
                  aria-hidden="true"
                >
                  {(chapterIndex + 1).toLocaleString("ar-EG")}
                </span>
                <h3 className="min-w-0 flex-1 truncate font-heading text-[13px] font-extrabold text-heritage-900">
                  {chapter.title}
                </h3>
                <span className="shrink-0 text-[10px] font-bold text-muted-foreground">
                  {chapter.items.length.toLocaleString("ar-EG")} محطات
                </span>
              </div>

              {/* مسار المحطات — خط عمودي يصل العقد */}
              <ol className="relative space-y-4 p-4">
                <span
                  className="pointer-events-none absolute inset-y-5 start-[35px] w-0.5 rounded-full bg-gradient-to-b from-gold-500/50 via-heritage-900/12 to-gold-500/30"
                  aria-hidden="true"
                />

                {chapter.items.map(({ header, index }) => {
                  const ownStars = progress[header.id]?.stars ?? 0;
                  const previous =
                    index > 0 ? (levels ?? [])[index - 1] : null;
                  const previousStars = previous
                    ? (progress[previous.id]?.stars ?? 0)
                    : 1;
                  /* المفتوحة: الأولى، أو بعد سابقة مكتملة — وما اكتمل لا يُقفل */
                  const locked =
                    index > 0 && ownStars === 0 && previousStars === 0;
                  const completed = ownStars > 0;

                  return (
                    <li
                      key={header.id}
                      className="relative flex items-start gap-3.5"
                    >
                      {/* العقدة — دائرة الحالة ونجوم الإنجاز تحتها */}
                      <span className="relative z-10 flex w-10 shrink-0 flex-col items-center gap-1">
                        <span
                          className={`relative grid size-10 place-items-center rounded-full font-heading text-sm font-extrabold ${
                            completed
                              ? "bg-gradient-to-br from-gold-400 to-gold-600 text-heritage-950 shadow-card"
                              : locked
                                ? "bg-heritage-900/8 text-heritage-900/35"
                                : "border-2 border-flame-500 bg-white text-flame-600"
                          }`}
                          aria-hidden="true"
                        >
                          {/* حدود اللهب النابضة — للمحطة الحالية فقط */}
                          {!completed && !locked && (
                            <span className="pointer-events-none absolute -inset-1 animate-pulse rounded-full border-2 border-flame-400/60" />
                          )}
                          {locked ? (
                            <Lock className="size-4" strokeWidth={2.4} />
                          ) : (
                            header.number.toLocaleString("ar-EG")
                          )}
                        </span>
                        {completed && (
                          <span
                            className="flex bg-white px-0.5"
                            role="img"
                            aria-label={`${ownStars.toLocaleString("ar-EG")} من ٣ نجوم`}
                          >
                            {[1, 2, 3].map((star) => (
                              <Star
                                key={star}
                                className={`size-2.5 ${
                                  star <= ownStars
                                    ? "fill-gold-500 text-gold-500"
                                    : "fill-transparent text-sand-darker"
                                }`}
                                aria-hidden="true"
                              />
                            ))}
                          </span>
                        )}
                      </span>

                      {/* جانب العقدة — العنوان والوصف وعدد الألغاز */}
                      <button
                        type="button"
                        onClick={() =>
                          handleNodeClick(
                            header,
                            locked,
                            previous?.title ?? null,
                          )
                        }
                        className="min-w-0 flex-1 pt-1 text-start transition-transform duration-150 active:scale-[0.99]"
                        aria-label={
                          locked
                            ? `${header.title}: مقفلة — أكمل المحطة السابقة أولاً`
                            : `${header.title}: ${header.description}`
                        }
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`truncate font-heading text-xs font-extrabold ${
                              locked
                                ? "text-heritage-900/45"
                                : "text-heritage-900"
                            }`}
                          >
                            {header.title}
                          </span>
                          {header.difficulty === "hard" && (
                            <Flame
                              className="size-3.5 shrink-0 text-flame-500"
                              aria-label="مرحلة صعبة"
                            />
                          )}
                        </span>
                        <span
                          className={`mt-0.5 block line-clamp-1 text-[10px] font-medium leading-snug ${
                            locked
                              ? "text-heritage-900/35"
                              : "text-muted-foreground"
                          }`}
                        >
                          {locked
                            ? "أكمل المحطة السابقة لتفتح هذه البوابة"
                            : header.description}
                        </span>
                        <span
                          className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            locked
                              ? "bg-sand-dark/60 text-heritage-900/40"
                              : "bg-sand text-heritage-700"
                          }`}
                        >
                          {header.puzzleCount.toLocaleString("ar-EG")} ألغاز
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}

      {/* الحصيلة الإجمالية — نجوم الخريطة كلها بشريط تقدم ذهبي */}
      {levels !== null && (
        <section
          aria-label="حصيلة النجوم"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-tl from-heritage-900 via-heritage-800 to-heritage-700 p-4 text-white shadow-card"
        >
          <span
            className="pointer-events-none absolute -bottom-10 -start-10 size-32 rounded-full bg-gold-500/15 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-heading text-sm font-extrabold">
              <Star
                className="size-4 fill-gold-400 text-gold-400"
                aria-hidden="true"
              />
              حصيلة النجوم
            </h3>
            <p className="text-[11px] font-bold text-gold-400">
              {totalEarned.toLocaleString("ar-EG")} من{" "}
              {totalPossible.toLocaleString("ar-EG")} نجمة
            </p>
          </div>
          <Progress
            value={starsPercent}
            className="relative mt-3 h-2 bg-white/15 [&_[data-slot=progress-indicator]]:bg-gradient-to-l [&_[data-slot=progress-indicator]]:from-gold-500 [&_[data-slot=progress-indicator]]:to-gold-400"
            aria-label={`نسبة النجوم ${starsPercent.toLocaleString("ar-EG")}%`}
          />
          <p className="relative mt-2 text-[10px] font-medium leading-relaxed text-heritage-100/60">
            {totalPossible > 0 && totalEarned >= totalPossible
              ? "اكتملت الخريطة بكل نجومها — إنجاز أسطوري!"
              : "اجمع ثلاث نجوم في كل محطة لتضيء الخريطة كاملة"}
          </p>
        </section>
      )}
    </main>
  );
}
