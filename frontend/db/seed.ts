/**
 * Seed script: migrates existing JSON data → Turso database
 * Run: npx tsx db/seed.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import * as schema from "./schema";

const DATA_DIR = join(__dirname, "..", "..", "data");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client, { schema });

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

async function seed() {
  console.log("🌱 Starting seed...\n");

  // ─── 1. Users ───────────────────────────────────────────
  const usersData = readJson(join(DATA_DIR, "users.json"));
  console.log(`👤 Seeding ${usersData.length} users...`);
  for (const u of usersData) {
    await db.insert(schema.users).values({
      email: u.email,
      password: u.password,
      role: u.role,
      name: u.name,
      clientSlug: u.client_slug || null,
      createdAt: new Date().toISOString(),
    });
  }
  console.log("   ✓ Users done\n");

  // ─── 2. Invite Tokens ──────────────────────────────────
  const tokensPath = join(DATA_DIR, "invite-tokens.json");
  if (existsSync(tokensPath)) {
    const tokensData = readJson(tokensPath);
    console.log(`🎟️  Seeding ${tokensData.length} invite tokens...`);
    for (const t of tokensData) {
      await db.insert(schema.inviteTokens).values({
        token: t.token,
        clientSlug: t.clientSlug,
        email: t.email,
        used: t.used,
        createdAt: t.createdAt,
        expiresAt: t.expiresAt,
      });
    }
    console.log("   ✓ Invite tokens done\n");
  }

  // ─── 3. Clients + 1RM Records ──────────────────────────
  const clientsDir = join(DATA_DIR, "clients");
  const clientSlugs = readdirSync(clientsDir).filter((d) => {
    const profilePath = join(clientsDir, d, "profile.json");
    return existsSync(profilePath);
  });

  console.log(`🏋️  Seeding ${clientSlugs.length} clients...`);
  const clientIdMap: Record<string, number> = {};

  for (const slug of clientSlugs) {
    const profile = readJson(join(clientsDir, slug, "profile.json"));

    const [inserted] = await db
      .insert(schema.clients)
      .values({
        slug,
        name: profile.name,
        email: profile.email || null,
        status: profile.status || "active",
        schemaVersion: profile.schema_version || "1.0",
        skillLevel: profile.skill_level || null,
        preferences: profile.preferences || null,
        survey: profile.survey || null,
        notes: profile.notes || null,
        createdAt: profile.created_at || new Date().toISOString(),
        createdBy: profile._meta?.created_by || null,
        lastModified:
          profile._meta?.last_modified || new Date().toISOString(),
      })
      .returning({ id: schema.clients.id });

    clientIdMap[slug] = inserted.id;
    console.log(`   ✓ Client: ${profile.name} (id=${inserted.id})`);

    // 1RM records
    if (profile.one_rm_history?.length) {
      for (const rm of profile.one_rm_history) {
        await db.insert(schema.oneRmRecords).values({
          clientId: inserted.id,
          date: rm.date,
          squat: rm.squat ?? null,
          benchPress: rm.bench_press ?? null,
          deadlift: rm.deadlift ?? null,
          tested: rm.tested ?? false,
          notes: rm.notes || null,
        });
      }
      console.log(
        `     └ ${profile.one_rm_history.length} 1RM records`
      );
    }
  }
  console.log("");

  // ─── 4. Programs ────────────────────────────────────────
  let totalPrograms = 0;

  for (const slug of clientSlugs) {
    const programsDir = join(clientsDir, slug, "programs");
    if (!existsSync(programsDir)) continue;

    const programFiles = readdirSync(programsDir).filter((f) =>
      f.endsWith(".json")
    );

    for (const file of programFiles) {
      const program = readJson(join(programsDir, file));
      const clientId = clientIdMap[slug];
      if (!clientId) {
        console.warn(`   ⚠ No client ID found for slug "${slug}", skipping ${file}`);
        continue;
      }

      await db.insert(schema.programs).values({
        clientId,
        filename: file,
        schemaVersion: program.schema_version || "1.0",
        status: program.meta?.status || "draft",
        block: program.program_info?.block || "prep",
        startDate: program.program_info?.start_date || "",
        endDate: program.program_info?.end_date || "",
        weeks: program.program_info?.weeks || 4,
        clientSnapshot: program.client || null,
        input: program.input || {},
        calculated: program.calculated || {},
        sessionsData: program.sessions || {},
        createdAt:
          program.meta?.created_at || new Date().toISOString(),
        createdBy: program.meta?.created_by || null,
      });
      totalPrograms++;
    }
  }
  console.log(`📋 Seeded ${totalPrograms} programs\n`);

  // ─── 5. Audit log entry ─────────────────────────────────
  await db.insert(schema.auditLog).values({
    action: "seed",
    entity: "database",
    details: {
      users: usersData.length,
      clients: clientSlugs.length,
      programs: totalPrograms,
      seededAt: new Date().toISOString(),
    },
  });

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
