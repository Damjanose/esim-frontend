"use client";

import { useEffect, useState } from "react";
import { describeAction, formatRemaining, percentWidth, type PreviewBlock, type PreviewPayload } from "./preview";

type PhonePreviewProps = { payload: PreviewPayload };

type Option = { id: string; label: string };
type ResultsAggregate = {
  type?: string;
  total?: number;
  options?: Array<{ id: string; count: number; percent: number }>;
  top?: Array<{ home: string; away: string; count: number; percent: number }>;
  average?: number | null;
  min?: number | null;
  max?: number | null;
};
type WinnerEntry = { name: string; prize: string | null };

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function optionsOf(value: unknown): Option[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((option): option is Record<string, unknown> => !!option && typeof option === "object")
    .map((option) => ({ id: str(option.id), label: str(option.label) }));
}

function findVoteBlock(blocks: PreviewBlock[], voteBlockId: unknown): PreviewBlock | undefined {
  return blocks.find((block) => block.type === "vote" && block.id === voteBlockId);
}

function imageSource(props: Record<string, unknown>): string | null {
  if (typeof props.imageId === "string" && props.imageId !== "") {
    return `/bff/admin/event-modals/images/${encodeURIComponent(props.imageId)}`;
  }
  if (typeof props.url === "string" && props.url.startsWith("https://")) return props.url;
  return null;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3 rounded-xl border border-line bg-white p-4">{children}</div>;
}

function Countdown({ props, payload, now }: { props: Record<string, unknown>; payload: PreviewPayload; now: number }) {
  const target = props.target === "displayUntil" ? payload.displayUntil : payload.votingClosesAt;
  const remaining = target ? formatRemaining(target, now) : "";
  return (
    <Shell>
      {str(props.label) ? <p className="text-xs font-bold text-muted">{str(props.label)}</p> : null}
      <p className="text-sm font-black text-midnight">
        {remaining ? `Ends in ${remaining}` : "No end date set"}
      </p>
    </Shell>
  );
}

function VoteBlock({ props }: { props: Record<string, unknown> }) {
  const locked = props.locked === true;
  const myAnswer = props.myAnswer ?? null;
  const questionType = props.questionType;
  const options = optionsOf(props.options);

  return (
    <Shell>
      <p className="text-sm font-black text-midnight">{str(props.question)}</p>
      {questionType === "choice" ? (
        <ul className="space-y-2">
          {options.map((option) => (
            <li
              key={option.id}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                myAnswer === option.id ? "border-cyan bg-cyan/10 text-midnight" : "border-line text-muted"
              }`}
            >
              <span aria-hidden="true" className="h-3 w-3 rounded-full border border-line" />
              {option.label}
            </li>
          ))}
        </ul>
      ) : null}
      {questionType === "exact_score" ? (
        <div className="flex items-center gap-2">
          <input aria-label={str(props.homeLabel) || "Home"} disabled className="h-10 w-full rounded-lg border border-line bg-cloud text-center text-sm" type="number" />
          <span className="font-black text-muted">-</span>
          <input aria-label={str(props.awayLabel) || "Away"} disabled className="h-10 w-full rounded-lg border border-line bg-cloud text-center text-sm" type="number" />
        </div>
      ) : null}
      {questionType === "number" ? (
        <div className="flex items-center gap-2">
          <input aria-label="Your answer" disabled className="h-10 w-full rounded-lg border border-line bg-cloud px-3 text-sm" type="number" />
          {str(props.unit) ? <span className="text-xs font-bold text-muted">{str(props.unit)}</span> : null}
        </div>
      ) : null}
      {locked ? <p className="text-xs font-bold text-muted">Locked</p> : null}
    </Shell>
  );
}

function ResultsBlock({ props, payload }: { props: Record<string, unknown>; payload: PreviewPayload }) {
  const results = (props.results ?? null) as ResultsAggregate | null;
  const title = str(props.title);
  const voteBlock = findVoteBlock(payload.blocks, props.voteBlockId);
  const labels = new Map(optionsOf(voteBlock?.props.options).map((option) => [option.id, option.label]));

  let body: React.ReactNode = <p className="text-xs font-semibold text-muted">Results appear after voting.</p>;
  if (results?.type === "choice" && results.options) {
    body = (
      <ul className="space-y-2">
        {results.options.map((option) => (
          <li key={option.id}>
            <div className="flex justify-between text-xs font-bold text-midnight">
              <span>{labels.get(option.id) ?? option.id}</span>
              <span>{option.percent}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-cloud">
              <div className="h-2 rounded-full bg-cyan" style={{ width: percentWidth(option.percent) }} />
            </div>
          </li>
        ))}
      </ul>
    );
  } else if (results?.type === "exact_score" && results.top) {
    body = (
      <ul className="space-y-2">
        {results.top.map((score) => (
          <li key={`${score.home}-${score.away}`}>
            <div className="flex justify-between text-xs font-bold text-midnight">
              <span>
                {score.home} - {score.away}
              </span>
              <span>{score.percent}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-cloud">
              <div className="h-2 rounded-full bg-cyan" style={{ width: percentWidth(score.percent) }} />
            </div>
          </li>
        ))}
      </ul>
    );
  } else if (results?.type === "number") {
    body = (
      <p className="text-sm font-black text-midnight">
        Average {results.average ?? "-"} {str(voteBlock?.props.unit)}
      </p>
    );
  }

  return (
    <Shell>
      {title ? <p className="text-sm font-black text-midnight">{title}</p> : null}
      {body}
    </Shell>
  );
}

function WinnerBlock({ props }: { props: Record<string, unknown> }) {
  const winners = Array.isArray(props.winners) ? (props.winners as WinnerEntry[]) : [];
  const youWon = props.youWon === true;
  const prize = typeof props.prize === "string" ? props.prize : null;

  return (
    <Shell>
      <p className="text-sm font-black text-midnight">{str(props.title)}</p>
      {str(props.message) ? <p className="text-xs font-semibold text-muted">{str(props.message)}</p> : null}
      {youWon ? (
        <p className="text-sm font-bold text-emerald-700">You won{prize ? `: ${prize}` : ""}</p>
      ) : null}
      {winners.length > 0 ? (
        <ul className="divide-y divide-line text-xs font-semibold text-midnight">
          {winners.map((winner, index) => (
            <li className="flex justify-between py-1.5" key={`${winner.name}-${index}`}>
              <span>{winner.name}</span>
              <span className="text-muted">{winner.prize ?? ""}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Shell>
  );
}

function RulesLink({ props, rulesText }: { props: Record<string, unknown>; rulesText: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <Shell>
      <button
        aria-expanded={open}
        className="text-xs font-bold text-cyanDeep underline"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {str(props.label) || "Rules"}
      </button>
      {open ? <p className="whitespace-pre-line text-xs text-muted">{rulesText ?? "No rules text."}</p> : null}
    </Shell>
  );
}

function renderBlock(block: PreviewBlock, payload: PreviewPayload, now: number) {
  const { props } = block;
  const align = props.align === "center" ? "text-center" : "text-left";

  switch (block.type) {
    case "heading":
      return <p className={`font-display text-xl font-black tracking-tight text-midnight ${align}`}>{str(props.text)}</p>;
    case "text":
      return <p className={`text-sm leading-relaxed text-midnight ${align}`}>{str(props.text)}</p>;
    case "image": {
      const src = imageSource(props);
      if (!src) return <Shell><p className="text-xs font-semibold text-muted">Image not set</p></Shell>;
      return <img alt={str(props.alt)} className="w-full rounded-xl" src={src} />;
    }
    case "countdown":
      return <Countdown now={now} payload={payload} props={props} />;
    case "button": {
      const primary = props.style !== "secondary";
      const action = describeAction(props.action);
      return (
        <div className="space-y-1">
          <button
            className={`h-11 w-full rounded-xl text-sm font-bold ${
              primary ? "bg-midnight text-aqua" : "border border-line bg-white text-midnight"
            }`}
            title={action}
            type="button"
          >
            {str(props.label)}
          </button>
          {action ? <p className="truncate text-center text-[10px] text-muted">{action}</p> : null}
        </div>
      );
    }
    case "copy_code":
      return (
        <Shell>
          {str(props.label) ? <p className="text-xs font-bold text-muted">{str(props.label)}</p> : null}
          <code className="inline-block rounded-lg bg-cloud px-3 py-1.5 font-mono text-sm font-black text-midnight">
            {str(props.code)}
          </code>
        </Shell>
      );
    case "divider":
      return <hr className="border-line" />;
    case "vote":
      return <VoteBlock props={props} />;
    case "results":
      return <ResultsBlock payload={payload} props={props} />;
    case "winner":
      return <WinnerBlock props={props} />;
    case "rules_link":
      return <RulesLink props={props} rulesText={payload.rulesText} />;
    default:
      return (
        <div className="rounded-xl border border-dashed border-line bg-cloud p-3 text-xs font-semibold text-muted">
          Unsupported block
        </div>
      );
  }
}

export function PhonePreview({ payload }: PhonePreviewProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto w-full max-w-[320px] overflow-y-auto rounded-[2rem] border-[6px] border-midnight bg-cloud p-4 shadow-card">
      <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
        {payload.blocks.map((block) => (
          <div key={block.id}>{renderBlock(block, payload, now)}</div>
        ))}
      </div>
    </div>
  );
}
