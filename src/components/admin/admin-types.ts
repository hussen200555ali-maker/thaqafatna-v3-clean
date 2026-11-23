/**
 * عقود بيانات لوحة الإدارة (Admin API Contracts)
 * =================================================
 * أشكال استجابات مسارات /api/admin/* كما تستهلكها الواجهة —
 * مرجع واحد يضمن تطابق الطرفين دون تكرار التعريفات.
 */

/** ملخص ملاحظات مدقق الجودة */
export interface AdminQualitySummary {
  high: number;
  medium: number;
  low: number;
  total: number;
}

/** استجابة GET /api/admin/stats */
export interface AdminStats {
  chapters: number;
  levels: number;
  puzzles: number;
  books: number;
  categories: number;
  bookChapters: number;
  quality: AdminQualitySummary;
  levelsByChapter: { id: string; title: string; levels: number }[];
  puzzlesByType: { type: string; count: number }[];
  recentLevels: {
    id: string;
    title: string;
    chapterTitle: string | null;
    order: number;
    difficulty: string | null;
  }[];
}

/** مرحلة كما تظهر في فهرس الفصول */
export interface AdminLevelSummary {
  id: string;
  title: string;
  difficulty: string | null;
  timeLimit: number | null;
  reward: number | null;
  hintCost: number | null;
  order: number;
  puzzleCount: number;
  totalPoints: number;
}

/** فصل لعبة مع مراحله */
export interface AdminChapter {
  id: string;
  title: string;
  order: number;
  levels: AdminLevelSummary[];
}

/** صف لغز كامل من قاعدة لوحة الإدارة (حقول مسطّحة) */
export interface AdminPuzzle {
  id: string;
  puzzleType: string;
  clue: string | null;
  text: string | null;
  options: string | null;
  correctOption: number | null;
  availableLetters: string | null;
  emojis: string | null;
  imageUrl: string | null;
  image2Url: string | null;
  image3Url: string | null;
  image4Url: string | null;
  audioUrl: string | null;
  logicData: string | null;
  matchPairs: string | null;
  fillBlanks: string | null;
  bonusWords: string | null;
  blankAnswers: string | null;
  hints: string | null;
  hint: string | null;
  explanation: string | null;
  points: number | null;
  hintCost: number | null;
  category: string | null;
  order: number | null;
  levelId: string | null;
}

/** تفاصيل مرحلة كاملة — محرر المراحل */
export interface AdminLevelDetail {
  id: string;
  title: string;
  difficulty: string | null;
  timeLimit: number | null;
  reward: number | null;
  hintCost: number | null;
  learningGoals: string | null;
  educationalDescription: string | null;
  chapterId: string | null;
  order: number;
  chapterTitle: string | null;
  puzzles: AdminPuzzle[];
}

/** ملاحظة جودة واحدة */
export interface AdminQualityIssue {
  id: string;
  severity: "high" | "medium" | "low";
  levelId: string;
  levelTitle: string;
  puzzleId: string | null;
  puzzleType: string | null;
  message: string;
}

/** عقدة شجرة المهارات — فئة ثقافية */
export interface AdminSkillNode {
  category: string;
  total: number;
  types: { type: string; count: number }[];
  levels: string[];
}

/** كتاب كما يُعرض في قوائم المكتبة */
export interface AdminBook {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  status: string;
  categoryId: string | null;
  categoryTitle: string | null;
  chapterCount: number;
  order: number;
}

/** تصنيف كتب */
export interface AdminCategory {
  id: string;
  title: string;
  icon: string | null;
  order: number;
  bookCount: number;
}

/** فصل كتاب */
export interface AdminBookChapter {
  id: string;
  bookId: string;
  bookTitle: string | null;
  title: string;
  order: number;
  /** نص الفصل للقراءة — null يعني بلا محتوى بعد */
  content: string | null;
}

/** مراجعة كتاب — كما تراها لوحة الإشراف */
export interface AdminReview {
  id: string;
  bookId: string;
  bookTitle: string | null;
  author: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected" | string;
  createdAt: string;
}

/** عدّادات المراجعات بكل حالة */
export interface AdminReviewCounts {
  pending: number;
  approved: number;
  rejected: number;
}

/** لاعب كما يظهر في شبكة اللاعبين (مزامنة بمعرّف الجهاز) */
export interface AdminPlayer {
  id: string;
  deviceId: string;
  name: string;
  points: number;
  stars: number;
  badgesCount: number;
  coins: number;
  levelsCompleted: number;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

/** رسالة مستخدم من صندوق الوارد */
export interface AdminMessage {
  id: string;
  senderName: string;
  kind: "suggestion" | "bug" | "request" | "other" | string;
  subject: string;
  body: string;
  /** رد الإشراف — null يعني بلا رد بعد */
  reply: string | null;
  status: "new" | "read" | "archived" | string;
  deviceId: string | null;
  createdAt: string;
}

/** عدّادات الرسائل بكل حالة */
export interface AdminMessageCounts {
  new: number;
  read: number;
  archived: number;
}

/** عضو فريق العمل */
export interface AdminTeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer" | string;
  active: boolean;
  createdAt: string;
}

/** قيد سجل التدقيق الدائم من قاعدة الإدارة */
export interface AdminAuditEntry {
  id: number;
  action: string;
  entity: string;
  detail: string;
  createdAt: string;
}

/** سؤال في بنك التحدي اليومي (أو مرشح للإضافة) */
export interface AdminDailyPuzzle {
  id: string;
  puzzleId: string;
  active?: boolean;
  addedAt?: string;
  puzzleType: string | null;
  clue: string | null;
  levelTitle: string | null;
  eligible: boolean;
}

/** تثبيت سؤال ليوم بعينه */
export interface AdminDailySchedule {
  dateKey: string;
  puzzleId: string | null;
  rewardOverride: number | null;
  note: string | null;
  puzzleType: string | null;
  clue: string | null;
  levelTitle: string | null;
}

/** جلسة لاعب في التحدي اليومي */
export interface AdminDailySession {
  id: string;
  deviceId: string;
  dateKey: string;
  status: string;
  attempts: number;
  reward: number;
  createdAt: string;
  completedAt: string | null;
}

/** استجابة GET /api/admin/daily */
export interface AdminDailyData {
  ok: boolean;
  dateKey: string;
  today: string;
  stats: { bank: number; active: number };
  bank: AdminDailyPuzzle[];
  schedule: AdminDailySchedule[];
  candidates: AdminDailyPuzzle[];
  sessions: AdminDailySession[];
}

/** إعدادات المنصة العامة — نموذج لوحة الإدارة */
export interface AdminPlatformSettings {
  appName: string;
  dailyChallengeReward: number;
  startingCoins: number;
  defaultHintCost: number;
  maintenanceMode: boolean;
}

/** دالة التنقل داخل اللوحة — الصفحة ومعرّف مرحلة اختياري */
export type AdminNavigate = (page: string, levelId?: string) => void;
