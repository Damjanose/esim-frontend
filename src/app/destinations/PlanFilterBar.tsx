import { ArrowDownUp } from "lucide-react";
import { PLAN_FILTERS, PLAN_SORTS, type PlanFilter, type PlanSort } from "./planList";

type PlanFilterBarProps = {
  filter: PlanFilter;
  sort: PlanSort;
  onFilterChange: (filter: PlanFilter) => void;
  onSortChange: (sort: PlanSort) => void;
};

/** The six filter chips as one sideways-scrolling row, with the sort on the right. */
export function PlanFilterBar({ filter, sort, onFilterChange, onSortChange }: PlanFilterBarProps) {
  return (
    <div className="flex items-center gap-3">
      {/* contain:inline-size stops the unwrapped chip row from widening the page (f209);
          the scroller is positioned (f195). */}
      <div className="min-w-0 flex-1 [contain:inline-size]">
        <div aria-label="Filter plans" className="relative flex gap-2 overflow-x-auto [scrollbar-width:none]" role="group">
          {PLAN_FILTERS.map((item) => {
            const active = filter === item.value;

            return (
              <button
                aria-pressed={active}
                className={`h-[46px] shrink-0 whitespace-nowrap rounded-full border px-4 text-xs font-black transition ${
                  active
                    ? "border-brandBlue bg-brandBlue text-surface"
                    : "border-outline bg-surface text-onSurfaceVariant hover:border-brandBlue/50 hover:text-brandInk"
                }`}
                key={item.value}
                onClick={() => onFilterChange(item.value)}
                type="button"
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Phones: a 46px icon button with the native select stretched invisibly over it.
          sm+: "Sort by" + the visible select. */}
      <label className="relative flex h-[46px] w-[46px] shrink-0 items-center justify-center gap-2 rounded-full border border-outline bg-surface focus-within:ring-2 focus-within:ring-brandBlue sm:w-auto sm:justify-start sm:pl-4 sm:pr-2">
        <ArrowDownUp aria-hidden="true" className="text-brandBlue" size={15} />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap sm:text-[11px] sm:font-bold sm:text-onSurfaceVariant">
          Sort by
        </span>
        <select
          className="absolute inset-0 h-full w-full cursor-pointer bg-surface text-xs font-black text-brandInk opacity-0 outline-none sm:static sm:h-11 sm:w-auto sm:opacity-100"
          onChange={(event) => onSortChange(event.target.value as PlanSort)}
          value={sort}
        >
          {PLAN_SORTS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
