import { CircleHelp } from "lucide-react";

export type ContentFaqEntry = {
  question: string;
  answer: string;
};

/**
 * The content pages' FAQ: native <details> (no client JS, works before hydration),
 * styled like /esim/[slug]'s FAQ. Each summary row is at least 44px tall.
 */
export function ContentFaq({ faqs }: { faqs: readonly ContentFaqEntry[] }) {
  return (
    <div className="space-y-3">
      {faqs.map((faq) => (
        <details className="group rounded-[16px] border border-outline/70 bg-surface px-5 py-2" key={faq.question}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-2 font-display font-black text-brandInk">
            {faq.question}
            <CircleHelp
              aria-hidden="true"
              className="shrink-0 text-brandBlue motion-safe:transition group-open:rotate-45"
              size={20}
            />
          </summary>
          <p className="pb-3 pt-1 leading-7 text-onSurfaceVariant">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
