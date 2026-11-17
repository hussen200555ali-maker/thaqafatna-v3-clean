/**
 * سكربت بذر المرحلة الأولى — توحيد مصدر البيانات بالكامل
 * =========================================================
 * ينقل محتوى «بذور المعرفة» (demoLevel) من ملف الوهميات إلى
 * قاعدة بيانات لوحة الإدارة الحقيقية — فتصبح المراحل الثلاث
 * كلها تُقرأ من Prisma حصراً عبر /api/levels.
 *
 * تشغيل: bun run scripts/seed-level-1.ts
 */

import { db } from "../src/lib/db";

async function main() {
  console.log("بذر المرحلة الأولى — بذور المعرفة…");

  /* 0) الحماية من التكرار — سكربت قابل لإعادة التشغيل */
  const existing = await db.level.findUnique({ where: { id: "level-1" } });
  if (existing) {
    console.log("المرحلة الأولى موجودة مسبقاً — لا حاجة للبذر.");
    return;
  }

  /* 1) الفصل الأول */
  const chapter = await db.chapter.upsert({
    where: { id: "chapter-1" },
    update: {},
    create: {
      id: "chapter-1",
      title: "الفصل الأول — أصول المعرفة",
      order: 1,
    },
  });

  /* 2) صف المرحلة */
  await db.level.create({
    data: {
      id: "level-1",
      title: "بذور المعرفة",
      difficulty: "easy",
      timeLimit: 300,
      reward: 50,
      hintCost: 10,
      learningGoals: JSON.stringify([
        "التعرّف على أعلام الفكر العربي وأشهر مؤلفاتهم",
        "ترسيخ ثلاث مفردات تراثية أساسية في الذاكرة",
        "فهم مثلٍ عربيٍّ خالد ومعرفة سياقه ومعناه",
      ]),
      educationalDescription:
        "رحلة قصيرة عبر الكتب والأمثال والمفردات العربية — خمسة أسئلة متنوعة تختبر ذاكرتك الثقافية وتنمّي حسّك التراثي عبر أنماط لعب مختلفة.",
      chapterId: chapter.id,
      order: 1,
    },
  });

  /* 3) الألغاز الخمسة — بالحقول المسطّحة كما تخزّنها لوحة الإدارة */

  /* 3-أ) اختيار من متعدد */
  await db.puzzle.create({
    data: {
      id: "p1-1",
      levelId: "level-1",
      puzzleType: "multiple",
      order: 1,
      clue: "هو المؤرخ والعالم الذي وُلد في تونس عام ١٣٣٢م، وصنّف كتاب «المقدمة» الذي يُعدّ بحقٍّ أول مؤلَّف منهجي منظّم في علمي التاريخ والاجتماع، فمن هو؟",
      options:
        "ابن خلدون|ابن المقفّع|ابن سينا|أبو عثمان الجاحظ — صاحب «البيان والتبيين» الذي وُلد بالبصرة",
      correctOption: 0,
      hint: "قضى سنواته الأخيرة في القاهرة قاضياً للمذهب المالكي، ودُفن قرب باب النصر.",
      explanation:
        "عبد الرحمن بن خلدون (٧٣٢ - ٨٠٨هـ) — وضع في «المقدمة» أصول علم العمران البشري، وتُدرَّس أفكاره في جامعات العالم حتى اليوم.",
      points: 50,
      hintCost: 10,
      category: "أعلام ومؤلفات",
    },
  });

  /* 3-ب) حروف مبعثرة */
  await db.puzzle.create({
    data: {
      id: "p1-2",
      levelId: "level-1",
      puzzleType: "scrambled",
      order: 2,
      clue: "رتّب الحروف لتحصل على اسم الكتاب الشهير الذي وضع فيه ابن خلدون أصول علم الاجتماع، والذي ما زال يُدرَّس في جامعات العالم حتى اليوم.",
      text: "المقدمة",
      availableLetters: "ق|د|م|ا|ل|ة|م",
      hint: "تبدأ الكلمة بحرف التعريف «ال» وتنتهي بتاء مربوطة.",
      explanation:
        "«المقدمة» — أشهر مقدمات الكتب في التراث العربي الإسلامي، وأحد أهم كتب الفكر الإنساني.",
      points: 60,
      hintCost: 10,
      category: "مؤلفات",
    },
  });

  /* 3-ج) إكمال فراغات — JSON مقاطع + بنك خيارات */
  await db.puzzle.create({
    data: {
      id: "p1-3",
      levelId: "level-1",
      puzzleType: "fillblank",
      order: 3,
      clue: "أكمل الحكمة العربية الخالدة التي تضرب مثلاً لرسوخ ما يُتعلَّم في حداثة السنّ وثباته في العقل مهما طال الزمن.",
      fillBlanks: JSON.stringify([
        { kind: "text", text: "العلم في " },
        { kind: "blank", answer: "الصغر" },
        { kind: "text", text: " كالنقش على " },
        { kind: "blank", answer: "الحجر" },
      ]),
      options: "الكبر|الحجر|الورق|الصغر",
      hint: "الفراغ الأول مرحلة من العمر، والثاني مادة صلبة لا يمحوها الزمن.",
      explanation:
        "«العلم في الصغر كالنقش على الحجر» — من الحكم العربية الشائعة في قيمة التعلّم المبكر.",
      points: 50,
      hintCost: 10,
      category: "أمثال وحكم",
    },
  });

  /* 3-د) شبكة متقاطعة — العلاقتان Cell و Word */
  await db.puzzle.create({
    data: {
      id: "p1-4",
      levelId: "level-1",
      puzzleType: "crossword",
      order: 4,
      clue: "شبكة من قلب المكتبة العربية — ثلاث كلمات تتشابك عند حرفَي الكاف والتاء، فأكملها جميعاً.",
      availableLetters: "ت|ل|ر|ك|ة|ا|ث|ب|ي|ا|ل",
      hint: "ابدأ بالكلمة الأفقية الأولى: وعاء المعرفة الذي تجتمع فيه الصفحات.",
      explanation:
        "الكلمات هي: كتاب، كليلة، تراث — ثلاثية من قلب الثقافة العربية الكلاسيكية.",
      points: 100,
      hintCost: 15,
      category: "مفردات تراثية",
      cells: {
        create: [
          { row: 0, col: 0, letter: "ك", number: 1 },
          { row: 0, col: 1, letter: "ت", number: 2 },
          { row: 0, col: 2, letter: "ا" },
          { row: 0, col: 3, letter: "ب" },
          { row: 1, col: 0, letter: "ل" },
          { row: 1, col: 1, letter: "ر" },
          { row: 2, col: 0, letter: "ي" },
          { row: 2, col: 1, letter: "ا" },
          { row: 3, col: 0, letter: "ل" },
          { row: 3, col: 1, letter: "ث" },
          { row: 4, col: 0, letter: "ة" },
        ],
      },
      words: {
        create: [
          {
            number: 1,
            direction: "across",
            row: 0,
            col: 0,
            length: 4,
            answer: "كتاب",
            clue: "وعاء المعرفة عند الأمم؛ تجتمع فيه الصفحات وتُروى فيه العلوم من فقهٍ وشعرٍ وفلك، وهو جليسُ من لا جليس له.",
          },
          {
            number: 1,
            direction: "down",
            row: 0,
            col: 0,
            length: 5,
            answer: "كليلة",
            clue: "بطلان كتاب حكمٍ هنديّ الأصل نقله إلى العربية ابن المقفّع، يصوّران عالم الحيوان في حواراتٍ أخلاقية تُقرأ من جديد كلَّ يوم.",
          },
          {
            number: 2,
            direction: "down",
            row: 0,
            col: 1,
            length: 4,
            answer: "تراث",
            clue: "كل ما ورثناه عن الأسلاف من لغةٍ وأدبٍ وعادات وفنون، نحفظه ليبقى حاضرنا موصولاً بماضيه.",
          },
        ],
      },
    },
  });

  /* 3-هـ) سؤال نصي — كتابة حرة */
  await db.puzzle.create({
    data: {
      id: "p1-5",
      levelId: "level-1",
      puzzleType: "text",
      order: 5,
      clue: "ما اسم أطول نهرٍ في العالم، الذي شهد على ضفّاته قيام إحدى أقدم الحضارات الإنسانية وأعظمها، ويمرّ اليوم بأحد عشر دولة؟",
      text: "النيل",
      hint: "يمرّ بالقاهرة عاصمة مصر، وارتبط به اسمُ أهرامات الجيزة.",
      points: 40,
      hintCost: 10,
      category: "جغرافيا وحضارات",
    },
  });

  /* 4) تقرير التحقق */
  const count = await db.puzzle.count({ where: { levelId: "level-1" } });
  console.log(`تم البذر: المرحلة الأولى تحوي ${count} ألغاز (المتوقع 5).`);
  const total = await db.level.count();
  console.log(`إجمالي المراحل في القاعدة: ${total} (المتوقع 3).`);
}

main()
  .catch((error) => {
    console.error("فشل البذر:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
