/**
 * بنية لوحة التحكم الشاملة (Admin Navigation Data)
 * ====================================================
 * المصدر الوحيد لقائمة التنقل: 5 مجموعات × 17 صفحة —
 * مطابقة حرفياً لبنية اللوحة الموحدة (عام/المكتبة/اللعبة/
 * المجتمع/النظام)، مع بيانات وصفية لكل صفحة يقرؤها الهيكل
 * والشريط الجانبي والترويسة معاً.
 */

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  KeyRound,
  LayoutDashboard,
  LibraryBig,
  Mail,
  MessageSquare,
  Network,
  Puzzle,
  Scale,
  ScrollText,
  Settings,
  ShieldCheck,
  Swords,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

/** معرّفات صفحات اللوحة */
export type AdminPageId =
  | "dashboard"
  | "library-management"
  | "books"
  | "book-categories"
  | "book-chapters"
  | "game-chapters"
  | "level-editor"
  | "daily-challenge"
  | "quality"
  | "difficulty"
  | "skill-tree"
  | "players"
  | "reviews"
  | "messages"
  | "roles"
  | "audit"
  | "reports"
  | "admin-settings";

/** عنصر تنقّل في الشريط الجانبي */
export interface AdminNavItem {
  id: AdminPageId;
  title: string;
  icon: LucideIcon;
}

/** مجموعة تنقّل بعنوانها وعناصرها */
export interface AdminNavGroup {
  id: string;
  label: string;
  items: AdminNavItem[];
}

/** القائمة الكاملة — مطابقة للوحة الموحدة */
export const adminNavGroups: AdminNavGroup[] = [
  {
    id: "general",
    label: "عام",
    items: [{ id: "dashboard", title: "لوحة التحكم", icon: LayoutDashboard }],
  },
  {
    id: "library",
    label: "المكتبة",
    items: [
      { id: "library-management", title: "إدارة المكتبة", icon: LibraryBig },
      { id: "books", title: "الكتب", icon: BookOpen },
      { id: "book-categories", title: "تصنيفات الكتب", icon: Tags },
      { id: "book-chapters", title: "فصول الكتب", icon: FileText },
    ],
  },
  {
    id: "game",
    label: "اللعبة",
    items: [
      { id: "game-chapters", title: "فصول اللعبة", icon: Swords },
      { id: "level-editor", title: "محرر المراحل", icon: Puzzle },
      { id: "daily-challenge", title: "تحدي اليوم", icon: CalendarDays },
      { id: "quality", title: "مدقّق الجودة", icon: ShieldCheck },
      { id: "difficulty", title: "موازنة الصعوبة", icon: Scale },
      { id: "skill-tree", title: "شجرة المهارات", icon: Network },
    ],
  },
  {
    id: "community",
    label: "المجتمع",
    items: [
      { id: "players", title: "اللاعبون والقرّاء", icon: Users },
      { id: "reviews", title: "المراجعات", icon: MessageSquare },
      { id: "messages", title: "الرسائل", icon: Mail },
    ],
  },
  {
    id: "system",
    label: "النظام",
    items: [
      { id: "roles", title: "الأدوار والصلاحيات", icon: KeyRound },
      { id: "audit", title: "سجل التدقيق", icon: ScrollText },
      { id: "reports", title: "التقارير", icon: BarChart3 },
      { id: "admin-settings", title: "الإعدادات", icon: Settings },
    ],
  },
];

/** بيانات وصفية لكل صفحة — عنوان ووصف يظهران في الترويسة */
export const adminPageMeta: Record<
  AdminPageId,
  { title: string; description: string }
> = {
  dashboard: {
    title: "لوحة التحكم",
    description:
      "لمحة شاملة عن محتوى المنصة — الفصول والمراحل والألغاز والمكتبة وصحة المحتوى",
  },
  "library-management": {
    title: "إدارة المكتبة",
    description: "مركز قيادة المكتبة — الكتب والتصنيفات والفصول في مكان واحد",
  },
  books: {
    title: "الكتب",
    description: "فهرس كتب المكتبة كاملاً — إضافة وتحرير وحذف وحالات النشر",
  },
  "book-categories": {
    title: "تصنيفات الكتب",
    description: "المحاور التي تُنظَّم عليها المكتبة — إدارة التصنيفات وترتيبها",
  },
  "book-chapters": {
    title: "فصول الكتب",
    description: "بنية الكتب الداخلية — فصول كل كتاب بترتيبها",
  },
  "game-chapters": {
    title: "فصول اللعبة",
    description: "خريطة المحتوى التعليمي — الفصول ومراحلها وإحصاءات كل مرحلة",
  },
  "level-editor": {
    title: "محرر المراحل",
    description:
      "تحرير بيانات المراحل وألغازها مباشرة من قاعدة لوحة الإدارة — المصدر الوحيد للحقيقة",
  },
  "daily-challenge": {
    title: "تحدي اليوم",
    description:
      "بنك سؤال واحد يوميًا وتثبيت السؤال والجلسات الموقّعة — التحقق والمكافأة على الخادم",
  },
  quality: {
    title: "مدقّق الجودة",
    description:
      "فحص آلي لكل لغز ومرحلة — البيانات الجوهرية المفقودة والنواقص التعليمية واقتصاد التلميحات",
  },
  difficulty: {
    title: "موازنة الصعوبة",
    description:
      "توزيع الصعوبة والنقاط والوقت عبر المراحل — لضمان منحنى تحدٍّ عادل",
  },
  "skill-tree": {
    title: "شجرة المهارات",
    description: "المحاور المعرفية التي تغطيها الألغاز — فئاتها وأنواعها ومراحلها",
  },
  players: {
    title: "اللاعبون والقرّاء",
    description: "نشاط اللاعبين والقرّاء — يتوسع مع نظام الحسابات في مرحلة قادمة",
  },
  reviews: {
    title: "المراجعات",
    description: "مراجعات الكتب وتقييمات الألغاز وإبلاغات المجتمع",
  },
  messages: {
    title: "الرسائل",
    description: "رسائل المستخدمين — اقتراحات وطلبات وإبلاغات عن أخطاء",
  },
  roles: {
    title: "الأدوار والصلاحيات",
    description: "إدارة أدوار فريق العمل وصلاحيات كل دور في اللوحة",
  },
  audit: {
    title: "سجل التدقيق",
    description: "كل عمليات التعديل التي تجريها من اللوحة في هذه الجلسة — سجل حي",
  },
  reports: {
    title: "التقارير",
    description: "تقارير جاهزية المحتوى وصحة المنصة — قابلة للتصدير لاحقاً",
  },
  "admin-settings": {
    title: "الإعدادات",
    description: "إعدادات اللوحة وبيانات اللعب المحلية ومعلومات النظام",
  },
};

/** تسميات عربية لأنواع الألغاز — للعرض الموحد في كل الصفحات */
export const puzzleTypeLabels: Record<string, string> = {
  text: "نصي",
  multiple: "اختيار متعدد",
  emoji: "إيموجي",
  image: "مصوّر",
  images4: "أربع صور",
  scrambled: "حروف مبعثرة",
  crossword: "شبكة متقاطعة",
  fillblank: "إكمال فراغات",
  matching: "ربط أزواج",
  audio: "صوتي",
  logic: "منطق ذهني",
  progressive: "متدرّج",
  mixed: "بوابة مركّبة",
};

/** تسميات عربية لدرجات الصعوبة */
export const difficultyLabels: Record<string, string> = {
  easy: "سهلة",
  medium: "متوسطة",
  hard: "صعبة",
};

/** تسميات عربية لدرجات خطورة ملاحظات الجودة */
export const severityLabels: Record<string, string> = {
  high: "عالية",
  medium: "متوسطة",
  low: "منخفضة",
};
