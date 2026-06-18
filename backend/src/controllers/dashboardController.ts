import { Request, Response } from "express";
import { getDashboardSummary } from "../services/dashboardService";
import { evaluateStreak, getEarnedBadges, getNextBadge } from "../services/streakService";
import { getProfile } from "../services/profileService";

export async function getDashboardController(req: Request, res: Response) {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const coords = !isNaN(lat) && !isNaN(lon) ? { lat, lon } : undefined;

  const data = await getDashboardSummary(req.userId!, coords);

  const totalItems = data.tasks.length + data.reminders.length;
  const completed = data.tasks.filter((t) => t.status === "COMPLETED").length
    + data.reminders.filter((r) => r.status === "COMPLETED").length;
  const pct = totalItems + completed === 0 ? 0 : Math.round((completed / (totalItems + completed)) * 100);

  await evaluateStreak(req.userId!, pct);

  const profile = await getProfile(req.userId!);
  const badges = getEarnedBadges(profile.longestStreak);
  const nextBadge = getNextBadge(profile.longestStreak);

  res.json({
    success: true,
    data: {
      ...data,
      streak: {
        current: profile.currentStreak,
        longest: profile.longestStreak,
        dailyGoal: profile.dailyGoal,
        badges,
        nextBadge,
      },
    },
  });
}
