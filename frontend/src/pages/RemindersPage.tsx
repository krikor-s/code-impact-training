import { useState, useEffect, useRef } from "react";
import type { Reminder, RepeatFrequency } from "../types";
import { apiFetch } from "../lib/api";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

const REPEAT_LABELS: Record<RepeatFrequency, string> = {
  NONE: "One-time",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

const inputClass = "mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40";

function ReminderCard({
  reminder,
  onRefresh,
  onDeleted,
}: {
  reminder: Reminder;
  onRefresh: () => Promise<void>;
  onDeleted: (reminder: Reminder) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(reminder.title);
  const [editScheduledAt, setEditScheduledAt] = useState(reminder.scheduledAt.slice(0, 16));
  const [editRepeat, setEditRepeat] = useState<RepeatFrequency>(reminder.repeatFrequency);

  async function handleComplete() {
    const res = await apiFetch(`/api/v1/reminders/${reminder.id}/complete`, { method: "PATCH" });
    if (res.ok) await onRefresh();
  }

  async function handleDelete() {
    const res = await apiFetch(`/api/v1/reminders/${reminder.id}`, { method: "DELETE" });
    if (res.ok) { onDeleted(reminder); await onRefresh(); }
  }

  async function handleSave() {
    const res = await apiFetch(`/api/v1/reminders/${reminder.id}`, {
      method: "PATCH",
      body: JSON.stringify({ title: editTitle, scheduledAt: editScheduledAt, repeatFrequency: editRepeat }),
    });
    if (res.ok) { setOpen(false); await onRefresh(); }
  }

  function handleOpen() {
    setEditTitle(reminder.title);
    setEditScheduledAt(reminder.scheduledAt.slice(0, 16));
    setEditRepeat(reminder.repeatFrequency);
    setOpen(true);
  }

  return (
    <Card className="mb-2">
      <div className="flex items-start gap-3">
        {reminder.status === "UPCOMING" && (
          <button
            onClick={handleComplete}
            className="mt-0.5 w-4 h-4 rounded border border-white/30 shrink-0 hover:bg-white/20 transition-colors"
            aria-label="Complete reminder"
          />
        )}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => (open ? setOpen(false) : handleOpen())}>
          <div className="flex items-center gap-2">
            <p className="text-white font-medium text-sm truncate">{reminder.title}</p>
            <span className="text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded shrink-0">
              {REPEAT_LABELS[reminder.repeatFrequency]}
            </span>
          </div>
          <p className="text-xs text-white/40 mt-0.5">
            {new Date(reminder.scheduledAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        {reminder.status === "UPCOMING" && (
          <button onClick={handleDelete} title="Delete" className="text-red-400 hover:text-red-300 px-1 py-0.5 rounded hover:bg-white/10 transition-colors duration-150 text-sm leading-none shrink-0">✕</button>
        )}
      </div>
      {open && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <label className="block mb-2">
            <span className="text-xs text-white/50">Title</span>
            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputClass} />
          </label>
          <label className="block mb-2">
            <span className="text-xs text-white/50">Scheduled at</span>
            <input type="datetime-local" value={editScheduledAt} onChange={(e) => setEditScheduledAt(e.target.value)} className={inputClass} />
          </label>
          <label className="block mb-3">
            <span className="text-xs text-white/50">Repeat</span>
            <select value={editRepeat} onChange={(e) => setEditRepeat(e.target.value as RepeatFrequency)} className={inputClass}>
              <option value="NONE">None</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
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


function CreateCard({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [repeatFrequency, setRepeatFrequency] = useState<RepeatFrequency>("NONE");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    if (!title || !scheduledAt) { setError("Title and time are required"); return; }
    const res = await apiFetch("/api/v1/reminders", {
      method: "POST",
      body: JSON.stringify({ title, scheduledAt, repeatFrequency }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Failed to create reminder");
      return;
    }
    setTitle("");
    setScheduledAt("");
    setRepeatFrequency("NONE");
    setOpen(false);
    await onRefresh();
  }

  if (!open) {
    return (
      <div className="mb-6">
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-white/40 hover:text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors duration-150"
        >
          + New reminder
        </button>
      </div>
    );
  }

  return (
    <Card className="mb-6 max-w-sm">
      <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">New Reminder</p>
      {error && <p className="text-red-300 text-sm mb-3">{error}</p>}
      <label className="block mb-2">
        <span className="text-xs text-white/50">Title</span>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus className={inputClass} />
      </label>
      <label className="block mb-2">
        <span className="text-xs text-white/50">Scheduled at</span>
        <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputClass} />
      </label>
      <label className="block mb-3">
        <span className="text-xs text-white/50">Repeat</span>
        <select value={repeatFrequency} onChange={(e) => setRepeatFrequency(e.target.value as RepeatFrequency)} className={inputClass}>
          <option value="NONE">None</option>
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="MONTHLY">Monthly</option>
        </select>
      </label>
      <div className="flex gap-2">
        <Button onClick={handleCreate} className="text-xs px-3 py-1.5">Save</Button>
        <Button variant="secondary" onClick={() => setOpen(false)} className="text-xs px-3 py-1.5">Cancel</Button>
      </div>
    </Card>
  );
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState<Reminder[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);

  const remindersRef = useRef(reminders);
  const notifiedRef = useRef(new Set<string>());

  useEffect(() => { remindersRef.current = reminders; }, [reminders]);

  async function fetchReminders() {
    const res = await apiFetch("/api/v1/reminders");
    if (!res.ok) return;
    const data = (await res.json()) as { data: Reminder[] };
    setReminders(data.data);
  }

  useEffect(() => {
    async function load() {
      const res = await apiFetch("/api/v1/reminders");
      if (!res.ok) return;
      const data = (await res.json()) as { data: Reminder[] };
      setReminders(data.data);
    }
    void load();
  }, []);

  useEffect(() => {
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
    const interval = setInterval(() => {
      if (Notification.permission !== "granted") return;
      const now = new Date();
      for (const r of remindersRef.current) {
        if (r.status === "UPCOMING" && new Date(r.scheduledAt) <= now && !notifiedRef.current.has(r.id)) {
          notifiedRef.current.add(r.id);
          new Notification(r.title, { body: new Date(r.scheduledAt).toLocaleString() });
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleClearCompleted() {
    const completedReminders = reminders.filter((r) => r.status === "COMPLETED" && r.repeatFrequency === "NONE");
    await Promise.all(completedReminders.map((r) => apiFetch(`/api/v1/reminders/${r.id}`, { method: "DELETE" })));
    await fetchReminders();
  }

  function handleDeleted(reminder: Reminder) {
    setRecentlyDeleted((prev) => [reminder, ...prev].slice(0, 5));
  }

  async function handleRestore(reminder: Reminder) {
    const res = await apiFetch("/api/v1/reminders", {
      method: "POST",
      body: JSON.stringify({ title: reminder.title, scheduledAt: reminder.scheduledAt, repeatFrequency: reminder.repeatFrequency }),
    });
    if (res.ok) {
      setRecentlyDeleted((prev) => prev.filter((r) => r.id !== reminder.id));
      await fetchReminders();
    }
  }

  const now = new Date();
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7); weekEnd.setHours(23, 59, 59, 999);

  const upcoming = reminders.filter((r) => r.status === "UPCOMING");
  const completed = reminders.filter((r) => r.status === "COMPLETED");
  const todayReminders = upcoming.filter((r) => new Date(r.scheduledAt) <= todayEnd);
  const thisWeekReminders = upcoming.filter((r) => { const d = new Date(r.scheduledAt); return d > todayEnd && d <= weekEnd; });
  const laterReminders = upcoming.filter((r) => new Date(r.scheduledAt) > weekEnd);

  return (
    <Layout>
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Reminders</h1>
          {completed.length > 0 && (
            <button
              onClick={() => setShowCompleted((v) => !v)}
              className="text-xs font-semibold text-white/30 uppercase tracking-wide hover:text-white/50 transition-colors duration-150"
            >
              Completed ({completed.length}) {showCompleted ? "▾" : "▸"}
            </button>
          )}
        </div>

        <CreateCard onRefresh={fetchReminders} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">Today</h2>
            {todayReminders.length === 0 ? (
              <p className="text-xs text-white/30 italic">Nothing today.</p>
            ) : todayReminders.map((r) => (
              <ReminderCard key={r.id} reminder={r} onRefresh={fetchReminders} onDeleted={handleDeleted} />
            ))}
          </div>
          <div>
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">This Week</h2>
            {thisWeekReminders.length === 0 ? (
              <p className="text-xs text-white/30 italic">Nothing this week.</p>
            ) : thisWeekReminders.map((r) => (
              <ReminderCard key={r.id} reminder={r} onRefresh={fetchReminders} onDeleted={handleDeleted} />
            ))}
          </div>
          <div>
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">Later</h2>
            {laterReminders.length === 0 ? (
              <p className="text-xs text-white/30 italic">Nothing scheduled.</p>
            ) : laterReminders.map((r) => (
              <ReminderCard key={r.id} reminder={r} onRefresh={fetchReminders} onDeleted={handleDeleted} />
            ))}
          </div>
        </div>

        {showCompleted && completed.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide">Completed</h2>
              <button onClick={handleClearCompleted} className="text-xs text-white/30 hover:text-white/60 transition-colors duration-150">Clear all</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {completed.map((r) => (
                <Card key={r.id} className="opacity-60">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded bg-emerald-400/30 border border-emerald-400/50 shrink-0 flex items-center justify-center text-emerald-400 text-[10px]">✓</span>
                    <p className="text-white/50 text-sm truncate line-through">{r.title}</p>
                    <span className="text-[10px] bg-white/10 text-white/30 px-1.5 py-0.5 rounded shrink-0 ml-auto">
                      {REPEAT_LABELS[r.repeatFrequency]}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {recentlyDeleted.length > 0 && (
        <div className="fixed bottom-4 right-4 w-72 glass rounded-xl px-4 pt-4 pb-5">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3">Recently Deleted</h2>
          {recentlyDeleted.map((reminder) => (
            <div key={reminder.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-2">
              <p className="text-sm text-white/50 truncate">{reminder.title}</p>
              <Button variant="secondary" onClick={() => handleRestore(reminder)} className="text-xs px-2 py-1 ml-3 shrink-0">Restore</Button>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
