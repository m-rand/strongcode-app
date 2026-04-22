import { NextResponse } from "next/server";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { clients, programs, trainingLog } from "@/db/schema";

const meaningfulLogSql = sql<boolean>`
  (
    ${trainingLog.completed} = 1
    OR ${trainingLog.rpe} IS NOT NULL
    OR (${trainingLog.notes} IS NOT NULL AND trim(${trainingLog.notes}) <> '')
    OR (
      ${trainingLog.actualWeight} IS NOT NULL
      AND ${trainingLog.prescribedWeight} IS NOT NULL
      AND ${trainingLog.actualWeight} <> ${trainingLog.prescribedWeight}
    )
    OR (
      ${trainingLog.actualReps} IS NOT NULL
      AND ${trainingLog.prescribedReps} IS NOT NULL
      AND ${trainingLog.actualReps} <> ${trainingLog.prescribedReps}
    )
    OR (
      ${trainingLog.performedVariant} IS NOT NULL
      AND ${trainingLog.performedVariant} <> ''
      AND ${trainingLog.performedVariant} <> 'variant_1'
      AND ${trainingLog.performedVariant} <> 'comp'
    )
  )
`;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select({
        programFilename: programs.filename,
        clientSlug: clients.slug,
        clientName:
          sql<string>`coalesce(json_extract(${programs.clientSnapshot}, '$.name'), ${clients.name}, ${clients.slug})`,
        week: trainingLog.week,
        lift: trainingLog.lift,
        sessionLetter:
          sql<string>`coalesce(${trainingLog.plannedSession}, ${trainingLog.session})`,
        performedDate: trainingLog.performedDate,
        loggedSets: sql<number>`count(distinct ${trainingLog.setIndex})`,
        completedSets:
          sql<number>`sum(case when ${trainingLog.completed} = 1 then 1 else 0 end)`,
        lastLoggedAt: sql<string>`max(${trainingLog.loggedAt})`,
      })
      .from(trainingLog)
      .innerJoin(programs, eq(trainingLog.programId, programs.id))
      .innerJoin(clients, eq(programs.clientId, clients.id))
      .where(and(isNotNull(trainingLog.performedDate), meaningfulLogSql))
      .groupBy(
        programs.filename,
        programs.clientSnapshot,
        clients.slug,
        clients.name,
        trainingLog.week,
        trainingLog.lift,
        sql`coalesce(${trainingLog.plannedSession}, ${trainingLog.session})`,
        trainingLog.performedDate,
      )
      .orderBy(sql`max(${trainingLog.loggedAt}) desc`)
      .limit(40);

    return NextResponse.json({
      notifications: rows.map((row) => ({
        ...row,
        performedDate: row.performedDate || "",
      })),
    });
  } catch (error) {
    console.error("Error loading admin notifications:", error);
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 },
    );
  }
}

