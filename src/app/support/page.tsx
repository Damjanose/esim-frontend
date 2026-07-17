"use client";

import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Clock3,
  CreditCard,
  Download,
  Globe2,
  Headphones,
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
  Signal,
  Smartphone,
  Sparkles,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import {
  useMemo,
  useState,
  type ComponentType,
} from "react";
import { Navbar } from "../components/Navbar";

type SupportCategory = {
  title: string;
  description: string;
  icon: ComponentType<{
    size?: number;
    className?: string;
    "aria-hidden"?: boolean;
  }>;
  articles: string[];
};

type FaqItem = {
  question: string;
  answer: string;
  category: string;
};

const supportCategories: SupportCategory[] = [
  {
    title: "Getting Started",
    description:
      "Everything you need to purchase, install, and activate your first eSIM.",
    icon: Zap,
    articles: [
      "How to choose the right eSIM plan",
      "How to install your eSIM",
      "When should I activate my eSIM?",
    ],
  },
  {
    title: "Installation & Setup",
    description:
      "Step-by-step setup help for iPhone, Android, and other supported devices.",
    icon: Smartphone,
    articles: [
      "Install an eSIM on iPhone",
      "Install an eSIM on Android",
      "Manual installation instructions",
    ],
  },
  {
    title: "Connection Issues",
    description:
      "Troubleshoot mobile data, signal, roaming, and network connection problems.",
    icon: Signal,
    articles: [
      "My eSIM has no internet connection",
      "How to enable data roaming",
      "Why is my network signal weak?",
    ],
  },
  {
    title: "Plans & Data",
    description:
      "Understand your data balance, plan validity, top-ups, and usage limits.",
    icon: Wifi,
    articles: [
      "How to check remaining data",
      "What happens when my data runs out?",
      "Can I extend my eSIM plan?",
    ],
  },
  {
    title: "Payments & Refunds",
    description:
      "Get help with payments, billing, failed orders, and refund eligibility.",
    icon: CreditCard,
    articles: [
      "My payment was not completed",
      "Where can I find my receipt?",
      "Refund policy and eligibility",
    ],
  },
  {
    title: "Account & Security",
    description:
      "Manage your profile, devices, purchases, and account security settings.",
    icon: ShieldCheck,
    articles: [
      "How to access my purchased eSIMs",
      "Update account information",
      "Secure your Velocity account",
    ],
  },
];

const faqs: FaqItem[] = [
  {
    category: "Getting Started",
    question: "What is an eSIM?",
    answer:
      "An eSIM is a digital SIM that lets you activate a mobile data plan without inserting a physical SIM card. After purchasing a plan, you install it directly on your compatible phone.",
  },
  {
    category: "Getting Started",
    question: "When should I install my eSIM?",
    answer:
      "You can install your eSIM before travelling while you still have a stable internet connection. Activate the mobile data line when you arrive at your destination unless your plan starts immediately after installation.",
  },
  {
    category: "Installation",
    question: "Can I install the same eSIM more than once?",
    answer:
      "Most eSIMs can only be installed once. Do not remove the eSIM from your device until your trip and plan have finished. If you delete it, you may not be able to reinstall it.",
  },
  {
    category: "Connection",
    question: "Why does my eSIM show no service?",
    answer:
      "Make sure the eSIM line is enabled, mobile data is assigned to the eSIM, and data roaming is turned on. Restart your device and try selecting the supported network manually if automatic selection does not work.",
  },
  {
    category: "Plans",
    question: "Can I use my eSIM for calls and SMS?",
    answer:
      "Most Velocity travel eSIM plans are data-only. You can still make calls and send messages through internet-based apps such as WhatsApp, FaceTime, Telegram, or Messenger.",
  },
  {
    category: "Plans",
    question: "Can I keep my normal SIM active?",
    answer:
      "Yes. On supported dual-SIM devices, your normal SIM can remain active for calls and messages while the Velocity eSIM provides mobile data.",
  },
  {
    category: "Payments",
    question: "How quickly will I receive my eSIM?",
    answer:
      "Your eSIM installation details are normally available immediately after a successful payment. You can access them from your account and confirmation email.",
  },
  {
    category: "Refunds",
    question: "Can I receive a refund?",
    answer:
      "Refund eligibility depends on whether the eSIM has already been installed, activated, or used. Contact support with your order information so the team can review your case.",
  },
];

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filteredFaqs = useMemo(() => {
    const query = normalizeSearch(searchQuery);

    if (!query) {
      return faqs;
    }

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

    if (!query) {
      return supportCategories;
    }

    return supportCategories.filter((category) => {
      return (
        category.title.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query) ||
        category.articles.some((article) =>
          article.toLowerCase().includes(query),
        )
      );
    });
  }, [searchQuery]);

  const hasSearchResults =
    filteredCategories.length > 0 || filteredFaqs.length > 0;

  return (
    <main className="min-h-screen overflow-hidden bg-[#020916] text-white">
      <Navbar />

      <SupportHero
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
      />

      <section className="relative px-5 pb-20 md:px-8">
        <div className="pointer-events-none absolute left-1/2 top-10 h-[420px] w-[70%] -translate-x-1/2 rounded-full bg-[#075eff]/10 blur-[130px]" />

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
      <div className="pointer-events-none absolute inset-0 -z-30 bg-[radial-gradient(circle_at_50%_15%,rgba(20,117,255,0.23),transparent_30%),radial-gradient(circle_at_18%_70%,rgba(0,169,255,0.09),transparent_27%),linear-gradient(180deg,#031126_0%,#020916_72%,#020916_100%)]" />

      <div className="pointer-events-none absolute left-1/2 top-[44%] -z-20 h-[540px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#166ee7]/15" />

      <div className="pointer-events-none absolute left-1/2 top-[44%] -z-20 h-[390px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#166ee7]/10" />

      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06] [background-image:linear-gradient(rgba(51,147,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(51,147,255,0.6)_1px,transparent_1px)] [background-size:70px_70px]" />

      <div className="mx-auto max-w-[960px] text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#205785]/75 bg-[#071a30]/80 px-4 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <LifeBuoy
            aria-hidden="true"
            className="text-[#45afff]"
            size={15}
          />

          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4eb5ff]">
            Velocity Help Center
          </span>
        </div>

        <h1 className="mt-6 font-display text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-[64px]">
          How can we help you?
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#91a4ba] sm:text-base">
          Find installation guides, troubleshooting steps, plan
          information, and answers to the most common eSIM questions.
        </p>

        <div className="relative mx-auto mt-9 max-w-[720px]">
          <div className="rounded-full border border-[#2874a8]/90 bg-[#06162a]/90 p-2 shadow-[0_28px_80px_rgba(0,0,0,0.45),0_0_40px_rgba(23,132,255,0.12)] backdrop-blur-2xl">
            <label className="flex min-h-[64px] items-center gap-4 rounded-full bg-[#091b31] px-5 sm:px-6">
              <Search
                aria-hidden="true"
                className="shrink-0 text-[#46afff]"
                size={22}
              />

              <span className="sr-only">
                Search the help center
              </span>

              <input
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-[#72879e] sm:text-base"
                onChange={(event) =>
                  onSearchChange(event.target.value)
                }
                placeholder="Search installation, activation, payments..."
                type="search"
                value={searchQuery}
              />

              {searchQuery ? (
                <button
                  aria-label="Clear search"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#71879e] transition hover:bg-white/5 hover:text-white"
                  onClick={() => onSearchChange("")}
                  type="button"
                >
                  <X aria-hidden="true" size={17} />
                </button>
              ) : (
                <span className="hidden rounded-full border border-[#244b70] bg-[#0a223b] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#7290ac] sm:inline-flex">
                  Help
                </span>
              )}
            </label>
          </div>

          <p className="mt-4 text-xs text-[#60758c]">
            Popular: installation, no internet, activation, refund
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mt-7">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#289fff]">
            {isSearching ? "Matching topics" : "Browse by topic"}
          </p>

          <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.035em]">
            Find the help you need
          </h2>
        </div>

        <p className="max-w-md text-sm leading-6 text-[#778ca3]">
          Explore guides and solutions grouped by the most common
          support topics.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const Icon = category.icon;

          return (
            <article
              className="group relative overflow-hidden rounded-[22px] border border-[#1d4567]/80 bg-[linear-gradient(145deg,rgba(8,26,48,0.98),rgba(4,15,29,0.98))] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-1 hover:border-[#208ce0]/80"
              key={category.title}
            >
              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#087cff]/10 blur-[60px]" />

              <div className="relative flex items-start justify-between gap-5">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[17px] border border-[#1b79b2] bg-[#082642] text-[#45b5ff] shadow-[0_0_28px_rgba(20,147,255,0.13)]">
                  <Icon
                    aria-hidden="true"
                    size={26}
                    strokeWidth={2}
                  />
                </span>

                <ArrowRight
                  aria-hidden="true"
                  className="mt-2 text-[#4b6680] transition duration-300 group-hover:translate-x-1 group-hover:text-[#4eb5ff]"
                  size={19}
                />
              </div>

              <h3 className="relative mt-6 font-display text-xl font-black">
                {category.title}
              </h3>

              <p className="relative mt-2 min-h-[66px] text-sm leading-6 text-[#8296ac]">
                {category.description}
              </p>

              <div className="relative mt-6 border-t border-[#173752] pt-5">
                <ul className="space-y-3">
                  {category.articles.map((article) => (
                    <li key={article}>
                      <button
                        className="flex w-full items-start gap-3 text-left text-sm text-[#a1b0c0] transition hover:text-white"
                        type="button"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#38aaff]" />

                        <span>{article}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className="relative mt-6 inline-flex items-center gap-2 text-xs font-black text-[#48b2ff] transition hover:text-[#7ac8ff]"
                type="button"
              >
                View all articles

                <ArrowRight aria-hidden="true" size={15} />
              </button>
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
            <div className="inline-flex items-center gap-2 rounded-full border border-[#204c71] bg-[#07182b] px-4 py-2">
              <CircleHelp
                aria-hidden="true"
                className="text-[#45afff]"
                size={14}
              />

              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#48adff]">
                Common questions
              </span>
            </div>

            <h2 className="mt-5 font-display text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">
              Frequently asked questions
            </h2>

            <p className="mt-4 max-w-md text-sm leading-7 text-[#8296ac]">
              Quick answers about eSIM installation, activation,
              connectivity, payments, and account management.
            </p>

            <div className="mt-7 rounded-[18px] border border-[#1d4262] bg-[#061528] p-5">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-[#1e638e] bg-[#08233d] text-[#43b2ff]">
                  <MessageCircle
                    aria-hidden="true"
                    size={20}
                  />
                </span>

                <div>
                  <p className="text-sm font-black">
                    Still have a question?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#758ba2]">
                    Our support team is ready to help with your
                    order or connection.
                  </p>

                  <a
                    className="mt-3 inline-flex items-center gap-2 text-xs font-black text-[#4ab4ff]"
                    href="#contact-support"
                  >
                    Contact support

                    <ArrowRight
                      aria-hidden="true"
                      size={14}
                    />
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
                    ? "border-[#2689c7] bg-[#08203a] shadow-[0_18px_45px_rgba(0,70,160,0.14)]"
                    : "border-[#1c405f] bg-[#061427] hover:border-[#286b98]",
                ].join(" ")}
                key={`${faq.category}-${faq.question}`}
              >
                <button
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left sm:px-6"
                  onClick={() =>
                    onToggle(isOpen ? null : index)
                  }
                  type="button"
                >
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#399eef]">
                      {faq.category}
                    </span>

                    <h3 className="mt-2 text-sm font-black sm:text-base">
                      {faq.question}
                    </h3>
                  </div>

                  <span
                    className={[
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition",
                      isOpen
                        ? "rotate-180 border-[#2d8fca] bg-[#0c3153] text-[#55b9ff]"
                        : "border-[#244b69] bg-[#081a2d] text-[#7290a8]",
                    ].join(" ")}
                  >
                    <ChevronDown
                      aria-hidden="true"
                      size={17}
                    />
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
                    <p className="border-t border-[#1a4464] px-5 py-5 text-sm leading-7 text-[#98aabd] sm:px-6">
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
      title: "Installation guides",
      description:
        "Follow device-specific instructions for iOS and Android.",
      label: "View guides",
    },
    {
      icon: Globe2,
      title: "Check compatibility",
      description:
        "Confirm that your phone supports eSIM before purchasing.",
      label: "Check device",
    },
    {
      icon: BookOpen,
      title: "How eSIM works",
      description:
        "Learn how digital SIM technology keeps you connected abroad.",
      label: "Learn more",
    },
  ];

  return (
    <section className="mt-24">
      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#289fff]">
          Quick access
        </p>

        <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.035em] sm:text-4xl">
          Useful before you travel
        </h2>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <article
              className="group flex items-start gap-5 rounded-[20px] border border-[#1e4363] bg-[#061427]/90 p-5 transition hover:border-[#247db7] hover:bg-[#071a30]"
              key={item.title}
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[15px] border border-[#1d628f] bg-[#08213b] text-[#45b4ff]">
                <Icon aria-hidden="true" size={22} />
              </span>

              <div>
                <h3 className="text-sm font-black">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs leading-5 text-[#7e92a8]">
                  {item.description}
                </p>

                <button
                  className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#45afff]"
                  type="button"
                >
                  {item.label}

                  <ArrowRight
                    aria-hidden="true"
                    className="transition group-hover:translate-x-1"
                    size={14}
                  />
                </button>
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
      className="relative mt-24 overflow-hidden rounded-[30px] border border-[#1d5580] bg-[linear-gradient(125deg,#07182c_0%,#092b4d_55%,#061427_100%)] px-6 py-10 shadow-[0_32px_85px_rgba(0,0,0,0.34)] sm:px-9 lg:px-12 lg:py-12"
      id="contact-support"
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#087fff]/20 blur-[90px]" />

      <div className="pointer-events-none absolute bottom-0 left-[25%] h-48 w-48 rounded-full bg-[#00b8ff]/10 blur-[80px]" />

      <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_0.85fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2a79aa] bg-[#092742] px-4 py-2">
            <Headphones
              aria-hidden="true"
              className="text-[#55bdff]"
              size={14}
            />

            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#63c2ff]">
              Human support
            </span>
          </div>

          <h2 className="mt-5 max-w-xl font-display text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">
            Still need help with your eSIM?
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-[#9aadc0]">
            Send us your order details and a description of the issue.
            Our support team will help you install, activate, or
            troubleshoot your eSIM.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              className="inline-flex h-12 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#1857ff] to-[#29c8ff] px-6 text-sm font-black shadow-[0_14px_32px_rgba(18,104,255,0.3)] transition hover:-translate-y-0.5"
              href="mailto:support@velocityesim.com"
            >
              <Mail aria-hidden="true" size={17} />

              Email support
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
            description="Help with installation, connection, plans, and payments."
            icon={LifeBuoy}
            title="Complete assistance"
          />

          <SupportInfo
            description="Your account and payment information remain protected."
            icon={ShieldCheck}
            title="Safe and secure"
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
        <Icon aria-hidden="true" size={18} />
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

function NoResults({
  query,
  onClear,
}: NoResultsProps) {
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
