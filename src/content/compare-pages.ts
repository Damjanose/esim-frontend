import type { SeoPageFaq } from "./seo-pages";

export type CompareRow = {
  factor: string;
  esim2you: string;
  competitor: string;
};

export type ComparePage = {
  slug: string;
  path: string;
  title: string;
  description: string;
  heading: string;
  competitor: string;
  updatedAt: string;
  intro: string;
  rows: CompareRow[];
  notes: string[];
  faqs: SeoPageFaq[];
};

export const compareUpdatedAt = "2026-09-12";

export const comparePages: ComparePage[] = [
  {
    slug: "airalo-vs-esim2you",
    path: "/compare/airalo-vs-esim2you",
    title: "Airalo vs eSIM2you | Travel eSIM Comparison",
    description:
      "Compare Airalo and eSIM2you on plan comparison, destination coverage, checkout, activation, and support. Check live eSIM2you prices on each destination page.",
    heading: "Airalo vs eSIM2you",
    competitor: "Airalo",
    updatedAt: compareUpdatedAt,
    intro:
      "Both Airalo and eSIM2you sell prepaid travel eSIMs. This page compares how each product helps you choose a plan — not a live price scrape. eSIM2you destination pages show current data, validity, and price for that country.",
    rows: [
      {
        factor: "Plan comparison",
        esim2you: "Destination pages list live data, validity, network, and price",
        competitor: "App and site catalog with country packages"
      },
      {
        factor: "Destinations",
        esim2you: "200+ destinations plus regional Europe and Asia-style bundles",
        competitor: "Large global catalog of local and regional eSIMs"
      },
      {
        factor: "Checkout",
        esim2you: "Web checkout plus iOS and Android apps",
        competitor: "Primarily app-led purchase flow"
      },
      {
        factor: "Activation",
        esim2you: "QR or manual install after purchase; keep your usual number on dual-SIM phones",
        competitor: "QR or in-app install depending on device"
      },
      {
        factor: "Support",
        esim2you: "In-app and web support for install, data, top-ups, and refunds",
        competitor: "In-app help center and chat"
      }
    ],
    notes: [
      "We do not claim eSIM2you is cheaper than Airalo. Compare the live eSIM2you table on a destination page with Airalo’s current offer for the same trip.",
      `Comparison last reviewed ${compareUpdatedAt}. Features can change.`
    ],
    faqs: [
      {
        question: "Is eSIM2you cheaper than Airalo?",
        answer:
          "It depends on the destination and current promotions. Compare eSIM2you's live destination price with Airalo's checkout price for the same data and validity before buying."
      },
      {
        question: "Does eSIM2you cover the same destinations as Airalo?",
        answer:
          "eSIM2you covers 200+ destinations plus regional bundles. Check the specific destination page to confirm coverage before comparing plans with Airalo."
      }
    ]
  },
  {
    slug: "nomad-vs-esim2you",
    path: "/compare/nomad-vs-esim2you",
    title: "Nomad vs eSIM2you | Travel eSIM Comparison",
    description:
      "Compare Nomad and eSIM2you for travel eSIM plans, coverage, checkout, and support. Use live eSIM2you destination prices rather than assumed competitor rates.",
    heading: "Nomad vs eSIM2you",
    competitor: "Nomad",
    updatedAt: compareUpdatedAt,
    intro:
      "Nomad and eSIM2you both target travelers who want prepaid data without a local SIM shop. Use this page for product differences; open an eSIM2you destination page for current plan prices.",
    rows: [
      {
        factor: "Plan comparison",
        esim2you: "Public country pages with a live plan table",
        competitor: "Destination storefront with data and validity filters"
      },
      {
        factor: "Destinations",
        esim2you: "200+ destinations and regional bundles",
        competitor: "Broad country and regional eSIM catalog"
      },
      {
        factor: "Checkout",
        esim2you: "Browser checkout and mobile apps",
        competitor: "Web and app purchase"
      },
      {
        factor: "Activation",
        esim2you: "Install before travel on Wi-Fi, then enable data on arrival",
        competitor: "Digital install on compatible phones"
      },
      {
        factor: "Support",
        esim2you: "Support center plus in-product help",
        competitor: "Help center and customer support"
      }
    ],
    notes: [
      "Price, hotspot rules, and refund terms should be confirmed on each provider’s checkout page before you buy.",
      `Comparison last reviewed ${compareUpdatedAt}.`
    ],
    faqs: [
      {
        question: "Is eSIM2you cheaper than Nomad?",
        answer:
          "It depends on the destination and current promotions. Compare eSIM2you's live destination price with Nomad's checkout price for the same data and validity before buying."
      },
      {
        question: "Does eSIM2you cover the same destinations as Nomad?",
        answer:
          "eSIM2you covers 200+ destinations and regional bundles. Check the specific destination page to confirm coverage before comparing plans with Nomad."
      }
    ]
  },
  {
    slug: "saily-vs-esim2you",
    path: "/compare/saily-vs-esim2you",
    title: "Saily vs eSIM2you | Travel eSIM Comparison",
    description:
      "Compare Saily and eSIM2you travel eSIMs on catalog, checkout, activation, and support. Live eSIM2you prices stay on destination pages.",
    heading: "Saily vs eSIM2you",
    competitor: "Saily",
    updatedAt: compareUpdatedAt,
    intro:
      "Saily and eSIM2you both sell digital travel data. This comparison stays factual: it does not invent competitor prices or claim a cheapest-on-the-market result.",
    rows: [
      {
        factor: "Plan comparison",
        esim2you: "Compare data, validity, network, and price per destination",
        competitor: "App catalog organized by country"
      },
      {
        factor: "Destinations",
        esim2you: "200+ destinations",
        competitor: "Multi-country travel eSIM catalog"
      },
      {
        factor: "Checkout",
        esim2you: "Web and app",
        competitor: "App-focused purchase"
      },
      {
        factor: "Activation",
        esim2you: "QR or manual eSIM install",
        competitor: "In-app eSIM install on supported devices"
      },
      {
        factor: "Support",
        esim2you: "Web support center and in-app help",
        competitor: "In-app support"
      }
    ],
    notes: [
      "Hotspot, validity, and refund rules depend on the specific package — read the plan details before paying.",
      `Comparison last reviewed ${compareUpdatedAt}.`
    ],
    faqs: [
      {
        question: "Is eSIM2you cheaper than Saily?",
        answer:
          "It depends on the destination and current promotions. Compare eSIM2you's live destination price with Saily's checkout price for the same data and validity before buying."
      },
      {
        question: "Does eSIM2you cover the same destinations as Saily?",
        answer:
          "eSIM2you covers 200+ destinations. Check the specific destination page to confirm coverage before comparing plans with Saily."
      }
    ]
  },
  {
    slug: "yesim-vs-esim2you",
    path: "/compare/yesim-vs-esim2you",
    title: "Yesim vs eSIM2you | Travel eSIM Comparison",
    description: "Compare Yesim and eSIM2you on travel eSIM plans, coverage, checkout, activation, and support.",
    heading: "Yesim vs eSIM2you",
    competitor: "Yesim",
    updatedAt: compareUpdatedAt,
    intro: "Yesim and eSIM2you both offer digital travel data. This factual comparison focuses on how plans are presented and how travelers prepare for connectivity.",
    rows: [
      { factor: "Plan comparison", esim2you: "Live destination pages show data, validity, network, and price", competitor: "Country and regional catalog with plan details" },
      { factor: "Destinations", esim2you: "200+ destinations and regional bundles", competitor: "International destination catalog" },
      { factor: "Checkout", esim2you: "Web checkout plus mobile apps", competitor: "Web and app purchase flows" },
      { factor: "Activation", esim2you: "QR or manual installation on supported phones", competitor: "Digital eSIM installation on supported devices" },
      { factor: "Support", esim2you: "Web support center and in-app help", competitor: "Help center and customer support" }
    ],
    notes: ["Compare the current package terms before buying; prices and features can change.", `Comparison last reviewed ${compareUpdatedAt}.`],
    faqs: [
      {
        question: "Is eSIM2you cheaper than Yesim?",
        answer:
          "It depends on the destination and current promotions. Compare eSIM2you's live destination price with Yesim's checkout price for the same data and validity before buying."
      },
      {
        question: "Does eSIM2you cover the same destinations as Yesim?",
        answer:
          "eSIM2you covers 200+ destinations and regional bundles. Check the specific destination page to confirm coverage before comparing plans with Yesim."
      }
    ]
  },
  {
    slug: "holafly-vs-esim2you",
    path: "/compare/holafly-vs-esim2you",
    title: "Holafly vs eSIM2you | Travel eSIM Comparison",
    description: "Compare Holafly and eSIM2you on travel data, destinations, activation, hotspot terms, and support.",
    heading: "Holafly vs eSIM2you",
    competitor: "Holafly",
    updatedAt: compareUpdatedAt,
    intro: "Holafly and eSIM2you serve travelers looking for mobile data abroad. Use this page to compare practical product factors, then verify the current plan terms.",
    rows: [
      { factor: "Plan comparison", esim2you: "Destination pages list live data, validity, network, and price", competitor: "Destination catalog with plan and validity details" },
      { factor: "Destinations", esim2you: "200+ destinations plus regional plans", competitor: "Global travel eSIM catalog" },
      { factor: "Hotspot", esim2you: "Depends on the selected package", competitor: "Depends on plan terms" },
      { factor: "Activation", esim2you: "QR or manual install after purchase", competitor: "Digital installation on supported devices" },
      { factor: "Support", esim2you: "Web support center and in-app help", competitor: "Help center and customer support" }
    ],
    notes: ["Do not assume hotspot or unlimited-use terms; read the exact plan details.", `Comparison last reviewed ${compareUpdatedAt}.`],
    faqs: [
      {
        question: "Is eSIM2you cheaper than Holafly?",
        answer:
          "It depends on the destination and current promotions. Compare eSIM2you's live destination price with Holafly's checkout price for the same data and validity before buying."
      },
      {
        question: "Does eSIM2you cover the same destinations as Holafly?",
        answer:
          "eSIM2you covers 200+ destinations plus regional plans. Check the specific destination page to confirm coverage before comparing plans with Holafly."
      }
    ]
  },
  {
    slug: "ubigi-vs-esim2you",
    path: "/compare/ubigi-vs-esim2you",
    title: "Ubigi vs eSIM2you | Travel eSIM Comparison",
    description: "Compare Ubigi and eSIM2you for travel eSIM coverage, plan selection, activation, app use, and support.",
    heading: "Ubigi vs eSIM2you",
    competitor: "Ubigi",
    updatedAt: compareUpdatedAt,
    intro: "Ubigi and eSIM2you provide digital connectivity for travel. Compare catalog, plan information, activation, and support without relying on unsupported cheapest claims.",
    rows: [
      { factor: "Plan comparison", esim2you: "Public pages show live data, validity, network, and price", competitor: "Country and regional plan catalog" },
      { factor: "Checkout", esim2you: "Web checkout and mobile apps", competitor: "Web and app purchase" },
      { factor: "Activation", esim2you: "QR or manual install", competitor: "Digital eSIM installation" },
      { factor: "Hotspot", esim2you: "Package-dependent", competitor: "Package and device-dependent" },
      { factor: "Support", esim2you: "Support center plus in-app help", competitor: "Help center and support channels" }
    ],
    notes: ["Verify current coverage, network, and plan restrictions before checkout.", `Comparison last reviewed ${compareUpdatedAt}.`],
    faqs: [
      {
        question: "Is eSIM2you cheaper than Ubigi?",
        answer:
          "It depends on the destination and current promotions. Compare eSIM2you's live destination price with Ubigi's checkout price for the same data and validity before buying."
      },
      {
        question: "Does eSIM2you cover the same destinations as Ubigi?",
        answer:
          "eSIM2you covers 200+ destinations. Check the specific destination page to confirm coverage before comparing plans with Ubigi."
      }
    ]
  },
  {
    slug: "roamless-vs-esim2you",
    path: "/compare/roamless-vs-esim2you",
    title: "Roamless vs eSIM2you | Travel eSIM Comparison",
    description: "Compare Roamless and eSIM2you on destination coverage, travel data plans, activation, checkout, and support.",
    heading: "Roamless vs eSIM2you",
    competitor: "Roamless",
    updatedAt: compareUpdatedAt,
    intro: "Roamless and eSIM2you are alternatives to traditional roaming for travelers. This comparison covers practical differences and points to live eSIM2you destination plans.",
    rows: [
      { factor: "Coverage", esim2you: "200+ destinations and regional bundles", competitor: "International coverage catalog" },
      { factor: "Plan comparison", esim2you: "Live country pages show data, validity, network, and price", competitor: "App-led plan and coverage information" },
      { factor: "Checkout", esim2you: "Web checkout plus iOS and Android apps", competitor: "App and web purchase options" },
      { factor: "Activation", esim2you: "Install before travel with QR or manual steps", competitor: "Digital activation on supported devices" },
      { factor: "Support", esim2you: "Web support center and in-app help", competitor: "In-app help and support" }
    ],
    notes: ["Features, prices, and coverage change; verify both providers for the same route.", `Comparison last reviewed ${compareUpdatedAt}.`],
    faqs: [
      {
        question: "Is eSIM2you cheaper than Roamless?",
        answer:
          "It depends on the destination and current promotions. Compare eSIM2you's live destination price with Roamless's checkout price for the same data and validity before buying."
      },
      {
        question: "Does eSIM2you cover the same destinations as Roamless?",
        answer:
          "eSIM2you covers 200+ destinations and regional bundles. Check the specific destination page to confirm coverage before comparing plans with Roamless."
      }
    ]
  },
  {
    slug: "sim-local-vs-esim2you",
    path: "/compare/sim-local-vs-esim2you",
    title: "Sim Local vs eSIM2you | Travel eSIM Comparison",
    description: "Compare Sim Local and eSIM2you on travel eSIM plans, destination coverage, checkout, activation, and support.",
    heading: "Sim Local vs eSIM2you",
    competitor: "Sim Local",
    updatedAt: compareUpdatedAt,
    intro: "Sim Local and eSIM2you both sell travel data for international trips. This comparison covers practical product differences — check the live eSIM2you destination page for current pricing.",
    rows: [
      { factor: "Plan comparison", esim2you: "Destination pages list live data, validity, network, and price", competitor: "Country and regional plan catalog" },
      { factor: "Stores", esim2you: "Fully digital — no airport kiosk needed", competitor: "Airport stores (e.g. Heathrow, Gatwick) plus online" },
      { factor: "Checkout", esim2you: "Web checkout plus iOS and Android apps", competitor: "Online and in-store purchase" },
      { factor: "Activation", esim2you: "QR or manual install after purchase", competitor: "QR or in-store setup depending on purchase channel" },
      { factor: "Support", esim2you: "Web support center and in-app help", competitor: "In-store and online customer support" }
    ],
    notes: ["We do not claim eSIM2you is cheaper than Sim Local. Compare the live eSIM2you table on a destination page with Sim Local’s current offer for the same trip.", `Comparison last reviewed ${compareUpdatedAt}.`],
    faqs: [
      {
        question: "Is eSIM2you cheaper than Sim Local?",
        answer:
          "It depends on the destination and current promotions. Compare eSIM2you's live destination price with Sim Local's checkout price for the same data and validity before buying."
      },
      {
        question: "Do I need to visit a store to get an eSIM2you plan, like with Sim Local?",
        answer:
          "No — eSIM2you is fully digital with no airport kiosk needed. Sim Local also sells online, but is known for physical stores at airports such as Heathrow and Gatwick."
      }
    ]
  }
];

export const comparePageBySlug = Object.fromEntries(
  comparePages.map((page) => [page.slug, page])
) as Record<string, ComparePage>;
