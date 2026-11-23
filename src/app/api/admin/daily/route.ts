import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDayKey, riyadhDayKey } from "@/lib/daily/date";
import { DAILY_TYPES } from "@/lib/daily/verification";

/**
 * إدارة تحدي اليوم — لوحة الإدارة
 * ==================================
 * GET  /api/admin/daily?date=YYYY-MM-DD
 *       بنك الأسئلة + جدول الأيام + المرشحون + آخر الجلسات.
 * POST /api/admin/daily  بإجراء one of:
 *       add | remove | toggle | set-schedule | clear-schedule
 *
 * كل عملية تكتب قيداً في سجل التدقيق الدائم (AuditEntry).
 * الأنواع المؤهلة: text و multiple فقط — كي لا تُرسل الإجابة للمتصفح.
 */

type Action = "add" | "remove" | "toggle" | "set-schedule" | "clear-schedule";
const ACTIONS: Action[] = [
  "add",
  "remove",
  "toggle",
  "set-schedule",
  "clear-schedule",
];

function eligibleType(type: string): boolean {
  const clean = type.trim().toLowerCase();
  return (DAILY_TYPES as readonly string[]).includes(clean);
}

function summaryOf(
  puzzle: { id: string; puzzleType: string; clue: string | null; text: string | null; level: { title: string } | null },
) {
  return {
    id: puzzle.id,
    puzzleType: puzzle.puzzleType,
    clue: puzzle.clue?.trim() || puzzle.text?.trim() || "سؤال بلا نص",
    levelTitle: puzzle.level?.title ?? "مستقل",
    eligible: eligibleType(puzzle.puzzleType),
  };
}

async function audit(action: string, detail: string) {
  await db.auditEntry.create({
    data: { action, entity: "تحدي اليوم", detail: detail.slice(0, 500) },
  });
}

export async function GET(request: Request) {
  try {
    const requested = new URL(request.url).searchParams.get("date");
    const dateKey = requested && isDayKey(requested) ? requested : riyadhDayKey();
    const today = riyadhDayKey();

    const [bank, schedule, candidates, sessions, bankCount, activeCount] =
      await Promise.all([
        db.dailyQuestion.findMany({
          orderBy: [{ addedAt: "asc" }, { id: "asc" }],
          include: { puzzle: { include: { level: { select: { title: true } } } } },
        }),
        db.dailySchedule.findMany({
          where: { dateKey: { gte: today } },
          orderBy: { dateKey: "asc" },
          take: 30,
          include: {
            puzzle: { include: { level: { select: { title: true } } } },
          },
        }),
        db.puzzle.findMany({
          where: {
            puzzleType: { in: [...DAILY_TYPES] },
            dailyBankItems: { none: {} },
          },
          orderBy: { id: "asc" },
          take: 200,
          include: { level: { select: { title: true } } },
        }),
        db.dailySession.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            deviceId: true,
            dateKey: true,
            status: true,
            attempts: true,
            reward: true,
            createdAt: true,
            completedAt: true,
          },
        }),
        db.dailyQuestion.count(),
        db.dailyQuestion.count({ where: { active: true } }),
      ]);

    return NextResponse.json(
      {
        ok: true,
        dateKey,
        today,
        stats: { bank: bankCount, active: activeCount },
        bank: bank.map((item) => ({
          ...summaryOf(item.puzzle),
          /* معرّف عنصر البنك يختلف عن معرّف اللغز — يأتي بعد النشر */
          id: item.id,
          puzzleId: item.puzzleId,
          active: item.active,
          addedAt: item.addedAt.toISOString(),
        })),
        schedule: schedule.map((item) => ({
          dateKey: item.dateKey,
          puzzleId: item.puzzleId,
          rewardOverride: item.rewardOverride,
          note: item.note,
          ...(item.puzzle
            ? summaryOf(item.puzzle)
            : { clue: null, levelTitle: null, eligible: true, puzzleType: null }),
        })),
        candidates: candidates.map(summaryOf),
        sessions: sessions.map((session) => ({
          ...session,
          createdAt: session.createdAt.toISOString(),
          completedAt: session.completedAt?.toISOString() ?? null,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/admin/daily] تعذّر جلب بيانات التحدي اليومي:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر جلب بيانات التحدي اليومي" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "جسم الطلب غير صالح" }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const action = input.action as Action;
    if (!ACTIONS.includes(action)) {
      return NextResponse.json({ ok: false, error: "إجراء غير معروف" }, { status: 400 });
    }

    if (action === "add") {
      const puzzleId = typeof input.puzzleId === "string" ? input.puzzleId.trim() : "";
      if (!puzzleId) {
        return NextResponse.json({ ok: false, error: "معرّف السؤال مطلوب" }, { status: 400 });
      }
      const puzzle = await db.puzzle.findUnique({
        where: { id: puzzleId },
        select: { puzzleType: true, clue: true, text: true },
      });
      if (!puzzle) {
        return NextResponse.json({ ok: false, error: "السؤال غير موجود" }, { status: 404 });
      }
      if (!eligibleType(puzzle.puzzleType)) {
        return NextResponse.json(
          { ok: false, error: "التحدي اليومي يدعم الأسئلة النصية واختيار متعدد فقط — الإجابة لا تُرسل للمتصفح" },
          { status: 400 },
        );
      }
      await db.dailyQuestion.upsert({
        where: { puzzleId },
        create: { puzzleId, active: true },
        update: { active: true },
      });
      await audit("إنشاء", `إضافة سؤال إلى بنك التحدي اليومي: ${puzzleId}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "remove" || action === "toggle") {
      const bankId = typeof input.bankId === "string" ? input.bankId.trim() : "";
      if (!bankId) {
        return NextResponse.json({ ok: false, error: "معرّف عنصر البنك مطلوب" }, { status: 400 });
      }
      const item = await db.dailyQuestion.findUnique({ where: { id: bankId } });
      if (!item) {
        return NextResponse.json({ ok: false, error: "عنصر البنك غير موجود" }, { status: 404 });
      }
      if (action === "remove") {
        await db.dailyQuestion.delete({ where: { id: bankId } });
        await audit("حذف", `إزالة سؤال من بنك التحدي اليومي: ${item.puzzleId}`);
      } else {
        await db.dailyQuestion.update({
          where: { id: bankId },
          data: { active: !item.active },
        });
        await audit(
          "تعديل",
          `${item.active ? "إيقاف" : "تفعيل"} سؤال في بنك التحدي اليومي: ${item.puzzleId}`,
        );
      }
      return NextResponse.json({ ok: true });
    }

    const dateKey = input.dateKey;
    if (!isDayKey(dateKey)) {
      return NextResponse.json(
        { ok: false, error: "التاريخ يجب أن يكون بصيغة YYYY-MM-DD بتوقيت الرياض" },
        { status: 400 },
      );
    }

    if (action === "clear-schedule") {
      await db.dailySchedule.deleteMany({ where: { dateKey } });
      await audit("حذف", `إزالة تثبيت سؤال يوم ${dateKey}`);
      return NextResponse.json({ ok: true });
    }

    /* set-schedule — تثبيت سؤال لليوم مع مكافأة وملاحظة اختياريتين */
    let puzzleId: string | null = null;
    if (input.puzzleId !== null && input.puzzleId !== undefined && input.puzzleId !== "") {
      if (typeof input.puzzleId !== "string") {
        return NextResponse.json({ ok: false, error: "معرّف السؤال غير صالح" }, { status: 400 });
      }
      puzzleId = input.puzzleId.trim();
      const puzzle = await db.puzzle.findUnique({
        where: { id: puzzleId },
        select: { puzzleType: true },
      });
      if (!puzzle) {
        return NextResponse.json({ ok: false, error: "السؤال غير موجود" }, { status: 404 });
      }
      if (!eligibleType(puzzle.puzzleType)) {
        return NextResponse.json(
          { ok: false, error: "هذا النوع لا يصلح للتحدي اليومي" },
          { status: 400 },
        );
      }
    }

    let rewardOverride: number | null = null;
    if (input.rewardOverride !== null && input.rewardOverride !== undefined && input.rewardOverride !== "") {
      const parsed = Number(input.rewardOverride);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 500) {
        return NextResponse.json(
          { ok: false, error: "المكافأة يجب أن تكون عدداً صحيحاً بين ١ و ٥٠٠" },
          { status: 400 },
        );
      }
      rewardOverride = parsed;
    }

    const note = typeof input.note === "string" ? input.note.trim().slice(0, 240) || null : null;
    await db.dailySchedule.upsert({
      where: { dateKey },
      create: { dateKey, puzzleId, rewardOverride, note },
      update: { puzzleId, rewardOverride, note },
    });
    await audit(
      "تعديل",
      `تثبيت تحدي يوم ${dateKey}: ${puzzleId ?? "اختيار تلقائي"}${rewardOverride ? ` — ${rewardOverride} عملة` : ""}`,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/daily] تعذّر تنفيذ العملية:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر تنفيذ العملية" },
      { status: 500 },
    );
  }
}
