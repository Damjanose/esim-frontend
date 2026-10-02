import type {
  AssistantAction,
  AssistantClarify,
  AssistantContext,
  AssistantDestination,
  AssistantFilterPayload,
  AssistantOrderSummary
} from "./types";

/**
 * Canned answers for everything a filter or a single navigation can handle, so
 * the real AI (`POST /assistant/chat`) is only called for open-ended questions
 * like "where should I go after Japan?". Ported from the app's
 * assistantLocalReplies.ts; keep the two in step. The chat still shows its
 * thinking loader for LOCAL_REPLY_DELAY_MS so a local answer feels like an AI one.
 */
export const LOCAL_REPLY_DELAY_MS = 300;

/** A piece of the "filters applied" summary: a copy key, or a literal like a country name. */
export type LocalSummaryPart = { key: string; params?: Record<string, string> } | { text: string };

export type LocalReply = {
  replyKey: string;
  replyParams?: Record<string, string>;
  /** Joined with " · " and passed to `replyKey` as `{{summary}}`. */
  summary?: LocalSummaryPart[];
  /** The action's `label` is ignored; the chat renders `actionLabelKey` instead. */
  action?: AssistantAction;
  actionLabelKey?: string;
  clarify?: AssistantClarify;
};

// ---------------------------------------------------------------------------
// Text helpers (the app's marketplace/catalog.ts and utils/fuzzyMatch.ts)

export function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function slugifyDestination(value: string): string {
  return normalizeText(value)
    .replace(/[’']/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function levenshtein(a: string, b: string): number {
  let previous = Array.from({ length: a.length + 1 }, (_, index) => index);
  for (let i = 1; i <= b.length; i++) {
    const current = [i];
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[a.length];
}

/** 0..1, where 1 is an exact (case-insensitive) match. */
export function fuzzyMatch(input: string, target: string): number {
  const a = input.toLowerCase();
  const b = target.toLowerCase();
  if (!a || !b) return a === b ? 1 : 0;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

export function findBestMatch(input: string, options: readonly string[], threshold = 0.75): string | null {
  let best: string | null = null;
  let bestScore = threshold;
  for (const option of options) {
    const score = fuzzyMatch(input, option);
    if (score > bestScore) {
      bestScore = score;
      best = option;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------

export function latestOrders(orders: readonly AssistantOrderSummary[]): AssistantOrderSummary[] {
  return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Newest order that is still usable (active or ready to install). */
export function latestLiveOrder(orders: readonly AssistantOrderSummary[]): AssistantOrderSummary | null {
  return latestOrders(orders).find((order) => order.status !== "expired") ?? null;
}

function filterReply(payload: AssistantFilterPayload, replyKey: string, extra?: Partial<LocalReply>): LocalReply {
  return {
    replyKey,
    action: { type: "apply_filters", label: "", payload },
    actionLabelKey: "assistant.local.showPlans",
    ...extra
  };
}

/** Replies for the marketplace suggestion chips and presets. */
export const marketplaceSuggestionReplies = {
  week: filterReply({ durationFrom: 7, durationTo: 10, sort: "price_asc" }, "assistant.local.week"),
  unlimited: filterReply({ dataFrom: 999, includeUnlimited: true }, "assistant.local.unlimited"),
  cheapest: (destination: string) =>
    filterReply({ destination: slugifyDestination(destination), sort: "price_asc" }, "assistant.local.cheapest", {
      replyParams: { destination }
    }),
  europe: filterReply({ destination: "europe", sort: "price_asc" }, "assistant.local.europe"),
  howItWorks: { replyKey: "assistant.local.howItWorks" } satisfies LocalReply
};

// ---------------------------------------------------------------------------
// Free-text parsing. English keywords only; anything else falls through to the AI.

/** Longer or open-ended messages always go to the AI. */
const MAX_LOCAL_WORDS = 12;

/** Signals that the user wants advice, not a filter. */
const COMPLEX_PATTERN =
  /\b(why|how|when|where|compare|vs|versus|difference|should|recommend|suggest|advice|near|nearby|close to|after|before|explain|work|works|install|refund|visa|weather|things to do|help|or)\b/;

/** Short forms and Albanian/local spellings. A list means "first slug the catalog has". */
const DESTINATION_ALIASES: Record<string, string | string[]> = {
  usa: "united-states",
  america: "united-states",
  amerika: "united-states",
  amerike: "united-states",
  "united states of america": "united-states",
  nyc: "united-states",
  uk: "united-kingdom",
  britain: "united-kingdom",
  "great britain": "united-kingdom",
  england: "united-kingdom",
  angli: "united-kingdom",
  anglia: "united-kingdom",
  holland: "netherlands",
  uae: "united-arab-emirates",
  turqi: ["turkey", "turkiye"],
  turqia: ["turkey", "turkiye"],
  franca: "france",
  itali: "italy",
  italia: "italy",
  spanje: "spain",
  spanja: "spain",
  gjermani: "germany",
  gjermania: "germany",
  greqi: "greece",
  greqia: "greece",
  zvicer: "switzerland",
  zvicra: "switzerland",
  shqiperi: "albania",
  shqiperia: "albania"
};

/** Popular cities, including local names. The reply names the city ("Stamboll is in Turkey"). */
const CITY_ALIASES: Record<string, string | string[]> = {
  "new york": "united-states",
  "los angeles": "united-states",
  miami: "united-states",
  "las vegas": "united-states",
  london: "united-kingdom",
  londer: "united-kingdom",
  londra: "united-kingdom",
  amsterdam: "netherlands",
  dubai: "united-arab-emirates",
  "abu dhabi": "united-arab-emirates",
  istanbul: ["turkey", "turkiye"],
  stamboll: ["turkey", "turkiye"],
  stambolli: ["turkey", "turkiye"],
  stambul: ["turkey", "turkiye"],
  antalya: ["turkey", "turkiye"],
  ankara: ["turkey", "turkiye"],
  paris: "france",
  rome: "italy",
  roma: "italy",
  milan: "italy",
  milano: "italy",
  venice: "italy",
  barcelona: "spain",
  madrid: "spain",
  berlin: "germany",
  munich: "germany",
  athens: "greece",
  athine: "greece",
  vienna: "austria",
  viena: "austria",
  zurich: "switzerland",
  prague: ["czech-republic", "czechia"],
  lisbon: "portugal",
  tirana: "albania",
  tirane: "albania",
  pristina: "kosovo",
  prishtina: "kosovo",
  prishtine: "kosovo",
  skopje: ["north-macedonia", "macedonia"],
  shkup: ["north-macedonia", "macedonia"],
  tokyo: "japan",
  seoul: "south-korea",
  bangkok: "thailand",
  bali: "indonesia",
  cairo: "egypt"
};

/** Clearly asks for plans: "esim/package/data for Istanbul" skips the package-or-trip question. */
const PACKAGE_INTENT =
  /\b(e ?sims?|packages?|paket\w*|bundles?|data|internet|roaming|sim|sims|gb|mb|data plans?|plans for)\b/;

/** Clearly asks for the trip planner. A bare "trip" ("trip to Istanbul") is still unclear. */
const TRIP_INTENT =
  /\b(plan (a |my |the )?trip|trip plan(ner)?|itinerar\w*|udhetim\w*|plan (a |my )?(holiday|vacation|visit))\b/;

/** Answers to "eSIM packages or a trip plan?". Package words are checked first ("data plan"). */
const TRIP_ANSWER = /\b(trip|trips|plan|planner|travel|itinerar\w*|udhetim\w*|holiday|vacation)\b/;

/** Shortest word fuzzy matching tries, so "plan" or "week" never look like a country. */
const MIN_FUZZY_TOKEN_LENGTH = 5;
const FUZZY_THRESHOLD = 0.78;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsPhrase(text: string, phrase: string): boolean {
  return phrase.length > 1 && new RegExp(`(^|[^a-z0-9])${escapeRegExp(phrase)}($|[^a-z0-9])`).test(text);
}

type DestinationMatch = { destination: AssistantDestination; /** The city the user named. */ place?: string };

function titleCase(phrase: string): string {
  return phrase.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Distinct destinations named in the text, longest name first ("south korea" beats "korea"). */
function findDestinations(text: string, destinations: readonly AssistantDestination[]): DestinationMatch[] {
  const bySlug = new Map(destinations.map((destination) => [destination.slug, destination]));
  const candidates: { phrase: string; destination: AssistantDestination; city?: boolean }[] = [];
  for (const destination of destinations) {
    candidates.push({ phrase: normalizeText(destination.label), destination });
    candidates.push({ phrase: destination.slug.replace(/-/g, " "), destination });
  }
  const addAliases = (aliases: Record<string, string | string[]>, city: boolean) => {
    for (const [alias, target] of Object.entries(aliases)) {
      const slug = (Array.isArray(target) ? target : [target]).find((candidate) => bySlug.has(candidate));
      const destination = slug ? bySlug.get(slug) : undefined;
      if (destination) candidates.push({ phrase: alias, destination, city });
    }
  };
  addAliases(DESTINATION_ALIASES, false);
  addAliases(CITY_ALIASES, true);
  candidates.sort((a, b) => b.phrase.length - a.phrase.length);

  const found = new Map<string, DestinationMatch>();
  let remaining = text;
  for (const { phrase, destination, city } of candidates) {
    if (!containsPhrase(remaining, phrase)) continue;
    if (!found.has(destination.slug)) {
      found.set(destination.slug, { destination, place: city ? titleCase(phrase) : undefined });
    }
    // Blank the match so "korea" can't match again inside "south korea".
    remaining = remaining.replace(new RegExp(escapeRegExp(phrase), "g"), " ");
  }

  // Nothing named exactly: try each word for a typo ("turky", "germny").
  // Same first letter keeps "while" from matching "Chile".
  if (found.size === 0) {
    const byPhrase = new Map(candidates.map(({ phrase, destination }) => [phrase, destination]));
    const phrases = [...byPhrase.keys()];
    let best: { destination: AssistantDestination; score: number } | null = null;
    for (const token of text.split(/[^a-z0-9]+/)) {
      if (token.length < MIN_FUZZY_TOKEN_LENGTH) continue;
      const sameInitial = phrases.filter((phrase) => phrase[0] === token[0]);
      const match = findBestMatch(token, sameInitial, FUZZY_THRESHOLD);
      if (!match) continue;
      const score = fuzzyMatch(token, match);
      if (!best || score > best.score) best = { destination: byPhrase.get(match)!, score };
    }
    if (best) found.set(best.destination.slug, { destination: best.destination });
  }

  return [...found.values()];
}

function parseDays(text: string): number | null {
  const count = (pattern: RegExp) => {
    const match = text.match(pattern);
    return match ? Number(match[1]) : null;
  };
  const days = count(/\b(\d{1,3})\s*-?\s*(?:days?|nights?|d)\b/);
  if (days) return days;
  const weeks = count(/\b(\d{1,2})\s*-?\s*weeks?\b/);
  if (weeks) return weeks * 7;
  const months = count(/\b(\d{1,2})\s*-?\s*months?\b/);
  if (months) return months * 30;
  if (/\bweekend\b/.test(text)) return 3;
  if (/\b(week|weekly)\b/.test(text)) return 7;
  if (/\b(fortnight)\b/.test(text)) return 14;
  if (/\b(month|monthly)\b/.test(text)) return 30;
  if (/\b(year|yearly|annual)\b/.test(text)) return 365;
  return null;
}

function parseDataGb(text: string): number | null {
  const gb = text.match(/\b(\d{1,3}(?:[.,]\d{1,2})?)\s*gb\b/);
  if (gb) return Number(gb[1].replace(",", "."));
  const mb = text.match(/\b(\d{3,4})\s*mb\b/);
  if (mb) return Number(mb[1]) / 1000;
  return null;
}

function parseSort(text: string): "price_asc" | "data_desc" | "duration_desc" | null {
  if (/\b(cheap|cheapest|cheaper|budget|affordable|lowest price|low cost)\b/.test(text)) return "price_asc";
  if (/\b(most data|biggest|largest)\b/.test(text)) return "data_desc";
  if (/\b(longest|longer)\b/.test(text)) return "duration_desc";
  return null;
}

const SORT_SUMMARY_KEY = {
  price_asc: "assistant.local.part.cheapest",
  price_desc: "assistant.local.part.priciest",
  data_desc: "assistant.local.part.mostData",
  duration_desc: "assistant.local.part.longest"
} as const;

export function destinationLabel(slug: string, destinations: readonly AssistantDestination[]): string {
  const known = destinations.find((destination) => destination.slug === slugifyDestination(slug));
  if (known) return known.label;
  return slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Describes exactly what a filter payload does, so the reply text matches what "Show plans" applies. */
export function summarizeFilters(
  payload: AssistantFilterPayload,
  destinations: readonly AssistantDestination[]
): LocalSummaryPart[] {
  const summary: LocalSummaryPart[] = [];
  const destination = payload.destination?.trim();
  if (destination) summary.push({ text: destinationLabel(destination, destinations) });
  else if (payload.search?.trim()) summary.push({ text: payload.search.trim() });

  const { durationFrom, durationTo, dataFrom, dataTo } = payload;
  if (durationFrom != null && durationTo != null) {
    summary.push({
      key: "assistant.local.part.daysRange",
      params: { from: String(durationFrom), to: String(durationTo) }
    });
  } else if (durationFrom != null) {
    summary.push({ key: "assistant.local.part.days", params: { count: String(durationFrom) } });
  } else if (durationTo != null) {
    summary.push({ key: "assistant.local.part.daysMax", params: { count: String(durationTo) } });
  }

  if (dataFrom != null && dataFrom >= 999) {
    summary.push({ key: "assistant.local.part.unlimited" });
  } else if (dataFrom != null) {
    summary.push({ key: "assistant.local.part.data", params: { count: String(dataFrom) } });
  } else if (dataTo != null) {
    summary.push({ key: "assistant.local.part.dataMax", params: { count: String(dataTo) } });
  }

  if (payload.sort && payload.sort !== "recommended") summary.push({ key: SORT_SUMMARY_KEY[payload.sort] });
  return summary;
}

/** Days, data and sort the message mentions, or null when it names none. */
function parseFacets(text: string): AssistantFilterPayload | null {
  const days = parseDays(text);
  const dataGb = parseDataGb(text);
  const unlimited = /\b(unlimited|no limit|endless)\b/.test(text);
  const sort = parseSort(text);
  if (days == null && dataGb == null && !unlimited && !sort) return null;

  const payload: AssistantFilterPayload = {};
  if (days != null) {
    payload.durationFrom = days;
    payload.durationTo = undefined;
  }
  if (unlimited) {
    payload.dataFrom = 999;
    payload.dataTo = undefined;
    payload.includeUnlimited = true;
  } else if (dataGb != null) {
    payload.dataFrom = dataGb;
    payload.dataTo = undefined;
    payload.includeUnlimited = undefined;
  }
  if (sort) payload.sort = sort;
  return payload;
}

function isGuestContext(context: AssistantContext): boolean {
  return context.screen === "marketplace" && context.isGuest;
}

function clarifyReply({ destination, place }: DestinationMatch): LocalReply {
  return {
    replyKey: place ? "assistant.local.clarifyPlace" : "assistant.local.clarify",
    replyParams: { destination: destination.label, ...(place ? { place } : {}) },
    clarify: { destination: destination.slug, ...(place ? { place } : {}) }
  };
}

function signInReply(): LocalReply {
  return {
    replyKey: "assistant.local.signIn",
    action: { type: "sign_in", label: "" },
    actionLabelKey: "assistant.local.signInAction"
  };
}

function planTripReply(label: string | undefined, context: AssistantContext): LocalReply {
  // The trip planner needs an account.
  if (isGuestContext(context)) return signInReply();
  return {
    replyKey: label ? "assistant.local.planTripTo" : "assistant.local.planTrip",
    replyParams: label ? { destination: label } : undefined,
    action: { type: "plan_trip", label: "", payload: label ? { destination: label } : undefined },
    actionLabelKey: "assistant.local.planTripAction"
  };
}

/**
 * Only the facets the message itself mentions; `refineLocalReply` merges them
 * with earlier ones. A place with nothing else ("Stamboll") could mean plans or
 * a trip plan, so it asks instead of guessing.
 */
function parseFilters(text: string, destinations: readonly AssistantDestination[]): LocalReply | null {
  const named = findDestinations(text, destinations);
  // Two places ("Italy and France") are a coverage question for the AI.
  if (named.length > 1) return null;
  const match = named[0] ?? null;
  const facets = parseFacets(text);
  if (!match && !facets) return null;
  if (match && !facets && !PACKAGE_INTENT.test(text)) return clarifyReply(match);

  const payload: AssistantFilterPayload = { ...facets };
  if (match) payload.destination = match.destination.slug;
  if (match?.place) {
    return filterReply(payload, "assistant.local.filteredPlace", {
      replyParams: { place: match.place, destination: match.destination.label }
    });
  }
  return filterReply(payload, "assistant.local.filtered");
}

/** The user's answer to a "packages or trip plan?" question, or null when it's about something else. */
export function resolveClarifyFollowUp(
  rawText: string,
  clarify: AssistantClarify,
  context: AssistantContext,
  destinations: readonly AssistantDestination[]
): LocalReply | null {
  const text = normalizeText(rawText).replace(/\s+/g, " ");
  if (!text || text.split(" ").length > MAX_LOCAL_WORDS) return null;
  if (findDestinations(text, destinations).some((match) => match.destination.slug !== clarify.destination)) {
    return null;
  }

  const facets = parseFacets(text);
  if (facets || PACKAGE_INTENT.test(text)) {
    return filterReply({ ...facets, destination: clarify.destination }, "assistant.local.filtered");
  }
  if (TRIP_ANSWER.test(text)) return planTripReply(destinationLabel(clarify.destination, destinations), context);
  return null;
}

/** The two buttons under a "packages or trip plan?" question. Guests sign in to use the trip planner. */
export function clarifyChoices(
  clarify: AssistantClarify,
  context: AssistantContext,
  destinations: readonly AssistantDestination[]
): { action: AssistantAction; labelKey: string }[] {
  const label = destinationLabel(clarify.destination, destinations);
  return [
    {
      action: { type: "apply_filters", label: "", payload: { destination: clarify.destination } },
      labelKey: "assistant.local.clarifyPackages"
    },
    isGuestContext(context)
      ? { action: { type: "sign_in", label: "" }, labelKey: "assistant.local.clarifyTripGuest" }
      : {
          action: { type: "plan_trip", label: "", payload: { destination: label } },
          labelKey: "assistant.local.clarifyTrip"
        }
  ];
}

/**
 * Follow-ups refine the filters the chat just applied: "Germany" then
 * "Unlimited only" means unlimited plans in Germany. A different destination
 * starts fresh. The reply text is rebuilt from the merged payload.
 */
export function refineLocalReply(
  reply: LocalReply,
  previous: AssistantFilterPayload | null,
  destinations: readonly AssistantDestination[]
): LocalReply {
  if (reply.action?.type !== "apply_filters") return reply;
  const own = reply.action.payload;
  if (own.destination && previous?.destination && own.destination !== previous.destination) previous = null;
  const merged: AssistantFilterPayload = { ...(previous ?? {}), ...own };
  // A new destination replaces any free-text search the AI set earlier.
  if (own.destination) delete merged.search;
  for (const key of Object.keys(merged) as (keyof AssistantFilterPayload)[]) {
    if (merged[key] === undefined) delete merged[key];
  }
  // A minimum length or data amount lists every bigger plan too; cheapest-first puts the closest fit on top.
  if (!merged.sort && (merged.durationFrom != null || (merged.dataFrom != null && merged.dataFrom < 999))) {
    merged.sort = "price_asc";
  }

  const refined = previous != null;
  return {
    ...reply,
    // Chip replies keep their own wording unless earlier filters were carried over.
    replyKey: refined || reply.replyKey === "assistant.local.filtered" ? "assistant.local.filtered" : reply.replyKey,
    replyParams: refined ? undefined : reply.replyParams,
    summary: summarizeFilters(merged, destinations),
    action: { ...reply.action, payload: merged }
  };
}

/** Navigation intents. The app also handles gift codes, currency and reviews; the website has no such pages. */
function navigationReply(
  text: string,
  context: AssistantContext,
  destinations: readonly AssistantDestination[]
): LocalReply | null {
  const isGuest = isGuestContext(context);

  if (isGuest && /\b(sign ?up|sign ?in|log ?in|register|create (an |a )?account)\b/.test(text)) {
    return signInReply();
  }
  if (TRIP_INTENT.test(text)) {
    const [match] = findDestinations(text, destinations);
    return planTripReply(match?.destination.label, context);
  }
  if (isGuest) return null;

  const live = latestLiveOrder(context.screen === "marketplace" ? [] : context.orders);
  if (live && /\b(top ?-?up|recharge|refill|more data|add data)\b/.test(text)) {
    return {
      replyKey: "assistant.local.topUp",
      replyParams: { destination: live.destination ?? "" },
      action: { type: "top_up", label: "", payload: { orderId: live.id } },
      actionLabelKey: "assistant.local.topUpAction"
    };
  }
  if (/\b(billing|invoice address|billing address)\b/.test(text)) {
    return {
      replyKey: "assistant.local.billing",
      action: { type: "open_billing", label: "" },
      actionLabelKey: "assistant.local.billingAction"
    };
  }
  return null;
}

/**
 * A looser guess for when the AI timed out: no word limit or advice check, just
 * "the message names exactly one place" → show its plans (plus any days/data/sort).
 */
export function timeoutFallbackReply(rawText: string, destinations: readonly AssistantDestination[]): LocalReply | null {
  const text = normalizeText(rawText).replace(/\s+/g, " ");
  const named = findDestinations(text, destinations);
  if (named.length !== 1) return null;
  return filterReply({ ...parseFacets(text), destination: named[0].destination.slug }, "assistant.local.filtered");
}

/** The canned reply for a typed message, or null when it needs the real AI. Navigation wins over filters. */
export function localReplyFor(
  rawText: string,
  context: AssistantContext,
  destinations: readonly AssistantDestination[]
): LocalReply | null {
  const text = normalizeText(rawText).replace(/\s+/g, " ");
  if (!text || text.split(" ").length > MAX_LOCAL_WORDS) return null;

  const navigation = navigationReply(text, context, destinations);
  if (navigation) return navigation;
  if (COMPLEX_PATTERN.test(text)) return null;
  return parseFilters(text, destinations);
}

// ---------------------------------------------------------------------------
// FAQ (the app's assistantFAQ.ts)

/**
 * Full phrases only. Single words like "travel", "price" or "delete" also appear
 * in plan requests ("I want to travel to Japan"), so they must never match here;
 * the chat runs the destination/filter parser before this list anyway.
 */
const FAQ_ENTRIES: { keywords: string[]; replyKey: string }[] = [
  {
    keywords: ["what is esim", "what is an esim", "whats an esim", "whats esim", "define esim", "esim meaning"],
    replyKey: "assistant.faq.whatIsEsim"
  },
  {
    keywords: ["how does it work", "how do esims work", "how does esim work", "how does an esim work", "how to use esim", "how to use an esim"],
    replyKey: "assistant.faq.howItWorks"
  },
  {
    keywords: ["activation time", "how long to activate", "how long does activation take", "when can i use it"],
    replyKey: "assistant.faq.activationTime"
  },
  {
    keywords: ["multiple devices", "share esim", "share my esim", "two phones", "more than one phone"],
    replyKey: "assistant.faq.multipleDevices"
  },
  {
    keywords: ["why esim", "why use esim", "why use an esim", "esim benefits", "benefits of esim", "advantages of esim"],
    replyKey: "assistant.faq.benefits"
  },
  { keywords: ["supported countries", "which countries do you", "what countries do you"], replyKey: "assistant.faq.supportedCountries" },
  {
    keywords: ["how much does an esim cost", "how much do esims cost", "are esims expensive", "esim price", "esim cost"],
    replyKey: "assistant.faq.pricing"
  },
  // No "refund": refund requests go to the AI, which hands them to human support.
  {
    keywords: ["remove esim", "remove my esim", "delete esim", "delete my esim", "uninstall esim", "cancel my plan"],
    replyKey: "assistant.faq.removeEsim"
  },
  { keywords: ["roaming", "esim vs roaming", "instead of roaming"], replyKey: "assistant.faq.roaming" },
  { keywords: ["physical sim", "sim card", "need a physical"], replyKey: "assistant.faq.physicalSim" }
];

export function matchFAQ(userMessage: string): LocalReply | null {
  const normalized = userMessage.toLowerCase().replace(/[\u2019']/g, "").trim();
  if (normalized.length > 100) return null;
  for (const entry of FAQ_ENTRIES) {
    for (const keyword of entry.keywords) {
      const pattern = new RegExp(`\\b${keyword.replace(/\s+/g, "\\s+")}\\b`, "i");
      if (pattern.test(normalized)) return { replyKey: entry.replyKey };
    }
  }
  return null;
}
