import type { SeoPageFaq } from "./seo-pages";

/**
 * /compare hub copy (SEO content pack, Oct 2026). Targets "compare esim plans",
 * "esim comparison", "travel esim comparison". Prices are never written here:
 * the price-per-GB table is computed from live plans on each request window.
 * No competitor prices, consistent with /compare/[slug]. Title and meta
 * description live in indexableRoutes (src/lib/seo.ts).
 */
export const compareHub = {
  h1: "Compare travel eSIM plans",
  intro:
    "The cheapest-looking eSIM is not always the best value. To compare travel eSIM plans fairly, look at price per GB, how long the plan is valid, whether \"unlimited\" is slowed after a daily limit, and whether you can top up or share data. The table below shows live eSIM2you prices per GB for popular destinations, followed by a checklist you can use with any provider.",

  pricePerGb: {
    h2: "Price per GB on popular destinations",
    lead:
      "Live eSIM2you prices, converted to cost per GB so plans of different sizes can be compared directly. Updated automatically from our plan catalog.",
    // Highest-impression destinations in Search Console.
    destinations: ["spain", "italy", "france", "germany", "uk", "usa", "mexico", "japan", "thailand", "europe", "asia"],
    footnote:
      "Price per GB uses fixed-data plans only. Unlimited plans are shown separately because speed limits after daily fair-use thresholds vary by network."
  },

  howToCompare: {
    h2: "How to compare eSIM plans: 6 things that matter",
    items: [
      {
        title: "1. Price per GB, not headline price",
        body: "Divide the price by the data allowance. A larger plan often costs much less per GB, so if you will use maps, rideshare and social apps daily, the bigger plan can be cheaper overall."
      },
      {
        title: "2. Validity vs trip length",
        body: "Validity usually starts when the eSIM connects to a network at your destination. Pick a plan that covers your full stay, including travel days, rather than buying two short plans."
      },
      {
        title: "3. Unlimited: check the fair-use limit",
        body: "Many \"unlimited\" travel eSIMs slow down after a daily high-speed allowance. Unlimited is great for heavy streaming or hotspot use; a fixed 10–20 GB plan is often better value for typical sightseeing."
      },
      {
        title: "4. Coverage, network and 5G",
        body: "Check which network the eSIM connects to and whether 4G or 5G is supported. For multi-country trips, a regional plan (Europe or Asia) avoids buying a separate eSIM for each border."
      },
      {
        title: "5. Hotspot, top-ups and your phone number",
        body: "If you work from a laptop, confirm hotspot support before buying. Check whether you can top up the same eSIM instead of installing a new one. On dual-SIM phones you keep your usual number for calls, WhatsApp and iMessage."
      },
      {
        title: "6. Checkout, install and refunds",
        body: "Look at how you buy (web or app only), how you install (QR code or in-app), and what happens if the eSIM does not connect. Clear refund terms matter more than a small price difference."
      }
    ]
  },

  providers: {
    h2: "eSIM2you vs other travel eSIM providers",
    lead:
      "Feature comparisons with popular providers. We do not publish competitor prices because they change often. Compare the live price for your destination with each provider before you buy."
  },

  faqs: [
    {
      question: "How do I compare eSIM plans?",
      answer:
        "Compare price per GB, validity, whether unlimited data has a fair-use limit, network coverage, hotspot support and top-ups. Then check checkout, install method and refund terms."
    },
    {
      question: "Is an unlimited travel eSIM better than a fixed-data plan?",
      answer:
        "Only if you use a lot of data. Unlimited plans often slow down after a daily high-speed limit. For maps, messaging and social media, a 10–20 GB plan is usually enough and cheaper."
    },
    {
      question: "Is a travel eSIM cheaper than roaming?",
      answer:
        "Usually, outside your home zone. Roaming is charged by your home carrier per day or per MB, while a prepaid eSIM has a fixed price. See our eSIM vs roaming guide for examples."
    },
    {
      question: "Can I compare eSIM plans for several countries at once?",
      answer:
        "Yes. Regional plans such as Europe or Asia cover multiple countries with one eSIM. Compare a regional plan with single-country plans if you are crossing borders."
    }
  ] satisfies SeoPageFaq[],

  internalLinks: [
    { href: "/esim-price-index", label: "eSIM price index" },
    { href: "/travel/esim-vs-roaming", label: "eSIM vs roaming" },
    { href: "/travel/how-much-data-when-traveling", label: "How much data do I need?" },
    { href: "/travel/esim-compatible-phones", label: "Which phones support eSIM?" },
    { href: "/destinations", label: "All destinations" }
  ]
};
