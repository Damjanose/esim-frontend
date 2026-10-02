import { fuzzyMatch, latestLiveOrder, latestOrders, marketplaceSuggestionReplies, type LocalReply } from "./localReplies";
import type { AssistantAction, AssistantContext } from "./types";

/**
 * Starter chips the chat opens with (the app's assistantSuggestions.ts). A chip
 * is a direct action (runs immediately), a canned `reply` (no AI round-trip), or
 * a prompt whose label is sent to the AI as if the user typed it. The app's
 * gift, currency and review chips are left out: the website has no such pages.
 */
export type AssistantSuggestion = {
  id: string;
  labelKey: string;
  labelParams?: Record<string, string>;
  primary?: boolean;
  action?: AssistantAction;
  reply?: LocalReply;
};

function marketplaceSuggestions(context: Extract<AssistantContext, { screen: "marketplace" }>): AssistantSuggestion[] {
  const suggestions: AssistantSuggestion[] = [
    { id: "week", labelKey: "assistant.suggest.marketplace.week", reply: marketplaceSuggestionReplies.week },
    {
      id: "unlimited",
      labelKey: "assistant.suggest.marketplace.unlimited",
      reply: marketplaceSuggestionReplies.unlimited
    }
  ];
  if (context.featuredDestination) {
    suggestions.push({
      id: "cheapest",
      labelKey: "assistant.suggest.marketplace.cheapest",
      labelParams: { destination: context.featuredDestination },
      reply: marketplaceSuggestionReplies.cheapest(context.featuredDestination)
    });
  }
  suggestions.push({
    id: "howItWorks",
    labelKey: "assistant.suggest.marketplace.howItWorks",
    reply: marketplaceSuggestionReplies.howItWorks
  });
  if (context.isGuest) {
    suggestions.unshift({
      id: "signUp",
      labelKey: "assistant.suggest.signUp",
      primary: true,
      action: { type: "sign_in", label: "" }
    });
  }
  return suggestions;
}

function esimsSuggestions(context: Extract<AssistantContext, { screen: "esims" }>): AssistantSuggestion[] {
  const live = latestLiveOrder(context.orders);
  const lastDestination = latestOrders(context.orders).find((order) => order.destination)?.destination ?? null;
  const suggestions: AssistantSuggestion[] = [];

  if (live?.destination) {
    suggestions.push(
      {
        id: "topUp",
        labelKey: "assistant.suggest.esims.topUp",
        labelParams: { destination: live.destination },
        action: { type: "top_up", label: "", payload: { orderId: live.id } }
      },
      {
        id: "planTrip",
        labelKey: "assistant.suggest.esims.planTrip",
        labelParams: { destination: live.destination },
        primary: true,
        action: { type: "plan_trip", label: "", payload: { destination: live.destination } }
      }
    );
  }
  if (lastDestination) {
    suggestions.push(
      { id: "nextAfter", labelKey: "assistant.suggest.esims.nextAfter", labelParams: { destination: lastDestination } },
      { id: "nearby", labelKey: "assistant.suggest.esims.nearby", labelParams: { destination: lastDestination } }
    );
  } else {
    suggestions.push(
      { id: "inspire", labelKey: "assistant.suggest.esims.inspire" },
      { id: "browse", labelKey: "assistant.suggest.esims.browse", action: { type: "open_marketplace", label: "" } }
    );
  }
  return suggestions;
}

function profileSuggestions(context: Extract<AssistantContext, { screen: "profile" }>): AssistantSuggestion[] {
  const live = latestLiveOrder(context.orders);
  const suggestions: AssistantSuggestion[] = [
    live?.destination
      ? {
          id: "planTrip",
          labelKey: "assistant.suggest.profile.planTripTo",
          labelParams: { destination: live.destination },
          primary: true,
          action: { type: "plan_trip", label: "", payload: { destination: live.destination } }
        }
      : { id: "planTrip", labelKey: "assistant.suggest.profile.planTrip", primary: true, action: { type: "plan_trip", label: "" } }
  ];
  if (context.hasBillingAddress === false) {
    suggestions.push({
      id: "billing",
      labelKey: "assistant.suggest.profile.billing",
      action: { type: "open_billing", label: "" }
    });
  }
  suggestions.push(
    { id: "esims", labelKey: "assistant.suggest.profile.esims", action: { type: "open_esims", label: "" } },
    { id: "support", labelKey: "assistant.suggest.profile.support", action: { type: "open_support", label: "" } }
  );
  return suggestions;
}

export function buildAssistantSuggestions(context: AssistantContext): AssistantSuggestion[] {
  switch (context.screen) {
    case "marketplace":
      return marketplaceSuggestions(context);
    case "esims":
      return esimsSuggestions(context);
    case "profile":
      return profileSuggestions(context);
  }
}

export function greetingKeyFor(context: AssistantContext): string {
  if (context.screen === "marketplace") {
    return context.isGuest ? "assistant.greeting.marketplaceGuest" : "assistant.greeting.marketplace";
  }
  if (context.screen === "esims") {
    return context.orders.length > 0 ? "assistant.greeting.esims" : "assistant.greeting.esimsEmpty";
  }
  return latestLiveOrder(context.orders) ? "assistant.greeting.profileLive" : "assistant.greeting.profile";
}

// ---------------------------------------------------------------------------
// Screen presets (the app's screenPresets.ts): short typed words like "week",
// "unlimited" or "europe" that get an instant canned reply.

type ScreenPreset = { id: string; reply: LocalReply };

function screenPresets(context: AssistantContext): ScreenPreset[] {
  switch (context.screen) {
    case "marketplace": {
      const presets: ScreenPreset[] = [
        { id: "quick_1week", reply: marketplaceSuggestionReplies.week },
        { id: "quick_unlimited", reply: marketplaceSuggestionReplies.unlimited }
      ];
      if (context.featuredDestination) {
        presets.push({ id: "quick_cheapest", reply: marketplaceSuggestionReplies.cheapest(context.featuredDestination) });
      }
      presets.push({ id: "quick_europe", reply: marketplaceSuggestionReplies.europe });
      if (!context.isGuest) {
        presets.push({
          id: "quick_myPlans",
          reply: {
            replyKey: "assistant.local.myPlans",
            action: { type: "open_esims", label: "" },
            actionLabelKey: "assistant.local.myPlansAction"
          }
        });
      }
      return presets;
    }
    case "esims": {
      const presets: ScreenPreset[] = [];
      const live = context.orders.find((order) => order.status === "active");
      if (live?.destination) {
        presets.push({
          id: "quick_topup",
          reply: {
            replyKey: "assistant.local.topUp",
            replyParams: { destination: live.destination },
            action: { type: "top_up", label: "", payload: { orderId: live.id } },
            actionLabelKey: "assistant.local.topUpAction"
          }
        });
      }
      presets.push({
        id: "quick_browse",
        reply: {
          replyKey: "assistant.local.browse",
          action: { type: "open_marketplace", label: "" },
          actionLabelKey: "assistant.local.browseAction"
        }
      });
      return presets;
    }
    case "profile":
      return [
        {
          id: "quick_settings",
          reply: {
            replyKey: "assistant.local.settings",
            action: { type: "open_profile_settings", label: "" },
            actionLabelKey: "assistant.local.settingsAction"
          }
        },
        {
          id: "quick_support",
          reply: {
            replyKey: "assistant.local.support",
            action: { type: "open_support", label: "" },
            actionLabelKey: "assistant.local.supportAction"
          }
        }
      ];
  }
}

/** "quick_1week" matches "1week", "week", "week-long" and single-word typos like "unlimied". */
function matchesPreset(presetId: string, userMessage: string): boolean {
  const normalized = userMessage.toLowerCase().trim();
  const suffix = presetId.replace(/^quick_/, "");
  if (normalized === suffix) return true;
  if (normalized.startsWith(suffix)) {
    const nextChar = normalized[suffix.length];
    if (!nextChar || /[\s-]/.test(nextChar)) return true;
  }
  const numericStripped = suffix.replace(/^\d+/, "");
  if (numericStripped && normalized === numericStripped) return true;
  if (!normalized.includes(" ") && normalized.length > 2) {
    if (fuzzyMatch(normalized, suffix) >= 0.75) return true;
    if (numericStripped && fuzzyMatch(normalized, numericStripped) >= 0.75) return true;
  }
  return false;
}

export function matchScreenPreset(text: string, context: AssistantContext): LocalReply | null {
  return screenPresets(context).find((preset) => matchesPreset(preset.id, text))?.reply ?? null;
}

/**
 * The AI only greets and helps plan trips. Anything else comes back as
 * `outOfScope`, and the chat points to a real person: the support chat when
 * signed in, sign-in first for guests (support needs an account).
 */
export function outOfScopeReply(context: AssistantContext): { textKey: string; action: AssistantAction; actionLabelKey: string } {
  if (context.screen === "marketplace" && context.isGuest) {
    return {
      textKey: "assistant.needsHumanGuest",
      action: { type: "sign_in", label: "" },
      actionLabelKey: "assistant.local.signInAction"
    };
  }
  return {
    textKey: "assistant.needsHuman",
    action: { type: "open_support", label: "" },
    actionLabelKey: "assistant.reportProblem"
  };
}
