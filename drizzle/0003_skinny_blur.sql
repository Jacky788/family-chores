ALTER TABLE `users` ADD `isGuest` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `guestToken` varchar(128);