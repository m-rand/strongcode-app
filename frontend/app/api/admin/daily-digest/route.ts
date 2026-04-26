import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendAdminDailyDigest } from "@/lib/admin/dailyDigest";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { targetDate?: string; dryRun?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const result = await sendAdminDailyDigest({
      targetDate: body.targetDate,
      dryRun: !!body.dryRun,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error sending admin daily digest:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send admin daily digest",
      },
      { status: 500 },
    );
  }
}

