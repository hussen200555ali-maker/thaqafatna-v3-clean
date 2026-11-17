/**
 * سكربت بذر التوسعة الكبرى — ٦ مراحل جديدة عبر ٣ فصول
 * =====================================================
 * يحوّل خريطة اللعبة من ٣ مراحل إلى ٩ مراحل منظمة في فصول:
 *
 *   الفصل الأول — أصول المعرفة:    بذور المعرفة (١) + كنوز اللغة (٢) + الحكمة والأمثال (٣)
 *   الفصل الثاني — الألغاز المصورة: ألغاز مصوّرة (٤) + رحلة الصور (٥) + أعلام وفنون (٦)
 *   الفصل الثالث — حصن الحكماء:    حصن الحكماء (٧) + معقل المنطق (٨) + التاج الذهبي (٩)
 *
 * • إعادة ترقيم المرحلتين القديمتين (level-2 → 4، level-3 → 7)
 *   لتصبح الفصول متجاورة في خريطة الرئيسية.
 * • الصور العشر المولّدة في public/images/game (نمط تراثي موحّد).
 * • بلا ألغاز صوتية جديدة — جودة النطق العربي غير المضمونة من TTS،
 *   والنوع الصوتي يبقى جوهرة «حصن الحكماء» بصوته المعتمد.
 *
 * قابل لإعادة التشغيل (Idempotent): يتخطى ما وُجد ويكمل ما نقص.
 *
 * تشغيل: bun run scripts/seed-expansion.ts
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
  levelId: string;
  puzzleType: string;
  order: number;
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

/* ============================================================
   التنفيذ
   ============================================================ */

async function main() {
  console.log("بذر التوسعة الكبرى — ٦ مراحل جديدة…\n");

  /* ---------- 1) إعادة ترقيم المرحلتين القديمتين ---------- */
  await db.level.update({ where: { id: "level-2" }, data: { order: 4 } });
  await db.level.update({ where: { id: "level-3" }, data: { order: 7 } });
  console.log("• أُعيد ترقيم level-2 → ٤ و level-3 → ٧ (فصول متجاورة)\n");

  /* ============================================================
     المرحلة الرابعة — «كنوز اللغة» (فصل ١، ترتيب ٢، سهلة)
     ============================================================ */
  const existing4 = await db.level.findUnique({ where: { id: "level-4" } });
  if (!existing4) {
    await db.level.create({
      data: {
        id: "level-4",
        title: "كنوز اللغة",
        difficulty: "easy",
        timeLimit: 300,
        reward: 55,
        hintCost: 10,
        learningGoals: JSON.stringify([
          "إتقان مفردات عربية فصيحة من قلب المعاجم",
          "ترسيخ أمثال الحياة اليومية في الذاكرة",
          "فهم أوزان الجمع ومفردات المفردات التراثية",
        ]),
        educationalDescription:
          "غوصٌ في معاجم العربية: معانٍ فصيحة وجمعٌ شاذّ ومثلٌ سائر وشبكة صغيرة من مفردات العلم — أربعة ألغاز تُمتحن بها ذاكرتك اللغوية.",
        chapterId: "chapter-1",
        order: 2,
      },
    });
    console.log("• أُنشئت المرحلة: كنوز اللغة");
  }

  await createPuzzle({
    id: "p4-1",
    levelId: "level-4",
    puzzleType: "multiple",
    order: 1,
    clue: "ما معنى كلمة «البَهاء» في اللغة العربية الفصيحة؟",
    options: "الجمال والحسن|الغضب الشديد|الجبن والخوف|الطول والقصر",
    correctOption: 0,
    hint: "تُقال: فلانٌ ذو بهاءٍ — أي يلفت الأنظار بمنظره.",
    explanation:
      "البَهاء: الجمال والحسن والجلال الظاهر — ومنه «أبو البهاء» لقباً لمن اشتُهر بجمال منظره.",
    points: 40,
    hintCost: 10,
    category: "مفردات فصيحة",
  });

  await createPuzzle({
    id: "p4-2",
    levelId: "level-4",
    puzzleType: "text",
    order: 2,
    clue: "ما جمع كلمة «قوس» في اللغة الفصيحة — تلك الأداة التي يُرمى بها عن السهام؟",
    text: "أقواس",
    hint: "جمعٌ على وزن «أفعال» — وابدأ بهمزة الوصل.",
    explanation:
      "أقواس — جمع قوس، من الجموع السالمة على وزن أفعال مثل أنمارٍ وأنصار.",
    points: 40,
    hintCost: 10,
    category: "مفردات فصيحة",
  });

  await createPuzzle({
    id: "p4-3",
    levelId: "level-4",
    puzzleType: "fillblank",
    order: 3,
    clue: "أكمل المثل العربي السائر الذي يضرب مثلاً لاستحالة إنجاز العمل الكبير بجهدٍ فردٍ واحد.",
    fillBlanks: JSON.stringify([
      { kind: "text", text: "يدٌ واحدةٌ لا " },
      { kind: "blank", answer: "تُصفّق" },
    ]),
    options: "تُصفّق|تُحصّن|تُبنى|تُحصد",
    hint: "الفعل من الصفّة — كما يفعل الناس فرحاً بالكفّين.",
    explanation:
      "«يدٌ واحدةٌ لا تُصفّق» — كمال العمل لا يتحقق إلا بالتعاون واليدين المتعاونتين.",
    points: 50,
    hintCost: 10,
    category: "أمثال وحكم",
  });

  await createPuzzle({
    id: "p4-4",
    levelId: "level-4",
    puzzleType: "scrambled",
    order: 4,
    clue: "رتّب الحروف لتحصل على اسم الكتاب الذي يجمع مفردات اللغة ويشرح معانيها — رفيق كل مثقفٍ عربي.",
    text: "قاموس",
    availableLetters: "ق|ا|م|و|س|ر|ن",
    hint: "خمسة أحرف مستعملة — والزائدان راء ونون.",
    explanation:
      "«القاموس» — أصله لفظ البحر العميق، وسمي به كتاب الفيروزآبادي فغلب على كل معجم.",
    points: 55,
    hintCost: 10,
    category: "مفردات فصيحة",
  });

  await createPuzzle({
    id: "p4-5",
    levelId: "level-4",
    puzzleType: "crossword",
    order: 5,
    clue: "شبكة ختامية من كلمتين تتقاطعان عند اللام — إحداهما نور العقل والأخرى ترجمانه.",
    availableLetters: "ا|م|ن|ع|ل|س|ر|د",
    hint: "الأفقية ثلاثة أحرف: ضدها الجهل. والرأسية خمسة: ينطق به القول.",
    explanation: "الكلمتان: علم، لسان — بهما يعلو الإنسان: علمٌ يُبصر ولسانٌ يُعبّر.",
    points: 80,
    hintCost: 15,
    category: "مفردات تراثية",
    cells: [
      { row: 0, col: 0, letter: "ع", number: 1 },
      { row: 0, col: 1, letter: "ل", number: 2 },
      { row: 0, col: 2, letter: "م" },
      { row: 1, col: 1, letter: "س" },
      { row: 2, col: 1, letter: "ا" },
      { row: 3, col: 1, letter: "ن" },
    ],
    words: [
      {
        number: 1,
        direction: "across",
        row: 0,
        col: 0,
        length: 3,
        answer: "علم",
        clue: "ضده الجهل، وبه شُرّف الإنسان على سائر المخلوقات، وهو ميراث الأنبياء الأول.",
      },
      {
        number: 2,
        direction: "down",
        row: 0,
        col: 1,
        length: 4,
        answer: "لسان",
        clue: "ترجمان القلوب وعضو البيان، وبه يظهر ما في الضمير من خفايا المعاني.",
      },
    ],
  });

  /* ============================================================
     المرحلة الخامسة — «الحكمة والأمثال» (فصل ١، ترتيب ٣، متوسطة)
     ============================================================ */
  const existing5 = await db.level.findUnique({ where: { id: "level-5" } });
  if (!existing5) {
    await db.level.create({
      data: {
        id: "level-5",
        title: "الحكمة والأمثال",
        difficulty: "medium",
        timeLimit: 300,
        reward: 60,
        hintCost: 10,
        learningGoals: JSON.stringify([
          "ربط الأمثال العربية بمعانيها الذهبية",
          "تمييز المثل العربي الأصيل من الدخيل",
          "حفظ حكم الخالد من كلام العرب",
        ]),
        educationalDescription:
          "خمسة ألغاز من ديوان العرب: مثلٌ يُكمل، ومعانٍ تُربط، ورموزٌ تُقرأ — فهل تحفظ العربية كنوزها كما حفظها أسلافك؟",
        chapterId: "chapter-1",
        order: 3,
      },
    });
    console.log("• أُنشئت المرحلة: الحكمة والأمثال");
  }

  await createPuzzle({
    id: "p5-1",
    levelId: "level-5",
    puzzleType: "text",
    order: 1,
    clue: "أكمل الحكمة الذهبية الشهيرة: «في التأنّي السلامة، وفي العجلة ___»",
    text: "الندامة",
    hint: "ضدّ الفرح — وترتبط بما يشعر به المتسرّع بعد فوات الأوان.",
    explanation:
      "«في التأنّي السلامة وفي العجلة الندامة» — من حكمة العرب الخالدة في فضل التمهل.",
    points: 45,
    hintCost: 10,
    category: "أمثال وحكم",
  });

  await createPuzzle({
    id: "p5-2",
    levelId: "level-5",
    puzzleType: "emoji",
    order: 2,
    clue: "اقرأ الرموز واستنتج المناسبة السعيدة التي يهلّ عليها الهلال وتفوح بالحلويات والاحتفالات.",
    text: "عيد الفطر",
    emojis: "🌙🎉🍬",
    hint: "يأتي بعد شهر الصيام مباشرة.",
    explanation:
      "عيد الفطر — أول أعياد المسلمين، يهلّ برؤية هلال شوال وتعمّ فيه الفرحة والحلويات.",
    points: 50,
    hintCost: 10,
    category: "شعائر ومناسبات",
  });

  await createPuzzle({
    id: "p5-3",
    levelId: "level-5",
    puzzleType: "fillblank",
    order: 3,
    clue: "أكمل قاعدة البلغاء الذهبية في وصف خير الكلام.",
    fillBlanks: JSON.stringify([
      { kind: "text", text: "خيرُ الكلامِ ما " },
      { kind: "blank", answer: "قلّ" },
      { kind: "text", text: " ودلّ" },
    ]),
    options: "قلّ|كثر|طال|غاب",
    hint: "ضدّ كثُر — فالبلاغة في الإيجاز.",
    explanation:
      "«خير الكلام ما قلّ ودلّ» — كناية عن بلاغة الإيجاز التي هي روح البيان العربي.",
    points: 50,
    hintCost: 10,
    category: "أمثال وحكم",
  });

  await createPuzzle({
    id: "p5-4",
    levelId: "level-5",
    puzzleType: "matching",
    order: 4,
    clue: "اربط كل مثلٍ عربيٍّ خالد بمعناه الذهبي — أربع ثنائيات من ديوان العرب.",
    matchPairs: JSON.stringify([
      { left: "الصبر مفتاح الفرج", right: "الثمرة تُجنى بالانتظار" },
      { left: "الطيور على أشكالها تقع", right: "كلٌّ يأنس لمن يشبهه" },
      { left: "من جدّ وجد", right: "الاجتهاد سبيل الظفر" },
      { left: "أحسنْ إلى الناس تستعبد قلوبهم", right: "الإحسان يملك القلوب" },
    ]),
    hint: "قائل الأخيرة الإمام الشافعي — وفيها مفتاح المودة كلها.",
    explanation:
      "الصبر ثمرة انتظار، والطيور جماعات أشكال، والجد سبب الوجدان، والإحسان استعباد للقلوب.",
    points: 70,
    hintCost: 15,
    category: "أمثال وحكم",
  });

  await createPuzzle({
    id: "p5-5",
    levelId: "level-5",
    puzzleType: "multiple",
    order: 5,
    clue: "أي العبارات الآتية ليس مثلاً عربياً أصيلاً — بل مثلٌ دخيل ترجمته الأمم عن الرومان؟",
    options:
      "العِلم في الصِّغَر كالنَّقش في الحجر|من جدّ وجد|كل الطرق تؤدي إلى روما|الصبر مفتاح الفرج",
    correctOption: 2,
    hint: "الجواب يخفي اسم مدينة أوروبية عريقة.",
    explanation:
      "«كل الطرق تؤدي إلى روما» — مثل روماني دخيل، وبقية الخيارات أمثال عربية أصيلة.",
    points: 60,
    hintCost: 10,
    category: "أمثال وحكم",
  });

  /* ============================================================
     المرحلة السادسة — «رحلة الصور» (فصل ٢، ترتيب ٥، سهلة)
     ============================================================ */
  const existing6 = await db.level.findUnique({ where: { id: "level-6" } });
  if (!existing6) {
    await db.level.create({
      data: {
        id: "level-6",
        title: "رحلة الصور",
        difficulty: "easy",
        timeLimit: 300,
        reward: 60,
        hintCost: 10,
        learningGoals: JSON.stringify([
          "قراءة الصور التراثية واستنتاج ما ترمز إليه",
          "معرفة الآلات والرموز الصحراوية العربية",
          "ربط المشاهدات بالكلمات الجامعة",
        ]),
        educationalDescription:
          "خمس لقطات من جزيرة العرب: آلةٌ فلكية وصحراءُ وواحةٌ وسفينةٌ تمشي على الرمل — عينك الثقافية هي أداة الحل الوحيدة.",
        chapterId: "chapter-2",
        order: 5,
      },
    });
    console.log("• أُنشئت المرحلة: رحلة الصور");
  }

  await createPuzzle({
    id: "p6-1",
    levelId: "level-6",
    puzzleType: "image",
    order: 1,
    clue: "ما اسم هذه الآلة الفلكية المسطّحة التي أتقن صنعها العلماء العرب واستخدموها في تحديد القبلة وأوقات الصلاة ومراقبة مواقع النجوم؟",
    text: "الأسطرلاب",
    imageUrl: "/images/game/astrolabe.png",
    hint: "قرصٌ نحاسي مسطّح بحلقات محفورة ومؤشرٍ دوّار — يبدأ بهمزة وصل وينتهي بالباء.",
    explanation:
      "الأسطرلاب — أشهر آلات الفلك في الحضارة الإسلامية، طوّره العلماء العرب ومنه حُددت مواقع النجوم والقبلة والوقت.",
    points: 60,
    hintCost: 10,
    category: "علوم وآلات",
  });

  await createPuzzle({
    id: "p6-2",
    levelId: "level-6",
    puzzleType: "images4",
    order: 2,
    clue: "أربع لقطات من عالمٍ واحدٍ واسع ترويه رماله وسماؤه ونخيله — ما الكلمة الجامعة بينها؟",
    text: "الصحراء",
    imageUrl: "/images/game/desert.png",
    image2Url: "/images/game/camel.png",
    image3Url: "/images/game/oasis.png",
    image4Url: "/images/game/sand-dunes.png",
    hint: "البيئة التي وُلدت فيها العربية الفصيحة وأهلها «أهل المدر» في مقابلها.",
    explanation:
      "الصحراء — الكثبان والقافلة والواحة والجمل: ثنياتها تحكي ثمانية قرون من حضارة جزيرة العرب.",
    points: 65,
    hintCost: 15,
    category: "جغرافيا وبيئة",
  });

  await createPuzzle({
    id: "p6-3",
    levelId: "level-6",
    puzzleType: "emoji",
    order: 3,
    clue: "اقرأ الرموز وسمِّ المكان الأخضر الذي يستريح فيه مسافرو الصحراء: نخيلٌ وماءٌ ورمال.",
    text: "الواحة",
    emojis: "🌴💧🏜️",
    hint: "خضراءُ في بحرٍ من الرمال — تستريح إليها القوافل.",
    explanation:
      "الواحة — بقعة خضراء وسط الصحراء تجمع الماء والنخيل، وملاذ القوافل منذ فجر التاريخ.",
    points: 50,
    hintCost: 10,
    category: "جغرافيا وبيئة",
  });

  await createPuzzle({
    id: "p6-4",
    levelId: "level-6",
    puzzleType: "text",
    order: 4,
    clue: "ما الحيوان الذي لقّبه العرب بلقب «سفينة الصحراء» لصبره وحمله ورحلاته الطويلة؟",
    text: "الجمل",
    hint: "فيه سَنامٌ يميّزه، ويُضرب به المثل في الصبر.",
    explanation:
      "الجمل — «سفينة الصحراء»: رفيق العربي في أسفاره، يحمل البرد ويصبر الظمأ أياماً.",
    points: 40,
    hintCost: 10,
    category: "طبيعة وحياة",
  });

  await createPuzzle({
    id: "p6-5",
    levelId: "level-6",
    puzzleType: "scrambled",
    order: 5,
    clue: "رتّب الحروف لتعرف اسم موكب المسافرين الذي يقطع الرمال بحثاً عن الماء والتجارة.",
    text: "قافلة",
    availableLetters: "ق|ا|ف|ل|ة|ب|ر",
    hint: "خمسة أحرف مستعملة — والزائدان باء وراء.",
    explanation:
      "«القافلة» — موكب المسافرين في الصحراء، وكانت عصب التجارة بين الشام واليمن والعراق.",
    points: 55,
    hintCost: 10,
    category: "جغرافيا وبيئة",
  });

  /* ============================================================
     المرحلة السابعة — «أعلام وفنون» (فصل ٢، ترتيب ٦، متوسطة)
     ============================================================ */
  const existing7 = await db.level.findUnique({ where: { id: "level-7" } });
  if (!existing7) {
    await db.level.create({
      data: {
        id: "level-7",
        title: "أعلام وفنون",
        difficulty: "medium",
        timeLimit: 300,
        reward: 70,
        hintCost: 10,
        learningGoals: JSON.stringify([
          "ربط أعلام الحضارة العربية بكتبهم الخالدة",
          "معرفة فنون العربية من العود إلى الضيافة",
          "تتبع أثر العلماء في مصطلحات اليوم",
        ]),
        educationalDescription:
          "خمسة ألغاز عن الذين رفعوا مشاعل العلم: كتبٌ تُنسب، وأوتارٌ تعزف، وفنٌّ من أرقّ ما أنجزه الإنسان — احفظهم يحفظوك.",
        chapterId: "chapter-2",
        order: 6,
      },
    });
    console.log("• أُنشئت المرحلة: أعلام وفنون");
  }

  await createPuzzle({
    id: "p7-1",
    levelId: "level-7",
    puzzleType: "matching",
    order: 1,
    clue: "اربط كل عَلَمٍ من أعلام الحضارة بكتابه الخالد — أربع ثنائيات من ذاكرة العلم.",
    matchPairs: JSON.stringify([
      { left: "ابن سينا", right: "القانون في الطب" },
      { left: "الخوارزمي", right: "الجبر والمقابلة" },
      { left: "الفارابي", right: "المدينة الفاضلة" },
      { left: "الرازي", right: "الحاوي في الطب" },
    ]),
    hint: "صاحب «الحاوي» هو طبيب بغداد الذي شُفّ بصره من ماء البصل يوماً.",
    explanation:
      "ابن سينا: القانون في الطب، الخوارزمي: الجبر والمقابلة، الفارابي: آراء أهل المدينة الفاضلة، الرازي: الحاوي.",
    points: 70,
    hintCost: 15,
    category: "أعلام ومؤلفات",
  });

  await createPuzzle({
    id: "p7-2",
    levelId: "level-7",
    puzzleType: "images4",
    order: 2,
    clue: "أربع صور تحكي قيمةً عربية أصيلة من مجلس العرب: دلّةٌ وتمرٌ وفناجينُ وفرشٌ — ما الكلمة الجامعة؟",
    text: "الضيافة",
    imageUrl: "/images/game/dallah.png",
    image2Url: "/images/game/dates.png",
    image3Url: "/images/game/coffee-cups.png",
    image4Url: "/images/game/majlis.png",
    hint: "خلقُ العرب الأول: «القِرى» — ومنه قولهم: الضيف مُقدَّم.",
    explanation:
      "الضيافة — الدلّة والتمر والفناجين والمجلس: طقوس كرمٍ عمرها قرون ما زالت تحيا في كل بيتٍ عربي.",
    points: 70,
    hintCost: 15,
    category: "فنون وحرف",
  });

  await createPuzzle({
    id: "p7-3",
    levelId: "level-7",
    puzzleType: "multiple",
    order: 3,
    clue: "من هو العالم المسلم الذي اشتُقّ اسمُه اسمٌ لعلوم الحاسب اليوم في كلمة «Algorithm»؟",
    options: "الخوارزمي|ابن سينا|البيروني|ابن رشد",
    correctOption: 0,
    hint: "من مدينة خوارزم — واسم كتابه صار علم الجبر نفسه.",
    explanation:
      "الخوارزمي — من اسمه اللاتيني (Algoritmi) اشتُقت كلمة Algorithm، ومن كتابه «الجبر والمقابلة» اشتُق اسم علم الجبر.",
    points: 55,
    hintCost: 10,
    category: "أعلام ومؤلفات",
  });

  await createPuzzle({
    id: "p7-4",
    levelId: "level-7",
    puzzleType: "image",
    order: 4,
    clue: "ما اسم هذه الآلة الوترية التي يلقّبها الموسيقيون بـ«سلطان الطرب» في الموسيقى العربية؟",
    text: "العود",
    imageUrl: "/images/game/oud.png",
    hint: "آلةٌ جوفاء برقبةٍ قصيرة وخمسة أوتار مزدوجة — رفيق زرياب في قرطبة.",
    explanation:
      "العود — سلطان الطرب العربي، طوّره زرياب في الأندلس وأصبح أباً لآلات العالم الوترية كلها تقريباً.",
    points: 60,
    hintCost: 10,
    category: "فنون وحرف",
  });

  await createPuzzle({
    id: "p7-5",
    levelId: "level-7",
    puzzleType: "text",
    order: 5,
    clue: "في أي مدينةٍ أندلسية ازدهرت الموسيقى والغناء على يد الموسيقار زرياب في القرن التاسع الميلادي؟",
    text: "قرطبة",
    hint: "حاضرة الأندلس الأولى — وفيها مسجدها الجامع الشهير بالأعمدة.",
    explanation:
      "قرطبة — فيها أسس زرياب مدرسته الموسيقية، وبلغت المدينة ذروة ازدهارها مدرسةً للفنون والعلوم.",
    points: 45,
    hintCost: 10,
    category: "تاريخ وأماكن",
  });

  /* ============================================================
     المرحلة الثامنة — «معقل المنطق» (فصل ٣، ترتيب ٨، صعبة)
     ============================================================ */
  const existing8 = await db.level.findUnique({ where: { id: "level-8" } });
  if (!existing8) {
    await db.level.create({
      data: {
        id: "level-8",
        title: "معقل المنطق",
        difficulty: "hard",
        timeLimit: 360,
        reward: 85,
        hintCost: 15,
        learningGoals: JSON.stringify([
          "استنتاج الغائب من المتتاليات المنطقية",
          "تمييز الشاذ بين المتشابهات",
          "تتبع الحقائق العلمية في تراث بيت الحكمة",
        ]),
        educationalDescription:
          "أربعة أبوابٍ ونيّف تُختبر بها قوة استنباطك: متتالياتٌ ناقصة، وشاذٌّ يختبئ بين إخوانه، وسُلّم تلميحات، وحقبةٌ ازدهرت فيها العلوم.",
        chapterId: "chapter-3",
        order: 8,
      },
    });
    console.log("• أُنشئت المرحلة: معقل المنطق");
  }

  await createPuzzle({
    id: "p8-1",
    levelId: "level-8",
    puzzleType: "logic",
    order: 1,
    clue: "فصول السنة تتوالى بانتظامٍ لا يخلف — ثلاثةٌ ظهرت في المتتالية، فأيُّ فصلٍ غائبٌ يُكملها؟",
    logicData: JSON.stringify({
      kind: "sequence",
      items: ["الربيع", "الصيف", "الخريف"],
      options: ["الشتاء", "الخريف الثاني", "المطر", "الحصاد"],
      correctIndex: 0,
    }),
    hint: "الفصول أربعة — والغائب أبردُها.",
    explanation:
      "الشتاء — رابع فصول السنة وختام الدورة، يلي الخريف ويسبق الربيع.",
    points: 55,
    hintCost: 15,
    category: "منطق واستنتاج",
  });

  await createPuzzle({
    id: "p8-2",
    levelId: "level-8",
    puzzleType: "logic",
    order: 2,
    clue: "ثلاثةٌ من هذه العلوم فروعُ الرياضيات كلها، ورابعٌ دسّ نفسه بينها — التقط الشاذ.",
    logicData: JSON.stringify({
      kind: "oddOne",
      items: ["الجبر", "الهندسة", "الطب", "الحساب"],
      correctIndex: 2,
    }),
    hint: "الشاذ يُعالج المرضى لا المعادلات.",
    explanation:
      "الطب — علمُ الأبدان لا الأعداد؛ أما الجبر والهندسة والحساب ففروع الرياضيات.",
    points: 60,
    hintCost: 15,
    category: "منطق واستنتاج",
  });

  await createPuzzle({
    id: "p8-3",
    levelId: "level-8",
    puzzleType: "progressive",
    order: 3,
    clue: "سُلّم الاستنتاج: كل درجةٍ تلميحٌ أصرح من سابقتها — فما المبنى الذي يرصد به أهل الفلك السماء؟",
    text: "المرصد",
    hints: JSON.stringify([
      "مكانٌ مخصص لرصد السماء ليلاً.",
      "بناءٌ يضم أدواتٍ فلكيةً كبيرةً كالأرصدة والكرات السماوية.",
      "منه رصد البتاني والبيروني حركةَ النجوم والكواكب قبل ألف عام.",
    ]),
    hint: "يبدأ بميمٍ وينتهي بدالٍ — ومثله الشهير «مرصد سمرقند».",
    explanation:
      "المرصد — بيت رصد السماء، وأشهر مراصد الإسلام: مرصد بغداد ومرصد سمرقند الذي بناه أولوغ بيك.",
    points: 80,
    hintCost: 10,
    category: "علوم وآلات",
  });

  await createPuzzle({
    id: "p8-4",
    levelId: "level-8",
    puzzleType: "multiple",
    order: 4,
    clue: "أيُّ إنجازٍ يُنسب إلى العالم المسلم الحسن بن الهيثم؟",
    options:
      "أسّس علم البصريات في كتاب «المناظر»|اخترع الجبر والمقابلة|ألّف «الحاوي» في الطب|ترجم كتب أرسطو إلى العربية",
    correctOption: 0,
    hint: "تجاربه بالثقب المظلم فسّرت كيف يرى الإنسان — قبل كبلر ونيوتن بقرون.",
    explanation:
      "ابن الهيثم — «أبو البصريات»: كتابه «المناظر» أسس علم الضوء، وتجربة غرفته المظلمة أثبتت كيفية الإبصار.",
    points: 65,
    hintCost: 15,
    category: "أعلام ومؤلفات",
  });

  await createPuzzle({
    id: "p8-5",
    levelId: "level-8",
    puzzleType: "text",
    order: 5,
    clue: "ما اسم المجمع العلمي العظيم الذي أنشأه الخليفة المأمون في بغداد لتُترجم فيه علوم الأمم كلها إلى العربية؟",
    text: "بيت الحكمة",
    hint: "دارٌ للعلم في بغداد — ومنه انطلقت الترجمات إلى أوروبا لاحقاً.",
    explanation:
      "بيت الحكمة — أعظم مجمع علمي في العصر العباسي، ترجمت فيه كتب اليونان وفارس والهند وصارت العربية لغة العلم الأولى.",
    points: 50,
    hintCost: 15,
    category: "تاريخ وأماكن",
  });

  /* ============================================================
     المرحلة التاسعة — «التاج الذهبي» (فصل ٣، ترتيب ٩، صعبة)
     ============================================================ */
  const existing9 = await db.level.findUnique({ where: { id: "level-9" } });
  if (!existing9) {
    await db.level.create({
      data: {
        id: "level-9",
        title: "التاج الذهبي",
        difficulty: "hard",
        timeLimit: 420,
        reward: 120,
        hintCost: 15,
        learningGoals: JSON.stringify([
          "لمّ شمل ما تعلمته في الفصول الثلاثة",
          "عبور بوابة البوس الختامية بمحطاتها الثلاث",
          "حل الشبكة الختامية: العقل والقلم",
        ]),
        educationalDescription:
          "الختام الكبير: بوابة بوسٍ من ثلاث محطاتٍ متتابعة، وسُلّمٌ إلى أرضٍ فقدها العرب، وظواهر فلكية وشاذٌّ بينها — ثم شبكةٌ تختصر الرحلة كلها: العقل والقلم.",
        chapterId: "chapter-3",
        order: 9,
      },
    });
    console.log("• أُنشئت المرحلة: التاج الذهبي");
  }

  /* محطات البوس الثلاث — تُنشأ أولاً ثم تُربط */
  await createPuzzle({
    id: "p9-1-s1",
    levelId: null,
    puzzleType: "multiple",
    order: 1,
    clue: "في أي عصرٍ ازدهر بيت الحكمة وبلغت بغداد ذروة عصرها الذهبي للعلوم والترجمة؟",
    options: "العباسي|الأموي|الفاطمي|العثماني",
    correctOption: 0,
    hint: "العصر الذي بدأ بهارون الرشيد وازدهر بالمأمون.",
    explanation:
      "العصر العباسي — قرنان من الذهب العلمي: بغداد عاصمة الدنيا وبيت الحكمة منارتها.",
    points: 50,
    hintCost: 15,
    category: "بوابة البوس",
  });

  await createPuzzle({
    id: "p9-1-s2",
    levelId: null,
    puzzleType: "scrambled",
    order: 2,
    clue: "رتّب الحروف لتحصل على اسم كتاب ابن الهيثم الذي أسس به علم البصريات.",
    text: "المناظر",
    availableLetters: "ا|ل|م|ن|ا|ظ|ر|ق",
    hint: "سبعة أحرف مستعملة — والزائد قاف.",
    explanation:
      "«المناظر» — كتاب ابن الهيثم في علم البصريات، ظل مرجعاً لأوروبا ستة قرون.",
    points: 60,
    hintCost: 15,
    category: "بوابة البوس",
  });

  await createPuzzle({
    id: "p9-1-s3",
    levelId: null,
    puzzleType: "text",
    order: 3,
    clue: "من هو العالم الذي لُقّب بـ«أبي البصريات» صاحب كتاب المناظر وغرفة الظلام؟",
    text: "ابن الهيثم",
    hint: "بصرياتٌ وبصريّ — والاسم يبدأ بابنٍ.",
    explanation:
      "ابن الهيثم — محمد بن الحسن، عالم البصرة والبصريات، وغرفة الظلام تجربته الخالدة.",
    points: 50,
    hintCost: 15,
    category: "بوابة البوس",
  });

  await createPuzzle({
    id: "p9-1",
    levelId: "level-9",
    puzzleType: "mixed",
    order: 1,
    clue: "بوابة البوس الكبرى: ثلاث محطاتٍ متتابعة تحكي قصةً واحدة — العصر، فالكتاب، فالعالم — فاجتزها كلها لتفوز بالتاج.",
    points: 150,
    hintCost: 15,
    category: "بوابة البوس",
    text: null,
    hint: "المحطات تتحدث كلها عن العصر الذهبي للعلوم في بغداد.",
    explanation:
      "المحطات الثلاث: العصر العباسي، وكتاب المناظر، وابن الهيثم — مثلث النور في حضارتنا.",
  });

  /* وصلات البوس — إن لم توجد */
  if ((await db.mixedStage.count({ where: { parentPuzzleId: "p9-1" } })) === 0) {
    await db.mixedStage.createMany({
      data: [
        { parentPuzzleId: "p9-1", stagePuzzleId: "p9-1-s1", order: 1 },
        { parentPuzzleId: "p9-1", stagePuzzleId: "p9-1-s2", order: 2 },
        { parentPuzzleId: "p9-1", stagePuzzleId: "p9-1-s3", order: 3 },
      ],
    });
    console.log("  + وصلات بوس p9-1 (٣ محطات)");
  }

  await createPuzzle({
    id: "p9-2",
    levelId: "level-9",
    puzzleType: "progressive",
    order: 2,
    clue: "سُلّم الاستنتاج الأخير: كل درجةٍ تلميحٌ أصرح — فما الأرض التي حكمها الأمويون ثمانية قرون؟",
    text: "الأندلس",
    hints: JSON.stringify([
      "أرضٌ عربيةٌ في أقصى غرب العالم الإسلامي.",
      "عبر إليها طارق بن زياد، وفيها ازدهرت قرطبة وإشبيلية وغرناطة.",
      "آخر ممالكها سقطت في غرناطة عام ٨٩٢هـ/١٤٩٢م.",
    ]),
    hint: "تجري فيها الأنهار وتسقى بها حدائق غرناطة — واسمها مركّب من ألفٍ ولامٍ و«أندلس».",
    explanation:
      "الأندلس — ثمانية قرون من الحضارة العربية في أوروبا: علومٌ وبناياتٌ وحدائق ما زالت شاهدة.",
    points: 85,
    hintCost: 10,
    category: "تاريخ وأماكن",
  });

  await createPuzzle({
    id: "p9-3",
    levelId: "level-9",
    puzzleType: "logic",
    order: 3,
    clue: "ثلاثٌ من هذه الظواهر تحدث في السماء بين النجوم والقمر، وواحدةٌ منها من الأرض — التقط الشاذ.",
    logicData: JSON.stringify({
      kind: "oddOne",
      items: ["الكسوف", "الخسوف", "نزول المطر", "المحاق"],
      correctIndex: 2,
    }),
    hint: "الشاذ يُسقى به الزرع ولا يُرصد بالمرصد.",
    explanation:
      "نزول المطر ظاهرة جوية أرضية، أما الكسوف والخسوف والمحاق فظواهر فلكية سماوية.",
    points: 65,
    hintCost: 15,
    category: "منطق واستنتاج",
  });

  await createPuzzle({
    id: "p9-4",
    levelId: "level-9",
    puzzleType: "logic",
    order: 4,
    clue: "أشهر التقويم الهجري تمضي في ولاءٍ لا يختلف — ثلاثةٌ متتاليةٌ ظهرت، فأيُّ شهرٍ يليها مباشرة؟",
    logicData: JSON.stringify({
      kind: "sequence",
      items: ["الربيع الأول", "الربيع الثاني", "جمادى الأولى"],
      options: ["جمادى الثانية", "رجب", "رمضان", "شعبان"],
      correctIndex: 0,
    }),
    hint: "التسمية تتكرر زوجاً زوجاً: ربيعان، ثم جmadāwān — فما بعد الأولى؟",
    explanation:
      "جمادى الثانية — تمضي الأشهر: الربيع الأول ثم الثاني ثم جمادى الأولى فالثانية، ثم رجب.",
    points: 60,
    hintCost: 15,
    category: "منطق واستنتاج",
  });

  await createPuzzle({
    id: "p9-5",
    levelId: "level-9",
    puzzleType: "crossword",
    order: 5,
    clue: "الشبكة الختامية: كلمتان تتقاطعان عند القاف — إحداهما سرُّ الشرف الإنساني والأخرى أداةُ أهل العلم — فاكتملهما ليكتمل التاج.",
    availableLetters: "ع|ق|ل|م|ر|ن",
    hint: "الأفقية ثلاثة أحرف يُكرَّم بها ابن آدم، والرأسية أربعة أقسم الله بها في فاتحة سورةٍ تحمل اسمها.",
    explanation:
      "العقل والقلم — بهما استحق الإنسان التكريم: عقلٌ يفكر، وقلمٌ يسجل، وهما شعار «ثقافتنا» كلها.",
    points: 120,
    hintCost: 15,
    category: "مفردات تراثية",
    cells: [
      { row: 0, col: 0, letter: "ع", number: 1 },
      { row: 0, col: 1, letter: "ق", number: 2 },
      { row: 0, col: 2, letter: "ل" },
      { row: 1, col: 1, letter: "ل" },
      { row: 2, col: 1, letter: "م" },
    ],
    words: [
      {
        number: 1,
        direction: "across",
        row: 0,
        col: 0,
        length: 3,
        answer: "عقل",
        clue: "النعمة التي شُرّف بها الإنسان، وبها عُبد الرحمن وعُصي الشيطان، وهو ميدان التكليف كله.",
      },
      {
        number: 2,
        direction: "down",
        row: 0,
        col: 1,
        length: 3,
        answer: "قلم",
        clue: "أداة أهل العلم، أقسم الله بها في مطلع سورةٍ تحمل اسمها، وبه قُيّدت العلوم وحُفظت.",
      },
    ],
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
  console.log(`\nالإجمالي: ${levels.length} مراحل و${totalPuzzles} لغزاً في القاعدة.`);
}

main()
  .catch((error) => {
    console.error("فشل البذر:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
