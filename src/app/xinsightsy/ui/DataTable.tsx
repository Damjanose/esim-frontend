"use client";

import { useState } from "react";

export type Column<Row> = {
  key: string;
  label: string;
  value: (row: Row) => string | number | null;
  /** Raw number used for sorting when `value` is formatted text (e.g. "12.5%"). */
  sortValue?: (row: Row) => number | null;
  numeric?: boolean;
};

/** Sortable table with a sticky header. It scrolls sideways on a phone instead of squeezing. */
export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  caption
}: {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  caption: string;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const sorted = sort
    ? [...rows].sort((a, b) => {
        const column = columns.find((item) => item.key === sort.key);
        if (!column) return 0;
        const read = column.sortValue ?? column.value;
        const x = read(a);
        const y = read(b);
        if (x === y) return 0;
        if (x === null) return 1;
        if (y === null) return -1;
        return (x < y ? -1 : 1) * sort.dir;
      })
    : rows;

  function toggle(key: string) {
    setSort((current) => (current?.key === key ? { key, dir: current.dir === 1 ? -1 : 1 } : { key, dir: -1 }));
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
      <table className="min-w-full text-left text-[13px]">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-cloud">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={`px-3 py-2 font-black text-midnight ${column.numeric ? "text-right" : ""}`}>
                <button type="button" onClick={() => toggle(column.key)} className="font-black">
                  {column.label}
                  {sort?.key === column.key ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={rowKey(row)} className="border-t border-line">
              {columns.map((column) => {
                const value = column.value(row);
                return (
                  <td key={column.key} className={`px-3 py-2 text-midnight ${column.numeric ? "text-right tabular-nums" : ""}`}>
                    {value === null || value === "" ? "—" : String(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
