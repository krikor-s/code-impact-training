import { useState, useEffect, useRef } from "react";
import type { Task, Reminder, Event } from "../types";
import { apiFetch } from "../lib/api";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

type Weather = { temperature: number; condition: string };
type Badge = { name: string; tier: string; milestone: number };
type Streak = {
  current: number;
  longest: number;
  dailyGoal: number;
  badges: Badge[];
  nextBadge: Badge | null;
};
type WidgetType = "weather" | "completion" | "streak" | "date" | "profile";
const WIDGET_LABELS: Record<WidgetType, string> = {
  weather: "Weather",
  completion: "Completion",
  streak: "Streak",
  date: "Date & Time",
  profile: "Profile",
};
const ALL_WIDGETS: WidgetType[] = ["weather", "completion", "streak", "date", "profile"];
const DEFAULT_WIDGETS: WidgetType[] = ["weather", "completion", "streak"];

function loadWidgets(): WidgetType[] {
  const saved = localStorage.getItem("dashboardWidgets");
  if (saved) {
    try { return JSON.parse(saved) as WidgetType[]; } catch { /* fall through */ }
  }
  return DEFAULT_WIDGETS;
}

type BriefingState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; text: string }
  | { status: "error"; message: string };

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getLocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 },
    );
  });
}

function ExpandableTask({
  task,
  onComplete,
  onUpdate,
}: {
  task: Task;
  onComplete: (id: string) => void;
  onUpdate: (id: string, fields: { title?: string; description?: string | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");

  function handleSave() {
    onUpdate(task.id, { title, description: description || null });
    setOpen(false);
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
          className="mt-0.5 w-4 h-4 rounded border border-white/30 shrink-0 hover:bg-white/20 transition-colors"
          aria-label="Complete task"
        />
        <div className="flex-1 cursor-pointer" onClick={() => setOpen(!open)}>
          <p className="text-white font-medium text-sm">{task.title}</p>
          {task.dueDate && (
            <p className="text-xs text-white/40 mt-0.5">
              Due {new Date(task.dueDate.slice(0, 10) + "T00:00:00").toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      {open && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <label className="block mb-2">
            <span className="text-xs text-white/50">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/40"
            />
          </label>
          <label className="block mb-3">
            <span className="text-xs text-white/50">Description</span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/40"
            />
          </label>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="text-xs px-3 py-1">Save</Button>
            <Button variant="secondary" onClick={() => setOpen(false)} className="text-xs px-3 py-1">Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function ExpandableReminder({
  reminder,
  onComplete,
  onUpdate,
}: {
  reminder: Reminder;
  onComplete: (id: string) => void;
  onUpdate: (id: string, fields: { title?: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(reminder.title);

  function handleSave() {
    onUpdate(reminder.id, { title });
    setOpen(false);
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); onComplete(reminder.id); }}
          className="mt-0.5 w-4 h-4 rounded border border-white/30 shrink-0 hover:bg-white/20 transition-colors"
          aria-label="Complete reminder"
        />
        <div className="flex-1 cursor-pointer" onClick={() => setOpen(!open)}>
          <p className="text-white font-medium text-sm">{reminder.title}</p>
          <p className="text-xs text-white/40 mt-0.5">{formatTime(reminder.scheduledAt)}</p>
        </div>
      </div>
      {open && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <label className="block mb-3">
            <span className="text-xs text-white/50">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/40"
            />
          </label>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="text-xs px-3 py-1">Save</Button>
            <Button variant="secondary" onClick={() => setOpen(false)} className="text-xs px-3 py-1">Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<BriefingState>({ status: "idle" });
  const [widgets, setWidgets] = useState<WidgetType[]>(loadWidgets);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [showWelcome, setShowWelcome] = useState(() => {
    if (localStorage.getItem("showWelcome") === "true") {
      localStorage.removeItem("showWelcome");
      return true;
    }
    return false;
  });
  const coordsRef = useRef<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (!showWelcome) return;
    const timer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(timer);
  }, [showWelcome]);

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
        const d = (await dashRes.json()) as { data: { events: Event[]; weather: Weather | null; streak: Streak } };
        setEvents(d.data.events);
        setWeather(d.data.weather);
        setStreak(d.data.streak);
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

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  const todayEvents = events
    .filter((e) => { const s = new Date(e.startAt); return s >= todayStart && s <= todayEnd; })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const dueTasks = tasks.filter((t) => {
    if (t.status !== "UPCOMING" || !t.dueDate) return false;
    const d = new Date(t.dueDate.slice(0, 10) + "T00:00:00"); d.setHours(23, 59, 59, 999);
    return d <= todayEnd;
  });

  const todayReminders = reminders.filter((r) => {
    if (r.status !== "UPCOMING") return false;
    const d = new Date(r.scheduledAt);
    return d >= todayStart && d <= todayEnd;
  });

  const totalItems = dueTasks.length + todayReminders.length;
  const completedToday = tasks.filter((t) => t.status === "COMPLETED").length
    + reminders.filter((r) => r.status === "COMPLETED" && new Date(r.scheduledAt) >= todayStart && new Date(r.scheduledAt) <= todayEnd).length;
  const allToday = totalItems + completedToday;
  const pct = allToday === 0 ? 0 : Math.round((completedToday / allToday) * 100);

  async function handleCompleteTask(id: string) {
    const res = await apiFetch(`/api/v1/tasks/${id}/complete`, { method: "PATCH" });
    if (res.ok) setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: "COMPLETED" as const } : t));
  }

  async function handleUpdateTask(id: string, fields: { title?: string; description?: string | null }) {
    const res = await apiFetch(`/api/v1/tasks/${id}`, { method: "PATCH", body: JSON.stringify(fields) });
    if (res.ok) {
      const d = (await res.json()) as { data: Task };
      setTasks((prev) => prev.map((t) => t.id === id ? d.data : t));
    }
  }

  async function handleCompleteReminder(id: string) {
    const res = await apiFetch(`/api/v1/reminders/${id}/complete`, { method: "PATCH" });
    if (res.ok) setReminders((prev) => prev.map((r) => r.id === id ? { ...r, status: "COMPLETED" as const } : r));
  }

  async function handleUpdateReminder(id: string, fields: { title?: string }) {
    const res = await apiFetch(`/api/v1/reminders/${id}`, { method: "PATCH", body: JSON.stringify(fields) });
    if (res.ok) {
      const d = (await res.json()) as { data: Reminder };
      setReminders((prev) => prev.map((r) => r.id === id ? d.data : r));
    }
  }

  async function handleGetBriefing() {
    setBriefing({ status: "loading" });
    const payload: Record<string, unknown> = {
      localTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    if (coordsRef.current) { payload.lat = coordsRef.current.lat; payload.lon = coordsRef.current.lon; }
    const res = await apiFetch("/api/v1/dashboard/briefing", { method: "POST", body: JSON.stringify(payload) });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setBriefing({ status: "error", message: data.error ?? "Failed to get briefing" });
      return;
    }
    const data = (await res.json()) as { data: { briefing: string } };
    setBriefing({ status: "done", text: data.data.briefing });
  }

  function swapWidget(slot: number, newType: WidgetType) {
    const updated = [...widgets];
    updated[slot] = newType;
    setWidgets(updated);
    localStorage.setItem("dashboardWidgets", JSON.stringify(updated));
    setEditingSlot(null);
  }

  const displayName = localStorage.getItem("displayName") ?? "there";
  const todayLabel = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-ocean flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to Orbit</h1>
          <p className="text-lg text-white/60">Let&apos;s get you set up, {displayName}.</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Hey, {displayName}</h1>
            {!widgets.includes("date") && <p className="text-white/50 mt-1">{todayLabel}</p>}
          </div>
          <Button
            onClick={() => {
              if (briefing.status === "done" || briefing.status === "error") {
                setBriefing({ status: "idle" });
              } else {
                void handleGetBriefing();
              }
            }}
            disabled={briefing.status === "loading"}
          >
            {briefing.status === "loading" ? "Getting briefing…" : briefing.status === "done" || briefing.status === "error" ? "Hide Briefing" : "Get AI Briefing"}
          </Button>
        </div>

        {briefing.status === "done" && (
          <Card className="mb-8">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">AI Briefing</p>
            <p className="text-sm text-white/80 leading-relaxed">{briefing.text}</p>
          </Card>
        )}
        {briefing.status === "error" && (
          <Card className="mb-8">
            <p className="text-sm text-red-300">{briefing.message}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {widgets.map((widget, i) => (
            <Card key={`${widget}-${i}`} className="relative flex flex-col items-center justify-center py-6 group">
              <button
                onClick={() => setEditingSlot(editingSlot === i ? null : i)}
                className="absolute top-2 right-2 text-white/20 hover:text-white/60 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                title="Change widget"
              >
                ···
              </button>
              {editingSlot === i && (
                <div className="absolute top-8 right-2 z-20 rounded-lg py-1 min-w-28 bg-[#0a1e38]/95 border border-white/20 shadow-xl backdrop-blur-sm">
                  {ALL_WIDGETS.map((w) => (
                    <button
                      key={w}
                      onClick={() => swapWidget(i, w)}
                      className={`block w-full text-left text-xs px-3 py-1.5 transition-colors duration-150 ${
                        widget === w ? "text-white bg-white/20 font-medium" : "text-white/80 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {WIDGET_LABELS[w]}
                    </button>
                  ))}
                </div>
              )}

              {widget === "weather" && (
                weather ? (
                  <>
                    <p className="text-3xl font-bold text-white">{weather.temperature}°F</p>
                    <p className="text-sm text-white/50 mt-1 capitalize">{weather.condition}</p>
                  </>
                ) : (
                  <p className="text-sm text-white/30">No weather data</p>
                )
              )}

              {widget === "completion" && (
                <>
                  <p className="text-3xl font-bold text-white">{pct}%</p>
                  <p className="text-sm text-white/50 mt-1">Completed today</p>
                  <div className="w-full mt-3 bg-white/10 rounded-full h-1.5">
                    <div className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </>
              )}

              {widget === "streak" && (
                streak ? (
                  <>
                    <p className="text-3xl font-bold text-white">{streak.current}</p>
                    <p className="text-sm text-white/50 mt-1">Day streak</p>
                    {streak.badges.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {streak.badges.map((b) => (
                          <span key={b.tier} className="text-xs bg-white/15 text-white/70 px-2 py-0.5 rounded-full" title={`${b.name} — ${b.milestone} day streak`}>
                            {b.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {streak.nextBadge && (
                      <p className="text-xs text-white/30 mt-1">{streak.nextBadge.milestone - streak.longest} days to {streak.nextBadge.name}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-white/30">Loading…</p>
                )
              )}

              {widget === "date" && (
                <>
                  <p className="text-3xl font-bold text-white">{new Date().toLocaleDateString([], { month: "short", day: "numeric" })}</p>
                  <p className="text-sm text-white/50 mt-1">{new Date().toLocaleDateString([], { weekday: "long" })}</p>
                  <p className="text-xs text-white/30 mt-1">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </>
              )}

              {widget === "profile" && (
                <a href="/profile" className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white font-bold mb-2">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm text-white font-medium">{displayName}</p>
                  <p className="text-xs text-white/40">View profile</p>
                </a>
              )}
            </Card>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-white/40">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tasks tile */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide">Tasks</h2>
                <a href="/tasks" className="text-xs text-white/30 hover:text-white/60">View tasks</a>
              </div>
              {dueTasks.length === 0 ? (
                <p className="text-xs text-white/30 italic">No tasks due today</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {dueTasks.map((t) => (
                    <ExpandableTask key={t.id} task={t} onComplete={handleCompleteTask} onUpdate={handleUpdateTask} />
                  ))}
                </div>
              )}
            </div>

            {/* Reminders tile */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide">Reminders</h2>
                <a href="/reminders" className="text-xs text-white/30 hover:text-white/60">View reminders</a>
              </div>
              {todayReminders.length === 0 ? (
                <p className="text-xs text-white/30 italic">No reminders today</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {todayReminders.map((r) => (
                    <ExpandableReminder key={r.id} reminder={r} onComplete={handleCompleteReminder} onUpdate={handleUpdateReminder} />
                  ))}
                </div>
              )}
            </div>

            {/* Events tile */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide">Today&apos;s Events</h2>
                <a href="/calendar" className="text-xs text-white/30 hover:text-white/60">View calendar</a>
              </div>
              {todayEvents.length === 0 ? (
                <p className="text-xs text-white/30 italic">No events today</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {todayEvents.map((e) => (
                    <Card key={e.id}>
                      <p className="text-white font-medium text-sm">{e.title}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {formatTime(e.startAt)} – {formatTime(e.endAt)}
                      </p>
                      {e.description && <p className="text-xs text-white/50 mt-0.5">{e.description}</p>}
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Profile tile */}
            <a href="/profile" className="block">
              <Card className="flex items-center gap-4 hover:bg-white/15 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{displayName}</p>
                  <p className="text-xs text-white/40">View profile</p>
                </div>
              </Card>
            </a>
          </div>
        )}
      </div>
    </Layout>
  );
}
