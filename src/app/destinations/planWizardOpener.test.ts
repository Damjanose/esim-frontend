import { describe, expect, it, vi } from "vitest";
import {
  OPEN_PLAN_WIZARD_EVENT,
  onPlanWizardRequest,
  requestPlanWizard,
} from "./planWizardOpener";

describe("planWizardOpener", () => {
  it("uses one namespaced event name", () => {
    expect(OPEN_PLAN_WIZARD_EVENT).toBe("esim2you:open-plan-wizard");
  });

  it("delivers a request to a subscribed listener", () => {
    const target = new EventTarget();
    const handler = vi.fn();

    onPlanWizardRequest(handler, target);
    requestPlanWizard(target);

    expect(handler).toHaveBeenCalledTimes(1);
    // The handler gets no DOM event, so callers can't come to depend on one.
    expect(handler).toHaveBeenCalledWith();
  });

  it("stops delivering after the returned cleanup runs (effect unmount)", () => {
    const target = new EventTarget();
    const handler = vi.fn();

    const unsubscribe = onPlanWizardRequest(handler, target);
    unsubscribe();
    requestPlanWizard(target);

    expect(handler).not.toHaveBeenCalled();
  });

  it("is a no-op with no listener and never queues for a later subscriber", () => {
    const target = new EventTarget();

    expect(() => requestPlanWizard(target)).not.toThrow();

    const handler = vi.fn();
    onPlanWizardRequest(handler, target);

    expect(handler).not.toHaveBeenCalled();
  });
});
