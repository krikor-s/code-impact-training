import { useState } from "react";
import Layout from "../components/Layout";

type View = "month" | "week" | "day";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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

function MonthView({ cursor, today }: { cursor: Date; today: Date }) {
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
          return (
            <div
              key={i}
              className={`border-r border-b border-gray-200 min-h-[90px] p-2 ${
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ cursor, today }: { cursor: Date; today: Date }) {
  const week = startOfWeek(cursor);
  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(week);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="flex-1">
      <div className="grid grid-cols-7 border-l border-t border-gray-200">
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div key={i} className="border-r border-b border-gray-200 bg-gray-50 py-2 text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {DAY_NAMES[day.getDay()]}
              </p>
              <span
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium mt-1 ${
                  isToday ? "bg-slate-700 text-white" : "text-gray-800"
                }`}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={`body-${i}`}
              className={`border-r border-b border-gray-200 min-h-[400px] p-2 ${
                isToday ? "bg-slate-50" : "bg-white"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayView({ cursor, today }: { cursor: Date; today: Date }) {
  const isToday = isSameDay(cursor, today);
  return (
    <div className="flex-1">
      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
        <div className={`px-6 py-4 border-b border-gray-200 ${isToday ? "bg-slate-50" : "bg-gray-50"}`}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {DAY_NAMES[cursor.getDay()]}
          </p>
          <p className={`text-3xl font-bold mt-0.5 ${isToday ? "text-slate-700" : "text-gray-800"}`}>
            {cursor.getDate()}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
          </p>
          {isToday && (
            <span className="inline-block mt-2 text-xs font-medium bg-slate-700 text-white rounded-full px-2 py-0.5">
              Today
            </span>
          )}
        </div>
        <div className="min-h-[400px] p-4" />
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => {
    const d = new Date(today);
    return d;
  });

  function navigate(dir: -1 | 1) {
    setCursor((prev) => {
      const d = new Date(prev);
      if (view === "month") {
        d.setMonth(d.getMonth() + dir);
      } else if (view === "week") {
        d.setDate(d.getDate() + dir * 7);
      } else {
        d.setDate(d.getDate() + dir);
      }
      return d;
    });
  }

  function goToday() {
    setCursor(new Date(today));
  }

  function headerLabel() {
    if (view === "month") {
      return `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`;
    }
    if (view === "week") {
      const week = startOfWeek(cursor);
      const end = new Date(week);
      end.setDate(end.getDate() + 6);
      const sameMonth = week.getMonth() === end.getMonth();
      return sameMonth
        ? `${MONTH_NAMES[week.getMonth()]} ${week.getDate()} – ${end.getDate()}, ${end.getFullYear()}`
        : `${MONTH_NAMES[week.getMonth()]} ${week.getDate()} – ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getDate()}, ${cursor.getFullYear()}`;
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <div className="flex items-center gap-2">
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
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={goToday}
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

      {view === "month" && <MonthView cursor={cursor} today={today} />}
      {view === "week" && <WeekView cursor={cursor} today={today} />}
      {view === "day" && <DayView cursor={cursor} today={today} />}
    </Layout>
  );
}
