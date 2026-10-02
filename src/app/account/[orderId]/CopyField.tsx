"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; the value stays selectable on screen.
    }
  }

  return (
    <div className="rounded-[12px] border border-outline/60 bg-surfaceBright px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-onSurfaceVariant">{label}</p>

      <div className="mt-1.5 flex items-center gap-3">
        <code className="min-w-0 flex-1 break-all font-mono text-xs text-brandInk">{value}</code>

        <button
          aria-label={`Copy ${label}`}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-outline bg-surface text-onSurfaceVariant transition hover:border-brandBlue/75 hover:text-brandInk"
          onClick={() => void copy()}
          type="button"
        >
          {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
        </button>
      </div>
    </div>
  );
}
