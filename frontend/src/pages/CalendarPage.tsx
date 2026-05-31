import React, { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import { apiFetch } from "../lib/api";
import type { Event, Task, Reminder } from "../types";

type View = "month" | "week" | "day";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const HOUR_HEIGHT = 60;

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);
  return start <= dayEnd && end >= dayStart;
}

function layoutDayEvents(dayEvents: Event[]): Map<string, { col: number; cols: number }> {
  const result = new Map<string, { col: number; cols: number }>();
  const sorted = [...dayEvents].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );

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
  const [startAt, setStartAt] = useState(
    event ? toLocalInput(new Date(event.startAt)) : toLocalInput(base)
  );
  const [endAt, setEndAt] = useState(
    event ? toLocalInput(new Date(event.endAt)) : toLocalInput(defaultEnd)
  );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm mx-4 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          {mode === "create" ? "New Event" : "Edit Event"}
        </h2>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Description</span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Start</span>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">End</span>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              required
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </label>
          <div className="flex gap-2 mt-1">
            <button
              type="submit"
              className="flex-1 bg-slate-700 text-white rounded px-3 py-2 text-sm font-medium hover:bg-slate-600 transition-colors duration-150"
            >
              {mode === "create" ? "Create" : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 bg-white text-gray-600 rounded px-3 py-2 text-sm hover:bg-gray-100 transition-colors duration-150"
            >
              Cancel
            </button>
          </div>
          {mode === "edit" && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="w-full text-red-500 border border-red-200 rounded px-3 py-2 text-sm hover:bg-red-50 transition-colors duration-150"
            >
              Delete event
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function TimeGrid({
  days,
  events,
  tasks,
  reminders,
  onSlotClick,
  onEventClick,
}: {
  days: Date[];
  events: Event[];
  tasks: Task[];
  reminders: Reminder[];
  onSlotClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * HOUR_HEIGHT;
    }
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="flex flex-col flex-1 border border-gray-200 rounded-lg overflow-hidden">
      {/* Day header row */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <div className="w-12 shrink-0" />
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div key={i} className="flex-1 text-center py-2 border-l border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {DAY_NAMES[day.getDay()]}
              </p>
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mt-0.5 ${
                  isToday ? "bg-slate-700 text-white" : "text-gray-800"
                }`}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* All-day row for tasks */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <div className="w-12 shrink-0 flex items-center justify-end pr-2 py-1">
          <span className="text-xs text-gray-400">all-day</span>
        </div>
        {days.map((day, i) => {
          const dayTasks = tasks.filter((t) => taskOnDay(t, day));
          return (
            <div key={i} className="flex-1 border-l border-gray-200 py-0.5 px-1 min-h-5">
              {dayTasks.map((task) => (
                <div key={task.id} className="text-xs bg-amber-500 text-white rounded px-1 py-0.5 truncate mb-0.5">
                  {task.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex overflow-y-auto" style={{ maxHeight: 600 }}>
        {/* Hour labels */}
        <div className="w-12 shrink-0 relative" style={{ height: 24 * HOUR_HEIGHT }}>
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="absolute right-2 text-xs text-gray-400"
              style={{ top: h * HOUR_HEIGHT - 8 }}
            >
              {h === 0 ? "" : `${h}:00`}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, di) => {
          const dayEvents = events.filter((e) => eventOnDay(e, day));
          const layout = layoutDayEvents(dayEvents);
          const dayReminders = reminders.filter((r) => reminderOnDay(r, day));

          return (
            <div
              key={di}
              className="flex-1 relative border-l border-gray-200"
              style={{ height: 24 * HOUR_HEIGHT }}
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const y = e.clientY - rect.top;
                const hour = Math.floor(y / HOUR_HEIGHT);
                const minutes = Math.round(((y % HOUR_HEIGHT) / HOUR_HEIGHT) * 60 / 15) * 15;
                const d = new Date(day);
                d.setHours(hour, minutes, 0, 0);
                onSlotClick(d);
              }}
            >
              {/* Hour lines */}
              {Array.from({ length: 24 }, (_, h) => (
                <div
                  key={h}
                  className="absolute w-full border-t border-gray-100"
                  style={{ top: h * HOUR_HEIGHT }}
                />
              ))}

              {/* Reminders */}
              {dayReminders.map((reminder) => {
                const scheduled = new Date(reminder.scheduledAt);
                const top = (scheduled.getHours() + scheduled.getMinutes() / 60) * HOUR_HEIGHT;
                return (
                  <div
                    key={reminder.id}
                    className="absolute rounded px-1.5 py-0.5 bg-violet-500 text-white text-xs overflow-hidden pointer-events-none"
                    style={{ top, height: 22, left: 0, right: 0 }}
                  >
                    <p className="font-medium truncate leading-tight">{reminder.title}</p>
                  </div>
                );
              })}

              {/* Events */}
              {dayEvents.map((event) => {
                const start = new Date(event.startAt);
                const end = new Date(event.endAt);
                const top = (start.getHours() + start.getMinutes() / 60) * HOUR_HEIGHT;
                const height = Math.max(
                  20,
                  ((end.getTime() - start.getTime()) / 3600000) * HOUR_HEIGHT
                );
                const pos = layout.get(event.id) ?? { col: 0, cols: 1 };
                const width = 100 / pos.cols;
                const left = pos.col * width;

                return (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className="absolute rounded px-1.5 py-0.5 bg-slate-600 text-white text-xs overflow-hidden cursor-pointer hover:bg-slate-500 transition-colors duration-150"
                    style={{ top, height, left: `${left}%`, width: `${width}%` }}
                  >
                    <p className="font-medium truncate leading-tight">{event.title}</p>
                    <p className="text-slate-300 truncate leading-tight">
                      {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
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
  cursor,
  today,
  events,
  tasks,
  reminders,
  onDayClick,
  onEventClick,
}: {
  cursor: Date;
  today: Date;
  events: Event[];
  tasks: Task[];
  reminders: Reminder[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
}) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = new Date(firstDay);
  startDay.setDate(startDay.getDate() - startDay.getDay());

  const cells: Date[] = [];
  const d = new Date(startDay);
  while (cells.length < 42) {
    cells.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  return (
    <div className="flex-1">
      <div className="grid grid-cols-7 border-l border-t border-gray-200">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="border-r border-b border-gray-200 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50"
          >
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
            ...dayEvents.map((e) => ({ type: "event" as const, id: e.id, title: e.title, event: e })),
            ...dayTasks.map((t) => ({ type: "task" as const, id: t.id, title: t.title })),
            ...dayReminders.map((r) => ({ type: "reminder" as const, id: r.id, title: r.title })),
          ];

          return (
            <div
              key={i}
              onClick={() => onDayClick(cell)}
              className={`border-r border-b border-gray-200 min-h-22.5 p-2 cursor-pointer hover:bg-slate-50 transition-colors duration-150 ${
                isCurrentMonth ? "bg-white" : "bg-gray-50"
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                  isToday
                    ? "bg-slate-700 text-white"
                    : isCurrentMonth
                    ? "text-gray-800"
                    : "text-gray-300"
                }`}
              >
                {cell.getDate()}
              </span>
              <div className="mt-1 flex flex-col gap-0.5">
                {allItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      if (item.type === "event") {
                        e.stopPropagation();
                        onEventClick(item.event);
                      }
                    }}
                    className={`text-xs text-white rounded px-1.5 py-0.5 truncate transition-colors duration-150 ${
                      item.type === "event"
                        ? "bg-slate-600 cursor-pointer hover:bg-slate-500"
                        : item.type === "task"
                        ? "bg-amber-500"
                        : "bg-violet-500"
                    }`}
                  >
                    {item.title}
                  </div>
                ))}
                {allItems.length > 3 && (
                  <p className="text-xs text-gray-400">+{allItems.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(new Date(today));
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [modal, setModal] = useState<{
    mode: "create" | "edit";
    event?: Event;
    defaultStart?: Date;
  } | null>(null);

  async function fetchEvents() {
    const res = await apiFetch("/api/v1/events");
    if (!res.ok) return;
    const data = (await res.json()) as { data: Event[] };
    setEvents(data.data);
  }

  useEffect(() => {
    async function load() {
      const [eventsRes, tasksRes, remindersRes] = await Promise.all([
        apiFetch("/api/v1/events"),
        apiFetch("/api/v1/tasks"),
        apiFetch("/api/v1/reminders"),
      ]);
      if (eventsRes.ok) {
        const data = (await eventsRes.json()) as { data: Event[] };
        setEvents(data.data);
      }
      if (tasksRes.ok) {
        const data = (await tasksRes.json()) as { data: Task[] };
        setTasks(data.data);
      }
      if (remindersRes.ok) {
        const data = (await remindersRes.json()) as { data: Reminder[] };
        setReminders(data.data);
      }
    }
    void load();
  }, []);

  async function handleSave(data: {
    title: string;
    description?: string;
    startAt: string;
    endAt: string;
  }) {
    if (modal?.mode === "create") {
      const res = await apiFetch("/api/v1/events", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setModal(null);
        await fetchEvents();
      }
    } else if (modal?.mode === "edit" && modal.event) {
      const res = await apiFetch(`/api/v1/events/${modal.event.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setModal(null);
        await fetchEvents();
      }
    }
  }

  async function handleDelete() {
    if (!modal?.event) return;
    const res = await apiFetch(`/api/v1/events/${modal.event.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setModal(null);
      await fetchEvents();
    }
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
    if (view === "month") {
      return `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`;
    }
    if (view === "week") {
      const week = startOfWeek(cursor);
      const end = new Date(week);
      end.setDate(end.getDate() + 6);
      return week.getMonth() === end.getMonth()
        ? `${MONTH_NAMES[week.getMonth()]} ${week.getDate()} – ${end.getDate()}, ${end.getFullYear()}`
        : `${MONTH_NAMES[week.getMonth()]} ${week.getDate()} – ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getDate()}, ${cursor.getFullYear()}`;
  }

  function getWeekDays() {
    const week = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(week);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  function openCreate(date: Date) {
    const start = new Date(date);
    if (view === "month") start.setHours(12, 0, 0, 0);
    setModal({ mode: "create", defaultStart: start });
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <div className="flex border border-gray-300 rounded overflow-hidden text-sm">
          {(["month", "week", "day"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 capitalize font-medium transition-colors duration-150 ${
                view === v
                  ? "bg-slate-700 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setCursor(new Date(today))}
          className="text-sm font-medium text-gray-600 border border-gray-300 bg-white px-3 py-1.5 rounded hover:bg-gray-100 transition-colors duration-150"
        >
          Today
        </button>
        <div className="flex gap-1">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors duration-150 text-gray-600"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors duration-150 text-gray-600"
            aria-label="Next"
          >
            ›
          </button>
        </div>
        <span className="text-base font-semibold text-gray-800">{headerLabel()}</span>
      </div>

      {view === "month" && (
        <MonthView
          cursor={cursor}
          today={today}
          events={events}
          tasks={tasks}
          reminders={reminders}
          onDayClick={openCreate}
          onEventClick={(event) => setModal({ mode: "edit", event })}
        />
      )}
      {view === "week" && (
        <TimeGrid
          days={getWeekDays()}
          events={events}
          tasks={tasks}
          reminders={reminders}
          onSlotClick={openCreate}
          onEventClick={(event) => setModal({ mode: "edit", event })}
        />
      )}
      {view === "day" && (
        <TimeGrid
          days={[cursor]}
          events={events}
          tasks={tasks}
          reminders={reminders}
          onSlotClick={openCreate}
          onEventClick={(event) => setModal({ mode: "edit", event })}
        />
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
    </Layout>
  );
}
