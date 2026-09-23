import type { SiteReview } from "@/content/reviews";

export type PublicTestimonial = {
  displayName: string;
  rating: number;
  body: string;
  locale: string;
  createdAt: string;
};

export function visibleTestimonials(rows: unknown): PublicTestimonial[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Partial<PublicTestimonial>;
    if (typeof item.displayName !== "string" || item.displayName.trim().length === 0) return [];
    if (typeof item.body !== "string" || item.body.trim().length === 0) return [];
    if (typeof item.rating !== "number") return [];
    return [
      {
        displayName: item.displayName.trim(),
        rating: item.rating,
        body: item.body.trim(),
        locale: typeof item.locale === "string" ? item.locale : "",
        createdAt: typeof item.createdAt === "string" ? item.createdAt : ""
      }
    ];
  });
}

export function testimonialsToSiteReviews(rows: PublicTestimonial[]): SiteReview[] {
  return rows.map((row) => ({
    author: row.displayName,
    datePublished: row.createdAt.slice(0, 10),
    reviewBody: row.body,
    ratingValue: row.rating
  }));
}
