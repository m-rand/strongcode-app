import { NextResponse } from "next/server";
import { db } from "@/db";
import { trainingDayLog, programs } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const programIdRaw = searchParams.get("programId");
    const weekRaw = searchParams.get("week");

    if (!programIdRaw) {
      return NextResponse.json(
        { error: "programId is required" },
        { status: 400 },
      );
    }

    const programId = Number(programIdRaw);
    if (!Number.isFinite(programId) || programId <= 0) {
      return NextResponse.json(
        { error: "programId must be a positive number" },
        { status: 400 },
      );
    }

    const conditions = [eq(trainingDayLog.programId, programId)];
    if (weekRaw) {
      const week = Number(weekRaw);
      if (!Number.isFinite(week) || week <= 0) {
        return NextResponse.json(
          { error: "week must be a positive number" },
          { status: 400 },
        );
      }
      conditions.push(eq(trainingDayLog.week, week));
    }

    const rows = await db
      .select()
      .from(trainingDayLog)
      .where(and(...conditions))
      .orderBy(desc(trainingDayLog.performedDate), desc(trainingDayLog.id));

    return NextResponse.json({ logs: rows });
  } catch (error: unknown) {
    console.error("Error fetching training day log:", error);
    return NextResponse.json(
      { error: "Failed to fetch training day log" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const programId = Number(body?.programId);
    const week = Number(body?.week);
    const performedDate = String(body?.performedDate || "").trim();
    const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
    const accessories = typeof body?.accessories === "string" ? body.accessories.trim() : "";

    if (!Number.isFinite(programId) || programId <= 0) {
      return NextResponse.json(
        { error: "programId must be a positive number" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(week) || week <= 0) {
      return NextResponse.json(
        { error: "week must be a positive number" },
        { status: 400 },
      );
    }
    if (!ISO_DATE_RE.test(performedDate)) {
      return NextResponse.json(
        { error: "performedDate must be in YYYY-MM-DD format" },
        { status: 400 },
      );
    }

    const [program] = await db
      .select({ id: programs.id, status: programs.status })
      .from(programs)
      .where(eq(programs.id, programId))
      .limit(1);

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 },
      );
    }

    if (program.status !== "active") {
      return NextResponse.json(
        { error: "Only active programs can be updated." },
        { status: 403 },
      );
    }

    const [existing] = await db
      .select({ id: trainingDayLog.id })
      .from(trainingDayLog)
      .where(and(
        eq(trainingDayLog.programId, programId),
        eq(trainingDayLog.week, week),
        eq(trainingDayLog.performedDate, performedDate),
      ))
      .limit(1);

    const now = new Date().toISOString();

    if (!notes && !accessories) {
      if (existing) {
        await db.delete(trainingDayLog).where(eq(trainingDayLog.id, existing.id));
      }
      return NextResponse.json({ success: true, deleted: !!existing });
    }

    if (existing) {
      await db
        .update(trainingDayLog)
        .set({
          notes: notes || null,
          accessories: accessories || null,
          updatedAt: now,
        })
        .where(eq(trainingDayLog.id, existing.id));
      return NextResponse.json({ success: true, action: "updated", id: existing.id });
    }

    const inserted = await db
      .insert(trainingDayLog)
      .values({
        programId,
        week,
        performedDate,
        notes: notes || null,
        accessories: accessories || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: trainingDayLog.id });

    return NextResponse.json({ success: true, action: "created", id: inserted[0]?.id });
  } catch (error: unknown) {
    console.error("Error saving training day log:", error);
    return NextResponse.json(
      { error: "Failed to save training day log" },
      { status: 500 },
    );
  }
}
