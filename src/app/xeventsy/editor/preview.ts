// Pure helpers and payload types for the editor's preview panel. The backend
// builds the payload (single source of truth for phases and sample data); these
// helpers only shape it for display.

import type { EditorDraft, Phase } from "../eventModal";
import { draftToRequestBody } from "../eventModal";

export type PreviewBlock = {
  id: string;
  type: string;
  props: Record<string, unknown>;
};

export type PreviewPayload = {
  id?: string;
  presentation?: "sheet" | "modal";
  phase: string;
  votingClosesAt: string | null;
  displayUntil: string | null;
  rulesText: string | null;
  signedIn?: boolean;
  votingClosed?: boolean;
  blocks: PreviewBlock[];
};

export type PreviewAction =
  | { type: "dismiss" }
  | { type: "url"; url: string }
  | { type: "route"; route: string; slug?: string };

export function formatRemaining(targetIso: string, nowMs: number): string {
  const targetMs = Date.parse(targetIso);
  if (Number.isNaN(targetMs)) return "";

  const totalMinutes = Math.max(0, Math.floor((targetMs - nowMs) / 60_000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  return `${days}d ${hours}h ${minutes}m`;
}

export function percentWidth(percent: number): string {
  if (!Number.isFinite(percent)) return "0%";
  const clamped = Math.min(100, Math.max(0, percent));
  return `${clamped}%`;
}

export function describeAction(action: unknown): string {
  if (!action || typeof action !== "object") return "";
  const typed = action as Partial<PreviewAction> & { type?: unknown };

  if (typed.type === "dismiss") return "Closes the modal";
  if (typed.type === "url" && typeof (typed as { url?: unknown }).url === "string") {
    return (typed as { url: string }).url;
  }
  if (typed.type === "route" && typeof (typed as { route?: unknown }).route === "string") {
    const route = (typed as { route: string }).route;
    const slug = (typed as { slug?: unknown }).slug;
    return route.includes("[slug]") && typeof slug === "string" ? route.replace("[slug]", slug) : route;
  }
  return "";
}

/**
 * Request body for the live draft preview: the draft as the editor would save it, minus the fields the preview does
 * not need (title, schedule start). Text is English only; the server translates it for the chosen language.
 */
export function buildDraftPreviewBody(draft: EditorDraft, phase: Phase, locale: string): Record<string, unknown> {
  const body = draftToRequestBody(draft);
  delete body.title;
  delete body.startsAt;
  delete body.audience;
  return { draft: body, phase, locale };
}
