/**
 * Web twin of the app's AI assistant (velocity-eSim src/services/assistant.ts and
 * src/components/AssistantBubble). The backend contract is shared: `POST
 * /assistant/chat` with one of the app's three screens, reached through
 * /bff/assistant/chat.
 */

/** Mirrors the backend's `AssistantScreen`. Guests may only use `marketplace`. */
export type AssistantScreen = "marketplace" | "esims" | "profile";

export type AssistantFilterPayload = {
  destination?: string;
  search?: string;
  durationFrom?: number;
  durationTo?: number;
  dataFrom?: number;
  dataTo?: number;
  priceFrom?: number;
  priceTo?: number;
  includeUnlimited?: boolean;
  sort?: "recommended" | "price_asc" | "price_desc" | "data_desc" | "duration_desc";
};

/**
 * Everything a chat button can do. The app also has gift, currency and review
 * screens; the website has none, so those action types are never built here and
 * `assistantActionHref` drops them if the backend ever sends one.
 */
export type AssistantAction =
  | { type: "apply_filters"; label: string; payload: AssistantFilterPayload }
  | { type: "open_country"; label: string; payload: { slug: string } }
  | { type: "plan_trip"; label: string; payload?: { destination?: string } }
  | { type: "top_up"; label: string; payload: { orderId: number } }
  | {
      type:
        | "open_billing"
        | "redeem_gift"
        | "open_currency"
        | "leave_review"
        | "open_marketplace"
        | "open_support"
        | "open_esims"
        | "open_profile_settings"
        | "sign_in";
      label: string;
    };

export type AssistantChatMessage = { role: "user" | "assistant"; content: string };

export type AssistantReply = {
  reply: string;
  outOfScope: boolean;
  action: AssistantAction | null;
  /** Set when the AI asks "eSIM packages or a trip plan?" about a catalog slug. */
  clarify?: { destination: string } | null;
};

export type AssistantErrorKind = "rate_limited" | "unavailable" | "failed";

/** A catalog destination the chat can filter by. `slug` is the backend country/region code. */
export type AssistantDestination = { slug: string; label: string };

/** A pending "packages or trip plan?" question. `destination` is a catalog slug. */
export type AssistantClarify = { destination: string; place?: string };

export type AssistantOrderSummary = {
  id: number;
  destination: string | null;
  status: "ready" | "active" | "expired";
  createdAt: string;
};

export type AssistantContext =
  | { screen: "marketplace"; isGuest: boolean; featuredDestination: string | null }
  | { screen: "esims"; orders: AssistantOrderSummary[] }
  | {
      screen: "profile";
      orders: AssistantOrderSummary[];
      /** null while still loading; the chip only shows once we know it's missing. */
      hasBillingAddress: boolean | null;
    };

export type TranscriptEntry =
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "assistant";
      text: string;
      action: AssistantAction | null;
      clarify?: AssistantClarify;
    }
  | { id: string; role: "error"; text: string; action: AssistantAction | null };
