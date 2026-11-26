/** Ad spend form checks. They mirror the backend rules (plan §1.2), with friendly messages. */
import { sanitizeUtmValue } from "./linkBuilder";

export type AdSpendFormInput = {
  source: string;
  medium: string;
  campaign: string;
  from: string;
  to: string;
  /** A money string such as "12.50". */
  amount: string;
  currency: string;
  note: string;
};

export type AdSpendFormValue = {
  source: string;
  medium: string | null;
  campaign: string;
  from: string;
  to: string;
  amountCents: number;
  currency: string;
  note: string | null;
};

export type AdSpendFormField = "source" | "medium" | "campaign" | "from" | "to" | "amount" | "currency" | "note";

export type AdSpendFormResult = { ok: true; value: AdSpendFormValue } | { ok: false; errors: Partial<Record<AdSpendFormField, string>> };

const MAX_CENTS = 100_000_000;
const MAX_RANGE_DAYS = 366;
const SLUG = /^[a-z0-9_-]{1,60}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** "12.50" → 1250. Returns null for anything that is not a plain, non-negative amount with at most 2 decimals. */
export function parseMoneyToCents(input: string): number | null {
  const text = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  return Number(whole) * 100 + Number((fraction + "00").slice(0, 2));
}

function isRealDate(text: string): boolean {
  if (!DATE.test(text)) return false;
  const time = Date.parse(`${text}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === text;
}

export function validateAdSpendForm(input: AdSpendFormInput): AdSpendFormResult {
  const errors: Partial<Record<AdSpendFormField, string>> = {};

  const source = sanitizeUtmValue(input.source);
  if (!SLUG.test(source)) errors.source = "Enter a source, such as google.";

  const medium = sanitizeUtmValue(input.medium);
  if (medium && !SLUG.test(medium)) errors.medium = "Use letters, numbers, dashes or underscores.";

  const campaign = sanitizeUtmValue(input.campaign);
  if (!SLUG.test(campaign)) errors.campaign = "Enter a campaign name.";

  if (!isRealDate(input.from)) errors.from = "Pick a start date.";
  if (!isRealDate(input.to)) errors.to = "Pick an end date.";
  if (!errors.from && !errors.to) {
    const days = (Date.parse(`${input.to}T00:00:00Z`) - Date.parse(`${input.from}T00:00:00Z`)) / 86_400_000;
    if (days < 0) errors.to = "The end date must be on or after the start date.";
    else if (days > MAX_RANGE_DAYS) errors.to = "The range can be at most 366 days.";
  }

  const amountCents = parseMoneyToCents(input.amount);
  if (amountCents === null || amountCents < 1) errors.amount = "Enter an amount above 0.";
  else if (amountCents > MAX_CENTS) errors.amount = "The amount is too large.";

  const currency = input.currency.trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(currency)) errors.currency = "Use a 3-letter currency code, such as usd.";

  const note = input.note.trim();
  if (note.length > 200) errors.note = "Keep the note under 200 characters.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      source,
      medium: medium || null,
      campaign,
      from: input.from,
      to: input.to,
      amountCents: amountCents as number,
      currency,
      note: note || null
    }
  };
}
