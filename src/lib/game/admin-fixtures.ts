/**
 * بيانات لوحة الإدارة التجريبية (Admin-Shaped Fixtures)
 * ==========================================================
 * صفوف خام تحاكي — حرفياً — ما يُرجعه استعلام Prisma من قاعدة
 * بيانات لوحة الإدارة: حقول مسطّحة، خيارات مفصولة بـ |، وJSON
 * نصي للأزواج، وترتيب عبر order.
 *
 * الغاية: إثبات أن طبقة التطبيع (normalize.ts) تعمل على شكل
 * التخزين الفعلي — فالمرحلة الثانية في الصفحة الرئيسية تُحمَّل
 * عبر GET /api/levels/2 الذي يمرّر هذه الصفوف عبر التطبيع قبل
 * وصولها للواجهة.
 *
 * عند ربط قاعدة الإدارة الحقيقية: يُستبدل هذا الملف باستعلام
 * Prisma في الـ Route Handler — ولا يتغير سطر واحد في التطبيع
 * أو في أي مُصيّر واجهة.
 */

import type { AdminLevelRow } from "./normalize";

/* ============================================================
   المرحلة الثانية — «ألغاز مصوّرة» (الأنواع الخمسة الجديدة)
   ============================================================ */

export const adminLevel2Row: AdminLevelRow = {
  id: "level-2",
  title: "ألغاز مصوّرة",
  chapter: { title: "الفصل الثاني — لوحة الألغاز المصوّرة" },
  difficulty: "easy",
  timeLimit: 240, // ٤ دقائق — وصف المرحلة في الصفحة الرئيسية
  reward: 60,
  hintCost: 10,
  learningGoals:
    '["قراءة الصور والرموز واستنتاج الكلمة الجامعة بينها","ربط أعلام الفكر العربي بأشهر مؤلفاتهم","ترسيخ مفردات المكان والزمان في الذاكرة الثقافية"]',
  educationalDescription:
    "خمسة ألغاز من الجيل الثاني: صور وإيموجي وربط أزواج وكتابة حرة — تختبر عينك الثقافية وسرعة بديهتك في وقت محدود.",
  puzzles: [
    /* ---------- 1) سؤال نصي — كتابة حرة ---------- */
    {
      id: "p2-1",
      puzzleType: "text",
      clue: "في أي مدينة تقع القبة الصخرية ذات القبة الذهبية الشهيرة، والتي تُعد من أقدم وأجمل المعالم الإسلامية على الإطلاق؟",
      text: "القدس",
      options: null,
      correctOption: null,
      availableLetters: null,
      emojis: null,
      imageUrl: null,
      image2Url: null,
      image3Url: null,
      image4Url: null,
      audioUrl: null,
      logicData: null,
      matchPairs: null,
      fillBlanks: null,
      bonusWords: null,
      blankAnswers: null,
      hints: null,
      hint: "مدينةٌ تتجه إليها القِبلة الأولى، وفيها المسجد الأقصى.",
      explanation:
        "القدس — فيها المسجد الأقصى والقبة الصخرية التي بناها عبد الملك بن مروان عام ٦٩١م، وتُعد تحفة العمارة الإسلامية.",
      points: 40,
      hintCost: 10,
      category: "أماكن ومعالم",
      order: 1,
    },

    /* ---------- 2) لغز الإيموجي ---------- */
    {
      id: "p2-2",
      puzzleType: "emoji",
      clue: "اقرأ الرموز واستنتج الشهر الهجري الذي تُعقد فيه موائد الإفطار الجماعية بعد غروب الشمس.",
      text: "رمضان",
      options: null,
      correctOption: null,
      availableLetters: null, // الحروف تُشتق من الإجابة تلقائياً في المُصيّر
      emojis: "🕌🌙🍽️",
      imageUrl: null,
      image2Url: null,
      image3Url: null,
      image4Url: null,
      audioUrl: null,
      logicData: null,
      matchPairs: null,
      fillBlanks: null,
      bonusWords: null,
      blankAnswers: null,
      hints: null,
      hint: "شهرُ الصيام، وهو التاسع في التقويم الهجري.",
      explanation:
        "رمضان — شهر الصيام والقرآن، تُقام فيه موائد الرحمن وتتوّج لياليه بالعبادة والصلوات.",
      points: 50,
      hintCost: 10,
      category: "شعائر ومناسبات",
      order: 2,
    },

    /* ---------- 3) لغز مصوّر — صورة واحدة ---------- */
    {
      id: "p2-3",
      puzzleType: "image",
      clue: "ماذا نسمّي هذا المكان الذي تجتمع فيه المخطوطات والكتب لتبقى ذاكرة الأمم حاضرةً بين الأجيال؟",
      text: "المكتبة",
      options: null,
      correctOption: null,
      availableLetters: null,
      emojis: null,
      imageUrl: "/images/game/library.png",
      image2Url: null,
      image3Url: null,
      image4Url: null,
      audioUrl: null,
      logicData: null,
      matchPairs: null,
      fillBlanks: null,
      bonusWords: null,
      blankAnswers: null,
      hints: null,
      hint: "بيتُ الكتب — وواحدتها الشهيرة «دار الحكمة» في بغداد.",
      explanation:
        "المكتبة — من أعظمها بيت الحكمة البغدادي الذي أسسه هارون الرشيد ثم ازدهر في عهد المأمون.",
      points: 60,
      hintCost: 10,
      category: "أماكن ومعالم",
      order: 3,
    },

    /* ---------- 4) أربع صور — كلمة جامعة ---------- */
    {
      id: "p2-4",
      puzzleType: "images4",
      clue: "أربع صور تجمعها مهنةٌ وحبٌّ عربيٌّ خالد — ما الكلمة الجامعة بينها؟",
      text: "الكتابة",
      options: null,
      correctOption: null,
      availableLetters: null,
      emojis: null,
      imageUrl: "/images/game/calligraphy.png",
      image2Url: "/images/game/manuscript.png",
      image3Url: "/images/game/reed-pen.png",
      image4Url: "/images/game/inkwell.png",
      audioUrl: null,
      logicData: null,
      matchPairs: null,
      fillBlanks: null,
      bonusWords: null,
      blankAnswers: null,
      hints: null,
      hint: "فنٌّ يبدأ بالقلم وينتهي بالمخطوط — وللعرب فيه مدارس كبرى.",
      explanation:
        "الكتابة — القلم والمحبرة والخط والمخطوط: أدوات صنعت معرفة الحضارة العربية الإسلامية كلها.",
      points: 70,
      hintCost: 15,
      category: "فنون وحرف",
      order: 4,
    },

    /* ---------- 5) توصيل وربط — أعلام ومؤلفات ---------- */
    {
      id: "p2-5",
      puzzleType: "matching",
      clue: "اربط كل عَلَمٍ من أعلام الفكر العربي بكتابه الأشهر — أربع ثنائيات خالدة من ذاكرة الأدب العربي.",
      text: null,
      options: null,
      correctOption: null,
      availableLetters: null,
      emojis: null,
      imageUrl: null,
      image2Url: null,
      image3Url: null,
      image4Url: null,
      audioUrl: null,
      logicData: null,
      // JSON نصي — تماماً كما يُخزَّن في قاعدة الإدارة
      matchPairs:
        '[{"left":"ابن خلدون","right":"المقدمة"},{"left":"ابن المقفّع","right":"كليلة ودمنة"},{"left":"الجاحظ","right":"البيان والتبيين"},{"left":"أبو العلاء المعري","right":"رسالة الغفران"}]',
      fillBlanks: null,
      bonusWords: null,
      blankAnswers: null,
      hints: null,
      hint: "صاحب «البيان والتبيين» هو إمام النثر العباسي البصري الأشهر.",
      explanation:
        "ابن خلدون: المقدمة، ابن المقفّع: كليلة ودمنة، الجاحظ: البيان والتبيين، أبو العلاء المعري: رسالة الغفران.",
      points: 80,
      hintCost: 15,
      category: "أعلام ومؤلفات",
      order: 5,
    },
  ],
};

/* ============================================================
   فهرس المراحل التجريبية — بديل استعلام Prisma حتى الربط
   ============================================================ */

const FIXTURES: Record<string, AdminLevelRow> = {
  "2": adminLevel2Row,
  "level-2": adminLevel2Row,
};

/** جلب صف مرحلة تجريبية بمعرّفها — يُستبدل لاحقاً باستعلام Prisma */
export function getAdminLevelFixture(id: string): AdminLevelRow | null {
  return FIXTURES[id] ?? null;
}
