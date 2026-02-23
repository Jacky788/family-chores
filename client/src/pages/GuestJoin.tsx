import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Home, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const ROLES = [
  { value: "father", label: "Father", emoji: "👨", desc: "Dad of the family" },
  { value: "mother", label: "Mother", emoji: "👩", desc: "Mom of the family" },
  { value: "kid", label: "Kid", emoji: "🧒", desc: "Child of the family" },
] as const;

type Role = "father" | "mother" | "kid";

export default function GuestJoin() {
  const params = useParams<{ code?: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [inviteCode, setInviteCode] = useState(params.code?.toUpperCase() ?? "");
  const [displayName, setDisplayName] = useState("");
  const [familyRole, setFamilyRole] = useState<Role>("kid");
  const [step, setStep] = useState<"form" | "success">("form");
  const [familyName, setFamilyName] = useState("");

  // If already authenticated, redirect home
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const guestJoin = trpc.family.guestJoin.useMutation({
    onSuccess: (data) => {
      setFamilyName(data.familyName);
      setStep("success");
      // Redirect to home after a short delay so the session cookie is set
      setTimeout(() => {
        window.location.href = "/";
      }, 2200);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !displayName.trim()) return;
    guestJoin.mutate({
      inviteCode: inviteCode.trim().toUpperCase(),
      displayName: displayName.trim(),
      familyRole,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
            Welcome to {familyName}!
          </h2>
          <p className="text-muted-foreground mb-2">
            You've joined as <strong>{displayName}</strong>.
          </p>
          <p className="text-sm text-muted-foreground">Taking you home…</p>
          <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🏠</div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Join Your Family</h1>
        <p className="text-muted-foreground mt-1 max-w-xs">
          Enter the invite code shared by your family member to get started — no account needed.
        </p>
      </div>

      <Card className="w-full max-w-sm shadow-lg border-0 bg-white/90 backdrop-blur">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Invite code */}
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-sm font-medium">
                Family Invite Code
              </Label>
              <Input
                id="code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. KO5EJWJJ"
                maxLength={16}
                className="font-mono text-center tracking-widest text-lg uppercase"
                autoComplete="off"
                autoFocus={!params.code}
              />
              <p className="text-xs text-muted-foreground">
                Ask a family member to share their invite code with you.
              </p>
            </div>

            {/* Display name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Your Name
              </Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Mommy, Jake, Dad…"
                maxLength={64}
                autoFocus={!!params.code}
              />
            </div>

            {/* Role selection */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Your Role</Label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setFamilyRole(r.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all cursor-pointer text-center ${
                      familyRole === r.value
                        ? "border-primary bg-primary/5"
                        : "border-border bg-white hover:border-primary/40"
                    }`}
                  >
                    <span className="text-2xl">{r.emoji}</span>
                    <span className="text-xs font-semibold text-foreground">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {guestJoin.error && (
              <p className="text-sm text-destructive text-center">
                {guestJoin.error.message}
              </p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-11 rounded-xl text-base"
              disabled={!inviteCode.trim() || !displayName.trim() || guestJoin.isPending}
            >
              {guestJoin.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Joining…</>
              ) : (
                "Join Family 🏠"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Already have a Manus account?{" "}
              <a href="/" className="text-primary underline underline-offset-2">
                Sign in instead
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground text-center max-w-xs">
        Guest accounts are tied to this device. Your activity data is saved and visible to all family members.
      </p>
    </div>
  );
}
