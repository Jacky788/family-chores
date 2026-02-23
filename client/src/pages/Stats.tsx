import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Award } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const ROLE_EMOJI: Record<string, string> = { father: "👨", mother: "👩", kid: "🧒" };
const ROLE_COLORS: Record<string, string> = { father: "#6366F1", mother: "#EC4899", kid: "#22C55E" };
const ROLE_CLASS: Record<string, string> = { father: "role-father", mother: "role-mother", kid: "role-kid" };

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function Stats() {
  const [days, setDays] = useState("30");

  const { data: myFamily, isLoading: familyLoading } = trpc.family.getMyFamily.useQuery();
  const { data, isLoading } = trpc.activities.getStats.useQuery(
    { days: parseInt(days) },
    { enabled: !!myFamily }
  );

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

  const rankedMembers = useMemo(() => {
    return (data?.members ?? [])
      .map((m) => ({ ...m, totalMinutes: totalsMap[m.id] ?? 0 }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [data?.members, totalsMap]);

  // Task breakdown per member
  const memberTaskBreakdown = useMemo(() => {
    const byMember: Record<number, Record<string, { minutes: number; color: string; icon: string }>> = {};
    data?.aggregates.forEach((agg) => {
      if (!byMember[agg.userId]) byMember[agg.userId] = {};
      byMember[agg.userId][agg.categoryName] = {
        minutes: (byMember[agg.userId][agg.categoryName]?.minutes ?? 0) + Number(agg.totalMinutes),
        color: agg.categoryColor,
        icon: agg.categoryIcon,
      };
    });
    return byMember;
  }, [data?.aggregates]);

  // Overall task breakdown (for radar chart)
  const overallTaskData = useMemo(() => {
    const byCategory: Record<string, { name: string; icon: string; value: number }> = {};
    data?.aggregates.forEach((agg) => {
      if (!byCategory[agg.categoryName]) {
        byCategory[agg.categoryName] = { name: agg.categoryName, icon: agg.categoryIcon, value: 0 };
      }
      byCategory[agg.categoryName].value += Number(agg.totalMinutes);
    });
    return Object.values(byCategory).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [data?.aggregates]);

  // Bar chart data
  const barData = useMemo(() => {
    return rankedMembers.map((m) => ({
      name: m.displayName ?? m.name ?? "Member",
      role: m.familyRole ?? "kid",
      minutes: m.totalMinutes,
    }));
  }, [rankedMembers]);

  const totalMinutes = useMemo(() => Object.values(totalsMap).reduce((s, v) => s + v, 0), [totalsMap]);

  if (!familyLoading && !myFamily) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-4xl">🏠</div>
        <p className="text-muted-foreground text-center">You need to join or create a family first.</p>
        <a href="/family-setup" className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">Set Up Your Family</a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Statistics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into your family's contributions.</p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 3 months</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : rankedMembers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-lg font-medium">No data for this period yet.</p>
          <p className="text-sm mt-1">Log some household activities to see statistics here!</p>
        </div>
      ) : (
        <>
          {/* Total summary */}
          <Card className="mb-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-5 flex items-center gap-4">
              <TrendingUp className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <div className="text-3xl font-bold text-primary">{formatMinutes(totalMinutes)}</div>
                <div className="text-sm text-muted-foreground">Total family contribution in the last {days} days</div>
              </div>
            </CardContent>
          </Card>

          {/* Per-member breakdown */}
          <div className="mb-8">
            <h2 className="text-lg font-serif font-semibold text-foreground mb-4">Per Member Breakdown</h2>
            <div className="space-y-4">
              {rankedMembers.map((m, i) => {
                const role = m.familyRole ?? "kid";
                const pct = totalMinutes > 0 ? (m.totalMinutes / totalMinutes) * 100 : 0;
                const tasks = memberTaskBreakdown[m.id] ?? {};
                const topTasks = Object.entries(tasks)
                  .sort(([, a], [, b]) => b.minutes - a.minutes)
                  .slice(0, 4);

                return (
                  <Card key={m.id}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-2xl">{ROLE_EMOJI[role] ?? "👤"}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{m.displayName ?? m.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_CLASS[role]}`}>{role}</span>
                            {i === 0 && <Award className="w-4 h-4 text-amber-500" />}
                          </div>
                          <div className="text-sm text-muted-foreground">{formatMinutes(m.totalMinutes)} · {pct.toFixed(0)}% of family total</div>
                        </div>
                        <div className="text-xl font-bold text-primary">{formatMinutes(m.totalMinutes)}</div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: ROLE_COLORS[role] ?? "#6366F1" }}
                        />
                      </div>

                      {/* Top tasks */}
                      {topTasks.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {topTasks.map(([name, info]) => (
                            <div
                              key={name}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                              style={{ backgroundColor: info.color + "20", color: info.color }}
                            >
                              <span>{info.icon}</span>
                              <span>{name}</span>
                              <span className="font-medium">{formatMinutes(info.minutes)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Bar chart */}
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Hours Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}m`} />
                  <Tooltip
                    formatter={(v: number) => [formatMinutes(v), "Time"]}
                    contentStyle={{ borderRadius: "0.75rem", border: "1px solid var(--border)", fontSize: 12 }}
                  />
                  <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={ROLE_COLORS[entry.role] ?? "#6366F1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Overall task breakdown */}
          {overallTaskData.length >= 3 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Task Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={overallTaskData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis tick={{ fontSize: 10 }} />
                    <Radar dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
