// Domain library for the /xeventsy admin editor. Mirrors the event modal API
// contract in the backend docs (docs/api/event-modals.md). The backend stays
// the authority; validateDraft only catches obvious mistakes before a save.

export const PHASES = [
  "live",
  "live_unvoted",
  "live_voted",
  "closed_pending",
  "resolved_won",
  "resolved_lost"
] as const;
export type Phase = (typeof PHASES)[number];

export const PHASE_LABELS: Record<Phase, string> = {
  live: "Promo (live)",
  live_unvoted: "Live, not voted",
  live_voted: "Live, voted",
  closed_pending: "Closed, awaiting result",
  resolved_won: "Resolved, you won",
  resolved_lost: "Resolved, you lost"
};

export const BLOCK_TYPES = [
  "image",
  "heading",
  "text",
  "countdown",
  "button",
  "copy_code",
  "divider",
  "vote",
  "results",
  "winner",
  "rules_link"
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export type TextValue = { default: string; translations?: Record<string, string> };

export type Block = {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
  visibleIn: Phase[];
};

export type Frequency = {
  mode: "once" | "daily" | "every_n_opens" | "every_n_hours" | "until_dismissed" | "until_voted";
  n?: number;
  maxImpressions?: number;
};

export type EventModalRecord = {
  id: string;
  title: string;
  status: "draft" | "published" | "resolved" | "archived";
  timeState: string;
  stats: { shown: number; dismissed: number; cta_clicked: number };
  startsAt: string | null;
  votingClosesAt: string | null;
  displayUntil: string | null;
  resultsAt: string | null;
  priority: number;
  presentation: "sheet" | "modal";
  audience: { platforms?: string[]; locales?: string[] };
  frequency: Frequency;
  requiredSchemaVersion: number;
  blocks: Block[];
  rulesText: string | null;
  winnerVisibility: "public" | "winner_only";
  resolution: unknown;
  createdAt: string;
  updatedAt: string;
};

export type EditorDraft = {
  title: string;
  priority: number;
  presentation: "sheet" | "modal";
  startsAt: string;
  votingClosesAt: string;
  displayUntil: string;
  audience: { platforms: Array<"ios" | "android">; locales: string };
  frequency: { mode: Frequency["mode"]; n: string; maxImpressions: string };
  rulesText: string;
  winnerVisibility: "public" | "winner_only";
  blocks: Block[];
};

type BlockDef = {
  label: string;
  description: string;
  icon: string;
  defaultVisibleIn: Phase[];
  createProps: () => Record<string, unknown>;
  isVoteType?: boolean;
};

export const BLOCK_DEFS: Record<BlockType, BlockDef> = {
  image: {
    label: "Image",
    description: "An uploaded image or an https image URL.",
    icon: "Image",
    defaultVisibleIn: ["live"],
    createProps: () => ({ alt: { default: "" } })
  },
  heading: {
    label: "Heading",
    description: "A large title line.",
    icon: "Heading",
    defaultVisibleIn: ["live"],
    createProps: () => ({ text: { default: "" } })
  },
  text: {
    label: "Text",
    description: "A paragraph of body text.",
    icon: "AlignLeft",
    defaultVisibleIn: ["live"],
    createProps: () => ({ text: { default: "" } })
  },
  countdown: {
    label: "Countdown",
    description: "Time left until voting closes or the modal ends.",
    icon: "Timer",
    defaultVisibleIn: ["live"],
    createProps: () => ({ target: "displayUntil", size: "small" })
  },
  button: {
    label: "Button",
    description: "A call to action that dismisses, opens a link or goes to a screen.",
    icon: "MousePointerClick",
    defaultVisibleIn: ["live"],
    createProps: () => ({
      label: { default: "Open" },
      action: { type: "dismiss" },
      style: "primary"
    })
  },
  copy_code: {
    label: "Copy code",
    description: "A promo code the user can copy.",
    icon: "Copy",
    defaultVisibleIn: ["live"],
    createProps: () => ({ code: "" })
  },
  divider: {
    label: "Divider",
    description: "A thin separator line.",
    icon: "Minus",
    defaultVisibleIn: ["live"],
    createProps: () => ({})
  },
  vote: {
    label: "Vote",
    description: "A question users answer. Entries and scoring use it.",
    icon: "ListChecks",
    defaultVisibleIn: ["live_unvoted"],
    createProps: () => ({
      question: { default: "" },
      questionType: "choice",
      options: [
        { id: "home", label: { default: "Home" } },
        { id: "away", label: { default: "Away" } }
      ],
      points: 1
    }),
    isVoteType: true
  },
  results: {
    label: "Results",
    description: "Aggregates of a vote block.",
    icon: "BarChart3",
    defaultVisibleIn: ["live_voted", "closed_pending", "resolved_won", "resolved_lost"],
    createProps: () => ({ voteBlockId: "" })
  },
  winner: {
    label: "Winner",
    description: "The winner list and the viewer's own win.",
    icon: "Trophy",
    defaultVisibleIn: ["resolved_won"],
    createProps: () => ({ title: { default: "You won!" } })
  },
  rules_link: {
    label: "Rules link",
    description: "Opens the modal's rules text.",
    icon: "ScrollText",
    defaultVisibleIn: ["live_unvoted", "live_voted"],
    createProps: () => ({})
  }
};

export const ROUTE_OPTIONS: Array<{ value: string; label: string; needsSlug?: boolean }> = [
  { value: "/(tabs)/marketplace", label: "Marketplace" },
  { value: "/(tabs)/esims", label: "My eSIMs" },
  { value: "/(tabs)/profile", label: "Profile" },
  { value: "/country/[slug]", label: "Country page", needsSlug: true },
  { value: "/games", label: "Games" },
  { value: "/trip-plan", label: "Trip plan" },
  { value: "/flight-search", label: "Flight search" },
  { value: "/support", label: "Support" },
  { value: "/become-a-partner", label: "Become a partner" },
  { value: "/activity", label: "Activity" },
  { value: "/currency", label: "Currency" },
  { value: "/redeem-gift", label: "Redeem gift" }
];

export const LOCALES: Array<{ code: string; label: string }> = [
  { code: "en", label: "English" },
  { code: "ar", label: "Arabic" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
  { code: "tr", label: "Turkish" },
  { code: "sq", label: "Albanian" },
  { code: "it", label: "Italian" },
  { code: "el", label: "Greek" }
];

export function emptyDraft(): EditorDraft {
  return {
    title: "",
    priority: 0,
    presentation: "modal",
    startsAt: "",
    votingClosesAt: "",
    displayUntil: "",
    audience: { platforms: [], locales: "" },
    frequency: { mode: "once", n: "", maxImpressions: "" },
    rulesText: "",
    winnerVisibility: "public",
    blocks: []
  };
}

export function draftFromRecord(record: EventModalRecord): EditorDraft {
  return {
    title: record.title,
    priority: record.priority,
    presentation: record.presentation,
    startsAt: toLocalInput(record.startsAt),
    votingClosesAt: toLocalInput(record.votingClosesAt),
    displayUntil: toLocalInput(record.displayUntil),
    audience: {
      platforms: (record.audience.platforms ?? []) as Array<"ios" | "android">,
      locales: (record.audience.locales ?? []).join(", ")
    },
    frequency: {
      mode: record.frequency.mode,
      n: record.frequency.n === undefined ? "" : String(record.frequency.n),
      maxImpressions:
        record.frequency.maxImpressions === undefined ? "" : String(record.frequency.maxImpressions)
    },
    rulesText: record.rulesText ?? "",
    winnerVisibility: record.winnerVisibility,
    blocks: record.blocks
  };
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * `original` is the saved record when updating: a date whose input is unchanged is left out,
 * so a stored value with seconds is not re-sent truncated to the minute (the backend locks
 * the voting dates once a resolution exists).
 */
export function draftToRequestBody(draft: EditorDraft, original?: EventModalRecord): Record<string, unknown> {
  const locales = draft.audience.locales
    .split(",")
    .map((locale) => locale.trim().toLowerCase())
    .filter((locale) => locale.length > 0);

  const audience: Record<string, unknown> = {};
  if (draft.audience.platforms.length > 0) audience.platforms = [...draft.audience.platforms];
  if (locales.length > 0) audience.locales = locales;

  const frequency: Record<string, unknown> = { mode: draft.frequency.mode };
  if (draft.frequency.mode === "every_n_hours" || draft.frequency.mode === "every_n_opens") {
    const n = parseOptionalNumber(draft.frequency.n);
    if (n !== undefined) frequency.n = n;
  }
  const maxImpressions = parseOptionalNumber(draft.frequency.maxImpressions);
  if (maxImpressions !== undefined) frequency.maxImpressions = maxImpressions;

  const rulesText = draft.rulesText.trim();

  const body: Record<string, unknown> = {
    title: draft.title.trim(),
    priority: draft.priority,
    // The app always shows event modals centered, so the sheet option is gone.
    presentation: "modal",
    startsAt: fromLocalInput(draft.startsAt),
    votingClosesAt: fromLocalInput(draft.votingClosesAt),
    displayUntil: fromLocalInput(draft.displayUntil),
    audience,
    frequency,
    rulesText: rulesText === "" ? null : rulesText,
    winnerVisibility: draft.winnerVisibility,
    blocks: draft.blocks
  };
  if (original) {
    for (const key of ["startsAt", "votingClosesAt", "displayUntil"] as const) {
      if (draft[key] === toLocalInput(original[key])) delete body[key];
    }
  }
  return body;
}

export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function newBlock(type: BlockType, existingIds: string[]): Block {
  let index = 1;
  while (existingIds.includes(`${type}-${index}`)) index += 1;
  const def = BLOCK_DEFS[type];
  return {
    id: `${type}-${index}`,
    type,
    props: def.createProps(),
    visibleIn: [...def.defaultVisibleIn]
  };
}

export function moveBlock(blocks: Block[], index: number, delta: -1 | 1): Block[] {
  const target = index + delta;
  const next = [...blocks];
  if (index < 0 || index >= blocks.length || target < 0 || target >= blocks.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function removeBlock(blocks: Block[], id: string): Block[] {
  return blocks.filter((block) => block.id !== id);
}

export function updateBlock(
  blocks: Block[],
  id: string,
  patch: Partial<Pick<Block, "props" | "visibleIn">>
): Block[] {
  return blocks.map((block) => (block.id === id ? { ...block, ...patch } : block));
}

export function hasVoteBlock(blocks: Block[]): boolean {
  return blocks.some((block) => block.type === "vote");
}

export function voteBlocksOf(blocks: Block[]): Block[] {
  return blocks.filter((block) => block.type === "vote");
}

export function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof (value as TextValue).default === "string") {
    return (value as TextValue).default;
  }
  return "";
}

function translationsOf(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const translations = (value as TextValue).translations;
  if (!translations || typeof translations !== "object") return undefined;
  return Object.keys(translations).length > 0 ? { ...translations } : undefined;
}

export function setTextDefault(value: unknown, text: string): TextValue {
  const translations = translationsOf(value);
  return translations ? { default: text, translations } : { default: text };
}

export function setTranslation(value: unknown, locale: string, text: string): TextValue {
  const translations = { ...(translationsOf(value) ?? {}) };
  if (text.trim() === "") {
    delete translations[locale];
  } else {
    translations[locale] = text;
  }
  const base = { default: textOf(value) };
  return Object.keys(translations).length > 0 ? { ...base, translations } : base;
}

// Prop keys the API treats as text (plain string or TextValue).
const TEXT_PROP_KEYS = [
  "text",
  "label",
  "alt",
  "title",
  "message",
  "question",
  "unit",
  "homeLabel",
  "awayLabel"
] as const;

const TEXT_PROP_LABELS: Record<string, string> = {
  text: "Text",
  label: "Label",
  alt: "Alt text",
  title: "Title",
  message: "Message",
  question: "Question",
  unit: "Unit",
  homeLabel: "Home label",
  awayLabel: "Away label"
};

function asTextValue(value: unknown): TextValue {
  return typeof value === "string" ? { default: value } : { ...(value as TextValue), default: textOf(value) };
}

export function collectTextFields(
  blocks: Block[]
): Array<{ blockId: string; blockType: BlockType; path: string; label: string; value: TextValue }> {
  const fields: Array<{
    blockId: string;
    blockType: BlockType;
    path: string;
    label: string;
    value: TextValue;
  }> = [];

  for (const block of blocks) {
    for (const key of TEXT_PROP_KEYS) {
      const value = block.props[key];
      if (typeof value === "string" || (value && typeof value === "object")) {
        fields.push({
          blockId: block.id,
          blockType: block.type,
          path: key,
          label: TEXT_PROP_LABELS[key],
          value: asTextValue(value)
        });
      }
    }

    const options = block.props.options;
    if (Array.isArray(options)) {
      options.forEach((option, index) => {
        const label = (option as { label?: unknown } | null)?.label;
        if (typeof label === "string" || (label && typeof label === "object")) {
          fields.push({
            blockId: block.id,
            blockType: block.type,
            path: `options.${index}.label`,
            label: `Option ${index + 1} label`,
            value: asTextValue(label)
          });
        }
      });
    }
  }

  return fields;
}

export function applyTextField(
  blocks: Block[],
  blockId: string,
  path: string,
  value: TextValue
): Block[] {
  return blocks.map((block) => {
    if (block.id !== blockId) return block;

    const optionMatch = /^options\.(\d+)\.label$/.exec(path);
    if (optionMatch) {
      const index = Number(optionMatch[1]);
      const options = Array.isArray(block.props.options) ? [...block.props.options] : [];
      const current = (options[index] ?? {}) as Record<string, unknown>;
      options[index] = { ...current, label: value };
      return { ...block, props: { ...block.props, options } };
    }

    return { ...block, props: { ...block.props, [path]: value } };
  });
}

function isHttps(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function validateDraft(draft: EditorDraft): string[] {
  const messages: string[] = [];
  const title = draft.title.trim();
  const startsAt = fromLocalInput(draft.startsAt);
  const displayUntil = fromLocalInput(draft.displayUntil);
  const votingClosesAt = fromLocalInput(draft.votingClosesAt);

  if (title === "") messages.push("Title is required.");
  if (title.length > 120) messages.push("Title must be 120 characters or fewer.");

  if (!startsAt) messages.push("Start date is required.");

  if (startsAt && displayUntil && Date.parse(displayUntil) <= Date.parse(startsAt)) {
    messages.push("Display end must be after the start date.");
  }

  if (votingClosesAt) {
    const afterStart = !startsAt || Date.parse(votingClosesAt) >= Date.parse(startsAt);
    const beforeEnd = !displayUntil || Date.parse(votingClosesAt) <= Date.parse(displayUntil);
    if (!afterStart || !beforeEnd) {
      messages.push("Voting must close between the start date and the display end.");
    }
  }

  if (hasVoteBlock(draft.blocks)) {
    if (!votingClosesAt) messages.push("Vote modals need a voting close date.");
    if (draft.rulesText.trim() === "") messages.push("Vote modals need rules text.");
  }

  for (const block of voteBlocksOf(draft.blocks)) {
    if (block.props.questionType !== "choice") continue;
    const options = Array.isArray(block.props.options) ? block.props.options : [];
    const labelled = options.every((option) => textOf((option as { label?: unknown }).label).trim() !== "");
    if (options.length < 2 || options.length > 10 || !labelled) {
      messages.push("Choice votes need 2 to 10 options, each with a label.");
    }
  }

  const frequency = draft.frequency;
  if (frequency.mode === "every_n_hours" || frequency.mode === "every_n_opens") {
    const n = Number(frequency.n);
    if (frequency.n.trim() === "" || !Number.isInteger(n) || n < 1 || n > 10000) {
      messages.push("Frequency n must be a whole number from 1 to 10000.");
    }
  }

  for (const block of draft.blocks) {
    if (
      block.type === "copy_code" &&
      (typeof block.props.code !== "string" || block.props.code.trim() === "")
    ) {
      messages.push("Copy code cannot be empty.");
    }
    if (block.type === "button") {
      const action = block.props.action as { type?: unknown; url?: unknown } | undefined;
      if (action?.type === "url" && !isHttps(action.url)) {
        messages.push("Button URLs must use https.");
      }
    }
    if (block.type === "image" && block.props.url !== undefined && block.props.url !== "" && !isHttps(block.props.url)) {
      messages.push("Image URLs must use https.");
    }
  }

  return messages;
}
