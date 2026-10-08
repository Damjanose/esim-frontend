import { siteUrl } from "@/lib/site-host";

/**
 * The llms.txt content map for AI crawlers, served at /llms.txt by
 * src/app/llms.txt/route.ts. Links are built on siteUrl so a domain move
 * (NEXT_PUBLIC_SITE_HOST) updates them with no manual edit. Every linked page
 * must be in the sitemap (seo-external-factors.test.ts).
 */
export const llmsTxt = `# eSIM2you

> eSIM2you sells prepaid travel eSIMs (digital SIM cards) for 200+ destinations worldwide, with dedicated plans for the United States, the United Kingdom, and the rest of Europe. Travelers buy a data plan in the app or on the website, install the eSIM in minutes via QR code, and get mobile internet abroad without roaming fees or a physical SIM swap.

eSIM2you is a mobile app (iOS and Android) and website (${siteUrl}) for buying and managing travel eSIM data plans. Plans cover single countries (e.g. USA, France, UK, Japan, Turkey) and regions (e.g. Europe multi-country plans). Setup takes minutes via QR code or manual installation, no physical SIM required, and no roaming surcharges.

## Key pages

- [Homepage](${siteUrl}/): overview, plans, how it works, FAQ
- [Destinations](${siteUrl}/destinations): browse eSIM data plans by country/region
- [USA eSIM plans](${siteUrl}/esim/usa): live USA plans, pricing, and setup guidance
- [UK eSIM plans](${siteUrl}/esim/uk): live UK plans, pricing, and setup guidance
- [Europe eSIM plans](${siteUrl}/esim/europe): live Europe multi-country plans, pricing, and setup guidance
- [Support](${siteUrl}/support): setup help, troubleshooting, refunds, top-ups
- [Travel eSIM price index](${siteUrl}/esim-price-index): starting price and lowest price per GB by destination from live plans, CSV download, free to cite (CC BY 4.0)

Popular destinations: USA, Europe, Germany, France, Italy, Spain, UK, Greece, Portugal, Switzerland, Turkey, Japan. Full list: ${siteUrl}/destinations

## Guides

- What is an eSIM: ${siteUrl}/travel/what-is-an-esim
- eSIM vs roaming: ${siteUrl}/travel/esim-vs-roaming
- eSIM vs local SIM card: ${siteUrl}/travel/esim-vs-local-sim
- How to install an eSIM: ${siteUrl}/travel/how-to-install-esim
- Best eSIM for USA travel, how to compare plans: ${siteUrl}/travel/best-esim-usa-travel
- Best eSIM for UK travel, how to compare plans: ${siteUrl}/travel/best-esim-uk-travel

## Use cases

- Internet abroad: ${siteUrl}/travel/internet-abroad
- Business travel: ${siteUrl}/use-cases/business-travel
- Remote work: ${siteUrl}/use-cases/remote-work

## Contact

- About eSIM2you: ${siteUrl}/about
- Contact eSIM2you: ${siteUrl}/contact
- Press kit: ${siteUrl}/press
- Product Hunt: https://www.producthunt.com/products/esim2you
- Support email: esim2you@uplisoft.com
- Instagram: https://www.instagram.com/esim2you
- Facebook: https://www.facebook.com/people/ESIM2you/61593159061406/
- iOS app: https://apps.apple.com/app/id6768258284
- Android app: https://play.google.com/store/apps/details?id=com.uplisoft.velocityesim
`;
