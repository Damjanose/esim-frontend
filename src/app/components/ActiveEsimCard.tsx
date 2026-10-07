import type { UsageMeter } from "@/lib/accountEsims";
import { LinkButton } from "./Button";
import { EsimFlag } from "./EsimFlag";

/**
 * The app's ActiveEsimCard (phones/tablets): a brandBlue card with the data left in
 * large type, a bar of what's left, the days left, then Top up / Details. The blue
 * card is the emphasis, so neither action is the gradient: Top up is the white flat
 * button (the app's solid white pill) and Details an outline on blue.
 */
export function ActiveEsimCard({
  title,
  flagUri,
  statusLine,
  meter,
  topUpHref,
  detailsHref
}: {
  title: string;
  flagUri: string | null;
  statusLine: string;
  meter: UsageMeter;
  topUpHref?: string;
  detailsHref?: string;
}) {
  return (
    <article className="rounded-[18px] bg-brandBlue p-5 text-surface shadow-brandGlow" data-active-esim-card>
      <div className="flex items-center gap-3">
        <EsimFlag className="h-10 w-10 rounded-[12px] bg-surface/20 text-surface" flagUri={flagUri} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-black">{title}</h3>
          <p className="truncate text-xs text-surface/80">{statusLine}</p>
        </div>
      </div>

      {meter.headline ? (
        <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
          <span className="font-display text-[30px] font-black leading-9 tracking-[-0.03em]">{meter.headline}</span>
          {meter.caption ? <span className="text-xs text-surface/80">{meter.caption}</span> : null}
        </p>
      ) : null}
      {meter.note ? <p className="mt-4 text-sm leading-6 text-surface/80">{meter.note}</p> : null}

      <div aria-label={meter.label} className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface/25" role="img">
        <div className="h-full rounded-full bg-surface" style={{ width: `${meter.leftPercent ?? 0}%` }} />
      </div>

      {topUpHref || detailsHref ? (
        <div className="mt-5 flex gap-2">
          {topUpHref ? (
            <LinkButton className="flex-1" href={topUpHref} surface="dark">
              Top up
            </LinkButton>
          ) : null}
          {detailsHref ? (
            <LinkButton className="flex-1" href={detailsHref} surface="dark" variant="tint">
              Details
            </LinkButton>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
