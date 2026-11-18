// Pure helpers for the Results tab (giveaway): answer labels, the resolution
// request body built from the admin's inputs, and the winner email list parser.

import { textOf, type Block } from "../eventModal";

// Raw strings from the Results tab inputs, one set per vote block.
export type ResolutionInput = {
  optionId: string;
  home: string;
  away: string;
  value: string;
};

export function emptyResolutionInput(): ResolutionInput {
  return { optionId: "", home: "", away: "", value: "" };
}

type VoteProps = {
  questionType?: unknown;
  options?: unknown;
  unit?: unknown;
};

function propsOf(block: Block): VoteProps {
  return (block.props ?? {}) as VoteProps;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionLabel(block: Block, optionId: string): string {
  const options = propsOf(block).options;
  if (Array.isArray(options)) {
    for (const option of options) {
      if (isRecord(option) && option.id === optionId) {
        return textOf(option.label) || optionId;
      }
    }
  }
  return optionId;
}

// Human label for one answer, used in the entries table and the scoreboard.
export function answerLabel(block: Block, answer: unknown): string {
  if (!isRecord(answer)) return "—";
  const questionType = propsOf(block).questionType;

  if (questionType === "choice") {
    return typeof answer.optionId === "string" ? optionLabel(block, answer.optionId) : "—";
  }
  if (questionType === "exact_score") {
    if (typeof answer.home !== "number" || typeof answer.away !== "number") return "—";
    return `${answer.home} - ${answer.away}`;
  }
  if (questionType === "number") {
    if (typeof answer.value !== "number") return "—";
    const unit = textOf(propsOf(block).unit);
    return unit ? `${answer.value} ${unit}` : String(answer.value);
  }
  return "—";
}

type ResolutionResult =
  | { ok: true; body: { resolution: Record<string, unknown> } }
  | { ok: false; message: string };

const WHOLE_SCORE = /^\d+$/;

// Turns the admin's raw inputs into the PUT /resolution body. Checks only the
// shape (the backend stays the authority on the rules).
export function buildResolutionBody(
  voteBlocks: Block[],
  inputs: Record<string, ResolutionInput>
): ResolutionResult {
  if (voteBlocks.length === 0) {
    return { ok: false, message: "Add a vote block before setting a result." };
  }

  const resolution: Record<string, unknown> = {};
  for (const block of voteBlocks) {
    const input = inputs[block.id] ?? emptyResolutionInput();
    const questionType = propsOf(block).questionType;
    const question = textOf(block.props?.question) || block.id;

    if (questionType === "choice") {
      if (!input.optionId) return { ok: false, message: `${question}: pick the correct answer.` };
      resolution[block.id] = { optionId: input.optionId };
    } else if (questionType === "exact_score") {
      const home = input.home.trim();
      const away = input.away.trim();
      const valid = (value: string) => WHOLE_SCORE.test(value) && Number(value) <= 99;
      if (!valid(home) || !valid(away)) {
        return { ok: false, message: `${question}: enter both scores as whole numbers from 0 to 99.` };
      }
      resolution[block.id] = { home: Number(home), away: Number(away) };
    } else if (questionType === "number") {
      const raw = input.value.trim();
      const value = raw === "" ? Number.NaN : Number(raw);
      if (!Number.isFinite(value)) {
        return { ok: false, message: `${question}: enter a number.` };
      }
      resolution[block.id] = { value };
    } else {
      return { ok: false, message: `${question}: unsupported question type.` };
    }
  }

  return { ok: true, body: { resolution } };
}

// One email per line (commas, semicolons and spaces also work). Trimmed,
// lowercased and deduped, in the order first seen.
export function parseEmails(text: string): string[] {
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const raw of text.split(/[\s,;]+/)) {
    const email = raw.trim().toLowerCase();
    if (email === "" || seen.has(email)) continue;
    seen.add(email);
    emails.push(email);
  }
  return emails;
}

// Prefills the Results tab inputs from a saved resolution (admin reads only).
export function inputsFromResolution(
  voteBlocks: Block[],
  resolution: unknown
): Record<string, ResolutionInput> {
  const saved = isRecord(resolution) ? resolution : {};
  const inputs: Record<string, ResolutionInput> = {};
  for (const block of voteBlocks) {
    const answer = saved[block.id];
    const input = emptyResolutionInput();
    if (isRecord(answer)) {
      if (typeof answer.optionId === "string") input.optionId = answer.optionId;
      if (typeof answer.home === "number") input.home = String(answer.home);
      if (typeof answer.away === "number") input.away = String(answer.away);
      if (typeof answer.value === "number") input.value = String(answer.value);
    }
    inputs[block.id] = input;
  }
  return inputs;
}
