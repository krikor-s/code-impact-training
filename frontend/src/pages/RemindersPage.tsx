import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import type { Reminder, RepeatFrequency } from "../types";
import { apiFetch } from "../lib/api";
import Layout from "../components/Layout";

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
  const [editScheduledAt, setEditScheduledAt] = useState(
    reminder.scheduledAt.slice(0, 16)
  );
  const [editRepeatFrequency, setEditRepeatFrequency] = useState<RepeatFrequency>(
    reminder.repeatFrequency
  );

  function openEdit() {
    setEditTitle(reminder.title);
    setEditScheduledAt(reminder.scheduledAt.slice(0, 16));
    setEditRepeatFrequency(reminder.repeatFrequency);
    setEditing(true);
  }

  async function handleComplete() {
    const res = await apiFetch(`/api/v1/reminders/${reminder.id}/complete`, {
      method: "PATCH",
    });
    if (res.ok) await onRefresh();
  }

  async function handleDelete() {
    const res = await apiFetch(`/api/v1/reminders/${reminder.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      onDeleted(reminder);
      await onRefresh();
    }
  }

  async function handleEdit(e: FormEvent) {
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
      <form
        onSubmit={handleEdit}
        className="bg-white rounded-lg shadow-sm border border-gray-300 p-3 mb-2"
      >
        <label className="block mb-2">
          <span className="text-xs font-medium text-gray-500">Title</span>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
            autoFocus
            className="mt-1 block w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block mb-2">
          <span className="text-xs font-medium text-gray-500">Scheduled at</span>
          <input
            type="datetime-local"
            value={editScheduledAt}
            onChange={(e) => setEditScheduledAt(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block mb-3">
          <span className="text-xs font-medium text-gray-500">Repeat</span>
          <select
            value={editRepeatFrequency}
            onChange={(e) => setEditRepeatFrequency(e.target.value as RepeatFrequency)}
            className="mt-1 block w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          >
            <option value="NONE">None</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-slate-600 text-white rounded px-2 py-1.5 text-xs font-medium hover:bg-slate-500 transition-colors duration-150"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex-1 border border-gray-300 bg-white text-gray-600 rounded px-2 py-1.5 text-xs hover:bg-gray-200 transition-colors duration-150"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-2">
      <p className="text-gray-900 font-medium text-sm truncate">{reminder.title}</p>
      <p className="text-xs text-gray-400 mt-0.5">
        {new Date(reminder.scheduledAt).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      {reminder.repeatFrequency !== "NONE" && (
        <p className="text-xs text-gray-400 mt-0.5 capitalize">
          {reminder.repeatFrequency.toLowerCase()}
        </p>
      )}
      {reminder.status === "UPCOMING" && (
        <div className="flex gap-1 mt-2">
          <button
            onClick={handleComplete}
            title="Mark complete"
            className="text-green-600 hover:text-green-800 px-1.5 py-1 rounded hover:bg-green-50 transition-colors duration-150 text-sm leading-none"
          >
            ✓
          </button>
          <button
            onClick={handleDelete}
            title="Delete"
            className="text-red-400 hover:text-red-600 px-1.5 py-1 rounded hover:bg-red-50 transition-colors duration-150 text-sm leading-none"
          >
            ✕
          </button>
          <button
            onClick={openEdit}
            title="Edit"
            className="text-gray-400 hover:text-gray-700 px-1.5 py-1 rounded hover:bg-gray-100 transition-colors duration-150 text-sm leading-none tracking-tighter"
          >
            ···
          </button>
        </div>
      )}
    </div>
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
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {title}
      </h2>
      {reminders.length === 0 ? (
        <p className="text-xs text-gray-300 italic">Nothing here.</p>
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

  useEffect(() => {
    remindersRef.current = reminders;
  }, [reminders]);

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
        if (
          r.status === "UPCOMING" &&
          new Date(r.scheduledAt) <= now &&
          !notifiedRef.current.has(r.id)
        ) {
          notifiedRef.current.add(r.id);
          new Notification(r.title, {
            body: new Date(r.scheduledAt).toLocaleString(),
          });
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
      body: JSON.stringify({
        title: reminder.title,
        scheduledAt: reminder.scheduledAt,
        repeatFrequency: reminder.repeatFrequency,
      }),
    });
    if (res.ok) {
      setRecentlyDeleted((prev) => prev.filter((r) => r.id !== reminder.id));
      await fetchReminders();
    }
  }

  async function handleCreate(e: FormEvent) {
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
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  weekEnd.setHours(23, 59, 59, 999);

  const upcoming = reminders.filter((r) => r.status === "UPCOMING");
  const completed = reminders.filter((r) => r.status === "COMPLETED");

  const todayReminders = upcoming.filter((r) => new Date(r.scheduledAt) <= todayEnd);
  const thisWeekReminders = upcoming.filter((r) => {
    const d = new Date(r.scheduledAt);
    return d > todayEnd && d <= weekEnd;
  });
  const laterReminders = upcoming.filter((r) => new Date(r.scheduledAt) > weekEnd);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm font-medium text-gray-600 border border-gray-300 bg-white px-4 py-2 rounded hover:bg-gray-200 transition-colors duration-150"
        >
          {showForm ? "Cancel" : "+ Add reminder"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 w-full max-w-sm mb-8"
        >
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <label className="block mb-3">
            <span className="text-sm font-medium text-gray-700">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </label>
          <label className="block mb-3">
            <span className="text-sm font-medium text-gray-700">Scheduled at</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </label>
          <label className="block mb-4">
            <span className="text-sm font-medium text-gray-700">Repeat</span>
            <select
              value={repeatFrequency}
              onChange={(e) => setRepeatFrequency(e.target.value as RepeatFrequency)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="NONE">None</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </label>
          <button
            type="submit"
            className="w-full bg-slate-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-slate-500 transition-colors duration-150"
          >
            Save reminder
          </button>
        </form>
      )}

      <div className="flex gap-6">
        <Column title="Today" reminders={todayReminders} onRefresh={fetchReminders} onDeleted={handleDeleted} />
        <Column title="This Week" reminders={thisWeekReminders} onRefresh={fetchReminders} onDeleted={handleDeleted} />
        <Column title="This Month" reminders={laterReminders} onRefresh={fetchReminders} onDeleted={handleDeleted} />
        <Column title="Completed" reminders={completed} onRefresh={fetchReminders} onDeleted={handleDeleted} />
      </div>

      {recentlyDeleted.length > 0 && (
        <div className="fixed bottom-4 right-4 w-72 bg-white border border-gray-200 rounded-xl shadow-lg px-4 pt-4 pb-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Recently Deleted
          </h2>
          {recentlyDeleted.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-2"
            >
              <p className="text-sm text-gray-400 truncate">{reminder.title}</p>
              <button
                onClick={() => handleRestore(reminder)}
                className="text-xs text-gray-500 border border-gray-300 bg-white rounded px-2 py-1 ml-3 shrink-0 hover:bg-gray-200 transition-colors duration-150"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
