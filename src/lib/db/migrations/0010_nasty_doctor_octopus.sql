CREATE TABLE `product_upsells` (
	`id` text PRIMARY KEY NOT NULL,
	`trigger_product_id` text NOT NULL,
	`offer_product_id` text NOT NULL,
	`offer_price` real NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`trigger_product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`offer_product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_upsells_trigger_product_id_unique` ON `product_upsells` (`trigger_product_id`);