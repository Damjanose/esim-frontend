import { landingContent } from "./landing";

export type SeoPageSection = {
  title: string;
  body: string;
};

export type SeoPageFaq = {
  question: string;
  answer: string;
};

export type SeoPageLink = {
  label: string;
  href: string;
};

export type SeoPageKind = "destination" | "guide" | "use-case";

export type SeoContentPage = {
  kind: SeoPageKind;
  slug: string;
  path: string;
  title: string;
  description: string;
  heading: string;
  eyebrow: string;
  intro: string;
  sections: SeoPageSection[];
  faqs: SeoPageFaq[];
  relatedLinks: SeoPageLink[];
};

export const destinationPages = [
  {
    kind: "destination",
    slug: "usa",
    path: "/destinations/usa",
    title: "eSIM for USA | Travel Data for the United States",
    description:
      "Buy a eSim2you for the USA, install your travel data before departure, and stay online without surprise roaming fees.",
    eyebrow: "USA travel eSIM",
    heading: "Travel data for the United States, ready before you land.",
    intro:
      "eSim2you helps travelers visiting the United States set up mobile internet before arrival. Choose a prepaid eSIM data plan, install it on a compatible phone, and use local mobile data while keeping your usual number available for calls, texts, and WhatsApp. Keep travel data ready to use when you land.",
    sections: [
      {
        title: "Why use a USA eSIM?",
        body:
          "A USA travel eSIM is useful for airport arrivals, city navigation, rideshare apps, hotel check-ins, and staying reachable during a trip without relying only on public Wi-Fi."
      },
      {
        title: "Best for common US trips",
        body:
          "Use it for vacations, conferences, road trips, study travel, and business visits where predictable international data is easier than roaming on your home carrier."
      }
    ],
    faqs: [
      {
        question: "Can I install a USA eSIM before flying?",
        answer:
          "Yes. You can install the eSIM before your trip, then turn on the data line when you arrive in the United States."
      },
      {
        question: "Will a USA eSIM change my phone number?",
        answer:
          "No. A travel eSIM provides mobile data. Your regular SIM can stay active for your normal number if your phone supports dual SIM."
      }
    ],
    relatedLinks: [
      { label: "Browse every eSIM destination", href: "/destinations" },
      { label: "Learn how eSIMs work", href: "/guides/what-is-an-esim" },
      { label: "Business travel data guide", href: "/use-cases/business-travel" }
    ]
  },
  {
    kind: "destination",
    slug: "europe",
    path: "/destinations/europe",
    title: "eSIM for Europe | International Data Without Roaming",
    description:
      "Use eSim2you for Europe travel data, mobile internet abroad, and a simpler roaming alternative across European trips.",
    eyebrow: "Europe travel eSIM",
    heading: "Stay connected across Europe with prepaid eSIM data.",
    intro:
      "eSim2you gives travelers a simple way to prepare mobile internet for European trips. It is designed for people who want travel data for maps, messaging, booking apps, and work tools without depending on roaming or hunting for a SIM shop after arrival. Stay connected across borders with prepaid data planned before departure.",
    sections: [
      {
        title: "A practical roaming alternative",
        body:
          "A Europe eSIM can reduce the stress of crossing borders because the data plan lives digitally on your phone and can be managed from the app."
      },
      {
        title: "Useful for multi-country travel",
        body:
          "For holidays, conferences, remote work, and rail trips, setting up eSIM data before departure keeps the connection plan clear before the itinerary gets busy."
      }
    ],
    faqs: [
      {
        question: "Is an eSIM useful for Europe travel?",
        answer:
          "Yes. It can be a convenient way to get mobile data abroad without buying a physical SIM card after arrival."
      },
      {
        question: "Should I install the eSIM before my trip?",
        answer:
          "Install before departure when you have stable Wi-Fi, then activate mobile data when you reach your destination."
      }
    ],
    relatedLinks: [
      { label: "France travel eSIM plans", href: "/destinations/france" },
      { label: "UK travel eSIM plans", href: "/destinations/uk" },
      { label: "Compare eSIM with roaming", href: "/guides/esim-vs-roaming" }
    ]
  },
  {
    kind: "destination",
    slug: "japan",
    path: "/destinations/japan",
    title: "eSIM for Japan | Travel Data Before Arrival",
    description:
      "Prepare a Japan travel eSIM with eSim2you and use mobile data for maps, messaging, translation, and transport apps.",
    eyebrow: "Japan travel eSIM",
    heading: "Mobile internet for Japan, installed before your plane lands.",
    intro:
      "A Japan eSIM helps travelers stay online for transit, translation, maps, hotel details, messaging, and everyday trip planning. eSim2you makes mobile internet setup digital so data is installed before the plane lands and before the first train, taxi, or airport transfer.",
    sections: [
      {
        title: "Built for arrival moments",
        body:
          "Use travel data for QR tickets, maps, messaging, and translation apps as soon as you are ready to turn on the eSIM line."
      },
      {
        title: "Simple digital setup",
        body:
          "Skip the physical SIM counter and install the eSIM profile on a compatible device while you still have reliable Wi-Fi."
      }
    ],
    faqs: [
      {
        question: "Can I use WhatsApp with a Japan eSIM?",
        answer:
          "Yes. Your WhatsApp account can continue using your usual number while the travel eSIM supplies mobile data."
      },
      {
        question: "Do I need an eSIM-compatible phone?",
        answer:
          "Yes. Check your device settings and carrier restrictions before buying any travel eSIM."
      }
    ],
    relatedLinks: [
      { label: "Browse every eSIM destination", href: "/destinations" },
      { label: "Travel eSIM setup steps", href: "/guides/how-to-install-esim" },
      { label: "Mobile internet abroad guide", href: "/guides/internet-abroad" }
    ]
  },
  {
    kind: "destination",
    slug: "turkey",
    path: "/destinations/turkey",
    title: "eSIM for Turkey | Travel Internet for Visitors",
    description:
      "Get a eSim2you for Turkey travel data and use mobile internet abroad for maps, messaging, bookings, and work trips.",
    eyebrow: "Turkey travel eSIM",
    heading: "Travel internet for Turkey without a physical SIM stop.",
    intro:
      "eSim2you helps visitors to Turkey prepare mobile internet data before arrival. It is a practical option for city breaks, family trips, business travel, and longer stays where reliable app access matters from the first day. The setup avoids a physical SIM stop after landing.",
    sections: [
      {
        title: "Useful in Istanbul and beyond",
        body:
          "Travel data can support ride apps, maps, translation, hotel coordination, restaurant bookings, and secure messaging while moving through busy travel days."
      },
      {
        title: "Keep your setup lightweight",
        body:
          "An eSIM keeps your data plan digital, so compatible phones can stay connected without swapping physical SIM cards."
      }
    ],
    faqs: [
      {
        question: "Can I keep my normal SIM in the phone?",
        answer:
          "On dual-SIM compatible phones, yes. You can keep your usual SIM available while using the eSIM for data."
      },
      {
        question: "Is Turkey eSIM data good for business travel?",
        answer:
          "It can be helpful for email, maps, messaging, and travel coordination when you need mobile data away from hotel or office Wi-Fi."
      }
    ],
    relatedLinks: [
      { label: "Business travel data guide", href: "/use-cases/business-travel" },
      { label: "Remote work data guide", href: "/use-cases/remote-work" },
      { label: "Learn how eSIMs work", href: "/guides/what-is-an-esim" }
    ]
  },
  {
    kind: "destination",
    slug: "france",
    path: "/destinations/france",
    title: "eSIM for France | Travel Data for Paris and Beyond",
    description:
      "Use eSim2you for France travel data, mobile internet in Paris, and a cleaner alternative to international roaming.",
    eyebrow: "France travel eSIM",
    heading: "France travel data for maps, messages, bookings, and work.",
    intro:
      "A France eSIM helps travelers prepare mobile internet before a trip to Paris or other French destinations. Use eSim2you to plan ahead, avoid a physical SIM errand, and keep messages, bookings, maps, and work apps ready.",
    sections: [
      {
        title: "Helpful for city travel",
        body:
          "Mobile data supports metro routes, museum tickets, reservations, maps, rides, and messaging while moving through a busy itinerary."
      },
      {
        title: "Prepared before arrival",
        body:
          "Install the eSIM profile while you have Wi-Fi, then use the travel data line when you arrive and need mobile internet."
      }
    ],
    faqs: [
      {
        question: "Can I use a France eSIM for Paris?",
        answer:
          "Yes. A France travel eSIM is designed for mobile data during trips to Paris and other supported destinations in France."
      },
      {
        question: "Does a France eSIM include calls?",
        answer:
          "eSim2you focuses on travel data. Use your regular number or internet apps for calls when available."
      }
    ],
    relatedLinks: [
      { label: "Europe travel eSIM plans", href: "/destinations/europe" },
      { label: "UK travel eSIM plans", href: "/destinations/uk" },
      { label: "Mobile internet abroad guide", href: "/guides/internet-abroad" }
    ]
  },
  {
    kind: "destination",
    slug: "uk",
    path: "/destinations/uk",
    title: "eSIM for UK | Travel Data for the United Kingdom",
    description:
      "Prepare a UK travel eSIM with eSim2you and use mobile data for London trips, business travel, maps, and messaging.",
    eyebrow: "UK travel eSIM",
    heading: "UK mobile data for travelers before the first connection.",
    intro:
      "eSim2you helps travelers visiting the United Kingdom set up travel data on a compatible phone. It is useful for London city breaks, business meetings, events, student visits, and international trips where roaming fees are hard to predict. Prepare the first connection before arrival.",
    sections: [
      {
        title: "A cleaner way to get online",
        body:
          "Install digitally before arrival and use mobile data for maps, transport, email, bookings, and secure messaging."
      },
      {
        title: "Designed for everyday travel needs",
        body:
          "A UK eSIM can keep essential apps reachable without changing your usual phone number or relying only on public Wi-Fi."
      }
    ],
    faqs: [
      {
        question: "Is a UK eSIM useful for London travel?",
        answer:
          "Yes. Travel data is helpful for transport apps, maps, messaging, bookings, and finding services while moving around London."
      },
      {
        question: "Can I install the eSIM outside the UK?",
        answer:
          "Yes. Install before traveling when you have Wi-Fi, then use the data line after arrival."
      }
    ],
    relatedLinks: [
      { label: "Europe travel eSIM plans", href: "/destinations/europe" },
      { label: "Business travel data guide", href: "/use-cases/business-travel" },
      { label: "Compare eSIM with roaming", href: "/guides/esim-vs-roaming" }
    ]
  }
] satisfies SeoContentPage[];

export const guidePages = [
  {
    kind: "guide",
    slug: "what-is-an-esim",
    path: "/guides/what-is-an-esim",
    title: "What Is an eSIM? | Travel eSIM Guide",
    description:
      "A simple guide to what an eSIM is, how travel eSIM data works, and when to install one before an international trip.",
    eyebrow: "eSIM guide",
    heading: "What is an eSIM?",
    intro:
      "This guide explains what an eSIM is: a digital SIM profile that can be installed on supported phones. For travelers, it can provide mobile data abroad without buying or swapping a physical SIM card, making it easier to prepare internet access before a trip.",
    sections: [
      {
        title: "How travel eSIM data works",
        body:
          "After purchase, the eSIM profile is installed on your compatible device. You can keep your usual SIM for your regular number and use the travel eSIM as the mobile data line."
      },
      {
        title: "Why travelers use eSIMs",
        body:
          "Travel eSIMs are useful for maps, messaging, bookings, airport transfers, translation, and work apps when roaming is expensive or unclear."
      }
    ],
    faqs: [
      {
        question: "Does an eSIM replace my phone number?",
        answer:
          "No. A travel eSIM can provide mobile data while your usual SIM remains available for calls, texts, and WhatsApp."
      },
      {
        question: "Do all phones support eSIM?",
        answer:
          "No. Many recent iPhone, Samsung Galaxy, Google Pixel, and flagship devices support eSIM, but you should check your device before buying."
      }
    ],
    relatedLinks: [
      { label: "Travel eSIM setup steps", href: "/guides/how-to-install-esim" },
      { label: "Compare eSIM with roaming", href: "/guides/esim-vs-roaming" },
      { label: "Browse every eSIM destination", href: "/destinations" }
    ]
  },
  {
    kind: "guide",
    slug: "esim-vs-roaming",
    path: "/guides/esim-vs-roaming",
    title: "eSIM vs Roaming | Travel Data Alternative",
    description:
      "Compare travel eSIM data with international roaming and learn why prepaid eSIM plans can make mobile internet abroad clearer.",
    eyebrow: "Roaming alternative",
    heading: "eSIM vs roaming: a simpler way to plan travel data.",
    intro:
      "International roaming can be convenient, but pricing and limits are not always easy to understand before a trip. A prepaid travel eSIM gives many travelers a simpler way to choose a clearer data plan that can be installed before departure.",
    sections: [
      {
        title: "Roaming depends on your home carrier",
        body:
          "Your roaming cost, speed, and availability depend on your carrier and destination. That can make it hard to compare before a trip."
      },
      {
        title: "A travel eSIM is planned separately",
        body:
          "A prepaid eSIM lets you choose a destination data package for the trip and keep your regular number available on supported dual-SIM phones."
      }
    ],
    faqs: [
      {
        question: "Is an eSIM always cheaper than roaming?",
        answer:
          "Not always. Compare your carrier's roaming terms with the eSIM package for your destination before buying."
      },
      {
        question: "Can I use both roaming and an eSIM?",
        answer:
          "On supported phones, you can keep your usual SIM active and choose which line provides mobile data."
      }
    ],
    relatedLinks: [
      { label: "Learn how eSIMs work", href: "/guides/what-is-an-esim" },
      { label: "Mobile internet abroad guide", href: "/guides/internet-abroad" },
      { label: "Europe travel eSIM plans", href: "/destinations/europe" }
    ]
  },
  {
    kind: "guide",
    slug: "how-to-install-esim",
    path: "/guides/how-to-install-esim",
    title: "How to Install an eSIM | Travel Data Setup Guide",
    description:
      "Learn the basic steps to install a travel eSIM, prepare mobile data before departure, and activate it when you arrive.",
    eyebrow: "Setup guide",
    heading: "How to install a travel eSIM before your trip.",
    intro:
      "This guide explains how installing an eSIM is usually a short digital setup on a compatible phone. The best time to install is before your trip while you have stable Wi-Fi, then you can turn on the travel data line when you reach your destination.",
    sections: [
      {
        title: "Check compatibility first",
        body:
          "Confirm your phone supports eSIM and is not restricted by a carrier lock that prevents adding another mobile plan."
      },
      {
        title: "Install with reliable Wi-Fi",
        body:
          "Follow the app instructions, add the eSIM profile, label the line clearly, and wait until arrival before enabling data roaming for that eSIM if instructed."
      }
    ],
    faqs: [
      {
        question: "Should I delete an eSIM after installing it?",
        answer:
          "No. Do not delete the eSIM unless support tells you to. Deleted eSIM profiles may not be reusable."
      },
      {
        question: "When should I turn on the travel eSIM?",
        answer:
          "Install before travel, then turn on the travel data line when you arrive at the destination."
      }
    ],
    relatedLinks: [
      { label: "Learn how eSIMs work", href: "/guides/what-is-an-esim" },
      { label: "Japan travel eSIM plans", href: "/destinations/japan" },
      { label: "USA travel eSIM plans", href: "/destinations/usa" }
    ]
  },
  {
    kind: "guide",
    slug: "internet-abroad",
    path: "/guides/internet-abroad",
    title: "Internet Abroad | Mobile Data Options for Travel",
    description:
      "Compare ways to get internet abroad, including travel eSIM data, roaming, local SIM cards, and public Wi-Fi.",
    eyebrow: "Travel internet guide",
    heading: "How to get internet abroad without the guesswork.",
    intro:
      "This guide explains how travelers can get internet abroad through roaming, public Wi-Fi, local SIM cards, portable hotspots, or eSIM data. eSim2you focuses on the digital eSIM option so mobile internet can be prepared before departure and planned without guesswork.",
    sections: [
      {
        title: "Public Wi-Fi is not enough for every trip",
        body:
          "Wi-Fi can help at hotels and cafes, but mobile data is useful for directions, rides, tickets, and urgent messages while moving."
      },
      {
        title: "eSIM data keeps setup digital",
        body:
          "With a compatible device, a travel eSIM can be installed without finding a local shop or changing your physical SIM card."
      }
    ],
    faqs: [
      {
        question: "What is the easiest way to get mobile data abroad?",
        answer:
          "For many compatible phones, a travel eSIM is one of the easiest options because it can be bought and installed digitally."
      },
      {
        question: "Should I still use Wi-Fi while traveling?",
        answer:
          "Yes. Wi-Fi can save mobile data, while an eSIM helps when you are away from trusted Wi-Fi networks."
      }
    ],
    relatedLinks: [
      { label: "Compare eSIM with roaming", href: "/guides/esim-vs-roaming" },
      { label: "Travel eSIM setup steps", href: "/guides/how-to-install-esim" },
      { label: "Browse every eSIM destination", href: "/destinations" }
    ]
  }
] satisfies SeoContentPage[];

export const useCasePages = [
  {
    kind: "use-case",
    slug: "business-travel",
    path: "/use-cases/business-travel",
    title: "Business Travel eSIM | International Data for Work Trips",
    description:
      "Use eSim2you for business travel data, reliable mobile internet abroad, email, messaging, maps, and work-trip coordination.",
    eyebrow: "Business travel",
    heading: "International data for business trips without roaming uncertainty.",
    intro:
      "Business travelers need international mobile internet for email, calendars, maps, rides, bookings, messaging, and urgent work updates during work trips. eSim2you helps prepare travel data before departure so the first connection is not left to airport Wi-Fi or roaming uncertainty.",
    sections: [
      {
        title: "Useful between meetings",
        body:
          "Mobile data supports transport, schedule changes, secure messaging, and quick research while moving between airports, hotels, offices, and event venues."
      },
      {
        title: "A practical backup to Wi-Fi",
        body:
          "Hotel and conference Wi-Fi can be inconsistent. A business travel eSIM gives compatible phones a dedicated data option when work cannot wait."
      }
    ],
    faqs: [
      {
        question: "Is eSim2you useful for work trips?",
        answer:
          "Yes. It is designed for travel data needs such as email, maps, messaging, bookings, and staying connected away from trusted Wi-Fi."
      },
      {
        question: "Can I keep my normal business number?",
        answer:
          "On supported dual-SIM phones, your regular SIM can remain available while the eSIM supplies mobile data."
      }
    ],
    relatedLinks: [
      { label: "Remote work data guide", href: "/use-cases/remote-work" },
      { label: "Compare eSIM with roaming", href: "/guides/esim-vs-roaming" },
      { label: "USA travel eSIM plans", href: "/destinations/usa" }
    ]
  },
  {
    kind: "use-case",
    slug: "remote-work",
    path: "/use-cases/remote-work",
    title: "Remote Work Travel Data | eSIM for Working Abroad",
    description:
      "Prepare mobile data for remote work abroad with eSim2you, a digital travel data option for compatible phones.",
    eyebrow: "Remote work",
    heading: "Travel data for remote work days abroad.",
    intro:
      "Remote workers and flexible travelers often need mobile data abroad outside hotels, apartments, cafes, and coworking spaces. eSim2you helps make international data part of the travel checklist before work days start in a new place.",
    sections: [
      {
        title: "A backup for work essentials",
        body:
          "Use travel data for email, maps, chat, authentication, booking changes, and urgent coordination when trusted Wi-Fi is unavailable."
      },
      {
        title: "Prepared before the workday",
        body:
          "Install the eSIM before departure on a compatible device so you can focus on the work trip rather than searching for connectivity."
      }
    ],
    faqs: [
      {
        question: "Can an eSIM replace home internet for remote work?",
        answer:
          "No. A travel eSIM is best treated as mobile data for travel needs and backup connectivity, not a full replacement for stable home or office internet."
      },
      {
        question: "Is an eSIM useful for two-factor authentication?",
        answer:
          "Mobile data can help access apps and email needed for authentication, while your usual SIM may still receive SMS if active and supported."
      }
    ],
    relatedLinks: [
      { label: "Business travel data guide", href: "/use-cases/business-travel" },
      { label: "Mobile internet abroad guide", href: "/guides/internet-abroad" },
      { label: "Europe travel eSIM plans", href: "/destinations/europe" }
    ]
  }
] satisfies SeoContentPage[];

export const publicSeoPages = [
  ...destinationPages,
  ...guidePages,
  ...useCasePages
] satisfies SeoContentPage[];

export const seoPageByPath = Object.fromEntries(
  publicSeoPages.map((page) => [page.path, page])
) as Record<string, SeoContentPage>;

export const seoPagesByKind = {
  destination: destinationPages,
  guide: guidePages,
  "use-case": useCasePages
} satisfies Record<SeoPageKind, SeoContentPage[]>;
