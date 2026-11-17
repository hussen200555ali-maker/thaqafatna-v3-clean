/**
 * سكربت بذر بيانات المجتمع — «ثقافتنا»
 * =========================================
 * يملأ نماذج المجتمع والنظام ببيانات أولية: ٧ لاعبين لصدراة واقعية،
 * ٤ رسائل دعم متنوعة الحالات، ٣ أعضاء فريق، والإعدادات الافتراضية —
 * فتجد مسارات اللاعبين والرسائل والفريق والإعدادات جاهزةً للعمل
 * منذ أول تشغيل دون إدخال يدوي.
 *
 * قابل لإعادة التشغيل (Idempotent): إن وُجد لاعب «demo-1» فالبذور
 * موجودة مسبقاً ويخرج السكربت دون تكرار أي سجل.
 *
 * تشغيل: bun run scripts/seed-community.ts
 */

import { db } from "../src/lib/db";

/** تاريخ قبل عدد أيام — لتوزيع آخر نشاط اللاعبين */
function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log("بذر بيانات المجتمع — لاعبون ورسائل وفريق وإعدادات…");

  /* 0) الحماية من التكرار — البذور موجودة فلا شيء يُفعل */
  const existing = await db.playerProfile.findUnique({
    where: { deviceId: "demo-1" },
    select: { id: true },
  });
  if (existing) {
    console.log("البذور موجودة مسبقاً — بيانات المجتمع مهيأة، لا حاجة للتكرار.");
    return;
  }

  /* 1) اللاعبون السبعة — لوحة صدارة واقعية بأنشطة موزعة على آخر أيام */
  await db.playerProfile.createMany({
    data: [
      {
        deviceId: "demo-1",
        name: "صقر الجزيرة",
        points: 2140,
        stars: 24,
        levelsCompleted: 9,
        badgesCount: 6,
        coins: 480,
        lastActiveAt: daysAgo(0),
      },
      {
        deviceId: "demo-2",
        name: "ابن بطوطة",
        points: 1865,
        stars: 21,
        levelsCompleted: 8,
        badgesCount: 5,
        coins: 410,
        lastActiveAt: daysAgo(1),
      },
      {
        deviceId: "demo-3",
        name: "شهرزاد",
        points: 1590,
        stars: 19,
        levelsCompleted: 8,
        badgesCount: 4,
        coins: 365,
        lastActiveAt: daysAgo(2),
      },
      {
        deviceId: "demo-4",
        name: "زرياب الأندلس",
        points: 1235,
        stars: 16,
        levelsCompleted: 7,
        badgesCount: 4,
        coins: 290,
        lastActiveAt: daysAgo(3),
      },
      {
        deviceId: "demo-5",
        name: "الجاحظ",
        points: 975,
        stars: 13,
        levelsCompleted: 6,
        badgesCount: 3,
        coins: 240,
        lastActiveAt: daysAgo(4),
      },
      {
        deviceId: "demo-6",
        name: "عنترة",
        points: 640,
        stars: 9,
        levelsCompleted: 4,
        badgesCount: 2,
        coins: 180,
        lastActiveAt: daysAgo(5),
      },
      {
        deviceId: "demo-7",
        name: "الخنساء",
        points: 385,
        stars: 6,
        levelsCompleted: 3,
        badgesCount: 1,
        coins: 150,
        lastActiveAt: daysAgo(6),
      },
    ],
  });
  console.log("تم بذر ٧ لاعبين (demo-1 حتى demo-7) موزعين على آخر أيام.");

  /* 2) رسائل الدعم الأربع — أنواع وحالات متنوعة لواقعية صندوق الوارد */
  await db.supportMessage.createMany({
    data: [
      {
        senderName: "ريم الحربية",
        kind: "bug",
        subject: "انقطاع الصوت في لغز الإنشاد",
        body: "عند تشغيل اللغز الصوتي في مرحلة الموشحات ينقطع الصوت بعد ثانيتين على متصفحي، ولا يعود إلا بعد إعادة تحميل الصفحة.",
        status: "new",
        deviceId: "demo-3",
      },
      {
        senderName: "فهد العتيبي",
        kind: "suggestion",
        subject: "اقتراح ألغاز عن الأمثال العربية",
        body: "أقترح إضافة ألغاز عن الأمثال الشعبية العربية مع شرح معناها وأصلها بعد الإجابة — ستكون إضافة جميلة لفروع المكتبة.",
        status: "new",
        deviceId: "demo-5",
      },
      {
        senderName: "ليان القحطاني",
        kind: "request",
        subject: "طلب إضافة كتاب الأغاني",
        body: "أرجو إضافة كتاب الأغاني لأبي الفرج الأصفهاني إلى قسم الأدب الكلاسيكي، مع فصول مختارة عن مشاهير المغنّين في العصر العباسي.",
        status: "read",
        reply: "شكراً لاقتراحك — أضفنا الكتاب لقائمة التحرير",
        deviceId: "demo-2",
      },
      {
        senderName: "عبدالله الشمري",
        kind: "other",
        subject: "شكر وتقدير للفريق",
        body: "أشكركم على هذه المنصة الرائعة، ابني أصبح يسأل عن الشعراء والأدباء كل يوم بسبب ألغازكم. بارك الله في جهودكم.",
        status: "archived",
        deviceId: "demo-6",
      },
    ],
  });
  console.log("تم بذر ٤ رسائل دعم (٢ جديدة، ١ مقروءة بردّ، ١ مؤرشفة).");

  /* 3) أعضاء الفريق الثلاثة — الأدوار الثلاثة كاملة */
  await db.teamMember.createMany({
    data: [
      { name: "مدير المنصة", email: "admin@thaqafatna.app", role: "admin", active: true },
      { name: "أمين المكتبة", email: "editor@thaqafatna.app", role: "editor", active: true },
      { name: "مراقب الجودة", email: "viewer@thaqafatna.app", role: "viewer", active: true },
    ],
  });
  console.log("تم بذر ٣ أعضاء فريق (مدير المنصة وأمين المكتبة ومراقب الجودة).");

  /* 4) الإعدادات الافتراضية الخمسة — upsert (مرآة DEFAULT_SETTINGS) */
  const defaults = [
    { key: "appName", value: "ثقافتنا" },
    { key: "dailyChallengeReward", value: "50" },
    { key: "startingCoins", value: "120" },
    { key: "defaultHintCost", value: "15" },
    { key: "maintenanceMode", value: "false" },
  ];
  for (const setting of defaults) {
    await db.platformSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log("تم تجهيز الإعدادات الافتراضية الخمسة (upsert).");

  /* 5) تقرير التحقق */
  const players = await db.playerProfile.count();
  const messages = await db.supportMessage.count();
  const team = await db.teamMember.count();
  const settingsCount = await db.platformSetting.count();
  console.log(
    `تم البذر: ${players} لاعبين (المتوقع 7)، ${messages} رسائل (المتوقع 4)، ${team} أعضاء فريق (المتوقع 3)، ${settingsCount} إعدادات (المتوقع 5).`,
  );
}

main()
  .catch((error) => {
    console.error("فشل البذر:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
