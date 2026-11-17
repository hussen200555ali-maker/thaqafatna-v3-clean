"use client";

/**
 * شاشة تحميل المرحلة (Level Loading)
 * =====================================
 * تُعرض أثناء جلب مرحلة من الـ API عبر طبقة التطبيع —
 * لحظة انتظار مصمَّمة ضمن الهوية: مسجدُ نصٍّ متحرك،
 * بطاقة شفافة فوق خلفية رملية، وهياكل بطاقات نابضة.
 */

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function LevelLoading() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-sand px-8">
      {/* المؤشر الدوّار داخل دائرة ذهبية */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="grid size-16 place-items-center rounded-3xl bg-white shadow-card-lg"
      >
        <Loader2
          className="size-7 animate-spin text-gold-600"
          aria-hidden="true"
        />
      </motion.div>

      <div className="text-center">
        <h2 className="font-heading text-base font-extrabold text-heritage-900">
          جارٍ تحضير المرحلة…
        </h2>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
          تُجلب الأسئلة من لوحة الإدارة عبر طبقة التطبيع ثم تُصاغ
          وفق عقد بيانات اللعبة
        </p>
      </div>

      {/* هياكل بطاقات نابضة — توحي ببناء المرحلة */}
      <div className="mt-2 w-full max-w-xs space-y-2.5" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.12 }}
            className="h-12 animate-pulse rounded-2xl bg-sand-darker/70"
            style={{ width: `${100 - index * 14}%` }}
          />
        ))}
      </div>
    </div>
  );
}
