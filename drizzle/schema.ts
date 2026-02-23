import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // Family-specific fields
  familyRole: mysqlEnum("familyRole", ["father", "mother", "kid"]),
  displayName: varchar("displayName", { length: 64 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Pre-defined household activity categories with default durations (in minutes)
export const activityCategories = mysqlTable("activity_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  icon: varchar("icon", { length: 32 }).notNull(),
  defaultDuration: int("defaultDuration").notNull(), // minutes
  color: varchar("color", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityCategory = typeof activityCategories.$inferSelect;

// Individual activity log entries
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId").notNull(),
  categoryName: varchar("categoryName", { length: 64 }).notNull(),
  categoryIcon: varchar("categoryIcon", { length: 32 }).notNull(),
  categoryColor: varchar("categoryColor", { length: 32 }).notNull(),
  customNote: text("customNote"),
  durationMinutes: int("durationMinutes").notNull(),
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
