CREATE TABLE `program_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`scope` text NOT NULL,
	`lift` text,
	`block` text NOT NULL,
	`weeks` integer NOT NULL,
	`schema_version` text DEFAULT '1.2' NOT NULL,
	`input` text NOT NULL,
	`calculated` text NOT NULL,
	`sessions_template` text NOT NULL,
	`source_program_filename` text,
	`created_at` text NOT NULL,
	`created_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `program_templates_slug_unique` ON `program_templates` (`slug`);
