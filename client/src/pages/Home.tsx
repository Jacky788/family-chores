import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useMemo } from "react";
import { Clock, BarChart3, ListChecks, Star } from "lucide-react";

const ROLE_EMOJI: Record<string, string> = { father: "👨", mother: "👩", kid: "🧒" };
const ROLE_CLASS: Record<string, string> = { father: "role-father", mother: "role-mother", kid: "role-kid" };

function formatMinutes(minutes: number): string {
  if (!minutes) return "0m";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: myFamily } = trpc.family.getMyFamily.useQuery(undefined, { enabled: isAuthenticated });
  const members = myFamily?.members;
  const [refDate] = useMemo(() => [Date.now()], []);
  const { data: weeklyData } = trpc.activities.getDashboard.useQuery(
    { period: "weekly", referenceDate: refDate },
    { enabled: isAuthenticated && !!myFamily }
  );

  const totalsMap = useMemo(() => {
    const map: Record<number, number> = {};
    weeklyData?.totals.forEach((t) => { map[t.userId] = Number(t.totalMinutes); });
    return map;
  }, [weeklyData?.totals]);

  const topMember = useMemo(() => {
    if (!weeklyData?.members.length) return null;
    return [...(weeklyData.members)].sort((a: any, b: any) => (totalsMap[b.id] ?? 0) - (totalsMap[a.id] ?? 0))[0];
  }, [weeklyData?.members, totalsMap]);

  const totalWeeklyMin = useMemo(() => Object.values(totalsMap).reduce((s, v) => s + v, 0), [totalsMap]);

  const currentUserProfile = useMemo(() => {
    if (!user) return null;
    return members?.find((m: any) => m.id === user.id) ?? null;
  }, [user, members]);

  const needsRoleSetup = isAuthenticated && !loading && myFamily && !currentUserProfile?.familyRole;
  const needsFamilySetup = isAuthenticated && !loading && myFamily === null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🏠</div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in — landing page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex flex-col">
        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16">
          <div className="text-7xl mb-6">🏠</div>
          <h1 className="text-5xl font-serif font-bold text-foreground mb-4 leading-tight">
            FamilyChores
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mb-2">
            Track and celebrate every household contribution your family makes together.
          </p>
          <p className="text-sm text-muted-foreground max-w-sm mb-10">
            From cooking to cleaning, every effort counts. See who's doing what, celebrate big tasks, and keep the home running smoothly.
          </p>

          <Button
            size="lg"
            className="h-12 px-8 text-base rounded-xl"
            onClick={() => window.location.href = getLoginUrl()}
          >
            Get Started — It's Free
          </Button>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-2xl w-full">
            {[
              { icon: "👨‍👩‍👧", label: "Family Roles", desc: "Father, Mother, or Kid" },
              { icon: "📝", label: "Easy Logging", desc: "Pre-filled defaults" },
              { icon: "🎉", label: "Celebrations", desc: "Scaled to effort" },
              { icon: "📊", label: "Dashboard", desc: "Daily, weekly, monthly" },
            ].map((f) => (
              <div key={f.label} className="bg-white/70 rounded-2xl p-4 text-center border border-white/80 shadow-sm">
                <div className="text-3xl mb-2">{f.icon}</div>
                <div className="font-semibold text-sm text-foreground">{f.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Needs family setup
  if (needsFamilySetup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Welcome, {user?.name}!</h2>
          <p className="text-muted-foreground mb-6">Create a new family or join an existing one to get started.</p>
          <Button onClick={() => navigate("/family-setup")} size="lg" className="rounded-xl">
            Set Up Your Family
          </Button>
        </div>
      </div>
    );
  }

  // Needs role setup
  if (needsRoleSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">👋</div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">One more step!</h2>
          <p className="text-muted-foreground mb-6">Choose your role in the {myFamily?.name} family.</p>
          <Button onClick={() => navigate("/setup")} size="lg" className="rounded-xl">
            Set Up My Role
          </Button>
        </div>
      </div>
    );
  }

  // Logged in home dashboard
  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Welcome */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">{ROLE_EMOJI[currentUserProfile?.familyRole ?? "kid"] ?? "👤"}</span>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">
              Hello, {currentUserProfile?.displayName ?? user?.name}!
            </h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_CLASS[currentUserProfile?.familyRole ?? "kid"]}`}>
              {currentUserProfile?.familyRole ?? "Member"}
            </span>
          </div>
        </div>
        <p className="text-muted-foreground mt-2">Ready to make a difference at home today?</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { icon: <Clock className="w-5 h-5" />, label: "Log Activity", path: "/log", color: "bg-primary text-primary-foreground" },
          { icon: <BarChart3 className="w-5 h-5" />, label: "Dashboard", path: "/dashboard", color: "bg-card text-foreground border border-border" },
          { icon: <ListChecks className="w-5 h-5" />, label: "History", path: "/history", color: "bg-card text-foreground border border-border" },
          { icon: <Star className="w-5 h-5" />, label: "Statistics", path: "/stats", color: "bg-card text-foreground border border-border" },
        ].map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl font-medium text-sm transition-all hover:scale-[1.03] cursor-pointer shadow-sm ${action.color}`}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      {/* This week summary */}
      {weeklyData && (
        <div className="mb-8">
          <h2 className="text-lg font-serif font-semibold text-foreground mb-4">This Week's Contributions</h2>

          {weeklyData.members.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>No activities logged this week yet. Be the first!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {[...weeklyData.members]
                .sort((a, b) => (totalsMap[b.id] ?? 0) - (totalsMap[a.id] ?? 0))
                .map((m, i) => {
                  const role = m.familyRole ?? "kid";
                  const min = totalsMap[m.id] ?? 0;
                  const pct = totalWeeklyMin > 0 ? (min / totalWeeklyMin) * 100 : 0;

                  return (
                    <Card key={m.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{ROLE_EMOJI[role]}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-foreground">{m.displayName ?? m.name}</span>
                              {i === 0 && min > 0 && <span className="text-sm">🏆</span>}
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: role === "father" ? "#6366F1" : role === "mother" ? "#EC4899" : "#22C55E",
                                }}
                              />
                            </div>
                          </div>
                          <span className="font-bold text-primary text-sm flex-shrink-0">{formatMinutes(min)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Top contributor callout */}
      {topMember && (totalsMap[topMember.id] ?? 0) > 0 && (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="text-4xl">🏆</div>
            <div>
              <div className="font-semibold text-foreground">
                {topMember.displayName ?? topMember.name} is leading this week!
              </div>
              <div className="text-sm text-muted-foreground">
                {formatMinutes(totalsMap[topMember.id] ?? 0)} of household work — keep it up!
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
