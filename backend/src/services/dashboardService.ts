import { prisma } from "../lib/prisma";
import { getWeather } from "./weatherService";

export async function getDashboardSummary(userId: string, lat?: number, lon?: number) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [events, tasks, reminders, weather] = await Promise.all([
    prisma.event.findMany({
      where: { userId, startAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { startAt: "asc" },
    }),
    prisma.task.findMany({
      where: { userId, status: "UPCOMING", dueDate: { lte: todayEnd } },
    }),
    prisma.reminder.findMany({
      where: { userId, status: "UPCOMING", scheduledAt: { gte: todayStart, lte: todayEnd } },
    }),
    lat !== undefined && lon !== undefined ? getWeather(lat, lon) : Promise.resolve(null),
  ]);

  return { events, tasks, reminders, weather };
}
