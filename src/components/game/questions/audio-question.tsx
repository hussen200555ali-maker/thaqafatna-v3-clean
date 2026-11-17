"use client";

/**
 * مُصيّر «اللغز الصوتي» (Audio Riddle) — المشغّل التراثي
 * =========================================================
 * تجربة الإصغاء بأكملها داخل بطاقة تراثية داكنة تحمل هوية لوحة
 * الحروف نفسها (Teal + ذهب)، بلا أي أزرار متصفح أصلية:
 *
 *   • زر دائري ذهبي كبير: تشغيل / إيقاف / إعادة استماع (تلقائي
 *     عند انتهاء المقطع — الأيقونة تتغير إلى سهم الإعادة).
 *   • معادل موجي حيّ: أعمدة ترتفع وتنخفض بتفاوتٍ زمني أثناء
 *     التشغيل، وتسكن عند الإيقاف — نبض الصوت المُرئي.
 *   • شريط تقدم ذهبي يعبأ من اليمين (RTL) مع زمنين عربيين.
 *   • فشل التحميل يُستقبل بأناقة: بطاقة تحذير + زر تخطٍّ للخروج
 *     من المأزق دون تعطيل مسار المرحلة.
 *
 * الإجابة عبر لوحة الحروف المشتركة — الحروف من لوحة الإدارة
 * (availableLetters) أو مشتقة من الإجابة مع مشتّتات آمنة.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Headphones,
  Pause,
  Play,
  RotateCcw,
  VolumeX,
} from "lucide-react";
import type {
  AudioQuestion,
  QuestionRendererProps,
} from "@/lib/game/types";
import { deriveLetterTray, LetterBoard } from "../shared/letter-board";

/** تنسيق الثواني (م:ثث) بأرقام عربية */
function formatAudioTime(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = Math.floor(safe % 60);
  const pad = (n: number) => n.toLocaleString("ar-EG").padStart(2, "٠");
  return `${pad(minutes)}:${pad(seconds)}`;
}

/** أعمدة المعادل — طولها Base × عامل النبض */
const EQ_BARS = [0.55, 0.9, 0.7, 1, 0.65, 0.85, 0.5];

export function AudioQuestion({
  question,
  answer,
  onAnswerChange,
  status,
  onSkip,
}: QuestionRendererProps) {
  const q = question as AudioQuestion;
  const locked = status !== "answering";

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState(false);

  /* إيقاف الصوت عند مغادرة السؤال — نظافة دورة الحياة */
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const ended = duration > 0 && currentTime >= duration - 0.05;

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || loadError) return;
    try {
      if (playing) {
        audio.pause();
        return;
      }
      if (ended) audio.currentTime = 0; /* إعادة الاستماع من البداية */
      await audio.play();
    } catch {
      setLoadError(true);
    }
  };

  const progressPercent =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  /* أصناف بطاقة المشغل عند التصحيح — انسجام مع بقية الأنواع */
  const cardBorderClass =
    status === "correct"
      ? "border-emerald-500"
      : status === "wrong"
        ? "border-red-400"
        : "border-white/10";

  return (
    <div className="space-y-5">
      {/* 1) المشغّل التراثي */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={
          status === "wrong"
            ? { opacity: 1, y: 0, x: [0, -7, 7, -5, 5, 0] }
            : { opacity: 1, y: 0 }
        }
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`relative overflow-hidden rounded-3xl border-2 bg-gradient-to-tl from-heritage-950 via-heritage-900 to-heritage-800 p-5 shadow-card-lg ${cardBorderClass}`}
        role="group"
        aria-label="المشغّل الصوتي التراثي"
      >
        {/* زخرفة خافتة */}
        <Headphones
          className="pointer-events-none absolute -top-3 -start-3 size-16 text-white/5"
          aria-hidden="true"
        />

        {/* زر التشغيل الدائري — مركز البطاقة */}
        <div className="relative mx-auto grid size-24 place-items-center">
          {/* هالة نابضة أثناء التشغيل */}
          {playing && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 rounded-full border-2 border-gold-400/50"
              aria-hidden="true"
            />
          )}
          {playing && (
            <motion.span
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.35, opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-gold-400/25"
              aria-hidden="true"
            />
          )}
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={togglePlay}
            disabled={loadError || locked}
            aria-label={
              loadError
                ? "المقطع الصوتي غير متاح"
                : ended
                  ? "إعادة الاستماع من البداية"
                  : playing
                    ? "إيقاف مؤقت"
                    : "تشغيل المقطع الصوتي"
            }
            className="grid size-20 place-items-center rounded-full bg-gradient-to-tl from-gold-500 to-gold-400 text-heritage-950 shadow-glow-gold transition-transform duration-150 hover:from-gold-400 hover:to-gold-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loadError ? (
              <VolumeX className="size-9" aria-hidden="true" />
            ) : playing ? (
              <Pause className="size-9" aria-hidden="true" strokeWidth={2.4} />
            ) : ended ? (
              <RotateCcw className="size-8" aria-hidden="true" strokeWidth={2.4} />
            ) : (
              <Play
                className="size-9 -scale-x-100"
                aria-hidden="true"
                strokeWidth={2.4}
              />
            )}
          </motion.button>
        </div>

        {/* المعادل الموجي — يرقص مع الصوت */}
        <div
          className="mt-4 flex h-10 items-center justify-center gap-1.5"
          aria-hidden="true"
        >
          {EQ_BARS.map((scale, index) => (
            <motion.span
              key={index}
              className="w-1.5 rounded-full bg-gradient-to-t from-gold-500/80 to-gold-300"
              style={{ height: `${scale * 100}%` }}
              animate={
                playing
                  ? { scaleY: [0.35, 1, 0.5, 0.9, 0.35] }
                  : { scaleY: 0.3 }
              }
              transition={
                playing
                  ? {
                      duration: 1.1 + (index % 3) * 0.18,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.08,
                    }
                  : { duration: 0.3 }
              }
            />
          ))}
        </div>

        {/* شريط التقدم والزمن */}
        <div className="mt-3">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-white/15"
            role="progressbar"
            aria-label="تقدم المقطع الصوتي"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration) || 0}
            aria-valuenow={Math.round(currentTime)}
          >
            <div
              className="h-full rounded-full bg-gradient-to-l from-gold-400 to-gold-500 transition-[width] duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between font-heading text-[10.5px] font-bold text-white/70">
            <span aria-label="الزمن الحالي">{formatAudioTime(currentTime)}</span>
            <span className="text-white/45" aria-label="الزمن الكلي">
              {formatAudioTime(duration)}
            </span>
          </div>
        </div>

        {/* حالة فشل التحميل — أنيقة وبلا تعطيل */}
        {loadError && (
          <div className="mt-3 rounded-xl bg-flame-500/15 px-3.5 py-2.5 text-center">
            <p className="text-[11px] font-bold leading-relaxed text-flame-300">
              تعذّر تحميل المقطع الصوتي — تحقق من الاتصال أو تخطَّ السؤال
              {onSkip ? " بالزر أدناه" : ""}
            </p>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="mt-2 h-9 rounded-xl bg-white/10 px-5 font-heading text-[11px] font-extrabold text-white transition-colors duration-150 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
              >
                تخطي السؤال
              </button>
            )}
          </div>
        )}

        {/* عنصر الصوت الخفي — كل شيء عبر أزرارنا */}
        <audio
          ref={audioRef}
          src={q.audioUrl}
          preload="metadata"
          className="hidden"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
            setLoadError(false);
          }}
          onError={() => setLoadError(true)}
        >
          <track kind="captions" />
        </audio>
      </motion.div>

      {/* 2) لوحة الحروف المشتركة — بناء الإجابة بعد الإصغاء */}
      <LetterBoard
        answerLength={q.answer.length}
        letters={q.letters ?? deriveLetterTray(q.answer, 3)}
        answer={answer}
        onAnswerChange={onAnswerChange}
        status={status}
      />
    </div>
  );
}

/** وحدة التسجيل — الواجهة + منطق التحقق */
export const audioModule = {
  component: AudioQuestion,
  isComplete: (q: AudioQuestion, answer: unknown) => {
    if (!Array.isArray(answer) || answer.length !== q.answer.length)
      return false;
    return (answer as (string | null)[]).every((s) => s !== null);
  },
  checkAnswer: (q: AudioQuestion, answer: unknown) => {
    if (!Array.isArray(answer)) return false;
    return (answer as (string | null)[]).join("") === q.answer;
  },
  correctAnswerText: (q: AudioQuestion) => q.answer,
};
