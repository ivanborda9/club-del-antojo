CREATE TABLE `admin_push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_push_subscriptions_endpoint_unique` ON `admin_push_subscriptions` (`endpoint`);