import confetti from "canvas-confetti";
import { useCallback } from "react";

export type CelebrationLevel = "small" | "medium" | "large" | "epic";

export function getCelebrationLevel(durationMinutes: number): CelebrationLevel {
  if (durationMinutes >= 90) return "epic";
  if (durationMinutes >= 45) return "large";
  if (durationMinutes >= 20) return "medium";
  return "small";
}

export function getCelebrationMessage(durationMinutes: number, taskName: string): string {
  if (durationMinutes >= 90) return `🏆 Incredible! ${durationMinutes} minutes on ${taskName}! You're a household hero!`;
  if (durationMinutes >= 45) return `🎉 Amazing work! ${durationMinutes} minutes on ${taskName}! That's dedication!`;
  if (durationMinutes >= 20) return `⭐ Great job! ${durationMinutes} minutes on ${taskName}! Keep it up!`;
  return `✨ Nice one! ${taskName} done!`;
}

export function getCelebrationEmoji(level: CelebrationLevel): string[] {
  switch (level) {
    case "epic": return ["🏆", "🎊", "🌟", "🥇", "🎉"];
    case "large": return ["🎉", "⭐", "🌟", "👏"];
    case "medium": return ["⭐", "👍", "✨"];
    case "small": return ["✨", "👍"];
  }
}

export function useCelebration() {
  const celebrate = useCallback((durationMinutes: number) => {
    const level = getCelebrationLevel(durationMinutes);

    const colors = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF922B", "#CC5DE8"];

    if (level === "small") {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
        colors,
        scalar: 0.8,
      });
    } else if (level === "medium") {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        colors,
      });
    } else if (level === "large") {
      // Two bursts
      confetti({ particleCount: 100, spread: 80, origin: { x: 0.3, y: 0.6 }, colors });
      setTimeout(() => {
        confetti({ particleCount: 100, spread: 80, origin: { x: 0.7, y: 0.6 }, colors });
      }, 200);
    } else {
      // Epic: multiple bursts + stars
      const fire = (opts: confetti.Options) => confetti({ ...opts, colors });
      fire({ particleCount: 120, spread: 100, origin: { x: 0.5, y: 0.5 } });
      setTimeout(() => fire({ particleCount: 80, spread: 120, origin: { x: 0.2, y: 0.7 }, angle: 60 }), 150);
      setTimeout(() => fire({ particleCount: 80, spread: 120, origin: { x: 0.8, y: 0.7 }, angle: 120 }), 300);
      setTimeout(() => fire({ particleCount: 60, spread: 60, origin: { x: 0.5, y: 0.3 }, shapes: ["star"] }), 500);
      setTimeout(() => fire({ particleCount: 40, spread: 80, origin: { x: 0.5, y: 0.6 }, scalar: 1.5 }), 700);
    }
  }, []);

  return { celebrate };
}
