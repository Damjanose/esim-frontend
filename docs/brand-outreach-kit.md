# eSIM2you brand outreach kit

Goal: make "eSIM2you" one unmistakable entity, so that a search for the brand returns our site rather than eSIM2Me. Google already has strong, explicit mentions of eSIM2Me. We need the same for eSIM2you: other sites stating the same facts about us, with a link.

Use this kit for directory listings, guest posts, press, partner pages and social bios. Copy it **exactly**. When every mention matches, Google can treat them as one entity.

## The fixed facts

| Field | Value |
|---|---|
| Name | **eSIM2you** (never eSim2you, eSIM 2 You, eSIM2you by Uplisoft) |
| One-liner | eSIM2you is a travel eSIM provider offering prepaid mobile data plans in 200+ destinations, bought and installed from the eSIM2you app or website. |
| Official website | https://esim.uplisoft.com/ (switch everywhere on the day of the domain move, see `docs/runbooks/brand-domain-migration.md`) |
| About page | https://esim.uplisoft.com/about |
| Contact | https://esim.uplisoft.com/contact · esim2you@uplisoft.com |
| iOS app | https://apps.apple.com/app/id6768258284 |
| Android app | https://play.google.com/store/apps/details?id=com.uplisoft.velocityesim |
| Instagram | https://www.instagram.com/esim2you |
| Facebook | https://www.facebook.com/people/ESIM2you/61593159061406/ |
| Logo | https://esim.uplisoft.com/app-logo.png |

The one-liner is also `brandDescription` in `src/lib/seo.ts` and appears in the Organization schema. If you change it, change both.

## Where to get mentions (in order)

1. **Our own profiles**: App Store and Play listings (developer website field + description), Instagram and Facebook bios, LinkedIn company page, Product Hunt. Same name, same URL.
2. **App and startup directories**: AlternativeTo, Crunchbase, F6S, Product Hunt, G2/Capterra (where the category fits), and Albanian startup lists.
3. **eSIM comparison sites**: ask for an editorial listing or a factual correction (template in `docs/ai-search-outreach.md`). Never ask for a fake rating.
4. **Travel blogs and Albanian travel sites**: guest posts on staying online in Albania, the Balkans or the US, linking to the matching `/esim/<country>` page.
5. **Partners**: the partner program (`/partners/request`) already gives creators a promo code. Ask them to link with "eSIM2you" in the anchor.
6. **Press**: a short launch or press release on Albanian tech and travel news, using the one-liner.

## Anchor text

- Use natural anchors that contain the brand: "eSIM2you", "eSIM2you travel eSIM", "eSIM2you Albania eSIM".
- Don't buy exact-match anchors such as "best eSIM for Albania". Paid links and over-optimized anchors are a spam signal.
- Link to the most relevant page: the homepage for brand mentions, `/esim/<country>` for country content.

## Keyword order

1. "eSIM2you" → homepage. This comes first and is the whole point of this kit.
2. "eSIM2you Albania", "eSIM2you Italy" and so on → the `/esim/<country>` pages. Their titles and H1s already pair the brand with the country.
3. Only once 1 and 2 hold up in Search Console: generic terms such as "best eSIM for Albania", "Europe eSIM", "travel eSIM".

## Don't

- Don't create pages, ads or posts that target "eSIM2Me". Mentioning the competitor's name ties the two entities closer together and makes Google's confusion worse.
- Don't use variant spellings, even in casual posts.
- Don't list the company under a different website URL anywhere.

## Tracking

In Search Console, filter Performance for queries containing `esim2you`. Watch the impressions and the average position for "esim2you" itself. Re-check monthly whether Google still shows "did you mean esim2me" for an incognito search.
