import { prisma } from "../lib/prisma";

export type Badge = {
  name: string;
  tier: string;
  milestone: number;
};

const BADGES: Badge[] = [
  { name: "Shell", tier: "shell", milestone: 3 },
  { name: "Pearl", tier: "pearl", milestone: 7 },
  { name: "Wave", tier: "wave", milestone: 14 },
  { name: "Anchor", tier: "anchor", milestone: 30 },
];

export function getEarnedBadges(longestStreak: number): Badge[] {
  return BADGES.filter((b) => longestStreak >= b.milestone);
}

export function getNextBadge(longestStreak: number): Badge | null {
  return BADGES.find((b) => longestStreak < b.milestone) ?? null;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function evaluateStreak(userId: string, completionPct: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const today = startOfDay(new Date());
  const lastDate = user.lastStreakDate ? startOfDay(user.lastStreakDate) : null;

  if (lastDate && lastDate.getTime() === today.getTime()) return;

  if (completionPct < user.dailyGoal) return;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isConsecutive = lastDate && lastDate.getTime() === yesterday.getTime();
  const newStreak = isConsecutive ? user.currentStreak + 1 : 1;
  const newLongest = Math.max(user.longestStreak, newStreak);

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastStreakDate: today,
    },
  });
}
