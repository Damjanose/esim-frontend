export type SiteReviewStats = {
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
};

export type SiteReview = {
  author: string;
  datePublished: string;
  reviewBody: string;
  ratingValue: number;
};

/**
 * PENDING — no verified reviews yet. eSIM2you is collecting real reviews
 * (Trustpilot / App Store / Google Play) outside this repo. Do NOT fill these
 * with estimated or marketing numbers: Google's structured data policy
 * prohibits unverifiable ratings and can suspend rich-result eligibility
 * site-wide. Once real numbers exist, set `siteReviewStats` to the verified
 * aggregate and optionally list a few individual reviews in `siteReviews` —
 * no other file needs to change, `createLandingJsonLd` in `src/lib/seo.ts`
 * picks these up automatically.
 */
export const siteReviewStats: SiteReviewStats | null = null;
export const siteReviews: SiteReview[] = [];
