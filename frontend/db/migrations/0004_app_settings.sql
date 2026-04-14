CREATE TABLE IF NOT EXISTS `app_settings` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text,
  `updated_at` text NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
