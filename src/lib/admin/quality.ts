/**
 * مدقّق جودة المحتوى (Quality Service)
 * =====================================
 * خدمة خادم مشتركة تفحص كل مرحلة وكل لغز في قاعدة لوحة الإدارة
 * وتُنتج قائمة ملاحظات مصنّفة بثلاث درجات خطورة:
 *
 *   high   — خلل يمنع اللغز من العمل (بيانات جوهرية مفقودة)
 *   medium — نقص يُضعف التجربة التعليمية (تلميح/شرح/نقاط)
 *   low    — تحسين اقتصادي أو تنظيمي
 *
 * تُستخدم من مساري /api/admin/quality و /api/admin/stats —
 * فتتطابق شارة مدقّق الجودة في الشريط الجانبي مع الواقع دائماً.
 */

import { db } from "@/lib/db";

/** درجة خطورة الملاحظة */
export type QualitySeverity = "high" | "medium" | "low";

/** ملاحظة جودة واحدة — على لغز أو على مرحلة كاملة */
export interface QualityIssue {
  /** معرّف مستقر للملاحظة (للمفاتيح في الواجهة) */
  id: string;
  severity: QualitySeverity;
  levelId: string;
  levelTitle: string;
  /** null عندما تكون الملاحظة على المرحلة نفسها لا على لغز */
  puzzleId: string | null;
  puzzleType: string | null;
  message: string;
}

/** الأنواع الكلامية — إجابتها نصّية في حقل text */
const WORD_TYPES = new Set([
  "text",
  "emoji",
  "scrambled",
  "image",
  "images4",
  "progressive",
]);

/** ترتيب الخطورة للعرض */
const SEVERITY_ORDER: Record<QualitySeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/** جمع كل ملاحظات الجودة من قاعدة لوحة الإدارة */
export async function collectQualityIssues(): Promise<QualityIssue[]> {
  const levels = await db.level.findMany({
    include: {
      puzzles: {
        include: { _count: { select: { words: true } } },
      },
    },
  });

  const issues: QualityIssue[] = [];

  for (const level of levels) {
    /* ملاحظات على مستوى المرحلة */
    if (level.reward == null) {
      issues.push({
        id: `ql-${level.id}-reward`,
        severity: "low",
        levelId: level.id,
        levelTitle: level.title,
        puzzleId: null,
        puzzleType: null,
        message: "مرحلة بلا مكافأة إكمال",
      });
    }

    for (const puzzle of level.puzzles) {
      const push = (
        key: string,
        severity: QualitySeverity,
        message: string,
      ) => {
        issues.push({
          id: `q-${puzzle.id}-${key}`,
          severity,
          levelId: level.id,
          levelTitle: level.title,
          puzzleId: puzzle.id,
          puzzleType: puzzle.puzzleType,
          message,
        });
      };

      /* ===== عالية: بيانات جوهرية مفقودة ===== */
      if (!puzzle.clue?.trim()) push("clue", "high", "لغز بلا نص السؤال");
      if (WORD_TYPES.has(puzzle.puzzleType) && !puzzle.text?.trim()) {
        push("text", "high", "إجابة نصية مفقودة");
      }
      if (
        puzzle.puzzleType === "multiple" &&
        (!puzzle.options?.trim() || puzzle.correctOption == null)
      ) {
        push("options", "high", "خيارات أو فهرس الإجابة مفقود");
      }
      if (puzzle.puzzleType === "matching" && !puzzle.matchPairs?.trim()) {
        push("pairs", "high", "أزواج الربط مفقودة");
      }
      if (puzzle.puzzleType === "audio" && !puzzle.audioUrl?.trim()) {
        push("audio", "high", "ملف صوتي مفقود");
      }
      if (puzzle.puzzleType === "logic" && !puzzle.logicData?.trim()) {
        push("logic", "high", "بيانات اللغز الذهني مفقودة");
      }
      if (puzzle.puzzleType === "fillblank" && !puzzle.fillBlanks?.trim()) {
        push("blanks", "high", "نص الفراغات مفقود");
      }
      if (puzzle.puzzleType === "crossword" && puzzle._count.words === 0) {
        push("words", "high", "كلمات الشبكة مفقودة");
      }

      /* ===== متوسطة: تجربة تعليمية ناقصة ===== */
      if (!puzzle.hint?.trim()) push("hint", "medium", "بلا تلميح");
      if (!puzzle.explanation?.trim()) {
        push("explanation", "medium", "بلا شرح تعليمي");
      }
      if (puzzle.points == null || puzzle.points <= 0) {
        push("points", "medium", "نقاط غير معتمدة");
      }

      /* ===== منخفضة: اقتصاد وتنظيم ===== */
      if (puzzle.hintCost == null || puzzle.hintCost <= 0) {
        push("hintcost", "low", "تكلفة تلميح غير محددة");
      }
      if (
        puzzle.points != null &&
        puzzle.points > 0 &&
        puzzle.hintCost != null &&
        puzzle.hintCost >= puzzle.points
      ) {
        push("economy", "low", "اقتصاد تلميح غير متوازن");
      }
    }
  }

  /* عالية أولاً ثم متوسطة ثم منخفضة */
  return issues.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}

/** ملخّص عددي لملاحظات الجودة */
export function summarizeIssues(issues: QualityIssue[]) {
  const summary = { high: 0, medium: 0, low: 0, total: issues.length };
  for (const issue of issues) summary[issue.severity] += 1;
  return summary;
}
