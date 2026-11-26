export type CsvCell = string | number | null;

const FORMULA_START = /^[=+\-@\t\r]/;

function escapeCell(value: CsvCell): string {
  if (value === null) return "";
  let text = String(value);
  // A spreadsheet runs a cell that starts with these as a formula. Prefix it with a quote.
  if (FORMULA_START.test(text)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

/** RFC 4180-style CSV with a header row. */
export function toCsv(header: string[], rows: CsvCell[][]): string {
  const lines = [header.map((cell) => escapeCell(cell)), ...rows.map((row) => row.map((cell) => escapeCell(cell)))];
  return lines.map((line) => line.join(",")).join("\n");
}
