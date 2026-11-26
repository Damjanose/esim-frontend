const NOTES: Record<string, string> = {
  network_location: "Network location (may differ while roaming)",
  billing_address_latest: "Billing address from the latest order",
  deleted_accounts_excluded: "Sales of deleted accounts are not counted",
  consented_web_only: "Website figures include only visitors who accepted analytics",
  trip_plans_unavailable: "Trip plan counts are not available yet"
};

export function noteText(code: string): string | null {
  return NOTES[code] ?? null;
}

/** A plain-text note for a code from the report's `notes` list. Unknown codes show nothing. */
export function NoteBadge({ code }: { code: string }) {
  const text = noteText(code);
  if (!text) return null;
  return <span className="inline-block rounded-full border border-line bg-cloud px-2.5 py-1 text-[11.5px] font-bold text-midnight/80">{text}</span>;
}
