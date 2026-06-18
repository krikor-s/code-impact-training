import React, { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import { apiFetch } from "../lib/api";
import type { Event, Task, Reminder, RepeatFrequency } from "../types";

type View = "month" | "week" | "day";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const HOUR_HEIGHT = 60;

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function toLocalInput(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function taskOnDay(task: Task, day: Date) {
  if (!task.dueDate) return false;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const dayStr = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
  return task.dueDate.slice(0, 10) === dayStr;
}

function reminderOnDay(reminder: Reminder, day: Date) {
  return isSameDay(new Date(reminder.scheduledAt), day);
}

function eventOnDay(event: Event, day: Date) {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
  return start <= dayEnd && end >= dayStart;
}

function layoutDayEvents(dayEvents: Event[]): Map<string, { col: number; cols: number }> {
  const result = new Map<string, { col: number; cols: number }>();
  const sorted = [...dayEvents].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const groups: Event[][] = [];
  let currentGroup: Event[] = [];
  let groupEnd = -Infinity;
  for (const event of sorted) {
    const start = new Date(event.startAt).getTime();
    const end = new Date(event.endAt).getTime();
    if (start < groupEnd) {
      currentGroup.push(event);
      groupEnd = Math.max(groupEnd, end);
    } else {
      if (currentGroup.length > 0) groups.push(currentGroup);
      currentGroup = [event];
      groupEnd = end;
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);
  for (const group of groups) {
    group.forEach((event, i) => result.set(event.id, { col: i, cols: group.length }));
  }
  return result;
}

type CreateType = "event" | "reminder" | "task";

function CreateFormModal({
  defaultDate,
  onSaveEvent,
  onSaveReminder,
  onSaveTask,
  onClose,
}: {
  defaultDate: Date;
  onSaveEvent: (data: { title: string; description?: string; startAt: string; endAt: string }) => Promise<void>;
  onSaveReminder: (data: { title: string; scheduledAt: string; repeatFrequency: RepeatFrequency }) => Promise<void>;
  onSaveTask: (data: { title: string; description?: string; dueDate: string }) => Promise<void>;
  onClose: () => void;
}) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateStr = `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth() + 1)}-${pad(defaultDate.getDate())}`;
  const defaultEnd = new Date(defaultDate);
  defaultEnd.setHours(defaultEnd.getHours() + 1);

  const [type, setType] = useState<CreateType>("event");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState(toLocalInput(defaultDate));
  const [endAt, setEndAt] = useState(toLocalInput(defaultEnd));
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(defaultDate));
  const [repeatFrequency, setRepeatFrequency] = useState<RepeatFrequency>("NONE");
  const [dueDate, setDueDate] = useState(dateStr);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (type === "event") {
      if (new Date(startAt) >= new Date(endAt)) { setError("End must be after start"); return; }
      await onSaveEvent({ title, description: description || undefined, startAt, endAt });
    } else if (type === "reminder") {
      await onSaveReminder({ title, scheduledAt, repeatFrequency });
    } else {
      await onSaveTask({ title, description: description || undefined, dueDate });
    }
  }

  const inputClass = "bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="glass-strong relative rounded-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-white mb-4">Create New</h2>
        {error && <p className="text-red-300 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-white/50">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as CreateType)} className={inputClass}>
              <option value="event">Event</option>
              <option value="reminder">Reminder</option>
              <option value="task">Task</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-white/50">Title</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus className={inputClass} />
          </label>
          {(type === "event" || type === "task") && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-white/50">Description <span className="text-white/30">(optional)</span></span>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
            </label>
          )}
          {type === "event" && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-white/50">Start</span>
                <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required className={inputClass} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-white/50">End</span>
                <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} required className={inputClass} />
              </label>
            </>
          )}
          {type === "reminder" && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-white/50">Scheduled at</span>
                <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required className={inputClass} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-white/50">Repeat</span>
                <select value={repeatFrequency} onChange={(e) => setRepeatFrequency(e.target.value as RepeatFrequency)} className={inputClass}>
                  <option value="NONE">None</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </label>
            </>
          )}
          {type === "task" && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-white/50">Due date</span>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className={inputClass} />
            </label>
          )}
          <div className="flex gap-2 mt-1">
            <Button type="submit" className="flex-1 py-2">Create</Button>
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1 py-2">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventFormModal({
  mode,
  event,
  defaultStart,
  onSave,
  onDelete,
  onClose,
}: {
  mode: "create" | "edit";
  event?: Event;
  defaultStart?: Date;
  onSave: (data: { title: string; description?: string; startAt: string; endAt: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}) {
  const base = defaultStart ?? new Date();
  const defaultEnd = new Date(base);
  defaultEnd.setHours(defaultEnd.getHours() + 1);

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [startAt, setStartAt] = useState(event ? toLocalInput(new Date(event.startAt)) : toLocalInput(base));
  const [endAt, setEndAt] = useState(event ? toLocalInput(new Date(event.endAt)) : toLocalInput(defaultEnd));
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (new Date(startAt) >= new Date(endAt)) {
      setError("End must be after start");
      return;
    }
    await onSave({ title, description: description || undefined, startAt, endAt });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="glass-strong relative rounded-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-white mb-4">
          {mode === "create" ? "New Event" : "Edit Event"}
        </h2>
        {error && <p className="text-red-300 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-white/50">Title</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-white/50">Description</span>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-white/50">Start</span>
            <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-white/50">End</span>
            <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} required className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40" />
          </label>
          <div className="flex gap-2 mt-1">
            <Button type="submit" className="flex-1 py-2">{mode === "create" ? "Create" : "Save"}</Button>
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1 py-2">Cancel</Button>
          </div>
          {mode === "edit" && onDelete && (
            <button type="button" onClick={onDelete} className="w-full text-red-300 border border-red-400/30 rounded-lg px-3 py-2 text-sm hover:bg-red-400/10 transition-colors duration-150">
              Delete event
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function ReminderFormModal({
  reminder,
  onSave,
  onDelete,
  onClose,
}: {
  reminder: Reminder;
  onSave: (data: { title: string; scheduledAt: string; repeatFrequency: RepeatFrequency }) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(reminder.title);
  const [scheduledAt, setScheduledAt] = useState(reminder.scheduledAt.slice(0, 16));
  const [repeatFrequency, setRepeatFrequency] = useState<RepeatFrequency>(reminder.repeatFrequency);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSave({ title, scheduledAt, repeatFrequency });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="glass-strong relative rounded-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-white mb-4">Edit Reminder</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-white/50">Title</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-white/50">Scheduled at</span>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-white/50">Repeat</span>
            <select value={repeatFrequency} onChange={(e) => setRepeatFrequency(e.target.value as RepeatFrequency)} className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40">
              <option value="NONE">None</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </label>
          <div className="flex gap-2 mt-1">
            <Button type="submit" className="flex-1 py-2">Save</Button>
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1 py-2">Cancel</Button>
          </div>
          <button type="button" onClick={onDelete} className="w-full text-red-300 border border-red-400/30 rounded-lg px-3 py-2 text-sm hover:bg-red-400/10 transition-colors duration-150">
            Delete reminder
          </button>
        </form>
      </div>
    </div>
  );
}

function TaskEditModal({
  task,
  onSave,
  onDelete,
  onClose,
}: {
  task: Task;
  onSave: (data: { title: string; description?: string | null; dueDate?: string | null }) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : "");

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSave({ title, description: description || null, dueDate: dueDate || null });
  }

  const inputClass = "bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="glass-strong relative rounded-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-white mb-4">Edit Task</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-white/50">Title</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-white/50">Description <span className="text-white/30">(optional)</span></span>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-white/50">Due date</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
          </label>
          <div className="flex gap-2 mt-1">
            <Button type="submit" className="flex-1 py-2">Save</Button>
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1 py-2">Cancel</Button>
          </div>
          <button type="button" onClick={onDelete} className="w-full text-red-300 border border-red-400/30 rounded-lg px-3 py-2 text-sm hover:bg-red-400/10 transition-colors duration-150">
            Delete task
          </button>
        </form>
      </div>
    </div>
  );
}

function TimeGrid({
  days, events, tasks, reminders, onSlotClick, onEventClick, onReminderClick, onTaskClick,
}: {
  days: Date[];
  events: Event[];
  tasks: Task[];
  reminders: Reminder[];
  onSlotClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onReminderClick: (reminder: Reminder) => void;
  onTaskClick: (task: Task) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_HEIGHT; }, []);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  return (
    <div className="flex flex-col flex-1 border border-white/15 rounded-xl overflow-hidden">
      <div className="flex border-b border-white/15 bg-white/5">
        <div className="w-12 shrink-0" />
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div key={i} className="flex-1 text-center py-2 border-l border-white/10">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">{DAY_NAMES[day.getDay()]}</p>
              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mt-0.5 ${isToday ? "bg-white/20 text-white" : "text-white/70"}`}>
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex border-b border-white/15 bg-white/5">
        <div className="w-12 shrink-0 flex items-center justify-end pr-2 py-1">
          <span className="text-xs text-white/30">all-day</span>
        </div>
        {days.map((day, i) => {
          const dayTasks = tasks.filter((t) => taskOnDay(t, day));
          return (
            <div key={i} className="flex-1 border-l border-white/10 py-0.5 px-1 min-h-5">
              {dayTasks.map((task) => (
                <div key={task.id} data-event onClick={() => onTaskClick(task)} className="text-xs bg-amber-500/80 text-white rounded px-1 py-0.5 truncate mb-0.5 cursor-pointer hover:bg-amber-400/80 transition-colors duration-150">{task.title}</div>
              ))}
            </div>
          );
        })}
      </div>

      <div ref={scrollRef} className="flex overflow-y-auto" style={{ maxHeight: 600 }}>
        <div className="w-12 shrink-0 relative" style={{ height: 24 * HOUR_HEIGHT }}>
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="absolute right-2 text-xs text-white/30" style={{ top: h * HOUR_HEIGHT - 8 }}>
              {h === 0 ? "" : `${h}:00`}
            </div>
          ))}
        </div>

        {days.map((day, di) => {
          const dayEvents = events.filter((e) => eventOnDay(e, day));
          const layout = layoutDayEvents(dayEvents);
          const dayReminders = reminders.filter((r) => reminderOnDay(r, day));
          return (
            <div
              key={di}
              className="flex-1 relative border-l border-white/10"
              style={{ height: 24 * HOUR_HEIGHT }}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("[data-event]")) return;
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const y = e.clientY - rect.top;
                const hour = Math.floor(y / HOUR_HEIGHT);
                const minutes = Math.round(((y % HOUR_HEIGHT) / HOUR_HEIGHT) * 60 / 15) * 15;
                const d = new Date(day); d.setHours(hour, minutes, 0, 0);
                onSlotClick(d);
              }}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="absolute w-full border-t border-white/5 pointer-events-none" style={{ top: h * HOUR_HEIGHT }} />
              ))}
              {dayReminders.map((reminder) => {
                const scheduled = new Date(reminder.scheduledAt);
                const top = (scheduled.getHours() + scheduled.getMinutes() / 60) * HOUR_HEIGHT;
                return (
                  <div key={reminder.id} data-event className="absolute z-10 rounded px-1.5 py-0.5 bg-violet-500/80 text-white text-xs overflow-hidden cursor-pointer hover:bg-violet-400/80 transition-colors duration-150" style={{ top, height: 22, left: 0, right: 0 }} onClick={() => onReminderClick(reminder)}>
                    <p className="font-medium truncate leading-tight">{reminder.title}</p>
                  </div>
                );
              })}
              {dayEvents.map((event) => {
                const start = new Date(event.startAt);
                const end = new Date(event.endAt);
                const top = (start.getHours() + start.getMinutes() / 60) * HOUR_HEIGHT;
                const height = Math.max(20, ((end.getTime() - start.getTime()) / 3600000) * HOUR_HEIGHT);
                const pos = layout.get(event.id) ?? { col: 0, cols: 1 };
                const width = 100 / pos.cols;
                const left = pos.col * width;
                return (
                  <div
                    key={event.id}
                    data-event
                    onClick={() => onEventClick(event)}
                    className="absolute z-10 rounded px-1.5 py-0.5 bg-cyan-500/80 text-white text-xs overflow-hidden cursor-pointer hover:bg-cyan-400/80 transition-colors duration-150"
                    style={{ top, height, left: `${left}%`, width: `${width}%` }}
                  >
                    <p className="font-medium truncate leading-tight">{event.title}</p>
                    <p className="text-white/50 truncate leading-tight">{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthView({
  cursor, today, events, tasks, reminders, onDayClick, onEventClick, onReminderClick, onTaskClick,
}: {
  cursor: Date; today: Date; events: Event[]; tasks: Task[]; reminders: Reminder[];
  onDayClick: (date: Date) => void; onEventClick: (event: Event) => void; onReminderClick: (reminder: Reminder) => void; onTaskClick: (task: Task) => void;
}) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = new Date(firstDay);
  startDay.setDate(startDay.getDate() - startDay.getDay());
  const cells: Date[] = [];
  const d = new Date(startDay);
  while (cells.length < 42) { cells.push(new Date(d)); d.setDate(d.getDate() + 1); }

  return (
    <div className="flex-1">
      <div className="grid grid-cols-7 border-l border-t border-white/15 rounded-xl overflow-hidden">
        {DAY_NAMES.map((name) => (
          <div key={name} className="border-r border-b border-white/15 py-2 text-center text-xs font-semibold text-white/50 uppercase tracking-wide bg-white/5">
            {name}
          </div>
        ))}
        {cells.map((cell, i) => {
          const isToday = isSameDay(cell, today);
          const isCurrentMonth = cell.getMonth() === month;
          const dayEvents = events.filter((e) => eventOnDay(e, cell));
          const dayTasks = tasks.filter((t) => taskOnDay(t, cell));
          const dayReminders = reminders.filter((r) => reminderOnDay(r, cell));
          const allItems = [
            ...dayEvents.map((e) => ({ type: "event" as const, id: e.id, title: e.title, event: e, reminder: undefined as Reminder | undefined, task: undefined as Task | undefined })),
            ...dayTasks.map((t) => ({ type: "task" as const, id: t.id, title: t.title, event: undefined as Event | undefined, reminder: undefined as Reminder | undefined, task: t })),
            ...dayReminders.map((r) => ({ type: "reminder" as const, id: r.id, title: r.title, event: undefined as Event | undefined, reminder: r, task: undefined as Task | undefined })),
          ];
          return (
            <div
              key={i}
              onClick={(e) => { if (!(e.target as HTMLElement).closest("[data-event]")) onDayClick(cell); }}
              className={`border-r border-b border-white/15 min-h-22.5 p-2 cursor-pointer hover:bg-white/5 transition-colors duration-150 ${isCurrentMonth ? "bg-transparent" : "bg-white/2"}`}
            >
              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${isToday ? "bg-white/20 text-white" : isCurrentMonth ? "text-white/70" : "text-white/20"}`}>
                {cell.getDate()}
              </span>
              <div className="mt-1 flex flex-col gap-0.5">
                {allItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    {...(item.type === "event" ? { "data-event": true, onClick: () => onEventClick(item.event!) } : {})}
                    {...(item.type === "reminder" ? { "data-event": true, onClick: () => onReminderClick(item.reminder!) } : {})}
                    {...(item.type === "task" ? { "data-event": true, onClick: () => onTaskClick(item.task!) } : {})}
                    className={`relative z-10 text-xs text-white rounded px-1.5 py-0.5 truncate transition-colors duration-150 cursor-pointer ${
                      item.type === "event" ? "bg-cyan-500/80 hover:bg-cyan-400/80"
                        : item.type === "task" ? "bg-amber-500/80 hover:bg-amber-400/80"
                        : "bg-violet-500/80 hover:bg-violet-400/80"
                    }`}
                  >
                    {item.title}
                  </div>
                ))}
                {allItems.length > 3 && <p className="text-xs text-white/30">+{allItems.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(new Date(today));
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; event?: Event; defaultStart?: Date } | null>(null);
  const [reminderModal, setReminderModal] = useState<Reminder | null>(null);
  const [taskModal, setTaskModal] = useState<Task | null>(null);
  const [createDate, setCreateDate] = useState<Date | null>(null);

  async function fetchAll() {
    const [eventsRes, tasksRes, remindersRes] = await Promise.all([
      apiFetch("/api/v1/events"), apiFetch("/api/v1/tasks"), apiFetch("/api/v1/reminders"),
    ]);
    if (eventsRes.ok) { const data = (await eventsRes.json()) as { data: Event[] }; setEvents(data.data); }
    if (tasksRes.ok) { const data = (await tasksRes.json()) as { data: Task[] }; setTasks(data.data); }
    if (remindersRes.ok) { const data = (await remindersRes.json()) as { data: Reminder[] }; setReminders(data.data); }
  }

  async function handleReminderSave(data: { title: string; scheduledAt: string; repeatFrequency: RepeatFrequency }) {
    if (!reminderModal) return;
    const res = await apiFetch(`/api/v1/reminders/${reminderModal.id}`, { method: "PATCH", body: JSON.stringify(data) });
    if (res.ok) { setReminderModal(null); await fetchAll(); }
  }

  async function handleReminderDelete() {
    if (!reminderModal) return;
    const res = await apiFetch(`/api/v1/reminders/${reminderModal.id}`, { method: "DELETE" });
    if (res.ok) { setReminderModal(null); await fetchAll(); }
  }

  async function handleTaskSave(data: { title: string; description?: string | null; dueDate?: string | null }) {
    if (!taskModal) return;
    const res = await apiFetch(`/api/v1/tasks/${taskModal.id}`, { method: "PATCH", body: JSON.stringify(data) });
    if (res.ok) { setTaskModal(null); await fetchAll(); }
  }

  async function handleTaskDelete() {
    if (!taskModal) return;
    const res = await apiFetch(`/api/v1/tasks/${taskModal.id}`, { method: "DELETE" });
    if (res.ok) { setTaskModal(null); await fetchAll(); }
  }

  useEffect(() => {
    async function load() {
      const [eventsRes, tasksRes, remindersRes] = await Promise.all([
        apiFetch("/api/v1/events"), apiFetch("/api/v1/tasks"), apiFetch("/api/v1/reminders"),
      ]);
      if (eventsRes.ok) { const d = (await eventsRes.json()) as { data: Event[] }; setEvents(d.data); }
      if (tasksRes.ok) { const d = (await tasksRes.json()) as { data: Task[] }; setTasks(d.data); }
      if (remindersRes.ok) { const d = (await remindersRes.json()) as { data: Reminder[] }; setReminders(d.data); }
    }
    void load();
  }, []);

  async function handleSave(data: { title: string; description?: string; startAt: string; endAt: string }) {
    if (modal?.mode === "create") {
      const res = await apiFetch("/api/v1/events", { method: "POST", body: JSON.stringify(data) });
      if (res.ok) { setModal(null); await fetchAll(); }
    } else if (modal?.mode === "edit" && modal.event) {
      const res = await apiFetch(`/api/v1/events/${modal.event.id}`, { method: "PATCH", body: JSON.stringify(data) });
      if (res.ok) { setModal(null); await fetchAll(); }
    }
  }

  async function handleDelete() {
    if (!modal?.event) return;
    const res = await apiFetch(`/api/v1/events/${modal.event.id}`, { method: "DELETE" });
    if (res.ok) { setModal(null); await fetchAll(); }
  }

  function navigate(dir: -1 | 1) {
    setCursor((prev) => {
      const d = new Date(prev);
      if (view === "month") d.setMonth(d.getMonth() + dir);
      else if (view === "week") d.setDate(d.getDate() + dir * 7);
      else d.setDate(d.getDate() + dir);
      return d;
    });
  }

  function headerLabel() {
    if (view === "month") return `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (view === "week") {
      const week = startOfWeek(cursor);
      const end = new Date(week); end.setDate(end.getDate() + 6);
      return week.getMonth() === end.getMonth()
        ? `${MONTH_NAMES[week.getMonth()]} ${week.getDate()} – ${end.getDate()}, ${end.getFullYear()}`
        : `${MONTH_NAMES[week.getMonth()]} ${week.getDate()} – ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getDate()}, ${cursor.getFullYear()}`;
  }

  function getWeekDays() {
    const week = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(week); d.setDate(d.getDate() + i); return d; });
  }

  function openCreate(date: Date) {
    const start = new Date(date);
    if (view === "month") start.setHours(12, 0, 0, 0);
    setCreateDate(start);
  }

  async function handleCreateEvent(data: { title: string; description?: string; startAt: string; endAt: string }) {
    const res = await apiFetch("/api/v1/events", { method: "POST", body: JSON.stringify(data) });
    if (res.ok) { setCreateDate(null); await fetchAll(); }
  }

  async function handleCreateReminder(data: { title: string; scheduledAt: string; repeatFrequency: RepeatFrequency }) {
    const res = await apiFetch("/api/v1/reminders", { method: "POST", body: JSON.stringify(data) });
    if (res.ok) { setCreateDate(null); await fetchAll(); }
  }

  async function handleCreateTask(data: { title: string; description?: string; dueDate: string }) {
    const res = await apiFetch("/api/v1/tasks", { method: "POST", body: JSON.stringify(data) });
    if (res.ok) { setCreateDate(null); await fetchAll(); }
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <div className="flex border border-white/20 rounded-lg overflow-hidden text-sm">
          {(["month", "week", "day"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 capitalize font-medium transition-colors duration-150 ${
                view === v ? "bg-white/20 text-white" : "text-white/50 hover:bg-white/10 hover:text-white"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-2 text-xs">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-cyan-500/80 inline-block" />  <span className="text-white/40">Event</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500/80 inline-block" /> <span className="text-white/40">Task</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-violet-500/80 inline-block" /> <span className="text-white/40">Reminder</span></div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Button variant="secondary" onClick={() => setCursor(new Date(today))} className="py-1.5 px-3">Today</Button>
        <div className="flex gap-1">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-white/10 transition-colors duration-150 text-white/50 hover:text-white" aria-label="Previous">‹</button>
          <button onClick={() => navigate(1)} className="p-1.5 rounded hover:bg-white/10 transition-colors duration-150 text-white/50 hover:text-white" aria-label="Next">›</button>
        </div>
        <span className="text-base font-semibold text-white">{headerLabel()}</span>
      </div>

      {view === "month" && (
        <MonthView cursor={cursor} today={today} events={events} tasks={tasks} reminders={reminders} onDayClick={openCreate} onEventClick={(event) => setModal({ mode: "edit", event })} onReminderClick={setReminderModal} onTaskClick={setTaskModal} />
      )}
      {view === "week" && (
        <TimeGrid days={getWeekDays()} events={events} tasks={tasks} reminders={reminders} onSlotClick={openCreate} onEventClick={(event) => setModal({ mode: "edit", event })} onReminderClick={setReminderModal} onTaskClick={setTaskModal} />
      )}
      {view === "day" && (
        <div className="max-w-xl">
          <TimeGrid days={[cursor]} events={events} tasks={tasks} reminders={reminders} onSlotClick={openCreate} onEventClick={(event) => setModal({ mode: "edit", event })} onReminderClick={setReminderModal} onTaskClick={setTaskModal} />
        </div>
      )}

      {modal && (
        <EventFormModal
          mode={modal.mode}
          event={modal.event}
          defaultStart={modal.defaultStart}
          onSave={handleSave}
          onDelete={modal.mode === "edit" ? handleDelete : undefined}
          onClose={() => setModal(null)}
        />
      )}

      {reminderModal && (
        <ReminderFormModal
          reminder={reminderModal}
          onSave={handleReminderSave}
          onDelete={handleReminderDelete}
          onClose={() => setReminderModal(null)}
        />
      )}

      {taskModal && (
        <TaskEditModal
          task={taskModal}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
          onClose={() => setTaskModal(null)}
        />
      )}

      {createDate && (
        <CreateFormModal
          defaultDate={createDate}
          onSaveEvent={handleCreateEvent}
          onSaveReminder={handleCreateReminder}
          onSaveTask={handleCreateTask}
          onClose={() => setCreateDate(null)}
        />
      )}
    </Layout>
  );
}
