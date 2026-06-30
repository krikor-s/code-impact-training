import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../lib/prisma";
import { getWeather } from "./weatherService";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateBriefing(
  userId: string,
  timeContext?: { localTime?: string; timezone?: string },
  lat?: number,
  lon?: number
): Promise<string> {
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  weekEnd.setHours(23, 59, 59, 999);

  const [events, tasks, reminders, weather] = await Promise.all([
    prisma.event.findMany({
      where: { userId, startAt: { lte: weekEnd }, endAt: { gte: now } },
      orderBy: { startAt: "asc" },
    }),
    prisma.task.findMany({
      where: { userId, status: "UPCOMING", dueDate: { lte: weekEnd } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.reminder.findMany({
      where: { userId, status: "UPCOMING", scheduledAt: { lte: weekEnd, gte: now } },
      orderBy: { scheduledAt: "asc" },
    }),
    lat !== undefined && lon !== undefined ? getWeather(lat, lon) : Promise.resolve(null),
  ]);

  const tz = timeContext?.timezone;
  const dateOpts: Intl.DateTimeFormatOptions = { timeZone: tz };
  const today = now.toLocaleDateString("en-US", {
    ...dateOpts,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentTime = timeContext?.localTime ?? now.toLocaleTimeString("en-US", {
    ...dateOpts,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const tzLabel = tz ?? "unknown timezone";

  const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { ...dateOpts, weekday: "short", month: "short", day: "numeric" });
  const fmtTime = (d: Date) => d.toLocaleTimeString("en-US", { ...dateOpts, hour: "2-digit", minute: "2-digit" });

  const eventsText =
    events.length === 0
      ? "No upcoming events this week."
      : events
          .map((e) => {
            const start = new Date(e.startAt);
            const end = new Date(e.endAt);
            return `- ${e.title} (${fmtDate(start)} ${fmtTime(start)}–${fmtTime(end)})${e.description ? `: ${e.description}` : ""}`;
          })
          .join("\n");

  const tasksText =
    tasks.length === 0
      ? "No upcoming tasks this week."
      : tasks
          .map((t) => {
            let due = "";
            if (t.dueDate) {
              const iso = new Date(t.dueDate).toISOString().slice(0, 10);
              due = ` (due ${new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { ...dateOpts, weekday: "short", month: "short", day: "numeric" })})`;
            }
            return `- ${t.title}${due}${t.description ? `: ${t.description}` : ""}`;
          })
          .join("\n");

  const remindersText =
    reminders.length === 0
      ? "No upcoming reminders this week."
      : reminders
          .map((r) => {
            const scheduled = new Date(r.scheduledAt);
            return `- ${r.title} (${fmtDate(scheduled)} at ${fmtTime(scheduled)})`;
          })
          .join("\n");

  const weatherText = weather
    ? `Current conditions as of right now: ${weather.temperature}°F, ${weather.condition}.`
    : null;

  const prompt = `Today is ${today}. The current time is ${currentTime} (${tzLabel}).
${weatherText ? `\nWEATHER:\n${weatherText}\n` : ""}
Here is the user's schedule for the next 7 days:

EVENTS:
${eventsText}

UPCOMING TASKS:
${tasksText}

UPCOMING REMINDERS:
${remindersText}

Write a concise, friendly daily briefing for the user based on the above. Keep it to 3-5 sentences. Use a greeting appropriate to the current time of day (morning/afternoon/evening/night). Prioritize anything due today, then mention what's coming up this week.${weatherText ? " Mention the current weather conditions briefly — do not speculate about what the weather will be like later." : ""}`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from Claude");
  return block.text;
}
