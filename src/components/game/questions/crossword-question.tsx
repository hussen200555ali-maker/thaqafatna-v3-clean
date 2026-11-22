"use client";

/**
 * مُصيّر «الشبكة المتقاطعة» (Crossword)
 * ========================================
 * أكثر المُصيّرات تفاعلية — واجهته ثلاث طبقات:
 *
 *   1) الشبكة: CSS Grid بوضع صريح. في RTL يكون العمود 0 هو
 *      الأيمن، فتُقرأ الكلمات الأفقية طبيعياً من اليمين لليسار.
 *
 *   2) قائمة التلميحات: كلمات أفقي/عمودي، تُبرَز الكلمة النشطة
 *      وتُشطب الكلمات المحلولة.
 *
 *   3) لوحة الحروف التراثية الداكنة: مشتقة من حقل
 *      availableLetters (أو من حروف الشبكة تلقائياً).
 *
 * سلوك «التحقق الصامت»: كل كلمة تكتمل تُفحص فوراً؛ إن كانت صحيحة
 * تُقفل بخلايا زمردية وينتقل التحديد تلقائياً للكلمة التالية —
 * دون انتظار زر التأكيد (لحظة «الوورد جيم» الممتعة).
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Delete,
  MoveHorizontal,
  MoveVertical,
} from "lucide-react";
import type {
  CrosswordCell,
  CrosswordQuestion,
  CrosswordWord,
  QuestionRendererProps,
} from "@/lib/game/types";

/** مفتاح خلية داخل الشبكة — "صف:عمود" */
const keyOf = (row: number, col: number): string => `${row}:${col}`;

/** مفتاح كلمة فريد داخل القائمة */
const wordKey = (word: CrosswordWord): string =>
  `${word.number}-${word.direction}`;

export function CrosswordQuestion({
  question,
  answer,
  onAnswerChange,
  status,
}: QuestionRendererProps) {
  const q = question as CrosswordQuestion;
  const lockedInputs = status !== "answering";

  /* ===== خرائط البنية ===== */

  const cellMap = useMemo(() => {
    const map = new Map<string, CrosswordCell>();
    for (const cell of q.cells) map.set(keyOf(cell.row, cell.col), cell);
    return map;
  }, [q.cells]);

  /** خلايا كلمة معينة بترتيب قراءتها */
  const wordCells = useMemo(
    () =>
      (word: CrosswordWord): CrosswordCell[] =>
        Array.from({ length: word.length }, (_, i) =>
          cellMap.get(
            keyOf(
              word.row + (word.direction === "down" ? i : 0),
              word.col + (word.direction === "across" ? i : 0),
            ),
          ),
        ).filter((c): c is CrosswordCell => Boolean(c)),
    [cellMap],
  );

  /** حروف اللاعب الحالية — تطبيع الحالة القادمة من الحاوية */
  const letters: Record<string, string> = useMemo(
    () =>
      answer && typeof answer === "object"
        ? (answer as Record<string, string>)
        : {},
    [answer],
  );

  /* ===== الحالة المحلية: التحديد والأقفال ===== */

  const [activeWordKeyValue, setActiveWordKeyValue] = useState<string>(() =>
    wordKey(q.words[0]),
  );
  /** الخلية النشطة — تُهيَّن بأول خلية فارغة في الكلمة الأولى
   *  حتى يستجيب اللاعب فوراً لمس الحروف دون لمس الشبكة أولاً */
  const [activeCellKeyValue, setActiveCellKeyValue] = useState<string | null>(
    () => {
      for (const cell of wordCells(q.words[0])) {
        const key = keyOf(cell.row, cell.col);
        if (!letters[key]) return key;
      }
      return null;
    },
  );
  /** خلايا الكلمات المحلولة صحيحة — مُقفلة بضوء زمردي */
  const [solved, setSolved] = useState<ReadonlySet<string>>(new Set());

  const activeWord =
    q.words.find((w) => wordKey(w) === activeWordKeyValue) ?? q.words[0];
  const activeCells = useMemo(
    () => wordCells(activeWord),
    [activeWord, wordCells],
  );

  /** أول خلية قابلة للتحرير (فارغة وغير مقفلة) في كلمة */
  const firstEditableCell = (
    word: CrosswordWord,
    lettersNow: Record<string, string>,
    solvedNow: ReadonlySet<string>,
  ): string | null => {
    for (const cell of wordCells(word)) {
      const key = keyOf(cell.row, cell.col);
      if (!solvedNow.has(key) && !lettersNow[key]) return key;
    }
    return null;
  };

  /* ===== التفاعل ===== */

  /** اختيار كلمة جديدة — وتحديد أول خلية فارغة فيها */
  const selectWord = (
    word: CrosswordWord,
    lettersNow: Record<string, string>,
    solvedNow: ReadonlySet<string>,
  ) => {
    setActiveWordKeyValue(wordKey(word));
    setActiveCellKeyValue(firstEditableCell(word, lettersNow, solvedNow));
  };

  /** ضغط خلية — يحدد كلمتها (مفضّلاً الكلمة النشطة إن مرّت بها) */
  const handleCellTap = (cell: CrosswordCell) => {
    if (lockedInputs) return;
    const cellKey = keyOf(cell.row, cell.col);
    const candidates = q.words.filter((w) =>
      wordCells(w).some((c) => keyOf(c.row, c.col) === cellKey),
    );
    const word =
      candidates.find((w) => wordKey(w) === activeWordKeyValue) ??
      candidates[0];

    if (word) {
      setActiveWordKeyValue(wordKey(word));
      if (solved.has(cellKey)) {
        setActiveCellKeyValue(firstEditableCell(word, letters, solved));
        return;
      }
    }
    setActiveCellKeyValue(cellKey);
  };

  /** كتابة حرف في الخلية النشطة + التحقق الصامت للكلمة */
  const handleLetter = (letter: string) => {
    if (lockedInputs || !activeCellKeyValue) return;
    if (solved.has(activeCellKeyValue)) return;

    const next = { ...letters, [activeCellKeyValue]: letter };
    onAnswerChange(next);

    const cells = wordCells(activeWord);
    const allFilled = cells.every((c) => next[keyOf(c.row, c.col)]);

    if (allFilled) {
      const isCorrect = cells.every(
        (c) => next[keyOf(c.row, c.col)] === c.letter,
      );
      if (isCorrect) {
        /* كلمة صحيحة — قفلها والانتقال للتالية */
        const nextSolved = new Set(solved);
        for (const c of cells) nextSolved.add(keyOf(c.row, c.col));
        setSolved(nextSolved);

        const remaining = q.words.find(
          (w) =>
            wordKey(w) !== activeWordKeyValue &&
            firstEditableCell(w, next, nextSolved),
        );
        if (remaining) selectWord(remaining, next, nextSolved);
        else setActiveCellKeyValue(null);
        return;
      }
    }

    /* تقدّم للخلية الفارغة التالية في الكلمة الحالية */
    const index = cells.findIndex(
      (c) => keyOf(c.row, c.col) === activeCellKeyValue,
    );
    for (let step = index + 1; step < cells.length; step++) {
      const key = keyOf(cells[step].row, cells[step].col);
      if (!solved.has(key) && !next[key]) {
        setActiveCellKeyValue(key);
        return;
      }
    }
    /* لا توجد فارغة بعد الحالية — ابحث قبلها (دورة داخل الكلمة) */
    for (let step = 0; step < index; step++) {
      const key = keyOf(cells[step].row, cells[step].col);
      if (!solved.has(key) && !next[key]) {
        setActiveCellKeyValue(key);
        return;
      }
    }
  };

  /** حذف الحرف من الخلية النشطة أو الرجوع لسابقتها */
  const handleDelete = () => {
    if (lockedInputs) return;
    if (
      activeCellKeyValue &&
      !solved.has(activeCellKeyValue) &&
      letters[activeCellKeyValue]
    ) {
      const next = { ...letters };
      delete next[activeCellKeyValue];
      onAnswerChange(next);
      return;
    }
    /* الخلية فارغة أو مقفلة — تراجع للخلية السابقة القابلة للتحرير */
    const index = activeCells.findIndex(
      (c) => keyOf(c.row, c.col) === activeCellKeyValue,
    );
    for (let step = index - 1; step >= 0; step--) {
      const key = keyOf(activeCells[step].row, activeCells[step].col);
      if (!solved.has(key)) {
        setActiveCellKeyValue(key);
        return;
      }
    }
  };

  /* ===== لوحة الحروف ===== */

  const trayLetters = useMemo(
    () =>
      q.letters ??
      Array.from(
        new Set(q.cells.map((c) => c.letter).filter((l): l is string => Boolean(l))),
      ),
    [q.letters, q.cells],
  );

  /* ===== العرض ===== */

  const resultGridClass =
    status === "correct" ? "border-emerald-500 bg-emerald-50" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={
        status === "wrong"
          ? { opacity: 1, y: 0, x: [0, -7, 7, -5, 5, 0] }
          : { opacity: 1, y: 0 }
      }
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-4"
    >
      {/* 1) الشبكة — CSS Grid صريح الاتجاه (RTL) */}
      <div className="mx-auto w-full max-w-[330px]">
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${q.cols}, minmax(0, 1fr))`,
          }}
          role="grid"
          aria-label="شبكة الكلمات المتقاطعة"
        >
          {q.cells.map((cell) => {
            const cellKey = keyOf(cell.row, cell.col);
            const value = letters[cellKey];
            const isSolved = solved.has(cellKey) || status === "correct";
            const inActiveWord =
              !lockedInputs &&
              activeCells.some((c) => keyOf(c.row, c.col) === cellKey);
            const isActive = activeCellKeyValue === cellKey;

            return (
              <button
                key={cellKey}
                type="button"
                onClick={() => handleCellTap(cell)}
                style={{
                  gridColumnStart: cell.col + 1,
                  gridRowStart: cell.row + 1,
                }}
                aria-label={`خلية الصف ${cell.row + 1} والعمود ${
                  cell.col + 1
                }${value ? `: الحرف ${value}` : ": فارغة"}`}
                className={`relative grid aspect-square place-items-center rounded-lg border-2 font-heading text-xl font-extrabold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold-500 ${
                  isSolved
                    ? `border-emerald-500/70 bg-emerald-50 text-emerald-700 ${resultGridClass}`
                    : value
                      ? "border-heritage-900/20 bg-white text-heritage-950 shadow-card"
                      : inActiveWord
                        ? "border-gold-500/50 bg-gold-100/50 text-gold-700/40"
                        : "border-heritage-900/15 bg-white text-heritage-950"
                } ${isActive ? "scale-105 border-gold-500 bg-white ring-2 ring-gold-500/50" : ""}`}
              >
                {value}

                {/* رقم بداية الكلمة — زاوية الخلية العلوية */}
                {cell.number !== undefined && (
                  <span
                    className="absolute start-1 top-0.5 font-heading text-[9px] font-extrabold text-heritage-700"
                    aria-hidden="true"
                  >
                    {cell.number.toLocaleString("ar-EG")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2) لوحة الحروف — تراثية داكنة */}
      <div className="rounded-2xl bg-gradient-to-tl from-heritage-950 via-heritage-900 to-heritage-800 p-3 shadow-card-lg">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {trayLetters.map((letter, index) => (
            <motion.button
              key={`${letter}-${index}`}
              type="button"
              whileTap={lockedInputs ? undefined : { scale: 0.88 }}
              onClick={() => handleLetter(letter)}
              disabled={lockedInputs}
              aria-label={`كتابة الحرف ${letter}`}
              className="grid h-10 min-w-9 place-items-center rounded-xl border border-white/15 bg-white/10 px-2 font-heading text-lg font-extrabold text-white transition-all duration-150 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold-400 disabled:opacity-40"
            >
              {letter}
            </motion.button>
          ))}
          <button
            type="button"
            onClick={handleDelete}
            disabled={lockedInputs}
            aria-label="حذف الحرف"
            className="grid h-10 min-w-9 place-items-center rounded-xl border border-flame-500/40 bg-flame-500/15 text-flame-400 transition-all duration-150 hover:bg-flame-500/25 active:scale-90 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold-400"
          >
            <Delete className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 3) قائمة التلميحات — أفقي ثم عمودي */}
      <div className="space-y-2">
        {(["across", "down"] as const).map((direction) => {
          const directionWords = q.words.filter(
            (w) => w.direction === direction,
          );
          if (directionWords.length === 0) return null;

          return (
            <div key={direction} className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-heritage-700/70">
                {direction === "across" ? (
                  <MoveHorizontal className="size-3.5" aria-hidden="true" />
                ) : (
                  <MoveVertical className="size-3.5" aria-hidden="true" />
                )}
                {direction === "across" ? "كلمات أفقية" : "كلمات عمودية"}
              </p>

              {directionWords.map((word) => {
                const isActive = wordKey(word) === activeWordKeyValue;
                const cells = wordCells(word);
                const isWordSolved =
                  status === "correct" ||
                  cells.every(
                    (c) =>
                      solved.has(keyOf(c.row, c.col)) ||
                      letters[keyOf(c.row, c.col)] === c.letter,
                  );

                return (
                  <button
                    key={wordKey(word)}
                    type="button"
                    onClick={() => !lockedInputs && selectWord(word, letters, solved)}
                    aria-label={`تلميح الكلمة رقم ${word.number} ${
                      direction === "across" ? "الأفقية" : "العمودية"
                    }: ${word.clue}`}
                    className={`flex w-full items-start gap-2.5 rounded-xl border-2 p-2.5 text-right transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 ${
                      isActive
                        ? "border-gold-500 bg-gold-100/50 shadow-card"
                        : "border-heritage-900/8 bg-white hover:border-gold-500/40"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`grid size-6 shrink-0 place-items-center rounded-lg font-heading text-[11px] font-extrabold ${
                        isActive
                          ? "bg-heritage-900 text-white"
                          : "bg-sand-dark text-heritage-800"
                      }`}
                    >
                      {word.number.toLocaleString("ar-EG")}
                    </span>
                    <span
                      className={`min-w-0 flex-1 text-[11.5px] font-medium leading-relaxed ${
                        isActive
                          ? "text-heritage-950"
                          : "line-clamp-2 text-heritage-900/70"
                      }`}
                    >
                      {word.clue}
                    </span>
                    {isWordSolved && (
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-emerald-600"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/** وحدة التسجيل — الواجهة + منطق التحقق */
export const crosswordModule = {
  component: CrosswordQuestion,
  isComplete: (q: CrosswordQuestion, answer: unknown) => {
    if (!answer || typeof answer !== "object") return false;
    const letters = answer as Record<string, string>;
    return q.cells.every((c) => letters[keyOf(c.row, c.col)]);
  },
  checkAnswer: (q: CrosswordQuestion, answer: unknown) => {
    if (!answer || typeof answer !== "object") return false;
    const letters = answer as Record<string, string>;
    return q.cells.every(
      (c) => letters[keyOf(c.row, c.col)] === c.letter,
    );
  },
  correctAnswerText: (q: CrosswordQuestion) =>
    q.words.map((w) => w.answer).join("، "),
};
