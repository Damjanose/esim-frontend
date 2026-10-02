import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { HeroPackageOption } from "@/services/packages";
import { t } from "./copy";
import {
  clarifyChoices,
  localReplyFor,
  matchFAQ,
  refineLocalReply,
  resolveClarifyFollowUp,
  timeoutFallbackReply
} from "./localReplies";
import {
  assistantActionHref,
  assistantScreenForPath,
  featuredDestinationForPath,
  filtersHref,
  isAssistantVisible,
  toAssistantDestinations
} from "./navigation";
import { buildAssistantSuggestions, matchScreenPreset, matchesPreset, outOfScopeReply } from "./suggestions";
import type { AssistantContext, AssistantDestination } from "./types";

const destinations: AssistantDestination[] = [
  { slug: "japan", label: "Japan" },
  { slug: "germany", label: "Germany" },
  { slug: "turkey", label: "Turkey" },
  { slug: "united-states", label: "United States" },
  { slug: "south-korea", label: "South Korea" },
  { slug: "europe", label: "Europe" }
];

const guest: AssistantContext = { screen: "marketplace", isGuest: true, featuredDestination: null };
const member: AssistantContext = { screen: "marketplace", isGuest: false, featuredDestination: "Japan" };
const esims: AssistantContext = {
  screen: "esims",
  orders: [{ id: 42, destination: "Japan", status: "active", createdAt: "2026-09-30T10:00:00Z" }]
};

describe("filtersHref", () => {
  it("maps a destination plus facets onto the wizard's /destinations params", () => {
    expect(filtersHref({ destination: "japan", durationFrom: 7, dataFrom: 5, sort: "price_asc" })).toBe(
      "/destinations?country=japan&daysMin=7&dataMin=5"
    );
  });

  it("turns the 999 GB sentinel into unlimited-only", () => {
    expect(filtersHref({ dataFrom: 999, includeUnlimited: true })).toBe("/destinations?dataMin=999&unlimited=true");
  });

  it("swaps a reversed range and drops negative values", () => {
    expect(filtersHref({ durationFrom: 10, durationTo: 7, dataFrom: -1 })).toBe("/destinations?daysMin=7&daysMax=10");
  });

  it("keeps fixed-data-only when the AI excludes unlimited", () => {
    expect(filtersHref({ dataFrom: 3, includeUnlimited: false })).toBe("/destinations?dataMin=3&unlimited=false");
  });

  it("is plain /destinations when nothing applies", () => {
    expect(filtersHref({ search: "beach", sort: "price_desc" })).toBe("/destinations");
  });
});

describe("assistantActionHref", () => {
  const where = { signedIn: true, currentPath: "/esim/japan" };

  it("routes every web-supported action", () => {
    expect(assistantActionHref({ type: "top_up", label: "", payload: { orderId: 42 } }, where)).toBe("/account/42#top-up");
    expect(assistantActionHref({ type: "plan_trip", label: "", payload: { destination: "South Korea" } }, where)).toBe(
      "/trip-plan?destination=South%20Korea"
    );
    expect(assistantActionHref({ type: "plan_trip", label: "" }, where)).toBe("/trip-plan");
    expect(assistantActionHref({ type: "open_billing", label: "" }, where)).toBe("/profile/billing");
    expect(assistantActionHref({ type: "open_esims", label: "" }, where)).toBe("/account");
    expect(assistantActionHref({ type: "sign_in", label: "" }, where)).toBe("/signin?next=%2Fesim%2Fjapan");
  });

  it("sends signed-in travelers to the support chat and guests to the support page", () => {
    expect(assistantActionHref({ type: "open_support", label: "" }, where)).toBe("/profile/support");
    expect(assistantActionHref({ type: "open_support", label: "" }, { ...where, signedIn: false })).toBe("/support");
  });

  it("has no target for app-only screens", () => {
    expect(assistantActionHref({ type: "redeem_gift", label: "" }, where)).toBeNull();
    expect(assistantActionHref({ type: "open_currency", label: "" }, where)).toBeNull();
    expect(assistantActionHref({ type: "leave_review", label: "" }, where)).toBeNull();
  });
});

describe("assistantScreenForPath / isAssistantVisible", () => {
  it("only gives signed-in travelers the esims and profile screens", () => {
    expect(assistantScreenForPath("/account/7", true)).toBe("esims");
    expect(assistantScreenForPath("/profile", true)).toBe("profile");
    expect(assistantScreenForPath("/account", false)).toBe("marketplace");
    expect(assistantScreenForPath("/", true)).toBe("marketplace");
  });

  it("stays off pages with their own bottom action or chat", () => {
    for (const path of ["/checkout", "/signin", "/profile/support", "/profile/deleted", "/trip-plan/abc"]) {
      expect(isAssistantVisible(path)).toBe(false);
    }
    for (const path of ["/", "/destinations", "/esim/japan", "/trip-plan", "/account", "/profile"]) {
      expect(isAssistantVisible(path)).toBe(true);
    }
  });
});

describe("local replies", () => {
  it("filters a destination with facets without calling the AI", () => {
    const reply = localReplyFor("Japan 7 days 5gb", member, destinations);
    expect(reply?.action).toEqual({
      type: "apply_filters",
      label: "",
      payload: { destination: "japan", durationFrom: 7, durationTo: undefined, dataFrom: 5, dataTo: undefined, includeUnlimited: undefined }
    });
  });

  it("asks packages-or-trip for a bare place and names a known city", () => {
    const reply = localReplyFor("istanbul", member, destinations);
    expect(reply?.clarify).toEqual({ destination: "turkey", place: "Istanbul" });
    expect(t(reply!.replyKey, reply!.replyParams)).toBe(
      "Istanbul is in Turkey. Do you want an eSIM package, or help planning your trip?"
    );
  });

  it("resolves the clarify answer and offers sign-in to guests for the trip planner", () => {
    const clarify = { destination: "turkey" };
    expect(resolveClarifyFollowUp("packages", clarify, member, destinations)?.action?.type).toBe("apply_filters");
    expect(resolveClarifyFollowUp("plan a trip", clarify, member, destinations)?.action).toEqual({
      type: "plan_trip",
      label: "",
      payload: { destination: "Turkey" }
    });
    expect(clarifyChoices(clarify, guest, destinations)[1].action.type).toBe("sign_in");
  });

  it("refines the previous filters and rebuilds the summary", () => {
    const reply = refineLocalReply(localReplyFor("unlimited", member, destinations)!, { destination: "germany" }, destinations);
    expect(reply.action?.type === "apply_filters" && reply.action.payload).toEqual({
      destination: "germany",
      dataFrom: 999,
      includeUnlimited: true
    });
    const summary = reply.summary!.map((part) => ("text" in part ? part.text : t(part.key, part.params))).join(" · ");
    expect(summary).toBe("Germany · Unlimited data");
  });

  it("matches a typo'd country", () => {
    expect(localReplyFor("germny esim", member, destinations)?.action).toMatchObject({ payload: { destination: "germany" } });
  });

  it("leaves open-ended questions to the AI", () => {
    expect(localReplyFor("where should I go after Japan?", member, destinations)).toBeNull();
  });

  it("offers top-up only with a live eSIM, and sign-in for guests asking to plan", () => {
    expect(localReplyFor("top up", esims, destinations)?.action).toEqual({ type: "top_up", label: "", payload: { orderId: 42 } });
    expect(localReplyFor("plan a trip to japan", guest, destinations)?.action?.type).toBe("sign_in");
  });

  it("answers FAQ and screen presets instantly", () => {
    expect(matchFAQ("what is esim")?.replyKey).toBe("assistant.faq.whatIsEsim");
    expect(matchScreenPreset("europe", member)?.action).toMatchObject({ payload: { destination: "europe" } });
    expect(matchScreenPreset("unlimied", member)?.replyKey).toBe("assistant.local.unlimited");
    expect(matchScreenPreset("myplans", guest)).toBeNull();
  });
});

describe("suggestions", () => {
  it("leads with sign-up for guests and the featured destination for members", () => {
    expect(buildAssistantSuggestions(guest)[0]).toMatchObject({ id: "signUp", primary: true });
    expect(buildAssistantSuggestions(member).map((suggestion) => suggestion.id)).toContain("cheapest");
  });

  it("offers top-up and a trip plan for a live eSIM", () => {
    expect(buildAssistantSuggestions(esims).slice(0, 2).map((suggestion) => suggestion.id)).toEqual(["topUp", "planTrip"]);
  });

  it("never offers app-only actions on the profile screen", () => {
    const profile: AssistantContext = { screen: "profile", orders: [], hasBillingAddress: false };
    const types = buildAssistantSuggestions(profile).map((suggestion) => suggestion.action?.type);
    expect(types).toEqual(["plan_trip", "open_billing", "open_esims", "open_support"]);
  });

  it("points out-of-scope guests to sign-in and members to support", () => {
    expect(outOfScopeReply(guest).action.type).toBe("sign_in");
    expect(outOfScopeReply(member).action.type).toBe("open_support");
  });

  it("has copy for every key the logic can produce", () => {
    const source = ["localReplies.ts", "suggestions.ts"]
      .map((file) => readFileSync(new URL(`./${file}`, import.meta.url), "utf8"))
      .join("\n");
    const keys = new Set(source.match(/assistant\.[a-zA-Z_.]+[a-zA-Z_]/g) ?? []);
    expect(keys.size).toBeGreaterThan(30);
    for (const key of keys) expect(t(key), key).not.toBe(key);
  });
});

describe("catalog helpers", () => {
  const pkg = (overrides: Partial<HeroPackageOption>): HeroPackageOption =>
    ({ country: "", countryCode: "", filters: ["local"], id: "", ...overrides }) as HeroPackageOption;

  it("lists local countries plus countries inside regional bundles, once each", () => {
    const list = toAssistantDestinations([
      pkg({ country: "Japan", countryCode: "japan" }),
      pkg({ country: "Japan", countryCode: "japan" }),
      pkg({
        country: "Europe",
        countryCode: "europe",
        filters: ["regional"],
        countries: [{ countryCode: "DE", title: "Germany" }]
      })
    ]);
    expect(list).toEqual([
      { slug: "europe", label: "Europe" },
      { slug: "germany", label: "Germany" },
      { slug: "japan", label: "Japan" }
    ]);
  });

  it("finds the featured destination for /esim pages, including aliased slugs", () => {
    expect(featuredDestinationForPath("/esim/japan", destinations)).toBe("Japan");
    expect(featuredDestinationForPath("/esim/usa", destinations)).toBe("United States");
    expect(featuredDestinationForPath("/destinations", destinations)).toBeNull();
  });
});

describe("smarter assistant (2026-10-02)", () => {
  it("answers real FAQ phrases but never swallows plan requests or small talk", () => {
    expect(matchFAQ("What is an eSIM?")?.replyKey).toBe("assistant.faq.whatIsEsim");
    expect(matchFAQ("what's an esim")?.replyKey).toBe("assistant.faq.whatIsEsim");
    expect(matchFAQ("do I need a physical sim card")?.replyKey).toBe("assistant.faq.physicalSim");
    for (const text of [
      "I want to travel to Japan",
      "how much is Turkey",
      "price for Germany 10GB",
      "which countries are in the Europe pass",
      "I want a refund",
      "hi how are you"
    ]) {
      expect(matchFAQ(text), text).toBeNull();
    }
  });

  it("matches presets only for a single-word message", () => {
    expect(matchesPreset("quick_europe", "Europe")).toBe(true);
    expect(matchesPreset("quick_europe", "eurpe")).toBe(true);
    expect(matchesPreset("quick_1week", "week")).toBe(true);
    expect(matchesPreset("quick_europe", "Europe 10gb")).toBe(false);
    expect(matchScreenPreset("Europe 10gb", member)).toBeNull();
  });

  it("falls back to plans for one named place when the AI times out", () => {
    const reply = timeoutFallbackReply("why should I pick a 10 days plan when I go to japan in april", destinations);
    expect(reply?.action).toMatchObject({ type: "apply_filters", payload: { destination: "japan", durationFrom: 10 } });
    expect(timeoutFallbackReply("hi how are you", destinations)).toBeNull();
    expect(timeoutFallbackReply("japan or germany", destinations)).toBeNull();
  });

  it("chat parses places before the FAQ, sends shown filters and can stop", () => {
    const chat = readFileSync("src/app/components/assistant/AssistantChat.tsx", "utf8");
    expect(chat.indexOf("local = localReplyFor(text")).toBeLessThan(chat.indexOf("local = matchFAQ(text)"));
    expect(chat).toContain('action.type === "apply_filters" ? { type: action.type, payload: action.payload }');
    expect(chat).toContain('t("assistant.stop")');
    expect(chat).toContain("inFlight.current?.abort()");
    expect((chat.match(/if \(!isCurrent\(\)/g) ?? []).length).toBeGreaterThanOrEqual(3);
    // Older iOS Safari has no AbortSignal.any.
    expect(chat).not.toContain("AbortSignal.any");
    expect(t("assistant.stop")).toBe("Stop");
    expect(t("assistant.error.timeout")).not.toBe("assistant.error.timeout");
  });

  it("BFF passes the backend error code through so a timeout is recognised", () => {
    const route = readFileSync("src/app/bff/assistant/chat/route.ts", "utf8");
    expect(route).toContain("codeOf(result)");
    expect(route).toContain("codeOf(guest)");
  });
});
