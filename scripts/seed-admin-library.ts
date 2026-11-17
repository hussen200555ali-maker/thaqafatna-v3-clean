/**
 * سكربت بذر مكتبة لوحة الإدارة — كتب «ثقافتنا» التراثية
 * =====================================================
 * يملأ فهرس المكتبة الموحّد ببيانات أولية: ٤ تصنيفات و٦ كتب
 * و٨ فصول كتب — فتجد مسارات /api/admin/books جاهزةً للعمل
 * منذ أول تشغيل دون إدخال يدوي.
 *
 * قابل لإعادة التشغيل (Idempotent): إن وُجد كتاب «مقدمة ابن خلدون»
 * فالبذور موجودة مسبقاً ويخرج السكربت دون تكرار أي سجل.
 *
 * تشغيل: bun run scripts/seed-admin-library.ts
 */

import { db } from "../src/lib/db";

async function main() {
  console.log("بذر مكتبة لوحة الإدارة — كتب «ثقافتنا»…");

  /* 0) الحماية من التكرار — البذور موجودة فلا شيء يُفعل */
  const existing = await db.book.findFirst({
    where: { title: "مقدمة ابن خلدون" },
    select: { id: true },
  });
  if (existing) {
    console.log("البذور موجودة مسبقاً — مكتبة لوحة الإدارة مهيأة، لا حاجة للتكرار.");
    return;
  }

  /* 1) التصنيفات الأربعة — مرتبة كما تظهر في المكتبة */
  const catClassic = await db.bookCategory.create({
    data: { title: "الأدب الكلاسيكي", icon: "feather", order: 1 },
  });
  const catThought = await db.bookCategory.create({
    data: { title: "الفكر والفلسفة", icon: "brain", order: 2 },
  });
  await db.bookCategory.create({
    data: { title: "التاريخ والحضارات", icon: "landmark", order: 3 },
  });
  const catLanguage = await db.bookCategory.create({
    data: { title: "علوم اللغة", icon: "languages", order: 4 },
  });

  /* 2) الكتب الستة — الخامس مسودّة والبقية منشورة */
  const bookMuqaddima = await db.book.create({
    data: {
      title: "مقدمة ابن خلدون",
      author: "عبد الرحمن بن خلدون",
      description:
        "أعظم مؤلف في فلسفة التاريخ وعلم العمران البشري، وضع فيه ابن خلدون أسس الاجتماع الحديث",
      status: "published",
      categoryId: catThought.id,
      order: 1,
    },
  });

  const bookKalila = await db.book.create({
    data: {
      title: "كليلة ودمنة",
      author: "عبد الله ابن المقفّع",
      description:
        "رموز حكيمة ترجمها ابن المقفّع عن الهندية، صارت مدرسة في فن الحكاية العربي",
      status: "published",
      categoryId: catClassic.id,
      order: 2,
    },
  });

  await db.book.create({
    data: {
      title: "البيان والتبيين",
      author: "أبو عثمان الجاحظ",
      description: "موسوعة الجاحظ في البلاغة والبيان وعجائب الكلام",
      status: "published",
      categoryId: catClassic.id,
      order: 3,
    },
  });

  await db.book.create({
    data: {
      title: "رسالة الغفران",
      author: "أبو العلاء المعري",
      description: "رحلة خيالية إلى العالم الآخر يجتمع فيها شعراء العربية وفلاسفتها",
      status: "published",
      categoryId: catClassic.id,
      order: 4,
    },
  });

  await db.book.create({
    data: {
      title: "مقامات الحريري",
      author: "محمد القاسم الحريري",
      description: "خمسون مقامة بديعية في الزخرفة اللفظية وسجع المنفرد",
      status: "draft",
      categoryId: catClassic.id,
      order: 5,
    },
  });

  const bookFiqh = await db.book.create({
    data: {
      title: "فقه اللغة",
      author: "أبو منصور الثعالبي",
      description: "أقدم موسوعة عربية في الألفاظ والتراكيب وفروق المعاني",
      status: "published",
      categoryId: catLanguage.id,
      order: 6,
    },
  });

  /* 3) فصول الكتب الثمانية */
  await db.bookChapter.createMany({
    data: [
      /* لمقدمة ابن خلدون (٣) */
      { bookId: bookMuqaddima.id, title: "المقدمة الأولى في تمهيد الكلام", order: 1 },
      { bookId: bookMuqaddima.id, title: "في طبائع العمران البدوي", order: 2 },
      { bookId: bookMuqaddima.id, title: "في الدول والملك والخلافة", order: 3 },
      /* لكليلة ودمنة (٣) */
      { bookId: bookKalila.id, title: "باب الأسد والثور", order: 1 },
      { bookId: bookKalila.id, title: "باب الفحص عن أمر نايلا", order: 2 },
      { bookId: bookKalila.id, title: "باب الناسك وابن عرس", order: 3 },
      /* لفقه اللغة (٢) */
      { bookId: bookFiqh.id, title: "ما جاء في الفرق بين الألفاظ", order: 1 },
      { bookId: bookFiqh.id, title: "المدخل إلى فقه اللغة", order: 2 },
    ],
  });

  /* 4) تقرير التحقق */
  const books = await db.book.count();
  const categories = await db.bookCategory.count();
  const chapters = await db.bookChapter.count();
  console.log(
    `تم البذر: ${categories} تصنيفات (المتوقع 4)، ${books} كتب (المتوقع 6)، ${chapters} فصول كتب (المتوقع 8).`,
  );
}

main()
  .catch((error) => {
    console.error("فشل البذر:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
