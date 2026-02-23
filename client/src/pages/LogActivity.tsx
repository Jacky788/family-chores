import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Loader2, Clock, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { useCelebration, getCelebrationMessage } from "@/hooks/useCelebration";
import CelebrationOverlay from "@/components/CelebrationOverlay";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

interface CelebrationState {
  durationMinutes: number;
  taskName: string;
  message: string;
}

export default function LogActivity() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { celebrate } = useCelebration();
  const utils = trpc.useUtils();

  const { data: myFamily, isLoading: familyLoading } = trpc.family.getMyFamily.useQuery(undefined, { enabled: !!user });

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{
    id: number; name: string; icon: string; color: string; defaultDuration: number;
  } | null>(null);
  const [duration, setDuration] = useState(30);
  const [note, setNote] = useState("");
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);

  const { data: categories, isLoading: loadingCats } = trpc.activities.getCategories.useQuery();

  const logActivity = trpc.activities.log.useMutation({
    onSuccess: () => {
      celebrate(duration);
      setCelebration({
        durationMinutes: duration,
        taskName: selectedCategory?.name ?? "Task",
        message: getCelebrationMessage(duration, selectedCategory?.name ?? "Task"),
      });
      utils.activities.getHistory.invalidate();
      utils.activities.getDashboard.invalidate();
      utils.activities.getStats.invalidate();
      // Reset form
      setSelectedCategoryId(null);
      setSelectedCategory(null);
      setDuration(30);
      setNote("");
    },
    onError: (err) => {
      toast.error("Failed to log activity: " + err.message);
    },
  });

  const handleCategorySelect = (cat: { id: number; name: string; icon: string; color: string; defaultDuration: number }) => {
    setSelectedCategoryId(cat.id);
    setSelectedCategory(cat);
    setDuration(cat.defaultDuration);
  };

  const handleSubmit = () => {
    if (!selectedCategory) return;
    logActivity.mutate({
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      categoryIcon: selectedCategory.icon,
      categoryColor: selectedCategory.color,
      durationMinutes: duration,
      customNote: note || undefined,
    });
  };

  const durationLabel = useMemo(() => {
    if (duration < 60) return `${duration} min`;
    const h = Math.floor(duration / 60);
    const m = duration % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }, [duration]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please sign in to log activities.</p>
      </div>
    );
  }

  if (!familyLoading && myFamily === null) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-4xl">🏠</div>
        <p className="text-muted-foreground text-center">You need to join or create a family first.</p>
        <Button onClick={() => navigate("/family-setup")} className="rounded-xl">Set Up Your Family</Button>
      </div>
    );
  }

  return (
    <>
      {celebration && (
        <CelebrationOverlay
          durationMinutes={celebration.durationMinutes}
          taskName={celebration.taskName}
          message={celebration.message}
          onDismiss={() => setCelebration(null)}
        />
      )}

      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground">Log Activity</h1>
          <p className="text-muted-foreground mt-1">Record what you did around the house today.</p>
        </div>

        {/* Category picker */}
        <div className="mb-8">
          <Label className="text-sm font-semibold text-foreground mb-3 block">What did you do?</Label>
          {loadingCats ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading activities...</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className={`
                    flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-150 cursor-pointer
                    ${selectedCategoryId === cat.id
                      ? "border-primary bg-primary/8 shadow-sm scale-[1.03]"
                      : "border-border bg-card hover:border-primary/40 hover:bg-accent/50"
                    }
                  `}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-medium text-foreground text-center leading-tight">{cat.name}</span>
                  <span className="text-[10px] text-muted-foreground">{cat.defaultDuration}m</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Duration control */}
        {selectedCategory && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                How long did it take?
              </Label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDuration(Math.max(5, duration - 5))}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xl font-bold text-primary min-w-[80px] text-center">{durationLabel}</span>
                <button
                  onClick={() => setDuration(Math.min(480, duration + 5))}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <Slider
              value={[duration]}
              onValueChange={([v]) => setDuration(v)}
              min={5}
              max={240}
              step={5}
              className="mb-3"
            />

            {/* Quick presets */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[15, 30, 45, 60, 90, 120].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setDuration(preset)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    duration === preset
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {preset < 60 ? `${preset}m` : `${preset / 60}h`}
                </button>
              ))}
            </div>

            {/* Effort indicator */}
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (duration / 120) * 100)}%`,
                    background: duration >= 90 ? "#FF6B6B" : duration >= 45 ? "#FFD93D" : duration >= 20 ? "#6BCB77" : "#4D96FF",
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {duration >= 90 ? "🏆 Epic effort!" : duration >= 45 ? "🎉 Great effort!" : duration >= 20 ? "⭐ Good effort!" : "✨ Quick task!"}
              </span>
            </div>
          </div>
        )}

        {/* Note */}
        {selectedCategory && (
          <div className="mb-6">
            <Label className="text-sm font-semibold text-foreground mb-2 block">Add a note (optional)</Label>
            <Textarea
              placeholder="Any details about what you did..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              className="resize-none"
              rows={2}
            />
          </div>
        )}

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedCategory || logActivity.isPending}
          className="w-full h-12 text-base font-medium rounded-xl"
          size="lg"
        >
          {logActivity.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging...</>
          ) : (
            <>Log Activity {selectedCategory ? `— ${selectedCategory.icon} ${durationLabel}` : ""}</>
          )}
        </Button>
      </div>
    </>
  );
}
