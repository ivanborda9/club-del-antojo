CREATE TABLE `business_hours` (
	`id` text PRIMARY KEY NOT NULL,
	`days_of_week` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
