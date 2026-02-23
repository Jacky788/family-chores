import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { Loader2, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

type Mode = "choose" | "create" | "join";

export default function FamilySetup() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>("choose");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const utils = trpc.useUtils();

  const createFamily = trpc.family.create.useMutation({
    onSuccess: () => {
      utils.family.getMyFamily.invalidate();
      toast.success("Family created! Now set your role.");
      navigate("/setup");
    },
    onError: (err) => toast.error(err.message),
  });

  const joinFamily = trpc.family.join.useMutation({
    onSuccess: (family) => {
      utils.family.getMyFamily.invalidate();
      toast.success(`Joined "${family.name}"! Now set your role.`);
      navigate("/setup");
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">FamilyChores</h1>
          <p className="text-muted-foreground mb-6">Sign in to create or join your family.</p>
          <Button onClick={() => window.location.href = getLoginUrl()} size="lg" className="rounded-xl w-full">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Your Family</h1>
          <p className="text-muted-foreground">
            {mode === "choose"
              ? "Create a new family space or join one with an invite code."
              : mode === "create"
              ? "Give your family a name to get started."
              : "Enter the invite code your family member shared with you."}
          </p>
        </div>

        {/* Mode: choose */}
        {mode === "choose" && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode("create")}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-primary/40 bg-white/70 hover:border-primary hover:bg-white transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-foreground text-sm">Create Family</div>
                <div className="text-xs text-muted-foreground mt-0.5">Start a new family space</div>
              </div>
            </button>

            <button
              onClick={() => setMode("join")}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-emerald-400/60 bg-white/70 hover:border-emerald-500 hover:bg-white transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-foreground text-sm">Join Family</div>
                <div className="text-xs text-muted-foreground mt-0.5">Use an invite code</div>
              </div>
            </button>
          </div>
        )}

        {/* Mode: create */}
        {mode === "create" && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-border p-6 shadow-sm">
            <Label htmlFor="familyName" className="text-sm font-semibold text-foreground mb-2 block">
              Family Name
            </Label>
            <Input
              id="familyName"
              placeholder="e.g. The Smiths, Our Home..."
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="mb-4 text-base"
              onKeyDown={(e) => e.key === "Enter" && familyName.trim() && createFamily.mutate({ name: familyName.trim() })}
              autoFocus
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setMode("choose")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => createFamily.mutate({ name: familyName.trim() })}
                disabled={!familyName.trim() || createFamily.isPending}
                className="flex-1"
              >
                {createFamily.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Family 🏠"}
              </Button>
            </div>
          </div>
        )}

        {/* Mode: join */}
        {mode === "join" && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-border p-6 shadow-sm">
            <Label htmlFor="inviteCode" className="text-sm font-semibold text-foreground mb-2 block">
              Invite Code
            </Label>
            <Input
              id="inviteCode"
              placeholder="e.g. ABCD1234"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="mb-1 text-base font-mono tracking-widest text-center uppercase"
              maxLength={8}
              onKeyDown={(e) => e.key === "Enter" && inviteCode.trim().length === 8 && joinFamily.mutate({ inviteCode: inviteCode.trim() })}
              autoFocus
            />
            <p className="text-xs text-muted-foreground mb-4">Ask a family member to share their 8-character invite code.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setMode("choose")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => joinFamily.mutate({ inviteCode: inviteCode.trim() })}
                disabled={inviteCode.trim().length < 4 || joinFamily.isPending}
                className="flex-1"
              >
                {joinFamily.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Family 🤝"}
              </Button>
            </div>
          </div>
        )}

        {/* Signed in as */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Signed in as <span className="font-medium">{user?.name}</span>
        </p>
      </div>
    </div>
  );
}
