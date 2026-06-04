import Anthropic from "@anthropic-ai/sdk";
import { getDashboardSummary } from "./dashboardService";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateBriefing(userId: string): Promise<string> {
  const { events, tasks, reminders } = await getDashboardSummary(userId);

  const today = new Date().toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const eventsText =
    events.length === 0
      ? "No events today."
      : events
          .map((e) => {
            const start = new Date(e.startAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            const end = new Date(e.endAt).toLocaleTimeString([], {
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
            const due = t.dueDate
              ? ` (due ${new Date(t.dueDate).toLocaleDateString()})`
              : "";
            return `- ${t.title}${due}${t.description ? `: ${t.description}` : ""}`;
          })
          .join("\n");

  const remindersText =
    reminders.length === 0
      ? "No reminders today."
      : reminders
          .map((r) => {
            const time = new Date(r.scheduledAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            return `- ${r.title} at ${time}`;
          })
          .join("\n");

  const prompt = `Today is ${today}.

Here is the user's schedule:

EVENTS:
${eventsText}

TASKS DUE TODAY:
${tasksText}

REMINDERS:
${remindersText}

Write a concise, friendly daily briefing for the user based on the above. Keep it to 2-4 sentences. Focus on what's most important or time-sensitive.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from Claude");
  return block.text;
}
