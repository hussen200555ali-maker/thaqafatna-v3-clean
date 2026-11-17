import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readPlatformSettings } from "@/lib/admin/platform-settings";
import { getAdminLevelRow } from "@/lib/game/level-repo";
import { normalizePuzzle } from "@/lib/game/normalize";
import type { AdminLevelRow } from "@/lib/game/normalize";
import type { GameLevel, Question } from "@/lib/game/types";

/**
 * التوصية الذكية — تطبيق اللاعب
 * ===================================
 * GET /api/recommendation?progress=... — خمسة ألغاز موجهة حسب
 * تقدم اللاعب، حيث progress كائن {levelId: stars} مُرمَّز URL.
 *
 * أولوية الاختيار: المراحل غير المنجزة أو صفر النجوم أولاً، ثم
 * نجمة واحدة، ثم نجمتان — وبعد إكمال كل شيء بثلاث نجوم نخلط
 * حتمياً ببذرة تاريخ اليوم (نفس خوارزمية التحدي اليومي).
 * يعيد GameLevel JSON مباشرة (بلا غلاف ok).
 */

/** أنواع تُستبعد — تحتاج جداول إضافية لا تدعمها الجلسة السريعة */
const EXCLUDED_TYPES = new Set(["crossword", "mixed"]);

/** تطبيع ألغاز مرحلة مع استبعاد الشبكات والبوس والأصفار الفاشلة */
function eligibleQuestions(row: AdminLevelRow, hintCost: number): Question[] {
  const questions: Question[] = [];
  for (const puzzleRow of row.puzzles) {
    const type = puzzleRow.puzzleType?.trim().toLowerCase();
    if (type && EXCLUDED_TYPES.has(type)) continue;
    const question = normalizePuzzle(puzzleRow, hintCost);
    if (question) questions.push(question);
  }
  return questions;
}

/** تاريخ الرياض بصيغة YYYY-MM-DD — بذرة الخلط الحتمي */
function riyadhDateStr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
  }).format(new Date());
}

/** تحليل خريطة التقدم {levelId: stars} من الاستعلام — بشكل دفاعي */
function parseProgress(raw: string | null): Record<string, number> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter(([, value]) => typeof value === "number" && Number.isFinite(value))
        .map(([key, value]) => [key, value as number]),
    );
  } catch {
    /* JSON تالف — نتعامل مع التقدم كأنه فارغ */
    return {};
  }
}

export async function GET(request: Request) {
  try {
    const progress = parseProgress(
      new URL(request.url).searchParams.get("progress"),
    );
    const settings = await readPlatformSettings();
    const hintCost = settings.defaultHintCost;

    /* المراحل بترتيبها مع ألغازها المؤهلة المطبَّعة */
    const levelRows = await db.level.findMany({ orderBy: { order: "asc" } });
    const levels: Array<{ id: string; questions: Question[] }> = [];
    for (const levelRow of levelRows) {
      const row = await getAdminLevelRow(levelRow.id);
      if (!row) continue;
      levels.push({ id: row.id, questions: eligibleQuestions(row, hintCost) });
    }

    /* أولوية المرحلة: غير المنجزة أو صفر نجوم (0) ثم 1 ثم 2 ثم 3 */
    const priorityOf = (id: string): number => {
      const stars = progress[id];
      if (stars === undefined || stars <= 0) return 0;
      if (stars === 1) return 1;
      if (stars === 2) return 2;
      return 3;
    };

    /* فرز مستقر — يحفظ ترتيب order داخل كل شريحة أولوية */
    const ordered = [...levels].sort(
      (a, b) => priorityOf(a.id) - priorityOf(b.id),
    );

    /* هل بقي شيء غير مكتمل بثلاث نجوم؟ */
    const hasIncomplete = levels.some((level) => priorityOf(level.id) < 3);

    let picked: Question[];
    if (hasIncomplete) {
      /* جمع من المراحل حسب الأولوية — قطع عند خمسة ألغاز */
      picked = [];
      for (const level of ordered) {
        for (const question of level.questions) {
          picked.push(question);
          if (picked.length === 5) break;
        }
        if (picked.length === 5) break;
      }
    } else {
      /* كل شيء مكتمل بثلاث نجوم — خلط حتمي ببذلة تاريخ اليوم */
      const all = levels.flatMap((level) => level.questions);
      picked = [];
      if (all.length >= 5) {
        const dateStr = riyadhDateStr();
        const seed = [...dateStr].reduce(
          (sum, char) => sum + char.charCodeAt(0),
          0,
        );
        const start = seed % all.length;
        picked = Array.from(
          { length: 5 },
          (_, i) => all[(start + i) % all.length],
        );
      }
    }

    if (picked.length < 5) {
      return NextResponse.json(
        {
          error: "recommendation_insufficient",
          message:
            "لا تتوفر ألغاز كافية للتوصية الذكية — تحتاج المكتبة خمسة ألغاز مؤهلة على الأقل",
        },
        { status: 500 },
      );
    }

    const level: GameLevel = {
      id: "smart-session",
      title: "توصية ذكية لك",
      difficulty: "medium",
      timeLimit: 0,
      reward: settings.dailyChallengeReward,
      hintCost: settings.defaultHintCost,
      learningGoals: ["ألغاز موجهة حسب تقدمك", "تعزيز المراحل الأقل إنجازاً"],
      educationalDescription: "اخترنا لك هذه الألغاز لتقوية نقاط تقدمك",
      questions: picked,
    };

    return NextResponse.json(level, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[api/recommendation] تعذّر بناء التوصية الذكية:", error);
    return NextResponse.json(
      { error: "recommendation_failed", message: "تعذّر بناء التوصية الذكية" },
      { status: 500 },
    );
  }
}
