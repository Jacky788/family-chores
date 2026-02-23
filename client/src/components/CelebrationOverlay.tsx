import { useEffect, useState } from "react";
import { CelebrationLevel, getCelebrationEmoji, getCelebrationLevel } from "@/hooks/useCelebration";

interface CelebrationOverlayProps {
  durationMinutes: number;
  taskName: string;
  message: string;
  onDismiss: () => void;
}

export default function CelebrationOverlay({
  durationMinutes,
  taskName,
  message,
  onDismiss,
}: CelebrationOverlayProps) {
  const level = getCelebrationLevel(durationMinutes);
  const emojis = getCelebrationEmoji(level);
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; emoji: string; x: number; delay: number }>>([]);

  useEffect(() => {
    const count = level === "epic" ? 14 : level === "large" ? 10 : level === "medium" ? 6 : 4;
    const items = Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      x: 10 + Math.random() * 80,
      delay: Math.random() * 0.8,
    }));
    setFloatingEmojis(items);

    const timer = setTimeout(onDismiss, level === "epic" ? 4000 : level === "large" ? 3500 : 3000);
    return () => clearTimeout(timer);
  }, [level]);

  const sizeMap: Record<CelebrationLevel, string> = {
    small: "text-4xl",
    medium: "text-5xl",
    large: "text-6xl",
    epic: "text-7xl",
  };

  const bgMap: Record<CelebrationLevel, string> = {
    small: "from-amber-50/95 to-orange-50/95",
    medium: "from-amber-50/95 to-yellow-50/95",
    large: "from-orange-50/95 to-rose-50/95",
    epic: "from-yellow-50/95 to-amber-50/95",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onDismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Floating emojis */}
      {floatingEmojis.map((item) => (
        <div
          key={item.id}
          className="float-emoji absolute bottom-1/3 text-3xl pointer-events-none select-none"
          style={{
            left: `${item.x}%`,
            animationDelay: `${item.delay}s`,
            fontSize: level === "epic" ? "2.5rem" : "2rem",
          }}
        >
          {item.emoji}
        </div>
      ))}

      {/* Main card */}
      <div
        className={`celebration-pop relative z-10 bg-gradient-to-br ${bgMap[level]} rounded-3xl shadow-2xl border border-white/80 p-8 max-w-sm w-full mx-4 text-center`}
      >
        {/* Main emoji */}
        <div className={`${sizeMap[level]} mb-3 select-none`}>
          {emojis[0]}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
          {level === "epic" ? "Legendary!" : level === "large" ? "Outstanding!" : level === "medium" ? "Great Work!" : "Nice!"}
        </h2>

        {/* Message */}
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {message}
        </p>

        {/* Duration badge */}
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
          <span>⏱</span>
          <span>{durationMinutes} min — {taskName}</span>
        </div>

        {/* Tap to dismiss hint */}
        <p className="text-xs text-muted-foreground mt-4 opacity-60">Tap anywhere to dismiss</p>
      </div>
    </div>
  );
}
