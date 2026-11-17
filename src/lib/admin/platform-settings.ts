/**
 * إعدادات المنصة (Platform Settings)
 * =====================================
 * المصدر الموحّد لمفاتيح نظام «ثقافتنا»: اسم التطبيق، مكافأة التحدي
 * اليومي، العملات الابتدائية، تكلفة التلميح، ووضع الصيانة.
 *
 * فلسفة التخزين: القيم تُخزَّن «نصية» في جدول PlatformSetting
 * (مفتاح/قيمة) وتُحوَّل عند القراءة إلى أنواعها الطبيعية — مع
 * الرجوع دائماً للعقد الافتراضي DEFAULT_SETTINGS عند أي نقص أو
 * تلف، فلا يتعطّل أي مسار ولو كان الجدول فارغاً تماماً.
 */

import { db } from "@/lib/db";

/** شكل إعدادات المنصة كما تستهلكها المسارات والواجهات */
export interface PlatformSettings {
  appName: string;
  dailyChallengeReward: number;
  startingCoins: number;
  defaultHintCost: number;
  maintenanceMode: boolean;
}

/** العقد الافتراضي — المرجع الثابت في كل المسارات عند غياب التخزين */
export const DEFAULT_SETTINGS: PlatformSettings = {
  appName: "ثقافتنا",
  dailyChallengeReward: 50,
  startingCoins: 120,
  defaultHintCost: 15,
  maintenanceMode: false,
};

/** قراءة رقم مخزَّن نصياً مع الرجوع للقيمة الافتراضية عند الفشل */
function readNumber(
  map: Map<string, string>,
  key: keyof PlatformSettings,
): number {
  const raw = map.get(key);
  if (raw === undefined) return DEFAULT_SETTINGS[key] as number;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : (DEFAULT_SETTINGS[key] as number);
}

/** قراءة الإعدادات كاملة من القاعدة — مع fallback للعقد الافتراضي */
export async function readPlatformSettings(): Promise<PlatformSettings> {
  try {
    const rows = await db.platformSetting.findMany();
    const map = new Map(rows.map((row) => [row.key, row.value]));
    const appName = (map.get("appName") ?? "").trim();

    return {
      appName: appName.length > 0 ? appName : DEFAULT_SETTINGS.appName,
      dailyChallengeReward: readNumber(map, "dailyChallengeReward"),
      startingCoins: readNumber(map, "startingCoins"),
      defaultHintCost: readNumber(map, "defaultHintCost"),
      maintenanceMode: map.get("maintenanceMode") === "true",
    };
  } catch (error) {
    /* جدول فارغ أو غير مهيأ — لا نُسقط المسارات المستهلكة أبداً */
    console.error(
      "[platform-settings] تعذّرت قراءة الإعدادات — استُخدم العقد الافتراضي:",
      error,
    );
    return { ...DEFAULT_SETTINGS };
  }
}

/** كتابة الإعدادات — upsert لكل مفتاح وُجد في المُدخل فقط */
export async function writePlatformSettings(
  input: Partial<PlatformSettings>,
): Promise<void> {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return;

  /* معاملة متسلسلة — أأمن لتوالي كتابات SQLite */
  await db.$transaction(
    entries.map(([key, value]) =>
      db.platformSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      }),
    ),
  );
}
