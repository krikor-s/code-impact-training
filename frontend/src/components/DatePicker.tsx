import { useState, useRef, useEffect } from "react";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DatePicker({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const parsed = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, "0");
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: firstDay }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function select(day: number) {
    onChange(`${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`);
    setOpen(false);
  }

  function prev() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }

  function next() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  const display = value
    ? `${MONTH_NAMES[parsed.getMonth()]} ${parsed.getDate()}, ${parsed.getFullYear()}`
    : "Select date";

  const selectedStr = value;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
      >
        {display}
      </button>
      {open && (
        <div className="absolute z-30 mt-1 bg-[#0a1e38]/95 border border-white/20 rounded-xl shadow-xl p-3 w-64">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prev} className="text-white/50 hover:text-white px-1">‹</button>
            <span className="text-xs font-medium text-white">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" onClick={next} className="text-white/50 hover:text-white px-1">›</button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {DAY_NAMES.map((d) => (
              <span key={d} className="text-[10px] text-white/30 py-0.5">{d}</span>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <span key={`e-${i}`} />;
              const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
              const isSelected = dateStr === selectedStr;
              const isToday = dateStr === `${new Date().getFullYear()}-${pad(new Date().getMonth() + 1)}-${pad(new Date().getDate())}`;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => select(day)}
                  className={`text-xs py-1 rounded transition-colors duration-100 ${
                    isSelected
                      ? "bg-white/25 text-white font-medium"
                      : isToday
                      ? "text-emerald-400 hover:bg-white/10"
                      : "text-white/70 hover:bg-white/10"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
