"use client";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  CreditCard,
  Download,
  Globe2,
  Headphones,
  HelpCircle,
  KeyRound,
  LifeBuoy,
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
  Signal,
  Smartphone,
  Sparkles,
  Trash2,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ComponentType } from "react";
import { supportEmail } from "@/lib/seo";
import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../SiteFooter";

type SupportCategory = {
  title: string;
  description: string;
  icon: ComponentType<{
    size?: number;
    className?: string;
    strokeWidth?: number;
    "aria-hidden"?: boolean;
  }>;
  guidance: string[];
};

type FaqItem = {
  question: string;
  answer: string;
  category: string;
};

const supportCategories: SupportCategory[] = [
  {
    title: "Getting started",
    description:
      "Use the app marketplace to choose a destination plan and sign in with Email OTP sign-in when you want to purchase or manage eSIMs.",
    icon: Zap,
    guidance: [
      "Browse country, regional, and global plans from the marketplace.",
      "Sign in with the one-time code sent to your email address.",
      "Open My eSIMs after purchase to view setup details and status.",
    ],
  },
  {
    title: "Installation & setup",
    description:
      "Install from the eSIM details screen with the guided setup, QR or manual setup, and device compatibility messaging shown in the app.",
    icon: Smartphone,
    guidance: [
      "Use direct iOS install when it is available on your device.",
      "Scan the QR code or copy the SM-DP+ address and activation code.",
      "Do not delete an installed eSIM unless support asks you to.",
    ],
  },
  {
    title: "Connection issues",
    description:
      "Fix common no-data problems by checking the active eSIM line, data roaming, network selection, and destination coverage.",
    icon: Signal,
    guidance: [
      "Set mobile data to the eSim2you line after arriving.",
      "Turn on data roaming for the eSIM line.",
      "Restart the phone and try manual network selection if automatic selection stalls.",
    ],
  },
  {
    title: "Plans, data & top-ups",
    description:
      "Check remaining data, validity, lifecycle status, and top-up availability from your active eSIM details in the app.",
    icon: Wifi,
    guidance: [
      "Open My eSIMs to see active, ready, expired, and history views.",
      "Use the remaining data panel when provider usage is available.",
      "Start a top-up only when the app shows one for the current eSIM.",
    ],
  },
  {
    title: "Payments & refunds",
    description:
      "eSim2you uses Pokpay checkout for purchases and top-ups, with card details handled outside the app.",
    icon: CreditCard,
    guidance: [
      "Complete Pokpay checkout, then return to eSim2you.",
      "If checkout is not complete, reopen the payment step and try again.",
      "For refund review, send the order details and whether the eSIM was installed or used.",
    ],
  },
  {
    title: "Account & security",
    description:
      "Manage app passcode, biometric unlock, legal links, billing notes, and account deletion from Profile.",
    icon: ShieldCheck,
    guidance: [
      "Use Profile to lock the app, change passcode, or manage biometric unlock.",
      "You can delete your account from Profile when signed in.",
      "Your session is tied to your verified email and protected on this device.",
    ],
  },
];

const faqs: FaqItem[] = [
  {
    category: "Getting started",
    question: "What does eSim2you sell?",
    answer:
      "eSim2you sells prepaid travel data plans for compatible eSIM devices. Choose a destination in the marketplace, pay securely, then manage installation from My eSIMs in the app.",
  },
  {
    category: "Account",
    question: "How do I sign in?",
    answer:
      "Enter your email address in the app and use the one-time code sent to you. After verification, the app links that email session so you can access purchases and eSIM details.",
  },
  {
    category: "Payment",
    question: "How does Pokpay checkout work?",
    answer:
      "When you buy a plan or an available top-up, eSim2you opens Pokpay checkout. Pokpay handles the payment details, and you return to the app so the purchase can be confirmed.",
  },
  {
    category: "Installation",
    question: "How do I install my eSIM?",
    answer:
      "Open the purchased eSIM in My eSIMs. The app shows the best available setup path for your device, including direct iOS install when supported, QR code setup, and manual SM-DP+ details.",
  },
  {
    category: "Installation",
    question: "Can I install the same eSIM more than once?",
    answer:
      "Most eSIM profiles can only be installed once. Keep the eSIM on your phone until your trip and plan are finished, because deleting it may make it impossible to reinstall.",
  },
  {
    category: "Connection",
    question: "Why does my eSIM have no internet?",
    answer:
      "Check that the eSIM line is enabled, mobile data is assigned to the eSIM, and data roaming is turned on. If it still does not connect, restart the phone and try manual network selection.",
  },
  {
    category: "Plans",
    question: "Where can I check remaining data?",
    answer:
      "Open My eSIMs and select the active eSIM. When provider usage is available, the app shows remaining data and progress for that plan.",
  },
  {
    category: "Plans",
    question: "Can I add more data with a top-up?",
    answer:
      "Some eSIMs support top-ups and some do not. If a top-up is available for your current eSIM, the app shows the option on the active eSIM details screen.",
  },
  {
    category: "Refunds",
    question: "Can I receive a refund?",
    answer:
      "Refund eligibility depends on the order state and whether the eSIM has been installed, activated, or used. Email support with your order details so the team can review the case.",
  },
  {
    category: "Account",
    question: "How do I delete my account?",
    answer:
      "Sign in, open Profile, and choose Delete account. The app explains what is removed and what records may be retained for payment, fraud-prevention, tax, or provider obligations.",
  },
];

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export function SupportPageClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filteredFaqs = useMemo(() => {
    const query = normalizeSearch(searchQuery);

    if (!query) return faqs;

    return faqs.filter((faq) => {
      return (
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

  const filteredCategories = useMemo(() => {
    const query = normalizeSearch(searchQuery);

    if (!query) return supportCategories;

    return supportCategories.filter((category) => {
      return (
        category.title.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query) ||
        category.guidance.some((item) => item.toLowerCase().includes(query))
      );
    });
  }, [searchQuery]);

  const hasSearchResults =
    filteredCategories.length > 0 || filteredFaqs.length > 0;

  return (
    <main className="min-h-screen overflow-hidden bg-surface text-onSurface">
      <Navbar />

      <SupportHero
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
      />

      <section className="relative px-5 pb-20 md:px-8">
        <div className="pointer-events-none absolute left-1/2 top-10 h-[420px] w-[70%] -translate-x-1/2 rounded-full bg-brandBlue/6 blur-[130px]" />

        <div className="relative mx-auto max-w-[1280px]">
          {hasSearchResults ? (
            <>
              {filteredCategories.length > 0 ? (
                <SupportCategories
                  categories={filteredCategories}
                  isSearching={Boolean(searchQuery.trim())}
                />
              ) : null}

              {filteredFaqs.length > 0 ? (
                <FaqSection
                  faqs={filteredFaqs}
                  onToggle={setOpenFaq}
                  openFaq={openFaq}
                />
              ) : null}
            </>
          ) : (
            <NoResults
              onClear={() => {
                setSearchQuery("");
                setOpenFaq(0);
              }}
              query={searchQuery}
            />
          )}

          <QuickHelp />

          <ContactSupport />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

type SupportHeroProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

function SupportHero({
  searchQuery,
  onSearchChange,
}: SupportHeroProps) {
  return (
    <section className="relative isolate overflow-hidden px-5 pb-28 pt-32 md:px-8 md:pb-32 md:pt-40">
      <div className="pointer-events-none absolute inset-0 -z-30 bg-[radial-gradient(circle_at_50%_15%,rgba(11,73,183,0.1),transparent_30%),radial-gradient(circle_at_18%_70%,rgba(9,195,190,0.06),transparent_27%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[44%] -z-20 h-[540px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brandBlue/10" />
      <div className="pointer-events-none absolute left-1/2 top-[44%] -z-20 h-[390px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brandBlue/8" />
      <div className="hero-grid pointer-events-none absolute inset-0 -z-10 opacity-[0.05]" />

      <div className="mx-auto max-w-[960px] text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-outline bg-surface px-4 py-2 shadow-brandCard backdrop-blur-xl">
          <LifeBuoy
            aria-hidden="true"
            className="text-brandBlue"
            size={15}
          />

          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brandBlue">
            eSim2you Help Center
          </span>
        </div>

        <h1 className="mt-6 font-display text-4xl font-black leading-[1.02] tracking-[-0.05em] text-brandInk sm:text-5xl lg:text-[64px]">
          Support for the app you use
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-onSurfaceVariant sm:text-base">
          Find help for Email OTP sign-in, Pokpay checkout, QR or
          manual setup, remaining data, top-up availability, refunds,
          and connection troubleshooting.
        </p>

        <div className="relative mx-auto mt-9 max-w-[720px]">
          <div className="rounded-full border border-outline bg-white p-2 shadow-brandCard">
            <label className="flex min-h-[64px] items-center gap-4 rounded-full bg-mist px-5 sm:px-6">
              <Search
                aria-hidden="true"
                className="shrink-0 text-brandBlue"
                size={22}
              />

              <span className="sr-only">Search the help center</span>

              <input
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-brandInk outline-none placeholder:text-onSurfaceVariant sm:text-base"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search sign-in, setup, Pokpay, top-up..."
                type="search"
                value={searchQuery}
              />

              {searchQuery ? (
                <button
                  aria-label="Clear search"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-onSurfaceVariant transition hover:bg-brandBlue/8 hover:text-brandInk"
                  onClick={() => onSearchChange("")}
                  type="button"
                >
                  <X aria-hidden="true" size={17} />
                </button>
              ) : (
                <span className="hidden rounded-full border border-outline bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-onSurfaceVariant sm:inline-flex">
                  Help
                </span>
              )}
            </label>
          </div>

          <p className="mt-4 text-xs text-onSurfaceVariant">
            Popular: install, no internet, Pokpay, refund, delete account
          </p>
        </div>
      </div>
    </section>
  );
}

type SupportCategoriesProps = {
  categories: SupportCategory[];
  isSearching: boolean;
};

function SupportCategories({
  categories,
  isSearching,
}: SupportCategoriesProps) {
  return (
    <div>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brandBlue">
            {isSearching ? "Matching topics" : "Browse by topic"}
          </p>

          <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.035em] text-brandInk">
            Find the help you need
          </h2>
        </div>

        <p className="max-w-md text-sm leading-6 text-onSurfaceVariant">
          These topics mirror current app flows, so the guidance matches
          what you can open in eSim2you today.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const Icon = category.icon;

          return (
            <article
              className="group relative overflow-hidden rounded-[22px] border border-outline bg-white p-6 shadow-brandCard transition duration-300 hover:-translate-y-1 hover:border-brandBlue/50"
              key={category.title}
            >
              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-brandBlue/8 blur-[60px]" />

              <div className="relative flex items-start justify-between gap-5">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[17px] border border-brandBlue/20 bg-brandBlue/8 text-brandBlue">
                  <Icon aria-hidden={true} size={26} strokeWidth={2} />
                </span>

                <span className="mt-2 rounded-full border border-outline bg-mist px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-onSurfaceVariant">
                  In app
                </span>
              </div>

              <h3 className="relative mt-6 font-display text-xl font-black text-brandInk">
                {category.title}
              </h3>

              <p className="relative mt-2 min-h-[90px] text-sm leading-6 text-onSurfaceVariant">
                {category.description}
              </p>

              <div className="relative mt-6 border-t border-outline pt-5">
                <ul className="space-y-3">
                  {category.guidance.map((item) => (
                    <li
                      className="flex items-start gap-3 text-sm leading-6 text-onSurfaceVariant"
                      key={item}
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-brandBlue"
                        size={16}
                      />

                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

type FaqSectionProps = {
  faqs: FaqItem[];
  openFaq: number | null;
  onToggle: (index: number | null) => void;
};

function FaqSection({
  faqs,
  openFaq,
  onToggle,
}: FaqSectionProps) {
  return (
    <section className="mt-24">
      <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <div>
          <div className="sticky top-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-outline bg-white px-4 py-2">
              <CircleHelp
                aria-hidden="true"
                className="text-brandBlue"
                size={14}
              />

              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-brandBlue">
                Common questions
              </span>
            </div>

            <h2 className="mt-5 font-display text-3xl font-black leading-tight tracking-[-0.04em] text-brandInk sm:text-4xl">
              Frequently asked questions
            </h2>

            <p className="mt-4 max-w-md text-sm leading-7 text-onSurfaceVariant">
              Quick answers about sign-in, setup, connectivity, Pokpay
              checkout, plan data, refunds, and account management.
            </p>

            <div className="mt-7 rounded-[18px] border border-outline bg-mist p-5">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-brandBlue/20 bg-brandBlue/8 text-brandBlue">
                  <MessageCircle aria-hidden="true" size={20} />
                </span>

                <div>
                  <p className="text-sm font-black text-brandInk">
                    Still have a question?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-onSurfaceVariant">
                    Email support with your order details, destination,
                    device model, and the screen where you are stuck.
                  </p>

                  <a
                    className="mt-3 inline-flex items-center gap-2 text-xs font-black text-brandBlue"
                    href="#contact-support"
                  >
                    Contact support

                    <ArrowRight aria-hidden="true" size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;

            return (
              <article
                className={[
                  "overflow-hidden rounded-[18px] border transition",
                  isOpen
                    ? "border-brandBlue/50 bg-brandBlue/4 shadow-brandCard"
                    : "border-outline bg-white hover:border-brandBlue/40",
                ].join(" ")}
                key={`${faq.category}-${faq.question}`}
              >
                <button
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left sm:px-6"
                  onClick={() => onToggle(isOpen ? null : index)}
                  type="button"
                >
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-brandBlue">
                      {faq.category}
                    </span>

                    <h3 className="mt-2 text-sm font-black text-brandInk sm:text-base">
                      {faq.question}
                    </h3>
                  </div>

                  <span
                    className={[
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition",
                      isOpen
                        ? "rotate-180 border-brandBlue/50 bg-brandBlue/10 text-brandBlue"
                        : "border-outline bg-mist text-onSurfaceVariant",
                    ].join(" ")}
                  >
                    <ChevronDown aria-hidden="true" size={17} />
                  </span>
                </button>

                <div
                  className={[
                    "grid transition-[grid-template-rows,opacity] duration-300",
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0",
                  ].join(" ")}
                >
                  <div className="overflow-hidden">
                    <p className="border-t border-outline px-5 py-5 text-sm leading-7 text-onSurfaceVariant sm:px-6">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function QuickHelp() {
  const items = [
    {
      icon: Download,
      title: "Installation guide",
      description:
        "Read the public setup guide, then use My eSIMs for your exact QR or manual setup details.",
      label: "View guide",
      href: "/guides/how-to-install-esim",
    },
    {
      icon: Globe2,
      title: "Browse destinations",
      description:
        "Compare available destination plans before you buy in the eSim2you app.",
      label: "Browse plans",
      href: "/destinations",
    },
    {
      icon: BookOpen,
      title: "How eSIM works",
      description:
        "Learn the basics of digital SIM profiles, compatibility, and travel data.",
      label: "Learn more",
      href: "/guides/what-is-an-esim",
    },
  ];

  return (
    <section className="mt-24">
      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brandBlue">
          Quick access
        </p>

        <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.035em] text-brandInk sm:text-4xl">
          Useful before you travel
        </h2>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <article
              className="group flex items-start gap-5 rounded-[20px] border border-outline bg-white p-5 shadow-brandCard transition hover:border-brandBlue/50"
              key={item.title}
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[15px] border border-brandBlue/20 bg-brandBlue/8 text-brandBlue">
                <Icon aria-hidden={true} size={22} />
              </span>

              <div>
                <h3 className="text-sm font-black text-brandInk">{item.title}</h3>

                <p className="mt-2 text-xs leading-5 text-onSurfaceVariant">
                  {item.description}
                </p>

                <Link
                  className="mt-4 inline-flex items-center gap-2 text-xs font-black text-brandBlue"
                  href={item.href}
                >
                  {item.label}

                  <ArrowRight
                    aria-hidden="true"
                    className="transition group-hover:translate-x-1"
                    size={14}
                  />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ContactSupport() {
  return (
    <section
      className="relative mt-24 overflow-hidden rounded-[30px] border border-outline bg-white px-6 py-10 shadow-brandGlow sm:px-9 lg:px-12 lg:py-12"
      id="contact-support"
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-brandBlue/10 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-0 left-[25%] h-48 w-48 rounded-full bg-brandTeal/8 blur-[80px]" />

      <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_0.85fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-outline bg-mist px-4 py-2">
            <Headphones
              aria-hidden="true"
              className="text-brandBlue"
              size={14}
            />

            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-brandBlue">
              Human support
            </span>
          </div>

          <h2 className="mt-5 max-w-xl font-display text-3xl font-black leading-tight tracking-[-0.04em] text-brandInk sm:text-4xl">
            Still need help with your eSIM?
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-onSurfaceVariant">
            Send your order details, destination, phone model, and a
            screenshot or description of the issue. We will help with
            installation, activation, connectivity, payments, or refund
            review.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              className="inline-flex min-h-12 flex-wrap items-center justify-center gap-3 rounded-full bg-gradient-to-r from-brandBlue via-[#0E86C0] to-brandTeal px-6 py-3 text-sm font-black text-white shadow-[0_14px_32px_rgba(11,73,183,0.28)] transition hover:-translate-y-0.5"
              href={`mailto:${supportEmail}`}
            >
              <Mail aria-hidden="true" size={17} />

              <span>Email support</span>
              <span className="text-xs text-white/80">esim@uplisoft.com</span>
            </a>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <SupportInfo
            description="Most questions are answered within one business day."
            icon={Clock3}
            title="Fast response"
          />

          <SupportInfo
            description="Help with installation, connection, plans, payments, and refunds."
            icon={LifeBuoy}
            title="Complete assistance"
          />

          <SupportInfo
            description="Account, passcode, biometric unlock, and payment details stay protected."
            icon={KeyRound}
            title="Secure by design"
          />

          <SupportInfo
            description="Profile includes a signed-in flow to delete your account from the app."
            icon={Trash2}
            title="Account control"
          />
        </div>
      </div>
    </section>
  );
}

type SupportInfoProps = {
  title: string;
  description: string;
  icon: ComponentType<{
    size?: number;
    className?: string;
    strokeWidth?: number;
    "aria-hidden"?: boolean;
  }>;
};

function SupportInfo({
  title,
  description,
  icon: Icon,
}: SupportInfoProps) {
  return (
    <div className="flex items-start gap-4 rounded-[17px] border border-[#28648c]/65 bg-[#071b31]/72 p-4 backdrop-blur-xl">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border border-[#287ba8] bg-[#092842] text-[#52baff]">
        <Icon aria-hidden={true} size={18} />
      </span>

      <div>
        <p className="text-sm font-black">{title}</p>

        <p className="mt-1 text-xs leading-5 text-[#8398ae]">
          {description}
        </p>
      </div>
    </div>
  );
}

type NoResultsProps = {
  query: string;
  onClear: () => void;
};

function NoResults({ query, onClear }: NoResultsProps) {
  return (
    <div className="mx-auto max-w-2xl rounded-[26px] border border-[#1d4568] bg-[#061528] px-6 py-14 text-center shadow-[0_24px_70px_rgba(0,0,0,0.25)]">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-[20px] border border-[#216693] bg-[#08223c] text-[#48b2ff]">
        <HelpCircle aria-hidden="true" size={29} />
      </span>

      <h2 className="mt-6 font-display text-2xl font-black">
        No support results found
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#8398ae]">
        We could not find anything matching “{query}”. Try a shorter
        search or browse all support topics.
      </p>

      <button
        className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#168cff] px-6 text-sm font-black"
        onClick={onClear}
        type="button"
      >
        <Sparkles aria-hidden="true" size={16} />

        View all help topics
      </button>
    </div>
  );
}
