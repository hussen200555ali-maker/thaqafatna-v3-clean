/**
 * خدمة تحدي اليوم — سؤال واحد يوميًا، جلسة موقّعة، ومكافأة تُمنح مرة واحدة.
 *
 * القواعد:
 *  • مفتاح اليوم ثابت بتوقيت الرياض — لا يعتمد على متصفح اللاعب.
 *  • السؤال يُختار من بانك الإدارة، أو يُثبّت صراحةً في جدول اليوم.
 *  • الإجابة الصحيحة لا تُرسل للمتصفح إطلاقًا؛ الحكم يتم هنا.
 *  • المكافأة تُقيّد في RewardLedger ب乔木دمة (source, sourceId) فلا تتكرر.
 */

import { createHash, randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { readPlatformSettings } from "@/lib/admin/platform-settings";
import { getPuzzleRow } from "@/lib/game/level-repo";
import { normalizePuzzle } from "@/lib/game/normalize";
import type { GameLevel, Question } from "@/lib/game/types";
import { riyadhDayKey } from "./date";
import { issueDailyToken, readDailyToken, tokenHash } from "./session";
import {
  DAILY_TYPES,
  dailyCorrectAnswer,
  publicDailyQuestion,
  verifyDailyAnswer,
} from "./verification";

const MAX_ATTEMPTS = 5;

export interface DailyStartResult {
  level: GameLevel;
  date: string;
  /** فارغ عند اكتمال التحدي — لا حاجة لجلسة جديدة */
  token: string;
  status: "active" | "done";
  reward: number;
  coins: number | null;
}

export interface DailyAnswerResult {
  ok: boolean;
  correct: boolean;
  /** يُكشف بعد الخطأ فقط، ويُرسل من الخادم وحده */
  correctAnswer: string | null;
  explanation: string | null;
  reward: number;
  coins: number | null;
  attemptsLeft: number;
  completed: boolean;
}

/** اختيار ثابت من البنك — نفس التاريخ يعطي نفس السؤال دائمًا */
function pickFromBank(ids: string[], dateKey: string): string | null {
  if (ids.length === 0) return null;
  const digest = createHash("sha256").update(`thaqafatna:${dateKey}`).digest();
  return ids[digest.readUInt32BE(0) % ids.length] ?? null;
}

async function candidatePuzzleIds(): Promise<string[]> {
  const bank = await db.dailyQuestion.findMany({
    where: { active: true },
    orderBy: [{ addedAt: "asc" }, { id: "asc" }],
    select: { puzzleId: true },
  });
  if (bank.length > 0) return bank.map((item) => item.puzzleId);

  /* قبل أن يُعدّ الإدارة البنك: احتياط من لغاز المراحل Compatible */
  const levels = await db.level.findMany({
    orderBy: { order: "asc" },
    select: {
      puzzles: {
        orderBy: { order: "asc" },
        select: { id: true, puzzleType: true },
      },
    },
  });
  return levels
    .flatMap((level) => level.puzzles)
    .filter((puzzle) => DAILY_TYPES.includes(puzzle.puzzleType.trim().toLowerCase() as (typeof DAILY_TYPES)[number]))
    .map((puzzle) => puzzle.id);
}

function buildLevel(question: Question, reward: number, dateKey: string, hintCost: number): GameLevel {
  return {
    id: `daily-${dateKey}`,
    title: "سؤال اليوم",
    difficulty: "medium",
    timeLimit: 0,
    reward,
    hintCost,
    learningGoals: ["سؤال واحد يوميًا من بنك ثقافتنا", "مكافأة كاملة لأول إجابة صحيحة"],
    educationalDescription: "سؤال جديد كل يوم بتوقيت الرياض — أجب بشكل صحيح لتحصد المكافأة",
    questions: [question],
  };
}

/** تجهيز تحدي اليوم وفتح (أو استئناف) جلسة اللاعب */
export async function startDailyChallenge(deviceId: string): Promise<DailyStartResult | null> {
  const dateKey = riyadhDayKey();
  const settings = await readPlatformSettings();

  const schedule = await db.dailySchedule.findUnique({ where: { dateKey } });
  const puzzleId =
    schedule?.puzzleId ?? pickFromBank(await candidatePuzzleIds(), dateKey);
  if (!puzzleId) return null;

  const row = await getPuzzleRow(puzzleId);
  if (!row) return null;
  const internal = normalizePuzzle(row, settings.defaultHintCost);
  if (!internal || !DAILY_TYPES.includes(internal.type as (typeof DAILY_TYPES)[number]))
    return null;

  const reward =
    schedule?.rewardOverride && schedule.rewardOverride > 0
      ? schedule.rewardOverride
      : settings.dailyChallengeReward;
  const level = buildLevel(
    publicDailyQuestion(internal),
    reward,
    dateKey,
    settings.defaultHintCost,
  );

  let session = await db.dailySession.findUnique({
    where: { deviceId_dateKey: { deviceId, dateKey } },
  });

  if (session?.status === "correct" && session.completedAt) {
    const profile = await db.playerProfile.findUnique({
      where: { deviceId },
      select: { coins: true },
    });
    return {
      level,
      date: dateKey,
      token: "",
      status: "done",
      reward: session.reward || reward,
      coins: profile?.coins ?? null,
    };
  }

  /* upsert بمفتاح (الجهاز، اليوم) — آمن حتى مع طلبَي فتح متزامنين.
     الرمز يُصدر بعد معرفة معرّف الجلسة ثم يُحفظ تجزيئته فقط. */
  session = await db.dailySession.upsert({
    where: { deviceId_dateKey: { deviceId, dateKey } },
    create: {
      deviceId,
      dateKey,
      puzzleId,
      /* قيمة مؤقتة فريدة — تُستبدل بالتجزئة الحقيقية بعد إصدار الرمز */
      tokenHash: createHash("sha256").update(randomUUID()).digest("hex"),
      expiresAt: new Date(),
      reward,
    },
    update: { puzzleId, reward, status: "active" },
  });

  const issued = issueDailyToken({
    sessionId: session.id,
    dateKey,
    deviceId,
    puzzleId,
  });
  await db.dailySession.update({
    where: { id: session.id },
    data: { tokenHash: issued.hash, expiresAt: issued.expiresAt },
  });

  return {
    level,
    date: dateKey,
    token: issued.token,
    status: "active",
    reward,
    coins: null,
  };
}

/** الحكم السيرفي على إجابة واحدة مع منح المكافأة مرة واحدة */
export async function submitDailyAnswer(
  token: string,
  answer: unknown,
): Promise<{ status: number; result?: DailyAnswerResult; error?: string }> {
  const payload = readDailyToken(token);
  if (!payload) return { status: 401, error: "invalid_session" };

  const session = await db.dailySession.findUnique({ where: { id: payload.sid } });
  if (
    !session ||
    session.tokenHash !== tokenHash(token) ||
    session.dateKey !== payload.d ||
    session.deviceId !== payload.dev ||
    session.puzzleId !== payload.p ||
    session.expiresAt.getTime() <= Date.now()
  )
    return { status: 401, error: "invalid_session" };

  if (session.status === "correct")
    return {
      status: 409,
      error: "already_completed",
      result: {
        ok: false,
        correct: true,
        correctAnswer: null,
        explanation: null,
        reward: session.reward,
        coins: null,
        attemptsLeft: 0,
        completed: true,
      },
    };

  if (session.attempts >= MAX_ATTEMPTS)
    return { status: 429, error: "too_many_attempts" };

  const row = await getPuzzleRow(session.puzzleId);
  if (!row) return { status: 404, error: "question_missing" };
  const settings = await readPlatformSettings();
  const question = normalizePuzzle(row, settings.defaultHintCost);
  if (!question) return { status: 404, error: "question_missing" };

  const correct = verifyDailyAnswer(question, answer);
  await db.dailyAttempt.create({
    data: {
      sessionId: session.id,
      answer: (answer ?? null) as never,
      correct,
    },
  });

  let coins: number | null = null;
  if (correct) {
    const reward = session.reward || settings.dailyChallengeReward;
    /* createMany + skipDuplicates ذري: أول طلب فقط يُنشئ القيد،
       فلا تُمنح المكافأة مرتين حتى مع إجابتين صحيحتين متزامنتين. */
    await db.$transaction(async (tx) => {
      const claimed = await tx.rewardLedger.createMany({
        data: [
          {
            deviceId: session.deviceId,
            source: "daily",
            sourceId: session.id,
            amount: reward,
          },
        ],
        skipDuplicates: true,
      });
      if (claimed.count !== 1) return;

      const profile = await tx.playerProfile.upsert({
        where: { deviceId: session.deviceId },
        create: { deviceId: session.deviceId, coins: 120 + reward },
        update: { coins: { increment: reward } },
        select: { coins: true },
      });
      coins = profile.coins;
      await tx.dailySession.update({
        where: { id: session.id },
        data: { status: "correct", completedAt: new Date() },
      });
    });
  }

  await db.dailySession.update({
    where: { id: session.id },
    data: { attempts: { increment: 1 } },
  });

  return {
    status: 200,
    result: {
      ok: true,
      correct,
      correctAnswer: correct ? null : dailyCorrectAnswer(question),
      explanation: question.explanation ?? null,
      reward: correct ? session.reward || settings.dailyChallengeReward : 0,
      coins,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - (session.attempts + 1)),
      completed: correct,
    },
  };
}
