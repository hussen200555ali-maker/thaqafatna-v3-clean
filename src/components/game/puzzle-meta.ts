/**
 * ميتاداتا أنواع الألغاز (Puzzle Meta)
 * ======================================
 * بطاقة هوية موحدة لكل نوع من الأنواع الـ13 في لوحة الإدارة:
 * الاسم العربي + الأيقونة الخطية + نمط شارة اللون.
 *
 * تُستخدم في: شارة نوع السؤال بالقشرة الموحدة، رقائق شاشة
 * المقدمة، بطاقة المُصيّر الاحتياطي، وملخص المرحلة.
 *
 * ملاحظة: إضافة نوع جديد = سطر واحد هنا + مُصيّر واحد في مجلد
 * questions/ + سطر واحد في السجل (registry.ts) — لا شيء آخر.
 */

import {
  AudioLines,
  Brain,
  Grid3x3,
  Image as ImageIcon,
  Images,
  Layers,
  Lightbulb,
  Link2,
  ListChecks,
  Shuffle,
  Smile,
  TextCursorInput,
  Type,
  type LucideIcon,
} from "lucide-react";
import type { PuzzleType } from "@/lib/game/types";

export interface PuzzleMeta {
  /** الاسم العربي المعروض للاعب */
  label: string;
  /** أيقونة خطية موحدة (Lucide) */
  icon: LucideIcon;
  /** أصناف Tailwind لشارة النوع */
  chipClass: string;
}

export const PUZZLE_META: Record<PuzzleType, PuzzleMeta> = {
  text: {
    label: "سؤال نصي",
    icon: Type,
    chipClass: "bg-sand-dark text-heritage-800",
  },
  image: {
    label: "لغز مصوّر",
    icon: ImageIcon,
    chipClass: "bg-heritage-100 text-heritage-700",
  },
  images4: {
    label: "أربع صور",
    icon: Images,
    chipClass: "bg-heritage-100 text-heritage-700",
  },
  emoji: {
    label: "لغز الإيموجي",
    icon: Smile,
    chipClass: "bg-gold-100 text-gold-700",
  },
  scrambled: {
    label: "حروف مبعثرة",
    icon: Shuffle,
    chipClass: "bg-flame-100 text-flame-600",
  },
  crossword: {
    label: "شبكة متقاطعة",
    icon: Grid3x3,
    chipClass: "bg-emerald-100 text-emerald-700",
  },
  fillblank: {
    label: "إكمال فراغات",
    icon: TextCursorInput,
    chipClass: "bg-gold-100 text-gold-700",
  },
  matching: {
    label: "توصيل وربط",
    icon: Link2,
    chipClass: "bg-heritage-100 text-heritage-700",
  },
  multiple: {
    label: "اختيار من متعدد",
    icon: ListChecks,
    chipClass: "bg-heritage-100 text-heritage-700",
  },
  audio: {
    label: "لغز صوتي",
    icon: AudioLines,
    chipClass: "bg-heritage-100 text-heritage-700",
  },
  logic: {
    label: "لغز ذهني",
    icon: Brain,
    chipClass: "bg-violet-100 text-violet-700",
  },
  progressive: {
    label: "تلميحات متدرجة",
    icon: Lightbulb,
    chipClass: "bg-gold-100 text-gold-700",
  },
  mixed: {
    label: "مرحلة مختلطة",
    icon: Layers,
    chipClass: "bg-flame-100 text-flame-600",
  },
};
