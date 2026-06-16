import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { Task } from "../types";
import { apiFetch } from "../lib/api";
import Layout from "../components/Layout";

function TaskCard({
  task,
  onRefresh,
  onDeleted,
}: {
  task: Task;
  onRefresh: () => Promise<void>;
  onDeleted: (task: Task) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description ?? "");
  const [editDueDate, setEditDueDate] = useState(
    task.dueDate ? task.dueDate.slice(0, 10) : ""
  );

  function openEdit() {
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setEditing(true);
  }

  async function handleComplete() {
    const res = await apiFetch(`/api/v1/tasks/${task.id}/complete`, {
      method: "PATCH",
    });
    if (res.ok) await onRefresh();
  }

  async function handleDelete() {
    const res = await apiFetch(`/api/v1/tasks/${task.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      onDeleted(task);
      await onRefresh();
    }
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    const res = await apiFetch(`/api/v1/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: editTitle,
        description: editDescription || null,
        dueDate: editDueDate || null,
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
        className="bg-white rounded-lg shadow-sm border border-gray-300 p-4 mb-2"
      >
        <label className="block mb-2">
          <span className="text-xs font-medium text-gray-500">Title</span>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
            autoFocus
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </label>
        <label className="block mb-2">
          <span className="text-xs font-medium text-gray-500">
            Description <span className="text-gray-400 font-normal">(optional)</span>
          </span>
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none"
          />
        </label>
        <label className="block mb-3">
          <span className="text-xs font-medium text-gray-500">
            Due date <span className="text-gray-400 font-normal">(optional)</span>
          </span>
          <input
            type="date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-gray-900 text-white rounded px-3 py-1.5 text-sm font-medium hover:bg-gray-700 transition-colors duration-150"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex-1 border border-gray-300 bg-white text-gray-600 rounded px-3 py-1.5 text-sm hover:bg-gray-200 transition-colors duration-150"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-2 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-gray-900 font-medium truncate">{task.title}</p>
        {task.description && (
          <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
        )}
        {task.dueDate && (
          <p className="text-xs text-gray-400 mt-0.5">
            Due {new Date(task.dueDate.slice(0, 10) + "T00:00:00").toLocaleDateString()}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {task.status === "UPCOMING" && (
          <button
            onClick={handleComplete}
            title="Mark complete"
            className="text-green-600 hover:text-green-800 px-1.5 py-1 rounded hover:bg-green-50 transition-colors duration-150 text-base leading-none"
          >
            ✓
          </button>
        )}
        <button
          onClick={handleDelete}
          title="Delete"
          className="text-red-400 hover:text-red-600 px-1.5 py-1 rounded hover:bg-red-50 transition-colors duration-150 text-base leading-none"
        >
          ✕
        </button>
        <button
          onClick={openEdit}
          title="Edit"
          className="text-gray-400 hover:text-gray-700 px-1.5 py-1 rounded hover:bg-gray-100 transition-colors duration-150 text-base leading-none tracking-tighter"
        >
          ···
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  tasks,
  onRefresh,
  onDeleted,
  alwaysShow = false,
}: {
  title: string;
  tasks: Task[];
  onRefresh: () => Promise<void>;
  onDeleted: (task: Task) => void;
  alwaysShow?: boolean;
}) {
  if (tasks.length === 0 && !alwaysShow) return null;
  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {title}
      </h2>
      {tasks.length === 0 ? (
        <p className="text-xs text-gray-300 italic">Nothing here yet.</p>
      ) : (
        tasks.map((task) => (
          <TaskCard key={task.id} task={task} onRefresh={onRefresh} onDeleted={onDeleted} />
        ))
      )}
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleDeleted(task: Task) {
    setRecentlyDeleted((prev) => [task, ...prev].slice(0, 5));
  }

  async function handleRestore(task: Task) {
    const res = await apiFetch("/api/v1/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : undefined,
      }),
    });
    if (res.ok) {
      setRecentlyDeleted((prev) => prev.filter((t) => t.id !== task.id));
      await fetchTasks();
    }
  }

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = tasks.filter(
    (t) => t.status === "UPCOMING" && t.dueDate && new Date(t.dueDate.slice(0, 10) + "T00:00:00") < today
  );
  const upcoming = tasks.filter(
    (t) => t.status === "UPCOMING" && t.dueDate && new Date(t.dueDate.slice(0, 10) + "T00:00:00") >= today
  );
  const backlog = tasks.filter(
    (t) => t.status === "UPCOMING" && !t.dueDate
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
                Due date{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
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
          <Section title="Overdue" tasks={overdue} onRefresh={fetchTasks} onDeleted={handleDeleted} />
          <Section title="Upcoming" tasks={upcoming} onRefresh={fetchTasks} onDeleted={handleDeleted} />
          <Section title="Backlog" tasks={backlog} onRefresh={fetchTasks} onDeleted={handleDeleted} />
          <Section title="Completed" tasks={completed} onRefresh={fetchTasks} onDeleted={handleDeleted} alwaysShow />
          {tasks.length === 0 && !showForm && (
            <p className="text-sm text-gray-400 text-center">No tasks yet.</p>
          )}
        </div>
      </div>

      {recentlyDeleted.length > 0 && (
        <div className="fixed bottom-4 right-4 w-72 bg-white border border-gray-200 rounded-xl shadow-lg px-4 pt-4 pb-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Recently Deleted
          </h2>
          {recentlyDeleted.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-2"
            >
              <div className="min-w-0">
                <p className="text-sm text-gray-400 truncate">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-gray-300 truncate">{task.description}</p>
                )}
              </div>
              <button
                onClick={() => handleRestore(task)}
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
