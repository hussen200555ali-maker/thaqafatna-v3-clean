/**
 * سكربت بذر الموجة الثانية — ٣ فصول جديدة × ٣ مراحل = ٩ مراحل و٤٥ لغزاً
 * =====================================================================
 * يوسّع خريطة اللعبة من ٩ مراحل (٣ فصول) إلى ١٨ مرحلة (٦ فصول):
 *
 *   الفصل الرابع — رحاب الصحراء:  بوابة الواحة (١٠) + قافلة الرمال (١١) + كنوز البادية (١٢)
 *   الفصل الخامس — ديوان المجلس:  دلال الضيافة (١٣) + فنون المجلس (١٤) + ليالي السمر (١٥)
 *   الفصل السادس — مرسم الحرف:    أدوات الكاتب (١٦) + أناقة الحرف (١٧) + خزانة الحكماء (١٨)
 *
 * • يستكمل الصور الست غير المستعملة في public/images/game:
 *   oasis + sand-dunes + majlis + coffee-cups + reed-pen + inkwell
 * • الأنواع الاثنا عشر المجدولة موزّعة على الفصول، والنوع الصوتي يبقى
 *   حصرياً لمرحلة «حصن الحكماء» بصوته المعتمد (قرار جودة موثّق).
 * • بوّابتا بوس جديدتان (١٥ و١٨) بثلاث محطات لكل منهما.
 *
 * قابل لإعادة التشغيل (Idempotent): يتخطى ما وُجد ويكمل ما نقص.
 *
 * تشغيل: bun run scripts/seed-wave2.ts
 */

import { db } from "../src/lib/db";

/* ============================================================
   أدوات مساعدة
   ============================================================ */

async function exists(id: string): Promise<boolean> {
  return (await db.puzzle.findUnique({ where: { id }, select: { id: true } })) !== null;
}

async function createPuzzle(data: {
  id: string;
  levelId: string | null;
  puzzleType: string;
  order?: number | null;
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
  cells?: Array<{ row: number; col: number; letter: string; number?: number }>;
  words?: Array<{
    number: number;
    direction: string;
    row: number;
    col: number;
    length: number;
    answer: string;
    clue: string;
  }>;
}) {
  if (await exists(data.id)) {
    console.log(`  ~ ${data.id} موجود مسبقاً — تخطٍّ`);
    return;
  }
  const { cells, words, ...rest } = data;
  await db.puzzle.create({
    data: {
      ...rest,
      cells: cells ? { create: cells } : undefined,
      words: words ? { create: words } : undefined,
    },
  });
  console.log(`  + ${data.id} (${data.puzzleType})`);
}

async function ensureChapter(id: string, title: string, order: number) {
  const existing = await db.chapter.findUnique({ where: { id } });
  if (existing) {
    await db.chapter.update({ where: { id }, data: { title, order } });
    console.log(`  ~ الفصل ${id} موجود — ضُبط عنوانه وترتيبه`);
    return;
  }
  await db.chapter.create({ data: { id, title, order } });
  console.log(`  + الفصل: ${title}`);
}

async function ensureLevel(data: {
  id: string;
  title: string;
  difficulty: string;
  timeLimit: number;
  reward: number;
  hintCost: number;
  learningGoals: string;
  educationalDescription: string;
  chapterId: string;
  order: number;
}) {
  const existing = await db.level.findUnique({ where: { id: data.id } });
  if (existing) {
    console.log(`  ~ المرحلة ${data.id} موجودة مسبقاً`);
    return;
  }
  await db.level.create({ data });
  console.log(`  • أُنشئت المرحلة: ${data.title}`);
}

/* ============================================================
   التنفيذ
   ============================================================ */

async function main() {
  console.log("بذر الموجة الثانية — ٩ مراحل جديدة عبر ٣ فصول…\n");

  /* ============================================================
     الفصل الرابع — رحاب الصحراء
     ============================================================ */
  console.log("── الفصل الرابع — رحاب الصحراء ──");
  await ensureChapter("chapter-4", "الفصل الرابع — رحاب الصحراء", 4);

  /* ---------- المرحلة العاشرة — «بوابة الواحة» (سهلة) ---------- */
  await ensureLevel({
    id: "level-10",
    title: "بوابة الواحة",
    difficulty: "easy",
    timeLimit: 300,
    reward: 55,
    hintCost: 10,
    learningGoals: JSON.stringify([
      "فهم معنى الواحة ودورها في حياة الصحراء",
      "التعرف على سفينة الصحراء وأسرار صبرها",
      "حفظ حكم العرب في رفقة السفر",
    ]),
    educationalDescription:
      "أول مداخل البادية: واحةٌ تنبت وسط الرمال، وجملٌ صبور يقطع المفاوز، وحكمةٌ عربية في اختيار الرفيق — خمسة ألغاز تفتح لك بوابة الصحراء.",
    chapterId: "chapter-4",
    order: 10,
  });

  await createPuzzle({
    id: "p10-1",
    levelId: "level-10",
    puzzleType: "multiple",
    order: 1,
    clue: "ماذا كان يعني بلوغ القافلة «الواحة» في رحلة الصحراء الطويلة؟",
    options:
      "الأمان والماء والراحة بعد العناء|دخول مدينةٍ مسوّرة كبيرة|بلوغ شاطئ البحر|نهاية السفر إلى غير رجعة",
    correctOption: 0,
    hint: "بعد ظمأٍ ورمالٍ لا تنتهي — تجد الماء والظل والنخل.",
    explanation:
      "الواحة أرضٌ خصبة وسط الصحراء يجتمع فيها الماء والزرع، وكانت محطات القوافل تُبنى عليها — بلوغها كان يعني النجاة.",
    points: 40,
    hintCost: 10,
    category: "جغرافيا الصحراء",
  });

  await createPuzzle({
    id: "p10-2",
    levelId: "level-10",
    puzzleType: "emoji",
    order: 2,
    clue: "اقرأ الرموز: نخلٌ وماءٌ ورمال — ما اسم هذا المكان الأخضر الذي يستريح عنده المسافرون؟",
    text: "الواحة",
    emojis: "🌴💧🏜️",
    hint: "تُنسب إلى النخل — ويقولون: فلانٌ ساكنٌ بين النخل.",
    explanation:
      "الواحة — جنةٌ صغيرة وسط الرمال: ماءٌ عذب ونخلٌ باسق وظلٌ للمسافرين، وبها قامت محطات القوافل.",
    points: 45,
    hintCost: 10,
    category: "جغرافيا الصحراء",
  });

  await createPuzzle({
    id: "p10-3",
    levelId: "level-10",
    puzzleType: "scrambled",
    order: 3,
    clue: "رتّب الحروف لتحصل على اسم «سفينة الصحراء» التي لا تُغرق في الرمال.",
    text: "الجمل",
    availableLetters: "ا|ل|ج|م|ل|ن|ح|ر",
    hint: "ثلاثة أحرف مستعملة بعد أل التعريف — والزائدان نون وحاء.",
    explanation:
      "الجمل — لُقّب سفينة الصحراء لأنه يحمل الأثقال في المفاوز ويصبر على العطش أياماً لا يصبرها غيره.",
    points: 45,
    hintCost: 10,
    category: "حيوان البادية",
  });

  await createPuzzle({
    id: "p10-4",
    levelId: "level-10",
    puzzleType: "fillblank",
    order: 4,
    clue: "أكمل حكمة العرب الخالدة في السفر — فهي أول وصايا المسافرين.",
    fillBlanks: JSON.stringify([
      { kind: "text", text: "قالت العرب: «الرفيق ثم " },
      { kind: "blank", answer: "الطريق" },
    ]),
    options: "الطريق|الطعام|الرحيق|الشراب",
    hint: "هي ما تسلكه القافلة بعد أن تختار من يرافقها.",
    explanation:
      "«الرفيق ثم الطريق» — عناية العرب باختيار رفيق السفر قبل التفكير في الطريق نفسه، فالرفيق الصالح عونٌ في الشدة.",
    points: 50,
    hintCost: 10,
    category: "أمثال وحكم",
  });

  await createPuzzle({
    id: "p10-5",
    levelId: "level-10",
    puzzleType: "crossword",
    order: 5,
    clue: "شبكة الواحة: كلمتان تتقاطعان عند الراء — إحداهما اسمٌ للرمال وال أخرى خداعُ عينٍ للمسافر.",
    availableLetters: "ا|ب|ح|ر|س|ن|ج",
    hint: "الأفقية ثلاثة أحرف: هكذا سمّى العرب الرمال الممتدة. والرأسية أربعة: يظنّه الظمآن ماءً.",
    explanation:
      "الكلمتان: بحر وسراب — سمّى العرب الرمال الواسعة «بحراً» لأنها تمدّ البصر كالماء، والسراب خداعٌ يحسبه المسافر ماءً.",
    points: 75,
    hintCost: 10,
    category: "مفردات الصحراء",
    cells: [
      { row: 0, col: 2, letter: "س", number: 2 },
      { row: 1, col: 0, letter: "ب", number: 1 },
      { row: 1, col: 1, letter: "ح" },
      { row: 1, col: 2, letter: "ر" },
      { row: 2, col: 2, letter: "ا" },
      { row: 3, col: 2, letter: "ب" },
    ],
    words: [
      {
        number: 1,
        direction: "across",
        row: 1,
        col: 0,
        length: 3,
        answer: "بحر",
        clue: "هكذا سمّى العرب الرمال الممتدة لأنها تُمدّ البصر مدّ الماء الزاخر — و«بحر الرمل» اسمٌ قديم في كتب البلدان.",
      },
      {
        number: 2,
        direction: "down",
        row: 0,
        col: 2,
        length: 4,
        answer: "سراب",
        clue: "خداع بصرٍ يراه المسافر ظامئاً فيحسبه ماءً حتى إذا جاءه لم يجده شيئاً.",
      },
    ],
  });

  /* ---------- المرحلة الحادية عشرة — «قافلة الرمال» (سهلة) ---------- */
  await ensureLevel({
    id: "level-11",
    title: "قافلة الرمال",
    difficulty: "easy",
    timeLimit: 300,
    reward: 55,
    hintCost: 10,
    learningGoals: JSON.stringify([
      "معرفة كيف اهتدت القوافل في الصحراء",
      "إتقان مصطلحات البادية ومعانيها",
      "فهم أسرار الجمل الذي حمل الحضارة",
    ]),
    educationalDescription:
      "رحلة القافلة على عهد النجوم: بمَ اهتدى السّارون قبل البوصلة؟ ومصطلحاتٌ بداوية تُربط بمعانيها — وصورٌ من عالم الرمال.",
    chapterId: "chapter-4",
    order: 11,
  });

  await createPuzzle({
    id: "p11-1",
    levelId: "level-11",
    puzzleType: "image",
    order: 1,
    clue: "الصورة لسفينة الصحراء — اكتب اسم هذا الحيوان الصبور.",
    text: "الجمل",
    imageUrl: "/images/game/camel.png",
    hint: "يُلقّب بسفينة الصحراء ويصبر على العطش أياماً.",
    explanation:
      "الجمل — رفيق البدوي الأول: يحمّل الأثقال ويقطع المفاوز، وله «كرشٌ» تخزن الماء وطبقاتٌ تقيه الرمل والحر.",
    points: 45,
    hintCost: 10,
    category: "حيوان البادية",
  });

  await createPuzzle({
    id: "p11-2",
    levelId: "level-11",
    puzzleType: "images4",
    order: 2,
    clue: "أربع لقطاتٍ من عالمٍ واحد — اكتشف الكلمة الجامعة بينها.",
    text: "الصحراء",
    imageUrl: "/images/game/oasis.png",
    image2Url: "/images/game/desert.png",
    image3Url: "/images/game/sand-dunes.png",
    image4Url: "/images/game/camel.png",
    hint: "المكان الواسع الذي تحفّه الرمال وتسكنه الواحات.",
    explanation:
      "الصحراء — عالم الرمال: واحاتٌ وكثبانٌ وقوافل وجِمال — بيئةٌ صاغت أخلاق أهلها: الصبر والكرم والنجدة.",
    points: 70,
    hintCost: 10,
    category: "جغرافيا الصحراء",
  });

  await createPuzzle({
    id: "p11-3",
    levelId: "level-11",
    puzzleType: "text",
    order: 3,
    clue: "بمَ اهتدت القوافل في ليالي الصحراء قبل اختراع البوصلة؟",
    text: "النجوم",
    hint: "مصابيح السماء المعلّمة — ولها عند العرب منازل معلومة.",
    explanation:
      "النجوم — عرف العرب منازلها وساروا بها في ظلمات البراري، وكانوا يسمّون النجم باسمه ويستدلون به على الطريق والفصول.",
    points: 40,
    hintCost: 10,
    category: "فلك العرب",
  });

  await createPuzzle({
    id: "p11-4",
    levelId: "level-11",
    puzzleType: "matching",
    order: 4,
    clue: "اربط كل مصطلحٍ بداويٍّ بمعناه الدقيق — أربع ثنائيات من قاموس البادية.",
    matchPairs: JSON.stringify([
      { left: "الفلاة", right: "الأرض الفضاء الواسعة" },
      { left: "النجعة", right: "الترحال طلباً للكلأ" },
      { left: "المورد", right: "موضع الماء الذي تَرِده القوافل" },
      { left: "الهجير", right: "اشتداد الحر نصف النهار" },
    ]),
    hint: "الهجير من الهجر؟ لا — من الحرّ الشديد عند انتصاف النهار.",
    explanation:
      "الفلاة الفضاء، والنجعة ارتحال الكلأ، والمورد موضع الماء، والهجير قيظ الظهيرة — مصطلحات صاغتها حياة البادية.",
    points: 65,
    hintCost: 10,
    category: "مفردات الصحراء",
  });

  await createPuzzle({
    id: "p11-5",
    levelId: "level-11",
    puzzleType: "multiple",
    order: 5,
    clue: "لماذا لُقّب الجمل «سفينة الصحراء»؟",
    options:
      "لصبره على العطش وحمله الأثقال في المفاوز|لسرعته الفائقة في الجري|لأنه يعوم فوق الرمال كما تعوم السفينة|لأنه يبصر في الظلام الحالك",
    correctOption: 0,
    hint: "اللقبيزيد عن سرعة — إنه عن الحمل والصبر.",
    explanation:
      "لُقّب الجمل سفينة الصحراء لأنه — كالسفينة في البحر — الوسيلة الوحيدة لقطع المفاوز حاملاً الأحمال صابراً على العطش.",
    points: 50,
    hintCost: 10,
    category: "حيوان البادية",
  });

  /* ---------- المرحلة الثانية عشرة — «كنوز البادية» (متوسطة) ---------- */
  await ensureLevel({
    id: "level-12",
    title: "كنوز البادية",
    difficulty: "medium",
    timeLimit: 300,
    reward: 60,
    hintCost: 10,
    learningGoals: JSON.stringify([
      "معرفة بيت الشعر ومكوناته",
      "فهم أوقات النهار في حياة البادية",
      "إتقان مفردات الترحال ورياح الصحراء",
    ]),
    educationalDescription:
      "خمسة ألغاز من صميم حياة البدو: بيتٌ يُنسج ولا يُبنى، وأوقاتُ نهارٍ تتوالى، وريحٌ تُسفّ الرمال — فهل تحفظ البادية كنوزها؟",
    chapterId: "chapter-4",
    order: 12,
  });

  await createPuzzle({
    id: "p12-1",
    levelId: "level-12",
    puzzleType: "text",
    order: 1,
    clue: "ما اسم مسكن البدو المنسوج من وبر الإبل وصوف الغنم — لا يُبنى بالطين بل يُنسج على النول؟",
    text: "بيت الشعر",
    hint: "«بيتٌ» لكنه منسوج — والخيمة اسمه عند العامة.",
    explanation:
      "بيت الشعر — منسوجٌ من الوبر والصوف على النول، يُدفّأ بالوبر في الشتاء ويُبرَّد بالشعر في الصيف، ويُشدّ بالأطناب ويسكنه أهل النجعة.",
    points: 45,
    hintCost: 10,
    category: "حياة البادية",
  });

  await createPuzzle({
    id: "p12-2",
    levelId: "level-12",
    puzzleType: "crossword",
    order: 2,
    clue: "شبكة الليل: كلمتان تتقاطعان عند الجيم — إحداهما دليل السائرين والأخرى نار المخيم.",
    availableLetters: "ن|ج|م|ة|ر|د|و",
    hint: "الأفقية أربعة أحرف: يهتدي بها السارون. والرأسية ثلاثة: يشتعل في المخيم.",
    explanation:
      "الكلمتان: نجمة وجمر — بالنجوم اهتدى السالكون، وعلى الجمر استدفأ أهل المخيم وذُللت القهوة.",
    points: 80,
    hintCost: 10,
    category: "مفردات الصحراء",
    cells: [
      { row: 0, col: 0, letter: "ن", number: 1 },
      { row: 0, col: 1, letter: "ج", number: 2 },
      { row: 0, col: 2, letter: "م" },
      { row: 0, col: 3, letter: "ة" },
      { row: 1, col: 1, letter: "م" },
      { row: 2, col: 1, letter: "ر" },
    ],
    words: [
      {
        number: 1,
        direction: "across",
        row: 0,
        col: 0,
        length: 4,
        answer: "نجمة",
        clue: "بها اهتدى السارون في ظلمات البراري، ولها عند العرب منازلُ معلومة يعرفون بها الفصول والطرق.",
      },
      {
        number: 2,
        direction: "down",
        row: 0,
        col: 1,
        length: 3,
        answer: "جمر",
        clue: "نار المخيم التي تجمع الرفقة ليلاً وتُدفئ القلوب قبل الأجساد، وعليه تُحمَّص القهوة.",
      },
    ],
  });

  await createPuzzle({
    id: "p12-3",
    levelId: "level-12",
    puzzleType: "logic",
    order: 3,
    clue: "نهار البادية يمضي بترتيبٍ لا يخلف — ثلاثة أوقاتٍ ظهرت في المتتالية، فأيُّ وقتٍ يليها؟",
    logicData: JSON.stringify({
      kind: "sequence",
      items: ["الفجر", "الضحى", "الظهيرة"],
      options: ["العصر", "المغرب", "منتصف الليل", "السحر"],
      correctIndex: 0,
    }),
    hint: "بعد قيظ الظهيرة يلطف الجوُّ — وهو وقت العودة من المرعى.",
    explanation:
      "العصر — يمضي النهار: الفجر فالضحى فالظهيرة فالعصر فالمغرب، وأهل البادية يضبطون عليه مراعيهم وأسفارهم.",
    points: 60,
    hintCost: 10,
    category: "منطق واستنتاج",
  });

  await createPuzzle({
    id: "p12-4",
    levelId: "level-12",
    puzzleType: "scrambled",
    order: 4,
    clue: "رتّب الحروف لتحصل على مصطلح الترحال طلباً للكلأ والماء — سمة حياة أهل البادية.",
    text: "النجعة",
    availableLetters: "ا|ل|ن|ج|ع|ة|ب|ر",
    hint: "ستة أحرف مستعملة — والزائدان باء وراء. ومنها: «أهل نجعة».",
    explanation:
      "النجعة — ترحال البدو بمواشيهم حيث ينبت الكلأ ويوجد الماء، فهذا دأبهم: «ينتجعون» المطر والربيع.",
    points: 55,
    hintCost: 10,
    category: "مفردات الصحراء",
  });

  await createPuzzle({
    id: "p12-5",
    levelId: "level-12",
    puzzleType: "progressive",
    order: 5,
    clue: "سُلّم الاستنتاج الصحراوي: كل درجةٍ تلميحٌ أصرح — فما اسم هذه الريح الملتهبة؟",
    text: "السموم",
    hints: JSON.stringify([
      "ريحٌ صحراويةٌ معروفة عند العرب منذ الجاهلية.",
      "حارةٌ تهبّ نهاراً فتسفّ الرمال وتكاد تحرق كل ما تمرّ به.",
      "سُمّيت بذلك لأنها تَسُمُّ — أي تؤذي بحرّها كل شيءٍ تمرّ به.",
    ]),
    availableLetters: "ا|ل|س|م|و|م|ح|ر",
    hint: "تُشبه في اسمها السُّمَّ — لكنها ريحٌ لا شراب.",
    explanation:
      "السموم — ريحٌ حارةٌ نهارية تسفّ الرمال وتؤذي المسافرين، وهي أشهر رياح الصحراء عند العرب.",
    points: 85,
    hintCost: 10,
    category: "ظواهر الصحراء",
  });

  /* ============================================================
     الفصل الخامس — ديوان المجلس
     ============================================================ */
  console.log("\n── الفصل الخامس — ديوان المجلس ──");
  await ensureChapter("chapter-5", "الفصل الخامس — ديوان المجلس", 5);

  /* ---------- المرحلة الثالثة عشرة — «دلال الضيافة» (سهلة) ---------- */
  await ensureLevel({
    id: "level-13",
    title: "دلال الضيافة",
    difficulty: "easy",
    timeLimit: 300,
    reward: 55,
    hintCost: 10,
    learningGoals: JSON.stringify([
      "معرفة أدوات الضيافة العربية ومراسمها",
      "حفظ شعر الكرم الجاهلي الخالد",
      "فهم منزلة الضيف عند العرب",
    ]),
    educationalDescription:
      "مدرسة الكرم العربية: دلةٌ نحاسية وتمرٌ وحكمةُ حاتم — خمسة ألغاز من مجلس الضيافة الذي لم يعرف العربُ بيتاً أكرم منه.",
    chapterId: "chapter-5",
    order: 13,
  });

  await createPuzzle({
    id: "p13-1",
    levelId: "level-13",
    puzzleType: "multiple",
    order: 1,
    clue: "ما اسم الإناء النحاسي الشهير الذي تُغلى فيه القهوة العربية وتُقدَّم منه للضيوف؟",
    options: "الدلة|القِدر|الصينية|الملعقة",
    correctOption: 0,
    hint: "رمز الضيافة الخليجية والنجدية — لها «مشرب» طويل وعقدةٌ في الأعلى.",
    explanation:
      "الدلة — إناء القهوة النحاسي، رمز الضيافة العربية؛ يُغلى فيها الدله وتُصبّ للضيوف مراسمَ معروفةً تبدأ بالكبير.",
    points: 40,
    hintCost: 10,
    category: "فنون الضيافة",
  });

  await createPuzzle({
    id: "p13-2",
    levelId: "level-13",
    puzzleType: "image",
    order: 2,
    clue: "الصورة لرمز الضيافة العربية النحاسي — اكتب اسمه.",
    text: "الدلة",
    imageUrl: "/images/game/dallah.png",
    hint: "إناء القهوة النحاسي بمُشربها الطويل.",
    explanation:
      "الدلة — تُصاغ من النحاس وتُلمَّع حتى تلمع، وبها يُعرف بيت الكرم: تُقلَّب على الجمر وتُصبّ بأدبٍ واحترام.",
    points: 45,
    hintCost: 10,
    category: "فنون الضيافة",
  });

  await createPuzzle({
    id: "p13-3",
    levelId: "level-13",
    puzzleType: "fillblank",
    order: 3,
    clue: "أكمل بيت حاتم الطائي — إمام الكرم في الجاهلية.",
    fillBlanks: JSON.stringify([
      { kind: "text", text: "«إذا ما صنعتَ الزادَ فالتمسي لهُ " },
      { kind: "blank", answer: "أكيلاً" },
    ]),
    options: "أكيلاً|طعاماً|سبيلاً|رحيلاً",
    hint: "مرادف «الضيف الجالس يأكل معك» — على وزن فعيل.",
    explanation:
      "«إذا ما صنعتَ الزادَ فالتمسي لهُ أكيلاً» — حاتم الطائي لا يأكل زاده وحده، وهذه قمة الكرم التي ضُرب بها المثل.",
    points: 55,
    hintCost: 10,
    category: "شعر الكرم",
  });

  await createPuzzle({
    id: "p13-4",
    levelId: "level-13",
    puzzleType: "emoji",
    order: 4,
    clue: "ثمراتٌ حلوى على مائدة الضيافة — ثمرة النخيل الذهبية، ما اسمها؟",
    text: "التمر",
    emojis: "🌴🌰🍬",
    hint: "«خبز الصحراء» الحلو — يُقدَّم مع القهوة قبل كل شيء.",
    explanation:
      "التمر — غذاء أهل البادية الأول وحلوى الضيافة؛ بركة النخيل التي أقسم الله بها في كتابه: «والنخلِ باسقاتٍ لها طلعٌ نضيد».",
    points: 45,
    hintCost: 10,
    category: "فنون الضيافة",
  });

  await createPuzzle({
    id: "p13-5",
    levelId: "level-13",
    puzzleType: "text",
    order: 5,
    clue: "ما اسم بيت الضيافة عند العرب — أُعدّ لإكرام الضيف وإيواء المسافر الغريب؟",
    text: "المضافة",
    hint: "من الضيافة — «نزل الضيفُ في ___ القوم» يقال في نجد والحجاز.",
    explanation:
      "المضافة — بيت الضيافة عند العرب؛ يأوي الغريب ويُكرم فيه الضيف، ولم يكن أهلها يعدّون ذلك فضلاً منهم بل واجباً يُعاب تركه.",
    points: 40,
    hintCost: 10,
    category: "فنون الضيافة",
  });

  /* ---------- المرحلة الرابعة عشرة — «فنون المجلس» (متوسطة) ---------- */
  await ensureLevel({
    id: "level-14",
    title: "فنون المجلس",
    difficulty: "medium",
    timeLimit: 300,
    reward: 60,
    hintCost: 10,
    learningGoals: JSON.stringify([
      "إتقان أدوات المجلس وأسمائها الدقيقة",
      "معرفة آداب الضيافة العربية الأصيلة",
      "ربط الكرم بمقامات أئمته من الشعراء",
    ]),
    educationalDescription:
      "جلسةٌ في أعرق مجالس العرب: المحماس والدلة والفنجان، وآدابٌ لا تُشترى بالذهب — وأخبار حاتم الذي صار الكرمُ يُنسَب إليه.",
    chapterId: "chapter-5",
    order: 14,
  });

  await createPuzzle({
    id: "p14-1",
    levelId: "level-14",
    puzzleType: "matching",
    order: 1,
    clue: "اربط كل أداةٍ من أدوات مجلس القهوة بوظيفتها — أربع ثنائيات من مراسم الضيافة.",
    matchPairs: JSON.stringify([
      { left: "الدلة", right: "إناء غلي القهوة وصبّها" },
      { left: "المحماس", right: "وعاء تحميص البنّ على الجمر" },
      { left: "الفنجان", right: "كأس صغير تُقدَّم فيه القهوة" },
      { left: "المبخرة", right: "مجمرة العود الذي يُطيَّب بها المجلس" },
    ]),
    hint: "المحماس من الحمس — أي الحرارة: فيه يُحمّص البنّ.",
    explanation:
      "الدلة للغلي والصبّ، والمحماس لتحميص البنّ على الجمر، والفنجان كأسها الصغير، والمبخرة تجوّد ريح المجلس — منظومة الضيافة كاملة.",
    points: 70,
    hintCost: 10,
    category: "فنون الضيافة",
  });

  await createPuzzle({
    id: "p14-2",
    levelId: "level-14",
    puzzleType: "images4",
    order: 2,
    clue: "أربع لقطاتٍ من عرسٍ عربيٍّ واحد — اكتشف الكلمة الجامعة بينها.",
    text: "الضيافة",
    imageUrl: "/images/game/dallah.png",
    image2Url: "/images/game/coffee-cups.png",
    image3Url: "/images/game/dates.png",
    image4Url: "/images/game/majlis.png",
    hint: "الخُلق الذي يجمع الدلة والتمر والمجلس تحت سقفٍ واحد.",
    explanation:
      "الضيافة — سرِّ من أسرار العرب: دلةٌ تغلي وتمرٌ يُقدَّم ومجلسٌ يفتح أبوابه للغريب قبل أن يسأل عنه.",
    points: 75,
    hintCost: 10,
    category: "فنون الضيافة",
  });

  await createPuzzle({
    id: "p14-3",
    levelId: "level-14",
    puzzleType: "multiple",
    order: 3,
    clue: "أيُّ هذه ليس من آداب الضيافة العربية الأصيلة؟",
    options:
      "البدء بالضيف في التقديم|الإنصات له إذا حدّث|استعجاله في مغادرة المجلس|التماس الأعذار له",
    correctOption: 2,
    hint: "الأدب كله صبرٌ على الضيف — إلا خصلةً واحدة بين الخيارات.",
    explanation:
      "استعجال الضيف من سوء الأدب؛ بل من كمال الضيافة أن يُبادر المضيف بالتقديم ويُنصت ويَعذر، ولا يُشعر الضيف بالثقل أبداً.",
    points: 50,
    hintCost: 10,
    category: "آداب عربية",
  });

  await createPuzzle({
    id: "p14-4",
    levelId: "level-14",
    puzzleType: "text",
    order: 4,
    clue: "من شاعر طيء الذي ضُرب به المثل في الكرم حتى صار اسمه علماً عليه في كل اللسان؟",
    text: "حاتم الطائي",
    hint: "صاحب «إذا ما صنعت الزاد فالتمسي له أكيلاً».",
    explanation:
      "حاتم الطائي — إمام الكرم الجاهلي؛ تُروى في سخائه أخبار لا تُحصى، وما زال اسمه إلى اليوم مرادفاً للجود والسخاء.",
    points: 55,
    hintCost: 10,
    category: "شعر الكرم",
  });

  await createPuzzle({
    id: "p14-5",
    levelId: "level-14",
    puzzleType: "crossword",
    order: 5,
    clue: "شبكة المجلس: كلمتان تتقاطعان عند الميم — إحداهما روح الضيافة والأخرى خُلق الكرام.",
    availableLetters: "ك|ر|م|س|ا|ح|ة|ب",
    hint: "الأفقية ثلاثة أحرف: أول الضيافة وروحها. والرأسية خمسة: أخت الحلم في المنزلة.",
    explanation:
      "الكلمتان: كرم وسماحة — بهما اشتُهرت العرب قبل الإسلام وبعده: كرمٌ يُطعم الطعام، وسماحةٌ تعفو وتصفح.",
    points: 85,
    hintCost: 10,
    category: "أخلاق العرب",
    cells: [
      { row: 0, col: 2, letter: "س", number: 2 },
      { row: 1, col: 0, letter: "ك", number: 1 },
      { row: 1, col: 1, letter: "ر" },
      { row: 1, col: 2, letter: "م" },
      { row: 2, col: 2, letter: "ا" },
      { row: 3, col: 2, letter: "ح" },
      { row: 4, col: 2, letter: "ة" },
    ],
    words: [
      {
        number: 1,
        direction: "across",
        row: 1,
        col: 0,
        length: 3,
        answer: "كرم",
        clue: "أول الضيافة وروحها — به اشتُهرت العرب حتى ضُربت بها الأمثال، وله أئمةٌ كحاتم طيء.",
      },
      {
        number: 2,
        direction: "down",
        row: 0,
        col: 2,
        length: 5,
        answer: "سماحة",
        clue: "خُلق الكرام في المعاملة؛ أخت الحلم في المنزلة، وضدها الضيق والتقتير.",
      },
    ],
  });

  /* ---------- المرحلة الخامسة عشرة — «ليالي السمر» (صعبة) ---------- */
  await ensureLevel({
    id: "level-15",
    title: "ليالي السمر",
    difficulty: "hard",
    timeLimit: 330,
    reward: 70,
    hintCost: 15,
    learningGoals: JSON.stringify([
      "معرفة فنون الليل العربي: السمر والربابة",
      "تمييز فنون الشعر الموزون من النثر",
      "حفظ درر المتنبي في الكتاب والجليس",
    ]),
    educationalDescription:
      "خاتمة الديوان: ليالي السمر وما كان يجري فيها — شعرٌ يُنشد على الربابة، وحكمة المتنبي الخالدة، وبوابة بوسٍ من ثلاث محطات.",
    chapterId: "chapter-5",
    order: 15,
  });

  await createPuzzle({
    id: "p15-1",
    levelId: "level-15",
    puzzleType: "progressive",
    order: 1,
    clue: "سُلّم الاستنتاج الموسيقي: كل درجةٍ تلميحٌ أصرح — فما اسم هذه الآلة الوترية؟",
    text: "الربابة",
    hints: JSON.stringify([
      "آلةٌ موسيقية وترية من أدوات البادية القديمة.",
      "صندوقها الخشبي مغطًّى بجلدٍ رقيق، ولها وترٌ يُقوس عليه الانشاد.",
      "عليها كان الشعراء ينشدون القصائد في ليالي السمر — ربابةُ الشعر كما سمّوها.",
    ]),
    availableLetters: "ا|ل|ر|ب|ا|ب|ة|ن|و",
    hint: "من مادة «ر ب ب» — وهي أخت القِيثارة في البادية.",
    explanation:
      "الربابة — آلة البدو الوترية الأولى؛ عليها أُنشدت المعلقات والقصائد في ليالي السمر، فهي رفيقة الشعر القديمة.",
    points: 90,
    hintCost: 15,
    category: "موسيقى العرب",
  });

  await createPuzzle({
    id: "p15-2",
    levelId: "level-15",
    puzzleType: "logic",
    order: 2,
    clue: "فنون العرب الظاهرة — ثلاثةٌ تُوزن بالبحور، ورابعٌ لا وزن له: التقط الشاذ.",
    logicData: JSON.stringify({
      kind: "oddOne",
      items: ["المعلقات", "الأرجوزة", "القصيدة", "الخطبة"],
      correctIndex: 3,
    }),
    hint: "الشاذ يُلقى منبراً — والبقية تنشد وتراً.",
    explanation:
      "الخطبة فنٌّ نثري معروف على المنابر، أما المعلقات والأرجوزة والقصيدة فمن الشعر الموزون المقفى.",
    points: 65,
    hintCost: 15,
    category: "منطق واستنتاج",
  });

  await createPuzzle({
    id: "p15-3",
    levelId: "level-15",
    puzzleType: "text",
    order: 3,
    clue: "أكمل بيت المتنبي الخالد: «أعزُّ مكانٍ في الدُّنى سرجُ سابحٍ / وخيرُ جليسٍ في الزمان ___»",
    text: "كتاب",
    hint: "جليسٌ لا يتكلم لكنه أنطق الرجال — يُفتح فيُنشيء صحبةً.",
    explanation:
      "«وخيرُ جليسٍ في الزمان كتاب» — المتنبي؛ جليسٌ لا يُملّ حديثه ولا يخون سرّك، وعليه قامت حضارة الكتابة العربية.",
    points: 60,
    hintCost: 15,
    category: "شعر خالد",
  });

  await createPuzzle({
    id: "p15-4",
    levelId: "level-15",
    puzzleType: "multiple",
    order: 4,
    clue: "ما «السمر» في لغة العرب التي سُمّي به هذا الليل الجميل؟",
    options:
      "حديث القوم بالليل ودُعيتهم إياه|غناء الجواري في القصور|سمرُ لون الفرس|كثرة الأكل بعد العشاء",
    correctOption: 0,
    hint: "سَمَرَ القومُ إذا تحادثوا بعد مغيب الشمس.",
    explanation:
      "السمر: حديث الليل — سَمَرَ القومُ إذا تحادثوا في ليلهم؛ فهو مجلس الأنس الذي تجري فيه الحكايات والأشعار.",
    points: 55,
    hintCost: 15,
    category: "أدب العرب",
  });

  await createPuzzle({
    id: "p15-5",
    levelId: "level-15",
    puzzleType: "mixed",
    order: 5,
    clue: "بوابة الديوان: ثلاث محطاتٍ متتابعة من ليالي العرب — فاجتزها كلها لتُطوى صفحة المجلس.",
    points: 150,
    hintCost: 15,
    category: "بوابة البوس",
    explanation:
      "ثلاث محطاتٍ من قلب ليلةٍ عربية: وقتُها، وفنُّها، وكنزُها المعلّق — من أجازها فقد سهر مع العرب ليلةً كاملة.",
  });

  await createPuzzle({
    id: "p15-5-s1",
    levelId: null,
    puzzleType: "multiple",
    order: 1,
    clue: "المحطة الأولى — في أي وقتٍ كان ينعقد سمر العرب غالباً؟",
    options:
      "بعد صلاة العشاء حين يبرد الجو وتسكن الريح|قبل شروق الشمس|في قيظ الظهيرة|عند طلوع الفجر مباشرة",
    correctOption: 0,
    points: 50,
    hint: "حين تُطفأ حاجات النهار ويجتمع القوم حول النار.",
    explanation:
      "بعد العشاء — يسكن الليل ويبرد الجو، فيجتمع القوم حول نار المخيم تتلوها الحكايات والأشعار.",
  });

  await createPuzzle({
    id: "p15-5-s2",
    levelId: null,
    puzzleType: "scrambled",
    order: 2,
    clue: "المحطة الثانية — رتّب الحروف لتحصل على اسم فن الشعر الموزون الذي تُنشد فيه قصائد السمر.",
    text: "القصيدة",
    availableLetters: "ا|ل|ق|ص|ي|د|ة|م|ن",
    points: 60,
    hint: "ثمانية أحرف — من مادة «ق ص د».",
    explanation:
      "القصيدة — ديوان العرب وسجل أيامهم؛ تُبنى على بحرٍ من بحور الخليل وتُنشد في المجالس والأسفار.",
  });

  await createPuzzle({
    id: "p15-5-s3",
    levelId: null,
    puzzleType: "text",
    order: 3,
    clue: "المحطة الثالثة — ما اسم القصائد الجاهلية السبع (في روايةٍ مشهورة) التي قيل إنها عُلّقت على أستار الكعبة؟",
    text: "المعلقات",
    points: 50,
    hint: "من العِلق — أي الشيء النفيس المعلّق.",
    explanation:
      "المعلقات — سُمّيت بذلك لأنها — كما تقول الرواية المشهورة — عُلّقت على الكعبة تعظيماً لشأنها، وهي ذروة الشعر الجاهلي.",
  });

  if ((await db.mixedStage.count({ where: { parentPuzzleId: "p15-5" } })) === 0) {
    await db.mixedStage.createMany({
      data: [
        { parentPuzzleId: "p15-5", stagePuzzleId: "p15-5-s1", order: 1 },
        { parentPuzzleId: "p15-5", stagePuzzleId: "p15-5-s2", order: 2 },
        { parentPuzzleId: "p15-5", stagePuzzleId: "p15-5-s3", order: 3 },
      ],
    });
    console.log("  + وصلات بوس p15-5 (٣ محطات)");
  }

  /* ============================================================
     الفصل السادس — مرسم الحرف
     ============================================================ */
  console.log("\n── الفصل السادس — مرسم الحرف ──");
  await ensureChapter("chapter-6", "الفصل السادس — مرسم الحرف", 6);

  /* ---------- المرحلة السادسة عشرة — «أدوات الكاتب» (متوسطة) ---------- */
  await ensureLevel({
    id: "level-16",
    title: "أدوات الكاتب",
    difficulty: "medium",
    timeLimit: 300,
    reward: 60,
    hintCost: 10,
    learningGoals: JSON.stringify([
      "معرفة قلم القصب وأدوات النسّاخين",
      "فهم وصية العرب في تقييد العلم",
      "إتقان أسماء أدوات الكتابة التراثية",
    ]),
    educationalDescription:
      "ورشة الكاتب القديم: قلمٌ من القصب، ومدادٌ أسود، ومحبرةٌ تصحب النسّاخ في رحلاته — ووصيةٌ عربية خالدة في حفظ العلم بالكتابة.",
    chapterId: "chapter-6",
    order: 16,
  });

  await createPuzzle({
    id: "p16-1",
    levelId: "level-16",
    puzzleType: "image",
    order: 1,
    clue: "الصورة لقلم الكُتّاب الأول — يُقطع من الغاب ويُبرى طرفه. اكتب اسمه.",
    text: "القلم",
    imageUrl: "/images/game/reed-pen.png",
    hint: "أداة الكتابة الأولى التي أقسم الله بها في سورةٍ تحمل اسمها.",
    explanation:
      "القلم — من القصب يُقطع ويُبرى «سنّه»، ثم يُغمس في المداد؛ به نُسخت الكتب وحُفظت العلوم قروناً قبل اختراع القلم الحديث.",
    points: 45,
    hintCost: 10,
    category: "أدوات الكتابة",
  });

  await createPuzzle({
    id: "p16-2",
    levelId: "level-16",
    puzzleType: "multiple",
    order: 2,
    clue: "من أي نباتٍ كان يُقطع «قلم الكتابة» القديم ويُبرى طرفه؟",
    options: "القصب|النخل|القطن|الزيتون",
    correctOption: 0,
    hint: "نبتت على ضفاف الأنهار — مجوّفُ الساق صالحٌ للبري.",
    explanation:
      "القصب — مجوّف الساق قويُّ الألياف، يُقطع ويُبرى طرفه «سنّاً» دقيقاً، فهو قلم النسّاخين قروناً في الأمصار.",
    points: 40,
    hintCost: 10,
    category: "أدوات الكتابة",
  });

  await createPuzzle({
    id: "p16-3",
    levelId: "level-16",
    puzzleType: "fillblank",
    order: 3,
    clue: "أكمل باسم السواد الذي يُغمس فيه القلم — والكلمة تبدأ بميم.",
    fillBlanks: JSON.stringify([
      { kind: "text", text: "يُبرى القلم ثم يُغمس في " },
      { kind: "blank", answer: "المداد" },
    ]),
    options: "المداد|المراد|الوداد|الفؤاد",
    hint: "ما به يَمدُّ الكاتب حروفه على القرطاس.",
    explanation:
      "المداد — حِبر الكُتّاب؛ يُصنع قديماً من سخام الدخان والصمغ، وبه سُمّي أمير الشعراء «صاحب المداد»... وكانت صناعته حرفةً معروفة.",
    points: 45,
    hintCost: 10,
    category: "أدوات الكتابة",
  });

  await createPuzzle({
    id: "p16-4",
    levelId: "level-16",
    puzzleType: "fillblank",
    order: 4,
    clue: "أكمل وصية العرب الخالدة في حفظ العلم من الضياع.",
    fillBlanks: JSON.stringify([
      { kind: "text", text: "قالوا: «قيّدوا العلم " },
      { kind: "blank", answer: "بالكتابة" },
    ]),
    options: "بالكتابة|بالقراءة|بالزيارة|بالمدارة",
    hint: "التقييدُ حبلٌ — فما الحبل الذي يشدّ العلم؟",
    explanation:
      "«قيّدوا العلم بالكتابة» — الكتابة قيد العلم؛ بها يُحفظ من النسيان ويُنقل إلى من لم يدرك أهله، وهي وصية العرب والعلماء قديماً.",
    points: 55,
    hintCost: 10,
    category: "أمثال وحكم",
  });

  await createPuzzle({
    id: "p16-5",
    levelId: "level-16",
    puzzleType: "scrambled",
    order: 5,
    clue: "رتّب الحروف لتحصل على اسم وعاء المداد الذي يتدلّى من جيب الكاتب في رحلاته.",
    text: "المحبرة",
    availableLetters: "ا|ل|م|ح|ب|ر|ة|ق|س",
    hint: "سبعة أحرف مستعملة — والزائدان قاف وسين. رفيقة القلم في السفر.",
    explanation:
      "المحبرة — وعاء المداد الصغير؛ صناديق خشبية أنيقة يصحبها النسّاخ، ومعها القلم والمقلمة: عُدّة الكاتب كاملة.",
    points: 50,
    hintCost: 10,
    category: "أدوات الكتابة",
  });

  /* ---------- المرحلة السابعة عشرة — «أناقة الحرف» (متوسطة) ---------- */
  await ensureLevel({
    id: "level-17",
    title: "أناقة الحرف",
    difficulty: "medium",
    timeLimit: 300,
    reward: 65,
    hintCost: 10,
    learningGoals: JSON.stringify([
      "التعرف على فن الخط العربي وأنواعه",
      "ربط كل نوع خطٍّ باستعماله التاريخي",
      "معرفة طريق الكتاب من التأليف إلى السوق",
    ]),
    educationalDescription:
      "معرض الخط العربي: كوفيٌّ يزين المحاريب، ونسخٌ تحمل الكتب، وثلثٌ يرفع العناوين — ورحلةُ الكتاب من قلب المؤلف إلى سوق الورّاقين.",
    chapterId: "chapter-6",
    order: 17,
  });

  await createPuzzle({
    id: "p17-1",
    levelId: "level-17",
    puzzleType: "image",
    order: 1,
    clue: "الصورة لفنٍّ عربيٍّ يُسمّى «رسم الروح بالحرف» — اكتب اسم هذا الفن.",
    text: "الخط",
    imageUrl: "/images/game/calligraphy.png",
    hint: "فنٌّ من ثلاثة أحرف — «حسنُه من حسن الاسم» كما قيل.",
    explanation:
      "الخط العربي — فنٌّ سمّاه ابن مقلة «خطَّ المحققين»؛ بالحرف الواحد تُبنى لوحات، وبه تُزدان المحاريب والعملات والمخطوطات.",
    points: 50,
    hintCost: 10,
    category: "فن الخط",
  });

  await createPuzzle({
    id: "p17-2",
    levelId: "level-17",
    puzzleType: "images4",
    order: 2,
    clue: "أربع لقطاتٍ من عالم الكاتب — اكتشف الكلمة الجامعة بينها.",
    text: "الكتابة",
    imageUrl: "/images/game/calligraphy.png",
    image2Url: "/images/game/manuscript.png",
    image3Url: "/images/game/inkwell.png",
    image4Url: "/images/game/library.png",
    hint: "ما يجمع الخط والمخطوط والمداد والخزانة تحت فضاءٍ واحد.",
    explanation:
      "الكتابة — المعجزة التي حُفظ بها التراث: خطٌّ يُنسق، ومخطوطٌ يُبرى له القلم، وخزانةٌ تحفظ ما كتب الأوائل.",
    points: 75,
    hintCost: 10,
    category: "أدوات الكتابة",
  });

  await createPuzzle({
    id: "p17-3",
    levelId: "level-17",
    puzzleType: "matching",
    order: 3,
    clue: "اربط كل نوعٍ من الخطوط العربية باستعماله التاريخي — أربع ثنائيات من فن الوراقين.",
    matchPairs: JSON.stringify([
      { left: "الخط الكوفي", right: "أقدم خطوط المصاحف وزخرفة المساجد" },
      { left: "خط النسخ", right: "خط الكتب لوضوحه وسهولة قراءته" },
      { left: "الخط الثلث", right: "خط العناوين والشهادات لفخامته" },
      { left: "خط الرقعة", right: "خط الكتابة اليومية السريع" },
    ]),
    hint: "«النسخ» سمّي كذلك لأنه كان يُنسخ به — فماذا كان يُنسخ به؟",
    explanation:
      "الكوفي للمصاحف والزخارف، والنسخ لكثرة الكتب ووضوحها، والثلث للعناوين والشهادات، والرقعة لسرعة اليوميات — لكل مقامٍ خطٌّ مقيم.",
    points: 70,
    hintCost: 10,
    category: "فن الخط",
  });

  await createPuzzle({
    id: "p17-4",
    levelId: "level-17",
    puzzleType: "crossword",
    order: 4,
    clue: "شبكة الورشة: كلمتان تتقاطعان عند اللام — إحداهما أداة الكاتب الأولى والأخرى أرضُ كتابته الخشبية.",
    availableLetters: "ا|ل|ق|ل|م|و|ح|ب",
    hint: "الأفقية خمسة أحرف: أقسم الله بها في سورةٍ باسمها. والرأسية ثلاثة: يحمله صبيان الكتاتيب.",
    explanation:
      "الكلمتان: القلم واللوح — بالقلم يُكتب على اللوح في الكتاتيب، ثم يُمحى فيُعاد: هكذا تعلّم الأجيال قديماً.",
    points: 90,
    hintCost: 10,
    category: "أدوات الكتابة",
    cells: [
      { row: 0, col: 0, letter: "ا", number: 1 },
      { row: 0, col: 1, letter: "ل", number: 2 },
      { row: 0, col: 2, letter: "ق" },
      { row: 0, col: 3, letter: "ل" },
      { row: 0, col: 4, letter: "م" },
      { row: 1, col: 1, letter: "و" },
      { row: 2, col: 1, letter: "ح" },
    ],
    words: [
      {
        number: 1,
        direction: "across",
        row: 0,
        col: 0,
        length: 5,
        answer: "القلم",
        clue: "أداة الكتابة الأولى؛ براه الأقدمون من القصب، وأقسم الله به في مطلع سورةٍ تحمل اسمه.",
      },
      {
        number: 2,
        direction: "down",
        row: 0,
        col: 1,
        length: 3,
        answer: "لوح",
        clue: "أرض الكتابة الخشبية التي يحملها صبيان الكتاتيب؛ يكتبون عليها بالمحو ويُعيدون الكرّ صباحاً.",
      },
    ],
  });

  await createPuzzle({
    id: "p17-5",
    levelId: "level-17",
    puzzleType: "logic",
    order: 5,
    clue: "طريق الكتاب عند القدماء — ثلاث مراحلٍ ظهرت بالترتيب، فما رابعتها؟",
    logicData: JSON.stringify({
      kind: "sequence",
      items: ["التأليف", "النسخ", "التجليد"],
      options: [
        "عرضه في سوق الورّاقين",
        "تأليفه من جديد",
        "حفظه في الديوان",
        "تمزيقه وإعدامه",
      ],
      correctIndex: 0,
    }),
    hint: "بعد أن يكتمل الكتاب ويُجلَّد — أين يذهب ليلقى قرّاءه؟",
    explanation:
      "بعد التأليف والنسخ والتجليد يُعرض الكتاب في سوق الورّاقين — سوق الكتب في بغداد وقرطبة — حيث يتنافس القرّاء والمشترون.",
    points: 65,
    hintCost: 10,
    category: "منطق واستنتاج",
  });

  /* ---------- المرحلة الثامنة عشرة — «خزانة الحكماء» (صعبة) ---------- */
  await ensureLevel({
    id: "level-18",
    title: "خزانة الحكماء",
    difficulty: "hard",
    timeLimit: 330,
    reward: 75,
    hintCost: 15,
    learningGoals: JSON.stringify([
      "معرفة الورّاقين ودورهم في الحضارة",
      "فهم رحلة الورق من الصين إلى بغداد",
      "معرفة أشهر دور الكتب في الإسلام",
    ]),
    educationalDescription:
      "الخاتمة الكبرى: الورق ينتقل من الصين إلى بغداد، والورّاقون يبنون أسواق الكتب، ودار الحكمة تُنشأ في القاهرة — وبوابة بوسٍ أخيرة من ثلاث محطات.",
    chapterId: "chapter-6",
    order: 18,
  });

  await createPuzzle({
    id: "p18-1",
    levelId: "level-18",
    puzzleType: "mixed",
    order: 1,
    clue: "بوابة الخزانة الكبرى: ثلاث محطاتٍ من رحلة الكتاب في الحضارة — فاجتزها كلها لتُستحق خزانة الحكماء.",
    points: 150,
    hintCost: 15,
    category: "بوابة البوس",
    explanation:
      "ثلاث محطاتٍ من اقتصاد الكتاب: من ينسخه؟ وأين يُحفظ؟ وفي أي مدينةٍ ازدهرت خزائنه — من أجازها فقد دخل سوق الورّاقين.",
  });

  await createPuzzle({
    id: "p18-1-s1",
    levelId: null,
    puzzleType: "multiple",
    order: 1,
    clue: "المحطة الأولى — من هم «الورّاقون» في الحضارة الإسلامية؟",
    options:
      "نسّاخو الكتب وبائعوها في الأسواق|صانعو السيوف المشهورة|حرّاس الأسوار الليليون|رسّامو الزخارف فقط",
    correctOption: 0,
    points: 50,
    hint: "من «الوَرَق» — حِرفتهم من اسم الورق نفسه.",
    explanation:
      "الورّاقون — حلقة الوصل بين المؤلف والقارئ: ينسخون الكتب بأجرةٍ ويبيعونها في أسواقٍ خصصت لهم، وقد صار بعضهم من كبار العلماء.",
  });

  await createPuzzle({
    id: "p18-1-s2",
    levelId: null,
    puzzleType: "scrambled",
    order: 2,
    clue: "المحطة الثانية — رتّب الحروف لتحصل على اسم الدار التي تجمع الكتب وتربّي القرّاء.",
    text: "المكتبة",
    availableLetters: "ا|ل|م|ك|ت|ب|ة|ر|ن",
    points: 60,
    hint: "سبعة أحرف مستعملة — والزائدان راء ونون.",
    explanation:
      "المكتبة — خزانة الكتب الجامعة؛ أعظمها في الإسلام «بيت الحكمة» ببغداد، وكلُّ حضارةٍ تُعرف بخزائن كتبها.",
  });

  await createPuzzle({
    id: "p18-1-s3",
    levelId: null,
    puzzleType: "text",
    order: 3,
    clue: "المحطة الثالثة — في أي مدينةٍ أنشأ الفاطميون «دار الحكمة» سنة ٣٩٥هـ لتكون مكتبةً ومجلس علم؟",
    text: "القاهرة",
    points: 50,
    hint: "المدينة التي بناها الفاطميون وفيها الأزهر.",
    explanation:
      "القاهرة — دار الحكمة الفاطمية أنشأها الحاكم بأمر الله سنة ٣٩٥هـ/١٠٠٥م، فكانت مكتبةً عامرة ومجلساً للعلماء حتى قالوا: جمعت من الكتب ما لم يجمعه بيتٌ قبله.",
  });

  if ((await db.mixedStage.count({ where: { parentPuzzleId: "p18-1" } })) === 0) {
    await db.mixedStage.createMany({
      data: [
        { parentPuzzleId: "p18-1", stagePuzzleId: "p18-1-s1", order: 1 },
        { parentPuzzleId: "p18-1", stagePuzzleId: "p18-1-s2", order: 2 },
        { parentPuzzleId: "p18-1", stagePuzzleId: "p18-1-s3", order: 3 },
      ],
    });
    console.log("  + وصلات بوس p18-1 (٣ محطات)");
  }

  await createPuzzle({
    id: "p18-2",
    levelId: "level-18",
    puzzleType: "progressive",
    order: 2,
    clue: "سُلّم الاستنتاج الأخير: كل درجةٍ تلميحٌ أصرح — فما اسم هذه المادة التي غيّرت وجه الكتابة؟",
    text: "الورق",
    hints: JSON.stringify([
      "مادةٌ صار اسمها علماً على ما يُكتب فيه إلى اليوم.",
      "صنعها الصينيون أولاً، ثم نقلها المسلمون وطوّروا صناعتها في بغداد وسمرقند.",
      "حين رخص ثمنها في القرن الثالث الهجري صارت بديلاً عن الرِّقّ الجلدي، وفاضت بها خزائن الكتب.",
    ]),
    availableLetters: "ا|ل|و|ر|ق|ح|م",
    hint: "أول ما يفتحه الكاتب من عُدّته بعد القلم والمداد.",
    explanation:
      "الورق — نقل المسلمون صناعته من الصين وأتقنوها حتى كانت بغداد وسمرقند أعظم مراكزها، وبفضله عمّت الكتب وكسد تجارة الرق.",
    points: 90,
    hintCost: 15,
    category: "رحلة الكتاب",
  });

  await createPuzzle({
    id: "p18-3",
    levelId: "level-18",
    puzzleType: "crossword",
    order: 3,
    clue: "الشبكة الختامية: كلمتان تتقاطعان عند الكاف — إحداهما وعاء العلم والأخرى دارُه الجامعة.",
    availableLetters: "ا|ل|ك|ت|ب|م|ة|ن|ج",
    hint: "الأفقية أربعة أحرف: به خُلدت المعارف. والرأسية خمسة: دارٌ تجمع ألوفه.",
    explanation:
      "الكلمتان: كتاب ومكتبة — الكتاب وعاء العلم والمكتبة داره الجامعة؛ وباجتماعهما قامت حضارة القلم العربية.",
    points: 100,
    hintCost: 15,
    category: "مفردات تراثية",
    cells: [
      { row: 0, col: 0, letter: "م", number: 1 },
      { row: 1, col: 0, letter: "ك", number: 2 },
      { row: 1, col: 1, letter: "ت" },
      { row: 1, col: 2, letter: "ا" },
      { row: 1, col: 3, letter: "ب" },
      { row: 2, col: 0, letter: "ت" },
      { row: 3, col: 0, letter: "ب" },
      { row: 4, col: 0, letter: "ة" },
    ],
    words: [
      {
        number: 1,
        direction: "down",
        row: 0,
        col: 0,
        length: 5,
        answer: "مكتبة",
        clue: "دارٌ تجمع الكتب وتربّي القرّاء؛ أعظمها في الإسلام «بيت الحكمة» ببغداد، وفيها قيل: خزائن الأمم ذاكرةُ الأمم.",
      },
      {
        number: 2,
        direction: "across",
        row: 1,
        col: 0,
        length: 4,
        answer: "كتاب",
        clue: "وعاء العلم الأول؛ به نُقلت المعارف بين الأمم وحُفظ التراث من الضياع — وهو خير جليسٍ عند المتنبي.",
      },
    ],
  });

  await createPuzzle({
    id: "p18-4",
    levelId: "level-18",
    puzzleType: "logic",
    order: 4,
    clue: "ثلاثةٌ منها مدنٌ ازدهرت فيها خزائن كتب الإسلام، ورابعها داخل مدينةٍ لا مدينةٌ — التقط الشاذ.",
    logicData: JSON.stringify({
      kind: "oddOne",
      items: ["بغداد", "قرطبة", "القاهرة", "الأزهر"],
      correctIndex: 3,
    }),
    hint: "الشاذ يُذكر مع الجامع لا مع المدن.",
    explanation:
      "الأزهر جامعٌ وجامعةٌ عريقة في القاهرة، أما بغداد وقرطبة والقاهرة فمدنٌ ازدهرت فيها خزائن الكتب وأسواق الورّاقين.",
    points: 70,
    hintCost: 15,
    category: "منطق واستنتاج",
  });

  await createPuzzle({
    id: "p18-5",
    levelId: "level-18",
    puzzleType: "text",
    order: 5,
    clue: "ما اسم الكتاب المكتوب بخط اليد قبل عصر الطباعة — وضده «المطبوع»؟",
    text: "المخطوط",
    hint: "من «خُطَّ» — أي رُسم باليد لا بالآلة.",
    explanation:
      "المخطوط — ما كُتب بخط اليد؛ ملايين المخطوطات العربية محفوظة في خزائن العالم، وتحقيقها علمٌ قائم بذاته إلى اليوم.",
    points: 65,
    hintCost: 15,
    category: "رحلة الكتاب",
  });

  /* ============================================================
     تقرير التحقق النهائي
     ============================================================ */
  const levels = await db.level.findMany({
    orderBy: { order: "asc" },
    include: { chapter: { select: { title: true } }, _count: { select: { puzzles: true } } },
  });
  console.log("\n=== خريطة الفصول النهائية ===");
  for (const level of levels) {
    console.log(
      `${level.order}) ${level.id} «${level.title}» [${level.difficulty}] — ${level._count.puzzles} ألغاز — ${level.chapter?.title ?? "بلا فصل"}`,
    );
  }
  const totalPuzzles = await db.puzzle.count({ where: { levelId: { not: null } } });
  const totalStages = await db.puzzle.count({ where: { levelId: null } });
  console.log(
    `\nالإجمالي: ${levels.length} مراحل و${totalPuzzles} لغزاً (زائد ${totalStages} محطة بوس).`,
  );
}

main()
  .catch((error) => {
    console.error("فشل البذر:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
