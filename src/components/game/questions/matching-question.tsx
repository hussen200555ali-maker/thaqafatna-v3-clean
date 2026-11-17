"use client";

/**
 * مُصيّر «التوصيل والربط» (Matching Pairs)
 * ============================================
 * عمودان متقابلان: المفاهيم (يمين، بترتيب لوحة الإدارة) وما يقابلها
 * (يسار، مخلوطة) — واللاعب يربط كل عنصرين بضغمتين من أي اتجاه:
 *
 *   مفهوم ← مقابل    أو    مقابل ← مفهوم
 *   الضغط على زوج مرتبط يفكّه، والربط الجديد يستبدل القديم تلقائياً.
 *
 * ترميز لوني تراثي: كل زوج يُطوى بهوية لونية من لوحة خماسية
 * (تراثي، ذهبي، جمري، زمردي، بنفسجي) مع رقم الزوج — فيرى اللاعب
 * روابطه بنظرة واحدة. عند التصحيح: الأخضر لما صحّ والأحمر لما أخطأ.
 *
 * الحالة: Record<المفهوم, المقابل> — مطابقة حرفياً لخريطة حالات
 * الإجابة (AnswerStateMap.matching) في عقد البيانات.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Link2 } from "lucide-react";
import type {
  MatchingQuestion,
  QuestionRendererProps,
} from "@/lib/game/types";
import { shuffleLetters } from "../shared/letter-board";

/** لوحة الهويات اللونية للأزواج — دورة من خمسة ألوان تراثية */
const PAIR_STYLES = [
  { badge: "bg-heritage-900 text-white", border: "border-heritage-900", soft: "bg-heritage-50" },
  { badge: "bg-gold-500 text-heritage-950", border: "border-gold-500", soft: "bg-gold-100/60" },
  { badge: "bg-flame-500 text-white", border: "border-flame-500", soft: "bg-flame-100/70" },
  { badge: "bg-emerald-600 text-white", border: "border-emerald-600", soft: "bg-emerald-50" },
  { badge: "bg-violet-600 text-white", border: "border-violet-600", soft: "bg-violet-50" },
];

/** تحويل رقم الزوج إلى هوية لونية ثابتة */
const pairStyle = (index: number) => PAIR_STYLES[index % PAIR_STYLES.length];

/** العنصر المحدد انتظاراً لقرينه — من أي عمود */
type Selection = { kind: "prompt" | "response"; value: string } | null;

export function MatchingQuestion({
  question,
  answer,
  onAnswerChange,
  status,
}: QuestionRendererProps) {
  const q = question as MatchingQuestion;

  const locked = status !== "answering";

  /** خريطة الربط: المفهوم ← المقابل (حالة الحاوية) */
  const assignments: Record<string, string> =
    answer && typeof answer === "object" && !Array.isArray(answer)
      ? (answer as Record<string, string>)
      : {};

  /** العمود الأيمن: المفاهيم بترتيب الإدارة (ثابت — مرجع الأرقام) */
  const prompts = q.pairs.map((p) => p.left);

  /** العمود الأيسر: المقابلات مخلوطة خلطاً واحداً عند التركيب */
  const [responses] = useState<string[]>(() =>
    shuffleLetters(q.pairs.map((p) => p.right)),
  );

  const [selected, setSelected] = useState<Selection>(null);

  /** فهرس المفهوم — يحدد رقمه وهويته اللونية */
  const promptIndex = (prompt: string) => prompts.indexOf(prompt);
  /** من يملك هذه المقابلة حالياً؟ */
  const ownerOfResponse = (response: string) =>
    Object.keys(assignments).find((l) => assignments[l] === response) ?? null;

  /* ===== ضغطة على مفهوم (العمود الأيمن) ===== */
  const handlePromptTap = (prompt: string) => {
    if (locked) return;

    /* زوج مرتبط → فكّ الربط */
    if (assignments[prompt]) {
      const next = { ...assignments };
      delete next[prompt];
      onAnswerChange(next);
      return;
    }

    /* مقابلة محددة سابقاً → أكمل الربط */
    if (selected?.kind === "response") {
      const next = { ...assignments };
      /* المقابلة مأخوذة؟ يُنقل مالكها القديم جانباً */
      const oldOwner = ownerOfResponse(selected.value);
      if (oldOwner) delete next[oldOwner];
      next[prompt] = selected.value;
      onAnswerChange(next);
      setSelected(null);
      return;
    }

    /* تحديد/إلغاء تحديد */
    setSelected(
      selected?.kind === "prompt" && selected.value === prompt
        ? null
        : { kind: "prompt", value: prompt },
    );
  };

  /* ===== ضغطة على مقابلة (العمود الأيسر) ===== */
  const handleResponseTap = (response: string) => {
    if (locked) return;

    /* زوج مرتبط → فكّ الربط */
    const owner = ownerOfResponse(response);
    if (owner) {
      const next = { ...assignments };
      delete next[owner];
      onAnswerChange(next);
      return;
    }

    /* مفهوم محدد سابقاً → أكمل الربط */
    if (selected?.kind === "prompt") {
      const next = { ...assignments };
      delete next[selected.value]; /* استبدال إن كان مرتبطاً بغيرها */
      next[selected.value] = response;
      onAnswerChange(next);
      setSelected(null);
      return;
    }

    /* تحديد/إلغاء تحديد */
    setSelected(
      selected?.kind === "response" && selected.value === response
        ? null
        : { kind: "response", value: response },
    );
  };

  /* ===== أصناف بطاقة المفهوم (اليمين) ===== */
  const promptCardClass = (prompt: string): string => {
    const idx = promptIndex(prompt);
    const linked = assignments[prompt];
    const style = pairStyle(idx);
    const isSelected =
      selected?.kind === "prompt" && selected.value === prompt;

    if (locked) {
      if (status === "correct")
        return "border-emerald-500 bg-emerald-50 text-emerald-800";
      if (linked === q.pairs[idx].right)
        return "border-emerald-500 bg-emerald-50 text-emerald-800";
      return "border-red-400 bg-red-50 text-red-700";
    }
    if (linked) return `${style.border} ${style.soft} text-heritage-950 shadow-card`;
    if (isSelected) return "border-gold-500 bg-gold-100/70 text-heritage-950 ring-2 ring-gold-500/40 shadow-card";
    return "border-heritage-900/12 bg-white text-heritage-900 hover:border-gold-500/50 hover:bg-gold-100/30";
  };

  /* ===== أصناف بطاقة المقابلة (اليسار) ===== */
  const responseCardClass = (response: string): string => {
    const owner = ownerOfResponse(response);
    const isSelected =
      selected?.kind === "response" && selected.value === response;

    if (locked) {
      if (status === "correct")
        return "border-emerald-500 bg-emerald-50 text-emerald-800";
      if (owner) {
        const isRight =
          q.pairs[promptIndex(owner)]?.right === response;
        return isRight
          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
          : "border-red-400 bg-red-50 text-red-700";
      }
      return "border-heritage-900/12 bg-sand/60 text-heritage-900/50";
    }
    if (owner) {
      const style = pairStyle(promptIndex(owner));
      return `${style.border} ${style.soft} text-heritage-950 shadow-card`;
    }
    if (isSelected)
      return "border-gold-500 bg-gold-100/70 text-heritage-950 ring-2 ring-gold-500/40 shadow-card";
    return "border-heritage-900/12 bg-white text-heritage-900 hover:border-gold-500/50 hover:bg-gold-100/30";
  };

  /** شارة رقم الزوج — تظهر على الطرفين بعد الربط */
  const PairBadge = ({ prompt }: { prompt: string }) => {
    const style = pairStyle(promptIndex(prompt));
    return (
      <span
        className={`grid size-6 shrink-0 place-items-center rounded-full font-heading text-[11px] font-extrabold ${style.badge}`}
        aria-hidden="true"
      >
        {(promptIndex(prompt) + 1).toLocaleString("ar-EG")}
      </span>
    );
  };

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
      {/* تعليمات مصغّرة */}
      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] font-medium leading-relaxed text-heritage-900/60">
        <Link2 className="size-3.5 shrink-0" aria-hidden="true" />
        اضغط عنصراً من كل عمود لربطهما — والضغط على زوجٍ مرتبط يفكّه
      </p>

      {/* شبكة العمودين — المفاهيم يميناً والمقابلات يساراً (RTL) */}
      <div className="grid grid-cols-2 gap-2.5" role="group" aria-label="أعمدة الربط">
        {/* العمود الأيمن: المفاهيم */}
        <div className="space-y-2.5" role="group" aria-label="المفاهيم">
          {prompts.map((prompt, index) => {
            const linked = assignments[prompt];
            return (
              <motion.button
                key={prompt}
                type="button"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.07, duration: 0.3 }}
                whileTap={locked ? undefined : { scale: 0.97 }}
                onClick={() => handlePromptTap(prompt)}
                aria-label={`المفهوم ${prompt}${linked ? ` — مرتبط بـ ${linked}` : ""}`}
                className={`flex min-h-14 w-full items-center gap-2 rounded-xl border-2 p-2.5 text-right transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 ${promptCardClass(prompt)}`}
              >
                {linked && <PairBadge prompt={prompt} />}
                <span className="min-w-0 flex-1 text-[12.5px] font-extrabold leading-relaxed">
                  {prompt}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* العمود الأيسر: المقابلات (مخلوطة) */}
        <div className="space-y-2.5" role="group" aria-label="المقابلات">
          {responses.map((response, index) => {
            const owner = ownerOfResponse(response);
            return (
              <motion.button
                key={response}
                type="button"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.07, duration: 0.3 }}
                whileTap={locked ? undefined : { scale: 0.97 }}
                onClick={() => handleResponseTap(response)}
                aria-label={`المقابل ${response}${owner ? ` — مرتبط بـ ${owner}` : ""}`}
                className={`flex min-h-14 w-full items-center gap-2 rounded-xl border-2 p-2.5 text-center transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 ${responseCardClass(response)}`}
              >
                <span className="min-w-0 flex-1 text-[12.5px] font-bold leading-relaxed">
                  {response}
                </span>
                {owner && <PairBadge prompt={owner} />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* عدّاد التقدم في الربط */}
      <p className="text-center text-[11px] font-bold text-muted-foreground">
        {Object.keys(assignments).length.toLocaleString("ar-EG")} من{" "}
        {q.pairs.length.toLocaleString("ar-EG")} رابطاً
      </p>
    </motion.div>
  );
}

/** وحدة التسجيل — الواجهة + منطق التحقق */
export const matchingModule = {
  component: MatchingQuestion,
  isComplete: (q: MatchingQuestion, answer: unknown) => {
    if (!answer || typeof answer !== "object" || Array.isArray(answer))
      return false;
    const map = answer as Record<string, string>;
    return q.pairs.every(
      (p) => typeof map[p.left] === "string" && map[p.left].length > 0,
    );
  },
  checkAnswer: (q: MatchingQuestion, answer: unknown) => {
    if (!answer || typeof answer !== "object" || Array.isArray(answer))
      return false;
    const map = answer as Record<string, string>;
    return q.pairs.every((p) => map[p.left] === p.right);
  },
  correctAnswerText: (q: MatchingQuestion) =>
    q.pairs.map((p) => `${p.left} = ${p.right}`).join("، "),
};
