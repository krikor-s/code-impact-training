import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { Task } from "../types";
import { apiFetch } from "../lib/api";
import Layout from "../components/Layout";

function Section({ title, tasks }: { title: string; tasks: Task[] }) {
  if (tasks.length === 0) return null;
  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {title}
      </h2>
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-2"
        >
          <p className="text-gray-900 font-medium">{task.title}</p>
          {task.dueDate && (
            <p className="text-xs text-gray-400 mt-1">
              Due {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function fetchTasks() {
    const res = await apiFetch("/api/v1/tasks");
    if (!res.ok) return;
    const data = (await res.json()) as { data: Task[] };
    setTasks(data.data);
  }

  useEffect(() => {
    async function load() {
      const res = await apiFetch("/api/v1/tasks");
      if (!res.ok) return;
      const data = (await res.json()) as { data: Task[] };
      setTasks(data.data);
    }
    void load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await apiFetch("/api/v1/tasks", {
      method: "POST",
      body: JSON.stringify({ title, dueDate: dueDate || undefined }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Failed to create task");
      return;
    }
    setTitle("");
    setDueDate("");
    setShowForm(false);
    await fetchTasks();
  }

  const now = new Date();
  const overdue = tasks.filter(
    (t) => t.status === "UPCOMING" && t.dueDate && new Date(t.dueDate) < now
  );
  const upcoming = tasks.filter(
    (t) => t.status === "UPCOMING" && (!t.dueDate || new Date(t.dueDate) >= now)
  );
  const completed = tasks.filter((t) => t.status === "COMPLETED");

  return (
    <Layout>
      <div className="flex flex-col items-center">
        <div className="w-full max-w-md flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-sm font-medium text-gray-600 border border-gray-300 bg-white px-4 py-2 rounded hover:bg-gray-200 transition-colors duration-150"
          >
            {showForm ? "Cancel" : "+ Add task"}
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
            <label className="block mb-4">
              <span className="text-sm font-medium text-gray-700">
                Due date <span className="text-gray-400 font-normal">(optional)</span>
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="w-full bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors duration-150"
            >
              Save task
            </button>
          </form>
        )}

        <div className="w-full max-w-md">
          <Section title="Overdue" tasks={overdue} />
          <Section title="Upcoming" tasks={upcoming} />
          <Section title="Completed" tasks={completed} />
          {tasks.length === 0 && !showForm && (
            <p className="text-sm text-gray-400 text-center">No tasks yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
