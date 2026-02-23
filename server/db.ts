import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  ActivityCategory,
  ActivityLog,
  InsertActivityLog,
  InsertUser,
  activityCategories,
  activityLogs,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ─────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(
  userId: number,
  data: { familyRole?: "father" | "mother" | "kid"; displayName?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function getAllFamilyMembers() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: users.id,
      displayName: users.displayName,
      familyRole: users.familyRole,
      name: users.name,
    })
    .from(users)
    .where(sql`${users.familyRole} IS NOT NULL`);
}

// ─── Activity category helpers ────────────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  { name: "Cooking", icon: "🍳", defaultDuration: 45, color: "#F97316" },
  { name: "Cleaning", icon: "🧹", defaultDuration: 60, color: "#8B5CF6" },
  { name: "Laundry", icon: "👕", defaultDuration: 30, color: "#3B82F6" },
  { name: "Grocery Shopping", icon: "🛒", defaultDuration: 60, color: "#10B981" },
  { name: "Dishes", icon: "🍽️", defaultDuration: 20, color: "#F59E0B" },
  { name: "Vacuuming", icon: "🌀", defaultDuration: 30, color: "#EC4899" },
  { name: "Taking Out Trash", icon: "🗑️", defaultDuration: 10, color: "#6B7280" },
  { name: "Yard Work", icon: "🌿", defaultDuration: 60, color: "#22C55E" },
  { name: "Home Repairs", icon: "🔧", defaultDuration: 90, color: "#EF4444" },
  { name: "Childcare", icon: "👶", defaultDuration: 120, color: "#A855F7" },
  { name: "Pet Care", icon: "🐾", defaultDuration: 30, color: "#D97706" },
  { name: "Errands", icon: "🚗", defaultDuration: 45, color: "#0EA5E9" },
  { name: "Organizing", icon: "📦", defaultDuration: 45, color: "#84CC16" },
  { name: "Bathroom Cleaning", icon: "🚿", defaultDuration: 25, color: "#06B6D4" },
  { name: "Meal Prep", icon: "🥗", defaultDuration: 30, color: "#FB923C" },
];

export async function seedDefaultCategories() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: activityCategories.id }).from(activityCategories).limit(1);
  if (existing.length > 0) return;
  await db.insert(activityCategories).values(DEFAULT_CATEGORIES);
}

export async function getActivityCategories(): Promise<ActivityCategory[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityCategories).orderBy(activityCategories.name);
}

// ─── Activity log helpers ─────────────────────────────────────────────────────

export async function insertActivityLog(data: InsertActivityLog): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(activityLogs).values(data);
  return (result[0] as any).insertId as number;
}

export async function getActivityLogs(params: {
  userId?: number;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}): Promise<ActivityLog[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (params.userId) conditions.push(eq(activityLogs.userId, params.userId));
  if (params.from) conditions.push(gte(activityLogs.loggedAt, params.from));
  if (params.to) conditions.push(lte(activityLogs.loggedAt, params.to));

  const query = db
    .select()
    .from(activityLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(activityLogs.loggedAt))
    .limit(params.limit ?? 50)
    .offset(params.offset ?? 0);

  return query;
}

export async function getDashboardAggregates(params: { from: Date; to: Date }) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      userId: activityLogs.userId,
      categoryName: activityLogs.categoryName,
      categoryIcon: activityLogs.categoryIcon,
      categoryColor: activityLogs.categoryColor,
      totalMinutes: sql<number>`SUM(${activityLogs.durationMinutes})`,
      logCount: sql<number>`COUNT(*)`,
    })
    .from(activityLogs)
    .where(
      and(
        gte(activityLogs.loggedAt, params.from),
        lte(activityLogs.loggedAt, params.to)
      )
    )
    .groupBy(
      activityLogs.userId,
      activityLogs.categoryName,
      activityLogs.categoryIcon,
      activityLogs.categoryColor
    );
}

export async function getUserTotalMinutes(params: { from: Date; to: Date }) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      userId: activityLogs.userId,
      totalMinutes: sql<number>`SUM(${activityLogs.durationMinutes})`,
      logCount: sql<number>`COUNT(*)`,
    })
    .from(activityLogs)
    .where(
      and(
        gte(activityLogs.loggedAt, params.from),
        lte(activityLogs.loggedAt, params.to)
      )
    )
    .groupBy(activityLogs.userId);
}
