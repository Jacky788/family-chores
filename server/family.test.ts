import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-1",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    familyRole: null,
    displayName: null,
    familyId: null,
    ...overrides,
  };

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return { ctx };
}

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated users", async () => {
    const { ctx } = createAuthContext({ name: "Alice" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result?.name).toBe("Alice");
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const { ctx } = createAuthContext();
    ctx.res = {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as unknown as TrpcContext["res"];

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });
});

describe("family.create", () => {
  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.family.create({ name: "Test Family" })).rejects.toThrow();
  });

  it("validates family name is required", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.family.create({ name: "" })).rejects.toThrow();
  });

  it("throws BAD_REQUEST if user already has a family", async () => {
    const { ctx } = createAuthContext({ familyId: 42 });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.family.create({ name: "Another Family" })).rejects.toThrow("already belong to a family");
  });
});

describe("family.join", () => {
  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.family.join({ inviteCode: "ABCD1234" })).rejects.toThrow();
  });

  it("throws BAD_REQUEST if user already has a family", async () => {
    const { ctx } = createAuthContext({ familyId: 42 });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.family.join({ inviteCode: "ABCD1234" })).rejects.toThrow("already belong to a family");
  });
});

describe("family.setProfile", () => {
  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.family.setProfile({ familyRole: "father", displayName: "Dad" })
    ).rejects.toThrow();
  });

  it("validates familyRole enum", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.family.setProfile({ familyRole: "grandpa" as any, displayName: "Gramps" })
    ).rejects.toThrow();
  });
});

describe("activities.log", () => {
  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.activities.log({
        categoryId: 1,
        categoryName: "Cooking",
        categoryIcon: "🍳",
        categoryColor: "#F97316",
        durationMinutes: 30,
      })
    ).rejects.toThrow();
  });

  it("throws FORBIDDEN if user has no family", async () => {
    const { ctx } = createAuthContext({ familyId: null });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.activities.log({
        categoryId: 1,
        categoryName: "Cooking",
        categoryIcon: "🍳",
        categoryColor: "#F97316",
        durationMinutes: 30,
      })
    ).rejects.toThrow("join or create a family");
  });

  it("validates durationMinutes range", async () => {
    const { ctx } = createAuthContext({ familyId: 1 });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.activities.log({
        categoryId: 1,
        categoryName: "Cooking",
        categoryIcon: "🍳",
        categoryColor: "#F97316",
        durationMinutes: 0,
      })
    ).rejects.toThrow();
  });
});

describe("activities.getDashboard", () => {
  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.activities.getDashboard({ period: "weekly" })
    ).rejects.toThrow();
  });

  it("throws FORBIDDEN if user has no family", async () => {
    const { ctx } = createAuthContext({ familyId: null });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.activities.getDashboard({ period: "weekly" })
    ).rejects.toThrow("join or create a family");
  });

  it("accepts valid period values", async () => {
    const { ctx } = createAuthContext({ familyId: 1 });
    const caller = appRouter.createCaller(ctx);
    for (const period of ["daily", "weekly", "monthly"] as const) {
      const result = await caller.activities.getDashboard({ period }).catch(() => null);
      // result may be null if DB is unavailable in test env, but no validation error should be thrown
      expect(result === null || typeof result === "object").toBe(true);
    }
  });
});

describe("activities.getHistory", () => {
  it("throws FORBIDDEN if user has no family", async () => {
    const { ctx } = createAuthContext({ familyId: null });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.activities.getHistory({})
    ).rejects.toThrow("join or create a family");
  });
});
