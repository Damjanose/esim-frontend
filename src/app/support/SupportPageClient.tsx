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
import { Button, LinkButton } from "../components/Button";
import { resolveButtonClasses } from "../components/buttonClasses";
import {
  CONTENT_EYEBROW,
  CONTENT_GUTTER,
  CONTENT_H1,
  CONTENT_SECTION_H2,
  CONTENT_TEXT_LINK,
  CONTENT_TOP,
} from "../components/contentClasses";
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
      "Choose a destination and plan on the website, then sign in with your email when you are ready to purchase or manage your eSIM.",
    icon: Zap,
    guidance: [
      "Browse country, regional, and global plans before you travel.",
      "Use the one-time code sent to your email address to access your account.",
      "Open your account after purchase to view setup details and status.",
    ],
  },
  {
    title: "Installation & setup",
    description:
      "Install from your order with the QR code or manual setup details, and check device compatibility before you buy.",
    icon: Smartphone,
    guidance: [
      "Install over Wi-Fi before your trip whenever possible.",
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
      "Set mobile data to the eSIM2you line after arriving.",
      "Turn on data roaming for the eSIM line.",
      "Restart the phone and try manual network selection if automatic selection stalls.",
    ],
  },
  {
    title: "Plans, data & top-ups",
    description:
      "Check remaining data, validity, plan status, and top-up availability from your account.",
    icon: Wifi,
    guidance: [
      "Open your account to see active, ready, expired, and history views.",
      "Use the remaining data panel when provider usage is available.",
      "Start a top-up only when your account shows one for the current eSIM.",
    ],
  },
  {
    title: "Payments & refunds",
    description:
      "Pay securely during checkout. If a purchase does not complete or you need a refund review, contact support with your order details.",
    icon: CreditCard,
    guidance: [
      "Complete the secure checkout, then return to eSIM2you.",
      "If checkout is not complete, reopen the payment step and try again.",
      "For refund review, send the order details and whether the eSIM was installed or used.",
    ],
  },
  {
    title: "Account & security",
    description:
      "Manage your signed-in account, billing details, legal preferences, and account deletion from Profile.",
    icon: ShieldCheck,
    guidance: [
      "Use Profile to review your account and billing details.",
      "You can delete your account from Profile when signed in.",
      "Your session is tied to your verified email and protected by secure account cookies.",
    ],
  },
];

const faqs: FaqItem[] = [
  {
    category: "Getting started",
    question: "What does eSIM2you sell?",
    answer:
      "eSIM2you sells prepaid travel data plans for compatible eSIM devices. Choose a destination in the marketplace, pay securely, then manage installation from your account.",
  },
  {
    category: "Account",
    question: "How do I sign in on the website?",
    answer:
      "Enter your email address on the website and use the one-time code sent to you. After verification, you can access purchases and eSIM details.",
  },
  {
    category: "Payment",
    question: "How does checkout work?",
    answer:
      "When you buy a plan or an available top-up, complete the secure checkout and return to eSIM2you. Your purchase is confirmed against your account after payment.",
  },
  {
    category: "Installation",
    question: "How do I install my eSIM?",
    answer:
      "Open the purchased eSIM in your account. Use the QR code or copy the SM-DP+ address and activation code shown for your device.",
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
      "Open your account and select the active eSIM. When provider usage is available, the site shows remaining data and progress for that plan.",
  },
  {
    category: "Plans",
    question: "Can I add more data with a top-up?",
    answer:
      "Some eSIMs support top-ups and some do not. If a top-up is available for your current eSIM, your account shows the option on the active eSIM details screen.",
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
      "Sign in, open Profile, and choose Delete account. The site explains what is removed and what records may be retained for payment, fraud-prevention, tax, or provider obligations.",
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
    <main className="min-h-screen overflow-x-clip bg-surface text-onSurface">
      <Navbar />

      <SupportHero
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
      />

      <section className={`pb-16 md:pb-24 ${CONTENT_GUTTER}`}>
        <div className="mx-auto max-w-6xl">
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

/** Small caps pill above a section heading (icon + label). */
const EYEBROW_PILL =
  "inline-flex items-center gap-2 rounded-full border border-outline/70 bg-surface px-4 py-2";

/** Icon tile shared by the topic, quick-help and info cards. */
const ICON_TILE =
  "grid shrink-0 place-items-center rounded-[14px] bg-brandBlue/10 text-brandBlue";

type SupportHeroProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

function SupportHero({
  searchQuery,
  onSearchChange,
}: SupportHeroProps) {
  return (
    <section
      className={`relative isolate mb-10 overflow-hidden rounded-b-[24px] bg-surfaceBright pb-12 md:mb-14 md:pb-16 ${CONTENT_GUTTER} ${CONTENT_TOP}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[360px] w-[720px] max-w-none -translate-x-1/2 rounded-full bg-brandBlue/10 blur-[120px]"
      />

      <div className="mx-auto max-w-[960px] pt-4 text-center lg:pt-8">
        <div className={EYEBROW_PILL}>
          <LifeBuoy
            aria-hidden="true"
            className="text-brandBlue"
            size={15}
          />

          <span className={CONTENT_EYEBROW}>
            eSIM2you Help Center
          </span>
        </div>

        <h1 className={`mt-5 ${CONTENT_H1}`}>
          Help for your eSIM journey
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-onSurfaceVariant">
          Find help for sign-in, checkout, QR or manual setup, remaining data,
          top-ups, refunds, and connection troubleshooting.
        </p>

        <div className="relative mx-auto mt-8 max-w-[720px]">
          <div className="rounded-[20px] border border-outline bg-surface p-2 shadow-brandCard">
            <label className="flex min-h-[60px] items-center gap-3 rounded-[15px] bg-outline/10 px-4">
              <Search
                aria-hidden="true"
                className="shrink-0 text-brandBlue"
                size={20}
              />

              <span className="sr-only">Search the help center</span>

              <input
                autoComplete="off"
                className="h-11 min-w-0 flex-1 bg-transparent text-base font-semibold text-brandInk outline-none placeholder:text-onSurfaceVariant"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search sign-in, setup, checkout, top-up..."
                type="search"
                value={searchQuery}
              />

              {searchQuery ? (
                <button
                  aria-label="Clear search"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-onSurfaceVariant transition hover:bg-brandBlue/10 hover:text-brandInk"
                  onClick={() => onSearchChange("")}
                  type="button"
                >
                  <X aria-hidden="true" size={18} />
                </button>
              ) : (
                <span className="hidden rounded-full border border-outline/70 bg-surface px-3 py-1.5 text-label-caps uppercase text-onSurfaceVariant sm:inline-flex">
                  Help
                </span>
              )}
            </label>
          </div>

          <p className="mt-4 text-body-sm text-onSurfaceVariant">
            Popular: install, no internet, checkout, refund, delete account
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={CONTENT_EYEBROW}>
            {isSearching ? "Matching topics" : "Browse by topic"}
          </p>

          <h2 className={`mt-2 ${CONTENT_SECTION_H2}`}>
            Find the help you need
          </h2>
        </div>

        <p className="max-w-md text-body-md text-onSurfaceVariant">
          These topics mirror current website flows, so the guidance matches
          what you can do in eSIM2you today.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const Icon = category.icon;

          return (
            <article
              className="rounded-[20px] border border-outline/70 bg-surface p-5 shadow-brandCard transition hover:border-brandBlue/50 sm:p-6"
              key={category.title}
            >
              <div className="flex items-start justify-between gap-5">
                <span className={`h-12 w-12 ${ICON_TILE}`}>
                  <Icon aria-hidden={true} size={24} strokeWidth={2} />
                </span>

                <span className="mt-1 rounded-full border border-outline/70 bg-surfaceBright px-3 py-1.5 text-label-caps uppercase text-onSurfaceVariant">
                  On the website
                </span>
              </div>

              <h3 className="mt-5 font-display text-headline-md font-black text-brandInk">
                {category.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-onSurfaceVariant md:min-h-[90px]">
                {category.description}
              </p>

              <div className="mt-5 border-t border-outline/70 pt-5">
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
    <section className="mt-16 md:mt-24">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start lg:gap-16">
        <div className="lg:sticky lg:top-6">
          <div className={EYEBROW_PILL}>
            <CircleHelp
              aria-hidden="true"
              className="text-brandBlue"
              size={14}
            />

            <span className={CONTENT_EYEBROW}>
              Common questions
            </span>
          </div>

          <h2 className={`mt-4 ${CONTENT_SECTION_H2}`}>
            Frequently asked questions
          </h2>

          <p className="mt-3 max-w-md text-body-md text-onSurfaceVariant">
            Quick answers about sign-in, setup, connectivity, checkout, plan data,
            refunds, and account management.
          </p>

          <div className="mt-6 rounded-[18px] border border-outline/70 bg-surfaceBright p-5">
            <div className="flex items-start gap-4">
              <span className={`h-11 w-11 ${ICON_TILE}`}>
                <MessageCircle aria-hidden="true" size={20} />
              </span>

              <div>
                <p className="text-sm font-black text-brandInk">
                  Still have a question?
                </p>

                <p className="mt-1 text-body-sm text-onSurfaceVariant">
                  Chat with us or email support with your order details,
                  destination, device model, and the screen where you are stuck.
                </p>

                <a
                  className={`mt-1 text-sm ${CONTENT_TEXT_LINK}`}
                  href="#contact-support"
                >
                  Contact support

                  <ArrowRight aria-hidden="true" size={14} />
                </a>
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
                  "overflow-hidden rounded-[16px] border transition",
                  isOpen
                    ? "border-brandBlue/40 bg-brandBlue/5"
                    : "border-outline/70 bg-surface hover:border-brandBlue/40",
                ].join(" ")}
                key={`${faq.category}-${faq.question}`}
              >
                <button
                  aria-expanded={isOpen}
                  className="flex min-h-14 w-full items-center justify-between gap-5 px-5 py-4 text-left sm:px-6"
                  onClick={() => onToggle(isOpen ? null : index)}
                  type="button"
                >
                  <div>
                    <span className="text-label-caps uppercase text-brandBlue">
                      {faq.category}
                    </span>

                    <h3 className="mt-1 text-title-sm font-black text-brandInk">
                      {faq.question}
                    </h3>
                  </div>

                  <span
                    className={[
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full border motion-safe:transition",
                      isOpen
                        ? "rotate-180 border-brandBlue/40 bg-brandBlue/10 text-brandBlue"
                        : "border-outline/70 bg-surfaceBright text-onSurfaceVariant",
                    ].join(" ")}
                  >
                    <ChevronDown aria-hidden="true" size={17} />
                  </span>
                </button>

                <div
                  className={[
                    "grid motion-safe:transition-[grid-template-rows,opacity] motion-safe:duration-300",
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0",
                  ].join(" ")}
                >
                  <div className="overflow-hidden">
                    <p className="border-t border-outline/70 px-5 py-5 text-sm leading-7 text-onSurfaceVariant sm:px-6">
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
        "Read the public setup guide, then use your account for exact QR or manual setup details.",
      label: "View guide",
      href: "/travel/how-to-install-esim",
    },
    {
      icon: Globe2,
      title: "Browse destinations",
        description:
        "Compare available destination plans before you buy on the eSIM2you website.",
      label: "Browse plans",
      href: "/destinations",
    },
    {
      icon: BookOpen,
      title: "How eSIM works",
      description:
        "Learn the basics of digital SIM profiles, compatibility, and travel data.",
      label: "Learn more",
      href: "/travel/what-is-an-esim",
    },
  ];

  return (
    <section className="mt-16 md:mt-24">
      <div className="text-center">
        <p className={CONTENT_EYEBROW}>
          Quick access
        </p>

        <h2 className={`mt-2 ${CONTENT_SECTION_H2}`}>
          Useful before you travel
        </h2>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <article
              className="group flex items-start gap-4 rounded-[20px] border border-outline/70 bg-surface p-5 shadow-brandCard transition hover:border-brandBlue/50"
              key={item.title}
            >
              <span className={`h-12 w-12 ${ICON_TILE}`}>
                <Icon aria-hidden={true} size={22} />
              </span>

              <div className="min-w-0">
                <h3 className="text-title-sm font-black text-brandInk">{item.title}</h3>

                <p className="mt-1 text-body-sm text-onSurfaceVariant">
                  {item.description}
                </p>

                <Link
                  className={`mt-1 text-sm ${CONTENT_TEXT_LINK}`}
                  href={item.href}
                >
                  {item.label}

                  <ArrowRight
                    aria-hidden="true"
                    className="motion-safe:transition group-hover:translate-x-1"
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
      className="relative mt-16 overflow-hidden rounded-[24px] border border-outline/70 bg-surface px-5 py-8 shadow-brandCard sm:px-9 md:mt-24 lg:px-12 lg:py-12"
      id="contact-support"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-brandBlue/10 blur-[90px]"
      />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_0.85fr] lg:gap-10">
        <div className="min-w-0">
          <div className={EYEBROW_PILL}>
            <Headphones
              aria-hidden="true"
              className="text-brandBlue"
              size={14}
            />

            <span className={CONTENT_EYEBROW}>
              Human support
            </span>
          </div>

          <h2 className={`mt-4 max-w-xl ${CONTENT_SECTION_H2}`}>
            Still need help with your eSIM?
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-7 text-onSurfaceVariant">
            Send your order details, destination, phone model, and a
            screenshot or description of the issue. We will help with
            installation, activation, connectivity, payments, or refund
            review.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {/* The page's one gradient CTA. It wraps on narrow phones, so it grows instead of clipping. */}
            <LinkButton className="!h-auto min-h-[54px] max-w-full flex-wrap py-2" href={`mailto:${supportEmail}`} size="lg">
              <Mail aria-hidden="true" size={17} />

              <span>Email support</span>
              <span className="break-all text-xs text-surface/80">esim2you@uplisoft.com</span>
            </LinkButton>

            {/* Signed-out visitors land on /signin first (middleware guards /profile). */}
            <Link
              className={`${resolveButtonClasses({ variant: "tint", size: "lg" })} !h-auto min-h-[54px] max-w-full`}
              href="/profile/support"
            >
              <MessageCircle aria-hidden="true" size={17} />
              <span>Chat with support</span>
            </Link>
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
            description="Your account and payment details stay protected with secure sign-in."
            icon={KeyRound}
            title="Secure by design"
          />

          <SupportInfo
            description="Profile includes a signed-in flow to delete your account from the website."
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
    <div className="flex items-start gap-4 rounded-[16px] border border-outline/70 bg-surfaceBright p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-surface text-brandBlue">
        <Icon aria-hidden={true} size={18} />
      </span>

      <div className="min-w-0">
        <p className="text-sm font-black text-brandInk">{title}</p>

        <p className="mt-1 text-body-sm text-onSurfaceVariant">
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
    <div className="mx-auto max-w-2xl rounded-[24px] border border-outline/70 bg-surfaceBright px-5 py-12 text-center sm:px-6">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-[20px] bg-surface text-brandBlue">
        <HelpCircle aria-hidden="true" size={29} />
      </span>

      <h2 className="mt-6 font-display text-headline-md font-black text-brandInk">
        No support results found
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-onSurfaceVariant">
        We could not find anything matching “{query}”. Try a shorter
        search or browse all support topics.
      </p>

      {/* Flat: Email support below stays the page's one gradient CTA. */}
      <Button className="mt-6" onClick={onClear} size="md" variant="tint">
        <Sparkles aria-hidden="true" size={16} />

        View all help topics
      </Button>
    </div>
  );
}
