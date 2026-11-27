type Props = { label: string; value: string | number | null; change?: string | null; hint?: string };

/** One headline number, with the change from the previous period when compare is on. */
export function StatTile({ label, value, change, hint }: Props) {
  const shown = value === null || value === "" ? "—" : String(value);
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <p className="text-[11px] font-black uppercase tracking-[0.08em] text-midnight/60">{label}</p>
      <p className="mt-1 font-display text-[24px] font-black tracking-tight text-midnight">{shown}</p>
      {change ? <p className="mt-1 text-[12.5px] font-bold text-midnight/70">{change}</p> : null}
      {hint ? <p className="mt-1 text-[12px] text-midnight/60">{hint}</p> : null}
    </div>
  );
}
