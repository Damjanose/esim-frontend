# 2026-10-02 — Homepage: remove the template look

## Ask
Remove the hero destination chips, then find anything else on the homepage that feels "vibe-coded" and replace it with something plainer and more casual.

## Removed
- Hero: the destination chips (`HeroDestinationChips.tsx` deleted), the "200+ destinations · Instant activation" eyebrow pill, the two-colour H1 and the made-up "Your eSIM · Connected · Italy" preview card.
- The 4-icon perk tiles under the hero, which are now one line of plain text.
- The gradient/ink Benefits bento. It repeated the perks.
- "Plan with confidence / Clear plans. Straightforward setup." 3-card block. It said the same thing a third time.
- Testimonials: the "5.0 · Average from 3 travelers" badge, the quote glyphs, the blur blobs and the gradient avatars.
- Every tracked-caps eyebrow above a heading (Browse destinations, Top eSIM destinations, How it works, From travelers, Plan with confidence, Quick answers…, eSim2you in your pocket, partner program).
- The flame badge on Trending now.
- The "Download the App. / Stay Connected Anywhere." gradient heading and the check pills.
- The gradient "Ready to Stay Connected Anywhere?" closing banner.

## Now
- H1 "Your phone works the minute you land." in one colour. Sub-copy: "Data plans for 200+ countries. Install the eSIM before you go and skip the roaming bill."
- Perk line: prepaid / keep your number / real people on chat.
- Headings are now plain and in sentence case: How it works, What travelers say, Questions people ask (with a + icon), Get the app, and "Send travelers our way, earn on every booking" (flat button).
- Closing row: "Going somewhere soon?" with a primary button to `/destinations`.

## Left alone on purpose
The primary button gradient in `components/buttonClasses.ts` is site-wide and mirrors the mobile button, so changing it is a separate decision.

## Verification
`tsc` clean and vitest 755/755. The old chip tests were deleted and the homepage tests rewritten to guard against eyebrows, gradient text, the bento and a gradient CTA coming back. Full-page screenshots at 1440 and 390 were checked before and after.
