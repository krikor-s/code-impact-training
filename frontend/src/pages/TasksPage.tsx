import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { Task } from "../types";
import { apiFetch } from "../lib/api";
import Layout from "../components/Layout";
import DatePicker from "../components/DatePicker";
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

  async function handleRepeat() {
    const res = await apiFetch("/api/v1/tasks", {
      method: "POST",
      body: JSON.stringify({ title: task.title, dueDate: task.dueDate ? task.dueDate.slice(0, 10) : undefined }),
    });
    if (res.ok) await onRefresh();
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
          <div className="block mb-3">
            <span className="text-xs font-medium text-white/50">
              Due date <span className="text-white/30">(optional)</span>
            </span>
            <DatePicker value={editDueDate} onChange={setEditDueDate} className="mt-1" />
          </div>
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
      <div className="flex items-start gap-3">
        {task.status === "UPCOMING" ? (
          <button
            onClick={handleComplete}
            className="mt-0.5 w-4 h-4 rounded border border-white/30 shrink-0 hover:bg-white/20 transition-colors"
            aria-label="Complete task"
          />
        ) : (
          <span className="mt-0.5 w-4 h-4 rounded bg-emerald-400/30 border border-emerald-400/50 shrink-0 flex items-center justify-center text-emerald-400 text-[10px]">✓</span>
        )}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={openEdit}>
          <p className={`text-white font-medium truncate ${task.status === "COMPLETED" ? "line-through text-white/50" : ""}`}>{task.title}</p>
          {task.description && <p className="text-xs text-white/50 mt-0.5">{task.description}</p>}
          {task.dueDate && (
            <p className="text-xs text-white/40 mt-0.5">
              Due {new Date(task.dueDate.slice(0, 10) + "T00:00:00").toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {task.status === "COMPLETED" && (
            <button onClick={handleRepeat} title="Repeat task" className="text-white/40 hover:text-white px-1.5 py-1 rounded hover:bg-white/10 transition-colors duration-150 text-xs leading-none">↻</button>
          )}
          <button onClick={handleDelete} title="Delete" className="text-red-400 hover:text-red-300 px-1.5 py-1 rounded hover:bg-white/10 transition-colors duration-150 text-base leading-none">✕</button>
        </div>
      </div>
    </Card>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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

  async function handleClearCompleted() {
    const completedTasks = tasks.filter((t) => t.status === "COMPLETED");
    await Promise.all(completedTasks.map((t) => apiFetch(`/api/v1/tasks/${t.id}`, { method: "DELETE" })));
    await fetchTasks();
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
      body: JSON.stringify({ title, description: description || undefined, dueDate: dueDate || undefined }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Failed to create task");
      return;
    }
    setTitle("");
    setDescription("");
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

  const inputClass = "mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40";

  return (
    <Layout>
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          {completed.length > 0 && (
            <button
              onClick={() => setShowCompleted((v) => !v)}
              className="text-xs font-semibold text-white/30 uppercase tracking-wide hover:text-white/50 transition-colors duration-150"
            >
              Completed ({completed.length}) {showCompleted ? "▾" : "▸"}
            </button>
          )}
        </div>

        {showForm ? (
          <Card className="mb-6 max-w-sm">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">New Task</p>
            {error && <p className="text-red-300 text-sm mb-3">{error}</p>}
            <form onSubmit={handleCreate}>
              <label className="block mb-2">
                <span className="text-xs text-white/50">Title</span>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus className={inputClass} />
              </label>
              <label className="block mb-2">
                <span className="text-xs text-white/50">Description <span className="text-white/30">(optional)</span></span>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
              </label>
              <div className="block mb-3">
                <span className="text-xs text-white/50">Due date <span className="text-white/30">(optional)</span></span>
                <DatePicker value={dueDate} onChange={setDueDate} className="mt-1" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="text-xs px-3 py-1.5">Save</Button>
                <Button variant="secondary" type="button" onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5">Cancel</Button>
              </div>
            </form>
          </Card>
        ) : (
          <div className="mb-6">
            <button
              onClick={() => setShowForm(true)}
              className="text-xs text-white/40 hover:text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors duration-150"
            >
              + New task
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">Overdue</h2>
            {overdue.length === 0 ? (
              <p className="text-xs text-white/30 italic">Nothing overdue.</p>
            ) : overdue.map((t) => (
              <TaskCard key={t.id} task={t} onRefresh={fetchTasks} onDeleted={handleDeleted} />
            ))}
          </div>
          <div>
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-xs text-white/30 italic">Nothing upcoming.</p>
            ) : upcoming.map((t) => (
              <TaskCard key={t.id} task={t} onRefresh={fetchTasks} onDeleted={handleDeleted} />
            ))}
          </div>
          <div>
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">Backlog</h2>
            {backlog.length === 0 ? (
              <p className="text-xs text-white/30 italic">No backlog tasks.</p>
            ) : backlog.map((t) => (
              <TaskCard key={t.id} task={t} onRefresh={fetchTasks} onDeleted={handleDeleted} />
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
              {completed.map((t) => (
                <TaskCard key={t.id} task={t} onRefresh={fetchTasks} onDeleted={handleDeleted} />
              ))}
            </div>
          </div>
        )}
      </div>

      {recentlyDeleted.length > 0 && (
        <div className="fixed bottom-4 right-4 w-72 glass rounded-xl px-4 pt-4 pb-5">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3">Recently Deleted</h2>
          {recentlyDeleted.map((task) => (
            <div key={task.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-2">
              <div className="min-w-0">
                <p className="text-sm text-white/50 truncate">{task.title}</p>
              </div>
              <Button variant="secondary" onClick={() => handleRestore(task)} className="text-xs px-2 py-1 ml-3 shrink-0">Restore</Button>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
