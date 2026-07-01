export type Destination = {
  country: string;
  region: string;
  price: string;
  badge?: string;
  palette: string;
  landmark: string;
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
      palette: "from-sky-200 via-cyan-100 to-slate-200",
      landmark: "NYC"
    },
    {
      country: "Japan",
      region: "Asia",
      price: "$5.20",
      palette: "from-rose-100 via-cyan-100 to-sky-200",
      landmark: "Fuji"
    },
    {
      country: "UK",
      region: "Europe",
      price: "$4.50",
      palette: "from-indigo-200 via-sky-100 to-cyan-100",
      landmark: "London"
    },
    {
      country: "France",
      region: "Europe",
      price: "$4.50",
      badge: "Best seller",
      palette: "from-amber-100 via-slate-100 to-cyan-100",
      landmark: "Paris"
    },
    {
      country: "Turkey",
      region: "Asia/Europe",
      price: "$4.80",
      palette: "from-orange-100 via-cyan-100 to-slate-200",
      landmark: "Istanbul"
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
  ] satisfies SupportLink[]
} as const;
