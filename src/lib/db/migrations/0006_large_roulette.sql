CREATE TABLE `category_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`schedule_start` text NOT NULL,
	`schedule_end` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_schedules_category_unique` ON `category_schedules` (`category`);--> statement-breakpoint
ALTER TABLE `banners` ADD `link_type` text;--> statement-breakpoint
ALTER TABLE `banners` ADD `link_value` text;--> statement-breakpoint
ALTER TABLE `banners` ADD `schedule_start` text;--> statement-breakpoint
ALTER TABLE `banners` ADD `schedule_end` text;