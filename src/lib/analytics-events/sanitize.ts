const MAX_SEARCH_TERM_LENGTH = 60;

/** Same rules as the backend (BB-2). Returns the cleaned term, or null when it must not leave the browser. */
export function sanitizeSearchTerm(raw: string): string | null {
  const term = raw.trim().toLowerCase().replace(/\s+/g, " ").slice(0, MAX_SEARCH_TERM_LENGTH);
  if (term.includes("@")) return null;
  if (/\d{6}/.test(term.replace(/[\s-]/g, ""))) return null;
  if (term.length < 2) return null;
  return term;
}
