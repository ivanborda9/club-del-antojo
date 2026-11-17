ALTER TABLE `box_sizes` ADD `image_url` text;--> statement-breakpoint
ALTER TABLE `box_sizes` ADD `stock` integer DEFAULT 0 NOT NULL;