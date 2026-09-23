import type { PublicTestimonial } from "@/lib/testimonials";

export function Testimonials({ items }: { items: PublicTestimonial[] }) {
  if (items.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-surface px-5 py-10 text-onSurface md:px-8" id="testimonials">
      <div className="relative mx-auto max-w-[1280px]">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brandBlue">From travelers</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.03em] text-brandInk sm:text-4xl">
            What people say after they land
          </h2>
        </div>
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {items.map((item) => (
            <article
              className="rounded-[18px] border border-outline bg-surface p-6 shadow-brandCard"
              key={`${item.displayName}-${item.createdAt}`}
            >
              <p className="text-brandBlue" aria-label={`${item.rating} out of 5 stars`}>
                {"★".repeat(Math.max(0, Math.min(5, Math.round(item.rating))))}
                <span className="text-outline">
                  {"★".repeat(Math.max(0, 5 - Math.round(item.rating)))}
                </span>
              </p>
              <p className="mt-3 text-sm leading-7 text-onSurface">{item.body}</p>
              <p className="mt-4 font-display text-sm font-black text-brandInk">{item.displayName}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
