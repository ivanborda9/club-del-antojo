CREATE TABLE `marquee_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`schedule_start` text,
	`schedule_end` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
