import { NextResponse } from "next/server";
import { db } from "@/db";
import { trainingLog, programs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/training-log?programId=1&week=1&session=A
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("programId");

    if (!programId) {
      return NextResponse.json(
        { error: "programId is required" },
        { status: 400 }
      );
    }

    // Build filter conditions
    const conditions = [eq(trainingLog.programId, Number(programId))];

    const week = searchParams.get("week");
    if (week) {
      conditions.push(eq(trainingLog.week, Number(week)));
    }

    const sessionFilter = searchParams.get("session");
    if (sessionFilter) {
      conditions.push(eq(trainingLog.session, sessionFilter));
    }

    const logs = await db
      .select()
      .from(trainingLog)
      .where(and(...conditions))
      .orderBy(
        trainingLog.week,
        trainingLog.session,
        trainingLog.lift,
        trainingLog.setIndex
      );

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("Error fetching training log:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch training log" },
      { status: 500 }
    );
  }
}

// POST /api/training-log
// Body: {
//   entries: [{
//     programId, week, session, lift, setIndex,
//     prescribedWeight, prescribedReps,
//     plannedSession?, performedDate?, performedVariant?,
//     actualWeight?, actualReps?, rpe?, completed, notes?
//   }]
// }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entries } = body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "entries array is required" },
        { status: 400 }
      );
    }

    // Verify program exists
    const programId = entries[0].programId;
    const [program] = await db
      .select({ id: programs.id, status: programs.status })
      .from(programs)
      .where(eq(programs.id, programId))
      .limit(1);

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    if (program.status !== "active") {
      return NextResponse.json(
        { error: "Only active programs can be updated by training log." },
        { status: 403 }
      );
    }

    // Upsert: for each entry, check if a log exists for this set, update or insert
    const results = [];
    for (const entry of entries) {
      const prescribedWeight = Number(entry.prescribedWeight);
      const prescribedReps = Number(entry.prescribedReps);
      const plannedSession = entry.plannedSession ?? entry.session ?? null;
      const performedDate = entry.performedDate ?? null;
      const performedVariant = entry.performedVariant ?? null;
      const actualWeight = entry.actualWeight ?? entry.prescribedWeight;
      const actualReps = entry.actualReps ?? entry.prescribedReps;
      const rpe = entry.rpe;
      const completed = !!entry.completed;
      const notes = typeof entry.notes === "string" ? entry.notes : null;

      const hasNotes = typeof notes === "string" && notes.trim().length > 0;
      const hasRpe = typeof rpe === "number";
      const hasWeightOverride =
        typeof actualWeight === "number" && actualWeight !== prescribedWeight;
      const hasRepsOverride =
        typeof actualReps === "number" && actualReps !== prescribedReps;
      const hasNonDefaultVariant =
        typeof performedVariant === "string" &&
        performedVariant.length > 0 &&
        performedVariant !== "variant_1" &&
        performedVariant !== "comp";
      const isMeaningful =
        completed ||
        hasNotes ||
        hasRpe ||
        hasWeightOverride ||
        hasRepsOverride ||
        hasNonDefaultVariant;

      const existing = await db
        .select({ id: trainingLog.id })
        .from(trainingLog)
        .where(
          and(
            eq(trainingLog.programId, entry.programId),
            eq(trainingLog.week, entry.week),
            eq(trainingLog.session, entry.session),
            eq(trainingLog.lift, entry.lift),
            eq(trainingLog.setIndex, entry.setIndex)
          )
        )
        .limit(1);

      if (!isMeaningful) {
        if (existing.length > 0) {
          await db.delete(trainingLog).where(eq(trainingLog.id, existing[0].id));
          results.push({ id: existing[0].id, action: "deleted" });
        }
        continue;
      }

      if (existing.length > 0) {
        // Update existing log entry
        await db
          .update(trainingLog)
          .set({
            plannedSession,
            performedDate,
            performedVariant,
            actualWeight,
            actualReps,
            rpe,
            completed,
            notes,
            loggedAt: new Date().toISOString(),
          })
          .where(eq(trainingLog.id, existing[0].id));
        results.push({ id: existing[0].id, action: "updated" });
      } else {
        // Insert new log entry
        const inserted = await db
          .insert(trainingLog)
          .values({
            programId: entry.programId,
            week: entry.week,
            session: entry.session,
            plannedSession,
            performedDate,
            lift: entry.lift,
            setIndex: entry.setIndex,
            prescribedWeight,
            prescribedReps,
            performedVariant,
            actualWeight,
            actualReps,
            rpe,
            completed,
            notes,
          })
          .returning({ id: trainingLog.id });
        results.push({ id: inserted[0].id, action: "created" });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Error saving training log:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save training log" },
      { status: 500 }
    );
  }
}
