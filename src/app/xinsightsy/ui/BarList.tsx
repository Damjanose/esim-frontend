type Row = { label: string; value: number | null; display?: string };

/** Horizontal bars for a ranked list. Bars are CSS widths relative to the largest value. */
export function BarList({ rows, emptyText = "No data for this range" }: { rows: Row[]; emptyText?: string }) {
  if (rows.length === 0) return <p className="text-sm text-midnight/60">{emptyText}</p>;
  const max = Math.max(0, ...rows.map((row) => row.value ?? 0));
  return (
    <ul className="space-y-2">
      {rows.map((row) => {
        const width = row.value !== null && max > 0 ? Math.max(2, (row.value / max) * 100) : 0;
        return (
          <li key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-midnight">{row.label}</p>
              <div className="mt-1 h-2 rounded-full bg-cloud">
                <div className="h-2 rounded-full bg-brandBlue" style={{ width: `${width}%` }} />
              </div>
            </div>
            <span className="text-[13px] font-bold tabular-nums text-midnight">{row.display ?? (row.value === null ? "—" : row.value.toLocaleString("en-GB"))}</span>
          </li>
        );
      })}
    </ul>
  );
}
