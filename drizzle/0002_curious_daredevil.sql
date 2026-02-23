CREATE TABLE `families` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`inviteCode` varchar(16) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `families_id` PRIMARY KEY(`id`),
	CONSTRAINT `families_inviteCode_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
ALTER TABLE `activity_logs` ADD `familyId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `familyId` int;