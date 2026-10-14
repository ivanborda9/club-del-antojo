CREATE TABLE `box_sizes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price` real NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `is_box` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `box_size_name` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `gift_recipient_name` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `gift_message` text;