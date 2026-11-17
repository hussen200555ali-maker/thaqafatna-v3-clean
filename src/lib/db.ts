import { PrismaClient } from '@prisma/client'

/**
 * توافق Supabase Pooler مع Prisma في زمن التشغيل:
 * ‏Transaction Pooler (المنفذ 6543) لا يدعم الجُمل المُهيّأة (prepared
 * statements) عبر الاتصالات المشتركة، ويطلب Prisma عندها المعامل
 * pgbouncer=true لتعطيلها، وإلا ظهر خطأ PostgreSQL 42P05 «prepared
 * statement already exists» أثناء عمل الموقع. نضيف المعامل تلقائياً
 * عند نقصه حتى لا يتعطل التطبيق بسبب متغير بيئة ناقص — ولا أي تأثير
 * لهذا التعديل عند استخدام أي إعداد سليم آخر.
 */
const runtimeUrl = process.env.DATABASE_URL ?? ''
if (
  runtimeUrl.includes('pooler.supabase.com:6543') &&
  !/[?&]pgbouncer=/.test(runtimeUrl)
) {
  process.env.DATABASE_URL = `${runtimeUrl}${runtimeUrl.includes('?') ? '&' : '?'}pgbouncer=true`
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db