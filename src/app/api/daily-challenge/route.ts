import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readPlatformSettings } from "@/lib/admin/platform-settings";
import { getAdminLevelRow } from "@/lib/game/level-repo";
import { normalizePuzzle } from "@/lib/game/normalize";
import type { AdminLevelRow } from "@/lib/game/normalize";
import type { GameLevel, Question } from "@/lib/game/types";

/**
 * تحدي اليوم — تطبيق اللاعب
 * ================================
 * GET /api/daily-challenge — خمسة ألغاز حتمية تتبدل كل يوم.
 *
 * الحتمية: بذرة الانتقاء مجموع رموز تاريخ الرياض (YYYY-MM-DD)
 * فيتطابق التحدي لدى كل اللاعبين في اليوم نفسه — بلا تخزين إطلاقاً.
 * يعيد GameLevel JSON مباشرة (بنفس شكل /api/levels/:id بلا غلاف ok).
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

/** تاريخ الرياض بصيغة YYYY-MM-DD — مفتاح الحتمية اليومية */
function riyadhDateStr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
  }).format(new Date());
}

export async function GET() {
  try {
    const dateStr = riyadhDateStr();
    const settings = await readPlatformSettings();

    /* كل الألغاز المؤهلة بترتيب المراحل ثم ترتيب الألغاز داخلها */
    const levels = await db.level.findMany({ orderBy: { order: "asc" } });
    const questions: Question[] = [];
    for (const level of levels) {
      const row = await getAdminLevelRow(level.id);
      if (!row) continue;
      questions.push(...eligibleQuestions(row, settings.defaultHintCost));
    }

    if (questions.length < 5) {
      return NextResponse.json(
        {
          error: "daily_insufficient",
          message: "لا تتوفر ألغاز كافية لتحدي اليوم — تحتاج المكتبة خمسة ألغاز مؤهلة على الأقل",
        },
        { status: 500 },
      );
    }

    /* بذرة التاريخ — نفس اليوم يعني نفس التحدي للجميع */
    const seed = [...dateStr].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const start = seed % questions.length;
    const picked = Array.from(
      { length: 5 },
      (_, i) => questions[(start + i) % questions.length],
    );

    /* بناء الجلسة بعقد GameLevel المعتاد — بلا chapterTitle */
    const level: GameLevel = {
      id: `daily-${dateStr}`,
      title: "تحدي اليوم",
      difficulty: "medium",
      timeLimit: 0,
      reward: settings.dailyChallengeReward,
      hintCost: settings.defaultHintCost,
      learningGoals: [
        "خمسة ألغاز مختارة من فروع المعرفة العربية",
        "مكافأة كاملة أول إكمال في اليوم",
      ],
      educationalDescription: "تحدي يومي جديد يتبدل كل يوم — خمسة ألغاز من كل فروع المكتبة",
      questions: picked,
    };

    return NextResponse.json(
      { ...level, date: dateStr },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/daily-challenge] تعذّر تجهيز تحدي اليوم:", error);
    return NextResponse.json(
      { error: "daily_failed", message: "تعذّر تجهيز تحدي اليوم" },
      { status: 500 },
    );
  }
}
