import Anthropic from "@anthropic-ai/sdk";
import { getDashboardSummary } from "./dashboardService";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateBriefing(
  userId: string,
  coords?: { lat: number; lon: number },
  timeContext?: { localTime?: string; timezone?: string }
): Promise<string> {
  const { events, tasks, reminders, weather } = await getDashboardSummary(userId, coords);

  const now = new Date();
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

  const eventsText =
    events.length === 0
      ? "No events today."
      : events
          .map((e) => {
            const start = new Date(e.startAt).toLocaleTimeString("en-US", {
              ...dateOpts,
              hour: "2-digit",
              minute: "2-digit",
            });
            const end = new Date(e.endAt).toLocaleTimeString("en-US", {
              ...dateOpts,
              hour: "2-digit",
              minute: "2-digit",
            });
            return `- ${e.title} (${start}–${end})${e.description ? `: ${e.description}` : ""}`;
          })
          .join("\n");

  const tasksText =
    tasks.length === 0
      ? "No overdue or due-today tasks."
      : tasks
          .map((t) => {
            let due = "";
            if (t.dueDate) {
              const iso = new Date(t.dueDate).toISOString().slice(0, 10);
              due = ` (due ${new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { ...dateOpts, month: "short", day: "numeric" })})`;
            }
            return `- ${t.title}${due}${t.description ? `: ${t.description}` : ""}`;
          })
          .join("\n");

  const remindersText =
    reminders.length === 0
      ? "No reminders today."
      : reminders
          .map((r) => {
            const time = new Date(r.scheduledAt).toLocaleTimeString("en-US", {
              ...dateOpts,
              hour: "2-digit",
              minute: "2-digit",
            });
            return `- ${r.title} at ${time}`;
          })
          .join("\n");

  const weatherText = weather
    ? `Current conditions as of right now: ${weather.temperature}°F, ${weather.condition}.`
    : null;

  const prompt = `Today is ${today}. The current time is ${currentTime} (${tzLabel}).
${weatherText ? `\nWEATHER:\n${weatherText}\n` : ""}
Here is the user's schedule:

EVENTS:
${eventsText}

TASKS DUE TODAY:
${tasksText}

REMINDERS:
${remindersText}

Write a concise, friendly daily briefing for the user based on the above. Keep it to 2-4 sentences. Use a greeting appropriate to the current time of day (morning/afternoon/evening/night). Focus on what's most important or time-sensitive.${weatherText ? " Mention the current weather conditions briefly — do not speculate about what the weather will be like later." : ""}`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from Claude");
  return block.text;
}
