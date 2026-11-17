#!/usr/bin/env node
/**
 * البذر الشامل لقاعدة بيانات «ثقافتنا» — نقطة الدخول الموحدة
 * ==========================================================
 * يشغّل سلسلة سكربتات البذر التسعة بالترتيب التاريخي الصحيح،
 * ولا يعمل إلا إذا كانت قاعدة البيانات فارغة — حمايةً لبيانات
 * الإنتاج من أي إعادة بذر تلقائية عند كل نشر:
 *
 *   1. prisma/seed.ts                  — الفصلان الثاني والثالث (الأساس)
 *   2. scripts/seed-level-1.ts         — الفصل الأول والمرحلة ١
 *   3. scripts/seed-expansion.ts       — التوسعة الكبرى: ٩ مراحل في ٣ فصول
 *   4. scripts/seed-admin-library.ts   — فهرس المكتبة (تصنيفات وكتب)
 *   5. scripts/seed-library-content.ts — نصوص فصول الكتب والمراجعات
 *   6. scripts/seed-community.ts       — لاعبون ورسائل وفريق وإعدادات
 *   7. scripts/seed-wave2.ts           — الموجة الثانية: ١٨ مرحلة في ٦ فصول
 *   8. scripts/seed-library-wave2.ts   — ٤ كتب جديدة بفصول قراءة كاملة
 *   9. scripts/seed-final-touches.ts   — إكمال فصول الكتابين + لاعبون
 *
 * التشغيل: npm run db:seed
 * يعمل بأول وقت تشغيل متاح: Bun إن وُجد، وإلا npx tsx.
 */

import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FULL_CHAIN = [
  "prisma/seed.ts",
  "scripts/seed-level-1.ts",
  "scripts/seed-expansion.ts",
  "scripts/seed-admin-library.ts",
  "scripts/seed-library-content.ts",
  "scripts/seed-community.ts",
  "scripts/seed-wave2.ts",
  "scripts/seed-library-wave2.ts",
  "scripts/seed-final-touches.ts",
];

/** يشغّل سكربت TypeScript بأول وقت تشغيل متاح: bun ثم npx tsx */
function runScript(script) {
  console.log(`\n━━━━━━━━━━ ${script} ━━━━━━━━━━`);
  const attempts = [
    { cmd: "bun", args: [script] },
    { cmd: "npx", args: ["tsx", script] },
  ];
  for (const { cmd, args } of attempts) {
    const result = spawnSync(cmd, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (!result.error && result.status === 0) return true;
    // إما أن وقت التشغيل غير مثبّت (ENOENT) أو فشل السكربت — نجرب التالي
  }
  console.error(`✗ تعذّر تشغيل ${script} — ثبّت Bun أو نفّذ npm install (يتضمن tsx)`);
  return false;
}

async function main() {
  let levelCount;
  try {
    levelCount = await prisma.level.count();
  } catch {
    console.error(
      "✗ تعذّر الاتصال بقاعدة البيانات أو الجداول غير مهيأة بعد.\n" +
        "  تأكد من متغيري DATABASE_URL و DIRECT_URL ثم شغّل أولاً:\n" +
        "  npm run db:deploy   (أو: npx prisma db push)"
    );
    process.exit(1);
  }

  if (levelCount > 0) {
    console.log(
      `⏭  قاعدة البيانات مهيأة مسبقاً (${levelCount} مرحلة) — تخطّي البذر حفاظاً على بيانات الإنتاج.`
    );
    return;
  }

  console.log("🌱 قاعدة بيانات فارغة — بدء سلسلة البذر الكاملة (٩ سكربتات بالترتيب التاريخي)…");
  for (const script of FULL_CHAIN) {
    const ok = runScript(script);
    if (!ok) {
      console.error(`✗ فشل السكربت: ${script} — أُوقفت السلسلة.`);
      process.exit(1);
    }
  }

  const [levels, puzzles, books, bookChapters, players] = await Promise.all([
    prisma.level.count(),
    prisma.puzzle.count(),
    prisma.book.count(),
    prisma.bookChapter.count(),
    prisma.playerProfile.count(),
  ]);
  console.log(
    `\n✅ اكتمل البذر الشامل: ${levels} مرحلة | ${puzzles} لغزاً | ${books} كتباً | ${bookChapters} فصل كتاب | ${players} لاعباً`
  );
}

main()
  .catch((error) => {
    console.error("فشل البذر الشامل:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
