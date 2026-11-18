"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  BLOCK_DEFS,
  BLOCK_TYPES,
  newBlock,
  moveBlock,
  removeBlock,
  updateBlock,
  voteBlocksOf,
  type Block,
  type BlockType,
  type EditorDraft
} from "../eventModal";
import { GIVEAWAY_BLOCK_TYPES, summarizeBlock } from "./blocks";
import { BlockInspector } from "./BlockInspector";

const MAX_BLOCKS = 30;

type BlocksTabProps = {
  draft: EditorDraft;
  onChange: (patch: Partial<EditorDraft>) => void;
  token: string;
  onUnauthorized: () => void;
};

const iconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-midnight transition hover:border-cyan disabled:opacity-40";

export function BlocksTab({ draft, onChange, token, onUnauthorized }: BlocksTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(draft.blocks[0]?.id ?? null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const blocks = draft.blocks;
  const selected: Block | null = blocks.find((block) => block.id === selectedId) ?? null;
  const atLimit = blocks.length >= MAX_BLOCKS;

  const setBlocks = (next: Block[]) => onChange({ blocks: next });

  const addBlock = (type: BlockType) => {
    const created = newBlock(type, blocks.map((block) => block.id));
    setBlocks([...blocks, created]);
    setSelectedId(created.id);
    setAddOpen(false);
  };

  const deleteBlock = (id: string) => {
    setBlocks(removeBlock(blocks, id));
    setPendingDeleteId(null);
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <section aria-label="Blocks" className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-wide text-midnight">Blocks</h2>
          <span className="text-xs font-bold text-muted">
            {blocks.length} / {MAX_BLOCKS}
          </span>
        </div>

        {blocks.length === 0 ? (
          <p className="mb-3 text-sm font-semibold text-muted">No blocks yet. Add one to start the modal.</p>
        ) : (
          <ol className="mb-3 space-y-2">
            {blocks.map((block, index) => {
              const def = BLOCK_DEFS[block.type];
              const isSelected = block.id === selectedId;
              const isPendingDelete = block.id === pendingDeleteId;
              return (
                <li
                  key={block.id}
                  className={`rounded-xl border p-2.5 ${isSelected ? "border-cyan bg-cloud" : "border-line bg-white"}`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedId(block.id)}
                      aria-current={isSelected ? "true" : undefined}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-cyanDeep">
                        {def.label}
                      </span>
                      <span className="block truncate text-sm font-bold text-midnight">{summarizeBlock(block)}</span>
                    </button>
                    <button
                      type="button"
                      aria-label="Move up"
                      className={iconButtonClass}
                      disabled={index === 0}
                      onClick={() => setBlocks(moveBlock(blocks, index, -1))}
                    >
                      <ArrowUp aria-hidden="true" size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      className={iconButtonClass}
                      disabled={index === blocks.length - 1}
                      onClick={() => setBlocks(moveBlock(blocks, index, 1))}
                    >
                      <ArrowDown aria-hidden="true" size={14} />
                    </button>
                    {isPendingDelete ? (
                      <span className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => deleteBlock(block.id)}
                          className="h-8 rounded-lg bg-red-700 px-2 text-xs font-bold text-white"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(null)}
                          className="h-8 rounded-lg border border-line px-2 text-xs font-bold text-midnight"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        aria-label="Delete block"
                        className={iconButtonClass}
                        onClick={() => setPendingDeleteId(block.id)}
                      >
                        <Trash2 aria-hidden="true" size={14} />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <div className="border-t border-line pt-3">
          <button
            type="button"
            aria-expanded={addOpen}
            disabled={atLimit}
            onClick={() => setAddOpen((open) => !open)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-midnight px-4 text-xs font-bold text-aqua transition hover:opacity-90 disabled:opacity-50"
          >
            <Plus aria-hidden="true" size={14} />
            Add block
          </button>
          {atLimit ? (
            <p className="mt-2 text-xs font-bold text-muted">A modal holds up to {MAX_BLOCKS} blocks.</p>
          ) : null}

          {addOpen ? (
            <ul className="mt-3 grid gap-2">
              {BLOCK_TYPES.map((type) => {
                const def = BLOCK_DEFS[type];
                const giveaway = GIVEAWAY_BLOCK_TYPES.includes(type);
                return (
                  <li key={type}>
                    <button
                      type="button"
                      onClick={() => addBlock(type)}
                      className="w-full rounded-xl border border-line bg-white p-3 text-left transition hover:border-cyan"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-bold text-midnight">{def.label}</span>
                        {giveaway ? (
                          <span className="rounded-full bg-cloud px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-cyanDeep">
                            needs app 2+
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold text-muted">{def.description}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </section>

      <section aria-label="Block settings" className="rounded-2xl border border-line bg-white p-5 shadow-card">
        {selected ? (
          <BlockInspector
            block={selected}
            voteBlocks={voteBlocksOf(blocks)}
            token={token}
            onUnauthorized={onUnauthorized}
            onPatch={(patch) => setBlocks(updateBlock(blocks, selected.id, patch))}
          />
        ) : (
          <p className="text-sm font-semibold text-muted">Select a block to edit it.</p>
        )}
      </section>
    </div>
  );
}
