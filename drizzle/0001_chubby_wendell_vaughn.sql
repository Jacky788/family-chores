CREATE TABLE `activity_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`icon` varchar(32) NOT NULL,
	`defaultDuration` int NOT NULL,
	`color` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int NOT NULL,
	`categoryName` varchar(64) NOT NULL,
	`categoryIcon` varchar(32) NOT NULL,
	`categoryColor` varchar(32) NOT NULL,
	`customNote` text,
	`durationMinutes` int NOT NULL,
	`loggedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `familyRole` enum('father','mother','kid');--> statement-breakpoint
ALTER TABLE `users` ADD `displayName` varchar(64);