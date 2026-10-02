import type { PublicTestimonial } from "@/lib/testimonials";

export function Testimonials({ items }: { items: PublicTestimonial[] }) {
  if (items.length === 0) return null;

  const featured = items.length === 1;

  return (
    <section className="relative overflow-hidden bg-surface px-5 py-10 text-onSurface md:px-8 md:py-24" id="testimonials">
      <div className="relative mx-auto max-w-[1120px]">
        <h2 className="font-display text-3xl font-black tracking-[-0.03em] text-brandInk [text-wrap:balance] sm:text-4xl">
          What travelers say
        </h2>

        {featured ? (
          <FeaturedQuote item={items[0]} />
        ) : (
          // Phones: sideways scroll-snap carousel. min-w-0 + contain:inline-size keep the
          // unwrapped row from widening the page (no horizontal page scroll at 320px).
          <div className="mt-6 min-w-0 [contain:inline-size] md:mt-10 lg:[contain:none]">
            <div
              className={`relative -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-4 md:scroll-px-8 [scrollbar-width:none] md:-mx-8 md:px-8 lg:mx-0 lg:grid lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0 ${items.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}
            >
              {items.map((item) => (
                <QuoteCard item={item} key={`${item.displayName}-${item.createdAt}`} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedQuote({ item }: { item: PublicTestimonial }) {
  return (
    <figure className="mt-8 max-w-3xl rounded-[20px] border border-outline/70 bg-surface p-6 sm:p-8">
      <Stars rating={item.rating} size={16} />
      <blockquote className="mt-4 text-lg leading-8 text-onSurface">{item.body}</blockquote>
      <figcaption className="mt-6">
        <Author item={item} />
      </figcaption>
    </figure>
  );
}

function QuoteCard({ item }: { item: PublicTestimonial }) {
  return (
    <figure className="relative flex w-[82%] max-w-[340px] shrink-0 snap-start flex-col rounded-[18px] border border-outline/70 bg-surface p-5 sm:w-[70%] lg:w-auto lg:max-w-none lg:p-6">
      <Stars rating={item.rating} size={14} />
      <blockquote className="mt-3 flex-1 text-[15px] leading-6 text-onSurface lg:mt-4 lg:leading-7">{item.body}</blockquote>
      <figcaption className="mt-5 lg:mt-6">
        <Author item={item} />
      </figcaption>
    </figure>
  );
}

function Author({ item }: { item: PublicTestimonial }) {
  const date = formatMonth(item.createdAt);
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brandBlue/10 font-display text-base font-black text-brandBlue"
      >
        {item.displayName.charAt(0).toUpperCase()}
      </span>
      <span className="flex flex-col">
        <span className="font-display text-[15px] font-black text-brandInk">
          {item.displayName}
        </span>
        <span className="text-xs text-onSurfaceVariant">
          eSim2you traveler{date ? ` · ${date}` : ""}
        </span>
      </span>
    </div>
  );
}

function Stars({ rating, size }: { rating: number; size: number }) {
  const filled = Math.round(clampRating(rating));
  const on = "text-brandBlue";
  const off = "text-outline";
  return (
    <span aria-label={`${clampRating(rating).toFixed(1)} out of 5 stars`} className="flex gap-0.5" role="img">
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          aria-hidden
          className={index < filled ? on : off}
          fill="currentColor"
          height={size}
          key={index}
          viewBox="0 0 20 20"
          width={size}
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

function clampRating(rating: number) {
  return Math.max(0, Math.min(5, rating));
}

function formatMonth(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
