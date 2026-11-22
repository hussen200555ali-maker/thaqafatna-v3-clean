/**
 * طبقة التطبيع (Normalization Layer)
 * ======================================
 * الجسر الرسمي بين قاعدة بيانات لوحة الإدارة وعقد بيانات اللعبة:
 *
 *   صفوف Prisma المسطّحة  →  normalizePuzzle / normalizeLevel  →  GameLevel
 *
 * لماذا توجد هذه الطبقة؟
 *   لوحة الإدارة تخزّن بشكل «مخزني» ملائم للنماذج (خيارات مفصولة
 *   بـ |، وJSON نصي، وحقول image2Url..image4Url) — بينما الواجهة
 *   تستهلك أشكالاً «طبيعية» (مصفوفات، كائنات). فصلُ التحويل هنا
 *   يعني أن أي تغيير مستقبلي في مخزن الإدارة يُصلَّح في ملف واحد،
 *   ولا يلمس أي مُصيّر من مُصيّرات اللعبة الثلاثة عشر.
 *
 * مبادئ التصميم:
 *   1) صمّامات أمان (Null Guards): كل حقل اختياري يُفحص قبل القراءة.
 *   2) تفسير مزدوج للقوائم: JSON أولاً ثم الفواصل (|) — تُدعم لوحة
 *      الإدارة أياً كان أسلوب إدخالها.
 *   3) الفشل المنعزل: صفٌّ تالف لا يُسقط المرحلة — يُتخطى بتحذير
 *      منظم، والباقي يصل سليماً.
 *   4) نقاوة تامة: دوال نقية بلا آثار جانبية — قابلة للاختبار
 *      والاستدعاء من أي Route Handler أو Server Component.
 *
 * حالة الاستخدام الحالية: الإنتاج الفعلي — level-repo.ts يجلب صفوف
 * Prisma من قاعدة لوحة الإدارة ويمرّرها هنا حرفياً، وadmin-fixtures.ts
 * شبكة أمان فقط عند خلوّ القاعدة قبل البذر.
 */

import type {
  AnswerStateMap,
  AudioQuestion,
  CrosswordCell,
  CrosswordQuestion,
  CrosswordWord,
  EmojiQuestion,
  FillBlankQuestion,
  FillBlankSegment,
  GameLevel,
  ImageQuestion,
  Images4Question,
  LevelDifficulty,
  LogicQuestion,
  MatchingPair,
  MatchingQuestion,
  MultipleChoiceQuestion,
  ProgressiveQuestion,
  PuzzleType,
  Question,
  ScrambledQuestion,
  TextQuestion,
} from "./types";

/* ============================================================
   1) أشكال صفوف لوحة الإدارة — كما تُرجعها استعلامات Prisma
   ============================================================ */

/** خلية الشبكة المتقاطعة — نموذج Cell في لوحة الإدارة */
export interface AdminCellRow {
  row: number;
  col: number;
  /** null أو فارغ = خلية معطّلة (لا تُرسل للواجهة) */
  letter: string | null;
  /** رقم بداية الكلمة إن وجد */
  number: number | null;
}

/** كلمة الشبكة المتقاطعة — نموذج Word في لوحة الإدارة */
export interface AdminWordRow {
  number: number;
  /** قيمة الإدارة: across|down أو horizontal|vertical أو أفقي|رأسي */
  direction: string;
  row: number;
  col: number;
  length: number | null;
  clue: string | null;
  answer: string;
}

/** صف لغز واحد — نموذج Puzzle في لوحة الإدارة (حقول مسطّحة) */
export interface AdminPuzzleRow {
  id: string;
  puzzleType: string;
  /** نص السؤال/التلميح المعروض للاعب */
  clue: string | null;
  /** الإجابة النصية للأنواع الكلامية (نصي، مبعثرة، مصوّر...) */
  text: string | null;
  /** الخيارات — مفصولة بـ | في التخزين */
  options: string | null;
  /** فهرس الخيار الصحيح (من صفر) */
  correctOption: number | null;
  /** لوحة الحروف — مفصولة بـ | أو نصاً متصلاً */
  availableLetters: string | null;
  emojis: string | null;
  imageUrl: string | null;
  image2Url: string | null;
  image3Url: string | null;
  image4Url: string | null;
  audioUrl: string | null;
  /** JSON حرّ لبيانات اللغز الذهني */
  logicData: string | null;
  /** أزواج الربط — JSON نصي [{left,right}] أو left:right|... */
  matchPairs: string | null;
  /** نص إكمال الفراغات مع علامات ___ أو JSON مقاطع */
  fillBlanks: string | null;
  /** كلمات المكافأة للمبعثرة — مفصولة بـ | */
  bonusWords: string | null;
  /** إجابات فراغات مرتبة (بديل JSON المقاطع) — مفصولة بـ | */
  blankAnswers: string | null;
  /** تلميحات متدرجة — JSON مصفوفة نصية */
  hints: string | null;
  hint: string | null;
  explanation: string | null;
  points: number | null;
  hintCost: number | null;
  category: string | null;
  /** ترتيب السؤال داخل المرحلة */
  order: number | null;
  /** خلايا الشبكة المتقاطعة (علاقة) */
  cells?: AdminCellRow[] | null;
  /** كلمات الشبكة المتقاطعة (علاقة) */
  words?: AdminWordRow[] | null;
  /** أسئلة المرحلة المختلطة (علاقة) */
  stages?: AdminPuzzleRow[] | null;
}

/** صف مرحلة — نموذج Level في لوحة الإدارة */
export interface AdminLevelRow {
  id: string;
  title: string;
  /** easy | medium | hard (أو ما يقابلها عربياً) */
  difficulty: string | null;
  /** بالثواني — صفر يعني بلا وقت */
  timeLimit: number | null;
  reward: number | null;
  hintCost: number | null;
  /** JSON مصفوفة أو مفصولة بـ | */
  learningGoals: string | null;
  educationalDescription: string | null;
  /** علاقة الفصل — يُقرأ منها العنوان فقط */
  chapter?: { title: string | null } | null;
  puzzles: AdminPuzzleRow[];
}

/* ============================================================
   2) أدوات التحليل الدفاعية (Defensive Parsers)
   ============================================================ */

/** قراءة آمنة لقيمة رقمية اختيارية مع بدائل افتراضية */
function num(value: number | null | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** قراءة آمنة لنص اختياري */
function str(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * تفسير قائمة نصية بدعم مزدوج:
 *   1) JSON مصفوفة ["أ"، "ب"]
 *   2) نص مفصول بـ | أو أسطر
 */
function parseList(value: string | null): string[] {
  const raw = str(value);
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        return parsed.filter((v) => typeof v === "string" && v.trim()).map((v) => v.trim());
    } catch {
      /* ليس JSON سليماً — نجرب الفواصل */
    }
  }
  return raw
    .split(/[|\n]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * تفسير لوحة الحروف: مفصولة بـ | أو نصاً متصلاً حرفاً حرفاً
 * (Array.from يتعامل مع الحروف العربية أحادية الترميز بأمان).
 */
function parseLetters(value: string | null): string[] {
  const raw = str(value);
  if (!raw) return [];
  if (raw.includes("|")) {
    return raw
      .split("|")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return Array.from(raw.replace(/[\s\u0640]/g, ""));
}

/** تحليل JSON نصي بشكل آمن تماماً */
function safeJsonParse<T>(value: string | null): T | null {
  const raw = str(value);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** تسطيح قيمة رقمية قادمة من JSON (قد تصل نصاً من نماذج الإدخال) */
function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value)))
    return Number(value);
  return null;
}

/* ============================================================
   3) تطبيع لغز واحد — مفتاح switch على puzzleType
   ============================================================ */

/** بناء الحقول المشتركة من الصف (BaseQuestion) */
function baseFields<T extends PuzzleType>(
  row: AdminPuzzleRow,
  type: T,
  fallbackHintCost: number,
) {
  return {
    id: row.id,
    type,
    clue: str(row.clue) ?? "",
    category: str(row.category) ?? undefined,
    points: num(row.points, 50),
    hintCost: num(row.hintCost, fallbackHintCost),
    hint: str(row.hint) ?? undefined,
    explanation: str(row.explanation) ?? undefined,
  };
}

/**
 * تطبيع لغز واحد من صف الإدارة إلى عقد البيانات.
 * يُعيد null عند استحالة التطبيع (نوع مجهول أو بيانات ناقصة جوهرياً)
 * — مع تحذير منظم — فلا يُسقط صفٌّ تالفٌ مرحلةً كاملة أبداً.
 */
export function normalizePuzzle(
  row: AdminPuzzleRow,
  fallbackHintCost = 10,
): Question | null {
  const type = row.puzzleType?.trim().toLowerCase();

  switch (type) {
    /* ---------- 1) سؤال نصي ---------- */
    case "text": {
      const answer = str(row.text);
      if (!answer) return null;
      const question: TextQuestion = {
        ...baseFields(row, "text", fallbackHintCost),
        answer,
      };
      const length = asNumber(safeJsonParse<unknown>(row.logicData));
      if (length && length > 0) question.answerLength = length;
      return question;
    }

    /* ---------- 2) لغز مصوّر ---------- */
    case "image": {
      const imageUrl = str(row.imageUrl);
      const answer = str(row.text);
      if (!imageUrl || !answer) return null;
      const question: ImageQuestion = {
        ...baseFields(row, "image", fallbackHintCost),
        imageUrl,
        answer,
      };
      return question;
    }

    /* ---------- 3) أربع صور ---------- */
    case "images4": {
      const answer = str(row.text);
      const images = [row.imageUrl, row.image2Url, row.image3Url, row.image4Url]
        .map((v) => str(v))
        .filter((v): v is string => v !== null);
      if (images.length < 2 || !answer) return null;
      const question: Images4Question = {
        ...baseFields(row, "images4", fallbackHintCost),
        images,
        answer,
      };
      return question;
    }

    /* ---------- 4) لغز الإيموجي ---------- */
    case "emoji": {
      const emojis = str(row.emojis);
      const answer = str(row.text);
      if (!emojis || !answer) return null;
      const question: EmojiQuestion = {
        ...baseFields(row, "emoji", fallbackHintCost),
        emojis,
        answer,
      };
      return question;
    }

    /* ---------- 5) حروف مبعثرة ---------- */
    case "scrambled": {
      const answer = str(row.text);
      if (!answer) return null;
      const letters = parseLetters(row.availableLetters);
      const bonus = parseList(row.bonusWords);
      const question: ScrambledQuestion = {
        ...baseFields(row, "scrambled", fallbackHintCost),
        answer,
        letters: letters.length > 0 ? letters : Array.from(answer),
        ...(bonus.length > 0 ? { bonusWords: bonus } : {}),
      };
      return question;
    }

    /* ---------- 6) الشبكة المتقاطعة ---------- */
    case "crossword": {
      const cellRows = row.cells ?? [];
      const wordRows = row.words ?? [];
      if (cellRows.length === 0 || wordRows.length === 0) return null;

      /* الخلايا النشطة فقط — الخلايا المعطّلة لا تُرسل للواجهة */
      const cells: CrosswordCell[] = cellRows
        .filter((c) => str(c.letter) !== null)
        .map((c) => ({
          row: c.row,
          col: c.col,
          letter: str(c.letter) as string,
          ...(c.number !== null && c.number !== undefined ? { number: c.number } : {}),
        }));

      /* توحيد صيغ الاتجاه المدعومة في لوحة الإدارة */
      const normalizeDirection = (raw: string): "across" | "down" => {
        const d = raw.trim().toLowerCase();
        if (d === "down" || d === "vertical" || d.includes("رأس") || d.includes("رأسي"))
          return "down";
        return "across";
      };

      const words: CrosswordWord[] = wordRows.map((w) => ({
        number: w.number,
        direction: normalizeDirection(w.direction),
        row: w.row,
        col: w.col,
        length: num(w.length, Array.from(w.answer).length),
        clue: str(w.clue) ?? "",
        answer: w.answer,
      }));

      const rowsCount = cells.reduce((max, c) => Math.max(max, c.row + 1), 1);
      const colsCount = cells.reduce((max, c) => Math.max(max, c.col + 1), 1);
      const letters = parseLetters(row.availableLetters);

      const question: CrosswordQuestion = {
        ...baseFields(row, "crossword", fallbackHintCost),
        rows: rowsCount,
        cols: colsCount,
        cells,
        words,
        ...(letters.length > 0 ? { letters } : {}),
      };
      return question;
    }

    /* ---------- 7) إكمال الفراغات ---------- */
    case "fillblank": {
      const raw = str(row.fillBlanks);
      if (!raw) return null;

      /* المسار الأول: JSON مقاطع كامل (الأغنى — يدعم بنك كلمات مستقلاً) */
      const jsonSegments = safeJsonParse<
        Array<{ kind?: string; text?: string; answer?: string; width?: number }>
      >(raw);
      if (Array.isArray(jsonSegments) && jsonSegments.length > 0) {
        const segments: FillBlankSegment[] = [];
        let blankId = 0;
        for (const seg of jsonSegments) {
          if (seg?.kind === "blank" && seg.answer) {
            segments.push({
              kind: "blank",
              id: blankId++,
              answer: seg.answer,
              ...(seg.width ? { width: seg.width } : {}),
            });
          } else if (seg?.text) {
            segments.push({ kind: "text", text: seg.text });
          }
        }
        const bank = parseList(row.options);
        const answers = segments
          .filter((s): s is Extract<FillBlankSegment, { kind: "blank" }> => s.kind === "blank")
          .map((s) => s.answer);
        if (segments.length > 0) {
          const question: FillBlankQuestion = {
            ...baseFields(row, "fillblank", fallbackHintCost),
            segments,
            bank: bank.length > 0 ? bank : answers,
          };
          return question;
        }
      }

      /* المسار الثاني: نص حر بعلامات ___ وإجابات مرتبة في blankAnswers */
      const parts = raw.split(/_{3,}/);
      if (parts.length < 2) return null;
      const answers = parseList(row.blankAnswers);
      const segments: FillBlankSegment[] = [];
      parts.forEach((part, index) => {
        if (part.trim()) segments.push({ kind: "text", text: part.trim() });
        if (index < parts.length - 1)
          segments.push({
            kind: "blank",
            id: index,
            answer: answers[index] ?? "",
          });
      });
      const distractors = parseList(row.options);
      const bank = [...answers, ...distractors];
      const question: FillBlankQuestion = {
        ...baseFields(row, "fillblank", fallbackHintCost),
        segments,
        bank: bank.length > 0 ? bank : answers,
      };
      return question;
    }

    /* ---------- 8) توصيل وربط ---------- */
    case "matching": {
      const raw = str(row.matchPairs);
      if (!raw) return null;

      /* المسار الأول: JSON أزواج */
      let pairs: MatchingPair[] | null = null;
      const jsonPairs = safeJsonParse<Array<Record<string, unknown>>>(raw);
      if (Array.isArray(jsonPairs)) {
        pairs = jsonPairs
          .map((p) => ({
            left: str(String(p?.left ?? "")) ?? "",
            right: str(String(p?.right ?? "")) ?? "",
          }))
          .filter((p) => p.left && p.right);
      }

      /* المسار الثاني: نص مفصول — left:right|left:right */
      if (!pairs) {
        pairs = raw
          .split(/[|\n]/)
          .map((chunk) => chunk.trim())
          .filter(Boolean)
          .map((chunk) => {
            const [left, right] = chunk.split(/[:=]/).map((v) => v?.trim() ?? "");
            return { left: left ?? "", right: right ?? "" };
          })
          .filter((p) => p.left && p.right);
      }

      if (!pairs || pairs.length < 2) return null;
      const question: MatchingQuestion = {
        ...baseFields(row, "matching", fallbackHintCost),
        pairs,
      };
      return question;
    }

    /* ---------- 9) اختيار من متعدد ---------- */
    case "multiple": {
      const options = parseList(row.options);
      const correct = row.correctOption;
      if (options.length < 2 || correct === null || correct < 0 || correct >= options.length)
        return null;
      const question: MultipleChoiceQuestion = {
        ...baseFields(row, "multiple", fallbackHintCost),
        options,
        correctIndex: correct,
      };
      return question;
    }

    /* ---------- 10) لغز صوتي ---------- */
    case "audio": {
      const audioUrl = str(row.audioUrl);
      const answer = str(row.text);
      if (!audioUrl || !answer) return null;
      const letters = parseLetters(row.availableLetters);
      const question: AudioQuestion = {
        ...baseFields(row, "audio", fallbackHintCost),
        audioUrl,
        answer,
        ...(letters.length > 0 ? { letters } : {}),
      };
      return question;
    }

    /* ---------- 11) لغز ذهني ---------- */
    case "logic": {
      const data = safeJsonParse<Record<string, unknown>>(row.logicData);
      if (!data) return null;
      const question: LogicQuestion = {
        ...baseFields(row, "logic", fallbackHintCost),
        logicData: data,
      };
      return question;
    }

    /* ---------- 12) تلميحات متدرجة ---------- */
    case "progressive": {
      const answer = str(row.text);
      const hints = parseList(row.hints);
      if (!answer || hints.length === 0) return null;
      const letters = parseLetters(row.availableLetters);
      const question: ProgressiveQuestion = {
        ...baseFields(row, "progressive", fallbackHintCost),
        answer,
        hints,
        ...(letters.length > 0 ? { letters } : {}),
      };
      return question;
    }

    /* ---------- 13) مرحلة مختلطة (بوس) ---------- */
    case "mixed": {
      const stageRows = row.stages ?? [];
      if (stageRows.length === 0) return null;
      const stages = stageRows
        .map((stageRow) => normalizePuzzle(stageRow, fallbackHintCost))
        .filter((stage): stage is Question => stage !== null);
      if (stages.length === 0) return null;
      const question = {
        ...baseFields(row, "mixed", fallbackHintCost),
        stages,
      };
      return question;
    }

    /* ---------- نوع مجهول — فشل منعزل لا يُسقط المرحلة ---------- */
    default:
      console.warn(
        `[normalize] لغز برقم ${row.id} بنوع غير معروف «${row.puzzleType}» — تم تخطيه`,
      );
      return null;
  }
}

/* ============================================================
   4) تطبيع مرحلة كاملة — الصف + علاقاته
   ============================================================ */

/** خريطة قيم الصعوبة المدعومة (إنجليزية أو عربية) */
function normalizeDifficulty(raw: string | null): LevelDifficulty {
  const d = raw?.trim().toLowerCase();
  if (d === "easy" || d === "سهل" || d === "سهلة") return "easy";
  if (d === "hard" || d === "صعب" || d === "صعبة") return "hard";
  return "medium";
}

/**
 * تطبيع مرحلة كاملة من صف الإدارة — مع الفرز بترتيب order
 * وتصفية الألغاز الفاشلة بتحذيرات معزولة.
 */
export function normalizeLevel(row: AdminLevelRow): GameLevel {
  const hintCost = num(row.hintCost, 10);

  const questions = [...row.puzzles]
    .sort((a, b) => num(a.order, 0) - num(b.order, 0))
    .map((puzzleRow) => normalizePuzzle(puzzleRow, hintCost))
    .filter((q): q is Question => {
      if (q === null) {
        console.warn(
          `[normalize] تم تخطي لغز تالف من المرحلة «${row.title}» — البيانات ناقصة جوهرياً`,
        );
        return false;
      }
      return true;
    });

  return {
    id: row.id,
    title: str(row.title) ?? "مرحلة بلا عنوان",
    ...(str(row.chapter?.title ?? null)
      ? { chapterTitle: str(row.chapter?.title ?? null) ?? undefined }
      : {}),
    difficulty: normalizeDifficulty(row.difficulty),
    timeLimit: Math.max(0, num(row.timeLimit, 0)),
    reward: num(row.reward, 50),
    hintCost,
    learningGoals: parseList(row.learningGoals),
    ...(str(row.educationalDescription)
      ? { educationalDescription: str(row.educationalDescription) ?? undefined }
      : {}),
    questions,
  };
}

/* ============================================================
   5) مساعدات النوع (Type Guards) — للاستخدامات المستقبلية
   ============================================================ */

/** تحقق النوع لخريطة إجابة الربط (تُستخدم عند ربط الـ APIs) */
export function isMatchingAnswer(
  value: unknown,
): value is AnswerStateMap["matching"] {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => typeof v === "string")
  );
}
