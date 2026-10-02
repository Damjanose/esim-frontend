import { Lock } from "lucide-react";
import type { DocView } from "@/lib/tripPlan/docView";

/**
 * The plan in the PDF's order: cover, trip at a glance, logistics, transport,
 * one band per day with its timed stops, practical notes. Real plans and the
 * fixed sample both render through here (as the app's TripPlanDocument does).
 * A locked preview fades out at the bottom; the unlock panel sits under it.
 */
export function TripPlanDocument({ view, label }: { view: DocView; label?: string }) {
  return (
    <article
      aria-label={label ?? view.title}
      className="relative overflow-hidden rounded-[20px] border border-outline/70 bg-surface p-5 shadow-brandCard sm:p-8"
    >
      <header>
        <h2 className="break-words font-display text-[26px] font-black leading-[1.15] tracking-[-0.02em] text-brandInk sm:text-[32px]">
          {view.title}
        </h2>
        {view.coverLines.map((line) => (
          <p className="mt-1.5 text-body-sm text-onSurfaceVariant sm:text-body-md" key={line}>
            {line}
          </p>
        ))}
        <div className="mt-5 h-[2px] w-16 rounded-full bg-gradient-to-r from-brandBlue to-brandTeal" />
      </header>

      {view.glance.length > 0 ? (
        <section className="mt-7">
          <SectionHeading>Trip at a glance</SectionHeading>
          <div className="mt-3 overflow-x-auto rounded-[12px] border border-outline/70">
            <table className="w-full min-w-[420px] text-left text-body-sm">
              <thead className="bg-brandInk text-white">
                <tr>
                  <th className="px-3 py-2 font-bold" scope="col">Day</th>
                  <th className="px-3 py-2 font-bold" scope="col">Theme</th>
                  <th className="px-3 py-2 font-bold" scope="col">Highlight</th>
                </tr>
              </thead>
              <tbody>
                {view.glance.map((row, index) => (
                  <tr className={index % 2 === 1 ? "bg-surfaceBright" : undefined} key={`${index}-${row.day}`}>
                    <td className="whitespace-nowrap px-3 py-2 font-semibold text-brandInk">{row.day}</td>
                    <td className="px-3 py-2 text-onSurface">{row.theme}</td>
                    <td className="px-3 py-2 text-onSurfaceVariant">{row.highlight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {view.logistics || view.transit ? (
        <section className="mt-7">
          <SectionHeading>Logistics</SectionHeading>
          {view.logistics ? <p className="mt-2 text-body-md text-onSurface">{view.logistics}</p> : null}
          {view.transit ? (
            <p className="mt-1 text-body-md text-onSurface">
              <span className="font-bold text-brandInk">Nearest transit:</span> {view.transit}
            </p>
          ) : null}
        </section>
      ) : null}

      {view.tips.length > 0 ? (
        <section className="mt-7">
          <SectionHeading>Transport strategy</SectionHeading>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-body-md text-onSurface">
            {view.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {view.days.map((day, dayIndex) => (
        <section className="mt-7" key={`${dayIndex}-${day.heading}`}>
          <div
            className={`rounded-[12px] px-4 py-3 text-white ${
              day.accent ? "bg-gradient-to-r from-brandBlue to-brandTeal" : "bg-brandInk"
            }`}
          >
            <h3 className="font-display text-title-sm font-black uppercase tracking-[0.04em]">{day.heading}</h3>
            <p className="mt-0.5 text-body-sm italic text-white/85">{day.title}</p>
          </div>
          <ol className="mt-2 divide-y divide-outline/50">
            {day.blocks.map((block, index) => (
              <li className="flex gap-4 py-3" key={index}>
                <span className="w-12 shrink-0 font-mono text-mono-data font-bold text-brandBlue">{block.time}</span>
                <div className="min-w-0">
                  <p className={`text-body-md font-bold ${block.highlight ? "text-brandBlue" : "text-brandInk"}`}>
                    {block.highlight ? "★ " : ""}
                    {block.place}
                  </p>
                  {block.details ? <p className="mt-0.5 text-body-sm text-onSurfaceVariant">{block.details}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {view.notes.length > 0 ? (
        <section className="mt-7">
          <SectionHeading>Practical notes</SectionHeading>
          <dl className="mt-2 space-y-1.5 text-body-md">
            {view.notes.map((note, index) => (
              <div key={`${index}-${note.label}`}>
                <dt className="inline font-bold text-brandInk">{note.label}: </dt>
                <dd className="inline text-onSurface">{note.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {view.locked ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-surface/0 via-surface/85 to-surface"
          />
          <div className="relative mt-6 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brandBlue/10 px-3 py-1.5 text-xs font-bold text-brandBlue">
              <Lock aria-hidden="true" size={14} />
              Preview. Unlock to see every day
            </span>
          </div>
        </>
      ) : null}
    </article>
  );
}

function SectionHeading({ children }: { children: string }) {
  return <h3 className="font-display text-title-sm font-black text-brandInk">{children}</h3>;
}
