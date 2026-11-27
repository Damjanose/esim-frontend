const BOT_PATTERN = /bot|crawl|spider|slurp|headless|curl\/|wget|python-requests|facebookexternalhit|lighthouse|preview/i;

/** Crawlers and tools never count as visitors. A missing user agent is treated as a bot. */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  const ua = userAgent?.trim() ?? "";
  if (!ua) return true;
  return BOT_PATTERN.test(ua);
}
