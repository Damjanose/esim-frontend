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
    <div className="rounded-[12px] border border-[#163958] bg-[#040d1a] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#748aa2]">{label}</p>

      <div className="mt-1.5 flex items-center gap-3">
        <code className="min-w-0 flex-1 break-all font-mono text-xs text-[#c7d6e5]">{value}</code>

        <button
          aria-label={`Copy ${label}`}
          className="shrink-0 rounded-[8px] border border-[#214867] p-2 text-[#8ea3ba] transition hover:border-[#168cff]/75 hover:text-white"
          onClick={() => void copy()}
          type="button"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}
