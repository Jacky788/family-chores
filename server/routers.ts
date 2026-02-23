import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getAllFamilyMembers,
  getActivityCategories,
  getDashboardAggregates,
  getActivityLogs,
  getUserTotalMinutes,
  insertActivityLog,
  seedDefaultCategories,
  updateUserProfile,
} from "./db";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";

// Seed default categories on startup
seedDefaultCategories().catch(console.error);

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  family: router({
    // Set the current user's family role and display name
    setProfile: protectedProcedure
      .input(
        z.object({
          familyRole: z.enum(["father", "mother", "kid"]),
          displayName: z.string().min(1).max(64),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateUserProfile(ctx.user.id, {
          familyRole: input.familyRole,
          displayName: input.displayName,
        });
        return { success: true };
      }),

    // Get all family members who have set a role
    getMembers: publicProcedure.query(async () => {
      return getAllFamilyMembers();
    }),
  }),

  activities: router({
    // Get all activity categories with defaults
    getCategories: publicProcedure.query(async () => {
      return getActivityCategories();
    }),

    // Log a new activity
    log: protectedProcedure
      .input(
        z.object({
          categoryId: z.number().int().positive(),
          categoryName: z.string(),
          categoryIcon: z.string(),
          categoryColor: z.string(),
          durationMinutes: z.number().int().min(1).max(1440),
          customNote: z.string().max(200).optional(),
          loggedAt: z.number().optional(), // UTC timestamp ms
        })
      )
      .mutation(async ({ ctx, input }) => {
        const loggedAt = input.loggedAt ? new Date(input.loggedAt) : new Date();
        const id = await insertActivityLog({
          userId: ctx.user.id,
          categoryId: input.categoryId,
          categoryName: input.categoryName,
          categoryIcon: input.categoryIcon,
          categoryColor: input.categoryColor,
          durationMinutes: input.durationMinutes,
          customNote: input.customNote ?? null,
          loggedAt,
        });
        return { id, success: true };
      }),

    // Get activity history (all family or specific user)
    getHistory: protectedProcedure
      .input(
        z.object({
          userId: z.number().int().optional(),
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
          from: z.number().optional(),
          to: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        const logs = await getActivityLogs({
          userId: input.userId,
          from: input.from ? new Date(input.from) : undefined,
          to: input.to ? new Date(input.to) : undefined,
          limit: input.limit,
          offset: input.offset,
        });
        return logs;
      }),

    // Get dashboard aggregates for a time range
    getDashboard: protectedProcedure
      .input(
        z.object({
          period: z.enum(["daily", "weekly", "monthly"]),
          referenceDate: z.number().optional(), // UTC timestamp ms
        })
      )
      .query(async ({ input }) => {
        const ref = input.referenceDate ? new Date(input.referenceDate) : new Date();
        let from: Date;
        let to: Date;

        if (input.period === "daily") {
          from = startOfDay(ref);
          to = endOfDay(ref);
        } else if (input.period === "weekly") {
          from = startOfWeek(ref, { weekStartsOn: 1 });
          to = endOfWeek(ref, { weekStartsOn: 1 });
        } else {
          from = startOfMonth(ref);
          to = endOfMonth(ref);
        }

        const [aggregates, totals, members] = await Promise.all([
          getDashboardAggregates({ from, to }),
          getUserTotalMinutes({ from, to }),
          getAllFamilyMembers(),
        ]);

        return { aggregates, totals, members, from: from.getTime(), to: to.getTime() };
      }),

    // Get summary stats
    getStats: protectedProcedure
      .input(
        z.object({
          userId: z.number().int().optional(),
          days: z.number().int().min(1).max(365).default(30),
        })
      )
      .query(async ({ input }) => {
        const to = new Date();
        const from = subDays(to, input.days);

        const [logs, totals, members] = await Promise.all([
          getDashboardAggregates({ from, to }),
          getUserTotalMinutes({ from, to }),
          getAllFamilyMembers(),
        ]);

        return { aggregates: logs, totals, members };
      }),
  }),
});

export type AppRouter = typeof appRouter;
