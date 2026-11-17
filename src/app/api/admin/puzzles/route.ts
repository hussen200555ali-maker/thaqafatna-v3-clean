import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * إنشاء لغز جديد
 * ==================
 * POST /api/admin/puzzles
 *
 * جيل المحرر الأول يدعم الأنواع البسيطة الثلاثة:
 *   text (نصي) | multiple (اختيار من متعدد) | emoji (إيموجي)
 * بقية الأنواع المركّبة (الشبكات، الصوتيات…) تُدار من محرر
 * الجيل الثاني — حفاظاً على تكامل بياناتها العلائقية.
 *
 * الترتيب تلقائي: أعلى ترتيب في المرحلة + 1
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "جسم الطلب غير صالح" },
        { status: 400 },
      );
    }
    const input = body as Record<string, unknown>;

    const levelId = typeof input.levelId === "string" ? input.levelId : "";
    const puzzleType =
      typeof input.puzzleType === "string" ? input.puzzleType : "";
    const clue = typeof input.clue === "string" ? input.clue.trim() : "";

    if (!levelId) {
      return NextResponse.json(
        { ok: false, error: "معرّف المرحلة مطلوب" },
        { status: 400 },
      );
    }
    if (!["text", "multiple", "emoji"].includes(puzzleType)) {
      return NextResponse.json(
        {
          ok: false,
          error: "نوع اللغز يجب أن يكون نصياً أو اختياراً متعدداً أو إيموجي",
        },
        { status: 400 },
      );
    }
    if (!clue) {
      return NextResponse.json(
        { ok: false, error: "نص السؤال مطلوب" },
        { status: 400 },
      );
    }

    const level = await db.level.findUnique({
      where: { id: levelId },
      select: { id: true },
    });
    if (!level) {
      return NextResponse.json(
        { ok: false, error: "لا توجد مرحلة بهذا المعرّف" },
        { status: 404 },
      );
    }

    const data: Record<string, unknown> = {
      levelId,
      puzzleType,
      clue,
      points: 40,
      hintCost: 10,
    };
    if (typeof input.points === "number" && input.points > 0) {
      data.points = input.points;
    }
    if (typeof input.hintCost === "number" && input.hintCost > 0) {
      data.hintCost = input.hintCost;
    }
    if (typeof input.hint === "string" && input.hint.trim()) {
      data.hint = input.hint.trim();
    }
    if (typeof input.explanation === "string" && input.explanation.trim()) {
      data.explanation = input.explanation.trim();
    }
    if (typeof input.category === "string" && input.category.trim()) {
      data.category = input.category.trim();
    }

    if (puzzleType === "multiple") {
      const options =
        typeof input.options === "string" ? input.options.trim() : "";
      const correctOption = input.correctOption;
      if (!options || typeof correctOption !== "number") {
        return NextResponse.json(
          {
            ok: false,
            error: "الاختيار المتعدد يتطلب خيارات (مفصولة بـ |) وفهرس الإجابة",
          },
          { status: 400 },
        );
      }
      data.options = options;
      data.correctOption = correctOption;
    } else {
      /* text | emoji — الإجابة نصية إلزامية */
      const text = typeof input.text === "string" ? input.text.trim() : "";
      if (!text) {
        return NextResponse.json(
          { ok: false, error: "نص الإجابة مطلوب لهذا النوع" },
          { status: 400 },
        );
      }
      data.text = text;
      if (puzzleType === "emoji" && typeof input.emojis === "string" && input.emojis.trim()) {
        data.emojis = input.emojis.trim();
      }
    }

    /* الترتيب — بعد آخر لغز في المرحلة */
    const last = await db.puzzle.findFirst({
      where: { levelId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    data.order = (last?.order ?? 0) + 1;

    /* معرّف صريح — نموذج Puzzle بلا قيمة افتراضية في القاعدة */
    data.id = `pz-${crypto.randomUUID().slice(0, 8)}`;

    const puzzle = await db.puzzle.create({ data });
    return NextResponse.json({ ok: true, puzzle });
  } catch (error) {
    console.error("[api/admin/puzzles] تعذّر إنشاء اللغز:", error);
    return NextResponse.json(
      { ok: false, error: "تعذّر إنشاء اللغز" },
      { status: 500 },
    );
  }
}
