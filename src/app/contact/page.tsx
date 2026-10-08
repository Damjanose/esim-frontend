import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Facebook, Handshake, Instagram, LifeBuoy, Mail, MessageCircle } from "lucide-react";
import { JsonLd } from "../JsonLd";
import { Navbar } from "../components/Navbar";
import {
  CONTENT_CARD,
  CONTENT_GUTTER,
  CONTENT_H1,
  CONTENT_ICON_TILE,
  CONTENT_TEXT_LINK,
  CONTENT_TOP
} from "../components/contentClasses";
import { SiteFooter } from "../SiteFooter";
import { crawlRel } from "@/lib/robots-policy";
import { createMetadata, createWebPageJsonLd, socialLinks, supportEmail } from "@/lib/seo";

const title = "Contact eSIM2you | Support Email and Chat";
const description =
  "Contact eSIM2you by email or in-app chat for help with eSIM setup, orders, top-ups and refunds, or to partner with us.";

export const metadata: Metadata = createMetadata({ path: "/contact", title, description });

export default function ContactPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <JsonLd
        data={createWebPageJsonLd({
          path: "/contact",
          name: "Contact eSIM2you",
          description,
          breadcrumbName: "Contact",
          pageType: "ContactPage"
        })}
      />
      <Navbar />
      <section className={`pb-16 md:pb-24 ${CONTENT_GUTTER} ${CONTENT_TOP}`}>
        <div className="mx-auto max-w-5xl">
          <h1 className={`max-w-4xl ${CONTENT_H1}`}>Contact eSIM2you</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-onSurfaceVariant sm:text-lg sm:leading-8">
            Need help with an eSIM2you plan, or want to work with us? Pick the fastest way to reach the
            eSIM2you team.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <section className={`flex gap-4 ${CONTENT_CARD}`}>
              <span className={CONTENT_ICON_TILE}>
                <Mail aria-hidden="true" size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-headline-md font-black text-brandInk">Email</h2>
                <p className="mt-2 text-body-md text-onSurfaceVariant">
                  For orders, refunds and anything else. Include your order email so we can find it.
                </p>
                <a className={`break-all ${CONTENT_TEXT_LINK}`} href={`mailto:${supportEmail}`}>
                  {supportEmail}
                </a>
              </div>
            </section>

            <section className={`flex gap-4 ${CONTENT_CARD}`}>
              <span className={CONTENT_ICON_TILE}>
                <MessageCircle aria-hidden="true" size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-headline-md font-black text-brandInk">Chat with us</h2>
                <p className="mt-2 text-body-md text-onSurfaceVariant">
                  Signed-in travelers can chat with the eSIM2you team and send screenshots, in the app or
                  from their profile.
                </p>
                <Link className={CONTENT_TEXT_LINK} href="/profile/support" rel={crawlRel("/profile/support")}>
                  Open support chat
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </div>
            </section>

            <section className={`flex gap-4 ${CONTENT_CARD}`}>
              <span className={CONTENT_ICON_TILE}>
                <LifeBuoy aria-hidden="true" size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-headline-md font-black text-brandInk">Support center</h2>
                <p className="mt-2 text-body-md text-onSurfaceVariant">
                  Setup steps, connection fixes, top-ups and refund rules, answered right away.
                </p>
                <Link className={CONTENT_TEXT_LINK} href="/support">
                  eSIM2you support center
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </div>
            </section>

            <section className={`flex gap-4 ${CONTENT_CARD}`}>
              <span className={CONTENT_ICON_TILE}>
                <Handshake aria-hidden="true" size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-headline-md font-black text-brandInk">Partners and press</h2>
                <p className="mt-2 text-body-md text-onSurfaceVariant">
                  Travel creators, blogs and agencies can earn with an eSIM2you promo code. Press can email
                  us directly.
                </p>
                <Link className={CONTENT_TEXT_LINK} href="/partners/request" rel={crawlRel("/partners/request")}>
                  Partner with eSIM2you
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </div>
            </section>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-body-md font-bold text-brandInk">Follow eSIM2you</span>
            <a className={CONTENT_TEXT_LINK} href={socialLinks.instagram} rel="me noopener noreferrer" target="_blank">
              <Instagram aria-hidden="true" size={18} />
              Instagram
            </a>
            <a className={CONTENT_TEXT_LINK} href={socialLinks.facebook} rel="me noopener noreferrer" target="_blank">
              <Facebook aria-hidden="true" size={18} />
              Facebook
            </a>
          </div>

          <p className="mt-10 text-body-md text-onSurfaceVariant">
            Learn more{" "}
            <Link className="font-bold text-brandBlue" href="/about">
              about eSIM2you
            </Link>{" "}
            or browse{" "}
            <Link className="font-bold text-brandBlue" href="/destinations">
              eSIM2you destinations
            </Link>
            .
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
