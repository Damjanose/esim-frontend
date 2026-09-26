import type { PublicTestimonial } from "@/lib/testimonials";

export function Testimonials({ items }: { items: PublicTestimonial[] }) {
  if (items.length === 0) return null;

  const average = items.reduce((sum, item) => sum + clampRating(item.rating), 0) / items.length;
  const featured = items.length === 1;

  return (
    <section className="relative overflow-hidden bg-surface px-5 py-16 text-onSurface md:px-8 md:py-24" id="testimonials">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(11,73,183,0.08),transparent)]"
      />
      <div className="relative mx-auto max-w-[1120px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brandBlue">From travelers</p>
            <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.03em] text-brandInk [text-wrap:balance] sm:text-[44px] sm:leading-[1.05]">
              What people say after they land
            </h2>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-outline/60 bg-surface/80 px-5 py-4 shadow-brandCard backdrop-blur">
            <span className="font-display text-4xl font-black tracking-[-0.04em] text-brandInk">{average.toFixed(1)}</span>
            <span className="flex flex-col gap-1">
              <Stars rating={average} size={16} />
              <span className="text-xs font-semibold text-onSurfaceVariant">
                Average from {items.length} {items.length === 1 ? "traveler" : "travelers"}
              </span>
            </span>
          </div>
        </div>

        {featured ? (
          <FeaturedQuote item={items[0]} />
        ) : (
          <div className={`mt-12 grid gap-5 ${items.length === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"}`}>
            {items.map((item) => (
              <QuoteCard item={item} key={`${item.displayName}-${item.createdAt}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedQuote({ item }: { item: PublicTestimonial }) {
  return (
    <figure className="relative mt-12 overflow-hidden rounded-[28px] bg-brandInk px-7 py-10 text-white shadow-brandGlow sm:px-12 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brandTeal/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brandBlue/40 blur-3xl"
      />
      <QuoteMark className="relative h-12 w-12 text-brandTeal sm:h-14 sm:w-14" />
      <blockquote className="relative mt-6 max-w-3xl font-display text-2xl font-bold leading-snug tracking-[-0.02em] sm:text-[34px] sm:leading-[1.25]">
        {item.body}
      </blockquote>
      <figcaption className="relative mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-8">
        <Author item={item} dark />
        <Stars rating={item.rating} size={20} tone="dark" />
      </figcaption>
    </figure>
  );
}

function QuoteCard({ item }: { item: PublicTestimonial }) {
  return (
    <figure className="group relative flex flex-col rounded-[22px] border border-outline/60 bg-surface p-7 shadow-brandCard transition duration-300 hover:-translate-y-1 hover:shadow-brandGlow">
      <div className="flex items-center justify-between">
        <Stars rating={item.rating} size={16} />
        <QuoteMark className="h-8 w-8 text-brandBlue/15 transition-colors duration-300 group-hover:text-brandTeal/40" />
      </div>
      <blockquote className="mt-5 flex-1 text-[15px] leading-7 text-onSurface">{item.body}</blockquote>
      <figcaption className="mt-7 border-t border-outline/50 pt-5">
        <Author item={item} />
      </figcaption>
    </figure>
  );
}

function Author({ item, dark = false }: { item: PublicTestimonial; dark?: boolean }) {
  const date = formatMonth(item.createdAt);
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brandBlue to-brandTeal font-display text-base font-black text-white"
      >
        {item.displayName.charAt(0).toUpperCase()}
      </span>
      <span className="flex flex-col">
        <span className={`font-display text-[15px] font-black ${dark ? "text-white" : "text-brandInk"}`}>
          {item.displayName}
        </span>
        <span className={`text-xs ${dark ? "text-white/60" : "text-onSurfaceVariant"}`}>
          eSim2you traveler{date ? ` · ${date}` : ""}
        </span>
      </span>
    </div>
  );
}

function Stars({ rating, size, tone = "light" }: { rating: number; size: number; tone?: "light" | "dark" }) {
  const filled = Math.round(clampRating(rating));
  const on = tone === "dark" ? "text-brandTeal" : "text-brandBlue";
  const off = tone === "dark" ? "text-white/20" : "text-outline";
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

function QuoteMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="currentColor" viewBox="0 0 32 32">
      <path d="M13 8C7.5 9.6 4 13.9 4 19.4 4 23 6.2 25 9 25c2.6 0 4.5-1.9 4.5-4.4 0-2.4-1.7-4.1-4-4.1-.4 0-.8 0-1.1.1.6-2.7 2.8-5 5.6-6.1L13 8zm15 0c-5.5 1.6-9 5.9-9 11.4 0 3.6 2.2 5.6 5 5.6 2.6 0 4.5-1.9 4.5-4.4 0-2.4-1.7-4.1-4-4.1-.4 0-.8 0-1.1.1.6-2.7 2.8-5 5.6-6.1L28 8z" />
    </svg>
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
