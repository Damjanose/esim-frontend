// Pure helpers for the Blocks tab (block list summaries, option ids, copy codes,
// image sources, button actions, phase checklist). No React here.

import { PHASES, setTextDefault, textOf, type Block, type BlockType, type Phase } from "../eventModal";

export const GIVEAWAY_BLOCK_TYPES: readonly BlockType[] = ["vote", "results", "winner"];

const ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/;

export function isValidOptionId(id: string): boolean {
  return ID_PATTERN.test(id);
}

export function isValidCopyCode(code: string): boolean {
  return ID_PATTERN.test(code);
}

export function filterCopyCode(input: string): string {
  return input.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
}

type OptionLike = { id: string };

export function optionIdProblems(options: OptionLike[]): string[] {
  const problems: string[] = [];
  if (options.length < 2) problems.push("A choice vote needs at least 2 options.");
  if (options.length > 10) problems.push("A choice vote can have at most 10 options.");
  if (options.some((option) => !isValidOptionId(option.id))) {
    problems.push("Option ids use letters, digits, - and _ only (up to 40 characters).");
  }
  const ids = options.map((option) => option.id);
  if (new Set(ids).size !== ids.length) problems.push("Option ids must be unique.");
  return problems;
}

export function nextOptionId(options: OptionLike[]): string {
  const taken = new Set(options.map((option) => option.id));
  let index = 1;
  while (taken.has(`option-${index}`)) index += 1;
  return `option-${index}`;
}

export function numberOrUndefined(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function imageWithId(props: Record<string, unknown>, imageId: string): Record<string, unknown> {
  const { url: _url, ...rest } = props;
  return { ...rest, imageId };
}

export function imageWithUrl(props: Record<string, unknown>, url: string): Record<string, unknown> {
  const { imageId: _imageId, ...rest } = props;
  return { ...rest, url };
}

export function withTextProp(
  props: Record<string, unknown>,
  key: string,
  text: string,
  options: { optional?: boolean } = {}
): Record<string, unknown> {
  if (options.optional && text.trim() === "") {
    const { [key]: _removed, ...rest } = props;
    return rest;
  }
  return { ...props, [key]: setTextDefault(props[key], text) };
}

export type ButtonActionKind = "dismiss" | "url" | "route";

export function buttonActionKind(action: unknown): ButtonActionKind {
  const type = (action as { type?: unknown } | undefined)?.type;
  return type === "url" || type === "route" ? type : "dismiss";
}

export function buttonActionFor(
  kind: ButtonActionKind,
  input: { url?: string; route?: string; slug?: string }
): Record<string, unknown> {
  if (kind === "url") return { type: "url", url: input.url ?? "" };
  if (kind === "route") {
    const action: Record<string, unknown> = { type: "route", route: input.route ?? "" };
    if (input.route === "/country/[slug]") action.slug = input.slug ?? "";
    return action;
  }
  return { type: "dismiss" };
}

export function togglePhase(visibleIn: Phase[], phase: Phase): Phase[] {
  const next = visibleIn.includes(phase)
    ? visibleIn.filter((item) => item !== phase)
    : [...visibleIn, phase];
  return PHASES.filter((item) => next.includes(item));
}

function firstText(value: unknown, fallback: string): string {
  const text = textOf(value).trim();
  return text === "" ? fallback : text;
}

export function summarizeBlock(block: Block): string {
  const props = block.props;
  switch (block.type) {
    case "heading":
    case "text":
      return firstText(props.text, "No text yet");
    case "image":
      if (typeof props.imageId === "string" && props.imageId !== "") return "Uploaded image";
      if (typeof props.url === "string" && props.url !== "") return "Image from URL";
      return "No image yet";
    case "countdown":
      return props.target === "votingClosesAt" ? "Ends when voting closes" : "Ends with the display window";
    case "button":
      return firstText(props.label, "No label yet");
    case "copy_code":
      return typeof props.code === "string" && props.code !== "" ? props.code : "No code yet";
    case "divider":
      return "Divider";
    case "vote":
      return firstText(props.question, "No question yet");
    case "results":
      return typeof props.voteBlockId === "string" && props.voteBlockId !== ""
        ? `Results of ${props.voteBlockId}`
        : "No vote selected";
    case "winner":
      return firstText(props.title, "Winner");
    case "rules_link":
      return "Rules link";
    default:
      return block.type;
  }
}
