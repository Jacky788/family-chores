import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, RefreshCw, Share2, QrCode } from "lucide-react";
import { toast } from "sonner";

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteModal({ open, onOpenChange }: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: myFamily, refetch } = trpc.family.getMyFamily.useQuery(undefined, { enabled: open });
  const regenerate = trpc.family.regenerateInviteCode.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("New invite code generated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const inviteCode = myFamily?.inviteCode ?? "";
  const familyName = myFamily?.name ?? "your family";
  const joinLink = `${window.location.origin}/join/${inviteCode}`;

  const copyCode = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success("Invite code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(joinLink);
    setCopiedLink(true);
    toast.success("Join link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${familyName} on FamilyChores`,
          text: `Use code ${inviteCode} or click the link to join our family on FamilyChores!`,
          url: joinLink,
        });
      } catch {
        // User cancelled share
      }
    } else {
      copyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <span>🏠</span> Invite Family Members
          </DialogTitle>
          <DialogDescription>
            Share the code or link below. Anyone with it can join <strong>{familyName}</strong> — no Manus account needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Invite code display */}
          <div className="bg-muted rounded-2xl p-5 text-center">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Invite Code</p>
            <div className="font-mono text-4xl font-bold tracking-[0.25em] text-foreground select-all">
              {inviteCode || "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Share this code with family members
            </p>
          </div>

          {/* Copy code button */}
          <Button
            onClick={copyCode}
            variant="default"
            className="w-full h-11 rounded-xl gap-2"
            disabled={!inviteCode}
          >
            {copied ? (
              <><Check className="w-4 h-4" /> Copied!</>
            ) : (
              <><Copy className="w-4 h-4" /> Copy Code</>
            )}
          </Button>

          {/* Join link section */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or share a link</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={copyLink}
              variant="outline"
              className="flex-1 h-10 rounded-xl gap-2 text-sm"
              disabled={!inviteCode}
            >
              {copiedLink ? (
                <><Check className="w-3.5 h-3.5" /> Copied!</>
              ) : (
                <><Copy className="w-3.5 h-3.5" /> Copy Link</>
              )}
            </Button>
            <Button
              onClick={shareLink}
              variant="outline"
              className="flex-1 h-10 rounded-xl gap-2 text-sm"
              disabled={!inviteCode}
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </Button>
          </div>

          {/* Join link preview */}
          {inviteCode && (
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground break-all font-mono">{joinLink}</p>
            </div>
          )}

          {/* Regenerate code (family creator only — silently fails for non-creators) */}
          <div className="pt-1 border-t border-border">
            <Button
              onClick={() => regenerate.mutate()}
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-foreground gap-2 text-xs"
              disabled={regenerate.isPending}
            >
              <RefreshCw className={`w-3 h-3 ${regenerate.isPending ? "animate-spin" : ""}`} />
              Generate new code (resets old one)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
