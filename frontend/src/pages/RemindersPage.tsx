import { useState, useEffect, useRef } from "react";
import type { Reminder, RepeatFrequency } from "../types";
import { apiFetch } from "../lib/api";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

function ReminderCard({
  reminder,
  onRefresh,
  onDeleted,
}: {
  reminder: Reminder;
  onRefresh: () => Promise<void>;
  onDeleted: (reminder: Reminder) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(reminder.title);
  const [editScheduledAt, setEditScheduledAt] = useState(reminder.scheduledAt.slice(0, 16));
  const [editRepeatFrequency, setEditRepeatFrequency] = useState<RepeatFrequency>(reminder.repeatFrequency);

  function openEdit() {
    setEditTitle(reminder.title);
    setEditScheduledAt(reminder.scheduledAt.slice(0, 16));
    setEditRepeatFrequency(reminder.repeatFrequency);
    setEditing(true);
  }

  async function handleComplete() {
    const res = await apiFetch(`/api/v1/reminders/${reminder.id}/complete`, { method: "PATCH" });
    if (res.ok) await onRefresh();
  }

  async function handleDelete() {
    const res = await apiFetch(`/api/v1/reminders/${reminder.id}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted(reminder);
      await onRefresh();
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    const res = await apiFetch(`/api/v1/reminders/${reminder.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: editTitle,
        scheduledAt: editScheduledAt,
        repeatFrequency: editRepeatFrequency,
      }),
    });
    if (res.ok) {
      setEditing(false);
      await onRefresh();
    }
  }

  if (editing) {
    return (
      <Card className="mb-2">
        <form onSubmit={handleEdit}>
          <label className="block mb-2">
            <span className="text-xs font-medium text-white/50">Title</span>
            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required autoFocus className="mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40" />
          </label>
          <label className="block mb-2">
            <span className="text-xs font-medium text-white/50">Scheduled at</span>
            <input type="datetime-local" value={editScheduledAt} onChange={(e) => setEditScheduledAt(e.target.value)} required className="mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40" />
          </label>
          <label className="block mb-3">
            <span className="text-xs font-medium text-white/50">Repeat</span>
            <select value={editRepeatFrequency} onChange={(e) => setEditRepeatFrequency(e.target.value as RepeatFrequency)} className="mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40">
              <option value="NONE">None</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </label>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 py-1.5 text-xs">Save</Button>
            <Button variant="secondary" type="button" onClick={() => setEditing(false)} className="flex-1 py-1.5 text-xs">Cancel</Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card className="mb-2">
      <p className="text-white font-medium text-sm truncate">{reminder.title}</p>
      <p className="text-xs text-white/40 mt-0.5">
        {new Date(reminder.scheduledAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
      </p>
      {reminder.repeatFrequency !== "NONE" && (
        <p className="text-xs text-white/40 mt-0.5 capitalize">{reminder.repeatFrequency.toLowerCase()}</p>
      )}
      {reminder.status === "UPCOMING" && (
        <div className="flex gap-1 mt-2">
          <button onClick={handleComplete} title="Mark complete" className="text-emerald-400 hover:text-emerald-300 px-1.5 py-1 rounded hover:bg-white/10 transition-colors duration-150 text-sm leading-none">✓</button>
          <button onClick={handleDelete} title="Delete" className="text-red-400 hover:text-red-300 px-1.5 py-1 rounded hover:bg-white/10 transition-colors duration-150 text-sm leading-none">✕</button>
          <button onClick={openEdit} title="Edit" className="text-white/40 hover:text-white px-1.5 py-1 rounded hover:bg-white/10 transition-colors duration-150 text-sm leading-none tracking-tighter">···</button>
        </div>
      )}
    </Card>
  );
}

function Column({
  title,
  reminders,
  onRefresh,
  onDeleted,
}: {
  title: string;
  reminders: Reminder[];
  onRefresh: () => Promise<void>;
  onDeleted: (reminder: Reminder) => void;
}) {
  return (
    <div className="flex-1 min-w-0">
      <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">{title}</h2>
      {reminders.length === 0 ? (
        <p className="text-xs text-white/30 italic">Nothing here.</p>
      ) : (
        reminders.map((r) => (
          <ReminderCard key={r.id} reminder={r} onRefresh={onRefresh} onDeleted={onDeleted} />
        ))
      )}
    </div>
  );
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [repeatFrequency, setRepeatFrequency] = useState<RepeatFrequency>("NONE");
  const [error, setError] = useState<string | null>(null);

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await apiFetch("/api/v1/reminders", {
      method: "POST",
      body: JSON.stringify({ title, scheduledAt, repeatFrequency }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Failed to create reminder");
      return;
    }
    setTitle("");
    setScheduledAt("");
    setRepeatFrequency("NONE");
    setShowForm(false);
    await fetchReminders();
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Reminders</h1>
        <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Add reminder"}
        </Button>
      </div>

      {showForm && (
        <Card className="w-full max-w-sm mb-8">
          <form onSubmit={handleCreate}>
            {error && <p className="text-red-300 text-sm mb-3">{error}</p>}
            <label className="block mb-3">
              <span className="text-sm font-medium text-white/70">Title</span>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus className="mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40" />
            </label>
            <label className="block mb-3">
              <span className="text-sm font-medium text-white/70">Scheduled at</span>
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required className="mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40" />
            </label>
            <label className="block mb-4">
              <span className="text-sm font-medium text-white/70">Repeat</span>
              <select value={repeatFrequency} onChange={(e) => setRepeatFrequency(e.target.value as RepeatFrequency)} className="mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40">
                <option value="NONE">None</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </label>
            <Button type="submit" className="w-full py-2.5">Save reminder</Button>
          </form>
        </Card>
      )}

      <div className="flex gap-6">
        <Column title="Today" reminders={todayReminders} onRefresh={fetchReminders} onDeleted={handleDeleted} />
        <Column title="This Week" reminders={thisWeekReminders} onRefresh={fetchReminders} onDeleted={handleDeleted} />
        <Column title="This Month" reminders={laterReminders} onRefresh={fetchReminders} onDeleted={handleDeleted} />
        <Column title="Completed" reminders={completed} onRefresh={fetchReminders} onDeleted={handleDeleted} />
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
