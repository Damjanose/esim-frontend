import type { InstallGuide, InstallInstructions } from "@/lib/esim-install";

function Steps({ steps }: { steps: string[] }) {
  if (steps.length === 0) return null;
  return (
    <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-onSurfaceVariant">
      {steps.map((step, index) => (
        <li key={`${index}-${step}`}>{step}</li>
      ))}
    </ol>
  );
}

function Subheading({ children }: { children: string }) {
  return <h4 className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-brandInk first:mt-0">{children}</h4>;
}

function GuideBody({ guide }: { guide: InstallGuide }) {
  const hasApn = guide.apnType || guide.apnValue;
  return (
    <div className="px-4 pb-4">
      {guide.qrSteps.length > 0 ? (
        <>
          <Subheading>Install with the QR code</Subheading>
          <Steps steps={guide.qrSteps} />
        </>
      ) : null}
      {guide.manualSteps.length > 0 ? (
        <>
          <Subheading>Install manually</Subheading>
          <Steps steps={guide.manualSteps} />
        </>
      ) : null}
      {guide.networkSteps.length > 0 || hasApn || guide.roaming !== null ? (
        <>
          <Subheading>Mobile data settings</Subheading>
          <ul className="mt-2 space-y-1.5 text-sm text-onSurfaceVariant">
            <li>Set this eSIM as the line for mobile data.</li>
            {guide.roaming !== false ? <li>Turn Data Roaming on for this eSIM.</li> : null}
            {guide.apnType ? (
              <li>
                APN type: <strong className="text-brandInk">{guide.apnType}</strong>
              </li>
            ) : null}
            {guide.apnValue ? (
              <li>
                APN: <strong className="text-brandInk">{guide.apnValue}</strong>
              </li>
            ) : null}
          </ul>
          <Steps steps={guide.networkSteps} />
        </>
      ) : null}
    </div>
  );
}

/** Per-platform install, APN and roaming steps from GET /orders/:id/instructions. */
export function InstallGuides({ instructions }: { instructions: InstallInstructions }) {
  if (instructions.guides.length === 0 && instructions.generic.length === 0) return null;

  return (
    <div className="mt-5 space-y-2" data-install-guides>
      {instructions.guides.map((guide, index) => (
        <details
          className="rounded-[14px] border border-outline/60 bg-surfaceBright"
          key={`${guide.platform}-${guide.title}-${index}`}
          open={index === 0}
        >
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-brandInk">
            {guide.title} instructions
          </summary>
          <GuideBody guide={guide} />
        </details>
      ))}
      {instructions.generic.map((item, index) => (
        <details className="rounded-[14px] border border-outline/60 bg-surfaceBright" key={`${index}-${item.title}`}>
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-brandInk">{item.title}</summary>
          <p className="whitespace-pre-line px-4 pb-4 text-sm text-onSurfaceVariant">{item.body}</p>
        </details>
      ))}
    </div>
  );
}
