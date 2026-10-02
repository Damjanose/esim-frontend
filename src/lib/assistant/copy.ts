/**
 * The assistant's English copy, keyed exactly like the app's `assistant.*` i18n
 * keys (velocity-eSim src/i18n/locales/en.json) so the reply logic ports over
 * unchanged. The website is English-only, so this is a flat map plus a tiny
 * `{{param}}` interpolation rather than i18next. Wording differs from the app
 * only where it names an app-only screen.
 */
const COPY: Record<string, string> = {
  "assistant.title": "eSim2you AI",
  "assistant.open": "Open AI assistant",
  "assistant.close": "Close",
  "assistant.placeholder": "Say hi or ask about your trip…",
  "assistant.inputLabel": "Message to the assistant",
  "assistant.send": "Send",
  "assistant.thinking": "Thinking…",
  "assistant.needsHuman":
    "I can only help with greetings and trip plans. For anything else, message our support team and a real person will help you.",
  "assistant.needsHumanGuest":
    "I can only help with greetings and trip plans. For anything else, sign in and message our support team so a real person can help you.",
  "assistant.reportProblem": "Contact support",
  "assistant.clear": "Clear conversation",

  "assistant.subtitle.marketplace": "Find and filter plans",
  "assistant.subtitle.esims": "Your eSIMs & next trips",
  "assistant.subtitle.profile": "Tips for your account",

  "assistant.greeting.marketplace":
    "Hello, I'm the eSim2you AI assistant 👋 Tell me where and how long you're travelling, and I'll filter the plans for you.",
  "assistant.greeting.marketplaceGuest":
    "Hello, I'm the eSim2you AI assistant 👋 I can help you find the right eSIM. Create a free account to buy plans, track your eSIMs and plan trips.",
  "assistant.greeting.esims":
    "Hello, I'm the eSim2you AI assistant 👋 Want to top up, or shall I suggest where to go next?",
  "assistant.greeting.esimsEmpty":
    "Hello, I'm the eSim2you AI assistant 👋 No eSIMs yet. Tell me where you're dreaming of going.",
  "assistant.greeting.profile": "Hello, I'm the eSim2you AI assistant 👋 Here are a few things I can help with.",
  "assistant.greeting.profileLive":
    "Hello, I'm the eSim2you AI assistant 👋 Your eSIM is ready. Let's plan your trip!",

  "assistant.error.rate_limited": "You're sending messages quickly. Try again in a few minutes.",
  "assistant.error.unavailable": "The assistant isn't available right now.",
  "assistant.error.failed": "Something went wrong. Please try again.",

  "assistant.suggest.signUp": "Create a free account",
  "assistant.suggest.marketplace.week": "Plan for a 7-day trip",
  "assistant.suggest.marketplace.unlimited": "Unlimited data plans",
  "assistant.suggest.marketplace.cheapest": "Cheapest plans for {{destination}}",
  "assistant.suggest.marketplace.howItWorks": "How does an eSIM work?",
  "assistant.suggest.esims.topUp": "Top up {{destination}}",
  "assistant.suggest.esims.planTrip": "Plan my trip to {{destination}}",
  "assistant.suggest.esims.nextAfter": "Where to go after {{destination}}?",
  "assistant.suggest.esims.nearby": "Places near {{destination}}",
  "assistant.suggest.esims.inspire": "Suggest a destination",
  "assistant.suggest.esims.browse": "Browse plans",
  "assistant.suggest.profile.planTrip": "Plan a trip with AI",
  "assistant.suggest.profile.planTripTo": "Plan my trip to {{destination}}",
  "assistant.suggest.profile.billing": "Add billing address",
  "assistant.suggest.profile.esims": "My eSIMs",
  "assistant.suggest.profile.support": "Contact support",

  "assistant.teaser.needPlan": "Need a plan? Ask me ✨",

  "assistant.local.showPlans": "Show plans",
  "assistant.local.filtered": "Got it! I've filtered the plans: {{summary}}.",
  "assistant.local.week": "A 7–10 day plan covers most week-long trips. Here are the cheapest ones first.",
  "assistant.local.unlimited":
    "Unlimited plans are perfect if you stream, video call or share your hotspot. Here they are.",
  "assistant.local.cheapest": "Here are the plans for {{destination}}, lowest price first.",
  "assistant.local.europe": "Europe plans cover many countries in one eSIM. Here they are, cheapest first.",
  "assistant.local.howItWorks":
    "An eSIM is a digital SIM built into your phone. Pick a plan, install it in a few taps and it connects when you land. No physical card, and your usual SIM stays in place.",
  "assistant.local.planTrip": "Let's plan your trip! I'll open the trip planner.",
  "assistant.local.planTripTo": "Let's plan your trip to {{destination}}!",
  "assistant.local.planTripAction": "Open trip planner",
  "assistant.local.topUp": "Sure, let's add more data to your {{destination}} eSIM.",
  "assistant.local.topUpAction": "Top up",
  "assistant.local.billing": "You can add or update your billing address here.",
  "assistant.local.billingAction": "Billing details",
  "assistant.local.signIn": "Create a free account to buy plans, track your eSIMs and plan trips.",
  "assistant.local.signInAction": "Create account",
  "assistant.local.myPlans": "Here are your eSIMs.",
  "assistant.local.myPlansAction": "My eSIMs",
  "assistant.local.browse": "Let's find your next plan.",
  "assistant.local.browseAction": "Browse plans",
  "assistant.local.settings": "Your account settings are on your profile.",
  "assistant.local.settingsAction": "Open profile",
  "assistant.local.support": "Our team replies in the support chat.",
  "assistant.local.supportAction": "Contact support",
  "assistant.local.part.days": "{{count}}+ days",
  "assistant.local.part.data": "{{count}} GB+",
  "assistant.local.part.unlimited": "Unlimited data",
  "assistant.local.part.cheapest": "Cheapest first",
  "assistant.local.part.mostData": "Most data first",
  "assistant.local.part.longest": "Longest first",
  "assistant.local.part.daysRange": "{{from}}–{{to}} days",
  "assistant.local.part.daysMax": "Up to {{count}} days",
  "assistant.local.part.dataMax": "Up to {{count}} GB",
  "assistant.local.part.priciest": "Highest price first",
  "assistant.local.clarify": "Do you want an eSIM package for {{destination}}, or help planning your trip?",
  "assistant.local.clarifyPlace":
    "{{place}} is in {{destination}}. Do you want an eSIM package, or help planning your trip?",
  "assistant.local.clarifyPackages": "eSIM packages",
  "assistant.local.clarifyTrip": "Plan a trip",
  "assistant.local.clarifyTripGuest": "Sign in to plan a trip",
  "assistant.local.filteredPlace": "{{place}} is in {{destination}}. I've filtered the plans: {{summary}}.",

  "assistant.faq.whatIsEsim":
    "An eSIM is a digital SIM card embedded in your phone. Instead of a physical card, you download a plan and it activates instantly. Your regular SIM stays in place, and you can switch between SIMs anytime.",
  "assistant.faq.howItWorks":
    "Here's how it works: 1) Pick a plan for your destination. 2) Install it on your phone in seconds (a QR code or direct install). 3) Activate it when you arrive. You're now connected! Switch back to your regular SIM anytime.",
  "assistant.faq.activationTime":
    "Most eSIMs activate instantly or within 5-15 minutes after installation. Depending on the provider, it might take up to a few hours. You'll see the status under My eSIMs.",
  "assistant.faq.multipleDevices":
    "Each eSIM plan is tied to one device. You can have multiple eSIMs on the same phone, but you can only use one at a time. If you need the same plan on another device, you'd need to purchase another plan.",
  "assistant.faq.benefits":
    "No need to find a local shop or swap physical SIM cards. eSIMs are instant, secure, and you can manage everything online. Plus, you keep your home number active at the same time. Perfect for travelers!",
  "assistant.faq.supportedCountries":
    "We support 200+ destinations worldwide across Africa, Americas, Asia-Pacific, Europe, and Middle East. Browse destinations to see if yours is covered. We're always adding more!",
  "assistant.faq.pricing":
    "Prices vary by destination and data amount. We offer competitive rates compared to roaming charges and local SIM cards. A 1GB plan might cost $5-15 depending on the country. Browse destinations for exact pricing.",
  "assistant.faq.removeEsim":
    "You can delete an eSIM anytime from your phone's settings. It works just like removing a regular eSIM profile. Unused plans expire after the validity period, and any unused data is lost (no refunds for partially used plans). You can track expiry under My eSIMs.",
  "assistant.faq.roaming":
    "eSIMs are perfect for travel! Once you land, activate your eSIM and you're instantly connected at local speeds. Your home SIM stays active in the background, so calls and texts still reach you. Just switch back when you go home.",
  "assistant.faq.physicalSim":
    "You keep your physical SIM in your phone alongside the eSIM. They work together. Your home number stays active while you're using the eSIM data, or use both if your phone supports dual SIM."
};

/** Looks up a key and fills `{{name}}` params. An unknown key comes back as-is, like i18next. */
export function t(key: string, params?: Record<string, string>): string {
  const template = COPY[key] ?? key;
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => params[name] ?? match);
}
