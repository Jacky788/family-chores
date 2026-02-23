import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type FamilyRole = "father" | "mother" | "kid";

const ROLES: { value: FamilyRole; label: string; emoji: string; description: string; gradient: string; border: string }[] = [
  {
    value: "father",
    label: "Father",
    emoji: "👨",
    description: "The dad of the family",
    gradient: "from-blue-50 to-indigo-50",
    border: "border-blue-200 hover:border-blue-400",
  },
  {
    value: "mother",
    label: "Mother",
    emoji: "👩",
    description: "The mom of the family",
    gradient: "from-rose-50 to-pink-50",
    border: "border-rose-200 hover:border-rose-400",
  },
  {
    value: "kid",
    label: "Kid",
    emoji: "🧒",
    description: "A child of the family",
    gradient: "from-green-50 to-emerald-50",
    border: "border-green-200 hover:border-green-400",
  },
];

const SELECTED_BORDER: Record<FamilyRole, string> = {
  father: "border-blue-500 ring-2 ring-blue-200",
  mother: "border-rose-500 ring-2 ring-rose-200",
  kid: "border-green-500 ring-2 ring-green-200",
};

export default function RoleSetup() {
  const [, navigate] = useLocation();
  const [selectedRole, setSelectedRole] = useState<FamilyRole | null>(null);
  const [displayName, setDisplayName] = useState("");

  const setProfile = trpc.family.setProfile.useMutation({
    onSuccess: () => {
      toast.success("Welcome to the family! 🏠");
      navigate("/");
    },
    onError: (err) => {
      toast.error("Failed to save profile: " + err.message);
    },
  });

  const handleSubmit = () => {
    if (!selectedRole || !displayName.trim()) return;
    setProfile.mutate({ familyRole: selectedRole, displayName: displayName.trim() });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Welcome Home</h1>
          <p className="text-muted-foreground text-lg">
            Choose your role in the family to start tracking your contributions.
          </p>
        </div>

        {/* Role selection */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {ROLES.map((role) => (
            <button
              key={role.value}
              onClick={() => setSelectedRole(role.value)}
              className={`
                relative rounded-2xl border-2 p-5 text-center transition-all duration-200 cursor-pointer
                bg-gradient-to-br ${role.gradient} ${role.border}
                ${selectedRole === role.value ? SELECTED_BORDER[role.value] : ""}
              `}
            >
              {selectedRole === role.value && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <div className="text-4xl mb-2">{role.emoji}</div>
              <div className="font-semibold text-foreground text-sm">{role.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{role.description}</div>
            </button>
          ))}
        </div>

        {/* Display name */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-border p-6 mb-6 shadow-sm">
          <Label htmlFor="displayName" className="text-sm font-medium text-foreground mb-2 block">
            What should we call you?
          </Label>
          <Input
            id="displayName"
            placeholder={selectedRole === "father" ? "e.g. Dad, Papa, John..." : selectedRole === "mother" ? "e.g. Mom, Mama, Sarah..." : "e.g. Alex, Lily..."}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="text-base"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedRole || !displayName.trim() || setProfile.isPending}
          className="w-full h-12 text-base font-medium rounded-xl"
          size="lg"
        >
          {setProfile.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Setting up...</>
          ) : (
            "Join the Family 🏠"
          )}
        </Button>
      </div>
    </div>
  );
}
