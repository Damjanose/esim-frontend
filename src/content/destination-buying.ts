import type { SeoPageLink } from "./seo-pages";

export type BuyingCheck = {
  question: string;
  answer: string;
  link?: SeoPageLink;
};

/**
 * The "Before you buy" checks on every /esim/<slug> page: phone support, your
 * number, hotspot, top-ups and refunds, the terms travelers compare plans on.
 * Every answer must stay true for every package: the catalog carries no
 * per-plan network or hotspot data, so those answers point to support instead
 * of making a claim. Refund wording mirrors legal.ts; top-ups mirror support.
 */
export function destinationBuyingChecks(countryName: string): BuyingCheck[] {
  return [
    {
      question: "Will my phone work with this eSIM?",
      answer:
        `Your phone needs to support eSIM and be carrier-unlocked. Most iPhone XS and later, Google Pixel 3 and later, ` +
        `and Samsung Galaxy S20 and later models do. Check for an "Add eSIM" option in your settings before you buy a ${countryName} plan.`,
      link: { label: "Which phones support eSIM?", href: "/travel/esim-compatible-phones" }
    },
    {
      question: "Do I keep my phone number and WhatsApp?",
      answer:
        "Yes, on a dual-SIM phone. The travel eSIM handles mobile data while your usual SIM stays on for calls and texts. " +
        "WhatsApp, iMessage and FaceTime keep your number because they run over data. Calls and texts on your home SIM may still cost roaming fees from your carrier.",
      link: { label: "Keep your normal number with eSIM", href: "/travel/keep-your-number-with-esim" }
    },
    {
      question: "Can I use it as a hotspot?",
      answer:
        "Hotspot and tethering support depends on the plan and the local network. If you need to share data with a laptop or tablet, " +
        "ask our support chat before you buy and we will check the plan for you.",
      link: { label: "Contact support", href: "/support" }
    },
    {
      question: "Can I top up if I run out of data?",
      answer:
        "Some eSIMs support top-ups and some do not. If a top-up is available for your eSIM, it shows on the eSIM's details in your account, " +
        "so you can add data without installing a new eSIM."
    },
    {
      question: "What if the eSIM does not work?",
      answer:
        "Plans are prepaid and non-refundable once activated or delivered, unless the plan's terms say otherwise. " +
        "If the eSIM will not install or connect, contact support with your order details and whether it was installed, and we will review a fix or refund.",
      link: { label: "Help and refunds", href: "/support" }
    }
  ];
}
