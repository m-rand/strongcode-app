import { NextResponse } from "next/server";
import { sendAdminDailyDigest } from "@/lib/admin/dailyDigest";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetDate = searchParams.get("date") || undefined;
    const dryRun = searchParams.get("dryRun") === "1";

    const result = await sendAdminDailyDigest({
      targetDate,
      dryRun,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error running admin daily digest cron:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to run admin daily digest cron",
      },
      { status: 500 },
    );
  }
}

