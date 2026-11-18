// Pure helpers for the event modal editor shell (`[id]/page.tsx` and EditorShell).

import type { EditorDraft } from "../eventModal";

export const BLOCKS_V2_TYPES = ["vote", "results", "winner", "rules_link"] as const;

export const BLOCKS_V2_NOTE =
  "Needs app version supporting blocks v2: older apps will not show this modal.";

export type EditorTab = "content" | "schedule" | "audience" | "rules" | "results";

export const EDITOR_TABS: Array<{ id: EditorTab; label: string }> = [
  { id: "content", label: "Content" },
  { id: "schedule", label: "Schedule" },
  { id: "audience", label: "Audience & frequency" },
  { id: "rules", label: "Giveaway rules" },
  { id: "results", label: "Results" }
];

/** The route segment used to create a new modal. */
export function isNewModalId(id: string): boolean {
  return id === "new";
}

/** True when the draft uses a block type that older app versions cannot render. */
export function needsBlocksV2(blocks: EditorDraft["blocks"]): boolean {
  return blocks.some((block) => (BLOCKS_V2_TYPES as readonly string[]).includes(block.type));
}

/** Results only exist for a saved modal with a vote block. */
export function visibleTabs({ saved, hasVote }: { saved: boolean; hasVote: boolean }): EditorTab[] {
  return EDITOR_TABS.map((tab) => tab.id).filter((id) => id !== "results" || (saved && hasVote));
}

/** The standalone results page for a saved modal. */
export function resultsHref(id: string): string {
  return `/xeventsy/${encodeURIComponent(id)}/results`;
}

/** The backend joins several validation errors with "; ". */
export function splitBackendMessage(message: string): string[] {
  return message
    .split("; ")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}
