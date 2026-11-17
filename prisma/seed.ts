/**
 * سكربت البذر (Database Seed)
 * ===============================
 * يهيّئ قاعدة لوحة الإدارة بمحتوى حقيقي جاهز للعب:
 *
 *   • الفصل الثاني + المرحلة 2 «ألغاز مصوّرة» — نفس محتوى
 *     الـ fixtures سابقاً، لكن من المصدر الرسمي الآن (إثبات
 *     أن خط Prisma ← التطبيع ← الواجهة يعمل بلا تغيير حرف).
 *
 *   • الفصل الثالث + المرحلة 3 «حصن الحكماء» — نجمة المرحلة
 *     الثالثة: لغز صوتي بمقطع TTS حقيقي، لغزا منطق (متتالية
 *     وشاذ)، سُلّم تلميحات متدرجة، ثم بوابة بوس مختلطة من
 *     ثلاث محطات عبر جدول الوصل MixedStage.
 *
 * التشغيل: bun run db:seed
 * عناصرية (Idempotent): يحذف المرحلتين المعاديتين إن وُجدتا ثم
 * يعيد إنشاءهما — فلا تتضاعف البيانات بتكرار التشغيل.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ============================================================
   أدوات البذر
   ============================================================ */

/** شكل لغز خامّ — مطابق لحقول نموذج Puzzle في Prisma */
interface SeedPuzzle {
  id: string;
  puzzleType: string;
  clue: string;
  text?: string | null;
  options?: string | null;
  correctOption?: number | null;
  availableLetters?: string | null;
  emojis?: string | null;
  imageUrl?: string | null;
  image2Url?: string | null;
  image3Url?: string | null;
  image4Url?: string | null;
  audioUrl?: string | null;
  logicData?: string | null;
  matchPairs?: string | null;
  fillBlanks?: string | null;
  bonusWords?: string | null;
  blankAnswers?: string | null;
  hints?: string | null;
  hint?: string | null;
  explanation?: string | null;
  points?: number | null;
  hintCost?: number | null;
  category?: string | null;
  order: number;
}

/** إنشاء لغز مع علاقاته (بلا محطات — تُنشأ بمرحلة لاحقة) */
async function createPuzzle(levelId: string, seed: SeedPuzzle) {
  const { order, ...fields } = seed;
  return prisma.puzzle.create({
    data: {
      ...fields,
      order,
      levelId,
    },
  });
}

/** حذف مرحلة بكل تبعاتها (ألغازها ومحطات بوسها) */
async function purgeLevel(levelId: string) {
  const puzzles = await prisma.puzzle.findMany({
    where: { levelId },
    select: { id: true },
  });
  const puzzleIds = puzzles.map((p) => p.id);

  /* محطات البوس: أباؤها ومحطاتها كلها داخل هذه القائمة */
  if (puzzleIds.length > 0) {
    await prisma.mixedStage.deleteMany({
      where: {
        OR: [
          { parentPuzzleId: { in: puzzleIds } },
          { stagePuzzleId: { in: puzzleIds } },
        ],
      },
    });
    await prisma.cell.deleteMany({ where: { puzzleId: { in: puzzleIds } } });
    await prisma.word.deleteMany({ where: { puzzleId: { in: puzzleIds } } });
  }
  await prisma.puzzle.deleteMany({ where: { levelId } });
  await prisma.level.deleteMany({ where: { id: levelId } });
}

/* ============================================================
   التنفيذ
   ============================================================ */

async function main() {
  console.log("— بدء بذر قاعدة بيانات لوحة الإدارة");

  /* ---------- تنظيف المعاد بذره (عناصرية) ---------- */
  await purgeLevel("level-2");
  await purgeLevel("level-3");
  await prisma.chapter.deleteMany({ where: { id: { in: ["chapter-2", "chapter-3"] } } });
  console.log("• نُظّفت المراحل المعاد بذروها إن وُجدت");

  /* ============================================================
     الفصل الثاني — المرحلة 2: ألغاز مصوّرة (من محتوى fixtures)
     ============================================================ */
  const chapter2 = await prisma.chapter.create({
    data: { id: "chapter-2", title: "الفصل الثاني — لوحة الألغاز المصوّرة", order: 2 },
  });

  const level2 = await prisma.level.create({
    data: {
      id: "level-2",
      title: "ألغاز مصوّرة",
      difficulty: "easy",
      timeLimit: 240,
      reward: 60,
      hintCost: 10,
      learningGoals:
        '["قراءة الصور والرموز واستنتاج الكلمة الجامعة بينها","ربط أعلام الفكر العربي بأشهر مؤلفاتهم","ترسيخ مفردات المكان والزمان في الذاكرة الثقافية"]',
      educationalDescription:
        "خمسة ألغاز من الجيل الثاني: صور وإيموجي وربط أزواج وكتابة حرة — تختبر عينك الثقافية وسرعة بديهتك في وقت محدود.",
      chapterId: chapter2.id,
      order: 2,
    },
  });

  await createPuzzle(level2.id, {
    id: "p2-1",
    puzzleType: "text",
    clue: "في أي مدينة تقع القبة الصخرية ذات القبة الذهبية الشهيرة، والتي تُعد من أقدم وأجمل المعالم الإسلامية على الإطلاق؟",
    text: "القدس",
    hint: "مدينةٌ تتجه إليها القِبلة الأولى، وفيها المسجد الأقصى.",
    explanation:
      "القدس — فيها المسجد الأقصى والقبة الصخرية التي بناها عبد الملك بن مروان عام ٦٩١م، وتُعد تحفة العمارة الإسلامية.",
    points: 40,
    hintCost: 10,
    category: "أماكن ومعالم",
    order: 1,
  });

  await createPuzzle(level2.id, {
    id: "p2-2",
    puzzleType: "emoji",
    clue: "اقرأ الرموز واستنتج الشهر الهجري الذي تُعقد فيه موائد الإفطار الجماعية بعد غروب الشمس.",
    text: "رمضان",
    emojis: "🕌🌙🍽️",
    hint: "شهرُ الصيام، وهو التاسع في التقويم الهجري.",
    explanation:
      "رمضان — شهر الصيام والقرآن، تُقام فيه موائد الرحمن وتتوّج لياليه بالعبادة والصلوات.",
    points: 50,
    hintCost: 10,
    category: "شعائر ومناسبات",
    order: 2,
  });

  await createPuzzle(level2.id, {
    id: "p2-3",
    puzzleType: "image",
    clue: "ماذا نسمّي هذا المكان الذي تجتمع فيه المخطوطات والكتب لتبقى ذاكرة الأمم حاضرةً بين الأجيال؟",
    text: "المكتبة",
    imageUrl: "/images/game/library.png",
    hint: "بيتُ الكتب — وواحدتها الشهيرة «دار الحكمة» في بغداد.",
    explanation:
      "المكتبة — من أعظمها بيت الحكمة البغدادي الذي أسسه هارون الرشيد ثم ازدهر في عهد المأمون.",
    points: 60,
    hintCost: 10,
    category: "أماكن ومعالم",
    order: 3,
  });

  await createPuzzle(level2.id, {
    id: "p2-4",
    puzzleType: "images4",
    clue: "أربع صور تجمعها مهنةٌ وحبٌّ عربيٌّ خالد — ما الكلمة الجامعة بينها؟",
    text: "الكتابة",
    imageUrl: "/images/game/calligraphy.png",
    image2Url: "/images/game/manuscript.png",
    image3Url: "/images/game/reed-pen.png",
    image4Url: "/images/game/inkwell.png",
    hint: "فنٌّ يبدأ بالقلم وينتهي بالمخطوط — وللعرب فيه مدارس كبرى.",
    explanation:
      "الكتابة — القلم والمحبرة والخط والمخطوط: أدوات صنعت معرفة الحضارة العربية الإسلامية كلها.",
    points: 70,
    hintCost: 15,
    category: "فنون وحرف",
    order: 4,
  });

  await createPuzzle(level2.id, {
    id: "p2-5",
    puzzleType: "matching",
    clue: "اربط كل عَلَمٍ من أعلام الفكر العربي بكتابه الأشهر — أربع ثنائيات خالدة من ذاكرة الأدب العربي.",
    matchPairs:
      '[{"left":"ابن خلدون","right":"المقدمة"},{"left":"ابن المقفّع","right":"كليلة ودمنة"},{"left":"الجاحظ","right":"البيان والتبيين"},{"left":"أبو العلاء المعري","right":"رسالة الغفران"}]',
    hint: "صاحب «البيان والتبيين» هو إمام النثر العباسي البصري الأشهر.",
    explanation:
      "ابن خلدون: المقدمة، ابن المقفّع: كليلة ودمنة، الجاحظ: البيان والتبيين، أبو العلاء المعري: رسالة الغفران.",
    points: 80,
    hintCost: 15,
    category: "أعلام ومؤلفات",
    order: 5,
  });
  console.log("• بُذرت المرحلة 2 (٥ ألغاز مصوّرة) من المصدر الرسمي");

  /* ============================================================
     الفصل الثالث — المرحلة 3: حصن الحكماء (محتوى المرحلة الثالثة)
     ============================================================ */
  const chapter3 = await prisma.chapter.create({
    data: { id: "chapter-3", title: "الفصل الثالث — حصن الحكماء", order: 3 },
  });

  const level3 = await prisma.level.create({
    data: {
      id: "level-3",
      title: "حصن الحكماء",
      difficulty: "medium",
      timeLimit: 360,
      reward: 100,
      hintCost: 10,
      learningGoals:
        '["تنمية الإصغاء النشط واستخراج المعلومة من المسموع","تدريب الاستدلال المنطقي واكتشاف الشاذ والمفقود","صقل مهارة الاستنتاج المتدرج من التلميحات","خوض تحدي البوس المختلط بثقة وتركيز"]',
      educationalDescription:
        "أربعة تحديات من الجيل الثالث: مقطع صوتي بمشغّلٍ تراثي، لغزا منطق، سُلّم تلميحات، ثم بوابة بوس مختلطة تختبر ما تعلمته.",
      chapterId: chapter3.id,
      order: 3,
    },
  });

  /* ---------- 1) اللغز الصوتي — المقطع الحقيقي (TTS) ---------- */
  await createPuzzle(level3.id, {
    id: "p3-1",
    puzzleType: "audio",
    clue: "شغّل المقطع واستمع بتمعّن — حكمةٌ عربية خالدة تُختم بكلمةٍ واحدة. رتّب حروفها بعد الإصغاء.",
    text: "الحجر",
    audioUrl: "/audio/heritage-proverb.wav",
    availableLetters: "ا|ل|ح|ج|ر|م|س|و",
    hint: "الشيء الصلب الذي إذا نُقش عليه لا يُمحى أثره.",
    explanation:
      "قالت العرب: «العلم في الصغر كالنقش على الحجر» — تشبيهاً لرسوخ ما يتعلمه الصغير في نفسه.",
    points: 60,
    hintCost: 10,
    category: "حكم وأمثال",
    order: 1,
  });

  /* ---------- 2) منطق: متتالية الأشهر الحرم ---------- */
  await createPuzzle(level3.id, {
    id: "p3-2",
    puzzleType: "logic",
    clue: "ثلاثة من الأشهر الحرم الأربعة ظهرت في المتتالية — أي شهرٍ حرمٍ هو الغائب الذي يُكملها؟",
    logicData: JSON.stringify({
      kind: "sequence",
      items: ["ذو القعدة", "ذو الحجة", "محرم"],
      options: ["رجب", "شعبان", "رمضان", "شوال"],
      correctIndex: 0,
    }),
    hint: "ليس بعد محرم مباشرة — إنه الشهر الحرم الوحيد الذي يأتي منفرداً في وسط السنة.",
    explanation:
      "الأشهر الحرم أربعة: ذو القعدة وذو الحجة ومحرم ورجب — ورجب ينفرد بينها بوقوعه في وسط السنة.",
    points: 70,
    hintCost: 10,
    category: "منطق وأشهر",
    order: 2,
  });

  /* ---------- 3) منطق: الشاذ بين المعالم ---------- */
  await createPuzzle(level3.id, {
    id: "p3-3",
    puzzleType: "logic",
    clue: "ثلاثة من هذه المعالم مساجد تُشدّ إليها الرحال، ورابعها ليس مسجداً — التقط الشاذ بينها.",
    logicData: JSON.stringify({
      kind: "oddOne",
      items: ["المسجد الحرام", "المسجد النبوي", "المسجد الأقصى", "قصر الحمراء"],
      correctIndex: 3,
    }),
    hint: "الشاذ قصرٌ أندلسيٌّ شهد سقوط غرناطة عام ٨٩٧هـ.",
    explanation:
      "قصر الحمراء في غرناطة قصرٌ أندلسي وليس مسجداً، بينما الثلاثة الأخرى هي المساجد التي لا تُشد الرحال إلا إليها.",
    points: 70,
    hintCost: 10,
    category: "منطق ومعالم",
    order: 3,
  });

  /* ---------- 4) التلميحات المتدرجة — البوصلة ---------- */
  await createPuzzle(level3.id, {
    id: "p3-4",
    puzzleType: "progressive",
    clue: "سُلّم الاستنتاج: كل درجةٍ تلميحٌ أصرح من سابقتها — فما الآلة البحرية المجهولة؟",
    text: "البوصلة",
    availableLetters: "ا|ل|ب|و|ص|ل|ة|ن|ر|م",
    hints: JSON.stringify([
      "آلة قديمة رافقت البحّارة العرب في رحلاتهم الطويلة عبر المحيطات.",
      "تعتمد في عملها على إبرةٍ ممغنطة تشير دائماً نحو الشمال.",
      "استعملها البحّار أحمد بن ماجد في الإبحار من الخليج إلى الهند والصين.",
    ]),
    explanation:
      "البوصلة — إبرة ممغنطة تنتظم في اتجاه الشمال، ارتبط اسمها بالملاحة العربية في المحيطين الهندي والهادئ.",
    points: 80,
    hintCost: 10,
    category: "اختراعات ورحلات",
    order: 4,
  });

  /* ---------- 5) البوس المختلط — ثلاث محطات عبر جدول الوصل ---------- */
  const boss = await createPuzzle(level3.id, {
    id: "p3-5",
    puzzleType: "mixed",
    clue: "بوابة الخاتمة: ثلاث محطات متتابعة من أنواع مختلفة — أجب عنها كلها بإتقان لتهزم حصن الحكماء!",
    hint: null,
    explanation:
      "«اقرأ» أول كلمات الوحي نزلتً بمكة، وفي ليلة القدر نزل القرآن — هكذا اكتملت حلقة الكتاب في بوابة الخاتمة.",
    points: 150,
    hintCost: 15,
    category: "بوابة البوس",
    order: 5,
  });

  /* المحطات الثلاث — ألغاز مستقلة بلا مرحلة، يربطها جدول الوصل */
  const stage1 = await prisma.puzzle.create({
    data: {
      id: "p3-5-s1",
      puzzleType: "multiple",
      clue: "ما الكلمة الأولى التي نزلت من القرآن الكريم على نبينا محمد ﷺ في غار حراء؟",
      options: "اقرأ|قم|سبّح|نادِ",
      correctOption: 0,
      hint: null,
      explanation: "«اقرأ باسم ربك الذي خلق» — أول آيات الوحي نزولاً.",
      points: 30,
      category: "قرآن ووحي",
      order: 1,
    },
  });

  const stage2 = await prisma.puzzle.create({
    data: {
      id: "p3-5-s2",
      puzzleType: "emoji",
      clue: "الرموز تحدد المدينة التي بدأ فيها نزول الوحي — رتّب حروف اسمها.",
      text: "مكة",
      emojis: "🕋🌙📜",
      hint: null,
      explanation: "مكة المكرمة — فيها غار حراء حيث بدأ نزول الوحي.",
      points: 30,
      category: "أماكن مقدسة",
      order: 2,
    },
  });

  const stage3 = await prisma.puzzle.create({
    data: {
      id: "p3-5-s3",
      puzzleType: "scrambled",
      clue: "المحطة الأخيرة: رتّب حروف الكتاب المنزَّل الذي أُنزل في ليلة القدر المباركة.",
      text: "القرآن",
      availableLetters: "ا|ل|ق|ر|آ|ن",
      hint: null,
      explanation: "القرآن الكريم — «إنا أنزلناه في ليلة القدر».",
      points: 30,
      category: "قرآن ووحي",
      order: 3,
    },
  });

  /* ربط المحطات بالبوس بترتيبها */
  await prisma.mixedStage.createMany({
    data: [
      { parentPuzzleId: boss.id, stagePuzzleId: stage1.id, order: 1 },
      { parentPuzzleId: boss.id, stagePuzzleId: stage2.id, order: 2 },
      { parentPuzzleId: boss.id, stagePuzzleId: stage3.id, order: 3 },
    ],
  });
  console.log("• بُذرت المرحلة 3 (٥ تحديات من الجيل الثالث + بوس بثلاث محطات)");

  console.log("— اكتمل البذر بنجاح");
}

main()
  .catch((error) => {
    console.error("فشل البذر:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
