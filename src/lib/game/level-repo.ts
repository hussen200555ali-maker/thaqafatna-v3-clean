/**
 * مستودع المراحل (Level Repository)
 * =====================================
 * الجسر الحيّ بين قاعدة بيانات لوحة الإدارة (Prisma) وطبقة التطبيع:
 *
 *   استعلام Prisma (علاقات كاملة)  →  getAdminLevelRow  →  AdminLevelRow
 *        → normalizeLevel (دون تغيير حرف)  →  عقد الواجهة
 *
 * مبدأ الخرائط (Mapping): كل ما يفعله هذا الملف هو إعادة تشكيل
 * صفوف Prisma إلى شكل AdminLevelRow حرفياً — فلا تعرف طبقة
 * التطبيع شيئاً عن Prisma، ولا تعرف نماذج Prisma شيئاً عن الواجهة.
 *
 * تحليل المعرّف: يقبل «2» و«level-2» معاً — تلبية لعادات الاستدعاء
 * المختلفة (فهرس رقمي من الرئيسية أو معرّف الإدارة الكامل).
 */

import type {
  Cell as PrismaCell,
  Puzzle as PrismaPuzzle,
  Word as PrismaWord,
} from "@prisma/client";
import { db } from "@/lib/db";
import type {
  AdminLevelRow,
  AdminPuzzleRow,
  AdminWordRow,
} from "./normalize";

/* ============================================================
   1) أشكال العلاقات المضمّنة — كما يعيدها استعلام المستودع
   ============================================================ */

/** محطة بوس: وصل مرتّب يحمل لغز المحطة بعلاقاته */
interface MixedStageWithPuzzle {
  order: number;
  stagePuzzle: PrismaPuzzle & {
    cells: PrismaCell[];
    words: PrismaWord[];
  };
}

/** صف لغز بكل العلاقات التي يحتاجها التطبيع */
type PuzzleWithRelations = PrismaPuzzle & {
  cells: PrismaCell[];
  words: PrismaWord[];
  parentLinks: MixedStageWithPuzzle[];
};

/* ============================================================
   2) الخرائط — من صفوف Prisma إلى أشكال الإدارة
   ============================================================ */

/** تحويل صف لغز (بعلاقاته) إلى شكل AdminPuzzleRow */
function mapPuzzleRow(puzzle: PuzzleWithRelations): AdminPuzzleRow {
  return {
    id: puzzle.id,
    puzzleType: puzzle.puzzleType,
    clue: puzzle.clue,
    text: puzzle.text,
    options: puzzle.options,
    correctOption: puzzle.correctOption,
    availableLetters: puzzle.availableLetters,
    emojis: puzzle.emojis,
    imageUrl: puzzle.imageUrl,
    image2Url: puzzle.image2Url,
    image3Url: puzzle.image3Url,
    image4Url: puzzle.image4Url,
    audioUrl: puzzle.audioUrl,
    logicData: puzzle.logicData,
    matchPairs: puzzle.matchPairs,
    fillBlanks: puzzle.fillBlanks,
    bonusWords: puzzle.bonusWords,
    blankAnswers: puzzle.blankAnswers,
    hints: puzzle.hints,
    hint: puzzle.hint,
    explanation: puzzle.explanation,
    points: puzzle.points,
    hintCost: puzzle.hintCost,
    category: puzzle.category,
    order: puzzle.order,
    /* علاقات الشبكة المتقاطعة — حارس الصفر: المحطات المتداخلة
     * تصل بعلاقات جزئية (بلا parentLinks) فلا نفترض وجودها أبداً */
    cells:
      (puzzle.cells ?? []).length > 0
        ? (puzzle.cells ?? []).map((c) => ({
            row: c.row,
            col: c.col,
            letter: c.letter,
            number: c.number,
          }))
        : null,
    words:
      (puzzle.words ?? []).length > 0
        ? (puzzle.words ?? []).map<AdminWordRow>((w) => ({
            number: w.number,
            direction: w.direction,
            row: w.row,
            col: w.col,
            length: w.length,
            clue: w.clue,
            answer: w.answer,
          }))
        : null,
    /* محطات المرحلة المختلطة — مرتّبة بترتيب الوصل */
    stages:
      (puzzle.parentLinks ?? []).length > 0
        ? [...(puzzle.parentLinks ?? [])]
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((link) => mapPuzzleRow(link.stagePuzzle as PuzzleWithRelations))
        : null,
  };
}

/* ============================================================
   3) الاستعلام الرئيسي — مرحلة كاملة بعلاقاتها
   ============================================================ */

/** جلب صف مرحلة من قاعدة لوحة الإدارة بمعرّفها */
export async function getAdminLevelRow(
  id: string,
): Promise<AdminLevelRow | null> {
  /* المعرّف المرن: «2» أو «level-2» — نجرّب الصيغتين */
  const candidates =
    id.startsWith("level-") && id.length > "level-".length
      ? [id, id.slice("level-".length)]
      : [`level-${id}`, id];

  for (const candidate of candidates) {
    const level = await db.level.findUnique({
      where: { id: candidate },
      include: {
        chapter: { select: { title: true } },
        puzzles: {
          orderBy: { order: "asc" },
          include: {
            cells: true,
            words: true,
            parentLinks: {
              orderBy: { order: "asc" },
              include: {
                stagePuzzle: { include: { cells: true, words: true } },
              },
            },
          },
        },
      },
    });
    if (!level) continue;

    return {
      id: level.id,
      title: level.title,
      difficulty: level.difficulty,
      timeLimit: level.timeLimit,
      reward: level.reward,
      hintCost: level.hintCost,
      learningGoals: level.learningGoals,
      educationalDescription: level.educationalDescription,
      chapter: level.chapter ? { title: level.chapter.title } : null,
      puzzles: level.puzzles.map(mapPuzzleRow),
    };
  }

  return null;
}

/* ============================================================
   4) فهرس المراحل — قائمة «البدايات» في الصفحة الرئيسية
   ============================================================ */

/** رأس مرحلة — كل ما تحتاجه بطاقة القائمة دون تحميل الألغاز */
export interface LevelHeader {
  /** المعرّف الكامل (level-1) */
  id: string;
  /** الرقم الترتيبي للعرض (1) */
  number: number;
  title: string;
  /** الوصف التعليمي — سطر البطاقة */
  description: string;
  /** easy | medium | hard — كما تخزنها الإدارة */
  difficulty: string | null;
  /** عنوان الفصل الأم */
  chapterTitle: string | null;
  /** عدد الألغاز داخل المرحلة */
  puzzleCount: number;
  /** ترتيب العرض */
  order: number;
}

/** قائمة رؤوس المراحل المتاحة مرتّبة — دون تحميل الألغاز */
export async function listLevelHeaders(): Promise<LevelHeader[]> {
  const levels = await db.level.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      difficulty: true,
      educationalDescription: true,
      learningGoals: true,
      order: true,
      chapter: { select: { title: true } },
      _count: { select: { puzzles: true } },
    },
  });

  return levels.map((level) => ({
    id: level.id,
    number: level.order,
    title: level.title,
    description:
      level.educationalDescription?.trim() ||
      level.learningGoals?.split(/[|\n]/)[0]?.trim() ||
      "مرحلة جديدة بانتظارك",
    difficulty: level.difficulty,
    chapterTitle: level.chapter?.title ?? null,
    puzzleCount: level._count.puzzles,
    order: level.order,
  }));
}
