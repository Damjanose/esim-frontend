// One-click starting points for the /xeventsy editor. Pure: no fetch, no React.
import { emptyDraft, newBlock, type Block, type BlockType, type EditorDraft, type Phase } from "./eventModal";

export const EVENT_TEMPLATES = ["promo", "match"] as const;
export type EventTemplate = (typeof EVENT_TEMPLATES)[number];

export function parseTemplate(value: string | string[] | undefined): EventTemplate | null {
  const first = Array.isArray(value) ? value[0] : value;
  return (EVENT_TEMPLATES as readonly string[]).includes(first ?? "") ? (first as EventTemplate) : null;
}

const VOTE_FLOW_PHASES: Phase[] = [
  "live_unvoted",
  "live_voted",
  "closed_pending",
  "resolved_won",
  "resolved_lost"
];

function add(blocks: Block[], type: BlockType, patch: Partial<Block> = {}): Block {
  const block = { ...newBlock(type, blocks.map((b) => b.id)), ...patch };
  blocks.push(block);
  return block;
}

function matchGiveaway(): EditorDraft {
  const blocks: Block[] = [];
  add(blocks, "image", { visibleIn: [...VOTE_FLOW_PHASES] });
  const heading = add(blocks, "heading", { visibleIn: [...VOTE_FLOW_PHASES] });
  heading.props = { text: { default: "Guess the result" } };
  const countdown = add(blocks, "countdown", { visibleIn: ["live_unvoted", "live_voted"] });
  countdown.props = { target: "votingClosesAt" };
  const vote = add(blocks, "vote");
  vote.props = {
    question: { default: "Who wins?" },
    questionType: "choice",
    options: [
      { id: "home", label: { default: "Home win" } },
      { id: "draw", label: { default: "Draw" } },
      { id: "away", label: { default: "Away win" } }
    ],
    points: 1
  };
  const results = add(blocks, "results");
  results.props = { voteBlockId: vote.id };
  add(blocks, "winner");
  add(blocks, "rules_link");
  return { ...emptyDraft(), frequency: { mode: "until_voted", n: "", maxImpressions: "" }, blocks };
}

function promo(): EditorDraft {
  const blocks: Block[] = [];
  add(blocks, "image");
  return { ...emptyDraft(), blocks };
}

export function draftForTemplate(template: EventTemplate | null): EditorDraft {
  if (template === "promo") return promo();
  if (template === "match") return matchGiveaway();
  return emptyDraft();
}
