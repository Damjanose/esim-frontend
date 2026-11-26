"use client";

import { useState } from "react";
import { buildCampaignLink, CAMPAIGN_MEDIUMS } from "@/lib/insights/linkBuilder";

const FIELD = "rounded-xl border border-line bg-white px-3 py-2 text-sm font-bold text-midnight";

const ERRORS: Record<string, string> = {
  base_not_allowed: "Use a link on esim.uplisoft.com.",
  source_required: "Add a source, such as facebook.",
  medium_required: "Choose a medium.",
  campaign_required: "Add a campaign name."
};

/** Builds a tagged link for a campaign. The link is copied, never stored. */
export function LinkBuilder() {
  const [base, setBase] = useState("https://esim.uplisoft.com/destinations");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState<string>(CAMPAIGN_MEDIUMS[0]);
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);

  const result = buildCampaignLink({ base, source, medium, campaign, content });
  const url = "url" in result ? result.url : null;
  const error = "error" in result && (source || campaign) ? ERRORS[result.error] : null;

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-white p-4 shadow-card">
      <h3 className="text-sm font-black text-midnight">Campaign link</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-[12px] font-black uppercase tracking-[0.06em] text-midnight/70 sm:col-span-2">
          Page
          <input className={FIELD} value={base} onChange={(event) => setBase(event.target.value)} />
        </label>
        <label className="grid gap-1 text-[12px] font-black uppercase tracking-[0.06em] text-midnight/70">
          Source
          <input className={FIELD} value={source} placeholder="facebook" onChange={(event) => setSource(event.target.value)} />
        </label>
        <label className="grid gap-1 text-[12px] font-black uppercase tracking-[0.06em] text-midnight/70">
          Medium
          <select className={FIELD} value={medium} onChange={(event) => setMedium(event.target.value)}>
            {CAMPAIGN_MEDIUMS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-[12px] font-black uppercase tracking-[0.06em] text-midnight/70">
          Campaign
          <input className={FIELD} value={campaign} placeholder="black-friday" onChange={(event) => setCampaign(event.target.value)} />
        </label>
        <label className="grid gap-1 text-[12px] font-black uppercase tracking-[0.06em] text-midnight/70">
          Content (optional)
          <input className={FIELD} value={content} onChange={(event) => setContent(event.target.value)} />
        </label>
      </div>
      {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
      {url ? (
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 break-all rounded-xl bg-cloud p-2 text-[12px] text-midnight">{url}</code>
          <button type="button" onClick={() => void copy()} className="rounded-full border border-line px-3 py-1 text-sm font-bold text-midnight">
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
