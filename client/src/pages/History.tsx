import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const ROLE_EMOJI: Record<string, string> = { father: "👨", mother: "👩", kid: "🧒" };
const ROLE_CLASS: Record<string, string> = { father: "role-father", mother: "role-mother", kid: "role-kid" };

export default function History() {
  const [filterUserId, setFilterUserId] = useState<string>("all");

  const { data: myFamily, isLoading: familyLoading } = trpc.family.getMyFamily.useQuery();
  const members = myFamily?.members;

  const { data: logs, isLoading } = trpc.activities.getHistory.useQuery(
    {
      userId: filterUserId !== "all" ? parseInt(filterUserId) : undefined,
      limit: 100,
      offset: 0,
    },
    { enabled: !!myFamily }
  );

  const memberMap = useMemo(() => {
    const map: Record<number, { displayName: string | null; familyRole: string | null; name: string | null }> = {};
    members?.forEach((m: any) => { map[m.id] = m; });
    return map;
  }, [members]);

  // Group logs by date
  const groupedLogs = useMemo(() => {
    if (!logs) return [];
    const groups: Record<string, typeof logs> = {};
    logs.forEach((log) => {
      const dateKey = format(new Date(log.loggedAt), "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(log);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({ date, items }));
  }, [logs]);

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
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Activity History</h1>
          <p className="text-muted-foreground mt-1">A record of all household contributions.</p>
        </div>

        {/* Filter */}
        <Select value={filterUserId} onValueChange={setFilterUserId}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All members" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            {members?.map((m: any) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {ROLE_EMOJI[m.familyRole ?? "kid"]} {m.displayName ?? m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : groupedLogs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-lg font-medium">No activities logged yet.</p>
          <p className="text-sm mt-1">Start logging household tasks to see your history here!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedLogs.map(({ date, items }) => {
            const totalMin = items.reduce((s, i) => s + i.durationMinutes, 0);
            const dateObj = new Date(date + "T00:00:00");
            const isToday = format(new Date(), "yyyy-MM-dd") === date;

            return (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold text-sm text-foreground">
                      {isToday ? "Today" : format(dateObj, "EEEE, MMMM d")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatMinutes(totalMin)} total</span>
                  </div>
                </div>

                {/* Log items */}
                <div className="space-y-2">
                  {items.map((log) => {
                    const member = memberMap[log.userId];
                    const role = member?.familyRole ?? "kid";

                    return (
                      <Card key={log.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            {/* Category icon */}
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                              style={{ backgroundColor: log.categoryColor + "20" }}
                            >
                              {log.categoryIcon}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-foreground text-sm">{log.categoryName}</span>
                                {member && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_CLASS[role]}`}>
                                    {ROLE_EMOJI[role]} {member.displayName ?? member.name}
                                  </span>
                                )}
                              </div>
                              {log.customNote && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.customNote}</p>
                              )}
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {format(new Date(log.loggedAt), "h:mm a")}
                              </div>
                            </div>

                            {/* Duration */}
                            <div className="text-right flex-shrink-0">
                              <div className="font-bold text-primary text-sm">{formatMinutes(log.durationMinutes)}</div>
                              <div
                                className="text-xs mt-0.5"
                                style={{ color: log.categoryColor }}
                              >
                                {log.durationMinutes >= 90 ? "🏆 Epic" : log.durationMinutes >= 45 ? "🎉 Great" : log.durationMinutes >= 20 ? "⭐ Good" : "✨ Quick"}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
