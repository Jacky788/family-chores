import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createFamily,
  getActivityCategories,
  getActivityLogs,
  getDashboardAggregates,
  getFamilyById,
  getFamilyMembers,
  getUserTotalMinutes,
  insertActivityLog,
  joinFamilyByCode,
  regenerateInviteCode,
  seedDefaultCategories,
  updateUserProfile,
} from "./db";
import {
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  subDays,
} from "date-fns";

// Seed default categories on startup
seedDefaultCategories().catch(console.error);

// Helper: assert the calling user belongs to a family
async function requireFamilyMember(user: { id: number; familyId: number | null | undefined }) {
  if (!user.familyId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You must join or create a family first." });
  }
  return user.familyId;
}

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

  // ─── Family management ─────────────────────────────────────────────────────
  family: router({
    // Get the current user's family info + members
    getMyFamily: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.familyId) return null;
      const [family, members] = await Promise.all([
        getFamilyById(ctx.user.familyId),
        getFamilyMembers(ctx.user.familyId),
      ]);
      return family ? { ...family, members } : null;
    }),

    // Create a new family (also assigns the creator to it)
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(64) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.familyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You already belong to a family." });
        }
        const family = await createFamily(input.name, ctx.user.id);
        return family;
      }),

    // Join an existing family by invite code
    join: protectedProcedure
      .input(z.object({ inviteCode: z.string().min(1).max(16) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.familyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You already belong to a family." });
        }
        const family = await joinFamilyByCode(input.inviteCode, ctx.user.id);
        return family;
      }),

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

    // Regenerate invite code (creator only)
    regenerateInviteCode: protectedProcedure.mutation(async ({ ctx }) => {
      const familyId = await requireFamilyMember(ctx.user);
      const newCode = await regenerateInviteCode(familyId, ctx.user.id);
      return { inviteCode: newCode };
    }),
  }),

  // ─── Activities ────────────────────────────────────────────────────────────
  activities: router({
    getCategories: publicProcedure.query(async () => {
      return getActivityCategories();
    }),

    log: protectedProcedure
      .input(
        z.object({
          categoryId: z.number().int().positive(),
          categoryName: z.string(),
          categoryIcon: z.string(),
          categoryColor: z.string(),
          durationMinutes: z.number().int().min(1).max(1440),
          customNote: z.string().max(200).optional(),
          loggedAt: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const familyId = await requireFamilyMember(ctx.user);
        const loggedAt = input.loggedAt ? new Date(input.loggedAt) : new Date();
        const id = await insertActivityLog({
          userId: ctx.user.id,
          familyId,
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
      .query(async ({ ctx, input }) => {
        const familyId = await requireFamilyMember(ctx.user);
        return getActivityLogs({
          familyId,
          userId: input.userId,
          from: input.from ? new Date(input.from) : undefined,
          to: input.to ? new Date(input.to) : undefined,
          limit: input.limit,
          offset: input.offset,
        });
      }),

    getDashboard: protectedProcedure
      .input(
        z.object({
          period: z.enum(["daily", "weekly", "monthly"]),
          referenceDate: z.number().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const familyId = await requireFamilyMember(ctx.user);
        const ref = input.referenceDate ? new Date(input.referenceDate) : new Date();
        let from: Date, to: Date;

        if (input.period === "daily") {
          from = startOfDay(ref); to = endOfDay(ref);
        } else if (input.period === "weekly") {
          from = startOfWeek(ref, { weekStartsOn: 1 }); to = endOfWeek(ref, { weekStartsOn: 1 });
        } else {
          from = startOfMonth(ref); to = endOfMonth(ref);
        }

        const [aggregates, totals, members] = await Promise.all([
          getDashboardAggregates({ familyId, from, to }),
          getUserTotalMinutes({ familyId, from, to }),
          getFamilyMembers(familyId),
        ]);

        return { aggregates, totals, members, from: from.getTime(), to: to.getTime() };
      }),

    getStats: protectedProcedure
      .input(
        z.object({
          userId: z.number().int().optional(),
          days: z.number().int().min(1).max(365).default(30),
        })
      )
      .query(async ({ ctx, input }) => {
        const familyId = await requireFamilyMember(ctx.user);
        const to = new Date();
        const from = subDays(to, input.days);

        const [aggregates, totals, members] = await Promise.all([
          getDashboardAggregates({ familyId, from, to }),
          getUserTotalMinutes({ familyId, from, to }),
          getFamilyMembers(familyId),
        ]);

        return { aggregates, totals, members };
      }),
  }),
});

export type AppRouter = typeof appRouter;
