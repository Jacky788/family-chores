import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy, Clock, Star } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

type Period = "daily" | "weekly" | "monthly";

const ROLE_COLORS: Record<string, string> = {
  father: "#6366F1",
  mother: "#EC4899",
  kid: "#22C55E",
};

const ROLE_EMOJI: Record<string, string> = {
  father: "👨",
  mother: "👩",
  kid: "🧒",
};

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function MemberCard({ member, totalMinutes, rank }: {
  member: { id: number; displayName: string | null; familyRole: string | null; name: string | null };
  totalMinutes: number;
  rank: number;
}) {
  const role = member.familyRole ?? "kid";
  const name = member.displayName ?? member.name ?? "Family Member";
  const roleClass = `role-${role}`;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl">{ROLE_EMOJI[role] ?? "👤"}</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground truncate">{name}</div>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize ${roleClass}`}>
              {role}
            </span>
          </div>
          {rank === 1 && <div className="text-2xl">🏆</div>}
          {rank === 2 && <div className="text-2xl">🥈</div>}
          {rank === 3 && <div className="text-2xl">🥉</div>}
        </div>
        <div className="text-2xl font-bold text-primary">{formatMinutes(totalMinutes)}</div>
        <div className="text-xs text-muted-foreground mt-0.5">contributed</div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("weekly");
  const [refDate] = useState(() => Date.now());

  const { data, isLoading } = trpc.activities.getDashboard.useQuery({ period, referenceDate: refDate });

  const memberMap = useMemo(() => {
    const map: Record<number, { id: number; displayName: string | null; familyRole: string | null; name: string | null }> = {};
    data?.members.forEach((m) => { map[m.id] = m; });
    return map;
  }, [data?.members]);

  const totalsMap = useMemo(() => {
    const map: Record<number, number> = {};
    data?.totals.forEach((t) => { map[t.userId] = Number(t.totalMinutes); });
    return map;
  }, [data?.totals]);

  // Ranked members
  const rankedMembers = useMemo(() => {
    return (data?.members ?? [])
      .map((m) => ({ ...m, totalMinutes: totalsMap[m.id] ?? 0 }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [data?.members, totalsMap]);

  // Bar chart data: per member per category
  const barData = useMemo(() => {
    const byMember: Record<number, Record<string, number>> = {};
    data?.aggregates.forEach((agg) => {
      if (!byMember[agg.userId]) byMember[agg.userId] = {};
      byMember[agg.userId][agg.categoryName] = (byMember[agg.userId][agg.categoryName] ?? 0) + Number(agg.totalMinutes);
    });

    return (data?.members ?? []).map((m) => {
      const cats = byMember[m.id] ?? {};
      return {
        name: m.displayName ?? m.name ?? "Member",
        role: m.familyRole ?? "kid",
        total: totalsMap[m.id] ?? 0,
        ...cats,
      };
    });
  }, [data, totalsMap]);

  // Pie chart: task type breakdown across all members
  const pieData = useMemo(() => {
    const byCategory: Record<string, { name: string; icon: string; color: string; value: number }> = {};
    data?.aggregates.forEach((agg) => {
      if (!byCategory[agg.categoryName]) {
        byCategory[agg.categoryName] = { name: agg.categoryName, icon: agg.categoryIcon, color: agg.categoryColor, value: 0 };
      }
      byCategory[agg.categoryName].value += Number(agg.totalMinutes);
    });
    return Object.values(byCategory).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [data?.aggregates]);

  const totalHours = useMemo(() => {
    return Object.values(totalsMap).reduce((s, v) => s + v, 0);
  }, [totalsMap]);

  const periodLabel = { daily: "Today", weekly: "This Week", monthly: "This Month" }[period];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Family Dashboard</h1>
        <p className="text-muted-foreground mt-1">See how everyone is contributing to the household.</p>
      </div>

      {/* Period tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="mb-8">
        <TabsList className="grid w-full grid-cols-3 max-w-xs">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : rankedMembers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-5xl mb-4">🏠</div>
          <p className="text-lg font-medium">No activity logged yet {periodLabel.toLowerCase()}.</p>
          <p className="text-sm mt-1">Start logging household tasks to see contributions here!</p>
        </div>
      ) : (
        <>
          {/* Summary stat */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                <div className="text-2xl font-bold text-foreground">{formatMinutes(totalHours)}</div>
                <div className="text-xs text-muted-foreground">Total {periodLabel}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-foreground truncate">
                  {rankedMembers[0]?.displayName ?? rankedMembers[0]?.name ?? "—"}
                </div>
                <div className="text-xs text-muted-foreground">Top Contributor</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-foreground">{pieData[0]?.name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">Most Done</div>
              </CardContent>
            </Card>
          </div>

          {/* Member leaderboard */}
          <div className="mb-8">
            <h2 className="text-lg font-serif font-semibold text-foreground mb-4">Leaderboard — {periodLabel}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rankedMembers.map((m, i) => (
                <MemberCard key={m.id} member={m} totalMinutes={m.totalMinutes} rank={i + 1} />
              ))}
            </div>
          </div>

          {/* Bar chart */}
          {barData.length > 0 && (
            <Card className="mb-8">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Contribution by Member</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}m`} />
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value}m`, name]}
                      contentStyle={{ borderRadius: "0.75rem", border: "1px solid var(--border)", fontSize: 12 }}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={index} fill={ROLE_COLORS[entry.role] ?? "#6366F1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Pie chart: task breakdown */}
          {pieData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Task Type Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value}m`, name]}
                      contentStyle={{ borderRadius: "0.75rem", border: "1px solid var(--border)", fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                      <span>{entry.icon} {entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
