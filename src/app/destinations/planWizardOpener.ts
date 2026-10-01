/**
 * Lets any client island ask the page's single Help Me Choose wizard to open.
 *
 * DestinationBrowse owns the wizard (state + the one <HelpMeChooseWizard>)
 * and subscribes; the homepage hero's tune button dispatches. A window event
 * rather than a React context because the hero is a server-rendered section
 * and DestinationBrowse is rendered separately in page.tsx: there is no
 * shared client parent for a provider, and lifting the wizard state out of
 * DestinationBrowse would also touch /destinations.
 *
 * Requests are never queued: with no listener mounted, a request is a no-op,
 * so a DestinationBrowse that mounts later can't pop the wizard by surprise.
 */
export const OPEN_PLAN_WIZARD_EVENT = "esim2you:open-plan-wizard";

/** Call from an event handler only (never during render: `window` is client-only). */
export function requestPlanWizard(target: EventTarget = window): void {
  target.dispatchEvent(new Event(OPEN_PLAN_WIZARD_EVENT));
}

/** Subscribe from an effect; the returned function is the effect cleanup. */
export function onPlanWizardRequest(
  handler: () => void,
  target: EventTarget = window,
): () => void {
  const listener = () => handler();
  target.addEventListener(OPEN_PLAN_WIZARD_EVENT, listener);
  return () => target.removeEventListener(OPEN_PLAN_WIZARD_EVENT, listener);
}
