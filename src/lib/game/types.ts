/**
 * عقد بيانات اللعبة (Game Data Contract)
 * ========================================
 * المصدر الوحيد للحقيقة (Single Source of Truth) لشكل الأسئلة
 * القادمة من لوحة الإدارة — مطابق 1:1 لقيم حقل `puzzleType`
 * في مخطط Prisma الخاص بلوحة الإدارة:
 *
 *   text | image | images4 | emoji | scrambled | crossword
 *   | fillblank | matching | multiple | audio | logic
 *   | progressive | mixed
 *
 * المبدأ الهندسي:
 *   كل سؤال يصل من الخادم عبارة عن JSON له حقل `type` مميِّز،
 *   وباقي الحقول يحدّدها نوع السؤال (Discriminated Union) —
 *   لذا يكتمل فحص الأنواع في زمن الترجمة (Compile-time Safety)
 *   ولا يصل أي شكل بيانات غير متوقع إلى الواجهة دون أن نعلم.
 *
 * طبقة التحويل (لتُبنى لاحقاً في src/lib/game/normalize.ts):
 *   تصفّ الحقول المسطّحة في قاعدة البيانات (مثل options مفصولة بـ|)
 *   وتحوّلها إلى هذا الشكل الطبيعي قبل وصولها للمكونات.
 */

/* ============================================================
   1) أنواع الألغاز — مطابقة لحقل puzzleType في لوحة الإدارة
   ============================================================ */

export type PuzzleType =
  | "text"
  | "image"
  | "images4"
  | "emoji"
  | "scrambled"
  | "crossword"
  | "fillblank"
  | "matching"
  | "multiple"
  | "audio"
  | "logic"
  | "progressive"
  | "mixed";

/* ============================================================
   2) المغلّف المشترك — حقول يفهمها كل نوع
   ============================================================ */

export interface BaseQuestion {
  /** معرّف فريد للسؤال */
  id: string;
  /** نوع السؤال — المفتاح المميِّز للـ Union */
  type: PuzzleType;
  /** نص السؤال أو التلميح العام — يُسمح بالنصوص الطويلة */
  clue: string;
  /** تصنيف ثقافي من لوحة الإدارة (من؟ ماذا؟ أين؟ ...) */
  category?: string;
  /** نقاط السؤال عند الإجابة الصحيحة */
  points: number;
  /** تكلفة التلميح بالعملات */
  hintCost: number;
  /** تلميح يُكشف مقابل العملات (زر التلميح في القشرة الموحدة) */
  hint?: string;
  /** شرح تعليمي يظهر بعد الإجابة (صحيحة أو خاطئة) */
  explanation?: string;
}

/* ============================================================
   3) تعريف الأنواع الثلاثة عشر
   ============================================================ */

/** 1) سؤال نصي مباشر — الإجابة كلمة يكتبها اللاعب */
export interface TextQuestion extends BaseQuestion {
  type: "text";
  answer: string;
  /** عدد أحرف الإجابة — لضبط حجم مربع الكتابة */
  answerLength?: number;
}

/** 2) لغز صورة واحدة — من حقل imageUrl */
export interface ImageQuestion extends BaseQuestion {
  type: "image";
  imageUrl: string;
  answer: string;
}

/** 3) لغز أربع صور — من حقول image2Url..image4Url */
export interface Images4Question extends BaseQuestion {
  type: "images4";
  images: string[];
  answer: string;
}

/** 4) لغز الإيموجي — من حقل emojis */
export interface EmojiQuestion extends BaseQuestion {
  type: "emoji";
  emojis: string;
  answer: string;
}

/** 5) حروف مبعثرة — من حقلي availableLetters و text */
export interface ScrambledQuestion extends BaseQuestion {
  type: "scrambled";
  /** الكلمة الصحيحة */
  answer: string;
  /** الحروف المبعثرة المتاحة للاعب */
  letters: string[];
  /** كلمات إضافية اختيارية تمنح مكافآت — من حقل bonusWords */
  bonusWords?: string[];
}

/** خلية داخل الشبكة المتقاطعة — من نموذج Cell */
export interface CrosswordCell {
  row: number;
  col: number;
  /** الحرف الصحيح — null تعني خلية معطّلة (سوداء) */
  letter: string | null;
  /** رقم بداية الكلمة (يظهر صغيراً في زاوية الخلية) */
  number?: number;
}

/** كلمة داخل الشبكة — مشتقة من نموذج Word بحقوله الاتجاهية */
export interface CrosswordWord {
  number: number;
  direction: "across" | "down";
  /** إحداثيات الخلية الأولى */
  row: number;
  col: number;
  /** عدد حروف الكلمة */
  length: number;
  /** تلميح الكلمة */
  clue: string;
  /** الإجابة — تُستخدم للتحقق ولمساعدة اللاعب عند الخطأ */
  answer: string;
}

/** 6) الشبكة المتقاطعة — تجمّع نماذج Cell و Word في بنية واحدة
 *
 * ملاحظة الاتجاه (RTL): العمود 0 هو العمود الأيمن في العرض،
 * والكلمات الأفقية تمتد بزيادة col (أي نحو اليسار بصرياً) —
 * وهذا يطابق اتجاه الكتابة العربية الطبيعي.
 */
export interface CrosswordQuestion extends BaseQuestion {
  type: "crossword";
  rows: number;
  cols: number;
  /** الخلايا النشطة فقط (الخلايا المعطّلة لا تُرسل أصلاً) */
  cells: CrosswordCell[];
  words: CrosswordWord[];
  /** حروف لوحة المفاتيح — من حقل availableLetters (اختياري:
   *  عند غيابه تُشتق تلقائياً من حروف الشبكة) */
  letters?: string[];
}

/** مقطع نصي أو فراغ في سؤال إكمال الفراغات */
export type FillBlankSegment =
  | { kind: "text"; text: string }
  | { kind: "blank"; id: number; answer: string; width?: number };

/** 7) إكمال الفراغات — من حقل fillBlanks (الفراغ = ___ في قاعدة البيانات) */
export interface FillBlankQuestion extends BaseQuestion {
  type: "fillblank";
  /** النص مقسّماً إلى مقاطع ثابتة وفراغات مرقّمة */
  segments: FillBlankSegment[];
  /** بنك الكلمات للاختيار */
  bank: string[];
}

/** 8) توصيل وربط — من حقل matchPairs */
export interface MatchingPair {
  left: string;
  right: string;
}

export interface MatchingQuestion extends BaseQuestion {
  type: "matching";
  pairs: MatchingPair[];
}

/** 9) الاختيار من متعدد — من حقلي options و correctOption */
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple";
  options: string[];
  /** فهرس الخيار الصحيح (يبدأ من صفر — مطابق لحقل correctOption) */
  correctIndex: number;
}

/** 10) لغز صوتي — من حقل audioUrl
 *
 * الحروف: من حقل availableLetters إن وُجد (مع مشتّتات يضيفها
 * المحرر)، وإلا تُشتق من الإجابة في المُصيّر — سلوك موحّد
 * مع بقية الأنواع الحرفية.
 */
export interface AudioQuestion extends BaseQuestion {
  type: "audio";
  audioUrl: string;
  answer: string;
  /** حروف لوحة الإجابة — اختيارية من لوحة الإدارة */
  letters?: string[];
}

/** 11) لغز ذهني — من حقل logicData (JSON حرّ)
 *
 * الأشكال المدعومة في المُصيّر (يكشفها المُحلّل الدفاعي):
 *   { "kind": "sequence", "items": [...], "options": [...], "correctIndex": n }
 *   { "kind": "oddOne",   "items": [...], "correctIndex": n }
 */
export interface LogicQuestion extends BaseQuestion {
  type: "logic";
  logicData: Record<string, unknown>;
}

/** 12) تلميحات متدرجة — تُكشف واحداً تلو الآخر
 *
 * الدرجات الأولى تُكشف مجاناً كجوهر النوع، والدرجات التالية
 * تكلّف عملات عبر onSpendCoins (اقتصاد داخلي للمُصيّر).
 */
export interface ProgressiveQuestion extends BaseQuestion {
  type: "progressive";
  answer: string;
  hints: string[];
  /** حروف لوحة الإجابة — اختيارية من لوحة الإدارة */
  letters?: string[];
}

/** 13) مرحلة مختلطة (بوس) — سلسلة أسئلة متتابعة من أنواع مختلفة */
export interface MixedQuestion extends BaseQuestion {
  type: "mixed";
  stages: Question[];
}

/* ============================================================
   4) الاتحاد المميَّز — كل سؤال هو واحد من هذه الأنواع
   ============================================================ */

export type Question =
  | TextQuestion
  | ImageQuestion
  | Images4Question
  | EmojiQuestion
  | ScrambledQuestion
  | CrosswordQuestion
  | FillBlankQuestion
  | MatchingQuestion
  | MultipleChoiceQuestion
  | AudioQuestion
  | LogicQuestion
  | ProgressiveQuestion
  | MixedQuestion;

/* ============================================================
   5) أشكال حالة الإجابة لكل نوع — يجعلها السجل والاختبارات
      قابلة للتنبؤ دون التعميم بـ any
   ============================================================ */

export interface AnswerStateMap {
  text: string;
  image: string;
  images4: string;
  emoji: string;
  scrambled: (string | null)[];
  crossword: Record<string, string>;
  fillblank: (string | null)[];
  matching: Record<string, string>;
  multiple: number | null;
  audio: string;
  logic: unknown;
  progressive: string;
  mixed: unknown[];
}

/* ============================================================
   6) مغلف المرحلة (Level) — مطابق لنموذج Level في لوحة الإدارة
   ============================================================ */

export type LevelDifficulty = "easy" | "medium" | "hard";

export interface GameLevel {
  id: string;
  title: string;
  /** اسم الفصل الذي تنتمي إليه المرحلة — من نموذج Chapter */
  chapterTitle?: string;
  difficulty: LevelDifficulty;
  /** الحد الزمني الإجمالي بالثواني — صفر يعني بلا وقت */
  timeLimit: number;
  /** المكافأة الافتراضية للمرحلة */
  reward: number;
  /** تكلفة التلميح الافتراضية */
  hintCost: number;
  /** الأهداف التربوية — من حقل learningGoals، تُعرض قبل البدء */
  learningGoals: string[];
  /** وصف تربوي مختصر — من حقل educationalDescription */
  educationalDescription?: string;
  questions: Question[];
}

/* ============================================================
   7) حالة السؤال ونتيجته — تديرها الحاوية الرئيسية
   ============================================================ */

/** مرحلة السؤال الحالية داخل الحاوية */
export type QuestionStatus = "answering" | "correct" | "wrong" | "skipped";

/** نتيجة سؤال بعد حله — تُستخدم في النقاط وشاشة الملخص */
export interface QuestionResult {
  questionId: string;
  type: PuzzleType;
  result: Exclude<QuestionStatus, "answering">;
  earnedPoints: number;
}

/* ============================================================
   8) عقد واجهة كل مُصيِّر سؤال — العقد الموحد الذي يجعل
      المكونات قابلة للاستبدال (Plugin Architecture)
   ============================================================ */

export interface QuestionRendererProps {
  /** السؤال الحالي (مميَّز النوع) */
  question: Question;
  /** حالة إجابة اللاعب — شكلها يتحدد حسب النوع (AnswerStateMap) */
  answer: unknown;
  onAnswerChange: (next: unknown) => void;
  /** مرحلة السؤال: يجيب | صحيح | خطأ | مُتخطّى */
  status: QuestionStatus;
  /** للأنواع غير المُفعّلة بعد — تخطٍّ أنيق بلا نقاط */
  onSkip?: () => void;
  /** مصروف العملات من داخل المُصيّر — يعيد false إن كان الرصيد
   *  غير كافٍ (مع إشعار الحاوية) — اقتصاد مفتوح لأنواع المستقبل */
  onSpendCoins?: (amount: number) => boolean;
  /** إرسال برمجي لمنطق التأكيد — للمُصيّرات المالكة لتدفقها
   *  الخاص (المرحلة المختلطة مثلاً تُنهي محطاتها ثم تحكم) */
  onSubmit?: () => void;
}
