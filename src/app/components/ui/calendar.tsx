"use client";

import * as React from "react";

type CalendarProps = {
  mode?: "single" | "range";
  selected?: Date | undefined;
  onSelect?: (date?: Date) => void;
  initialFocus?: boolean;
  className?: string;
};

// Lightweight inline calendar grid (no external deps)
export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const today = React.useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = React.useState<number>(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState<number>(selected?.getMonth() ?? today.getMonth()); // 0-11

  const goMonth = (delta: number) => {
    setViewMonth((m) => {
      let nm = m + delta;
      let y = viewYear;
      while (nm < 0) { nm += 12; y -= 1; }
      while (nm > 11) { nm -= 12; y += 1; }
      if (y !== viewYear) setViewYear(y);
      return nm;
    });
  };

  const startOfMonth = new Date(viewYear, viewMonth, 1);
  const endOfMonth = new Date(viewYear, viewMonth + 1, 0);
  const startWeekday = startOfMonth.getDay(); // 0=Sun
  const daysInMonth = endOfMonth.getDate();

  const days: Array<Date | null> = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(viewYear, viewMonth, d));

  const fmt = (d: Date) => d.toLocaleString(undefined, { month: "long", year: "numeric" });
  const isSameDay = (a?: Date, b?: Date) => !!a && !!b && a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();

  return (
    <div className={("w-[280px] select-none text-sm " + (className || "")).trim()}>
      <div className="flex items-center justify-between px-2 py-2">
        <button
          type="button"
          className="rounded-md px-2 py-1 hover:bg-neutral-100"
          onClick={() => goMonth(-1)}
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className="font-medium">{fmt(new Date(viewYear, viewMonth, 1))}</div>
        <button
          type="button"
          className="rounded-md px-2 py-1 hover:bg-neutral-100"
          onClick={() => goMonth(1)}
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 px-2 pb-2 text-center text-neutral-600">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
          <div key={d} className="p-1 text-xs">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 px-2 pb-2">
        {days.map((d, i) => {
          if (!d) return <div key={i} className="h-9"/>;
          const selectedCls = isSameDay(d, selected) ? "bg-neutral-900 text-white" : "hover:bg-neutral-100";
          const todayCls = isSameDay(d, today) && !isSameDay(d, selected) ? "ring-1 ring-neutral-400" : "";
          return (
            <button
              key={d.toISOString()}
              type="button"
              className={("h-9 rounded-md text-center " + selectedCls + " " + todayCls).trim()}
              onClick={() => onSelect?.(d)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
