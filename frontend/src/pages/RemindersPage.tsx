import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { Reminder, RepeatFrequency } from "../types";
import { apiFetch } from "../lib/api";
import Layout from "../components/Layout";

function ReminderCard({ reminder }: { reminder: Reminder }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-2">
      <p className="text-gray-900 font-medium">{reminder.title}</p>
      <p className="text-xs text-gray-400 mt-0.5">
        {new Date(reminder.scheduledAt).toLocaleString()}
      </p>
      {reminder.repeatFrequency !== "NONE" && (
        <p className="text-xs text-gray-400 mt-0.5">
          Repeats {reminder.repeatFrequency.toLowerCase()}
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  reminders,
  alwaysShow = false,
}: {
  title: string;
  reminders: Reminder[];
  alwaysShow?: boolean;
}) {
  if (reminders.length === 0 && !alwaysShow) return null;
  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {title}
      </h2>
      {reminders.length === 0 ? (
        <p className="text-xs text-gray-300 italic">Nothing here yet.</p>
      ) : (
        reminders.map((reminder) => (
          <ReminderCard key={reminder.id} reminder={reminder} />
        ))
      )}
    </div>
  );
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [repeatFrequency, setRepeatFrequency] = useState<RepeatFrequency>("NONE");
  const [error, setError] = useState<string | null>(null);

  async function fetchReminders() {
    const res = await apiFetch("/api/v1/reminders");
    if (!res.ok) return;
    const data = (await res.json()) as { data: Reminder[] };
    setReminders(data.data);
  }

  useEffect(() => {
    void fetchReminders();
  }, []);

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

  const upcoming = reminders.filter((r) => r.status === "UPCOMING");
  const completed = reminders.filter((r) => r.status === "COMPLETED");

  return (
    <Layout>
      <div className="flex flex-col items-center">
        <div className="w-full max-w-md flex justify-between items-center mb-8">
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
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 w-full max-w-md mb-8"
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
              className="w-full bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors duration-150"
            >
              Save reminder
            </button>
          </form>
        )}

        <div className="w-full max-w-md">
          <Section title="Upcoming" reminders={upcoming} alwaysShow />
          <Section title="Completed" reminders={completed} />
          {reminders.length === 0 && !showForm && (
            <p className="text-sm text-gray-400 text-center">No reminders yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
