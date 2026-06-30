import { useState, useRef, useEffect } from "react";
import DatePicker from "./DatePicker";

function pad(n: number) { return n.toString().padStart(2, "0"); }

function parseDateTime(val: string): { date: string; hour: number; minute: number } {
  if (!val) {
    const now = new Date();
    return {
      date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      hour: now.getHours(),
      minute: 0,
    };
  }
  const [datePart, timePart] = val.split("T");
  const [h, m] = (timePart ?? "12:00").split(":").map(Number);
  return { date: datePart, hour: h, minute: m };
}

function formatHour(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function TimeSelect({
  value,
  options,
  format,
  onChange,
}: {
  value: number;
  options: number[];
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && listRef.current) {
      const idx = options.indexOf(value);
      if (idx > 0) listRef.current.scrollTop = idx * 28 - 56;
    }
  }, [open, options, value]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40 whitespace-nowrap"
      >
        {format(value)}
      </button>
      {open && (
        <div ref={listRef} className="absolute z-30 mt-1 bg-[#0a1e38]/95 border border-white/20 rounded-xl shadow-xl py-1 w-20 max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`block w-full text-left text-xs px-3 py-1 transition-none ${
                value === opt ? "bg-white/20 text-white font-medium" : "text-white/70 hover:bg-white/10"
              }`}
            >
              {format(opt)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export default function DateTimePicker({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) {
  const parsed = parseDateTime(value);
  const [date, setDate] = useState(parsed.date);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return; }
    onChange(`${date}T${pad(hour)}:${pad(minute)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, hour, minute]);

  return (
    <div className={`flex gap-2 items-start ${className}`}>
      <DatePicker value={date} onChange={setDate} className="flex-1" />
      <TimeSelect value={hour} options={HOURS} format={formatHour} onChange={setHour} />
      <TimeSelect value={minute} options={MINUTES} format={pad} onChange={setMinute} />
    </div>
  );
}
