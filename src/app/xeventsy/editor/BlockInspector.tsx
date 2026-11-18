"use client";

import { useState, type ChangeEvent, type ReactNode } from "react";
import { adminUpload } from "../api";
import {
  BLOCK_DEFS,
  PHASES,
  PHASE_LABELS,
  ROUTE_OPTIONS,
  setTextDefault,
  textOf,
  type Block,
  type EditorDraft,
  type Phase
} from "../eventModal";
import {
  buttonActionFor,
  buttonActionKind,
  filterCopyCode,
  imageWithId,
  imageWithUrl,
  nextOptionId,
  numberOrUndefined,
  optionIdProblems,
  togglePhase,
  withTextProp,
  type ButtonActionKind
} from "./blocks";

type Patch = Partial<Pick<Block, "props" | "visibleIn">>;

type BlockInspectorProps = {
  block: Block;
  voteBlocks: Block[];
  token: string;
  onUnauthorized: () => void;
  onPatch: (patch: Patch) => void;
};

const inputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-midnight outline-none transition focus:ring-2 focus:ring-cyan/20";
const textareaClass =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-midnight outline-none transition focus:ring-2 focus:ring-cyan/20";
const eyebrowClass = "text-[10px] font-black uppercase tracking-[0.12em] text-cyanDeep";

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="mt-4 first:mt-0">
      <label className="block text-sm font-bold text-midnight" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function BlockInspector({ block, voteBlocks, token, onUnauthorized, onPatch }: BlockInspectorProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const props = block.props;
  const id = (suffix: string) => `block-${block.id}-${suffix}`;

  const setProps = (nextProps: Record<string, unknown>) => onPatch({ props: nextProps });
  const setText = (key: string, text: string, optional = false) =>
    setProps(withTextProp(props, key, text, { optional }));

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadError("");
    const result = await adminUpload(file, { token, onUnauthorized });
    setUploading(false);
    if (!result.ok) {
      setUploadError(result.message);
      return;
    }
    setProps(imageWithId(props, result.data.id));
  };

  const renderBody = () => {
    switch (block.type) {
      case "heading":
      case "text":
        return (
          <>
            <Field label="Text" htmlFor={id("text")}>
              <textarea
                id={id("text")}
                className={textareaClass}
                rows={block.type === "heading" ? 2 : 5}
                value={textOf(props.text)}
                onChange={(event) => setText("text", event.target.value)}
              />
            </Field>
            <Field label="Align" htmlFor={id("align")}>
              <select
                id={id("align")}
                className={inputClass}
                value={props.align === "center" ? "center" : "left"}
                onChange={(event) => setProps({ ...props, align: event.target.value })}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
              </select>
            </Field>
          </>
        );

      case "image": {
        const imageId = typeof props.imageId === "string" ? props.imageId : "";
        const url = typeof props.url === "string" ? props.url : "";
        return (
          <>
            <Field label="Upload" htmlFor={id("file")}>
              <input
                id={id("file")}
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={handleUpload}
                className="mt-1.5 block w-full text-sm text-midnight file:mr-3 file:rounded-lg file:border-0 file:bg-midnight file:px-3 file:py-2 file:text-xs file:font-bold file:text-aqua"
              />
              {uploading ? <p className="mt-1.5 text-xs font-semibold text-muted">Uploading...</p> : null}
              {uploadError ? <p className="mt-1.5 text-xs font-bold text-red-700">{uploadError}</p> : null}
            </Field>
            {imageId ? (
              <img
                alt=""
                src={`/bff/admin/event-modals/images/${encodeURIComponent(imageId)}`}
                className="mt-3 h-24 w-auto max-w-full rounded-xl border border-line bg-white object-contain"
              />
            ) : null}
            <Field label="Or an https image URL" htmlFor={id("url")}>
              <input
                id={id("url")}
                type="url"
                className={inputClass}
                placeholder="https://"
                value={url}
                onChange={(event) => {
                  const next = event.target.value;
                  if (next.trim() === "") {
                    const { url: _url, ...rest } = props;
                    setProps(rest);
                  } else {
                    setProps(imageWithUrl(props, next));
                  }
                }}
              />
            </Field>
            <Field label="Alt text" htmlFor={id("alt")}>
              <input
                id={id("alt")}
                className={inputClass}
                value={textOf(props.alt)}
                onChange={(event) => setText("alt", event.target.value)}
              />
            </Field>
          </>
        );
      }

      case "countdown":
        return (
          <>
            <Field label="Counts down to" htmlFor={id("target")}>
              <select
                id={id("target")}
                className={inputClass}
                value={props.target === "votingClosesAt" ? "votingClosesAt" : "displayUntil"}
                onChange={(event) => setProps({ ...props, target: event.target.value })}
              >
                <option value="displayUntil">Display end</option>
                <option value="votingClosesAt">Voting closes</option>
              </select>
            </Field>
            <Field label="Label (optional)" htmlFor={id("label")}>
              <input
                id={id("label")}
                className={inputClass}
                value={textOf(props.label)}
                onChange={(event) => setText("label", event.target.value, true)}
              />
            </Field>
          </>
        );

      case "button": {
        const action = (props.action ?? {}) as { url?: string; route?: string; slug?: string };
        const kind = buttonActionKind(props.action);
        const setAction = (nextKind: ButtonActionKind, input: { url?: string; route?: string; slug?: string }) =>
          setProps({ ...props, action: buttonActionFor(nextKind, input) });
        return (
          <>
            <Field label="Label" htmlFor={id("label")}>
              <input
                id={id("label")}
                className={inputClass}
                value={textOf(props.label)}
                onChange={(event) => setText("label", event.target.value)}
              />
            </Field>
            <Field label="Action" htmlFor={id("action")}>
              <select
                id={id("action")}
                className={inputClass}
                value={kind}
                onChange={(event) => setAction(event.target.value as ButtonActionKind, {})}
              >
                <option value="dismiss">Just close</option>
                <option value="url">Open link (https)</option>
                <option value="route">Open in app</option>
              </select>
            </Field>
            {kind === "url" ? (
              <Field label="Link" htmlFor={id("url")}>
                <input
                  id={id("url")}
                  type="url"
                  className={inputClass}
                  placeholder="https://"
                  value={action.url ?? ""}
                  onChange={(event) => setAction("url", { url: event.target.value })}
                />
              </Field>
            ) : null}
            {kind === "route" ? (
              <>
                <Field label="Screen" htmlFor={id("route")}>
                  <select
                    id={id("route")}
                    className={inputClass}
                    value={action.route ?? ""}
                    onChange={(event) => setAction("route", { route: event.target.value, slug: action.slug })}
                  >
                    <option value="">Choose a screen</option>
                    {ROUTE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                {action.route === "/country/[slug]" ? (
                  <Field label="Country slug" htmlFor={id("slug")}>
                    <input
                      id={id("slug")}
                      className={inputClass}
                      placeholder="albania"
                      value={action.slug ?? ""}
                      onChange={(event) =>
                        setAction("route", {
                          route: action.route,
                          slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                        })
                      }
                    />
                  </Field>
                ) : null}
              </>
            ) : null}
            <Field label="Style" htmlFor={id("style")}>
              <select
                id={id("style")}
                className={inputClass}
                value={props.style === "secondary" ? "secondary" : "primary"}
                onChange={(event) => setProps({ ...props, style: event.target.value })}
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
              </select>
            </Field>
          </>
        );
      }

      case "copy_code":
        return (
          <>
            <Field label="Code" htmlFor={id("code")}>
              <input
                id={id("code")}
                className={inputClass}
                value={textOf(props.code)}
                onChange={(event) => setProps({ ...props, code: filterCopyCode(event.target.value) })}
              />
              <p className="mt-1 text-xs font-semibold text-muted">Letters, digits, - and _ only.</p>
            </Field>
            <Field label="Label (optional)" htmlFor={id("label")}>
              <input
                id={id("label")}
                className={inputClass}
                value={textOf(props.label)}
                onChange={(event) => setText("label", event.target.value, true)}
              />
            </Field>
          </>
        );

      case "divider":
        return <p className="text-sm font-semibold text-muted">A divider has no settings.</p>;

      case "vote":
        return renderVote();

      case "results":
        return (
          <>
            <Field label="Vote block" htmlFor={id("vote")}>
              <select
                id={id("vote")}
                className={inputClass}
                value={typeof props.voteBlockId === "string" ? props.voteBlockId : ""}
                onChange={(event) => setProps({ ...props, voteBlockId: event.target.value })}
              >
                <option value="">Choose a vote</option>
                {voteBlocks.map((vote) => (
                  <option key={vote.id} value={vote.id}>
                    {textOf(vote.props.question) || vote.id}
                  </option>
                ))}
              </select>
              {voteBlocks.length === 0 ? (
                <p className="mt-1.5 text-xs font-bold text-red-700">Add a vote block first.</p>
              ) : null}
            </Field>
            <Field label="Title (optional)" htmlFor={id("title")}>
              <input
                id={id("title")}
                className={inputClass}
                value={textOf(props.title)}
                onChange={(event) => setText("title", event.target.value, true)}
              />
            </Field>
          </>
        );

      case "winner":
        return (
          <>
            <Field label="Title" htmlFor={id("title")}>
              <input
                id={id("title")}
                className={inputClass}
                value={textOf(props.title)}
                onChange={(event) => setText("title", event.target.value, true)}
              />
            </Field>
            <Field label="Message (optional)" htmlFor={id("message")}>
              <textarea
                id={id("message")}
                className={textareaClass}
                rows={3}
                value={textOf(props.message)}
                onChange={(event) => setText("message", event.target.value, true)}
              />
            </Field>
          </>
        );

      case "rules_link":
        return (
          <Field label="Label (optional)" htmlFor={id("label")}>
            <input
              id={id("label")}
              className={inputClass}
              value={textOf(props.label)}
              onChange={(event) => setText("label", event.target.value, true)}
            />
          </Field>
        );

      default:
        return null;
    }
  };

  const renderVote = () => {
    const questionType = props.questionType === "exact_score" || props.questionType === "number"
      ? props.questionType
      : "choice";
    const options = Array.isArray(props.options) ? (props.options as Array<{ id: string; label: unknown }>) : [];
    const problems = questionType === "choice" ? optionIdProblems(options) : [];

    const setQuestionType = (nextType: string) => {
      const base: Record<string, unknown> = {
        question: props.question,
        questionType: nextType,
        points: props.points ?? 1
      };
      if (nextType === "choice") {
        base.options =
          options.length > 0
            ? options
            : [
                { id: "home", label: { default: "Home" } },
                { id: "away", label: { default: "Away" } }
              ];
      }
      if (nextType === "exact_score") {
        if (props.homeLabel !== undefined) base.homeLabel = props.homeLabel;
        if (props.awayLabel !== undefined) base.awayLabel = props.awayLabel;
      }
      if (nextType === "number") {
        if (props.min !== undefined) base.min = props.min;
        if (props.max !== undefined) base.max = props.max;
        if (props.unit !== undefined) base.unit = props.unit;
      }
      setProps(base);
    };

    const setOptions = (nextOptions: Array<{ id: string; label: unknown }>) =>
      setProps({ ...props, options: nextOptions });

    return (
      <>
        <Field label="Question" htmlFor={id("question")}>
          <textarea
            id={id("question")}
            className={textareaClass}
            rows={2}
            value={textOf(props.question)}
            onChange={(event) => setText("question", event.target.value)}
          />
        </Field>
        <Field label="Answer type" htmlFor={id("qtype")}>
          <select
            id={id("qtype")}
            className={inputClass}
            value={questionType}
            onChange={(event) => setQuestionType(event.target.value)}
          >
            <option value="choice">Choice (pick one option)</option>
            <option value="exact_score">Exact score (home and away)</option>
            <option value="number">Number</option>
          </select>
        </Field>
        <Field label="Points" htmlFor={id("points")}>
          <input
            id={id("points")}
            type="number"
            min={1}
            max={100}
            className={inputClass}
            value={typeof props.points === "number" ? props.points : ""}
            onChange={(event) => {
              const parsed = numberOrUndefined(event.target.value);
              setProps({ ...props, points: parsed ?? 1 });
            }}
          />
        </Field>

        {questionType === "choice" ? (
          <div className="mt-4">
            <p className="text-sm font-bold text-midnight">Options</p>
            <ul className="mt-2 space-y-2">
              {options.map((option, index) => (
                <li className="flex gap-2" key={`${index}-${option.id}`}>
                  <input
                    aria-label={`Option ${index + 1} id`}
                    className="h-10 w-28 shrink-0 rounded-xl border border-line bg-white px-3 text-sm text-midnight outline-none focus:ring-2 focus:ring-cyan/20"
                    value={option.id}
                    onChange={(event) =>
                      setOptions(
                        options.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, id: event.target.value } : item
                        )
                      )
                    }
                  />
                  <input
                    aria-label={`Option ${index + 1} label`}
                    className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-white px-3 text-sm text-midnight outline-none focus:ring-2 focus:ring-cyan/20"
                    value={textOf(option.label)}
                    onChange={(event) =>
                      setOptions(
                        options.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, label: setTextDefault(item.label, event.target.value) }
                            : item
                        )
                      )
                    }
                  />
                  <button
                    type="button"
                    aria-label={`Remove option ${index + 1}`}
                    disabled={options.length <= 2}
                    onClick={() => setOptions(options.filter((_item, itemIndex) => itemIndex !== index))}
                    className="h-10 shrink-0 rounded-xl border border-line px-3 text-xs font-bold text-midnight disabled:opacity-40"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={options.length >= 10}
              onClick={() =>
                setOptions([
                  ...options,
                  { id: nextOptionId(options), label: { default: `Option ${options.length + 1}` } }
                ])
              }
              className="mt-3 h-9 rounded-lg border border-line px-3 text-xs font-bold text-midnight disabled:opacity-40"
            >
              Add option
            </button>
            {problems.map((problem) => (
              <p className="mt-2 text-xs font-bold text-red-700" key={problem}>
                {problem}
              </p>
            ))}
          </div>
        ) : null}

        {questionType === "exact_score" ? (
          <>
            <Field label="Home label (optional)" htmlFor={id("home")}>
              <input
                id={id("home")}
                className={inputClass}
                value={textOf(props.homeLabel)}
                onChange={(event) => setText("homeLabel", event.target.value, true)}
              />
            </Field>
            <Field label="Away label (optional)" htmlFor={id("away")}>
              <input
                id={id("away")}
                className={inputClass}
                value={textOf(props.awayLabel)}
                onChange={(event) => setText("awayLabel", event.target.value, true)}
              />
            </Field>
          </>
        ) : null}

        {questionType === "number" ? (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-bold text-midnight" htmlFor={id("min")}>
                Min
              </label>
              <input
                id={id("min")}
                type="number"
                className={inputClass}
                value={typeof props.min === "number" ? props.min : ""}
                onChange={(event) => setProps({ ...props, min: numberOrUndefined(event.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-midnight" htmlFor={id("max")}>
                Max
              </label>
              <input
                id={id("max")}
                type="number"
                className={inputClass}
                value={typeof props.max === "number" ? props.max : ""}
                onChange={(event) => setProps({ ...props, max: numberOrUndefined(event.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-midnight" htmlFor={id("unit")}>
                Unit
              </label>
              <input
                id={id("unit")}
                className={inputClass}
                value={textOf(props.unit)}
                onChange={(event) => setText("unit", event.target.value, true)}
              />
            </div>
          </div>
        ) : null}
      </>
    );
  };

  const visibleIn = block.visibleIn;

  return (
    <div>
      <p className={eyebrowClass}>{BLOCK_DEFS[block.type].label}</p>
      <p className="mt-1 text-xs font-semibold text-muted">{BLOCK_DEFS[block.type].description}</p>

      <div className="mt-5">{renderBody()}</div>

      <fieldset className="mt-6 border-t border-line pt-5">
        <legend className={eyebrowClass}>Visible in</legend>
        <p className="mt-1 text-xs font-semibold text-muted">
          Promos use &quot;{PHASE_LABELS.live}&quot;. Giveaways use the other five phases.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {PHASES.map((phase: Phase) => (
            <label className="flex items-center gap-2 text-sm font-semibold text-midnight" key={phase}>
              <input
                type="checkbox"
                className="h-4 w-4 accent-midnight"
                checked={visibleIn.includes(phase)}
                onChange={() => onPatch({ visibleIn: togglePhase(visibleIn, phase) })}
              />
              {PHASE_LABELS[phase]}
            </label>
          ))}
        </div>
        {visibleIn.length === 0 ? (
          <p className="mt-2 text-xs font-bold text-red-700">Pick at least one phase, or the block never shows.</p>
        ) : null}
      </fieldset>
    </div>
  );
}
