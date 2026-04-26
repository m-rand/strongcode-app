import { Resend } from "resend";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { clients, programs, trainingDayLog, trainingLog, users } from "@/db/schema";

const PRAGUE_TIMEZONE = "Europe/Prague";
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type LiftKey = "squat" | "bench_press" | "deadlift";
type VariantCode = string;

type ProgramInput = Record<
  string,
  {
    variants?: Record<string, unknown> | string[];
  } | undefined
>;

type DigestGroup = {
  clientName: string;
  clientSlug: string;
  programFilename: string;
  block: string;
  week: number;
  performedDate: string;
  sessions: Set<string>;
  compactSets: string[];
  notes: Set<string>;
  accessories: Set<string>;
};

export type DailyDigestActivity = {
  clientName: string;
  clientSlug: string;
  programFilename: string;
  block: string;
  week: number;
  performedDate: string;
  sessions: string[];
  compactSets: string[];
  notes: string[];
  accessories: string[];
};

export type DailyDigestPayload = {
  targetDate: string;
  activityCount: number;
  clientCount: number;
  sessionCount: number;
  setCount: number;
  activities: DailyDigestActivity[];
};

export type SendDailyDigestOptions = {
  targetDate?: string;
  dryRun?: boolean;
};

export type SendDailyDigestResult = DailyDigestPayload & {
  sent: boolean;
  recipients: string[];
  messageId: string | null;
};

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

const liftShort: Record<LiftKey, string> = {
  squat: "SQ",
  bench_press: "BP",
  deadlift: "DL",
};

function parseIsoDate(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!ISO_DATE_RE.test(normalized)) return null;
  return normalized;
}

function formatPragueDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PRAGUE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

function shiftIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function resolveDigestTargetDate(explicitDate?: string): string {
  const parsed = parseIsoDate(explicitDate);
  if (parsed) return parsed;
  const todayPrague = formatPragueDate(new Date());
  return shiftIsoDate(todayPrague, -1);
}

function asProgramInput(raw: unknown): ProgramInput {
  if (raw && typeof raw === "object") {
    return raw as ProgramInput;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as ProgramInput;
    } catch {
      return {};
    }
  }
  return {};
}

function normalizeVariantCode(value: string | null | undefined): VariantCode {
  if (!value) return "variant_1";
  const trimmed = value.trim();
  if (!trimmed || trimmed === "comp") return "variant_1";
  return trimmed;
}

function variantCodeToShort(variant: VariantCode): string {
  if (variant === "variant_1") return "V1";
  const match = variant.match(/^variant_(\d+)$/);
  if (!match) return variant;
  return `V${match[1]}`;
}

function variantNameFromInput(
  input: ProgramInput,
  lift: LiftKey,
  variant: VariantCode,
): string {
  if (variant === "variant_1") return "main";
  const variantsRaw = input?.[lift]?.variants;
  if (Array.isArray(variantsRaw)) {
    const match = variant.match(/^variant_(\d+)$/);
    const index = match ? Number(match[1]) - 2 : -1;
    if (index >= 0 && index < variantsRaw.length) {
      const candidate = String(variantsRaw[index] ?? "").trim();
      if (candidate) return candidate;
    }
  } else if (variantsRaw && typeof variantsRaw === "object") {
    const candidate = (variantsRaw as Record<string, unknown>)[variant];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return variant;
}

function variantLabel(input: ProgramInput, lift: LiftKey, variantRaw: string | null): string {
  const variant = normalizeVariantCode(variantRaw);
  const short = variantCodeToShort(variant);
  const name = variantNameFromInput(input, lift, variant);
  return name ? `${short}:${name}` : short;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function formatReps(actual: number | null, planned: number | null): string {
  if (actual == null && planned == null) return "— reps";
  if (actual == null) return `${planned} reps`;
  if (planned == null || actual === planned) return `${actual} reps`;
  return `${actual}/${planned} reps`;
}

function formatWeight(actual: number | null, planned: number | null): string {
  if (actual == null && planned == null) return "— kg";
  if (actual == null) return `${formatNumber(planned as number)} kg`;
  if (planned == null || actual === planned) return `${formatNumber(actual)} kg`;
  return `${formatNumber(actual)} kg (plan ${formatNumber(planned)} kg)`;
}

function asFiniteNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function nonEmptyText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function asHtmlMultiline(value: string): string {
  return escapeHtml(value).replaceAll("\n", "<br/>");
}

function activitySort(a: DailyDigestActivity, b: DailyDigestActivity): number {
  const byClient = a.clientName.localeCompare(b.clientName, undefined, { sensitivity: "base" });
  if (byClient !== 0) return byClient;
  const byProgram = a.programFilename.localeCompare(b.programFilename, undefined, { sensitivity: "base" });
  if (byProgram !== 0) return byProgram;
  if (a.week !== b.week) return a.week - b.week;
  return a.performedDate.localeCompare(b.performedDate);
}

function sessionSort(a: string, b: string): number {
  const [liftA, sessionA = ""] = a.split(" ");
  const [liftB, sessionB = ""] = b.split(" ");
  const tagOrder = (tag: string): number => {
    if (tag === "SQ") return 0;
    if (tag === "BP") return 1;
    if (tag === "DL") return 2;
    return 99;
  };
  const liftDiff = tagOrder(liftA || "") - tagOrder(liftB || "");
  if (liftDiff !== 0) return liftDiff;
  return sessionA.localeCompare(sessionB, undefined, { numeric: true, sensitivity: "base" });
}

function groupKey(programId: number, week: number, performedDate: string): string {
  return `${programId}|${week}|${performedDate}`;
}

function toActivity(group: DigestGroup): DailyDigestActivity {
  return {
    clientName: group.clientName,
    clientSlug: group.clientSlug,
    programFilename: group.programFilename,
    block: group.block,
    week: group.week,
    performedDate: group.performedDate,
    sessions: [...group.sessions].sort(sessionSort),
    compactSets: [...group.compactSets],
    notes: [...group.notes],
    accessories: [...group.accessories],
  };
}

function buildDigestText(payload: DailyDigestPayload): string {
  const lines: string[] = [];
  lines.push(`Daily Training Digest — ${payload.targetDate}`);
  lines.push("");
  lines.push(
    `Summary: ${payload.clientCount} clients, ${payload.activityCount} entries, ${payload.sessionCount} sessions, ${payload.setCount} sets`,
  );

  if (payload.activities.length === 0) {
    lines.push("");
    lines.push("No logged training activity for this day.");
    return lines.join("\n");
  }

  payload.activities.forEach((activity, index) => {
    lines.push("");
    lines.push(
      `${index + 1}. ${activity.clientName} (${activity.clientSlug}) — ${activity.programFilename} · W${activity.week} · ${activity.performedDate}`,
    );
    lines.push(`   Sessions: ${activity.sessions.length ? activity.sessions.join(", ") : "—"}`);
    if (activity.compactSets.length > 0) {
      lines.push("   Set details:");
      activity.compactSets.forEach((item) => lines.push(`   - ${item}`));
    }
    if (activity.notes.length > 0) {
      lines.push("   Training notes:");
      activity.notes.forEach((item) => lines.push(`   - ${item}`));
    }
    if (activity.accessories.length > 0) {
      lines.push("   Accessories:");
      activity.accessories.forEach((item) => lines.push(`   - ${item}`));
    }
  });

  return lines.join("\n");
}

function buildDigestHtml(payload: DailyDigestPayload): string {
  const summary = `${payload.clientCount} clients · ${payload.activityCount} entries · ${payload.sessionCount} sessions · ${payload.setCount} sets`;

  const body =
    payload.activities.length === 0
      ? `<p style="margin:16px 0 0;color:#374151;">No logged training activity for this day.</p>`
      : payload.activities
          .map((activity) => {
            const sessions = activity.sessions.length > 0 ? escapeHtml(activity.sessions.join(", ")) : "—";
            const setsHtml =
              activity.compactSets.length > 0
                ? `<ul style="margin:8px 0 0 18px; padding:0;">${activity.compactSets
                    .map((item) => `<li style="margin:4px 0;">${escapeHtml(item)}</li>`)
                    .join("")}</ul>`
                : `<p style="margin:8px 0 0; color:#6b7280;">No set-level rows captured.</p>`;

            const notesHtml =
              activity.notes.length > 0
                ? `<div style="margin-top:10px;"><strong>Training notes:</strong><ul style="margin:6px 0 0 18px; padding:0;">${activity.notes
                    .map((item) => `<li style="margin:4px 0;">${asHtmlMultiline(item)}</li>`)
                    .join("")}</ul></div>`
                : "";

            const accessoriesHtml =
              activity.accessories.length > 0
                ? `<div style="margin-top:10px;"><strong>Accessories:</strong><ul style="margin:6px 0 0 18px; padding:0;">${activity.accessories
                    .map((item) => `<li style="margin:4px 0;">${asHtmlMultiline(item)}</li>`)
                    .join("")}</ul></div>`
                : "";

            return `
              <section style="border:1px solid #e5e7eb; border-radius:10px; padding:14px; margin:14px 0;">
                <h3 style="margin:0 0 6px; font-size:16px; color:#111827;">
                  ${escapeHtml(activity.clientName)} (${escapeHtml(activity.clientSlug)})
                </h3>
                <p style="margin:0; color:#374151; font-size:13px;">
                  ${escapeHtml(activity.programFilename)} · ${escapeHtml(activity.block)} · Week ${activity.week} · ${escapeHtml(activity.performedDate)}
                </p>
                <p style="margin:8px 0 0; color:#111827;"><strong>Sessions:</strong> ${sessions}</p>
                <div style="margin-top:10px;">
                  <strong>Set details (compact):</strong>
                  ${setsHtml}
                </div>
                ${notesHtml}
                ${accessoriesHtml}
              </section>
            `;
          })
          .join("");

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 840px; margin: 0 auto; color: #111827;">
      <h1 style="margin: 0 0 8px; color:#1d4ed8;">StrongCode Daily Training Digest</h1>
      <p style="margin: 0; color:#374151;"><strong>Date:</strong> ${escapeHtml(payload.targetDate)}</p>
      <p style="margin: 6px 0 16px; color:#6b7280;">${escapeHtml(summary)}</p>
      ${body}
    </div>
  `;
}

function parseRecipients(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\s;]+/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

async function resolveRecipients(): Promise<string[]> {
  const fromEnv = parseRecipients(process.env.ADMIN_DAILY_DIGEST_TO);
  if (fromEnv.length > 0) {
    return [...new Set(fromEnv)];
  }

  const rows = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.role, "admin"));

  const emails = rows
    .map((row) => row.email?.trim())
    .filter((value): value is string => !!value);

  return [...new Set(emails)];
}

export async function buildDailyDigestPayload(
  explicitDate?: string,
): Promise<DailyDigestPayload> {
  const targetDate = resolveDigestTargetDate(explicitDate);
  const groups = new Map<string, DigestGroup>();

  const setRows = await db
    .select({
      programId: programs.id,
      programFilename: programs.filename,
      block: programs.block,
      programInput: programs.input,
      clientSlug: clients.slug,
      clientName:
        sql<string>`coalesce(json_extract(${programs.clientSnapshot}, '$.name'), ${clients.name}, ${clients.slug})`,
      week: trainingLog.week,
      lift: trainingLog.lift,
      sessionLetter:
        sql<string>`coalesce(${trainingLog.plannedSession}, ${trainingLog.session})`,
      setIndex: trainingLog.setIndex,
      prescribedWeight: trainingLog.prescribedWeight,
      prescribedReps: trainingLog.prescribedReps,
      performedVariant: trainingLog.performedVariant,
      actualWeight: trainingLog.actualWeight,
      actualReps: trainingLog.actualReps,
      rpe: trainingLog.rpe,
      performedDate: trainingLog.performedDate,
    })
    .from(trainingLog)
    .innerJoin(programs, eq(trainingLog.programId, programs.id))
    .innerJoin(clients, eq(programs.clientId, clients.id))
    .where(
      and(eq(trainingLog.performedDate, targetDate), meaningfulLogSql),
    )
    .orderBy(
      clients.name,
      programs.filename,
      trainingLog.week,
      trainingLog.lift,
      sql`coalesce(${trainingLog.plannedSession}, ${trainingLog.session})`,
      trainingLog.setIndex,
    );

  for (const row of setRows) {
    const performedDate = row.performedDate || targetDate;
    const key = groupKey(row.programId, row.week, performedDate);
    const existing = groups.get(key);
    const input = asProgramInput(row.programInput);

    const liftRaw = row.lift;
    if (
      liftRaw !== "squat" &&
      liftRaw !== "bench_press" &&
      liftRaw !== "deadlift"
    ) {
      continue;
    }
    const lift = liftRaw as LiftKey;

    const group: DigestGroup =
      existing ??
      {
        clientName: row.clientName || row.clientSlug,
        clientSlug: row.clientSlug,
        programFilename: row.programFilename,
        block: row.block,
        week: row.week,
        performedDate,
        sessions: new Set<string>(),
        compactSets: [],
        notes: new Set<string>(),
        accessories: new Set<string>(),
      };

    const sessionLetter = (row.sessionLetter || row.lift || "").trim() || "?";
    group.sessions.add(`${liftShort[lift]} ${sessionLetter}`);

    const setNumber = Number(row.setIndex) + 1;
    const reps = formatReps(
      asFiniteNumber(row.actualReps),
      asFiniteNumber(row.prescribedReps),
    );
    const weight = formatWeight(
      asFiniteNumber(row.actualWeight),
      asFiniteNumber(row.prescribedWeight),
    );
    const variant = variantLabel(input, lift, row.performedVariant);
    const rpe = asFiniteNumber(row.rpe);
    const rpePart = rpe != null ? ` · RPE ${formatNumber(rpe)}` : "";

    group.compactSets.push(
      `${liftShort[lift]} ${sessionLetter}#${setNumber} · ${variant} · ${reps} · ${weight}${rpePart}`,
    );

    groups.set(key, group);
  }

  const dayRows = await db
    .select({
      programId: programs.id,
      programFilename: programs.filename,
      block: programs.block,
      clientSlug: clients.slug,
      clientName:
        sql<string>`coalesce(json_extract(${programs.clientSnapshot}, '$.name'), ${clients.name}, ${clients.slug})`,
      week: trainingDayLog.week,
      performedDate: trainingDayLog.performedDate,
      notes: trainingDayLog.notes,
      accessories: trainingDayLog.accessories,
    })
    .from(trainingDayLog)
    .innerJoin(programs, eq(trainingDayLog.programId, programs.id))
    .innerJoin(clients, eq(programs.clientId, clients.id))
    .where(eq(trainingDayLog.performedDate, targetDate))
    .orderBy(clients.name, programs.filename, trainingDayLog.week);

  for (const row of dayRows) {
    const key = groupKey(row.programId, row.week, row.performedDate);
    const existing = groups.get(key);
    const group: DigestGroup =
      existing ??
      {
        clientName: row.clientName || row.clientSlug,
        clientSlug: row.clientSlug,
        programFilename: row.programFilename,
        block: row.block,
        week: row.week,
        performedDate: row.performedDate,
        sessions: new Set<string>(),
        compactSets: [],
        notes: new Set<string>(),
        accessories: new Set<string>(),
      };

    const notes = nonEmptyText(row.notes);
    if (notes) group.notes.add(notes);
    const accessories = nonEmptyText(row.accessories);
    if (accessories) group.accessories.add(accessories);

    groups.set(key, group);
  }

  const activities = [...groups.values()]
    .map((group) => toActivity(group))
    .sort(activitySort);

  const clientCount = new Set(activities.map((activity) => activity.clientSlug)).size;
  const sessionCount = activities.reduce((sum, activity) => sum + activity.sessions.length, 0);
  const setCount = activities.reduce((sum, activity) => sum + activity.compactSets.length, 0);

  return {
    targetDate,
    activityCount: activities.length,
    clientCount,
    sessionCount,
    setCount,
    activities,
  };
}

export async function sendAdminDailyDigest(
  options: SendDailyDigestOptions = {},
): Promise<SendDailyDigestResult> {
  const payload = await buildDailyDigestPayload(options.targetDate);
  const recipients = await resolveRecipients();

  if (options.dryRun) {
    return {
      ...payload,
      sent: false,
      recipients,
      messageId: null,
    };
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (recipients.length === 0) {
    throw new Error(
      "No admin email recipients resolved. Set ADMIN_DAILY_DIGEST_TO or ensure admin users have emails.",
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "info@strong-code.com";

  const result = await resend.emails.send({
    from: `StrongCode <${fromEmail}>`,
    to: recipients,
    subject: `StrongCode Daily Digest — ${payload.targetDate}`,
    html: buildDigestHtml(payload),
    text: buildDigestText(payload),
  });

  if (result.error) {
    throw new Error(result.error.message || "Failed to send daily digest.");
  }

  return {
    ...payload,
    sent: true,
    recipients,
    messageId: result.data?.id || null,
  };
}
