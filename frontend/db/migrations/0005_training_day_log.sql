CREATE TABLE IF NOT EXISTS `training_day_log` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `program_id` integer NOT NULL REFERENCES `programs`(`id`) ON DELETE cascade,
  `week` integer NOT NULL,
  `performed_date` text NOT NULL,
  `notes` text,
  `accessories` text,
  `created_at` text NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` text NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `training_day_log_program_week_date_idx`
  ON `training_day_log` (`program_id`, `week`, `performed_date`);
