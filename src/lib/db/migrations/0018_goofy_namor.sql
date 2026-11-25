CREATE TABLE `shipping_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`days_of_week` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`max_distance_km` real NOT NULL,
	`price` real NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_cost` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_distance_km` real;