const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type HeatCell = { weekday: number; hour: number; value: number | null };

/** 7 rows (Monday first) by 24 hours. Darker means more. Each cell has a hover title. */
export function Heatmap({ cells, label }: { cells: HeatCell[]; label: string }) {
  const max = Math.max(0, ...cells.map((cell) => cell.value ?? 0));
  const byKey = new Map(cells.map((cell) => [`${cell.weekday}-${cell.hour}`, cell.value]));
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: "auto repeat(24, minmax(16px, 1fr))" }}>
        <span />
        {Array.from({ length: 24 }, (_, hour) => (
          <span key={`h${hour}`} className="text-center text-[10px] text-midnight/60">
            {hour % 3 === 0 ? hour : ""}
          </span>
        ))}
        {WEEKDAYS.map((day, weekday) => (
          <div key={day} className="contents">
            <span className="pr-2 text-[11px] font-bold text-midnight/70">{day}</span>
            {Array.from({ length: 24 }, (_, hour) => {
              const value = byKey.get(`${weekday}-${hour}`) ?? null;
              const alpha = value !== null && max > 0 ? 0.08 + (value / max) * 0.92 : 0.04;
              return (
                <span
                  key={`${weekday}-${hour}`}
                  data-cell={`${weekday}-${hour}`}
                  title={`${day} ${hour}:00 · ${value === null ? "—" : value} ${label}`}
                  className="h-4 rounded-[3px] bg-brandBlue"
                  style={{ opacity: alpha }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
