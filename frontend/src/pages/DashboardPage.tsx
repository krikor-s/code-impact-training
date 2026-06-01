import { useState, useEffect } from "react";
import type { Task, Reminder, Event } from "../types";
import { apiFetch } from "../lib/api";
import Layout from "../components/Layout";

function todayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Section({
  title,
  empty,
  count,
  children,
}: {
  title: string;
  empty: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {title}
      </h2>
      {count === 0 ? (
        <p className="text-xs text-gray-300 italic">{empty}</p>
      ) : (
        <div className="flex flex-col gap-2">{children}</div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [evRes, taskRes, remRes] = await Promise.all([
        apiFetch("/api/v1/events"),
        apiFetch("/api/v1/tasks"),
        apiFetch("/api/v1/reminders"),
      ]);
      if (evRes.ok) {
        const d = (await evRes.json()) as { data: Event[] };
        setEvents(d.data);
      }
      if (taskRes.ok) {
        const d = (await taskRes.json()) as { data: Task[] };
        setTasks(d.data);
      }
      if (remRes.ok) {
        const d = (await remRes.json()) as { data: Reminder[] };
        setReminders(d.data);
      }
      setLoading(false);
    }
    void load();
  }, []);

  const { start: todayStart, end: todayEnd } = todayBounds();
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const todayEvents = events
    .filter((e) => {
      const s = new Date(e.startAt);
      return s >= todayStart && s <= todayEnd;
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const dueTasks = tasks.filter((t) => {
    if (t.status !== "UPCOMING" || !t.dueDate) return false;
    const d = new Date(t.dueDate);
    d.setHours(23, 59, 59, 999);
    return d <= todayEnd;
  });

  const todayReminders = reminders.filter((r) => {
    if (r.status !== "UPCOMING") return false;
    const d = new Date(r.scheduledAt);
    return d >= todayStart && d <= todayEnd;
  });

  const todayLabel = new Date().toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">{todayLabel}</p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <div className="flex flex-col gap-8">
            <Section title="Today's Events" empty="No events today." count={todayEvents.length}>
              {todayEvents.map((e) => (
                <div
                  key={e.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3"
                >
                  <p className="text-gray-900 font-medium text-sm">{e.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatTime(e.startAt)} – {formatTime(e.endAt)}
                  </p>
                  {e.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{e.description}</p>
                  )}
                </div>
              ))}
            </Section>

            <Section
              title="Tasks Due Today"
              empty="No overdue or due-today tasks."
              count={dueTasks.length}
            >
              {dueTasks.map((t) => {
                const isOverdue = t.dueDate && new Date(t.dueDate) < todayMidnight;
                return (
                  <div
                    key={t.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3"
                  >
                    <p className="text-gray-900 font-medium text-sm">{t.title}</p>
                    {t.dueDate && (
                      <p className={`text-xs mt-0.5 ${isOverdue ? "text-red-400" : "text-gray-400"}`}>
                        {isOverdue ? "Overdue · " : "Due "}
                        {new Date(t.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    {t.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                    )}
                  </div>
                );
              })}
            </Section>

            <Section title="Reminders Today" empty="No reminders today." count={todayReminders.length}>
              {todayReminders.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3"
                >
                  <p className="text-gray-900 font-medium text-sm">{r.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatTime(r.scheduledAt)}</p>
                </div>
              ))}
            </Section>
          </div>
        )}
      </div>
    </Layout>
  );
}
