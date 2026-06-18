import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { Task } from "../types";
import { apiFetch } from "../lib/api";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

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
    const res = await apiFetch(`/api/v1/tasks/${task.id}/complete`, { method: "PATCH" });
    if (res.ok) await onRefresh();
  }

  async function handleDelete() {
    const res = await apiFetch(`/api/v1/tasks/${task.id}`, { method: "DELETE" });
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
      <Card className="mb-2">
        <form onSubmit={handleEdit}>
          <label className="block mb-2">
            <span className="text-xs font-medium text-white/50">Title</span>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
              autoFocus
              className="mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
            />
          </label>
          <label className="block mb-2">
            <span className="text-xs font-medium text-white/50">
              Description <span className="text-white/30">(optional)</span>
            </span>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-white/40"
            />
          </label>
          <label className="block mb-3">
            <span className="text-xs font-medium text-white/50">
              Due date <span className="text-white/30">(optional)</span>
            </span>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
            />
          </label>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 py-1.5">Save</Button>
            <Button variant="secondary" type="button" onClick={() => setEditing(false)} className="flex-1 py-1.5">Cancel</Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card className="mb-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white font-medium truncate">{task.title}</p>
          {task.description && <p className="text-xs text-white/50 mt-0.5">{task.description}</p>}
          {task.dueDate && (
            <p className="text-xs text-white/40 mt-0.5">
              Due {new Date(task.dueDate.slice(0, 10) + "T00:00:00").toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {task.status === "UPCOMING" && (
            <button onClick={handleComplete} title="Mark complete" className="text-emerald-400 hover:text-emerald-300 px-1.5 py-1 rounded hover:bg-white/10 transition-colors duration-150 text-base leading-none">✓</button>
          )}
          <button onClick={handleDelete} title="Delete" className="text-red-400 hover:text-red-300 px-1.5 py-1 rounded hover:bg-white/10 transition-colors duration-150 text-base leading-none">✕</button>
          <button onClick={openEdit} title="Edit" className="text-white/40 hover:text-white px-1.5 py-1 rounded hover:bg-white/10 transition-colors duration-150 text-base leading-none tracking-tighter">···</button>
        </div>
      </div>
    </Card>
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
      <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">{title}</h2>
      {tasks.length === 0 ? (
        <p className="text-xs text-white/30 italic">Nothing here yet.</p>
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
  const backlog = tasks.filter((t) => t.status === "UPCOMING" && !t.dueDate);
  const completed = tasks.filter((t) => t.status === "COMPLETED");

  return (
    <Layout>
      <div className="flex flex-col items-center">
        <div className="w-full max-w-md flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "+ Add task"}
          </Button>
        </div>

        {showForm && (
          <Card className="w-full max-w-md mb-8">
            <form onSubmit={handleCreate}>
              {error && <p className="text-red-300 text-sm mb-3">{error}</p>}
              <label className="block mb-3">
                <span className="text-sm font-medium text-white/70">Title</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                  className="mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
                />
              </label>
              <label className="block mb-4">
                <span className="text-sm font-medium text-white/70">
                  Due date <span className="text-white/30">(optional)</span>
                </span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
                />
              </label>
              <Button type="submit" className="w-full py-2.5">Save task</Button>
            </form>
          </Card>
        )}

        <div className="w-full max-w-md">
          <Section title="Overdue" tasks={overdue} onRefresh={fetchTasks} onDeleted={handleDeleted} />
          <Section title="Upcoming" tasks={upcoming} onRefresh={fetchTasks} onDeleted={handleDeleted} />
          <Section title="Backlog" tasks={backlog} onRefresh={fetchTasks} onDeleted={handleDeleted} />
          <Section title="Completed" tasks={completed} onRefresh={fetchTasks} onDeleted={handleDeleted} alwaysShow />
          {tasks.length === 0 && !showForm && (
            <p className="text-sm text-white/40 text-center">No tasks yet.</p>
          )}
        </div>
      </div>

      {recentlyDeleted.length > 0 && (
        <div className="fixed bottom-4 right-4 w-72 glass rounded-xl px-4 pt-4 pb-5">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3">Recently Deleted</h2>
          {recentlyDeleted.map((task) => (
            <div key={task.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-2">
              <div className="min-w-0">
                <p className="text-sm text-white/50 truncate">{task.title}</p>
                {task.description && <p className="text-xs text-white/30 truncate">{task.description}</p>}
              </div>
              <Button variant="secondary" onClick={() => handleRestore(task)} className="text-xs px-2 py-1 ml-3 shrink-0">Restore</Button>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
