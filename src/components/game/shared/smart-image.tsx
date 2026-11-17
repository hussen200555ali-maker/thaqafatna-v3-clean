"use client";

/**
 * الصورة الذكية (Smart Image)
 * ==============================
 * صورة اللغز الموحدة لكل الأنواع المصوّرة (لغز مصوّر / أربع صور) —
 * بثلاث حالات مُصمّمة بعناية ضمن الهوية البصرية:
 *
 *   تحميل : هيكل رملي نابض (Shimmer) — لا وميض أبيض مفاجئ
 *   جاهزة : ظهور ناعم بالتكبير من 96٪
 *   فشل   : بطاقة بديلة أنيقة بأيقونة — لا صورة مكسورة أبداً
 *
 * نستخدم <img> مباشرة (لا next/image) عمداً: مصادر الصور تأتي
 * من قاعدة بيانات لوحة الإدارة في زمن التشغيل، والأحجام محكومة
 * بإطارات نسب ثابتة (aspect-*) — فلا حاجة لتحسينات next/image.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ImageOff } from "lucide-react";

export interface SmartImageProps {
  /** مسار الصورة — محلي أو رابط من لوحة الإدارة */
  src: string;
  /** نص بديل وصفي — إلزامي للوصولية */
  alt: string;
  /** أصناف إضافية للإطار الخارجي (مثل نسبة الأبعاد) */
  className?: string;
  /** اصغر زاوية تدوير — بصري بحت */
  rounded?: string;
}

export function SmartImage({
  src,
  alt,
  className = "",
  rounded = "rounded-xl",
}: SmartImageProps) {
  const [state, setState] = useState<"loading" | "loaded" | "error">(
    "loading",
  );

  return (
    <div
      className={`relative overflow-hidden bg-sand-dark ${rounded} ${className}`}
    >
      {/* حالة التحميل — هيكل نابض بلون رملي دافئ */}
      {state === "loading" && (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-tl from-sand-darker via-sand-dark to-sand-darker"
          aria-hidden="true"
        />
      )}

      {/* حالة الفشل — بطاقة بديلة مهذبة */}
      {state === "error" && (
        <div
          className="absolute inset-0 grid place-items-center bg-sand-dark text-center"
          role="img"
          aria-label={`صورة غير متاحة: ${alt}`}
        >
          <div className="px-3 py-2">
            <ImageOff
              className="mx-auto size-6 text-heritage-900/35"
              aria-hidden="true"
            />
            <p className="mt-1 text-[10px] font-bold text-heritage-900/45">
              تعذّر تحميل الصورة
            </p>
          </div>
        </div>
      )}

      {/* الصورة الفعلية — تظهر بنعوم عند الجاهزية */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setState("loaded")}
        onError={() => setState("error")}
        loading="lazy"
        draggable={false}
        className={`h-full w-full object-cover transition-all duration-500 ${
          state === "loaded" ? "scale-100 opacity-100" : "scale-[0.96] opacity-0"
        }`}
      />
    </div>
  );
}

/** إطار بطاقة الصورة الكبير — للغز الصورة الواحدة (مع وميض ذهبي عند الصح) */
export function ImageFrame({
  src,
  alt,
  correct,
}: {
  src: string;
  alt: string;
  correct: boolean | null;
}) {
  return (
    <motion.figure
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`overflow-hidden rounded-2xl border-2 bg-white shadow-card transition-colors duration-300 ${
        correct === true
          ? "border-emerald-500"
          : correct === false
            ? "border-red-400"
            : "border-heritage-900/10"
      }`}
    >
      <SmartImage
        src={src}
        alt={alt}
        rounded="rounded-none"
        className="aspect-[16/10] w-full"
      />
    </motion.figure>
  );
}
