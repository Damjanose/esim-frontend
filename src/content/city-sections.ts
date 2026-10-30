import type { SeoPageFaq } from "./seo-pages";

/**
 * City blocks on /esim/spain, /esim/italy and /esim/mexico (SEO content pack,
 * Oct 2026), targeting "esim barcelona", "esim rome", "esim milan", "esim
 * madrid" and "esim cancun". Each renders as an H2 with an id anchor
 * (/esim/spain#barcelona) and its FAQs join the page's FAQPage JSON-LD.
 *
 * {fromPrice} is filled from the live lowest price; without a live offer the
 * sentence drops the price clause (see fillCityTokens), so copy never goes stale.
 */
export type CitySection = {
  id: string;
  title: string;
  body: string[];
  tips: string[];
  faqs: SeoPageFaq[];
};

export const citySections: Record<string, CitySection[]> = {
  spain: [
    {
      id: "barcelona",
      title: "eSIM for Barcelona",
      body: [
        "A Barcelona eSIM gets you online the moment you land at El Prat (BCN), so you can check the Aerobús or train to the city, open your hotel booking and message your host without hunting for airport Wi-Fi. eSIM2you Spain plans start at {fromPrice} and work across the whole city on 4G/5G.",
        "Most Barcelona sights now use timed digital tickets: Sagrada Família, Park Güell and Casa Batlló all expect you to show a QR code on your phone at the entrance. Reliable mobile data means you can rebook a slot or pull up a ticket on the spot instead of relying on café Wi-Fi.",
        "The same eSIM keeps working on day trips to Montserrat, Sitges, Girona and the Costa Brava, and anywhere else in Spain."
      ],
      tips: [
        "For a 3–5 day city break, a 3–5 GB plan covers maps, tickets and messaging for most travelers.",
        "Install the eSIM on Wi-Fi before your flight and switch the data line on after landing.",
        "Keep your phone secure in busy areas such as La Rambla and the metro, and save tickets offline as a backup."
      ],
      faqs: [
        {
          question: "Does the eSIM2you Spain eSIM work in Barcelona?",
          answer:
            "Yes. The Spain eSIM covers Barcelona and the rest of Spain on 4G/5G, including the airport, metro area and day trips like Montserrat and Sitges."
        },
        {
          question: "How much data do I need for a weekend in Barcelona?",
          answer:
            "For maps, digital tickets, rideshare and messaging, 2–3 GB is usually enough for a weekend. Choose 5 GB or an unlimited plan if you share a hotspot or upload a lot of video."
        }
      ]
    },
    {
      id: "madrid",
      title: "eSIM for Madrid",
      body: [
        "Land at Madrid-Barajas (MAD) with data already working and you can check Metro or Cercanías connections, book a ride and navigate to your hotel straight away. eSIM2you Spain plans start at {fromPrice}.",
        "Madrid is also the hub for high-speed rail, so the same eSIM keeps you connected for day trips to Toledo, Segovia or a train onward to Barcelona, Seville or Valencia."
      ],
      tips: [
        "Museum tickets for the Prado and Reina Sofía can be booked and shown on your phone.",
        "For business trips with laptop work, check hotspot support or choose a larger plan."
      ],
      faqs: [
        {
          question: "Can I use one eSIM for Madrid and Barcelona?",
          answer:
            "Yes. A Spain eSIM works nationwide, so one plan covers Madrid, Barcelona and the train journey between them."
        }
      ]
    }
  ],

  italy: [
    {
      id: "rome",
      title: "eSIM for Rome",
      body: [
        "With a Rome eSIM you are connected from Fiumicino (FCO) or Ciampino onward, which helps with checking the Leonardo Express to Termini, booking a taxi app or finding your accommodation in the historic centre. eSIM2you Italy plans start at {fromPrice} on 4G/5G.",
        "The Colosseum, Roman Forum and Vatican Museums all use timed tickets you show on your phone, and entry slots sell out. Mobile data lets you book, change or display tickets anywhere in the city rather than relying on hotel Wi-Fi.",
        "Signal can drop in underground stations and inside thick-walled churches and museums, so download offline maps and save tickets to your phone before you go in."
      ],
      tips: [
        "For 3–5 days in Rome, 3–5 GB covers maps, tickets and messaging for most visitors.",
        "The same Italy eSIM works on day trips to Florence, Naples or Pompeii by train.",
        "Planning several countries? A Europe eSIM covers Italy plus neighbouring countries with one plan."
      ],
      faqs: [
        {
          question: "Does the eSIM2you Italy eSIM work in Rome and Vatican City?",
          answer:
            "Yes. The Italy eSIM works throughout Rome, including the area around Vatican City, on Italian 4G/5G networks."
        },
        {
          question: "Should I buy my Rome eSIM before I travel?",
          answer:
            "Yes. Install it on Wi-Fi before your flight, then turn on the data line when you land at Fiumicino or Ciampino so you are online straight away."
        }
      ]
    },
    {
      id: "milan",
      title: "eSIM for Milan",
      body: [
        "Arriving at Malpensa (MXP), Linate (LIN) or Bergamo, a Milan eSIM lets you check the Malpensa Express, the M4 metro from Linate or airport buses as soon as you land. eSIM2you Italy plans start at {fromPrice}.",
        "Milan is a base for business trips and trade fairs, so data for email, video calls and hotspot use matters. During busy events such as Design Week and Fashion Week, having your own data line is more reliable than crowded venue Wi-Fi.",
        "Tickets for the Duomo rooftops and The Last Supper are booked in advance and shown on your phone, and the same eSIM keeps working on train trips to Lake Como, Verona or Venice."
      ],
      tips: [
        "For work trips with laptop tethering, choose a larger or unlimited plan and confirm hotspot support with support before buying.",
        "One Italy eSIM covers Milan and every other Italian city on your route."
      ],
      faqs: [
        {
          question: "Is there an eSIM for Milan business travel?",
          answer:
            "Yes. The eSIM2you Italy eSIM covers Milan and the rest of Italy. For laptop work, choose a higher-data or unlimited plan and check hotspot support first."
        }
      ]
    }
  ],

  mexico: [
    {
      id: "cancun",
      title: "eSIM for Cancun and the Riviera Maya",
      body: [
        "A Cancun eSIM gets you online as soon as you land at Cancun International Airport (CUN), so you can find your transfer, message your hotel and avoid expensive roaming or airport SIM kiosks. eSIM2you Mexico plans start at {fromPrice}.",
        "The same Mexico eSIM covers the Hotel Zone, downtown Cancun and the Riviera Maya (Playa del Carmen, Tulum and the ferry to Isla Mujeres or Cozumel), so one plan works for the whole trip.",
        "Coverage is strong in towns and along the main highway, but can be weak inside cenotes, in the jungle and at remote ruins such as Chichén Itzá or Cobá. Download offline maps and tickets before day trips."
      ],
      tips: [
        "For a 7-day all-inclusive stay, 3–5 GB is usually enough; pick 10 GB+ if you will upload photos and video daily.",
        "Resort Wi-Fi often slows down at peak times. Your own data line keeps maps, banking and messaging working.",
        "Planning Mexico City too? The same Mexico eSIM covers CDMX and the rest of the country."
      ],
      faqs: [
        {
          question: "Does the eSIM2you Mexico eSIM work in Cancun and Tulum?",
          answer:
            "Yes. The Mexico eSIM covers Cancun, the Hotel Zone, Playa del Carmen, Tulum and the rest of Mexico on local networks."
        },
        {
          question: "Do I need an eSIM if my Cancun resort has Wi-Fi?",
          answer:
            "Resort Wi-Fi only works on the property and can be slow at peak times. An eSIM keeps you connected on transfers, day trips, beaches and in town."
        }
      ]
    }
  ]
};

/**
 * City-led titles (kept under ~65 chars). The "| from {fromPrice}" segment is
 * dropped when there is no live offer.
 */
export const cityTitleOverrides: Record<string, string> = {
  spain: "Spain eSIM for Barcelona & Madrid | from {fromPrice} | eSIM2you",
  italy: "Italy eSIM for Rome & Milan | from {fromPrice} | eSIM2you",
  mexico: "Mexico eSIM for Cancun & Tulum | from {fromPrice} | eSIM2you"
};

/**
 * Fills {fromPrice}. Without a live price the token's clause is removed:
 * " start at {fromPrice}" -> "" and "| from {fromPrice} " -> "", so no
 * sentence or title ever shows a placeholder.
 */
export function fillCityTokens(text: string, fromPrice: number | null | undefined): string {
  if (typeof fromPrice === "number" && Number.isFinite(fromPrice)) {
    return text.replaceAll("{fromPrice}", `€${fromPrice.toFixed(2)}`);
  }
  return text
    .replaceAll(" | from {fromPrice}", "")
    .replaceAll(" start at {fromPrice} and", "")
    .replaceAll(" start at {fromPrice}", " are available")
    .replaceAll("{fromPrice}", "");
}

export function citySectionsFor(slug: string, fromPrice: number | null | undefined): CitySection[] {
  return (citySections[slug] ?? []).map((section) => ({
    ...section,
    body: section.body.map((paragraph) => fillCityTokens(paragraph, fromPrice))
  }));
}
