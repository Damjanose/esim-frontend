export type Destination = {
  country: string;
  region: string;
  price: string;
  badge?: string;
  href: string;
  palette: string;
  landmark: string;
  imageUrl: string;
  imageAlt: string;
};

export type LandingStep = {
  title: string;
  description: string;
};

export type Benefit = {
  title: string;
  description: string;
};

export type Faq = {
  question: string;
  answer: string;
};

export type SupportLink = {
  label: string;
  href: string;
};

export type AppLink = {
  label: string;
  href: string | null;
};

export const landingContent = {
  brand: "Velocity eSIM",
  navItems: [
    { label: "Destinations", href: "#destinations" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Benefits", href: "#benefits" },
    { label: "FAQ", href: "#faq" }
  ],
  hero: {
    eyebrow: "Global connectivity",
    title: "Travel with fast data before your plane lands.",
    body:
      "Buy a digital SIM for 200+ destinations, install it in minutes, and skip surprise roaming fees.",
    popular: ["Japan", "USA", "Europe"]
  },
  destinations: [
    {
      country: "USA",
      region: "North America",
      price: "$4.50",
      badge: "5G ready",
      href: "/destinations/usa",
      palette: "from-sky-200 via-cyan-100 to-slate-200",
      landmark: "NYC",
      imageUrl:
        "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=900&q=80",
      imageAlt: "New York City skyline in the USA"
    },
    {
      country: "Japan",
      region: "Asia",
      price: "$5.20",
      href: "/destinations/japan",
      palette: "from-rose-100 via-cyan-100 to-sky-200",
      landmark: "Fuji",
      imageUrl:
        "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=900&q=80",
      imageAlt: "Mount Fuji landscape in Japan"
    },
    {
      country: "UK",
      region: "Europe",
      price: "$4.50",
      href: "/destinations/uk",
      palette: "from-indigo-200 via-sky-100 to-cyan-100",
      landmark: "London",
      imageUrl:
        "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=80",
      imageAlt: "London city view in the United Kingdom"
    },
    {
      country: "France",
      region: "Europe",
      price: "$4.50",
      badge: "Best seller",
      href: "/destinations/france",
      palette: "from-amber-100 via-slate-100 to-cyan-100",
      landmark: "Paris",
      imageUrl:
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80",
      imageAlt: "Eiffel Tower view in Paris, France"
    },
    {
      country: "Turkey",
      region: "Asia/Europe",
      price: "$4.80",
      href: "/destinations/turkey",
      palette: "from-orange-100 via-cyan-100 to-slate-200",
      landmark: "Istanbul",
      imageUrl:
        "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=900&q=80",
      imageAlt: "Istanbul skyline in Turkey"
    }
  ] satisfies Destination[],
  steps: [
    {
      title: "Choose your plan",
      description:
        "Pick a destination package that matches your trip length and data needs."
    },
    {
      title: "Install the eSIM",
      description:
        "Scan your QR code or follow the in-app instructions to add the plan to your phone."
    },
    {
      title: "Go online",
      description:
        "Turn on the eSIM when you arrive and use local mobile data without changing your number."
    }
  ] satisfies LandingStep[],
  benefits: [
    {
      title: "Instant setup",
      description:
        "Plan ahead or buy on the way. Digital delivery keeps the whole setup simple."
    },
    {
      title: "Local-rate data",
      description:
        "Avoid roaming shocks with destination-focused data packages and clear validity."
    },
    {
      title: "Support-ready",
      description:
        "The public site is prepared for support, contact, and help-center pages as the service grows."
    }
  ] satisfies Benefit[],
  faqs: [
    {
      question: "What is an eSIM?",
      answer:
        "An eSIM is a digital SIM profile installed on supported phones. It gives you mobile data without a physical SIM card."
    },
    {
      question: "Is my phone compatible?",
      answer:
        "Most recent iPhone, Samsung Galaxy, Google Pixel, and many other flagship devices support eSIM. Always check your device settings before buying."
    },
    {
      question: "Can I keep WhatsApp?",
      answer:
        "Yes. You can keep your usual phone number for WhatsApp while using Velocity eSIM for mobile data."
    },
    {
      question: "When should I activate it?",
      answer:
        "Install it before you travel, then activate mobile data when you reach your destination."
    }
  ] satisfies Faq[],
  supportLinks: [
    { label: "Support", href: "#faq" },
    { label: "Contact", href: "mailto:esim@uplisoft.com" },
    { label: "Policy", href: "/policy" },
    { label: "Terms", href: "/terms" }
  ] satisfies SupportLink[],
  appLinks: {
    android: {
      label: "Google Play",
      href: "https://play.google.com/store/apps/details?id=com.uplisoft.velocityesim"
    },
    ios: {
      label: "App Store",
      href: "https://apps.apple.com/am/app/velocityesim/id6768258284"
    }
  } satisfies Record<"android" | "ios", AppLink>
} as const;
