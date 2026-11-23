# خطة التعافي والتراجع — ثقافتنا v3

> أُنشئت قبل أي تعديل. الهدف: أي خطأ يمكن إلغاؤه بأمر واحد دون لمس قاعدة الإنتاج.

## 1) نقطة التعافي (Baseline)

| العنصر | القيمة |
|---|---|
| المستودع | `hussen200555ali-maker/thaqafatna-v3-clean` |
| الفرع المنشور | `main` |
| Commit قبل التعديل | `6fadea72a2ac710fb2d4216853cee8168b3f453f` |
| فرع النسخ الاحتياطي على GitHub | `backup/pre-fix-20261123` |
| تاريخ إنشاء Points | 2026-11-23 |

الفرع الاحتياطي مدفوع على.origin ويشير إلى نفس الـ commit، أي أنه نسخة طبق الأصل من الموقع الحالي قبل التدخل.

## 2) قواعد التعديل الآمنة

1. كل مرحلة تُطبَّق في **commit مستقل** برسالة تبدأ بـ `fix:` أو `feat:`.
2. لا تُعدَّل قاعدة البيانات في المراحل أ/ب/ج — لذلك **لا يوجد تراجع قاعدة بيانات** لتلك المراحل.
3. المرحلة د تضيف **جداول جديدة فقط** (`DailyQuestion`, `DailySchedule`, `DailySession`, `DailyAttempt`, `RewardLedger`) بلا تعديل أو حذف أي بيانات قائمة.
4. لا تُفعَّل المصادقة قبل التأكد من عمل كل الوظائف (قرار المستخدم) — أُنجزت في المرحلة ج.
5. الدفع يتم إلى `main` فقط بعد نجاح: `lint` + `typecheck` + `next build` + فحص HTML الخادم.

## 3) سيناريوهات التراجع

### أ) خطأ في commit واحد (الأكثر شيوعًا)

```powershell
git -C <المجلد> revert <SHA_الcommit_المخطئ>
git -C <المجلد> push origin main
```

### ب) الرجوع الكامل إلى ما قبل التدخل

```powershell
git -C <المجلد> checkout main
git -C <المجلد> reset --hard origin/backup/pre-fix-20261123
git -C <المجلد> push --force-with-lease origin main
```

> `--force-with-lease` يمنع الكتابة فوق عمل أي شخص آخر بالخطأ.

### ج) الرجوع عبر Vercel بدون git

Vercel Dashboard → Deployments → اختر نشرًا ناجحًا قديمًا → **⋯ → Promote to Production**.
هذا يعيد الموقع فورًا حتى لو تعذّر الدفع.

### د) تراجع ترحيل المرحلة د (جداول التحدي اليومي فقط)

الترحيل `prisma/migrations/20261123000000_daily_challenge` ينشئ خمسة جداول جديدة
ولا يلمس `Level` أو `Puzzle` أو أي جدول قائم سوى إضافة علاقات عكسية في مخطط Prisma
(لا أعمدة جديدة في قاعدة البيانات). خطوات التراجع اليدوي إن لزم:

```sql
DROP TABLE IF EXISTS "RewardLedger";
DROP TABLE IF EXISTS "DailyAttempt";
DROP TABLE IF EXISTS "DailySession";
DROP TABLE IF EXISTS "DailySchedule";
DROP TABLE IF EXISTS "DailyQuestion";
-- ثم حذف سجل الترحيل من _prisma_migrations لضمان إمكانية إعادة تطبيقه:
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261123000000_daily_challenge';
```

> الأفضل أولاً: `git revert` لcommit المرحلة د ثم إعادة نشر Vercel — التطبيق القديم
> لا يستعلام الجداول الجديدة، فتبقى البيانات محفوظة بلا ضرر. لا تُطبَّق أوامر DROP
> إلا إذا أردت تنظيف قاعدة البيانات فعلياً، ومع نسخة احتياطية حديثة (القسم 7 في README).

### هـ) فشل البناء بعد تفعيل `typecheck`

أعد القيمة السابقة مؤقتًا في `next.config.ts`:

```ts
typescript: { ignoreBuildErrors: true }
```

ثم ادفع كـ hotfix، وأصلح أخطاء الأنواع في commit لاحق.

## 4) قائمة التحقق بعد كل دفعة

- [ ] `bun run lint` بلا أخطاء جديدة.
- [ ] `bunx tsc --noEmit` بلا أخطاء (بعد تفعيله).
- [ ] `curl https://thaqafatna-v3.vercel.app` لا يحتوي نص التاريخ العربي في HTML الخادم.
- [ ] فتح الموقع في متصفح حقيقي: console بلا `React error #418`.
- [ ] التاريخ يظهر بعد التركيب بتوقيت الرياض، ويتجدد عند منتصف الليل.
- [ ] المراحل/المكتبة/الإدارة تعمل كما كانت.
- [ ] `GET /api/admin/session` يعيد `configured:true` بعد إضافة متغيرات الإدارة في Vercel.
- [ ] `GET /api/daily-challenge?deviceId=...` يعيد سؤالًا واحدًا بلا إجابة ولا `correctIndex` صحيح.
- [ ] `POST /api/daily-challenge/answer` يرفض رمزًا مزيفًا بـ `401` ويحكم على الصحيح سيرفريًا.

## 5) قيود معروفة

- لا يوجد ملف `.env` محليًا؛ `DATABASE_URL` / `DIRECT_URL` متاحان في Vercel فقط.
  لذلك يُكتفى محليًا بفحص التجميع + اختبارات الوحدات النقية + فحص HTML/console،
  والتحقق النهائي على النسخة المنشورة.
- متغيرات الإدارة (`ADMIN_PASSWORD` أساسًا) تُضاف يدويًا في Vercel من قِبل المستخدم؛
  قبلها تُقفل لوحة الإدارة بالكامل بسلوك Fail-Closed (هذا متعمّد وآمن).
- بنك التحدي اليومي يقتصر على `text` و `multiple` فقط — باقي الأنواع لا تُرسل لأنها
  قد تكشف الإجابة داخل نسخة المتصفح.

## 6) سجل التنفيذ

| المرحلة | الحالة | Commit |
|---|---|---|
| نسخة التعافي | ✅ مدفوعة | `backup/pre-fix-20261123` |
| أ — إصلاح 418 وتفعيل الفحص | ✅ مدفوعة | `7f6995c28756d9704a894b38e56522ffdc778fb1` |
| ب — التحقق المتصفحي | ✅ تم | HTML خالٍ من التاريخ + لا أخطاء #418 |
| ج — المصادقة | ✅ مدفوعة | `63e13ce27c281bcbecdb0258be8c85e35a026a1a` |
| د — التحدي اليومي | ✅ مدفوعة | `61184b6` |

### ملاحظات تنفيذ المرحلة ج
- حماية `/api/admin/:path*` عبر `src/proxy.ts`؛ المسارات العامة: login/session/logout.
- الجلسة كوكي `thaqafatna_admin` موقّع HMAC، `httpOnly`، `SameSite=Lax`، `Secure` في الإنتاج، ٨ ساعات.
- **Fail-closed:** بدون `ADMIN_PASSWORD` تُرفض كل طلبات الإدارة وتُعرض رسالة واضحة في نافذة الدخول.
- تحقق محلي في المتصفح: قبل الدخول `401`، بعد الدخول نافذة الإدارة تفتح والطلبات لا تعيد `401`
  (أعادت `500` فقط لأن قاعدة البيانات المحلية غير متوفرة — لا علاقة بالمصادقة).
- **مطلوب قبل النشر:** إضافة `ADMIN_PASSWORD` و`ADMIN_USERNAME` و`ADMIN_SESSION_SECRET`
  في Vercel (Production). بدونها سيُقفل الموقع الإداري بالكامل.

### ملاحظات تنفيذ المرحلة د
- خمسة جداول جديدة فقط (`DailyQuestion`, `DailySchedule`, `DailySession`, `DailyAttempt`, `RewardLedger`)
  بلا تعديل بيانات قائمة — الترحيل `20261123000000_daily_challenge` آمن للتطبيق على الإنتاج.
- بنك اليوم يقتصر على `text` و `multiple`: النسخة العامة تُفرغ `answer` وتجعل `correctIndex = -1`.
- جلسة موقّعة HMAC + تجزئة SHA-256، مرتبطة بالجهاز/التاريخ/السؤال، ١٢ ساعة و٥ محاولات.
- `dailySession.upsert` بمفتاح `(deviceId,dateKey)` + `RewardLedger.createMany(skipDuplicates)`
  يمنعان منح المكافأة مرتين في الطلبات المتزامنة.
- `GET /api/daily-challenge?deviceId=...` يبدأ الجلسة، `POST /api/daily-challenge/answer` هو الحَكَم الوحيد.
- `GET/POST /api/admin/daily` تدير البنك والجدول والجلسات مع قيد تدقيق لكل عملية.
- صفحة إدارة جديدة «تحدي اليوم» — أصلحت النص العربي في رسالة البنك الفارغ.
- فحوص ناجحة: `prisma generate` + `typecheck` + `lint` + `next build` + اختبار وحدات نقية (18 فحص، ALL_PASS).
- **مطلوب من المستخدم:** إضافة `ADMIN_PASSWORD` في Vercel ثم فحص `/api/admin/session` وصفحة «تحدي اليوم».
