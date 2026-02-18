import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ─── Users ──────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "client"] })
    .notNull()
    .default("client"),
  name: text("name").notNull(),
  clientSlug: text("client_slug"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ─── Clients ────────────────────────────────────────────────
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  status: text("status", { enum: ["active", "pending", "inactive"] })
    .notNull()
    .default("active"),
  schemaVersion: text("schema_version").notNull().default("1.0"),
  skillLevel: text("skill_level", {
    enum: ["beginner", "intermediate", "advanced", "elite"],
  }),
  // JSON columns for flexible nested data
  preferences: text("preferences", { mode: "json" }).$type<{
    training_days?: string[];
    focus_lifts?: string[];
    session_duration_minutes?: number;
    sessions_per_week?: number;
  }>(),
  survey: text("survey", { mode: "json" }),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  createdBy: text("created_by"),
  lastModified: text("last_modified")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ─── 1RM Records ────────────────────────────────────────────
export const oneRmRecords = sqliteTable("one_rm_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  squat: real("squat"),
  benchPress: real("bench_press"),
  deadlift: real("deadlift"),
  tested: integer("tested", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
});

// ─── Programs ───────────────────────────────────────────────
export const programs = sqliteTable("programs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  schemaVersion: text("schema_version").notNull().default("1.0"),
  status: text("status", { enum: ["draft", "active", "completed"] })
    .notNull()
    .default("draft"),
  // Program metadata
  block: text("block", { enum: ["prep", "comp"] }).notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  weeks: integer("weeks").notNull(),
  // Client snapshot at program creation time
  clientSnapshot: text("client_snapshot", { mode: "json" }).$type<{
    name: string;
    delta: string;
    one_rm: { squat: number; bench_press: number; deadlift: number };
  }>(),
  // Large JSON columns for program data
  input: text("input", { mode: "json" }).notNull(),
  calculated: text("calculated", { mode: "json" }).notNull(),
  sessionsData: text("sessions_data", { mode: "json" }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  createdBy: text("created_by"),
});

// ─── Invite Tokens ──────────────────────────────────────────
export const inviteTokens = sqliteTable("invite_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull().unique(),
  clientSlug: text("client_slug").notNull(),
  email: text("email").notNull(),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  expiresAt: text("expires_at").notNull(),
});

// ─── Audit Log ──────────────────────────────────────────────
export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  details: text("details", { mode: "json" }),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
