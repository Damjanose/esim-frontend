/** Friendly text for the codes the backend and the BFF send back. */
const MESSAGES: Record<string, string> = {
  invalid_source: "Enter a source, such as google.",
  invalid_medium: "Use letters, numbers, dashes or underscores for the medium, or leave it empty.",
  invalid_campaign: "Enter a campaign name.",
  invalid_from: "Pick a start date.",
  invalid_to: "Pick an end date, on or after the start date, at most 366 days later.",
  invalid_amountCents: "Enter an amount above 0.",
  invalid_currency: "Use a 3-letter currency code, such as usd.",
  invalid_note: "Keep the note under 200 characters.",
  invalid_date: "Pick a real date.",
  invalid_kind: "Pick a kind.",
  invalid_title: "Enter a title of 1 to 80 characters.",
  not_found: "That item no longer exists. Refresh and try again.",
  unauthorized: "Session expired. Sign in again.",
  network: "Could not reach the server. Try again."
};

export function friendlyError(code: string | undefined): string {
  return (code && MESSAGES[code]) || "Could not save. Try again.";
}
