/**
 * سجل الأوسمة (Badges Registry)
 * =================================
 * التعريفات العرضية للأوسمة الثمانية — الأيقونة والاسم والوصف
 * واللون. شروط الفوز تُقيَّم في progress-store.ts (منطق نقي).
 *
 * الإضافة المستقبلية: أضف تعريفاً هنا + شرطاً في computeUnlockedBadges
 * — ولا يتغير أي مكوّن عرض.
 */

import {
  Brain,
  Castle,
  Crown,
  Footprints,
  Medal,
  Shield,
  Stars,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** تعريف وسام واحد */
export interface BadgeDefinition {
  /** معرّف ثابت — يُخزَّن في سجل اللاعب */
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** ألوان بلاطة الأيقونة عند الفوز */
  accentClass: string;
}

export const BADGES: BadgeDefinition[] = [
  {
    id: "first-steps",
    title: "الخطوة الأولى",
    description: "أكملت أول مرحلة في رحلتك",
    icon: Footprints,
    accentClass: "bg-emerald-100 text-emerald-600",
  },
  {
    id: "golden-trio",
    title: "ثلاثية ذهبية",
    description: "حصدت ٣ نجوم في مرحلة واحدة",
    icon: Medal,
    accentClass: "bg-gold-100 text-gold-600",
  },
  {
    id: "clear-mind",
    title: "عقل صافٍ",
    description: "أكملت مرحلة كاملة دون أي تلميح",
    icon: Brain,
    accentClass: "bg-heritage-100 text-heritage-700",
  },
  {
    id: "quick-mind",
    title: "سريع البديهة",
    description: "أنهيت مرحلة قبل منتصف وقتها",
    icon: Zap,
    accentClass: "bg-flame-100 text-flame-600",
  },
  {
    id: "chapter-knight",
    title: "فارس الفصول",
    description: "أكملت مرحلة من كل فصل",
    icon: Shield,
    accentClass: "bg-teal-100 text-teal-700",
  },
  {
    id: "fortress-hero",
    title: "قاهر الحصن",
    description: "أكملت مرحلة صعبة بامتياز",
    icon: Castle,
    accentClass: "bg-violet-100 text-violet-600",
  },
  {
    id: "star-collector",
    title: "جامع النجوم",
    description: "بلغت ٩ نجوم في رصيدك الإجمالي",
    icon: Stars,
    accentClass: "bg-gold-100 text-gold-700",
  },
  {
    id: "perfectionist",
    title: "صائد الكمال",
    description: "ثلاثية نجوم في ٣ مراحل مختلفة",
    icon: Crown,
    accentClass: "bg-gold-200 text-gold-700",
  },
];

/** خريطة الوصول السريع بالمعرّف */
export const BADGE_MAP: Record<string, BadgeDefinition> = Object.fromEntries(
  BADGES.map((badge) => [badge.id, badge]),
);
