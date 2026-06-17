import { useState, useEffect, useRef } from "react";
import type { Task, Reminder, Event } from "../types";
import { apiFetch } from "../lib/api";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

type Weather = { temperature: number; condition: string };

type BriefingState = { status: "idle" } | { status: "loading" } | { status: "done"; text: string } | { status: "error"; message: string };

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
      <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">
        {title}
      </h2>
      {count === 0 ? (
        <p className="text-xs text-white/30 italic">{empty}</p>
      ) : (
        <div className="flex flex-col gap-2">{children}</div>
      )}
    </div>
  );
}

function getLocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<BriefingState>({ status: "idle" });
  const coordsRef = useRef<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    async function load() {
      const coords = await getLocation();
      coordsRef.current = coords;

      const params = coords ? `?lat=${coords.lat}&lon=${coords.lon}` : "";
      const [dashRes, taskRes, remRes] = await Promise.all([
        apiFetch(`/api/v1/dashboard${params}`),
        apiFetch("/api/v1/tasks"),
        apiFetch("/api/v1/reminders"),
      ]);

      if (dashRes.ok) {
        const d = (await dashRes.json()) as { data: { events: Event[]; weather: Weather | null } };
        setEvents(d.data.events);
        setWeather(d.data.weather);
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

  async function handleGetBriefing() {
    setBriefing({ status: "loading" });
    const payload: Record<string, unknown> = {
      localTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    if (coordsRef.current) {
      payload.lat = coordsRef.current.lat;
      payload.lon = coordsRef.current.lon;
    }
    const body = JSON.stringify(payload);
    const res = await apiFetch("/api/v1/dashboard/briefing", { method: "POST", body });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setBriefing({ status: "error", message: data.error ?? "Failed to get briefing" });
      return;
    }
    const data = (await res.json()) as { data: { briefing: string } };
    setBriefing({ status: "done", text: data.data.briefing });
  }

  const todayLabel = new Date().toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-white/50 mt-1">{todayLabel}</p>
            {weather && (
              <p className="text-white/50 text-sm mt-1">
                {weather.temperature}°F, {weather.condition}
              </p>
            )}
          </div>
          <Button
            onClick={() => void handleGetBriefing()}
            disabled={briefing.status === "loading"}
          >
            {briefing.status === "loading" ? "Getting briefing…" : "Get AI Briefing"}
          </Button>
        </div>

        {briefing.status === "done" && (
          <Card className="mb-8">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">AI Briefing</p>
            <p className="text-sm text-white/80 leading-relaxed">{briefing.text}</p>
          </Card>
        )}
        {briefing.status === "error" && (
          <Card className="mb-8 border-red-400/30">
            <p className="text-sm text-red-300">{briefing.message}</p>
          </Card>
        )}

        {loading ? (
          <p className="text-sm text-white/40">Loading…</p>
        ) : (
          <div className="flex flex-col gap-8">
            <Section title="Today's Events" empty="No events today." count={todayEvents.length}>
              {todayEvents.map((e) => (
                <Card key={e.id}>
                  <p className="text-white font-medium text-sm">{e.title}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {formatTime(e.startAt)} – {formatTime(e.endAt)}
                  </p>
                  {e.description && (
                    <p className="text-xs text-white/50 mt-0.5">{e.description}</p>
                  )}
                </Card>
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
                  <Card key={t.id}>
                    <p className="text-white font-medium text-sm">{t.title}</p>
                    {t.dueDate && (
                      <p className={`text-xs mt-0.5 ${isOverdue ? "text-red-300" : "text-white/40"}`}>
                        {isOverdue ? "Overdue · " : "Due "}
                        {new Date(t.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    {t.description && (
                      <p className="text-xs text-white/50 mt-0.5">{t.description}</p>
                    )}
                  </Card>
                );
              })}
            </Section>

            <Section title="Reminders Today" empty="No reminders today." count={todayReminders.length}>
              {todayReminders.map((r) => (
                <Card key={r.id}>
                  <p className="text-white font-medium text-sm">{r.title}</p>
                  <p className="text-xs text-white/40 mt-0.5">{formatTime(r.scheduledAt)}</p>
                </Card>
              ))}
            </Section>
          </div>
        )}
      </div>
    </Layout>
  );
}
