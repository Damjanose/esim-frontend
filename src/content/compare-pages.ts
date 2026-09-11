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
};

export const compareUpdatedAt = "2026-09-10";

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
    ]
  }
];

export const comparePageBySlug = Object.fromEntries(
  comparePages.map((page) => [page.slug, page])
) as Record<string, ComparePage>;
