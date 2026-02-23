import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────

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
  familyId: int("familyId"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Families ─────────────────────────────────────────────────────────────────

export const families = mysqlTable("families", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  inviteCode: varchar("inviteCode", { length: 16 }).notNull().unique(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Family = typeof families.$inferSelect;
export type InsertFamily = typeof families.$inferInsert;

// ─── Activity categories ──────────────────────────────────────────────────────

export const activityCategories = mysqlTable("activity_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  icon: varchar("icon", { length: 32 }).notNull(),
  defaultDuration: int("defaultDuration").notNull(),
  color: varchar("color", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityCategory = typeof activityCategories.$inferSelect;

// ─── Activity logs ────────────────────────────────────────────────────────────

export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  familyId: int("familyId").notNull(),
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
