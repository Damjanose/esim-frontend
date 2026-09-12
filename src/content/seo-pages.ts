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

export const priorityDestinationEnhancements: Record<string, SeoPageSection[]> = {
  albania: [
    {
      title: "Coverage for Albania itineraries",
      body:
        "Check the live plan row for the network and validity that fit your route. Coverage can vary between Tirana, the coast, and mountain areas, so download maps and key bookings before leaving reliable Wi-Fi."
    }
  ],
  turkey: [
    {
      title: "From Istanbul arrivals to the coast",
      body:
        "A Turkey travel eSIM can help with airport transfers, navigation, translation, and messaging in Istanbul, Cappadocia, Antalya, and other stops. Review the plan network and hotspot terms before purchase."
    }
  ],
  italy: [
    {
      title: "Travel data for Italian city breaks",
      body:
        "Use an Italy eSIM for maps, train tickets, museum bookings, translation, and messaging across Rome, Milan, Florence, Venice, and regional trips. Install before departure and activate data after arrival."
    }
  ],
  greece: [
    {
      title: "Useful for island and mainland travel",
      body:
        "A Greece eSIM helps with ferry schedules, maps, ride apps, reservations, and messages while moving between Athens and the islands. Check the live plan details because network and hotspot support depend on the package."
    }
  ],
  usa: [
    {
      title: "Plan data for road trips and city travel",
      body:
        "USA travel data is useful for navigation, rideshare, hotel check-in, national-park planning, and long road trips. Check the plan’s network, validity, and hotspot terms for your route before buying."
    }
  ],
  germany: [
    {
      title: "Mobile data across German travel routes",
      body:
        "Use a Germany eSIM for rail updates, maps, translation, tickets, and messaging in Berlin, Munich, Frankfurt, and smaller towns. Keep your usual number on a supported dual-SIM phone."
    }
  ],
  france: [
    {
      title: "For Paris and travel beyond the capital",
      body:
        "A France eSIM can support maps, train bookings, translation, restaurant reservations, and messages across Paris and regional trips. Install on Wi-Fi and confirm the package network before departure."
    }
  ],
  spain: [
    {
      title: "Stay connected across Spanish routes",
      body:
        "Travel data helps with city navigation, rail and bus bookings, beach-town directions, translation, and messaging in Spain. Compare validity and data size with the length of your itinerary."
    }
  ],
  uk: [
    {
      title: "Useful from London to regional trips",
      body:
        "A UK eSIM can provide mobile data for maps, transit apps, bookings, and messaging in London, Scotland, Wales, and Northern Ireland. Your normal SIM can remain available for calls if your device supports dual SIM."
    }
  ],
  japan: [
    {
      title: "Data for transit, translation, and city travel",
      body:
        "Japan travel data is useful for rail navigation, translation, QR tickets, restaurant searches, and messaging in Tokyo, Kyoto, Osaka, and beyond. Install before flying so the connection plan is ready after landing."
    }
  ]
};

const baseDestinationPages = [
  {
    kind: "destination",
    slug: "usa",
    path: "/esim/usa",
    title: "eSIM USA | Travel Data for the United States | eSIM2you",
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
      { label: "Learn how eSIMs work", href: "/travel/what-is-an-esim" },
      { label: "Business travel data guide", href: "/use-cases/business-travel" }
    ]
  },
  {
    kind: "destination",
    slug: "europe",
    path: "/esim/europe",
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
      { label: "France travel eSIM plans", href: "/esim/france" },
      { label: "UK travel eSIM plans", href: "/esim/uk" },
      { label: "Compare eSIM with roaming", href: "/travel/esim-vs-roaming" }
    ]
  },
  {
    kind: "destination",
    slug: "japan",
    path: "/esim/japan",
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
      { label: "Travel eSIM setup steps", href: "/travel/how-to-install-esim" },
      { label: "Mobile internet abroad guide", href: "/travel/internet-abroad" }
    ]
  },
  {
    kind: "destination",
    slug: "turkey",
    path: "/esim/turkey",
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
      { label: "Learn how eSIMs work", href: "/travel/what-is-an-esim" }
    ]
  },
  {
    kind: "destination",
    slug: "france",
    path: "/esim/france",
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
      { label: "Europe travel eSIM plans", href: "/esim/europe" },
      { label: "UK travel eSIM plans", href: "/esim/uk" },
      { label: "Mobile internet abroad guide", href: "/travel/internet-abroad" }
    ]
  },
  {
    kind: "destination",
    slug: "uk",
    path: "/esim/uk",
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
      { label: "Europe travel eSIM plans", href: "/esim/europe" },
      { label: "Business travel data guide", href: "/use-cases/business-travel" },
      { label: "Compare eSIM with roaming", href: "/travel/esim-vs-roaming" }
    ]
  },
  {
    kind: "destination",
    slug: "germany",
    path: "/esim/germany",
    title: "eSIM for Germany | Travel Data for Berlin and Beyond",
    description:
      "Buy a eSim2you for Germany travel data, install it before departure, and use mobile internet in Berlin, Munich, and beyond.",
    eyebrow: "Germany travel eSIM",
    heading: "Germany travel data for maps, cities, and messaging.",
    intro:
      "eSim2you helps travelers visiting Germany prepare mobile internet before arrival. Whether you are heading to Berlin, Munich, Frankfurt, or a business trip across multiple cities, install a prepaid data plan ahead of time and skip the physical SIM counter after landing.",
    sections: [
      {
        title: "Useful across German cities",
        body:
          "Travel data supports rail navigation, maps, translation, hotel bookings, and messaging while moving between German cities and regions."
      },
      {
        title: "Prepared before departure",
        body:
          "Install the eSIM profile while you have Wi-Fi, then activate the data line as soon as you land in Germany."
      }
    ],
    faqs: [
      {
        question: "Can I install a Germany eSIM before flying?",
        answer:
          "Yes. Install the eSIM before your trip, then turn on the data line after you arrive in Germany."
      },
      {
        question: "Is a Germany eSIM good for business travel?",
        answer:
          "Yes. It can support email, maps, and messaging for conferences, meetings, and multi-city work trips."
      }
    ],
    relatedLinks: [
      { label: "Europe travel eSIM plans", href: "/esim/europe" },
      { label: "France travel eSIM plans", href: "/esim/france" },
      { label: "Business travel data guide", href: "/use-cases/business-travel" }
    ]
  },
  {
    kind: "destination",
    slug: "italy",
    path: "/esim/italy",
    title: "eSIM for Italy | Travel Data for Rome, Milan, and More",
    description:
      "Use eSim2you for Italy travel data, mobile internet in Rome and Milan, and a simpler alternative to international roaming.",
    eyebrow: "Italy travel eSIM",
    heading: "Italy travel data ready for Rome and Milan.",
    intro:
      "An Italy eSIM helps travelers prepare mobile internet before a trip to Rome, Milan, Florence, or the Amalfi Coast. Use eSim2you to plan ahead, avoid a physical SIM errand, and keep maps, messaging, and booking apps ready from the first day.",
    sections: [
      {
        title: "Helpful for city and coastal travel",
        body:
          "Mobile data supports train tickets, museum bookings, maps, rideshare apps, and messaging across busy Italian itineraries."
      },
      {
        title: "Prepared before arrival",
        body:
          "Install the eSIM profile while you have Wi-Fi, then use the travel data line once you land in Italy."
      }
    ],
    faqs: [
      {
        question: "Can I use an Italy eSIM for Rome and Milan?",
        answer:
          "Yes. An Italy travel eSIM is designed for mobile data across supported destinations throughout the country."
      },
      {
        question: "Does an Italy eSIM include calls?",
        answer:
          "eSim2you focuses on travel data. Use your regular number or internet-based apps for calls when available."
      }
    ],
    relatedLinks: [
      { label: "Europe travel eSIM plans", href: "/esim/europe" },
      { label: "France travel eSIM plans", href: "/esim/france" },
      { label: "Mobile internet abroad guide", href: "/travel/internet-abroad" }
    ]
  },
  {
    kind: "destination",
    slug: "spain",
    path: "/esim/spain",
    title: "eSIM for Spain | Travel Data for Barcelona, Madrid, and More",
    description:
      "Prepare a Spain travel eSIM with eSim2you and use mobile data for Barcelona, Madrid, maps, and messaging while traveling.",
    eyebrow: "Spain travel eSIM",
    heading: "Spain mobile data for Barcelona and Madrid travel.",
    intro:
      "eSim2you helps travelers visiting Spain set up travel data on a compatible phone. It is useful for Barcelona and Madrid city breaks, coastal trips, business travel, and student visits where roaming fees are hard to predict.",
    sections: [
      {
        title: "A cleaner way to get online",
        body:
          "Install digitally before arrival and use mobile data for maps, transport, bookings, and secure messaging across Spain."
      },
      {
        title: "Designed for everyday travel needs",
        body:
          "A Spain eSIM can keep essential apps reachable without changing your usual phone number or relying only on public Wi-Fi."
      }
    ],
    faqs: [
      {
        question: "Is a Spain eSIM useful for Barcelona travel?",
        answer:
          "Yes. Travel data is helpful for transport apps, maps, messaging, and bookings while moving around Barcelona and beyond."
      },
      {
        question: "Can I install the eSIM outside Spain?",
        answer:
          "Yes. Install before traveling when you have Wi-Fi, then use the data line after you arrive."
      }
    ],
    relatedLinks: [
      { label: "Europe travel eSIM plans", href: "/esim/europe" },
      { label: "Italy travel eSIM plans", href: "/esim/italy" },
      { label: "Compare eSIM with roaming", href: "/travel/esim-vs-roaming" }
    ]
  },
  {
    kind: "destination",
    slug: "greece",
    path: "/esim/greece",
    title: "eSIM for Greece | Travel Data for Athens and the Islands",
    description:
      "Buy a eSim2you for Greece travel data, use mobile internet in Athens, and stay connected across the Greek islands.",
    eyebrow: "Greece travel eSIM",
    heading: "Greece travel data for Athens and the islands.",
    intro:
      "eSim2you helps travelers visiting Greece prepare mobile internet before arrival. Whether you are exploring Athens, island hopping across the Cyclades, or planning a longer Mediterranean trip, install a prepaid data plan ahead of time and skip searching for a SIM shop after landing.",
    sections: [
      {
        title: "Useful for island hopping",
        body:
          "Travel data supports ferry schedules, maps, translation, and messaging while moving between Athens and the Greek islands."
      },
      {
        title: "Prepared before departure",
        body:
          "Install the eSIM profile while you have Wi-Fi, then activate the data line as soon as you land in Greece."
      }
    ],
    faqs: [
      {
        question: "Can I use a Greece eSIM on the islands?",
        answer:
          "Yes. A Greece travel eSIM is designed for mobile data across supported destinations, including Athens and the islands."
      },
      {
        question: "Should I install the Greece eSIM before flying?",
        answer:
          "Yes. Install before your trip while you have Wi-Fi, then turn on the data line after you arrive in Greece."
      }
    ],
    relatedLinks: [
      { label: "Europe travel eSIM plans", href: "/esim/europe" },
      { label: "Italy travel eSIM plans", href: "/esim/italy" },
      { label: "Mobile internet abroad guide", href: "/travel/internet-abroad" }
    ]
  },
  {
    kind: "destination",
    slug: "portugal",
    path: "/esim/portugal",
    title: "eSIM for Portugal | Travel Data for Lisbon and Porto",
    description:
      "Prepare a Portugal travel eSIM with eSim2you and use mobile data for Lisbon, Porto, maps, and messaging while traveling.",
    eyebrow: "Portugal travel eSIM",
    heading: "Portugal travel data for Lisbon and Porto.",
    intro:
      "eSim2you helps travelers visiting Portugal set up travel data on a compatible phone. It is useful for Lisbon and Porto city breaks, coastal trips along the Algarve, business travel, and student visits where roaming fees are hard to predict.",
    sections: [
      {
        title: "A cleaner way to get online",
        body:
          "Install digitally before arrival and use mobile data for maps, transport, bookings, and secure messaging across Portugal."
      },
      {
        title: "Designed for everyday travel needs",
        body:
          "A Portugal eSIM can keep essential apps reachable without changing your usual phone number or relying only on public Wi-Fi."
      }
    ],
    faqs: [
      {
        question: "Is a Portugal eSIM useful for Lisbon travel?",
        answer:
          "Yes. Travel data is helpful for transport apps, maps, messaging, and bookings while moving around Lisbon and Porto."
      },
      {
        question: "Can I install the eSIM outside Portugal?",
        answer:
          "Yes. Install before traveling when you have Wi-Fi, then use the data line after you arrive."
      }
    ],
    relatedLinks: [
      { label: "Europe travel eSIM plans", href: "/esim/europe" },
      { label: "Spain travel eSIM plans", href: "/esim/spain" },
      { label: "Compare eSIM with roaming", href: "/travel/esim-vs-roaming" }
    ]
  },
  {
    kind: "destination",
    slug: "switzerland",
    path: "/esim/switzerland",
    title: "eSIM for Switzerland | Travel Data Outside the EU Roaming Zone",
    description:
      "Use eSim2you for Switzerland travel data, mobile internet in Zurich and Geneva, and a simpler alternative to roaming.",
    eyebrow: "Switzerland travel eSIM",
    heading: "Switzerland travel data for Zurich and Geneva.",
    intro:
      "Switzerland sits outside the EU roaming zone, so travelers arriving from EU countries can still face roaming charges there. eSim2you helps prepare mobile internet before a trip to Zurich, Geneva, or the Alps, so travel data is ready without depending on an unpredictable roaming rate.",
    sections: [
      {
        title: "Useful outside the EU roaming zone",
        body:
          "Because Switzerland is not part of EU roaming agreements, a prepaid Switzerland eSIM can help travelers avoid unclear cross-border data charges."
      },
      {
        title: "Prepared before arrival",
        body:
          "Install the eSIM profile while you have Wi-Fi, then use the travel data line once you land in Switzerland."
      }
    ],
    faqs: [
      {
        question: "Does EU roaming cover Switzerland?",
        answer:
          "No. Switzerland is not part of the EU roaming zone, so a travel eSIM can be a useful alternative to unpredictable roaming charges."
      },
      {
        question: "Can I use a Switzerland eSIM in Zurich and Geneva?",
        answer:
          "Yes. A Switzerland travel eSIM is designed for mobile data across supported destinations, including Zurich and Geneva."
      }
    ],
    relatedLinks: [
      { label: "Europe travel eSIM plans", href: "/esim/europe" },
      { label: "Germany travel eSIM plans", href: "/esim/germany" },
      { label: "Compare eSIM with roaming", href: "/travel/esim-vs-roaming" }
    ]
  },
  {
    kind: "destination",
    slug: "thailand",
    path: "/esim/thailand",
    title: "eSIM for Thailand | Travel Data for Bangkok and Beyond",
    description:
      "Buy a eSim2you for Thailand, install it before you land, and use mobile data in Bangkok, Phuket, and Chiang Mai without roaming fees.",
    eyebrow: "Thailand travel eSIM",
    heading: "Travel data for Thailand, ready before you land.",
    intro:
      "eSim2you helps travelers visiting Thailand set up mobile internet before arrival. Install a prepaid eSIM data plan on a compatible phone and use local mobile data for Bangkok, Phuket, Chiang Mai, and island transfers, while keeping your usual number available for calls, texts, and WhatsApp. Keep travel data ready to use when you land.",
    sections: [
      {
        title: "Why use a Thailand eSIM?",
        body:
          "A Thailand travel eSIM is useful for ride apps, maps, translation, hotel check-ins, and staying reachable across long domestic transfers between cities and islands."
      },
      {
        title: "Best for common Thailand trips",
        body:
          "Use it for beach holidays, temple tours, digital nomad stays, and multi-city itineraries where predictable travel data is easier than roaming."
      }
    ],
    faqs: [
      {
        question: "Can I install a Thailand eSIM before flying?",
        answer:
          "Yes. You can install the eSIM before your trip, then turn on the data line when you arrive in Thailand."
      },
      {
        question: "Does a Thailand eSIM cover islands like Phuket and Koh Samui?",
        answer:
          "Coverage follows local mobile networks, so most populated islands and tourist areas are supported alongside Bangkok and Chiang Mai."
      }
    ],
    relatedLinks: [
      { label: "Browse every eSIM destination", href: "/destinations" },
      { label: "Learn how eSIMs work", href: "/travel/what-is-an-esim" },
      { label: "Mobile internet abroad guide", href: "/travel/internet-abroad" }
    ]
  },
  {
    kind: "destination",
    slug: "uae",
    path: "/esim/uae",
    title: "eSIM for UAE | Travel Data for Dubai and Abu Dhabi",
    description:
      "Get a eSim2you for the UAE and use mobile internet in Dubai and Abu Dhabi without hunting for a local SIM after landing.",
    eyebrow: "UAE travel eSIM",
    heading: "Mobile data for Dubai and Abu Dhabi, ready before you land.",
    intro:
      "eSim2you helps visitors to the United Arab Emirates prepare mobile data before arrival. It is a practical option for business trips, layovers, and holidays in Dubai and Abu Dhabi where reliable app access matters from the first day, without a physical SIM stop at the airport. Keep travel data ready to use when you land.",
    sections: [
      {
        title: "Useful for Dubai and Abu Dhabi",
        body:
          "Travel data can support ride apps, maps, hotel coordination, and messaging while moving between airports, business districts, and tourist sites."
      },
      {
        title: "Practical for layovers too",
        body:
          "A UAE eSIM can be installed in advance so a short layover in Dubai still comes with working mobile data as soon as you land."
      }
    ],
    faqs: [
      {
        question: "Can I use a UAE eSIM for a short layover?",
        answer:
          "Yes. Install it before departure, then activate the data line as soon as you land, even for a short stopover."
      },
      {
        question: "Will a UAE eSIM work in both Dubai and Abu Dhabi?",
        answer:
          "Yes. A UAE travel eSIM is designed for mobile data across supported destinations, including Dubai and Abu Dhabi."
      }
    ],
    relatedLinks: [
      { label: "Business travel data guide", href: "/use-cases/business-travel" },
      { label: "Travel eSIM setup steps", href: "/travel/how-to-install-esim" },
      { label: "Browse every eSIM destination", href: "/destinations" }
    ]
  },
  {
    kind: "destination",
    slug: "mexico",
    path: "/esim/mexico",
    title: "eSIM for Mexico | Travel Data for Cancun, CDMX, and More",
    description:
      "Use eSim2you for Mexico travel data, mobile internet in Cancun, Mexico City, and beach destinations, without roaming surprises.",
    eyebrow: "Mexico travel eSIM",
    heading: "Travel data for Mexico, ready before you land.",
    intro:
      "eSim2you gives travelers a simple way to prepare mobile internet for trips to Mexico. It is designed for people who want travel data for maps, messaging, booking apps, and ride-hailing in Cancun, Mexico City, and resort towns without depending on roaming or a local SIM shop. Keep travel data ready to use when you land.",
    sections: [
      {
        title: "A practical roaming alternative",
        body:
          "A Mexico eSIM can reduce trip-planning stress because the data plan lives digitally on your phone and can be managed from the app."
      },
      {
        title: "Useful for resort and city trips",
        body:
          "For beach holidays, city breaks, and business visits, setting up eSIM data before departure keeps connectivity simple from arrival."
      }
    ],
    faqs: [
      {
        question: "Is an eSIM useful for Mexico travel?",
        answer:
          "Yes. It can be a convenient way to get mobile data abroad without buying a physical SIM card after arrival."
      },
      {
        question: "Does a Mexico eSIM work in Cancun and Mexico City?",
        answer:
          "Yes. Coverage follows local mobile networks, supporting major cities and resort areas across the country."
      }
    ],
    relatedLinks: [
      { label: "Browse every eSIM destination", href: "/destinations" },
      { label: "Compare eSIM with roaming", href: "/travel/esim-vs-roaming" },
      { label: "Mobile internet abroad guide", href: "/travel/internet-abroad" }
    ]
  },
  {
    kind: "destination",
    slug: "canada",
    path: "/esim/canada",
    title: "eSIM for Canada | Travel Data for Toronto, Vancouver, and More",
    description:
      "Buy a eSim2you for Canada, install it in minutes, and stay online in Toronto, Vancouver, and Montreal without roaming fees.",
    eyebrow: "Canada travel eSIM",
    heading: "Travel data for Canada, ready before you land.",
    intro:
      "eSim2you helps travelers visiting Canada set up mobile internet before arrival. Choose a prepaid eSIM data plan, install it on a compatible phone, and use local mobile data across Toronto, Vancouver, and Montreal while keeping your usual number available for calls, texts, and WhatsApp. Keep travel data ready to use when you land.",
    sections: [
      {
        title: "Why use a Canada eSIM?",
        body:
          "A Canada travel eSIM is useful for airport arrivals, city navigation, rideshare apps, and staying reachable during road trips between provinces."
      },
      {
        title: "Best for common Canada trips",
        body:
          "Use it for vacations, conferences, cross-country road trips, and business visits where predictable travel data is easier than roaming."
      }
    ],
    faqs: [
      {
        question: "Can I install a Canada eSIM before flying?",
        answer:
          "Yes. You can install the eSIM before your trip, then turn on the data line when you arrive in Canada."
      },
      {
        question: "Will a Canada eSIM change my phone number?",
        answer:
          "No. A travel eSIM provides mobile data. Your regular SIM can stay active for your normal number if your phone supports dual SIM."
      }
    ],
    relatedLinks: [
      { label: "USA travel eSIM plans", href: "/esim/usa" },
      { label: "Learn how eSIMs work", href: "/travel/what-is-an-esim" },
      { label: "Business travel data guide", href: "/use-cases/business-travel" }
    ]
  },
  {
    kind: "destination",
    slug: "australia",
    path: "/esim/australia",
    title: "eSIM for Australia | Travel Data for Sydney, Melbourne, and More",
    description:
      "Get a eSim2you for Australia travel data and stay connected in Sydney, Melbourne, and beyond without a local SIM stop.",
    eyebrow: "Australia travel eSIM",
    heading: "Mobile internet for Australia, installed before your plane lands.",
    intro:
      "An Australia eSIM helps travelers stay online for transit, maps, messaging, and everyday trip planning across Sydney, Melbourne, Brisbane, and beyond. eSim2you makes mobile internet setup digital so data is installed before the plane lands and before the first taxi or airport transfer.",
    sections: [
      {
        title: "Built for arrival moments",
        body:
          "Use travel data for maps, messaging, and ride apps as soon as you are ready to turn on the eSIM line after a long-haul flight."
      },
      {
        title: "Simple digital setup",
        body:
          "Skip the physical SIM counter and install the eSIM profile on a compatible device while you still have reliable Wi-Fi."
      }
    ],
    faqs: [
      {
        question: "Can I use WhatsApp with an Australia eSIM?",
        answer:
          "Yes. Your WhatsApp account can continue using your usual number while the travel eSIM supplies mobile data."
      },
      {
        question: "Do I need an eSIM-compatible phone for Australia?",
        answer:
          "Yes. Check your device settings and carrier restrictions before buying any travel eSIM."
      }
    ],
    relatedLinks: [
      { label: "Browse every eSIM destination", href: "/destinations" },
      { label: "Travel eSIM setup steps", href: "/travel/how-to-install-esim" },
      { label: "Remote work data guide", href: "/use-cases/remote-work" }
    ]
  },
  {
    kind: "destination",
    slug: "indonesia",
    path: "/esim/indonesia",
    title: "eSIM for Indonesia | Travel Data for Bali and Beyond",
    description:
      "Use eSim2you for Indonesia travel data, mobile internet in Bali and Jakarta, and a simpler alternative to roaming.",
    eyebrow: "Indonesia travel eSIM",
    heading: "Travel data for Bali, Jakarta, and the islands.",
    intro:
      "eSim2you helps visitors to Indonesia prepare mobile internet data before arrival. It is a practical option for Bali holidays, digital nomad stays, and multi-island itineraries where reliable app access matters from the first day, without a physical SIM stop after landing.",
    sections: [
      {
        title: "Useful across Bali and the islands",
        body:
          "Travel data can support ride apps, maps, translation, villa coordination, and messaging while moving between islands and airports."
      },
      {
        title: "Keep your setup lightweight",
        body:
          "An eSIM keeps your data plan digital, so compatible phones can stay connected without swapping physical SIM cards between stops."
      }
    ],
    faqs: [
      {
        question: "Does an Indonesia eSIM cover Bali?",
        answer:
          "Yes. Coverage follows local mobile networks and includes Bali alongside Jakarta and other major islands."
      },
      {
        question: "Is Indonesia eSIM data good for remote work?",
        answer:
          "It can be helpful for email, maps, messaging, and video calls when you need mobile data away from villa or cafe Wi-Fi."
      }
    ],
    relatedLinks: [
      { label: "Remote work data guide", href: "/use-cases/remote-work" },
      { label: "Business travel data guide", href: "/use-cases/business-travel" },
      { label: "Browse every eSIM destination", href: "/destinations" }
    ]
  },
  {
    kind: "destination",
    slug: "albania",
    path: "/esim/albania",
    title: "eSIM Albania | Travel Data Plans | eSIM2you",
    description:
      "Buy an eSIM for Albania with eSIM2you. Compare prepaid travel data plans for Tirana and the coast, then install before you fly.",
    eyebrow: "Albania travel eSIM",
    heading: "Travel data for Albania, ready before you land in Tirana.",
    intro:
      "eSIM2you helps travelers visiting Albania set up mobile internet before arrival. Choose a prepaid eSIM data plan for Tirana, the Albanian Riviera, or a Balkans itinerary, install it on a compatible phone, and skip roaming surprises. Keep travel data ready when you land.",
    sections: [
      {
        title: "Useful from the airport to the coast",
        body:
          "An Albania eSIM helps with maps, ride apps, translation, ferry and bus tickets, and messaging while you move between Tirana, Durrës, Sarandë, and mountain towns."
      },
      {
        title: "Install travel data before departure",
        body:
          "Install the eSIM on Wi-Fi at home, then turn on the travel data line when you arrive in Albania so you are not hunting for a SIM shop after a long journey."
      },
      {
        title: "How the eSIM works in Albania",
        body:
          "The plan uses local 4G/5G networks where coverage exists. Hotspot use depends on the specific package — check the plan table on this page. Your usual number can stay on a dual-SIM phone."
      }
    ],
    faqs: [
      {
        question: "Can I install an Albania eSIM before flying?",
        answer:
          "Yes. Install the eSIM before your trip, then enable the data line when you arrive in Albania."
      },
      {
        question: "Does an Albania eSIM change my phone number?",
        answer:
          "No. A travel eSIM provides mobile data. Your regular SIM can stay active for calls, texts, and WhatsApp on dual-SIM phones."
      }
    ],
    relatedLinks: [
      { label: "Greece travel eSIM plans", href: "/esim/greece" },
      { label: "Italy travel eSIM plans", href: "/esim/italy" },
      { label: "Europe travel eSIM plans", href: "/esim/europe" }
    ]
  },
  {
    kind: "destination",
    slug: "asia",
    path: "/esim/asia",
    title: "eSIM for Asia | Regional Travel Data | eSIM2you",
    description:
      "Compare Asia eSIM plans and country pages for Japan, Thailand, Indonesia, and the UAE. Use eSIM2you for prepaid travel data across Asian trips.",
    eyebrow: "Asia travel eSIM",
    heading: "Stay connected across Asia with prepaid eSIM data.",
    intro:
      "Stay connected across Asia with prepaid eSIM data from eSIM2you. Plan mobile internet for regional bundles or a country plan for Japan, Thailand, Indonesia, or the UAE. Compare live data, validity, and price, then install before you fly.",
    sections: [
      {
        title: "Regional bundles and country plans",
        body:
          "An Asia eSIM can cover a multi-country itinerary. If you are staying in one country, a local Japan, Thailand, or Indonesia plan may be a better fit — use the related country pages and the plan table below."
      },
      {
        title: "Prepared before the first border",
        body:
          "Install on Wi-Fi, then enable data when you land so maps, translation, and messaging work without a local SIM shop."
      }
    ],
    faqs: [
      {
        question: "Should I buy an Asia eSIM or a single-country plan?",
        answer:
          "Choose a regional Asia plan for multi-country trips. Choose a country eSIM when you are staying in one destination such as Japan or Thailand."
      },
      {
        question: "Can I install an Asia eSIM before travel?",
        answer:
          "Yes. Install before departure on stable Wi-Fi, then turn on the travel data line after you arrive in Asia."
      }
    ],
    relatedLinks: [
      { label: "Japan travel eSIM plans", href: "/esim/japan" },
      { label: "Thailand travel eSIM plans", href: "/esim/thailand" },
      { label: "Indonesia travel eSIM plans", href: "/esim/indonesia" }
    ]
  },
  {
    kind: "destination",
    slug: "north-america",
    path: "/esim/north-america",
    title: "eSIM for North America | USA, Canada, Mexico | eSIM2you",
    description:
      "Compare North America eSIM options for the USA, Canada, and Mexico. eSIM2you lists prepaid travel data plans with live prices on each country page.",
    eyebrow: "North America travel eSIM",
    heading: "North America travel data for the USA, Canada, and Mexico.",
    intro:
      "eSIM2you helps travelers visiting North America prepare prepaid eSIM data. Use a USA, Canada, or Mexico country plan when you stay in one country, and compare live tables before checkout.",
    sections: [
      {
        title: "Country plans for common North America trips",
        body:
          "Most visitors need a USA, Canada, or Mexico eSIM rather than a single continental SKU. Open those country pages for data, validity, network, and the lowest-priced plan we currently sell."
      },
      {
        title: "Install before you cross the border",
        body:
          "Add the eSIM on Wi-Fi at home, then enable the travel data line when you land so you are not relying on airport Wi-Fi or roaming."
      }
    ],
    faqs: [
      {
        question: "Is there one eSIM for all of North America?",
        answer:
          "Coverage depends on the package. Check this page’s plan table and the USA, Canada, and Mexico guides for what each plan actually includes."
      },
      {
        question: "Should I install before flying to the USA?",
        answer:
          "Yes. Install on Wi-Fi before departure, then turn on the data line after arrival."
      }
    ],
    relatedLinks: [
      { label: "USA travel eSIM plans", href: "/esim/usa" },
      { label: "Canada travel eSIM plans", href: "/esim/canada" },
      { label: "Mexico travel eSIM plans", href: "/esim/mexico" }
    ]
  },
  {
    kind: "guide",
    slug: "how-much-data-when-traveling",
    path: "/travel/how-much-data-when-traveling",
    title: "How Much Mobile Data Do I Need When Traveling? | eSIM2you",
    description: "Estimate travel data needs for maps, messaging, social media, video, and work before choosing an eSIM plan.",
    eyebrow: "Travel data guide",
    heading: "How much mobile data do you need for a trip?",
    intro: "To understand how much mobile data you need, consider trip length, apps, Wi-Fi access, and whether you stream video. Estimate your daily habits first, then compare live destination plans by data and validity.",
    sections: [
      { title: "Light use", body: "Maps, messaging, email, and occasional browsing usually need less data than video or hotspot use. Download offline maps where practical." },
      { title: "Regular travel use", body: "Frequent navigation, social media, photos, bookings, and calls use more data. Choose enough validity for the whole itinerary and leave a small buffer." },
      { title: "Heavy use", body: "Streaming, remote work, large uploads, or hotspot use can consume data quickly. Check the package terms and consider a higher-data plan." }
    ],
    faqs: [
      { question: "Does video use the most travel data?", answer: "Usually. Video streaming and video calls can use substantially more data than messaging or map directions." },
      { question: "Can I top up later?", answer: "Top-up availability depends on the account and package; check your account after purchase." }
    ],
    relatedLinks: [
      { label: "Compare live destinations", href: "/destinations" },
      { label: "Europe eSIM plans", href: "/esim/europe" },
      { label: "Travel eSIM installation", href: "/travel/how-to-install-esim" }
    ]
  },
  {
    kind: "guide",
    slug: "travel-data-and-wifi",
    path: "/travel/travel-data-and-wifi",
    title: "Travel Data and Wi-Fi: Planning Connectivity Abroad | eSIM2you",
    description: "Plan mobile data and Wi-Fi for travel by comparing eSIM setup, public Wi-Fi, device support, and trip needs.",
    eyebrow: "Travel connectivity",
    heading: "Travel data and Wi-Fi: how to stay connected abroad.",
    intro: "Travel data and Wi-Fi solve different parts of a trip. Learn how to stay connected abroad by using reliable Wi-Fi for large downloads and an eSIM for maps, messages, bookings, and connection when you are moving between places.",
    sections: [
      { title: "A travel eSIM starts before arrival", body: "Install digitally on Wi-Fi before departure and avoid searching for a shop immediately after landing. Live plans show the data, validity, network, and price." },
      { title: "Wi-Fi is useful but not everywhere", body: "Hotel and cafe Wi-Fi can help with large downloads, but it may not be available during transfers, navigation, or arrival." },
      { title: "Check your phone first", body: "Confirm eSIM support, carrier unlock status, and dual-SIM behavior before buying either option." }
    ],
    faqs: [
      { question: "Can I use an eSIM alongside Wi-Fi?", answer: "Yes. Use Wi-Fi when it is trusted and available, while the eSIM supplies mobile data when you are away from it." },
      { question: "Should I download maps before traveling?", answer: "Offline maps and key bookings can reduce data use, but a travel eSIM keeps essential mobile access available while you move." }
    ],
    relatedLinks: [
      { label: "USA eSIM plans", href: "/esim/usa" },
      { label: "Europe eSIM plans", href: "/esim/europe" },
      { label: "eSIM vs roaming", href: "/travel/esim-vs-roaming" }
    ]
  },
  {
    kind: "guide",
    slug: "keep-your-number-with-esim",
    path: "/travel/keep-your-number-with-esim",
    title: "Can I Keep My Normal Number With an eSIM? | eSIM2you",
    description: "Learn how dual SIM phones can keep your normal number available while a travel eSIM provides mobile data.",
    eyebrow: "Dual-SIM guide",
    heading: "Keep your normal number while using travel data.",
    intro: "Many compatible phones can keep a regular SIM and your normal number active while a travel eSIM handles mobile data. The exact behavior depends on your phone, carrier, and selected data settings.",
    sections: [
      { title: "Use the eSIM for mobile data", body: "Select the travel eSIM as the data line and keep your usual line available for calls or messages if your carrier and phone support it." },
      { title: "Avoid surprise roaming", body: "Review data roaming settings on your regular line and disable automatic switching where your device offers that control." },
      { title: "Test before departure", body: "Install the profile over Wi-Fi, label the lines clearly, and check which line is selected for data before you fly." }
    ],
    faqs: [
      { question: "Will WhatsApp keep my number?", answer: "WhatsApp can continue using your existing account while the travel eSIM provides the internet connection." },
      { question: "Can every phone use two lines?", answer: "No. Check eSIM support, carrier restrictions, and your device’s dual-SIM behavior before purchase." }
    ],
    relatedLinks: [
      { label: "How to install an eSIM", href: "/travel/how-to-install-esim" },
      { label: "USA eSIM plans", href: "/esim/usa" },
      { label: "Travel support", href: "/support" }
    ]
  },
  {
    kind: "guide",
    slug: "activate-esim-before-flying",
    path: "/travel/activate-esim-before-flying",
    title: "How to Activate an eSIM Before Flying | eSIM2you",
    description: "Follow a practical pre-flight checklist for installing a travel eSIM and activating data after arrival.",
    eyebrow: "Pre-flight checklist",
    heading: "Activate your travel eSIM before the flight.",
    intro: "Installing your travel eSIM before your flight gives you time to check device compatibility and finish setup over reliable Wi-Fi. In many cases, you can wait to enable travel data until you arrive.",
    sections: [
      { title: "Before installation", body: "Confirm your phone is compatible and unlocked, keep the order details accessible, and connect to stable Wi-Fi." },
      { title: "Install the profile", body: "Use the QR code or manual instructions from your order, label the line with its destination, and follow the phone’s confirmation steps." },
      { title: "Activate on arrival", body: "Select the travel eSIM for mobile data, enable the required settings, and check the network connection when you land." }
    ],
    faqs: [
      { question: "Do I need to activate data immediately after installing?", answer: "Usually you can install before departure and enable the travel data line when you arrive; follow the package instructions." },
      { question: "What if installation fails?", answer: "Check Wi-Fi, device compatibility, and the installation guide, then contact support with your order details." }
    ],
    relatedLinks: [
      { label: "Installation guide", href: "/travel/how-to-install-esim" },
      { label: "Support center", href: "/support" },
      { label: "Browse destinations", href: "/destinations" }
    ]
  },
  {
    kind: "guide",
    slug: "esim-not-connecting",
    path: "/travel/esim-not-connecting",
    title: "What to Do When a Travel eSIM Does Not Connect | eSIM2you",
    description: "Troubleshoot a travel eSIM connection by checking activation, data-line selection, roaming settings, and coverage.",
    eyebrow: "Connection troubleshooting",
    heading: "What to do when your travel eSIM does not connect.",
    intro: "When your travel eSIM does not connect, the cause can be device settings, activation timing, coverage, or a temporary network issue. Work through the basics before contacting support with your order and device details.",
    sections: [
      { title: "Check the active data line", body: "Confirm the travel eSIM is enabled and selected for mobile data. On dual-SIM phones, check that automatic data switching is configured as intended." },
      { title: "Check network settings", body: "Follow the package instructions for data roaming or network selection, then toggle airplane mode or restart the phone if needed." },
      { title: "Confirm coverage and validity", body: "Make sure you are in a covered destination and that the plan has started or remains valid. Contact support if the issue continues." }
    ],
    faqs: [
      { question: "Should I restart my phone?", answer: "A restart or brief airplane-mode toggle can help the phone register the travel network after settings change." },
      { question: "What should I send support?", answer: "Include the order reference, destination, device model, screenshots of relevant settings, and the steps already tried." }
    ],
    relatedLinks: [
      { label: "Support center", href: "/support" },
      { label: "How to install an eSIM", href: "/travel/how-to-install-esim" },
      { label: "Browse live plans", href: "/destinations" }
    ]
  },
  {
    kind: "guide",
    slug: "best-esim-europe-travel",
    path: "/travel/best-esim-europe-travel",
    title: "Best eSIM for Europe Travel: How to Compare Plans | eSIM2you",
    description: "Learn how to compare Europe travel eSIM plans by country coverage, data, validity, network, and price.",
    eyebrow: "Europe travel guide",
    heading: "How to choose a Europe travel eSIM.",
    intro: "Learn how to choose the best eSIM for Europe travel by comparing your countries, trip length, data habits, and device. Compare live package coverage and plan details instead of choosing by a generic data number alone.",
    sections: [
      { title: "Match coverage to the itinerary", body: "A multi-country trip may suit a regional plan, while a single-country visit may be simpler with a country package. Check the included destinations." },
      { title: "Compare data and validity", body: "Choose enough data for maps, messaging, bookings, and your normal usage, then confirm the plan lasts for the full trip." },
      { title: "Review network and support terms", body: "Check the listed network, hotspot policy, installation instructions, and support options before checkout." }
    ],
    faqs: [
      { question: "Is a Europe regional plan always better?", answer: "Not always. Compare its included countries, price, data, and validity with country plans for the exact itinerary." },
      { question: "Where can I see current Europe plans?", answer: "Open the live Europe destination page to compare current data, validity, network, and price rows." }
    ],
    relatedLinks: [
      { label: "Europe eSIM plans", href: "/esim/europe" },
      { label: "France eSIM plans", href: "/esim/france" },
      { label: "Italy eSIM plans", href: "/esim/italy" }
    ]
  }
] satisfies SeoContentPage[];

const additionalDestinationPages = [
  {
    kind: "destination",
    slug: "netherlands",
    path: "/esim/netherlands",
    title: "eSIM Netherlands | Travel Data for Amsterdam and Beyond",
    description: "Compare live Netherlands travel eSIM plans for Amsterdam, Rotterdam, and trips across the country.",
    eyebrow: "Netherlands travel eSIM",
    heading: "Travel data for the Netherlands, ready before arrival.",
    intro: "Prepare a Netherlands eSIM for maps, train schedules, translation, messaging, and city travel before you arrive. Install on Wi-Fi so your travel data is ready on arrival in Amsterdam or at your next stop.",
    sections: [
      { title: "Useful for city and rail travel", body: "Use mobile data for transit apps, museum reservations, navigation, and booking changes while traveling between Amsterdam, Rotterdam, Utrecht, and smaller towns." },
      { title: "Check the live plan details", body: "Compare the current data, validity, network, and price rows for your trip. Hotspot availability depends on the package." },
      { title: "Keep your usual number", body: "On a compatible dual-SIM phone, your normal line can remain available while the Netherlands eSIM supplies travel data." }
    ],
    faqs: [
      { question: "Can I install a Netherlands eSIM before flying?", answer: "Yes. Install it over stable Wi-Fi before departure and enable mobile data after arriving." },
      { question: "Can I use it outside Amsterdam?", answer: "Check the live package coverage and network details for the cities and routes on your itinerary." }
    ],
    relatedLinks: [
      { label: "Europe travel eSIM plans", href: "/esim/europe" },
      { label: "How to install an eSIM", href: "/travel/how-to-install-esim" },
      { label: "eSIM vs roaming", href: "/travel/esim-vs-roaming" }
    ]
  },
  {
    kind: "destination",
    slug: "austria",
    path: "/esim/austria",
    title: "eSIM Austria | Travel Data for Vienna and the Alps",
    description: "Compare live Austria travel eSIM plans for Vienna, Salzburg, Innsbruck, and Alpine trips.",
    eyebrow: "Austria travel eSIM",
    heading: "Mobile data for Austria, installed before your trip.",
    intro: "Use an Austria eSIM for maps, rail travel, translation, reservations, and messages across Vienna, Salzburg, Innsbruck, and the Alps. Have travel data installed before your trip, then activate the profile when you arrive.",
    sections: [
      { title: "From city breaks to Alpine routes", body: "Travel data helps with train updates, hiking directions, weather, accommodation messages, and bookings when hotel Wi-Fi is unavailable." },
      { title: "Compare plans for your itinerary", body: "Review live data size, validity, network, and price before choosing. Coverage and hotspot use depend on the selected package." },
      { title: "Install before leaving home", body: "Install on a compatible device over reliable Wi-Fi, then keep your usual number available if your phone supports dual SIM." }
    ],
    faqs: [
      { question: "Is an Austria eSIM useful for rail travel?", answer: "Yes. Mobile data can help with rail schedules, maps, tickets, and messages while moving between cities." },
      { question: "When should I activate it?", answer: "Install before departure and turn on the travel data line after arriving in Austria." }
    ],
    relatedLinks: [
      { label: "Europe travel eSIM plans", href: "/esim/europe" },
      { label: "Germany travel eSIM plans", href: "/esim/germany" },
      { label: "Travel eSIM installation guide", href: "/travel/how-to-install-esim" }
    ]
  },
  {
    kind: "destination",
    slug: "balkans",
    path: "/esim/balkans",
    title: "eSIM for the Balkans | Regional Travel Data | eSIM2you",
    description: "Compare live regional eSIM data plans for a Balkans itinerary across Albania, Greece, and nearby countries.",
    eyebrow: "Balkans regional eSIM",
    heading: "One travel data plan for a multi-country Balkans route.",
    intro: "One Balkans eSIM can simplify a multi-country route by keeping your connectivity plan digital. Check the countries covered by each live package before buying because regional coverage varies by plan.",
    sections: [
      { title: "Built for border-crossing itineraries", body: "Use mobile data for maps, ferry and bus schedules, translation, bookings, and messages while moving between Albania, Greece, Montenegro, Croatia, and nearby destinations." },
      { title: "Confirm every included country", body: "Regional packages differ. Review the package coverage list, validity, data, network, and hotspot terms for the exact route." },
      { title: "Prepare before departure", body: "Install over Wi-Fi before the first flight or border crossing, then enable travel data as you enter the covered region." }
    ],
    faqs: [
      { question: "Does every Balkans plan cover every country?", answer: "No. Check the countries listed for the specific package before purchase." },
      { question: "Can I use a regional plan for a short trip?", answer: "Yes, if its included countries and validity match your itinerary." }
    ],
    relatedLinks: [
      { label: "Albania eSIM plans", href: "/esim/albania" },
      { label: "Greece eSIM plans", href: "/esim/greece" },
      { label: "Europe eSIM plans", href: "/esim/europe" }
    ]
  },
  {
    kind: "destination",
    slug: "middle-east",
    path: "/esim/middle-east",
    title: "eSIM for the Middle East | Regional Travel Data | eSIM2you",
    description: "Compare live regional eSIM plans for Middle East travel, with coverage and validity shown per package.",
    eyebrow: "Middle East regional eSIM",
    heading: "Plan mobile data across a Middle East itinerary.",
    intro: "A regional Middle East eSIM can help travelers prepare mobile data across a multi-country itinerary before departure. Coverage is package-specific, so review the included countries and network details before buying.",
    sections: [
      { title: "Useful for arrival and city travel", body: "Use data for airport transfers, maps, translation, reservations, messaging, and ride apps while traveling between covered destinations." },
      { title: "Coverage is package-specific", body: "Check the live package country list, data amount, validity, network, and hotspot policy rather than assuming every regional plan is identical." },
      { title: "Keep setup simple", body: "Install the eSIM over Wi-Fi before departure and enable it when you reach a covered destination." }
    ],
    faqs: [
      { question: "Which countries are included?", answer: "The included countries are shown on each live regional package; review that list before purchase." },
      { question: "Can I install it before travel?", answer: "Yes. Install before departure on a compatible phone and activate it on arrival." }
    ],
    relatedLinks: [
      { label: "Asia eSIM plans", href: "/esim/asia" },
      { label: "UAE eSIM plans", href: "/esim/uae" },
      { label: "Travel eSIM guides", href: "/travel" }
    ]
  },
  {
    kind: "destination",
    slug: "africa",
    path: "/esim/africa",
    title: "eSIM for Africa | Regional Travel Data | eSIM2you",
    description: "Compare live Africa regional eSIM data plans and review covered countries before your trip.",
    eyebrow: "Africa regional eSIM",
    heading: "Stay prepared for a multi-country Africa trip.",
    intro: "Stay prepared for an Africa trip with a regional eSIM and a digital data option across covered countries. Check the live package coverage, network, data, and validity for your route before purchase.",
    sections: [
      { title: "For airports, transfers, and safaris", body: "Mobile data can help with maps, driver coordination, reservations, translation, and messages during city, safari, and multi-stop itineraries." },
      { title: "Review coverage before buying", body: "Regional plans vary by country and network. Use the package country list and live plan table as the source of truth." },
      { title: "Install while connected to Wi-Fi", body: "Install before departure, then enable the travel line when you reach a destination included in the package." }
    ],
    faqs: [
      { question: "Will one plan cover every African country?", answer: "No. Coverage depends on the package. Check its included country list before purchase." },
      { question: "Can I keep my regular SIM?", answer: "On a compatible dual-SIM phone, your regular line can remain available while the eSIM handles data." }
    ],
    relatedLinks: [
      { label: "Europe eSIM plans", href: "/esim/europe" },
      { label: "Asia eSIM plans", href: "/esim/asia" },
      { label: "Travel support", href: "/support" }
    ]
  },
  {
    kind: "destination",
    slug: "south-america",
    path: "/esim/south-america",
    title: "eSIM for South America | Regional Travel Data | eSIM2you",
    description: "Compare live South America regional eSIM plans for multi-country travel and review coverage before purchase.",
    eyebrow: "South America regional eSIM",
    heading: "Prepare mobile data for a South America itinerary.",
    intro: "Prepare a South America eSIM to simplify connectivity planning across covered countries. Review the exact country list, data, validity, network, and hotspot terms for your trip.",
    sections: [
      { title: "Useful between cities and borders", body: "Use mobile data for maps, long-distance transport, translation, hotel messages, and bookings during a multi-country route." },
      { title: "Choose by route and duration", body: "Compare live plan rows against the countries and number of travel days on your itinerary. Regional packages are not interchangeable." },
      { title: "Set up before you fly", body: "Install on Wi-Fi before departure and activate the eSIM data line when you arrive in a covered destination." }
    ],
    faqs: [
      { question: "How do I check regional coverage?", answer: "Open the live plan details and review the countries included in the specific package." },
      { question: "Is hotspot included?", answer: "Hotspot availability depends on the selected package; check its terms before purchase." }
    ],
    relatedLinks: [
      { label: "USA eSIM plans", href: "/esim/usa" },
      { label: "Travel eSIM guides", href: "/travel" },
      { label: "Support center", href: "/support" }
    ]
  }
] satisfies SeoContentPage[];

export const destinationPages = [
  ...baseDestinationPages.filter((page) => page.kind === "destination"),
  ...additionalDestinationPages
] satisfies SeoContentPage[];

export const guidePages = [
  ...baseDestinationPages.filter((page) => page.kind === "guide"),
  {
    kind: "guide",
    slug: "what-is-an-esim",
    path: "/travel/what-is-an-esim",
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
      { label: "Travel eSIM setup steps", href: "/travel/how-to-install-esim" },
      { label: "Compare eSIM with roaming", href: "/travel/esim-vs-roaming" },
      { label: "Browse every eSIM destination", href: "/destinations" }
    ]
  },
  {
    kind: "guide",
    slug: "esim-vs-roaming",
    path: "/travel/esim-vs-roaming",
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
      { label: "Learn how eSIMs work", href: "/travel/what-is-an-esim" },
      { label: "Mobile internet abroad guide", href: "/travel/internet-abroad" },
      { label: "Europe travel eSIM plans", href: "/esim/europe" }
    ]
  },
  {
    kind: "guide",
    slug: "how-to-install-esim",
    path: "/travel/how-to-install-esim",
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
      { label: "Learn how eSIMs work", href: "/travel/what-is-an-esim" },
      { label: "Japan travel eSIM plans", href: "/esim/japan" },
      { label: "USA travel eSIM plans", href: "/esim/usa" }
    ]
  },
  {
    kind: "guide",
    slug: "internet-abroad",
    path: "/travel/internet-abroad",
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
      { label: "Compare eSIM with roaming", href: "/travel/esim-vs-roaming" },
      { label: "Travel eSIM setup steps", href: "/travel/how-to-install-esim" },
      { label: "Browse every eSIM destination", href: "/destinations" }
    ]
  },
  {
    kind: "guide",
    slug: "esim-vs-local-sim",
    path: "/travel/esim-vs-local-sim",
    title: "eSIM vs Local SIM Card | Which Is Better for Travel?",
    description:
      "Compare a travel eSIM with buying a local SIM card in the USA or Europe, including setup time, cost, and convenience.",
    eyebrow: "Travel data comparison",
    heading: "eSIM vs local SIM card: is it better for travel?",
    intro:
      "Travelers heading to the USA or Europe often choose between a prepaid travel eSIM and a local SIM card bought after landing. Both provide mobile data, but the setup, cost, and convenience can differ enough to matter for a short trip.",
    sections: [
      {
        title: "A local SIM card takes time after landing",
        body:
          "Buying a local SIM card in the USA or Europe usually means finding a shop or kiosk, showing identification, and swapping the physical card, all after a long flight."
      },
      {
        title: "A travel eSIM is ready before you land",
        body:
          "eSim2you lets travelers install a data plan digitally before departure, so the USA or Europe data line can be turned on the moment the plane lands, without a physical SIM card."
      }
    ],
    faqs: [
      {
        question: "Is an eSIM better than a local SIM card for a short trip?",
        answer:
          "For short trips to the USA or Europe, many travelers prefer an eSIM because it can be installed before departure and does not require finding a local shop."
      },
      {
        question: "Do I lose my phone number with either option?",
        answer:
          "No. On supported dual-SIM phones, your usual number can stay active while either a local SIM or an eSIM supplies mobile data."
      }
    ],
    relatedLinks: [
      { label: "Compare eSIM with roaming", href: "/travel/esim-vs-roaming" },
      { label: "USA travel eSIM plans", href: "/esim/usa" },
      { label: "Europe travel eSIM plans", href: "/esim/europe" }
    ]
  },
  {
    kind: "guide",
    slug: "best-esim-usa-travel",
    path: "/travel/best-esim-usa-travel",
    title: "Best eSIM for USA Travel: How to Compare Plans | eSIM2you",
    description: "Learn how to compare USA travel eSIM plans by coverage, data, validity, network, and price.",
    eyebrow: "USA travel guide",
    heading: "How to choose a USA travel eSIM.",
    intro: "Learn how to choose the best eSIM for USA travel by comparing your route, trip length, data habits, and device. Compare live package details instead of choosing by a generic data number alone.",
    sections: [
      { title: "Match coverage to a multi-state route", body: "A single-city trip and a multi-state road trip have different needs. Check that the package covers every state on your itinerary." },
      { title: "Compare data and validity", body: "Choose enough data for maps, messaging, bookings, and your normal usage, then confirm the plan lasts for the full trip." },
      { title: "Review network and support terms", body: "Check the listed network, hotspot policy, installation instructions, and support options before checkout." }
    ],
    faqs: [
      { question: "Is a nationwide USA plan always enough for a multi-state trip?", answer: "Usually, but confirm the package's network coverage and hotspot terms match the states and cities on your route." },
      { question: "Where can I see current USA plans?", answer: "Open the live USA destination page to compare current data, validity, network, and price rows." }
    ],
    relatedLinks: [
      { label: "USA eSIM plans", href: "/esim/usa" },
      { label: "Compare eSIM with roaming", href: "/travel/esim-vs-roaming" },
      { label: "How to install an eSIM", href: "/travel/how-to-install-esim" }
    ]
  },
  {
    kind: "guide",
    slug: "best-esim-uk-travel",
    path: "/travel/best-esim-uk-travel",
    title: "Best eSIM for UK Travel: How to Compare Plans | eSIM2you",
    description: "Learn how to compare UK travel eSIM plans by coverage, data, validity, network, and price.",
    eyebrow: "UK travel guide",
    heading: "How to choose a UK travel eSIM.",
    intro: "Learn how to choose the best eSIM for UK travel by comparing your itinerary, trip length, data habits, and device. Compare live package details instead of choosing by a generic data number alone.",
    sections: [
      { title: "Match coverage to your itinerary", body: "A London-only trip and a UK-wide itinerary have different needs. Check that the package covers every city and region on your route." },
      { title: "Compare data and validity", body: "Choose enough data for maps, messaging, bookings, and your normal usage, then confirm the plan lasts for the full trip." },
      { title: "Review network and support terms", body: "Check the listed network, hotspot policy, installation instructions, and support options before checkout." }
    ],
    faqs: [
      { question: "Is a UK plan different from a Europe regional plan?", answer: "Yes. Compare a UK-specific package against a Europe regional plan's included countries, price, data, and validity for your exact itinerary." },
      { question: "Where can I see current UK plans?", answer: "Open the live UK destination page to compare current data, validity, network, and price rows." }
    ],
    relatedLinks: [
      { label: "UK eSIM plans", href: "/esim/uk" },
      { label: "Europe eSIM plans", href: "/esim/europe" },
      { label: "eSIM vs local SIM card", href: "/travel/esim-vs-local-sim" }
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
      { label: "Compare eSIM with roaming", href: "/travel/esim-vs-roaming" },
      { label: "USA travel eSIM plans", href: "/esim/usa" }
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
      { label: "Mobile internet abroad guide", href: "/travel/internet-abroad" },
      { label: "Europe travel eSIM plans", href: "/esim/europe" }
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
